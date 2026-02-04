#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
SKILLS_DIR="$CODEX_HOME/skills"

mkdir -p "$SKILLS_DIR"

skills=(
  "webapp-orchestrator"
  "webapp-researcher"
  "webapp-architect-directive"
  "webapp-uiux-designer"
  "webapp-implementer"
  "webapp-reviewer"
  "webapp-reviewer-lite"
)

for skill in "${skills[@]}"; do
  src="$ROOT_DIR/$skill"
  dest="$SKILLS_DIR/$skill"
  if [ ! -d "$src" ]; then
    echo "missing skill directory: $src" >&2
    exit 1
  fi
  if [ -e "$dest" ]; then
    echo "exists: $dest"
    continue
  fi
  ln -s "$src" "$dest"
  echo "linked: $dest -> $src"
done
