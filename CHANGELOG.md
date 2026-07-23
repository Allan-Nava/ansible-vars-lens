# Changelog

## 0.3.0 (Planned)

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
