#!/usr/bin/env bash
#
# Pre-publish smoke test: boot a freshly built image and confirm it actually starts
# before we push it to Docker Hub. Run from CI against ephemeral postgres + redis.
#
#   bash docker/smoke-test.sh <service> <image-ref>
#     service   = api | dashboard | jobs
#     image-ref = local image tag built with --load (e.g. cio-smoke-api:test)
#
# Exits non-zero (failing the publish) if the container crashes or never becomes ready.

set -euo pipefail

SERVICE="${1:?usage: smoke-test.sh <api|dashboard|jobs> <image-ref>}"
IMAGE="${2:?missing image ref}"

DB_URL="postgresql://postgres:postgres@localhost:5432/classroomio"
REDIS_URL="redis://localhost:6379"
NAME="cio-smoke-${SERVICE}"

cleanup() { docker rm -f "${NAME}" >/dev/null 2>&1 || true; }
trap cleanup EXIT

container_alive() { [ -n "$(docker ps -q -f name="^${NAME}$")" ]; }
dump_and_fail() {
  echo "SMOKE FAIL (${SERVICE}): $1"

  echo
  echo "==============================="
  echo "Container Logs"
  echo "==============================="
  docker logs "${NAME}" || true

  echo
  echo "==============================="
  echo "Current Database Tables"
  echo "==============================="

  docker run --rm --network host \
    postgres:16-alpine \
    psql postgresql://postgres:postgres@localhost:5432/classroomio \
    -c "\dt"

  echo
  echo "==============================="
  echo "Applied Drizzle Migrations"
  echo "==============================="

  docker run --rm --network host \
    postgres:16-alpine \
    psql postgresql://postgres:postgres@localhost:5432/classroomio \
    -c "select * from __drizzle_migrations;"

  exit 1
}

case "${SERVICE}" in
  api)
    docker run -d --name "${NAME}" --network host \
      -e NODE_ENV=production -e PORT=3081 \
      -e DATABASE_URL="${DB_URL}" -e PRIVATE_DATABASE_URL="${DB_URL}" -e REDIS_URL="${REDIS_URL}" \
      -e BETTER_AUTH_SECRET=smoke-test-secret-not-for-production \
      -e PRIVATE_SERVER_KEY=smoke \
      "${IMAGE}"
    # entrypoint runs db:setup against the ephemeral DB (also exercises migrations), then serves.
    for _ in $(seq 1 40); do
      container_alive || dump_and_fail "container exited during startup"
      if curl -fsS --max-time 5 http://localhost:3081/ >/dev/null 2>&1; then
        echo "SMOKE OK (api): healthcheck passed"; exit 0
      fi
      sleep 3
    done
    dump_and_fail "api did not become healthy on :3081 within timeout"
    ;;

  jobs)
    docker run -d --name "${NAME}" --network host \
      -e NODE_ENV=production -e DATABASE_URL="${DB_URL}" -e REDIS_URL="${REDIS_URL}" \
      "${IMAGE}"
    for _ in $(seq 1 30); do
      container_alive || dump_and_fail "worker container exited during startup"
      if docker logs "${NAME}" 2>&1 | grep -q "all-workers-running"; then
        echo "SMOKE OK (jobs): workers booted"; exit 0
      fi
      sleep 3
    done
    dump_and_fail "jobs did not report 'all-workers-running' within timeout"
    ;;

  dashboard)
    docker run -d --name "${NAME}" --network host \
      -e NODE_ENV=production -e PORT=3082 -e ORIGIN=http://localhost:3082 \
      -e PUBLIC_IS_SELFHOSTED=true \
      -e PRIVATE_SERVER_URL=http://localhost:3081 -e PRIVATE_SERVER_KEY=smoke \
      "${IMAGE}"
    # Boot check: the SvelteKit server should listen even if the API is absent.
    for _ in $(seq 1 30); do
      container_alive || dump_and_fail "dashboard container exited during startup"
      code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 5 http://localhost:3082/ 2>/dev/null || true)"
      # Accept any listening response (2xx/3xx, or the expected 404 when the API is absent),
      # but FAIL on 5xx — a server-error on every route means a broken build, not a healthy boot.
      if [ -n "${code}" ] && [ "${code}" != "000" ] && [[ "${code}" != 5* ]]; then
        echo "SMOKE OK (dashboard): server listening (HTTP ${code})"; exit 0
      fi
      if [[ "${code}" == 5* ]]; then
        dump_and_fail "dashboard returned server error HTTP ${code}"
      fi
      sleep 3
    done
    dump_and_fail "dashboard did not listen on :3082 within timeout"
    ;;

  *)
    echo "unknown service: ${SERVICE}" >&2; exit 1
    ;;
esac
