#!/bin/bash
# Daily backup script

DATE=$(date +%Y%m%d)
BACKUP_DIR="handover/snapshots/$DATE"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Copy critical files
cp docs/PROJECT_STATE.md "$BACKUP_DIR/"
cp docs/COMPONENT_REGISTRY.md "$BACKUP_DIR/"
cp -r src/ "$BACKUP_DIR/" 2>/dev/null || true

# Git backup
git add .
git commit -m "Daily backup - Day $(date +%d)"

echo "✅ Daily backup completed: $BACKUP_DIR"