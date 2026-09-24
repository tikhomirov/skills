#!/usr/bin/env bash
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_SRC="$REPO_ROOT/skills"

if [ ! -d "$SKILL_SRC" ]; then
    echo "Error: Skill source directory not found at $SKILL_SRC"
    exit 1
fi

ALL_SKILLS=()
for dir in "$SKILL_SRC"/*; do
    if [ -d "$dir" ]; then
        ALL_SKILLS+=("$(basename "$dir")")
    fi
done

install_target() {
    local DEST="$1"
    local TYPE="$2"
    shift 2
    local SKILLS=("$@")

    mkdir -p "$DEST"
    for SKILL in "${SKILLS[@]}"; do
        local SRC_PATH="$SKILL_SRC/$SKILL"
        local TARGET_PATH="$DEST/$SKILL"

        if [ ! -d "$SRC_PATH" ]; then
            echo "Warning: Skill '$SKILL' not found in $SKILL_SRC, skipping."
            continue
        fi

        rm -rf "$TARGET_PATH"
        if [ "$TYPE" = "copy" ]; then
            cp -r "$SRC_PATH" "$TARGET_PATH"
        else
            ln -sf "$SRC_PATH" "$TARGET_PATH"
        fi
    done
    echo "✔ Installed ${#SKILLS[@]} skill(s) to $DEST via $TYPE"
}

# Destinations
AGENTS_GLOBAL="$HOME/.agents/skills"
OPENCODE_GLOBAL="$HOME/.config/opencode/skills"
CLAUDE_GLOBAL="$HOME/.claude/skills"
PI_GLOBAL="$HOME/.pi/skills"

AGENTS_LOCAL="./.agents/skills"
OPENCODE_LOCAL="./.opencode/skills"
CLAUDE_LOCAL="./.claude/skills"
PI_LOCAL="./.pi/skills"

IS_GLOBAL=false
SELECTED_SKILLS=()

for arg in "$@"; do
    case "$arg" in
        --global|-g)
            IS_GLOBAL=true
            ;;
        --help|-h)
            echo "Usage: ./skill.sh [--global|-g] [skill1 skill2 ...]"
            echo "Available skills: ${ALL_SKILLS[*]}"
            exit 0
            ;;
        *)
            SELECTED_SKILLS+=("$arg")
            ;;
    esac
done

if [ ${#SELECTED_SKILLS[@]} -eq 0 ]; then
    SELECTED_SKILLS=("${ALL_SKILLS[@]}")
fi

echo "Installing skills: ${SELECTED_SKILLS[*]}..."

if [ "$IS_GLOBAL" = true ]; then
    install_target "$AGENTS_GLOBAL" "copy" "${SELECTED_SKILLS[@]}"
    install_target "$OPENCODE_GLOBAL" "copy" "${SELECTED_SKILLS[@]}"
    install_target "$CLAUDE_GLOBAL" "symlink" "${SELECTED_SKILLS[@]}"
    install_target "$PI_GLOBAL" "symlink" "${SELECTED_SKILLS[@]}"
else
    install_target "$AGENTS_LOCAL" "copy" "${SELECTED_SKILLS[@]}"
    install_target "$OPENCODE_LOCAL" "copy" "${SELECTED_SKILLS[@]}"
    install_target "$CLAUDE_LOCAL" "symlink" "${SELECTED_SKILLS[@]}"
    install_target "$PI_LOCAL" "symlink" "${SELECTED_SKILLS[@]}"
fi

echo "Installation complete!"
