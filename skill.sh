#!/usr/bin/env bash
# Compatibility entry point. Prefer bin/skills-install.
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$REPO_ROOT/bin/skills-install" "$@"
