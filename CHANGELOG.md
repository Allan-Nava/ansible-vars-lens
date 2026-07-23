# Changelog

## 0.1.0

- Inventory explorer (INI + YAML inventories, multiple files, group children).
- Effective variables per host with provenance and override chain.
- `{{ variable }}` hover resolution for the selected host (status-bar picker).
- Vault awareness: encrypted files skipped and reported, `!vault` scalars masked.
- Auto-detection of inventory from `ansible.cfg` or conventional paths.
