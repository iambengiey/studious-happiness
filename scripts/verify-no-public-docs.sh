#!/usr/bin/env bash
set -euo pipefail

blocked_dirs=(dist build out public)
found=0

for dir in "${blocked_dirs[@]}"; do
  if [[ -d "$dir" ]]; then
    if find "$dir" -type f \( -name "*.md" -o -name "*.txt" \) | grep -q .; then
      echo "Blocked docs found under $dir:"
      find "$dir" -type f \( -name "*.md" -o -name "*.txt" \)
      found=1
    fi
  fi
done

if [[ $found -eq 1 ]]; then
  exit 1
fi

echo "No .md/.txt files found in public build directories."
