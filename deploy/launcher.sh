#!/usr/bin/env bash

set -Eeuo pipefail

APP_ROOT="${APP_ROOT:-$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)}"
DEPLOYER_DIR="${DEPLOYER_DIR:-$APP_ROOT/deployer}"
DEPLOYER_BRANCH="${DEPLOYER_BRANCH:-master}"
DEPLOY_BRANCH="${1:-$DEPLOYER_BRANCH}"

if [[ ! -d "$DEPLOYER_DIR/.git" ]]; then
  echo "Deployer checkout is missing: $DEPLOYER_DIR" >&2
  exit 1
fi

echo "Updating deployer checkout from origin/$DEPLOYER_BRANCH"
git -C "$DEPLOYER_DIR" pull --ff-only origin "$DEPLOYER_BRANCH"

exec "$DEPLOYER_DIR/deploy/deploy.sh" "$DEPLOY_BRANCH"
