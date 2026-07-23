# Documentation — Ansible Var Lens

## Index

| Doc | Audience | Contenuto |
|-----|----------|-----------|
| [`user/guide.md`](user/guide.md) | utenti | setup, uso, effective vars, hover, vault, troubleshooting (AVL-14) |
| [`user/demo-script.md`](user/demo-script.md) | utenti | storyboard/script della demo video 5min (AVL-16) |
| [`../CONTRIBUTING.md`](../CONTRIBUTING.md) | dev | setup, TDD, convenzioni commit/release, PR (AVL-15) |
| [`architecture/rfc-plugin-api.md`](architecture/rfc-plugin-api.md) | dev | RFC Plugin API per resolver/transformer custom (AVL-17) |
| [`testing-release.md`](testing-release.md) | dev | testing + release + troubleshooting Marketplace (401) |
| [`backlog.md`](backlog.md) | tutti | sorgente unica roadmap + milestone |

## Backlog & Milestones

### Overview

Sorgente unica per il roadmap: **`docs/backlog.md`** — contiene:
- **Milestones** (v0.3.0, v0.4.0, ...) con feature pianificate
- **Item** con ID stabile `AVL-n` (Ansible Var Lens issue number)
- **Status** per ogni item: ready, `[backlog]` (RFC/research), done ✅

### Workflow

1. **Plan**: aggiungere item a `docs/backlog.md` sotto il milestone appropriato
2. **Release**: eseguire `./docs/scripts/new-release.sh <minor|patch>` per bumpare versione + tag
3. **Sync**: push del tag trigga GitHub Action `backlog-sync.yml` che:
   - Crea milestone in GitHub se non esiste
   - Crea issue per ogni item `AVL-n`
   - Applica label `backlog` o `backlog,rfc`
4. **Track**: sviluppatori muovono item tra sezioni del backlog; CI gate verifica coerenza

### Command Reference

**Create a new release (fully automated):**
```bash
./docs/scripts/new-release.sh minor    # v0.3.0 → v0.4.0 (auto commit + tag)
./docs/scripts/new-release.sh patch    # v0.3.0 → v0.3.1 (auto commit + tag)
./docs/scripts/new-release.sh 1.0.0    # explicit version (auto commit + tag)
```

Script automatically:
- Bumps `package.json` version
- Prepares `CHANGELOG.md` stub
- Opens editor to edit CHANGELOG
- **Commits** the changes
- **Creates git tag**

Then just push:
```bash
git push origin main --follow-tags
```

### Structure

```
docs/
├── README.md           ← Questo indice
├── backlog.md          ← Sorgente unica: milestones + item status
├── testing-release.md  ← Testing + release + troubleshooting Marketplace
├── user/
│   ├── guide.md        ← User guide (AVL-14)
│   └── demo-script.md  ← Storyboard demo video (AVL-16)
├── architecture/
│   └── rfc-plugin-api.md  ← RFC Plugin API (AVL-17)
└── scripts/
    └── new-release.sh  ← Release helper
```

### TDD Standard

LocalL **pre-commit hook** enforces TDD: tests must pass before any commit is allowed.

CI: Sequential gates in `.github/workflows/ci.yml`:
- `test`: npm test (TDD gate)
- `type-check`: tsc --noEmit
- `build`: npm run build
- `package`: creates .vsix (only on tags)
- `publish-marketplace`: auto-publishes (only on tags + VSCE_PAT)

## CI Gates

- **test-type-check-build**: sequential gates, each must pass before next
- **backlog-lint**: verifica ID stabili, niente duplicati (TODO)
- **backlog-sync**: su tag release, sincronizza con GitHub Milestones

### Labels

- `backlog` — item in backlog
- `rfc` — richiede discussione/design (non ready yet)
- `ready` — può essere sviluppato subito
- `priority-high` — urgent, target per prossimo milestone
