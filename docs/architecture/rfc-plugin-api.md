# RFC — Plugin API for custom resolvers/transformers (AVL-17)

- **Status**: Draft (research) — *nessun codice ancora, solo design*
- **Owner**: maintainer
- **Tracking**: AVL-17 in [`docs/backlog.md`](../backlog.md)
- **Scope**: estendere Ansible Var Lens con hook di terze parti **senza** intaccare
  il resolver del layer inventory (che resta il cuore fidato).

---

## 1. Motivazione

Oggi il resolver modella **solo** il layer inventory/vars-files (`hash_behaviour=replace`):
`group_vars`/`host_vars`/inventory `[group:vars]`/host vars inline. Restano fuori casi che
gli utenti chiedono ma che **non vogliamo** cablare nel core:

- **Play/role vars** (defaults, vars, `vars_files` dei playbook) — semantica diversa, rischiosa.
- **Backend custom** — variabili da CMDB, Vault server, `.env`, secret manager.
- **Trasformazioni** — mascherare secret, normalizzare tipi, espandere template Jinja2 in preview.

Cablare tutto questo nel core violerebbe la regola di progetto
("precedenza modellata = solo layer inventory"). Un **Plugin API** permette a estensioni
terze di aggiungere layer o trasformazioni in modo esplicito e isolato.

---

## 2. Non-obiettivi

- **Non** cambiare la precedence del layer inventory esistente.
- **Non** eseguire codice Ansible/Jinja2 arbitrario nel processo dell'estensione senza sandbox.
- **Non** decifrare vault (resta: skip + segnala).

---

## 3. Modello a layer

Il resolver diventa una **pipeline di provider ordinati per priorità**. I provider del
core (inventory) hanno priorità fissa; i plugin si inseriscono **sopra o sotto** dichiarando
un `priority` numerico. Il merge resta `replace` (priorità più alta vince), coerente con oggi.

```
   priority
   ┌───────────────────────────────────────────────┐
 90│  plugin: CMDB provider        (opt-in)          │  ► più alto = vince
 50│  ── CORE: host_vars/<host>                      │
 40│  ── CORE: host vars inline                      │
 30│  ── CORE: group_vars/<group>                    │
 20│  ── CORE: group_vars/all                        │
 10│  ── CORE: inventory [group:vars]                │
  5│  plugin: .env fallback        (opt-in)          │  ► più basso = fallback
   └───────────────────────────────────────────────┘
                     │
                     ▼  ogni ResolvedVar passa per i transformer registrati
              [ mask secrets ] → [ normalize ] → risultato annotato
```

Ogni valore prodotto da un plugin **eredita la stessa provenance** (`source`/`overridden`)
del modello attuale: nel doc effective vars comparirà `# from: <plugin-id>:…`.

---

## 4. Superficie API proposta

Riuso delle interfacce esistenti in `src/core/resolver.ts` (`Resolution`, `ResolvedVar`)
per non duplicare il modello dati.

```ts
// Contratto esposto da AVL ad altre estensioni via vscode extension exports.
export interface AvlApi {
  registerVarsProvider(provider: VarsProvider): vscode.Disposable;
  registerTransformer(transformer: VarTransformer): vscode.Disposable;
  readonly version: string; // semver dell'API, per compat check
}

export interface VarsProvider {
  readonly id: string;        // es. "acme.cmdb"
  readonly priority: number;  // vedi §3; collisioni risolte per id alfabetico
  /**
   * Ritorna le variabili che questo provider conosce per l'host.
   * DEVE essere puro/sola-lettura e non lanciare: errori → layer ignorato + warning.
   */
  provide(ctx: HostContext): Promise<ProvidedVar[]> | ProvidedVar[];
}

export interface VarTransformer {
  readonly id: string;
  /** Applicato ad ogni var risolta, in ordine di registrazione. */
  transform(v: ResolvedVar, ctx: HostContext): ResolvedVar;
}

export interface HostContext {
  readonly host: string;
  readonly groups: string[];      // gruppi dell'host, parent→child
  readonly workspaceRoot: string;
  readonly inventoryPaths: string[];
}

export interface ProvidedVar {
  name: string;
  value: unknown;
  /** Etichetta di provenance mostrata nelle annotazioni. */
  sourceLabel: string; // es. "acme.cmdb:prod"
}
```

Consumo lato plugin terzo:

```ts
const avl = vscode.extensions.getExtension('allannava95.ansible-var-lens');
const api: AvlApi = await avl.activate();
api.registerVarsProvider({
  id: 'acme.cmdb',
  priority: 90,
  provide: ({ host }) => fetchFromCmdb(host), // sola lettura
});
```

---

## 5. Isolamento e sicurezza

- I provider girano **in-process** ma sono **trattati come non fidati**: ogni chiamata è
  `try/catch`, con timeout; un provider che lancia o va in timeout viene **saltato e segnalato**
  (stessa filosofia dei file vault), mai un errore che rompe la vista.
- Nessun provider può **modificare** i layer core: può solo aggiungere il proprio layer.
- I transformer non possono cambiare `name`/`source` (solo `value` e, opzionalmente, un flag
  di masking) per non falsificare la provenance.

---

## 6. Impatto su performance

- I provider sono chiamati **on-demand** per host (come il resolver attuale), non su tutto
  l'inventario. La cache/invalidazione esistente si estende con la chiave `(host, providerId)`.
- Un provider lento non deve bloccare la UI: risoluzione `async` con timeout e valore parziale.

---

## 7. Alternative considerate

| Alternativa | Perché scartata (per ora) |
|---|---|
| Cablare play/role vars nel core | Viola lo scope; semantica di merge diversa; alto rischio di regressioni |
| Config JSON dichiarativa (no codice) | Non copre backend dinamici (CMDB, secret manager) |
| Solo comando "esegui `ansible-inventory`" | Richiede Ansible installato + esecuzione; l'estensione è oggi zero-exec |

---

## 8. Domande aperte

1. `activate()` deve esporre l'API in modo lazy o eager? (impatto sul tempo di attivazione)
2. Versioning: come gestire un provider compilato contro una versione vecchia di `AvlApi`?
3. UI: come segnalare all'utente quali layer sono di plugin vs core nel doc effective vars?
   (proposta: prefisso `[plugin]` nell'annotazione `# from:`)
4. Serve un registro/allowlist dei plugin fidati, o basta il modello try/catch?

---

## 9. Prossimi passi (se accettata)

1. Estrarre il resolver in una **pipeline di layer** internamente (refactoring senza cambio di comportamento) + test di non-regressione sulle fixture attuali.
2. Prototipare `AvlApi` dietro un setting sperimentale `ansibleVarLens.experimental.pluginApi`.
3. Un provider di riferimento (es. `.env` fallback) come test end-to-end del contratto.
