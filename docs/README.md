# Documentation — Ansible Var Lens

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

**Create a new release:**
```bash
./docs/scripts/new-release.sh minor    # v0.3.0 → v0.4.0
./docs/scripts/new-release.sh patch    # v0.3.0 → v0.3.1
./docs/scripts/new-release.sh 1.0.0    # explicit version
```

Script prepara:
- `package.json` versione aggiornata
- `CHANGELOG.md` stub (riempire manualmente)
- Istruzioni per commit + tag + push

**No automatic push** — lascia al developer il controllo.

### Structure

```
docs/
├── backlog.md          ← Sorgente unica: milestones + item status
├── scripts/
│   └── new-release.sh  ← Release helper
└── architecture/       ← Design decision records (optional)
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
