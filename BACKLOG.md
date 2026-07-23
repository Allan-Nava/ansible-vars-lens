# Backlog — ansible-vars-lens

Sorgente unica dei todo. Id stabili `AVL-n`; spuntare, non cancellare.

## v0.2

- [ ] **AVL-1 — Go-to-definition**: dal nome variabile (hover/doc risolto) al file+riga che la definisce; già abbiamo il path vincente, manca la riga.
- [ ] **AVL-2 — Diff variabili tra due host**: comando "Compare hosts" → doc affiancato con le sole variabili che differiscono.
- [ ] **AVL-3 — CodeLens "overridden"**: sopra una variabile in group_vars, lens "sovrascritta per N host da …".

## v0.3+

- [ ] **AVL-4 — vars_files / vars di playbook**: layer opzionale sopra l'inventory (parse dei play).
- [ ] **AVL-5 — Espansione host ranges** `web[01:20]` nell'inventory explorer.
- [ ] **AVL-6 — Cache della resolution**: invalidazione dal watcher invece di risolvere a ogni hover (oggi ok fino a ~centinaia di host).

## Rilascio

- [ ] **AVL-7 — Publish sul Marketplace**: publisher reale in `package.json`, icona PNG 128px, screenshot/GIF nel README, `vsce publish`.
