#!/usr/bin/env bash
#
# ClassroomIO self-host lifecycle manager.
#
# Run with no arguments for an interactive menu, or pass a subcommand directly:
#
#   ./classroomio.sh                 # interactive menu
#   ./classroomio.sh install         # first-time setup: fetch files, create .env, start
#   ./classroomio.sh start           # non-interactive start (env auto-setup + up -d)
#   ./classroomio.sh stop|restart|upgrade|logs|backup
#
# The script is standalone: run it in an empty directory and `install` downloads
# docker-compose.images.yaml + .env.example from GitHub. Inside a repo checkout it
# uses the local files. It never overwrites an existing .env or compose file.
#
# The compose file tracks `main` (the stack topology); CIO_VERSION in .env pins the
# app images. Pin an exact release (e.g. 1.4.2) in production.

set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="classroomio"
ENV_FILE="${ROOT_DIR}/.env"
ENV_EXAMPLE_FILE="${ROOT_DIR}/.env.example"
BUILD_COMPOSE_FILE="${ROOT_DIR}/docker-compose.yaml"
IMAGES_COMPOSE_FILE="${ROOT_DIR}/docker-compose.images.yaml"
RAW_BASE_URL="https://raw.githubusercontent.com/classroomio/classroomio/main"

# Default to PULLING pre-built images (fast). Pass --build to build from source.
USE_IMAGES=true
COMPOSE_FILE="${IMAGES_COMPOSE_FILE}"
# --profile flags live in ONE variable so every command (start, stop, logs, backup)
# sees the same profile state. --no-minio empties it.
PROFILE_ARGS="--profile minio"

print_usage() {
  cat <<'USAGE'
Usage: ./classroomio.sh [options] [command] [args]

Commands:
  install     First-time setup: fetch compose file + .env.example (if missing),
              create .env, generate secrets, pull images and start the stack.
  start       Start the stack (auto-generates missing secrets first).
  stop        Stop all containers (data volumes are kept).
  restart     Restart all containers.
  upgrade     Back up first, then pull newer images and restart.
  logs [svc]  Follow logs (all services, or one: api, dashboard, jobs, postgres, ...).
  backup      Dump Postgres and archive the MinIO volume into ./backups/.

Run without a command to get an interactive menu.

Options:
  --build     Use docker-compose.yaml and build images from source instead of pulling.
  --no-minio  Exclude the bundled MinIO (requires external S3-compatible storage).
  -h, --help  Show this help message.
USAGE
}

# ──────────────────────────────────────────────
# Compose CLI detection: `docker compose` (v2) or legacy `docker-compose`.
# ──────────────────────────────────────────────

COMPOSE_CMD=""

detect_compose() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "Error: docker is not installed or not on PATH."
    exit 1
  fi
  if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
  elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
  else
    echo "Error: neither 'docker compose' nor 'docker-compose' is available."
    exit 1
  fi
}

# All compose invocations go through this so the env file, project name, compose
# file, and profiles are consistent everywhere. Word-splitting of COMPOSE_CMD and
# PROFILE_ARGS is intentional.
compose() {
  # shellcheck disable=SC2086
  ${COMPOSE_CMD} --env-file "${ENV_FILE}" -p "${PROJECT_NAME}" -f "${COMPOSE_FILE}" ${PROFILE_ARGS} "$@"
}

# ──────────────────────────────────────────────
# .env helpers
# ──────────────────────────────────────────────

get_env_value() {
  local key="$1"
  local line
  line="$(grep -E "^${key}=" "${ENV_FILE}" | tail -n 1 || true)"
  printf '%s' "${line#*=}"
}

upsert_env_value() {
  local key="$1"
  local value="$2"
  local tmp_file

  tmp_file="$(mktemp)"
  awk -v key="${key}" -v value="${value}" '
    BEGIN { updated = 0 }
    $0 ~ ("^" key "=") {
      if (updated == 0) {
        print key "=" value;
        updated = 1;
      }
      next;
    }
    { print }
    END {
      if (updated == 0) {
        print key "=" value;
      }
    }
  ' "${ENV_FILE}" > "${tmp_file}"

  mv "${tmp_file}" "${ENV_FILE}"
}

