#!/usr/bin/env bash
# Deploy Railway preview app services concurrently and recover from the known
# `railway up --ci` log-streaming false negative (railwayapp/cli#696).
#
# Required env:
#   APP_SERVICES  — space-separated service names (e.g. "cio-api cio-dashboard cio-jobs")
#   RUNNER_TEMP   — writable directory for per-service logs
#
# Optional env (mainly for tests):
#   RAILWAY_DEPLOY_MAX_ATTEMPTS — poll attempts (default: 60)
#   RAILWAY_DEPLOY_SLEEP_SECONDS — sleep between polls (default: 10)

set -euo pipefail

RAILWAY_DEPLOY_MAX_ATTEMPTS="${RAILWAY_DEPLOY_MAX_ATTEMPTS:-60}"
RAILWAY_DEPLOY_SLEEP_SECONDS="${RAILWAY_DEPLOY_SLEEP_SECONDS:-10}"

# Returns 0 when the deployment reached SUCCESS, 1 otherwise.
poll_deployment_status() {
  local service="$1"
  local deploy_id="$2"
  local status=""
  local attempt

  for attempt in $(seq 1 "$RAILWAY_DEPLOY_MAX_ATTEMPTS"); do
    status=$(
      railway deployment list --service "$service" --json 2>/dev/null |
        jq -r --arg id "$deploy_id" '.[] | select(.id == $id) | .status // empty'
    )

    case "$status" in
      SUCCESS)
        echo "Deployment $deploy_id for $service actually succeeded (status: SUCCESS) — the CLI error was just a log-streaming glitch. Continuing."
        return 0
        ;;
      FAILED|CRASHED|REMOVED)
        echo "::error::$service deployment $deploy_id did not succeed (status: $status)."
        return 1
        ;;
    esac

    if [ "$attempt" -eq "$RAILWAY_DEPLOY_MAX_ATTEMPTS" ]; then
      echo "::error::$service deployment $deploy_id never reached a terminal status after $RAILWAY_DEPLOY_MAX_ATTEMPTS attempts (last seen: ${status:-unknown})."
      return 1
    fi

    echo "Deployment $deploy_id for $service not finished yet (status: ${status:-unknown}, attempt $attempt/$RAILWAY_DEPLOY_MAX_ATTEMPTS) — retrying in ${RAILWAY_DEPLOY_SLEEP_SECONDS}s..."
    sleep "$RAILWAY_DEPLOY_SLEEP_SECONDS"
  done

  return 1
}

# Resolve a non-zero `railway up` exit using the captured log.
# Only the known log-streaming glitch is eligible for status polling.
# Returns 0 on recovered SUCCESS, 1 on failure.
resolve_railway_up_failure() {
  local service="$1"
  local deployment_log="$2"
  local deploy_id

  if ! grep -q "Failed to stream build logs:" "$deployment_log"; then
    echo "::error::railway up failed for $service for a reason other than the known log-streaming glitch — not polling stale deployment status."
    return 1
  fi

  deploy_id=$(grep -oP '(?<=[?&]id=)[0-9a-fA-F-]+' "$deployment_log" | head -n1)
  if [ -z "$deploy_id" ]; then
    echo "::error::railway up failed for $service and no deployment id could be recovered from its output — cannot verify actual status."
    return 1
  fi

  echo "railway up reported failure for $service due to the known log-streaming glitch; checking status of deployment $deploy_id..."
  poll_deployment_status "$service" "$deploy_id"
}

deploy_app_services_in_parallel() {
  local -a services=()
  local -a deployment_pids=()
  local -a deployment_logs=()
  local service
  local deployment_log
  local service_index
  local railway_status
  local deployment_failed=false

  if [ -z "${APP_SERVICES:-}" ]; then
    echo "::error::APP_SERVICES is required."
    return 1
  fi

  if [ -z "${RUNNER_TEMP:-}" ]; then
    echo "::error::RUNNER_TEMP is required."
    return 1
  fi

  # shellcheck disable=SC2206
  services=($APP_SERVICES)

  for service in "${services[@]}"; do
    deployment_log="$RUNNER_TEMP/railway-${service}.log"
    echo "Starting deployment for $service..."
    railway up --service "$service" --ci >"$deployment_log" 2>&1 &
    deployment_pids+=("$!")
    deployment_logs+=("$deployment_log")
  done

  for service_index in "${!services[@]}"; do
    service="${services[$service_index]}"
    deployment_log="${deployment_logs[$service_index]}"

    if wait "${deployment_pids[$service_index]}"; then
      railway_status=0
    else
      railway_status=1
    fi

    echo "::group::railway up $service"
    cat "$deployment_log"

    if [ "$railway_status" -ne 0 ]; then
      if ! resolve_railway_up_failure "$service" "$deployment_log"; then
        deployment_failed=true
      fi
    fi

    echo "::endgroup::"
  done

  if [ "$deployment_failed" = true ]; then
    echo "::error::One or more Railway app deployments failed."
    return 1
  fi
}

# Only auto-run when executed directly (not when sourced by tests).
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  deploy_app_services_in_parallel
fi
