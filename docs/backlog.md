# Backlog — Ansible Var Lens

**Sorgente unica** per feature in progress e pianificate. Sincronizzato con GitHub Milestones via `new-release.sh`.
Ogni item ha ID stabile `AVL-n` per rintracciabilità cross-commit.

## Milestones

### v0.3.0 — Core Improvements

| ID | Status | Title | Description |
|----|--------|-------|-------------|
| AVL-1 | `[backlog]` | Variable search/filter | Aggiungere search bar nell'inventory view per filtrare host/group/var. Supportare regex. |
| AVL-2 | `[backlog]` | Vault batch decrypt | Opzione per decryptare bulk `!vault` scalars su richiesta (con `ansible-vault`). |
| AVL-3 | `[backlog]` | Copy var to clipboard | Tasto destro su variabile → copia valore/path. |
| AVL-4 | `[backlog]` | Multi-host comparison | Selezionare 2+ host e vedere variabili side-by-side (diff). |

### v0.4.0 — Performance & UX (Next)

| ID | Status | Title | Description |
|----|--------|-------|-------------|
| AVL-5 | `[backlog]` | Cache invalidation | Aggiungere debounce su FS watch per ridurre parsing ripetuti. |
| AVL-6 | `[backlog]` | Slow inventory warning | Se parsing > 2s, avvisare l'utente e suggerire optimization. |
| AVL-7 | `[backlog]` | Syntax highlight in merged doc | Evidenziare source file comment e indentation per facilità lettura. |

### v0.5.0 — Advanced Features

| ID | Status | Title | Description |
|----|--------|-------|-------------|
| AVL-8 | `[backlog]` | Role defaults/play vars scope | [RFC] Estendere risolutore oltre inventory layer (out-of-scope al momento). |
| AVL-9 | `[backlog]` | Template variable preview | Preview di template Jinja2 con var risolte. |
| AVL-10 | `[backlog]` | Inventory graph visualization | Visualizzare group hierarchy come DAG/tree interattivo. |

### v0.6.0 — Integration & Polish

| ID | Status | Title | Description |
|----|--------|-------|-------------|
| AVL-11 | `[backlog]` | MarketPlace icon/branding | Design icona estesa + screenshot showcase. |
| AVL-12 | `[backlog]` | Diagnostics rules | Segnalare variabili non-risolte, undefined inventory path, vault errors in Problems panel. |
| AVL-13 | `[backlog]` | Config migration guide | Helper per utenti da extension vecchie / config legacy. |

## Done (v0.1 → v0.4)

| ID | Status | Title |
|----|--------|-------|
| — | ✅ | Inventory explorer (INI + YAML) |
| — | ✅ | Effective variables per host |
| — | ✅ | `{{ variable }}` hover resolution |
| — | ✅ | Vault awareness |
| — | ✅ | Auto-detection inventory path |
| — | ✅ | `claude.md` + `agents.md` + automation skeleton |
| — | ✅ | Backlog automation + release workflow |
| — | ✅ | TDD Standard (pre-commit hook + CI gates) |
| — | ✅ | VS Code Marketplace automated publishing |

## Guidelines

- **Label `[backlog]`** = item NON proposto come "next milestone" ancora (e.g., RFC, research-needed, design TBD).
- **No label** = ready for development (definito, stima chiara).
- **Status update**: ogni commit che chiude un item deve aggiornare questo file (move a Done, update status).
- **Idempotent**: backlog-lint CI gate verifica coerenza ID (unici, sequ.contiguity nella colonna ID).
