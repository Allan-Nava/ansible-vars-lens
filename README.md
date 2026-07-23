<p align="center">
  <img src="https://raw.githubusercontent.com/Allan-Nava/ansible-vars-lens/main/media/icon.png" alt="Ansible Var Lens logo" width="128" height="128">
</p>

<h1 align="center">Ansible Var Lens</h1>

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
- **Compare two hosts** — right-click a host ▸ *Compare Effective Variables Between Hosts* (or run the command) to open a document with **only the variables that differ** — `changed` / only-in-A / only-in-B, each with its provenance.
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

## Documentation

- 📖 **[User Guide](docs/user/guide.md)** — setup, usage, effective vars, hover, vault, troubleshooting
- 🎬 **[Demo script](docs/user/demo-script.md)** — storyboard della demo video (5 min)
- 🤝 **[Contributing](CONTRIBUTING.md)** — dev setup, TDD, convenzioni commit/release, PR
- 🧩 **[RFC: Plugin API](docs/architecture/rfc-plugin-api.md)** — design per resolver/transformer custom
- 🗺️ **[Backlog & roadmap](docs/backlog.md)** — milestone e item `AVL-n`

Indice completo in [`docs/README.md`](docs/README.md).

## Development

### Setup (TDD enforced locally)

```bash
./docs/scripts/setup-dev-environment.sh
```

This installs npm packages and git pre-commit hook that enforces TDD: **tests must pass before commit**.

### Development workflow

```bash
npm test             # run all unit tests (must pass before commit)
npm run build        # bundle to dist/ (after tests pass)
npx tsc --noEmit     # type check
# F5 in VS Code launches the Extension Development Host
```

The core (inventory parser + resolver) is dependency-free of the VS Code API and lives in `src/core/` — that's what the tests cover. Optional smoke test against a real repo:

```bash
AVL_SMOKE_REPO=/path/to/your/ansible/repo npm test
```

## Release & Publishing

### Backlog & Milestones

Roadmap in **[`docs/backlog.md`](docs/backlog.md)** (sorgente unica per milestones + feature planning).

### Create a release (automated)

```bash
./docs/scripts/new-release.sh minor    # bumps version, commits, and tags automatically
# (Edits CHANGELOG.md in your editor — fill in details)

# Then just push:
git push origin main --follow-tags
```

That's it! GitHub Actions automatically:
- ✅ Runs tests + type check + build
- 📦 Creates `.vsix` → GitHub Releases
- 🚀 Publishes to VS Code Marketplace (if `VSCE_PAT` secret configured)

## License

MIT