is_insecure_token_value() {
  local value="$1"
  local normalized

  normalized="$(printf '%s' "${value}" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"

  if [[ "${normalized}" =~ ^\"(.*)\"$ ]]; then
    normalized="${BASH_REMATCH[1]}"
  elif [[ "${normalized}" =~ ^\'(.*)\'$ ]]; then
    normalized="${BASH_REMATCH[1]}"
  fi

  case "${normalized}" in
    "" | "replace-with-a-long-random-token" | "local-dev-api-key" | "changeme" | "replace-me")
      return 0
      ;;
    replace-with-* | *local-dev* | *change-this* | *your-*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

generate_secure_token() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32
    return
  fi

  if command -v node >/dev/null 2>&1; then
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    return
  fi

  if command -v python3 >/dev/null 2>&1; then
    python3 -c "import secrets; print(secrets.token_hex(32))"
    return
  fi

  date +%s%N | shasum | awk '{ print $1 }'
}

ensure_secure_auth_tokens() {
  if [[ ! -f "${ENV_FILE}" ]]; then
    touch "${ENV_FILE}"
  fi

  local private_server_key
  private_server_key="$(get_env_value PRIVATE_SERVER_KEY)"

  # PRIVATE_SERVER_KEY authenticates the dashboard's server-side calls to the API and must be
  # identical in both services. Generate a strong value when it's empty or a known placeholder.
  if is_insecure_token_value "${private_server_key}"; then
    upsert_env_value PRIVATE_SERVER_KEY "$(generate_secure_token)"
    echo "Generated secure PRIVATE_SERVER_KEY in .env"
  fi
}

ensure_secure_betterauth_secret() {
  if [[ ! -f "${ENV_FILE}" ]]; then
    touch "${ENV_FILE}"
  fi

  local secret
  secret="$(get_env_value BETTER_AUTH_SECRET)"

  # Only (re)generate when the value is empty or a known placeholder; never clobber
  # a strong secret the user has set themselves.
  if is_insecure_token_value "${secret}"; then
    upsert_env_value BETTER_AUTH_SECRET "$(generate_secure_token)"
    echo "Generated secure BETTER_AUTH_SECRET in .env"
  fi
}

is_local_origin() {
  local value="$1"
  case "${value}" in
    "" | *localhost* | *127.0.0.1* | *0.0.0.0*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

# Point browser-facing storage URLs at the public domain when DASHBOARD_ORIGIN is not
# localhost. MinIO media is served on :9000 — operators must reverse-proxy /media to it.
# We only override values that are still empty/localhost so explicit S3/R2 config is kept.
derive_public_storage_urls() {
  local dashboard_origin public_endpoint media_base
  dashboard_origin="$(get_env_value DASHBOARD_ORIGIN)"
  public_endpoint="$(get_env_value OBJECT_STORAGE_PUBLIC_ENDPOINT)"
  media_base="$(get_env_value OBJECT_STORAGE_MEDIA_PUBLIC_BASE_URL)"

  if ! is_local_origin "${dashboard_origin}"; then
    local origin="${dashboard_origin%/}"
    # Public media is served from the public-download `media` bucket, so deriving its base
    # URL from the domain is what fixes broken media links in served pages. We deliberately
    # do NOT touch OBJECT_STORAGE_PUBLIC_ENDPOINT (the S3 API endpoint) — pointing it at the
    # dashboard origin would break presigned URLs for the non-public videos/documents buckets.
    if is_local_origin "${media_base}"; then
      upsert_env_value OBJECT_STORAGE_MEDIA_PUBLIC_BASE_URL "${origin}/media"
    fi
    echo "Derived OBJECT_STORAGE_MEDIA_PUBLIC_BASE_URL from DASHBOARD_ORIGIN (${origin}/media)."
    echo "  -> Ensure your reverse proxy routes ${origin}/media to MinIO (port 9000)."
    echo "  -> For presigned access to the videos/documents buckets behind a domain, expose"
    echo "     MinIO's S3 API on its own route and set OBJECT_STORAGE_PUBLIC_ENDPOINT explicitly."
  else
    # Local demo: ensure localhost defaults are present.
    if [[ -z "${public_endpoint}" ]]; then
      upsert_env_value OBJECT_STORAGE_PUBLIC_ENDPOINT "http://localhost:9000"
    fi
    if [[ -z "${media_base}" ]]; then
      upsert_env_value OBJECT_STORAGE_MEDIA_PUBLIC_BASE_URL "http://localhost:9000/media"
    fi
  fi
}

ensure_minio_env() {
  if [[ ! -f "${ENV_FILE}" ]]; then
    touch "${ENV_FILE}"
  fi

  local minio_password
  minio_password="$(get_env_value MINIO_ROOT_PASSWORD)"

  # First provision: randomize credentials whenever the MinIO password is still empty or the
  # well-known `minioadmin` placeholder shipped in .env.example. (Previously this gated on
  # OBJECT_STORAGE_ENDPOINT being empty, but .env.example ships it non-empty — so on a normal
  # copy-the-example first run the randomization was always skipped and minioadmin/minioadmin
  # survived.) MinIO uses its root credentials as the S3 access key / secret.
  if [[ -z "${minio_password}" || "${minio_password}" =~ ^[[:space:]]*$ || "${minio_password}" == "minioadmin" ]]; then
    local minio_user
    minio_user="cio-$(generate_secure_token | cut -c1-16)"
    minio_password="$(generate_secure_token)"

    upsert_env_value MINIO_ROOT_USER "${minio_user}"
    upsert_env_value MINIO_ROOT_PASSWORD "${minio_password}"
    upsert_env_value OBJECT_STORAGE_ENDPOINT "http://minio:9000"
    upsert_env_value OBJECT_STORAGE_ACCESS_KEY_ID "${minio_user}"
    upsert_env_value OBJECT_STORAGE_SECRET_ACCESS_KEY "${minio_password}"
    upsert_env_value OBJECT_STORAGE_FORCE_PATH_STYLE "true"
    echo "Provisioned MinIO with randomized credentials in .env"
  fi

  derive_public_storage_urls
}

# ──────────────────────────────────────────────
# Shared checks
# ──────────────────────────────────────────────

# When MinIO is excluded the user must supply external object storage, or uploads/media
# silently break. Fail fast instead. The endpoint must be set AND not still point at the
# bundled MinIO host (which won't be running with --no-minio).
ensure_storage_env() {
  if [[ "${PROFILE_ARGS}" == *"minio"* ]]; then
    ensure_minio_env
  else
    local external_endpoint
    external_endpoint="$(get_env_value OBJECT_STORAGE_ENDPOINT)"
    if [[ -z "${external_endpoint}" || "${external_endpoint}" == *"minio:9000"* ]]; then
      echo "Error: --no-minio was passed but no external object storage is configured."
      echo "OBJECT_STORAGE_ENDPOINT is unset or still points at the bundled MinIO (minio:9000)."
      echo "Configure an external S3-compatible store via OBJECT_STORAGE_* in .env,"
      echo "or drop --no-minio to use the bundled MinIO."
      exit 1
    fi
    derive_public_storage_urls
  fi
}

warn_if_unpinned_version() {
  local version
  version="$(get_env_value CIO_VERSION)"
  if [[ -z "${version}" || "${version}" == "latest" ]]; then
    echo
    echo "WARNING: CIO_VERSION is '${version:-unset}' — you are tracking the rolling 'latest' tag."
    echo "  'latest' moves on every merge to main and may include unreleased code."
    echo "  For production, pin an exact release in .env, e.g.:  CIO_VERSION=1.4.2"
    echo "  Available tags: https://hub.docker.com/r/classroomio/api/tags"
    echo
  fi
}

# `docker compose up -d` returns once containers are *started*, not *healthy*. On a fresh
# deployment the API runs DB migrations before it listens, so the endpoints aren't reachable
# immediately. Poll with a retry instead of a single curl — and never let a not-yet-ready
# check abort the script (set -euo pipefail is active), so first runs end cleanly.
check_endpoint() {
  local name="$1" url="$2" curl_flags="$3" attempts="$4"
  local i=0
  while ((i < attempts)); do
    if curl ${curl_flags} --max-time 5 "${url}" >/dev/null 2>&1; then
      echo "${name} is reachable on ${url}"
      return 0
    fi
    i=$((i + 1))
    sleep 5
  done
  echo "Note: ${name} is not reachable yet at ${url} (waited $((attempts * 5))s)."
  echo "  It may still be starting — the first run migrates the database. Follow logs with:"
  echo "  ./classroomio.sh logs"
  return 0
}

wait_for_endpoints() {
  if command -v curl >/dev/null 2>&1; then
    echo
    echo "Waiting for services to come up (first run can take a minute while the API migrates)..."
    check_endpoint "API" "http://localhost:3081/" "-fsS" 24
    check_endpoint "Dashboard" "http://localhost:3082/" "-fsSI" 12
  else
    echo
    echo "curl not found, skipped endpoint checks."
  fi
}

fetch_if_missing() {
  local file="$1" url="$2"
  if [[ -f "${file}" ]]; then
    echo "Keeping existing $(basename "${file}") (not overwritten)."
    return 0
  fi
  echo "Downloading $(basename "${file}")..."
  # Download to a temp name and move into place so a failed transfer can never
  # leave a partial file that a re-run would mistake for a kept local copy.
  local tmp="${file}.download"
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL --retry 3 --retry-delay 2 -o "${tmp}" "${url}" || { rm -f "${tmp}"; echo "Error: failed to download ${url}"; exit 1; }
  elif command -v wget >/dev/null 2>&1; then
    wget -q -O "${tmp}" "${url}" || { rm -f "${tmp}"; echo "Error: failed to download ${url}"; exit 1; }
  else
    echo "Error: need curl or wget to download $(basename "${file}")."
    exit 1
  fi
  mv "${tmp}" "${file}"
}

prepare_env_and_secrets() {
  ensure_secure_auth_tokens
  ensure_secure_betterauth_secret
  ensure_storage_env
}

# ──────────────────────────────────────────────
# Commands
# ──────────────────────────────────────────────

cmd_install() {
  echo "Installing ClassroomIO..."
  echo

  if [[ "${USE_IMAGES}" == "true" ]]; then
    # The compose file tracks main (stack topology only — CIO_VERSION pins the app
    # images). Never overwritten; refresh manually if you need a newer topology:
    #   curl -fsSLO ${RAW_BASE_URL}/docker-compose.images.yaml
    fetch_if_missing "${IMAGES_COMPOSE_FILE}" "${RAW_BASE_URL}/docker-compose.images.yaml"
  fi
  fetch_if_missing "${ENV_EXAMPLE_FILE}" "${RAW_BASE_URL}/.env.example"

  if [[ -f "${ENV_FILE}" ]]; then
    echo "Keeping existing .env (not overwritten)."
  else
    cp "${ENV_EXAMPLE_FILE}" "${ENV_FILE}"
    echo "Created .env from .env.example"
  fi

  prepare_env_and_secrets
  warn_if_unpinned_version

  echo "Review these values in .env before going to production:"
  echo "  DASHBOARD_ORIGIN   (your public https:// dashboard URL)"
  echo "  SMTP_*             (outgoing email — invites, notifications)"
  echo "  CIO_VERSION        (pin an exact release for production)"
  echo

  cmd_start
}

cmd_start() {
  prepare_env_and_secrets
  warn_if_unpinned_version

  echo "Starting ClassroomIO..."
  if [[ "${PROFILE_ARGS}" == *"minio"* ]]; then
    echo "Including MinIO (object storage, default)..."
  fi
  if [[ "${USE_IMAGES}" == "true" ]]; then
    echo "Using pre-built images from Docker Hub (CIO_VERSION=$(get_env_value CIO_VERSION))..."
    compose pull
    compose up -d
  else
    compose up --build -d
  fi

  echo
  echo "Current service status:"
  compose ps

  wait_for_endpoints

  echo
  echo "Done. Full stack is running."
}

cmd_stop() {
  echo "Stopping ClassroomIO (data volumes are kept)..."
  compose stop
  echo "Stopped. Start again with: ./classroomio.sh start"
}

cmd_restart() {
  echo "Restarting ClassroomIO..."
  compose restart
  compose ps
}

cmd_logs() {
  compose logs -f --tail=100 "$@"
}

cmd_backup() {
  local ts backup_dir db_user db_name
  ts="$(date +%Y%m%d-%H%M%S)"
  backup_dir="${ROOT_DIR}/backups"
  mkdir -p "${backup_dir}"

  db_user="$(get_env_value POSTGRES_USER)"
  db_user="${db_user:-postgres}"
  db_name="$(get_env_value POSTGRES_DB)"
  db_name="${db_name:-classroomio}"

  echo "Backing up Postgres database '${db_name}'..."
  local db_file="${backup_dir}/classroomio-db-${ts}.sql.gz"
  # pg_dump failure must fail the backup (and abort an upgrade) — don't let gzip's
  # exit code mask it.
  if ! compose exec -T postgres pg_dump -U "${db_user}" "${db_name}" | gzip > "${db_file}"; then
    rm -f "${db_file}"
    echo "Error: Postgres backup failed. Is the stack running? (./classroomio.sh start)"
    return 1
  fi
  echo "  -> ${db_file}"

  # MinIO volume name is derived from the compose project name — same variable the
  # -p flag uses, so a project rename can't silently desync the backup target.
  local minio_volume="${PROJECT_NAME}_minio-data"
  if docker volume inspect "${minio_volume}" >/dev/null 2>&1; then
    echo "Backing up MinIO volume '${minio_volume}'..."
    local minio_file="classroomio-minio-${ts}.tar.gz"
    # Git Bash (MSYS) rewrites container paths like /data into Windows paths; disable
    # conversion for this one command and pre-convert the host dir with cygpath.
    # On Linux/macOS cygpath doesn't exist and the fallback keeps the path as-is.
    local backup_dir_host
    backup_dir_host="$(cygpath -w "${backup_dir}" 2>/dev/null || printf '%s' "${backup_dir}")"
    if ! MSYS_NO_PATHCONV=1 docker run --rm \
      -v "${minio_volume}:/data:ro" \
      -v "${backup_dir_host}:/backup" \
      alpine tar czf "/backup/${minio_file}" -C /data .; then
      echo "Error: MinIO volume backup failed."
      return 1
    fi
    echo "  -> ${backup_dir}/${minio_file}"
  else
    # Not an error: --no-minio installs use external storage and have no local volume.
    echo "MinIO volume '${minio_volume}' not found — skipping object-storage backup."
    echo "  (Using external S3/R2? Back that up with your provider's tools.)"
  fi

  echo "Backup complete: ${backup_dir}"
  echo "Copy backups off this machine — a server failure takes local backups with it."
}

cmd_upgrade() {
  echo "Upgrading ClassroomIO..."
  echo
  echo "Step 1/3: backing up before touching images..."
  cmd_backup

  echo
  if [[ "${USE_IMAGES}" == "true" ]]; then
    # CIO_VERSION only selects a published image tag — meaningless for --build,
    # which always builds whatever is in the local checkout.
    local current_version
    current_version="$(get_env_value CIO_VERSION)"
    echo "Step 2/3: current CIO_VERSION is '${current_version:-unset}'."
    if [[ -t 0 ]]; then
      read -r -p "Enter a new version tag to pin (or press Enter to keep the current one): " new_version
      if [[ -n "${new_version}" ]]; then
        upsert_env_value CIO_VERSION "${new_version}"
        echo "Set CIO_VERSION=${new_version} in .env"
      fi
    fi
    warn_if_unpinned_version
  else
    echo "Step 2/3: building from source — CIO_VERSION doesn't apply."
  fi

  if [[ "${USE_IMAGES}" == "true" ]]; then
    echo "Step 3/3: pulling images and restarting..."
    compose pull
    compose up -d
  else
    echo "Step 3/3: rebuilding from source and restarting..."
    compose up --build -d
  fi
  compose ps
  wait_for_endpoints
  echo
  echo "Upgrade complete."
  if [[ "${USE_IMAGES}" == "true" ]]; then
    echo "Roll back by setting CIO_VERSION back in .env and running: ./classroomio.sh upgrade"
  fi
}

show_menu() {
  echo "ClassroomIO self-host manager"
  echo
  echo "  1) Install    (first-time setup: fetch files, create .env, start)"
  echo "  2) Start"
  echo "  3) Stop"
  echo "  4) Restart"
  echo "  5) Upgrade    (backs up first, then pulls new images)"
  echo "  6) View logs"
  echo "  7) Backup     (Postgres dump + MinIO volume archive)"
  echo "  q) Quit"
  echo
  read -r -p "Pick an option: " choice
  case "${choice}" in
    1) cmd_install ;;
    2) cmd_start ;;
    3) cmd_stop ;;
    4) cmd_restart ;;
    5) cmd_upgrade ;;
    6) cmd_logs ;;
    7) cmd_backup ;;
    q|Q) exit 0 ;;
    *)
      echo "Unknown option: ${choice}"
      exit 1
      ;;
  esac
}

