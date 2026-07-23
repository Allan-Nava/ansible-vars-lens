# Demo Video — Script & Storyboard (AVL-16)

Script per una demo di **~5 minuti** per onboarding (YouTube / GitHub Release asset).
Questo file è lo *storyboard*: il video va prodotto/registrato a parte (non versionato nel repo).

**Setup registrazione**: VS Code tema scuro, font ≥ 16px, repo demo `cnf-mng-hiway` (o un
repo Ansible sintetico), risoluzione 1920×1080, zoom UI leggibile.

---

## Timeline

```
0:00 ─ Hook (il problema)
0:30 ─ Install & attivazione
1:00 ─ Inventory explorer
1:45 ─ Effective vars + provenance   ◄─ il momento "wow"
3:00 ─ Hover {{ var }}
3:45 ─ Vault & edge cases
4:15 ─ Settings & auto-detect
4:40 ─ Call to action
```

---

## Scena 1 — Hook (0:00–0:30)

**On screen**: un `group_vars/all/base.yml`, un `group_vars/web/main.yml` e un
`host_vars/web-01/override.yml` aperti affiancati, tutti con la stessa chiave `timeout`.

**Narrazione**:
> "Qual è il valore *finale* di `timeout` per l'host `web-01`? È definito in tre posti
> con precedence diverse. Di solito lo scopri lanciando `ansible-inventory --host`…
> oppure lo leggi direttamente in VS Code."

---

## Scena 2 — Install & attivazione (0:30–1:00)

**On screen**: `⇧⌘X`, cerca "Ansible Var Lens", Install. Apri la cartella del repo.

**Narrazione**:
> "Si installa dal Marketplace. Appena apri un repo con `ansible.cfg`, `group_vars` o
> `host_vars`, l'estensione si attiva da sola — zero configurazione."

**Azione**: mostra la nuova icona (la lente) nell'activity bar.

---

## Scena 3 — Inventory explorer (1:00–1:45)

**On screen**: espandi la vista *Hosts & Groups*: gruppi, children, host.

**Narrazione**:
> "Questa è la vista dell'inventario risolto: gruppi, sottogruppi con
> `[group:children]`, e gli host. Funziona con inventari INI e YAML, anche su più file."

**Azione**: clicca **Refresh** per mostrare la rilettura.

---

## Scena 4 — Effective vars + provenance (1:45–3:00) ◄ CLOU

**On screen**: clicca `web-01`. Si apre il documento delle variabili effettive.
Evidenzia col cursore le annotazioni:

```yaml
# from: host_vars/web-01/override.yml
#   overrides: group_vars/all/base.yml
#   overrides: group_vars/web/main.yml
timeout: 90
```

**Narrazione**:
> "Un click sull'host e vedo *ogni* variabile già mergiata con la precedence di Ansible.
> E soprattutto: da **quale file** arriva ogni valore e **quali file sovrascrive**.
> Ecco la risposta alla domanda di prima: `timeout` per `web-01` è `90`, da `host_vars`."

**Azione**: scorri per mostrare più variabili con catene di override diverse.

---

## Scena 5 — Hover `{{ var }}` (3:00–3:45)

**On screen**: status bar → seleziona host `web-01`. Apri un playbook, hover su `{{ timeout }}`.

**Narrazione**:
> "Scelgo un host di riferimento nella status bar, e da qui passo il mouse su qualsiasi
> `{{ variabile }}` in playbook e template: vedo il valore risolto per quell'host e dove
> è definito — senza eseguire nulla."

---

## Scena 6 — Vault & edge cases (3:45–4:15)

**On screen**: un file vault-cifrato e uno con scalare `!vault` inline.

**Narrazione**:
> "I file vault-cifrati vengono saltati e segnalati, mai un errore. Gli scalari `!vault`
> inline appaiono come `<vaulted>`. E i file non-YAML dentro `host_vars` — tipo i `.cfg` —
> vengono ignorati, come si aspetta Ansible."

---

## Scena 7 — Settings & auto-detect (4:15–4:40)

**On screen**: `ansibleVarLens.inventoryPaths` in settings.json.

**Narrazione**:
> "Di default trova l'inventario da `ansible.cfg`, `./inventory` o `./hosts`. Se ne hai
> più d'uno — prod e staging — li punti esplicitamente in una riga di settings."

---

## Scena 8 — Call to action (4:40–5:00)

**On screen**: pagina Marketplace + repo GitHub.

**Narrazione**:
> "Ansible Var Lens: la risposta a *'che valore ha davvero questa variabile per questo host'*,
> dentro l'editor. Installala dal Marketplace, e se ti è utile lascia una recensione. Grazie!"

---

## Checklist produzione

- [ ] Repo demo pulito e anonimizzato (niente secret reali, niente host di produzione)
- [ ] Sottotitoli/caption (accessibilità)
- [ ] Thumbnail con il logo dell'estensione
- [ ] Link nel README (badge "Watch the demo") e nella GitHub Release
- [ ] Durata finale ≤ 5:30
