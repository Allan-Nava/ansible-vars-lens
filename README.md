# Ansible Var Lens

**See the *effective* value of every Ansible variable, per host.**

In any non-trivial Ansible repo, the daily question is *"what is the final value of this variable for host X?"* — and the answer is buried under the precedence rules of `group_vars/all`, `group_vars/<group>`, `host_vars/<host>`, inventory `[group:vars]` and inline host vars. Ansible Var Lens answers it inside VS Code.

## Features

- **Inventory explorer** — activity-bar view with groups and hosts (INI and YAML inventories, multiple files, `[group:children]`, host ranges tolerated).
- **Effective variables per host** — click a host to open a YAML document with every variable *merged with Ansible's precedence*, each one annotated with the file it comes from and the files it overrides:

  ```yaml
  # from: host_vars/web-01/override.yml
  #   overrides: group_vars/all/base.yml
  #   overrides: group_vars/web/main.yml
  timeout: 90
  ```

- **`{{ variable }}` hovers** — pick a host (status bar), then hover any `{{ var }}` in playbooks/templates to see its resolved value for that host and where it was defined.
- **Vault-aware** — fully vault-encrypted files are skipped and reported; inline `!vault` scalars show as `<vaulted>`.
- **Zero setup** — reads `ansible.cfg` (`inventory = ...`) or auto-detects `./inventory`, `./hosts`; `group_vars`/`host_vars` as single files or directories, next to the repo root or the inventory.

## Merge order modeled

Lowest → highest precedence (Ansible's inventory layer, `hash_behaviour=replace`):

1. inventory `[group:vars]` (parents before children)
2. `group_vars/all`
3. `group_vars/<group>` (parents before children, alphabetical within the same depth)
4. inline inventory host vars (`ansible_host=…`)
5. `host_vars/<host>`

Role defaults/vars and play vars are out of scope: they belong to plays, not to the inventory layer this extension models.

## Settings

| Setting | Default | Description |
|---|---|---|
| `ansibleVarLens.inventoryPaths` | `[]` | Inventory files/dirs relative to the workspace root. Empty = auto-detect. |

## Development

```bash
npm install
npm run build        # bundle to dist/
npm test             # unit tests (pure Node, no VS Code needed)
# F5 in VS Code launches the Extension Development Host
```

The core (inventory parser + resolver) is dependency-free of the VS Code API and lives in `src/core/` — that's what the tests cover. Optional smoke test against a real repo:

```bash
AVL_SMOKE_REPO=/path/to/your/ansible/repo npm test
```

## License

MIT
