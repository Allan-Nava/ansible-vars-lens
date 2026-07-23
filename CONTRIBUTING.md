# Contributing — Ansible Var Lens (AVL-15)

Grazie per l'interesse! Questa guida copre setup, workflow di sviluppo, standard TDD,
convenzioni di commit/release e regole per le PR.

Per l'uso dell'estensione vedi la [User Guide](docs/user/guide.md); per la roadmap
[`docs/backlog.md`](docs/backlog.md).

---

## 1. Setup ambiente di sviluppo

```bash
git clone git@github.com:Allan-Nava/ansible-vars-lens.git
cd ansible-vars-lens
./docs/scripts/setup-dev-environment.sh   # npm install + git pre-commit hook (TDD)
```

Lo script installa le dipendenze e il **pre-commit hook** che blocca il commit se i test falliscono.

`F5` in VS Code apre l'**Extension Development Host** (già puntato su `cnf-mng-hiway` via `.vscode/launch.json`).

---

## 2. Struttura del progetto

```
ansible-vars-lens/
├─ src/
│  ├─ extension.ts        ← entry point VS Code (view, hover, comandi)
│  └─ core/               ← logica pura, SENZA VS Code API (testabile a Node)
│     ├─ inventory.ts     ← parser INI/YAML, group_vars/host_vars
│     ├─ resolver.ts      ← merge + precedence (il cuore)
│     └─ yamlutil.ts      ← parsing YAML, vault awareness
├─ test/
│  ├─ run.ts              ← runner (Node puro, niente VS Code)
│  └─ fixtures/           ← scenari reali (ogni asserzione ha dati veri)
├─ media/                 ← icona activity bar (icon.svg) + logo Marketplace (icon.png)
├─ docs/                  ← documentazione (user/ + architecture/ + backlog)
└─ esbuild.mjs            ← bundle
```

Il **core è dependency-free** dalla VS Code API: è ciò che i test coprono.

---

## 3. Comandi

```bash
npm run build          # bundle esbuild → dist/extension.js
npm test               # test core (Node puro)
npx tsc --noEmit       # typecheck (esbuild NON typecheckka)
npm run watch          # rebuild incrementale
npx @vscode/vsce package --no-dependencies    # .vsix locale

# smoke test opzionale su repo Ansible reale (sola lettura):
AVL_SMOKE_REPO=/path/to/repo AVL_SMOKE_HOST=<host> npm test
```

---

## 4. Standard TDD (obbligatorio)

**I test devono passare prima di ogni commit** — il pre-commit hook lo impone in locale
e la CI lo ri-verifica con gate sequenziali (`test` → `type-check` → `build`).

Pattern per un intervento su feature:

1. **Analisi** — contesto codice, test esistenti, dipendenze del resolver.
2. **Test-first** — aggiungi/aggiorna una fixture in `test/fixtures/` e un caso in `test/run.ts`.
   Nessuna asserzione senza dati reali.
3. **Implementazione** — modifica `src/core/` mantenendo coerenza (inventory, resolver, yamlutil).
4. **Verifica** — `npx tsc --noEmit && npm test` devono passare completamente.
5. **Chiusura** — aggiorna `README.md`, `CHANGELOG.md`, `docs/`, e lo stato in `docs/backlog.md`.

> `test/run.ts` **non** può usare top-level await (per `tsc` è CJS): tutto dentro `main()`.

---

## 5. Convenzioni di commit e release

- **Ogni commit = release taggata `vX.Y.Z`**: nuova sezione in `CHANGELOG.md`
  (formato [Keep a Changelog](https://keepachangelog.com/), in italiano) + `git tag -a vX.Y.Z`.
  - `minor` → novità sostanziali (feature, refactoring, rimozioni)
  - `patch` → fix/aggiornamenti
- Usa l'helper: `./docs/scripts/new-release.sh <minor|patch|X.Y.Z>` (bump + CHANGELOG stub + commit + tag).
- **Mai `git push`**: lo fa sempre il maintainer.
- **Mai `Co-Authored-By`** nei commit.

---

## 6. Precedence: cosa è in scope

L'estensione modella **solo il layer inventory/vars-files** (`hash_behaviour=replace`).
Role defaults/vars e play vars sono **fuori scope**: non aggiungerli senza ridisegnare
il resolver (vedi la RFC [`docs/architecture/rfc-plugin-api.md`](docs/architecture/rfc-plugin-api.md)).

Regole tecniche da rispettare:

- File **non-YAML** dentro `host_vars/<host>/` (es. `.cfg`) vanno **ignorati**.
- File interamente **vault-cifrati** si **saltano e si segnalano**, mai errore.
- Il contesto YAML deve includere il **file path** per risolvere include/import relativi.

---

## 7. Linee guida per le Pull Request

1. Crea un branch dal `main`: `git checkout -b avl-<id>-<slug>`.
2. Collega la PR a un item di backlog (`AVL-n`) — se non esiste, aggiungilo a `docs/backlog.md`.
3. Includi/aggiorna **test con fixture reali** e la **documentazione** correlata.
4. Verifica in locale: `npx tsc --noEmit && npm test` verdi + `npm run build` senza bloat.
5. Descrivi nella PR: cosa cambia, perché, come l'hai testato, eventuali regressioni note.
6. La CI deve essere verde (test, type-check, build) prima del merge.

---

## 8. Segnalare bug / proporre feature

- **Bug**: apri una issue con repro minimale, versione estensione, struttura repo (anonimizzata).
- **Feature/RFC**: proponila come item `AVL-n` in `docs/backlog.md` con label `backlog` (o `rfc` se richiede design).

Grazie per contribuire! 🎛️
