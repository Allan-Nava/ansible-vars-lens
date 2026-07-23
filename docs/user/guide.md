# User Guide — Ansible Var Lens (AVL-14)

Guida completa a **Ansible Var Lens**: setup, uso quotidiano e troubleshooting.
Se cerchi la roadmap → [`docs/backlog.md`](../backlog.md); se vuoi contribuire → [`CONTRIBUTING.md`](../../CONTRIBUTING.md).

---

## 1. Cos'è e a cosa serve

In un repo Ansible non banale la domanda di ogni giorno è:
*"qual è il valore **finale** di questa variabile per l'host X?"*

La risposta è sepolta sotto le regole di precedence di `group_vars/all`,
`group_vars/<group>`, `host_vars/<host>`, inventory `[group:vars]` e host vars inline.
Ansible Var Lens risponde **dentro VS Code**, senza lanciare `ansible-inventory --host`.

```
                 ┌──────────────────────────────────────────┐
   repo Ansible  │  ansible.cfg / inventory / group_vars /   │
   ────────────► │  host_vars                                │
                 └───────────────────┬──────────────────────┘
                                     │ parse + merge (precedence)
                                     ▼
                 ┌──────────────────────────────────────────┐
   VS Code       │  • Inventory explorer (activity bar)       │
                 │  • Effective vars per host (doc annotato)  │
                 │  • Hover su {{ var }} nei playbook         │
                 └──────────────────────────────────────────┘
```

---

## 2. Installazione

1. **Da Marketplace**: cerca *"Ansible Var Lens"* nella vista Extensions (`⇧⌘X`) e installa.
2. **Da `.vsix`**: `Extensions ▸ … ▸ Install from VSIX…` e scegli il file `ansible-var-lens-X.Y.Z.vsix`.

Requisito: VS Code `^1.85.0`. Nessuna dipendenza runtime oltre all'estensione.

L'estensione si attiva automaticamente quando il workspace contiene `ansible.cfg`,
una cartella `group_vars/` o `host_vars/` (vedi `activationEvents` in `package.json`).

---

## 3. Quick start (30 secondi)

1. Apri la cartella del tuo repo Ansible in VS Code.
2. Clicca l'icona **Ansible Inventory** nell'activity bar (il logo con la lente).
3. Espandi un gruppo, poi **clicca su un host** → si apre un documento con
   **tutte le variabili effettive** di quell'host, annotate con la provenienza.
4. (Opzionale) Dalla status bar scegli l'host attivo per gli **hover** e passa
   il mouse su un `{{ var }}` in un playbook.

---

## 4. Inventory explorer

La vista **Hosts & Groups** mostra l'inventario risolto:

```
Ansible Inventory
├─ all
│  ├─ web            (group)
│  │  ├─ web-01      (host)   ← click = effective vars
│  │  └─ web-02
│  └─ db
│     └─ db-01
└─ ungrouped
```

- Supporta inventari **INI e YAML**, file multipli, `[group:children]`.
- Gli **host range** (`web[01:20]`) sono tollerati nel parsing.
- Pulsante **Refresh** (icona ↻ in alto) per rileggere dopo modifiche esterne.

### Da dove legge l'inventario

Ordine di auto-detection (se `ansibleVarLens.inventoryPaths` è vuoto):

1. `inventory = …` in `ansible.cfg`
2. `./inventory`
3. `./hosts`

Puoi forzare i path nelle Settings (vedi §7).

---

## 5. Effective variables per host

Cliccando un host si apre un documento YAML con ogni variabile **già mergiata**
secondo la precedence di Ansible, e **annotata** con il file di origine e i file
che sovrascrive:

```yaml
# from: host_vars/web-01/override.yml
#   overrides: group_vars/all/base.yml
#   overrides: group_vars/web/main.yml
timeout: 90
```

### Ordine di merge modellato

Dal più basso al più alto (layer *inventory* di Ansible, `hash_behaviour=replace`):

```
  (basso) ┌─ 1. inventory [group:vars]     (parent prima dei children)
          ├─ 2. group_vars/all
          ├─ 3. group_vars/<group>         (parent→child, alfabetico a pari livello)
          ├─ 4. host vars inline           (ansible_host=… nell'inventory)
  (alto)  └─ 5. host_vars/<host>           ← vince
```

> **Fuori scope**: role defaults/vars e play vars. Appartengono ai play, non al
> layer inventory che questa estensione modella. Vedi la RFC
> [`docs/architecture/rfc-plugin-api.md`](../architecture/rfc-plugin-api.md) per l'estensibilità futura.

---

## 6. Hover su `{{ variable }}`

1. Nella status bar clicca **"AVL: <host>"** e scegli l'host di riferimento.
2. Apri un playbook / template e passa il mouse su un `{{ var }}`:
   compare il **valore risolto per quell'host** e **dove** è stato definito.

Utile per capire al volo cosa riceverà davvero un task senza eseguire il playbook.

---

## 7. Impostazioni

| Setting | Default | Descrizione |
|---|---|---|
| `ansibleVarLens.inventoryPaths` | `[]` | File/dir di inventory relativi alla root del workspace. Vuoto = auto-detect. |

Esempio (`.vscode/settings.json`):

```json
{
  "ansibleVarLens.inventoryPaths": ["inventory/prod", "inventory/staging"]
}
```

---

## 8. Vault

- I file **interamente cifrati** con Ansible Vault vengono **saltati e segnalati**
  (mai un errore che blocca la vista).
- Gli scalari `!vault` inline vengono mostrati come `<vaulted>`.

Non è necessaria la vault password: l'estensione non decifra nulla.

---

## 9. Troubleshooting

| Sintomo | Causa probabile | Fix |
|---|---|---|
| La vista è vuota | Inventory non trovato | Imposta `ansibleVarLens.inventoryPaths` o verifica `ansible.cfg` |
| Una variabile non compare | File non-YAML dentro `host_vars/<host>/` (es. `.cfg`) | È **atteso**: i non-YAML vengono ignorati |
| Valore inatteso per un host | Precedence | Apri gli *effective vars*: le annotazioni `overrides:` mostrano la catena |
| `<vaulted>` ovunque | File vault-cifrato | Atteso: l'estensione non decifra |
| Modifiche non riflesse | Cache | Premi **Refresh** (↻) nella vista |
| Parsing lento | Inventario molto grande | Restringi `inventoryPaths` al subset che ti serve |

Se il problema persiste apri una issue con: versione estensione, struttura del repo
(anonimizzata) e il comando `ansible-inventory --list` di confronto se disponibile.

---

## 10. Vedi anche

- [`README.md`](../../README.md) — overview e feature
- [`CONTRIBUTING.md`](../../CONTRIBUTING.md) — come contribuire (AVL-15)
- [`docs/user/demo-script.md`](demo-script.md) — script della demo video (AVL-16)
- [`docs/backlog.md`](../backlog.md) — roadmap e milestone