# ──────────────────────────────────────────────
# Argument parsing
# ──────────────────────────────────────────────

# Options may appear before or after the command: `./classroomio.sh start --build`
# and `./classroomio.sh --build start` both work.
COMMAND=""
COMMAND_ARGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --build)
      USE_IMAGES=false
      COMPOSE_FILE="${BUILD_COMPOSE_FILE}"
      shift
      ;;
    --no-minio)
      PROFILE_ARGS=""
      shift
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    install|start|stop|restart|upgrade|logs|backup)
      if [[ -n "${COMMAND}" ]]; then
        echo "Unexpected extra command: $1 (already running '${COMMAND}')"
        print_usage
        exit 1
      fi
      COMMAND="$1"
      shift
      ;;
    *)
      if [[ "${COMMAND}" == "logs" ]]; then
        COMMAND_ARGS+=("$1")
        shift
      else
        echo "Unknown option: $1"
        print_usage
        exit 1
      fi
      ;;
  esac
done

detect_compose

case "${COMMAND}" in
  "") show_menu ;;
  install) cmd_install ;;
  start) cmd_start ;;
  stop) cmd_stop ;;
  restart) cmd_restart ;;
  upgrade) cmd_upgrade ;;
  logs) cmd_logs "${COMMAND_ARGS[@]+"${COMMAND_ARGS[@]}"}" ;;
  backup) cmd_backup ;;
esac
