# CLAUDE.md — ansible-vars-lens

VS Code extension per la risoluzione e visualizzazione di variabili Ansible. Resolver di contesto YAML, inventari e valori di variabili dinamiche direttamente nell'editor.

## Regole di lavoro (SEMPRE)

- **Ogni commit = release taggata `vX.Y.Z`**: nuova sezione in `CHANGELOG.md` (Keep a Changelog, in italiano) + `git tag -a vX.Y.Z -m "Release X.Y.Z"`. Bump `minor` per novità sostanziali (nuove feature, refactoring, rimozioni), `patch` per fix/aggiornamenti. Senza chiederlo. **Esenti** (niente tag/CHANGELOG): auto-commit `feat:`/`Add …` su `.claude/settings.json` (hook permessi) e commit `report:` delle build CI.
- **MAI `git push`** — lo fa sempre l'utente. MAI `Co-Authored-By` nei commit.
- **Documentare SEMPRE** feature, debug e interventi: doc `.md` in `docs/` (opzionale: `docs/incidents/` per bug rilevanti, `docs/architecture/` per decisioni tecniche). **Senza chiederlo**. Ogni doc: **schema/diagramma ASCII**, esempio di uso, voce nella **nav di documentazione** (se presente).
- **Allineare tutto**: ogni modifica fattuale va propagata a `.md`, `.ts`, `.json`, `README.md`, CHANGELOG, test correlati. Doc nuove separate `user/` vs `dev/` sin dalla v1.
- **Todo → `docs/backlog.md`** (sorgente unica, item con id stabile `AVL-n`, sincronizzata con GitHub Milestones). Il `BACKLOG.md` in root è solo un puntatore. Non sparpagliare TODO nei commenti.
- **Verificare i test** prima di commit: `npx tsc --noEmit` + `npm test` devono passare completamente (stessi gate della CI).

## Pattern per interventi su feature (validato)

1. **Analisi**: verificare il contesto del codice, i test esistenti e le dipendenze di resolver.
2. **Implementazione**: modificare il codice mantenendo coerenza con `core/` (inventory, resolver, yamlutil).
3. **Test**: aggiungere/aggiornare test in `test/fixtures/` e `test/run.ts`.
4. **Review**: controllare che il diff sia coerente e non causi regressioni.
5. **Chiusura**: aggiornare `README.md`, `CHANGELOG.md`, creare tag di release e validare con build locale.

## Comandi

```bash
npm run build            # bundle esbuild → dist/extension.js
npm test                 # test core (Node puro, niente VS Code)
npx tsc --noEmit         # typecheck (esbuild non typecheckka)
AVL_SMOKE_REPO=/path/repo AVL_SMOKE_HOST=<host> npm test    # smoke su repo Ansible reale (sola lettura)
npx @vscode/vsce package --no-dependencies                  # .vsix locale
```

F5 apre l'Extension Host già puntato su `cnf-mng-hiway` (`.vscode/launch.json`).

## Trappole note / regole tecniche

- **Resolver YAML**: `yamlutil.ts` è il cuore della risoluzione — non fidarsi del parsing senza validazione su fixture.
- **Variabili Ansible**: possono provenire da multipli livelli (inventario, group_vars, host_vars, defaults). Sempre verificare la precedence.
- **Context YAML**: il contesto deve includere il file path per risolvere include/import relativi.
- **Test fixture**: tutti gli scenari devono avere fixture in `test/fixtures/` — non asserire senza dati reali.
- Build: `npm run build` genera bundle ottimizzato — verificare il weight prima di commit.
- Dipendenze: minimizzare le dipendenze esterne — prediligere soluzioni native di VS Code API.
- **Precedenza modellata = solo layer inventory/vars-files** (`hash_behaviour=replace`): role defaults/vars e play vars sono fuori scope, non aggiungerli senza ridisegnare.
- **File non-YAML dentro `host_vars/<host>/` vanno ignorati** (nei repo reali ci sono `.cfg`); file interamente vault-cifrati si saltano e si segnalano, MAI errore.
- `test/run.ts` NON può usare top-level await (per tsc è CJS): tutto dentro `main()`. Il bundle test è ESM con banner `createRequire` in `esbuild.mjs`.
- Il `publisher` in `package.json` è un placeholder: allinearlo al publisher Marketplace reale prima di `vsce publish`.

## Puntatori

- Documentazione: `README.md` (overview), `CHANGELOG.md` (cronologia), `package.json` (metadata/script)
- Architecture: `src/extension.ts` (entry point), `src/core/resolver.ts` (logica principale)
- Test: `test/run.ts` (runner), `test/fixtures/` (dati di test)
- Build: `esbuild.mjs` (configurazione bundle), `tsconfig.json` (config TypeScript)
