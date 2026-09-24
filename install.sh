#!/usr/bin/env bash
set -e

REPO_URL="https://github.com/tikhomirov/skills.git"
TMP_DIR="$(mktemp -d /tmp/skills-install-XXXXXX)"

cleanup() {
    rm -rf "$TMP_DIR"
}
trap cleanup EXIT

echo "⬇ Downloading skills from $REPO_URL..."
git clone --depth 1 "$REPO_URL" "$TMP_DIR" > /dev/null 2>&1

cd "$TMP_DIR"
chmod +x ./skill.sh
./skill.sh "$@"

echo "✨ All set! Your AI coding agents now have access to the skills."
