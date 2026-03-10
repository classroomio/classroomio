#!/usr/bin/env bash

set -euo pipefail

API_SERVICE_NAME="${API_SERVICE_NAME:-cio-api}"
DASHBOARD_SERVICE_NAME="${DASHBOARD_SERVICE_NAME:-cio-dashboard}"
POSTGRES_SERVICE_NAME="${POSTGRES_SERVICE_NAME:-Postgres}"
REDIS_SERVICE_NAME="${REDIS_SERVICE_NAME:-Redis}"

BUCKET_REGION="${BUCKET_REGION:-iad}"
BUCKET_PREFIX="${BUCKET_PREFIX:-classroomio}"
VIDEOS_BUCKET_NAME="${VIDEOS_BUCKET_NAME:-${BUCKET_PREFIX}-videos}"
DOCUMENTS_BUCKET_NAME="${DOCUMENTS_BUCKET_NAME:-${BUCKET_PREFIX}-documents}"
MEDIA_BUCKET_NAME="${MEDIA_BUCKET_NAME:-${BUCKET_PREFIX}-media}"

require_command() {
  local command_name="$1"
  if ! command -v "${command_name}" >/dev/null 2>&1; then
    echo "Error: ${command_name} is required but not installed."
    exit 1
  fi
}

json_has_name() {
  local json_payload="$1"
  local target_name="$2"

  printf '%s' "${json_payload}" | jq -e --arg target "${target_name}" '
    [
      .. | objects | (
        .name? //
        .serviceName? //
        .service?.name? //
        empty
      )
    ] | index($target) != null
  ' >/dev/null 2>&1
}

service_exists() {
  local service_name="$1"
  local service_json

  service_json="$(railway service status --all --json 2>/dev/null || true)"
  if [[ -z "${service_json}" ]]; then
    return 1
  fi

  json_has_name "${service_json}" "${service_name}"
}

bucket_exists() {
  local bucket_name="$1"
  local bucket_json

  bucket_json="$(railway bucket list --json 2>/dev/null || true)"
  if [[ -z "${bucket_json}" ]]; then
    return 1
  fi

  json_has_name "${bucket_json}" "${bucket_name}"
}

ensure_database_service() {
  local database_kind="$1"
  local service_name="$2"
  local output

  if service_exists "${service_name}"; then
    echo "Service '${service_name}' already exists."
    return
  fi

  echo "Creating ${database_kind} service '${service_name}'..."
  if output="$(railway add --database "${database_kind}" --service "${service_name}" --json 2>&1)"; then
    echo "Created '${service_name}'."
    return
  fi

  if service_exists "${service_name}"; then
    echo "Service '${service_name}' already exists (detected after create attempt)."
    return
  fi

  echo "${output}"
  echo "Error: failed to provision '${service_name}'."
  exit 1
}

ensure_bucket() {
  local bucket_name="$1"
  local output

  if bucket_exists "${bucket_name}"; then
    echo "Bucket '${bucket_name}' already exists."
    return
  fi

  echo "Creating bucket '${bucket_name}' in region '${BUCKET_REGION}'..."
  if output="$(railway bucket create "${bucket_name}" --region "${BUCKET_REGION}" --json 2>&1)"; then
    echo "Created bucket '${bucket_name}'."
    return
  fi

  if bucket_exists "${bucket_name}"; then
    echo "Bucket '${bucket_name}' already exists (detected after create attempt)."
    return
  fi

  echo "${output}"
  echo "Error: failed to create bucket '${bucket_name}'."
  exit 1
}

ensure_application_service() {
  local service_name="$1"

  if service_exists "${service_name}"; then
    return
  fi

  echo "Error: app service '${service_name}' was not found."
  echo "Create/link it first, then rerun this script:"
  echo "  railway add --service \"${service_name}\""
  exit 1
}

