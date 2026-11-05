#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_ENV_FILE="${DEPLOY_ENV_FILE:-$SCRIPT_DIR/.env}"

if [[ ! -f "$DEPLOY_ENV_FILE" ]]; then
  echo "Deployment configuration is missing: $DEPLOY_ENV_FILE" >&2
  echo "Copy $SCRIPT_DIR/.env.example to $DEPLOY_ENV_FILE and adjust its values." >&2
  exit 1
fi

set -a
source "$DEPLOY_ENV_FILE"
set +a

: "${REPOSITORY:?REPOSITORY must be configured in $DEPLOY_ENV_FILE}"
: "${APP_ROOT:?APP_ROOT must be configured in $DEPLOY_ENV_FILE}"

DEFAULT_BRANCH="${DEFAULT_BRANCH:-master}"
RELEASE_RETENTION_DAYS="${RELEASE_RETENTION_DAYS:-30}"
BRANCH="${1:-$DEFAULT_BRANCH}"
RELEASES_DIR="$APP_ROOT/releases"
SHARED_DIR="$APP_ROOT/shared"
CURRENT_LINK="$APP_ROOT/current"

if [[ ! "$RELEASE_RETENTION_DAYS" =~ ^[0-9]+$ ]]; then
  echo "RELEASE_RETENTION_DAYS must be a non-negative integer." >&2
  exit 1
fi

TIMESTAMP="$(date +"%Y%m%d%H%M%S")"
RELEASE_PATH=""
NEXT_LINK="${CURRENT_LINK}.next-${TIMESTAMP}"
DEPLOYED=false

cleanup() {
  local exit_code=$?

  rm -f -- "$NEXT_LINK"

  if ((exit_code != 0)) && [[ "$DEPLOYED" == "false" ]] && [[ -n "$RELEASE_PATH" ]]; then
    echo "Deployment failed; removing incomplete release $RELEASE_PATH"
    rm -rf -- "$RELEASE_PATH"
  fi

  exit "$exit_code"
}

require_shared_file() {
  local path=$1

  if [[ ! -f "$path" ]]; then
    echo "Required shared file is missing: $path" >&2
    exit 1
  fi
}

cleanup_old_releases() {
  local current_target candidate candidate_target

  current_target="$(readlink -f "$CURRENT_LINK")"

  while IFS= read -r -d '' candidate; do
    candidate_target="$(readlink -f "$candidate")"
    if [[ "$candidate_target" == "$current_target" ]]; then
      continue
    fi

    echo "Removing old release $candidate"
    rm -rf -- "$candidate"
  done < <(
    find "$RELEASES_DIR" \
      -mindepth 1 \
      -maxdepth 1 \
      -type d \
      -mtime "+$RELEASE_RETENTION_DAYS" \
      -print0
  )
}

trap cleanup EXIT

mkdir -p "$RELEASES_DIR" "$SHARED_DIR/yarn"

exec 9>"$SHARED_DIR/deploy.lock"
if ! flock -n 9; then
  echo "Another deployment is already running." >&2
  exit 1
fi

require_shared_file "$SHARED_DIR/.env"
require_shared_file "$SHARED_DIR/tei_editor.config.js"
require_shared_file "$SHARED_DIR/webpack.production.config.js"

RELEASE_PATH="$(mktemp -d "$RELEASES_DIR/${TIMESTAMP}.XXXXXX")"
chmod 0755 "$RELEASE_PATH"

echo "Starting deployment of branch '$BRANCH' into $RELEASE_PATH"
git clone --branch "$BRANCH" --depth 1 "$REPOSITORY" "$RELEASE_PATH"

ln -s "$SHARED_DIR/.env" "$RELEASE_PATH/.env"
ln -s "$SHARED_DIR/tei_editor.config.js" "$RELEASE_PATH/tei_editor.config.js"
mv "$RELEASE_PATH/webpack.config.js" "$RELEASE_PATH/webpack.repository.config.js"
cp "$SHARED_DIR/webpack.production.config.js" "$RELEASE_PATH/webpack.config.js"

cd "$RELEASE_PATH"

export HUSKY=0
export YARN_ENABLE_GLOBAL_CACHE=true
export YARN_GLOBAL_FOLDER="$SHARED_DIR/yarn"

echo "Installing dependencies from the committed lockfile"
yarn install --immutable

echo "Building production assets"
yarn build

if [[ ! -f "$RELEASE_PATH/dist/index.html" ]]; then
  echo "Build validation failed: dist/index.html is missing." >&2
  exit 1
fi

echo "Generating deployment metadata"
yarn generate-git-info

if [[ ! -f "$RELEASE_PATH/dist/git-info.json" ]]; then
  echo "Build validation failed: dist/git-info.json is missing." >&2
  exit 1
fi

chmod -R a+rX "$RELEASE_PATH/dist"

echo "Activating release $RELEASE_PATH"
ln -s "$RELEASE_PATH" "$NEXT_LINK"
mv -Tf "$NEXT_LINK" "$CURRENT_LINK"
DEPLOYED=true

cleanup_old_releases

echo "Deployment completed successfully for branch '$BRANCH'."
