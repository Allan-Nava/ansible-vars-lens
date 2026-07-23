# Changelog

## 0.6.0

### Added

- **Integration & Polish**:
  - Marketplace icon + branding design (AVL-11)
  - Diagnostics rules in Problems panel (AVL-12)
  - Config migration guide for legacy users (AVL-13)

## 0.5.0

### Added

- **Advanced Features**:
  - Role defaults/play vars scope (RFC) — extend resolver beyond inventory layer
  - Template variable preview with Jinja2 rendering
  - Inventory graph visualization (DAG/tree interactive view)
- Performance & UX improvements:
  - Cache invalidation with FS watch debounce
  - Slow inventory parsing warning (> 2s threshold)
  - Syntax highlight in merged variables document

## 0.4.0

### Added

- TDD Standard enforcement:
  - Pre-commit hook (`pre-commit-hook.sh`) blocks commit if tests fail
  - `setup-dev-environment.sh` initializes local environment with TDD hook
  - Enhanced CI/CD pipeline with separate test/type-check/build gates
- VS Code Marketplace automated publishing:
  - Publish workflow triggered on release tags (requires `VSCE_PAT` secret)
  - Automatic upload to Marketplace with no manual steps
- **Automated release workflow**:
  - `new-release.sh` now automatically commits and creates git tags
  - No more manual `git commit` + `git tag` steps
  - Just run `new-release.sh <version>` → `git push origin main --follow-tags`
- Documentation: `docs/testing-release.md` with TDD standard + Marketplace setup guide

## 0.3.0

### Added

- Backlog automation: `docs/backlog.md` sorgente unica per milestones + feature planning
- Release helper: `./docs/scripts/new-release.sh` per automated version bumping + CHANGELOG prep
- GitHub Action `backlog-sync.yml`: sincronizza backlog con GitHub Milestones + issue creation on tag push

## 0.2.0

### Added

- `claude.md`: regole di lavoro per Copilot/Claude nel repository.
- `agents.md`: regole operative per agent AI nel progetto.

## 0.1.0

- Inventory explorer (INI + YAML inventories, multiple files, group children).
- Effective variables per host with provenance and override chain.
- `{{ variable }}` hover resolution for the selected host (status-bar picker).
- Vault awareness: encrypted files skipped and reported, `!vault` scalars masked.
- Auto-detection of inventory from `ansible.cfg` or conventional paths.
