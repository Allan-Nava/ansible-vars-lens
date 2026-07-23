# Changelog

## 0.8.0

### Added

- **Milestone v0.8.0 — Variable insight**:
  - **Diff variabili tra due host (AVL-18)**: nuovo comando *"Compare Effective Variables
    Between Hosts"* (anche da menu contestuale su un host) → documento con le sole variabili
    che differiscono (`changed` / only-in-A / only-in-B), ciascuna con la provenance.
    Core: `diffHosts()` + `renderDiff()` in `src/core/resolver.ts`, coperti da test.
  - Pianificati: Go-to-definition (AVL-19), CodeLens "overridden" (AVL-20).
- Logo nel `README.md` (header centrato con `media/icon.png`).

### Fixed

- **URL repository errato** in `package.json`: era `ansible-var-lens` (senza `s`), il repo
  reale è `ansible-vars-lens`. Correggeva link rotti su Marketplace (Repository/Support/Learn)
  e il rendering delle immagini relative.

## 0.7.0

### Added

- **Documentation & Community** (milestone v0.7.0):
  - User guide completa `docs/user/guide.md` — setup, uso, effective vars, hover, vault, troubleshooting (AVL-14)
  - `CONTRIBUTING.md` — dev setup, standard TDD, convenzioni commit/release, PR guidelines (AVL-15)
  - Storyboard/script della demo video 5min `docs/user/demo-script.md` (AVL-16, video da registrare a parte)
  - RFC di design `docs/architecture/rfc-plugin-api.md` per Plugin API (custom resolver/transformer) (AVL-17)
- Sezione **Documentation** nel `README.md` e indice in `docs/README.md`.

### Changed

- **Backlog consolidato**: `docs/backlog.md` è l'unica sorgente; il `BACKLOG.md` in root
  (che aveva una numerazione divergente AVL-1…AVL-7) è ora solo un puntatore. Aggiornata
  la regola in `CLAUDE.md`.

## 0.6.1

### Fixed

- **Icona Marketplace reale**: aggiunto logo PNG 256×256 (`media/icon.png`, lente su layer di variabili con precedence) e collegato al campo `icon` top-level di `package.json`. Prima esisteva solo l'icona SVG dell'activity bar, quindi il listing Marketplace era privo di logo.
- **Diagnosi publish Marketplace**: il job `publish-marketplace` falliva con `401 Failed request`. Il secret `VSCE_PAT` è presente ma il token è scaduto/revocato o con scope errato, oppure il publisher `allannava95` non è ancora creato. Va rigenerato un PAT Azure DevOps con scope **Marketplace → Manage** su **All accessible organizations** e creato il publisher su https://marketplace.visualstudio.com/manage. Vedi `docs/testing-release.md`.

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
