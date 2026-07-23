# AGENTS.md — ansible-vars-lens

VS Code extension per la risoluzione e visualizzazione di variabili Ansible. Resolver di contesto YAML, inventari e valori di variabili dinamiche direttamente nell'editor.

Questo file definisce le regole operative per gli agent (Copilot, Claude, altri tool AI) quando lavorano in questo repository.

## Regole di lavoro (SEMPRE)

- **Ogni commit = release taggata `vX.Y.Z`**: nuova sezione in `CHANGELOG.md` (Keep a Changelog, in italiano) + `git tag -a vX.Y.Z -m "Release X.Y.Z"`. Bump `minor` per novità sostanziali (nuove feature, refactoring, rimozioni), `patch` per fix/aggiornamenti. Senza chiederlo. **Esenti** (niente tag/CHANGELOG): auto-commit `feat:`/`Add …` su `.claude/settings.json` (hook permessi) e commit `report:` delle build CI.
- **MAI `git push`**: lo fa sempre l'utente. MAI `Co-Authored-By` nei commit.
- **Documentare SEMPRE** feature, debug e interventi: doc `.md` in `docs/` (opzionale: `docs/incidents/` per bug rilevanti, `docs/architecture/` per decisioni tecniche). Senza chiedere. Ogni doc: **schema/diagramma ASCII**, esempio di uso, voce nella **nav di documentazione** (se presente).
- **Allineare tutto**: ogni modifica fattuale va propagata a `.md`, `.ts`, `.json`, `README.md`, CHANGELOG, test correlati. Doc nuove separate `user/` vs `dev/` sin dalla v1.
- **Todo → `TODO.md` o issue GitHub** (sorgente unica). Non sparpagliare TODO.
- **Verificare i test**: `npm run test` deve passare completamente. Build locale con `npm run build`.

## Pattern per interventi su feature (validato)

1. **Analisi**: verificare il contesto del codice, i test esistenti e le dipendenze di resolver.
2. **Implementazione**: modificare il codice mantenendo coerenza con `core/` (inventory, resolver, yamlutil).
3. **Test**: aggiungere/aggiornare test in `test/fixtures/` e `test/run.ts`.
4. **Review**: controllare che il diff sia coerente e non causi regressioni.
5. **Chiusura**: aggiornare `README.md`, `CHANGELOG.md`, creare tag di release e validare con build locale.

## Trappole note / regole tecniche

- **Resolver YAML**: `yamlutil.ts` è il cuore della risoluzione — non fidarsi del parsing senza validazione su fixture.
- **Variabili Ansible**: possono provenire da multipli livelli (inventario, group_vars, host_vars, defaults). Sempre verificare la precedence.
- **Context YAML**: il contesto deve includere il file path per risolvere include/import relativi.
- **Test fixture**: tutti gli scenari devono avere fixture in `test/fixtures/` — non asserire senza dati reali.
- Build: `npm run build` genera bundle ottimizzato — verificare il weight prima di commit.
- Dipendenze: minimizzare le dipendenze esterne — prediligere soluzioni native di VS Code API.
- Extension API: verificare la versione di VS Code supportata prima di usare feature nuove.

## Puntatori

- Documentazione: `README.md` (overview), `CHANGELOG.md` (cronologia), `package.json` (metadata/script)
- Architecture: `src/extension.ts` (entry point), `src/core/resolver.ts` (logica principale)
- Test: `test/run.ts` (runner), `test/fixtures/` (dati di test)
- Build: `esbuild.mjs` (configurazione bundle), `tsconfig.json` (config TypeScript)
