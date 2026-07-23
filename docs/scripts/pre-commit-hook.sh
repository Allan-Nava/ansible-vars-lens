#!/bin/bash
#
# pre-commit-hook.sh — enforce TDD: tests must pass before commit
#
# Installation:
#   ln -sf ../../docs/scripts/pre-commit-hook.sh .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit
#
# This hook runs on `git commit` and prevents commit if tests fail.

set -e

echo "🧪 Running pre-commit TDD checks..."
echo ""

# Check if we're in a git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository"
    exit 1
fi

# Run tests
echo "→ Running unit tests..."
if ! npm test 2>&1 | tail -20; then
    echo ""
    echo "❌ Tests failed. Commit rejected."
    echo "💡 Fix tests and try again: npm test"
    exit 1
fi

# Run type check
echo ""
echo "→ Running TypeScript type check..."
if ! npx tsc --noEmit 2>&1 | head -20; then
    echo ""
    echo "❌ Type check failed. Commit rejected."
    echo "💡 Fix types and try again: npx tsc --noEmit"
    exit 1
fi

echo ""
echo "✅ All TDD checks passed!"
echo "   → Tests: ✅"
echo "   → Types: ✅"
echo "   → Ready to commit"