build_media_public_base_url() {
  local endpoint="$1"
  local bucket_name="$2"
  local force_path_style="$3"
  local url

  url="${endpoint%/}"
  if [[ "${force_path_style}" == "true" ]]; then
    printf '%s/%s\n' "${url}" "${bucket_name}"
    return
  fi

  if [[ "${url}" =~ ^(https?)://(.+)$ ]]; then
    printf '%s://%s.%s\n' "${BASH_REMATCH[1]}" "${bucket_name}" "${BASH_REMATCH[2]}"
    return
  fi

  printf '%s/%s\n' "${url}" "${bucket_name}"
}

require_command railway
require_command jq

if ! railway status --json >/dev/null 2>&1; then
  echo "Error: no linked Railway project in this directory."
  echo "Run 'railway link --project <project-name-or-id>' and retry."
  exit 1
fi

ensure_application_service "${API_SERVICE_NAME}"
ensure_application_service "${DASHBOARD_SERVICE_NAME}"

ensure_database_service postgres "${POSTGRES_SERVICE_NAME}"
ensure_database_service redis "${REDIS_SERVICE_NAME}"

ensure_bucket "${VIDEOS_BUCKET_NAME}"
ensure_bucket "${DOCUMENTS_BUCKET_NAME}"
ensure_bucket "${MEDIA_BUCKET_NAME}"

echo "Fetching credentials for bucket '${MEDIA_BUCKET_NAME}'..."
MEDIA_BUCKET_CREDS_JSON="$(railway bucket credentials --bucket "${MEDIA_BUCKET_NAME}" --json)"

OBJECT_STORAGE_ENDPOINT="$(printf '%s' "${MEDIA_BUCKET_CREDS_JSON}" | jq -r '.endpoint // empty')"
OBJECT_STORAGE_ACCESS_KEY_ID="$(printf '%s' "${MEDIA_BUCKET_CREDS_JSON}" | jq -r '.accessKeyId // empty')"
OBJECT_STORAGE_SECRET_ACCESS_KEY="$(printf '%s' "${MEDIA_BUCKET_CREDS_JSON}" | jq -r '.secretAccessKey // empty')"
OBJECT_STORAGE_REGION="${BUCKET_REGION}"
OBJECT_STORAGE_URL_STYLE="$(printf '%s' "${MEDIA_BUCKET_CREDS_JSON}" | jq -r '(.urlStyle // "") | ascii_downcase')"

if [[ -z "${OBJECT_STORAGE_ENDPOINT}" || -z "${OBJECT_STORAGE_ACCESS_KEY_ID}" || -z "${OBJECT_STORAGE_SECRET_ACCESS_KEY}" ]]; then
  echo "Error: could not parse bucket credentials JSON."
  echo "Response:"
  echo "${MEDIA_BUCKET_CREDS_JSON}"
  exit 1
fi

OBJECT_STORAGE_FORCE_PATH_STYLE="false"
if [[ "${OBJECT_STORAGE_URL_STYLE}" == *path* ]]; then
  OBJECT_STORAGE_FORCE_PATH_STYLE="true"
fi

OBJECT_STORAGE_MEDIA_PUBLIC_BASE_URL="$(
  build_media_public_base_url "${OBJECT_STORAGE_ENDPOINT}" "${MEDIA_BUCKET_NAME}" "${OBJECT_STORAGE_FORCE_PATH_STYLE}"
)"

POSTGRES_DATABASE_URL_REF="\${{${POSTGRES_SERVICE_NAME}.DATABASE_URL}}"
REDIS_URL_REF="\${{${REDIS_SERVICE_NAME}.REDIS_URL}}"

echo "Setting API variables on '${API_SERVICE_NAME}'..."
railway variable set --service "${API_SERVICE_NAME}" \
  "SERVICE_TARGET=api" \
  "PORT=3081" \
  "DATABASE_URL=${POSTGRES_DATABASE_URL_REF}" \
  "PRIVATE_DATABASE_URL=${POSTGRES_DATABASE_URL_REF}" \
  "REDIS_URL=${REDIS_URL_REF}" \
  "OBJECT_STORAGE_ENDPOINT=${OBJECT_STORAGE_ENDPOINT%/}" \
  "OBJECT_STORAGE_PUBLIC_ENDPOINT=${OBJECT_STORAGE_ENDPOINT%/}" \
  "OBJECT_STORAGE_ACCESS_KEY_ID=${OBJECT_STORAGE_ACCESS_KEY_ID}" \
  "OBJECT_STORAGE_SECRET_ACCESS_KEY=${OBJECT_STORAGE_SECRET_ACCESS_KEY}" \
  "OBJECT_STORAGE_REGION=${OBJECT_STORAGE_REGION}" \
  "OBJECT_STORAGE_FORCE_PATH_STYLE=${OBJECT_STORAGE_FORCE_PATH_STYLE}" \
  "OBJECT_STORAGE_BUCKET_VIDEOS=${VIDEOS_BUCKET_NAME}" \
  "OBJECT_STORAGE_BUCKET_DOCUMENTS=${DOCUMENTS_BUCKET_NAME}" \
  "OBJECT_STORAGE_BUCKET_MEDIA=${MEDIA_BUCKET_NAME}" \
  "OBJECT_STORAGE_MEDIA_PUBLIC_BASE_URL=${OBJECT_STORAGE_MEDIA_PUBLIC_BASE_URL}"

echo "Setting dashboard variables on '${DASHBOARD_SERVICE_NAME}'..."
railway variable set --service "${DASHBOARD_SERVICE_NAME}" \
  "SERVICE_TARGET=dashboard" \
  "PORT=3082" \
  "PUBLIC_IS_SELFHOSTED=true"

echo
echo "Railway infrastructure is provisioned and wired:"
echo "- Postgres service: ${POSTGRES_SERVICE_NAME}"
echo "- Redis service: ${REDIS_SERVICE_NAME}"
echo "- Buckets: ${VIDEOS_BUCKET_NAME}, ${DOCUMENTS_BUCKET_NAME}, ${MEDIA_BUCKET_NAME}"
echo "- API service updated: ${API_SERVICE_NAME}"
echo "- Dashboard service updated: ${DASHBOARD_SERVICE_NAME}"
echo
echo "Next: set domain/auth/smtp variables, then deploy with:"
echo "  railway up --service \"${API_SERVICE_NAME}\" --detach -m \"deploy api\""
echo "  railway up --service \"${DASHBOARD_SERVICE_NAME}\" --detach -m \"deploy dashboard\""
