#!/usr/bin/env bash
# Mocked coverage for concurrent Railway preview deploys and log-stream recovery.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=.github/scripts/railway-preview-deploy.sh
source "$SCRIPT_DIR/railway-preview-deploy.sh"

TMP_ROOT="$(mktemp -d)"
trap 'rm -rf "$TMP_ROOT"' EXIT

MOCK_BIN="$TMP_ROOT/bin"
mkdir -p "$MOCK_BIN"
export PATH="$MOCK_BIN:$PATH"

export RUNNER_TEMP="$TMP_ROOT/runner-temp"
mkdir -p "$RUNNER_TEMP"
export RAILWAY_DEPLOY_MAX_ATTEMPTS=3
export RAILWAY_DEPLOY_SLEEP_SECONDS=0

write_mock_railway() {
  local mode="$1"

  cat >"$MOCK_BIN/railway" <<EOF
#!/usr/bin/env bash
set -euo pipefail

mode="$mode"
cmd="\${1:-}"

case "\$cmd" in
  up)
    service=""
    while [ \$# -gt 0 ]; do
      case "\$1" in
        --service)
          service="\$2"
          shift 2
          ;;
        *)
          shift
          ;;
      esac
    done

    case "\$mode:\$service" in
      success:*)
        echo "Deploying \$service..."
        echo "https://railway.com/project/p/service/s/deployments?id=11111111-1111-1111-1111-111111111111"
        exit 0
        ;;
      stream-success:cio-api)
        echo "Deploying cio-api..."
        echo "https://railway.com/project/p/service/s/deployments?id=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
        echo "Failed to stream build logs: connection reset"
        exit 1
        ;;
      stream-failed:cio-api)
        echo "Deploying cio-api..."
        echo "https://railway.com/project/p/service/s/deployments?id=dddddddd-dddd-dddd-dddd-dddddddddddd"
        echo "Failed to stream build logs: connection reset"
        exit 1
        ;;
      other-failure:cio-api)
        echo "Deploying cio-api..."
        echo "error: build failed before a deployment id was published"
        exit 1
        ;;
      partial-failure:cio-dashboard)
        echo "Deploying cio-dashboard..."
        echo "error: dashboard build failed"
        exit 1
        ;;
      stream-success:*|stream-failed:*|other-failure:*|partial-failure:*)
        echo "Deploying \$service..."
        echo "https://railway.com/project/p/service/s/deployments?id=eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"
        exit 0
        ;;
      *)
        echo "unexpected railway up mode/service: \$mode/\$service" >&2
        exit 99
        ;;
    esac
    ;;
  deployment)
    service=""
    while [ \$# -gt 0 ]; do
      case "\$1" in
        --service)
          service="\$2"
          shift 2
          ;;
        *)
          shift
          ;;
      esac
    done

    case "\$mode:\$service" in
      stream-success:cio-api)
        printf '%s\\n' '[{"id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","status":"SUCCESS"}]'
        ;;
      stream-failed:cio-api)
        printf '%s\\n' '[{"id":"dddddddd-dddd-dddd-dddd-dddddddddddd","status":"FAILED"}]'
        ;;
      *)
        printf '%s\\n' '[]'
        ;;
    esac
    ;;
  *)
    echo "unexpected railway command: \$cmd" >&2
    exit 99
    ;;
esac
EOF

  chmod +x "$MOCK_BIN/railway"
}

assert_exit() {
  local expected="$1"
  local label="$2"
  shift 2

  set +e
  "$@"
  local actual=$?
  set -e

  if [ "$actual" -ne "$expected" ]; then
    echo "FAIL: $label (expected exit $expected, got $actual)" >&2
    exit 1
  fi

  echo "PASS: $label"
}

export APP_SERVICES="cio-api cio-dashboard cio-jobs"

write_mock_railway success
assert_exit 0 "concurrent success" deploy_app_services_in_parallel

write_mock_railway stream-success
assert_exit 0 "stream error followed by SUCCESS" deploy_app_services_in_parallel

write_mock_railway stream-failed
assert_exit 1 "stream error followed by FAILED" deploy_app_services_in_parallel

write_mock_railway other-failure
assert_exit 1 "non-stream failure does not poll" deploy_app_services_in_parallel

write_mock_railway partial-failure
assert_exit 1 "partial concurrent failure" deploy_app_services_in_parallel

echo "All railway preview deploy recovery mocks passed."
