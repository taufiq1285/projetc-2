#!/bin/bash
# Update project state helper

echo "Updating PROJECT_STATE.md..."
echo "Current working directory: $(pwd)"
echo "Files changed today:"
git diff --name-only HEAD~1 2>/dev/null || echo "No previous commits"

echo ""
echo "Don't forget to update:"
echo "1. Current day progress"
echo "2. Completed features"
echo "3. Next task"
echo "4. Any blockers"