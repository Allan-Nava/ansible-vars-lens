#!/bin/bash
#
# new-release.sh — manage Ansible Var Lens release & backlog sync
#
# Usage:
#   ./docs/scripts/new-release.sh minor    # bump minor, tag, prepare CHANGELOG
#   ./docs/scripts/new-release.sh patch    # bump patch, tag, prepare CHANGELOG
#   ./docs/scripts/new-release.sh X.Y.Z    # explicit version
#
# Do NOT push; script only prepares the commit and tag.
# Sync to GitHub Milestone: CI workflow (on tag push) handles automatic issue/milestone creation.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

CURRENT_VERSION=$(grep '"version"' package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')

if [[ -z "$1" ]]; then
    echo "Usage: $0 <minor|patch|X.Y.Z>"
    echo "Current version: $CURRENT_VERSION"
    exit 1
fi

# Parse version bump
if [[ "$1" == "minor" ]]; then
    IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"
    NEW_VERSION="$MAJOR.$((MINOR + 1)).0"
elif [[ "$1" == "patch" ]]; then
    IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"
    NEW_VERSION="$MAJOR.$MINOR.$((PATCH + 1))"
elif [[ "$1" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    NEW_VERSION="$1"
else
    echo "Invalid version: $1. Use minor, patch, or X.Y.Z"
    exit 1
fi

echo "Bumping $CURRENT_VERSION → $NEW_VERSION"

# Update package.json version
sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json

# Prepare CHANGELOG entry (user fills in details)
CHANGELOG_ENTRY="## $NEW_VERSION

### Added

- (add your additions)

### Changed

- (add your changes)

### Fixed

- (add your fixes)

"

# Insert into CHANGELOG.md
{
    head -1 CHANGELOG.md  # Keep "# Changelog" header
    echo ""
    echo "$CHANGELOG_ENTRY"
    tail -n +2 CHANGELOG.md
} > CHANGELOG.md.tmp && mv CHANGELOG.md.tmp CHANGELOG.md

echo ""
echo "✅ Updated package.json and CHANGELOG.md"
echo "📝 Edit CHANGELOG.md to fill in release details"
echo ""
echo "Then run:"
echo "  git add package.json CHANGELOG.md"
echo "  git commit -m 'Release $NEW_VERSION'"
echo "  git tag -a v$NEW_VERSION -m 'Release $NEW_VERSION'"
echo "  git push origin main --follow-tags"
