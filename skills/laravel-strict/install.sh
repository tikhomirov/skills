#!/usr/bin/env bash
# install.sh — Laravel Strict skill installer
#
# Usage:
#   ./install.sh                  interactive (asks for target)
#   ./install.sh --global         install into ~/.agents/ + ~/.claude/ symlink
#   ./install.sh --local [DIR]    install into <DIR>/.agents/skills/laravel-strict
#   ./install.sh --uninstall      remove laravel-strict from any known location
#   ./install.sh --yes            accept defaults (local install in CWD)
#   ./install.sh --dry-run        show what would happen, change nothing
#   ./install.sh --no-clean       skip removing old laravel-strict entries
#   ./install.sh --version        print installed/available versions
#
# Mirrors the spirit of `npx github:tikhomirov/dandy-code-skills install`
# but is plain bash — no Node dependency.

set -euo pipefail

REPO_URL="https://github.com/tikhomirov/laravel-strict-skill.git"
SKILL_NAME="laravel-strict"

# ---------- args ----------

TARGET=""
GLOBAL="no"
LOCAL_DIR=""
YES="no"
DRY_RUN="no"
NO_CLEAN="no"
ACTION="install"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --global)       GLOBAL="yes"; shift ;;
        --local)        LOCAL_DIR="${2:-}"; [[ -n "$LOCAL_DIR" ]] && shift; shift ;;
        --uninstall)    ACTION="uninstall"; shift ;;
        --yes|-y)       YES="yes"; shift ;;
        --dry-run)      DRY_RUN="yes"; shift ;;
        --no-clean)     NO_CLEAN="yes"; shift ;;
        --version|-v)   ACTION="version"; shift ;;
        --help|-h)       ACTION="help"; shift ;;
        *)               echo "Unknown option: $1" >&2; exit 2 ;;
    esac
done

# ---------- helpers ----------

log()  { printf '\033[0;34m[i]\033[0m %s\n' "$*" >&2; }
ok()   { printf '\033[0;32m[+]\033[0m %s\n' "$*" >&2; }
warn() { printf '\033[0;33m[!]\033[0m %s\n' "$*" >&2; }
fail() { printf '\033[0;31m[x]\033[0m %s\n' "$*" >&2; exit 1; }

run() {
    if [[ "$DRY_RUN" == "yes" ]]; then
        printf '  DRY-RUN: %s\n' "$*" >&2
    else
        "$@"
    fi
}

confirm() {
    local prompt="$1"
    if [[ "$YES" == "yes" ]]; then
        log "$prompt [y/N] -> y"
        return 0
    fi
    read -r -p "$prompt [y/N] " reply
    [[ "$reply" =~ ^[Yy]$ ]]
}

# ---------- subcommands ----------

cmd_help() {
    cat <<EOF
Laravel Strict skill installer

Usage:
  $0 [options]

Options:
  --global             Install into ~/.agents/skills/ and ~/.claude/skills/
  --local [DIR]        Install into DIR/.agents/skills/laravel-strict (default: CWD)
  --uninstall          Remove laravel-strict from any known location
  --yes, -y            Accept defaults (local install in CWD)
  --dry-run            Show what would happen, change nothing
  --no-clean           Skip removing old laravel-strict entries
  --version, -v        Print installed and latest version
  --help, -h           Show this help

Examples:
  $0 --global --yes
  $0 --local ~/Projects/my-app --yes
  $0 --uninstall
EOF
}

cmd_version() {
    local installed="not installed"
    for d in "$HOME/.agents/skills/$SKILL_NAME" "$(pwd)/.agents/skills/$SKILL_NAME"; do
        if [[ -d "$d" ]]; then
            installed="$(cd "$d" && git describe --tags 2>/dev/null || echo unknown) (at $d)"
            break
        fi
    done

    local latest="unknown"
    if command -v git >/dev/null 2>&1; then
        latest="$(git ls-remote --tags --sort='-v:refname' "$REPO_URL" 2>/dev/null \
            | head -n1 | sed 's/.*refs\/tags\///')"
    fi

    printf 'installed: %s\nlatest:    %s\n' "$installed" "$latest"
}

# ---------- install ----------

install_global() {
    local canonical="$HOME/.agents/skills/$SKILL_NAME"
    local claude_link="$HOME/.claude/skills/$SKILL_NAME"

    if [[ "$NO_CLEAN" != "yes" && -e "$canonical" ]]; then
        warn "Removing existing $canonical"
        run rm -rf "$canonical"
    fi

    log "Cloning $REPO_URL -> $canonical"
    run git clone --depth 1 "$REPO_URL" "$canonical"

    if [[ -e "$claude_link" || -L "$claude_link" ]]; then
        run rm -f "$claude_link"
    fi
    log "Linking ~/.claude/skills/$SKILL_NAME -> ~/.agents/skills/$SKILL_NAME"
    run ln -s "../../.agents/skills/$SKILL_NAME" "$claude_link"

    ok "Installed globally. Use: /laravel-strict"
}

install_local() {
    local dir="${LOCAL_DIR:-$PWD}"
    [[ -d "$dir" ]] || fail "Directory does not exist: $dir"

    local target="$dir/.agents/skills/$SKILL_NAME"

    if [[ "$NO_CLEAN" != "yes" && -e "$target" ]]; then
        warn "Removing existing $target"
        run rm -rf "$target"
    fi

    log "Cloning $REPO_URL -> $target"
    run git clone --depth 1 "$REPO_URL" "$target"

    ok "Installed locally at $target. Use: /laravel-strict"
}

cmd_install() {
    if [[ "$GLOBAL" == "yes" ]]; then
        install_global
    elif [[ -n "$LOCAL_DIR" || "$YES" == "yes" ]]; then
        install_local
    else
        # Interactive
        echo "Where to install Laravel Strict?"
        echo "  1) Globally (~/.agents/skills/ + ~/.claude/skills/ symlink)"
        echo "  2) Locally in this project ($(pwd))"
        read -r -p "Choose [1/2]: " choice
        case "$choice" in
            1) install_global ;;
            2) install_local ;;
            *) fail "Invalid choice" ;;
        esac
    fi
}

# ---------- uninstall ----------

cmd_uninstall() {
    local removed=0

    for path in \
        "$HOME/.claude/skills/$SKILL_NAME" \
        "$HOME/.agents/skills/$SKILL_NAME" \
        "$PWD/.agents/skills/$SKILL_NAME"; do
        if [[ -L "$path" ]]; then
            log "Removing symlink $path"
            run rm -f "$path"
            removed=$((removed + 1))
        elif [[ -d "$path" ]]; then
            if confirm "Remove directory $path ?"; then
                run rm -rf "$path"
                removed=$((removed + 1))
            fi
        fi
    done

    if [[ "$removed" -eq 0 ]]; then
        log "No laravel-strict installation found."
    else
        ok "Removed $removed location(s)."
    fi
}

# ---------- dispatch ----------

case "$ACTION" in
    help)      cmd_help ;;
    version)   cmd_version ;;
    install)   cmd_install ;;
    uninstall) cmd_uninstall ;;
    *)         cmd_help; exit 2 ;;
esac