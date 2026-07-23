# Testing & Release — Ansible Var Lens

## TDD Standard

Ogni commit deve rispettare **Test-Driven Development**:

### Before coding

1. Scrivi il test che fallisce: `test/fixtures/` (dati di test reali)
2. Modifica il codice in `src/core/` o `src/extension.ts` finché il test passa
3. Commit solo dopo che `npm test` passa **completamente**

### CI/CD Gates (GitHub Actions)

La pipeline `.github/workflows/ci.yml` applica gate sequenziali:

```
→ test (npm test)           ❌ FAIL = pipeline stop
    ↓
→ type-check (tsc --noEmit)  ❌ FAIL = pipeline stop
    ↓
→ build (npm run build)      ❌ FAIL = pipeline stop
    ↓
→ package (.vsix)            ✅ only on tag
    ↓
→ publish-marketplace         ✅ only on tag + VSCE_PAT configured
```

**Ogni gate deve passare** prima di procedere al successivo. Se un test fallisce, la pipeline si ferma.

## Local Testing

Prima di commitare:

```bash
# Run all unit tests
npm test

# Type check
npx tsc --noEmit

# Build bundle
npm run build

# Smoke test on real Ansible repo (optional)
AVL_SMOKE_REPO=/path/to/ansible/repo npm test
```

Se **qualunque comando falisce**, non commitare fino a fix.

## Release Workflow

### 1. Prepare release (fully automated)

```bash
./docs/scripts/new-release.sh minor  # or patch, or X.Y.Z
```

This automatically:
- Bumps `package.json` version
- Prepares `CHANGELOG.md` stub
- Opens editor to edit CHANGELOG (fill in details)
- **Commits** the changes
- **Creates git tag**

### 2. Push (triggers CI)

```bash
git push origin main --follow-tags
```

That's it! GitHub Actions handles everything else.

### Automatic actions on tag push

- \u2705 **test** (`npm test`) must pass
- \u2705 **type-check** (`tsc --noEmit`) must pass
- \u2705 **build** (`npm run build`) must pass
- \ud83d\udce6 **package** creates `.vsix` \u2192 uploaded to GitHub Releases
- \ud83c\udfaf **backlog-sync** syncs `docs/backlog.md` \u2192 GitHub Milestones + Issues
- \ud83d\ude80 **publish-marketplace** auto-publishes to Marketplace (if `VSCE_PAT` secret configured)

## VS Code Marketplace Publishing

### Prerequisites

1. **Create PAT** on Visual Studio Team Services:
   - Go to https://dev.azure.com/
   - Personal Access Tokens → New Token
   - Scopes: `Marketplace (Manage)`
   - Copy token

2. **Add GitHub Secret**:
   - Repo Settings → Secrets and variables → Actions
   - New repository secret: `VSCE_PAT` = <your-token>

3. **Setup environment** (optional, adds approval gate):
   - Settings → Environments → New environment `marketplace`
   - (Approval required before publish)

### Automatic publish

On every tag push:
- If `VSCE_PAT` secret exists → auto-publish to Marketplace
- If not configured → skip with warning, link to setup docs

### Manual publish (if needed)

```bash
npm ci
npx @vscode/vsce publish --pat <TOKEN> --no-dependencies
```

## Test Coverage Guidelines

- **Core resolver** (`src/core/resolver.ts`): 100% coverage in fixtures
- **YAML parser** (`src/core/yamlutil.ts`): edge cases (vault, anchors, flow collections)
- **Inventory loader** (`src/core/inventory.ts`): INI, YAML, group_vars paths
- **Extension entry point** (`src/extension.ts`): VS Code API mocks (optional)

## CI Status

Current status: [![CI/CD](https://github.com/Allan-Nava/ansible-var-lens/actions/workflows/ci.yml/badge.svg)](https://github.com/Allan-Nava/ansible-var-lens/actions/workflows/ci.yml)

## Troubleshooting

**Tests fail locally but pass in CI?**
- Likely Node version difference: use Node 20 (same as CI)
- Check `test/fixtures/` paths are relative

**Type check fails?**
- Run `npx tsc --noEmit` to see full error
- Add type annotations if needed

**Build too large?**
- Run `npm run build` and check `dist/extension.js` size
- Look for large dependencies in `node_modules/`

**Marketplace publish fails?**
- Verify `VSCE_PAT` is correct (Personal Access Token, not regular PAT)
- Check Publisher name matches `package.json`: `allannava95`

### `401 Failed request` durante `vsce publish` (diagnosi 2026-07-23)

Sintomo: il job `publish-marketplace` arriva fino a `Publishing 'allannava95.ansible-var-lens vX.Y.Z'...`
poi cade con `##[error]Failed request: (401)`. Il secret `VSCE_PAT` **è presente** (quindi lo skip
non scatta), ma l'autenticazione al Marketplace viene rifiutata.

```
Test/TypeCheck/Build/Package  →  ✓
Publish to VS Code Marketplace →  ✗  Failed request: (401)
```

Il `401` è sempre un problema di credenziali, non di build. Checklist di fix (tutto lato account):

1. **PAT scaduto / revocato / scope errato.** Rigenerare su
   https://dev.azure.com → User settings → Personal Access Tokens con:
   - Organization: **All accessible organizations**
   - Scopes: **Marketplace → Manage** (non solo "Publish").
   Poi aggiornare il secret: `gh secret set VSCE_PAT`.
2. **Publisher inesistente.** Il publisher `allannava95` deve esistere su
   https://marketplace.visualstudio.com/manage e appartenere all'account che ha emesso il PAT.
3. **Test rapido locale** (senza pubblicare): `npx @vscode/vsce verify-pat allannava95 --pat <PAT>`.
