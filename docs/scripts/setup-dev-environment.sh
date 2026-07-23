#!/bin/bash
#
# setup-dev-environment.sh — initialize local development environment with TDD hook
#
# Run once after cloning:
#   ./docs/scripts/setup-dev-environment.sh

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

echo "🚀 Setting up Ansible Var Lens development environment..."
echo ""

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Install pre-commit hook for TDD enforcement
echo "🪝 Installing pre-commit TDD hook..."
HOOK_SOURCE="$REPO_ROOT/docs/scripts/pre-commit-hook.sh"
HOOK_DEST="$REPO_ROOT/.git/hooks/pre-commit"

if [[ ! -f "$HOOK_SOURCE" ]]; then
    echo "❌ pre-commit-hook.sh not found"
    exit 1
fi

ln -sf ../../docs/scripts/pre-commit-hook.sh "$HOOK_DEST"
chmod +x "$HOOK_DEST"

echo "✅ Git pre-commit hook installed"
echo ""

# Run initial checks
echo "✔️  Running initial TDD checks..."
echo ""

if ! npm test; then
    echo "⚠️  Tests failed. Fix and run: npm test"
    exit 1
fi

if ! npx tsc --noEmit; then
    echo "⚠️  Type check failed. Fix and run: npx tsc --noEmit"
    exit 1
fi

if ! npm run build; then
    echo "⚠️  Build failed. Fix and run: npm run build"
    exit 1
fi

echo ""
echo "✅ Development environment ready!"
echo ""
echo "📝 Next steps:"
echo "   • Write test in test/fixtures/"
echo "   • Implement feature in src/core/ or src/extension.ts"
echo "   • git commit (TDD hook will verify)"
echo ""
echo "📚 Docs:"
echo "   • Testing & Release: docs/testing-release.md"
echo "   • Backlog: docs/backlog.md"
echo "   • Architecture: docs/architecture/ (optional)"
