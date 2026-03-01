#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${ROOT_DIR}/docker/docker-compose.yaml"
PROJECT_NAME="classroomio"
ENV_FILE="${ROOT_DIR}/.env"
BUILD_IMAGES=true
COMPOSE_PROFILES="--profile minio"

print_usage() {
  cat <<'USAGE'
Usage: ./run-docker-full-stack.sh [--no-build] [--no-minio]

Options:
  --no-build  Start containers without rebuilding images.
  --no-minio  Exclude MinIO (object storage). By default MinIO is included.
  -h, --help  Show this help message.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-build)
      BUILD_IMAGES=false
      shift
      ;;
    --no-minio)
      COMPOSE_PROFILES=""
      shift
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      print_usage
      exit 1
      ;;
  esac
done

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
    "" | "replace-with-a-long-random-token" | "replace-with-the-same-value-as-AUTH_BEARER_TOKEN" | "local-dev-api-key" | "changeme" | "replace-me")
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

  local auth_bearer_token
  local private_server_key
  local generated_token

  auth_bearer_token="$(get_env_value AUTH_BEARER_TOKEN)"
  private_server_key="$(get_env_value PRIVATE_SERVER_KEY)"

  if is_insecure_token_value "${auth_bearer_token}" && is_insecure_token_value "${private_server_key}"; then
    generated_token="$(generate_secure_token)"
    upsert_env_value AUTH_BEARER_TOKEN "${generated_token}"
    upsert_env_value PRIVATE_SERVER_KEY "${generated_token}"
    echo "Generated secure AUTH_BEARER_TOKEN and PRIVATE_SERVER_KEY in .env"
    return
  fi

  if is_insecure_token_value "${auth_bearer_token}" && ! is_insecure_token_value "${private_server_key}"; then
    upsert_env_value AUTH_BEARER_TOKEN "${private_server_key}"
    echo "Set AUTH_BEARER_TOKEN to match existing PRIVATE_SERVER_KEY in .env"
    return
  fi

  if ! is_insecure_token_value "${auth_bearer_token}" && is_insecure_token_value "${private_server_key}"; then
    upsert_env_value PRIVATE_SERVER_KEY "${auth_bearer_token}"
    echo "Set PRIVATE_SERVER_KEY to match existing AUTH_BEARER_TOKEN in .env"
    return
  fi

  if [[ "${auth_bearer_token}" != "${private_server_key}" ]]; then
    upsert_env_value PRIVATE_SERVER_KEY "${auth_bearer_token}"
    echo "Normalized PRIVATE_SERVER_KEY to match AUTH_BEARER_TOKEN in .env"
  fi
}

ensure_minio_env() {
  if [[ ! -f "${ENV_FILE}" ]]; then
    touch "${ENV_FILE}"
  fi

  local endpoint
  endpoint="$(get_env_value OBJECT_STORAGE_ENDPOINT)"

  if [[ -z "${endpoint}" || "${endpoint}" =~ ^[[:space:]]*$ ]]; then
    upsert_env_value MINIO_ROOT_USER "minioadmin"
    upsert_env_value MINIO_ROOT_PASSWORD "minioadmin"
    upsert_env_value OBJECT_STORAGE_ENDPOINT "http://minio:9000"
    upsert_env_value OBJECT_STORAGE_PUBLIC_ENDPOINT "http://localhost:9000"
    upsert_env_value OBJECT_STORAGE_ACCESS_KEY_ID "minioadmin"
    upsert_env_value OBJECT_STORAGE_SECRET_ACCESS_KEY "minioadmin"
    upsert_env_value OBJECT_STORAGE_FORCE_PATH_STYLE "true"
    upsert_env_value OBJECT_STORAGE_MEDIA_PUBLIC_BASE_URL "http://localhost:9000/media"
    echo "Set MinIO object storage env vars in .env"
  fi
}

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: docker is not installed or not on PATH."
  exit 1
fi

ensure_secure_auth_tokens

if [[ "${COMPOSE_PROFILES}" == *"minio"* ]]; then
  ensure_minio_env
fi

echo "Starting ClassroomIO Docker full stack..."
if [[ "${COMPOSE_PROFILES}" != "" ]]; then
  echo "Including MinIO (object storage, default)..."
fi
if [[ "${BUILD_IMAGES}" == "true" ]]; then
  docker compose --env-file "${ENV_FILE}" -p "${PROJECT_NAME}" -f "${COMPOSE_FILE}" ${COMPOSE_PROFILES} up --build -d
else
  docker compose --env-file "${ENV_FILE}" -p "${PROJECT_NAME}" -f "${COMPOSE_FILE}" ${COMPOSE_PROFILES} up -d
fi

echo
echo "Current service status:"
docker compose --env-file "${ENV_FILE}" -p "${PROJECT_NAME}" -f "${COMPOSE_FILE}" ps

if command -v curl >/dev/null 2>&1; then
  echo
  echo "Checking API endpoint..."
  curl -fsS --max-time 10 http://localhost:3081/ >/dev/null
  echo "API is reachable on http://localhost:3081/"

  echo "Checking dashboard endpoint..."
  curl -fsSI --max-time 10 http://localhost:3082/ >/dev/null
  echo "Dashboard is reachable on http://localhost:3082/"
else
  echo
  echo "curl not found, skipped endpoint checks."
fi

echo
echo "Done. Full stack is running."
