// Effective-variable resolution for a host, with provenance per variable.
// Merge order (lowest to highest precedence), mirroring Ansible for the
// inventory/vars-files layer:
//   1. inventory [group:vars]        (all first, then parents before children)
//   2. group_vars/all
//   3. group_vars/<group>            (parents before children, alpha within depth)
//   4. inventory inline host vars    (ansible_host=... on the host line)
//   5. host_vars/<host>
// Top-level keys replace each other (Ansible's default hash_behaviour=replace).
// Role defaults/vars and play vars are out of scope: they live in plays, not
// in the inventory layer this extension models.
import * as fs from 'fs';
import * as path from 'path';
import { Inventory, hostGroups } from './inventory';
import { parseYamlLoose, dumpYaml, VAULTED } from './yamlutil';

export interface ResolvedVar {
  name: string;
  value: unknown;
  /** File (or inventory source) whose definition won. */
  source: string;
  /** Sources that were overridden by `source`, lowest precedence first. */
  overridden: string[];
}

export interface Resolution {
  host: string;
  vars: Map<string, ResolvedVar>;
  /** Vars files that were skipped because fully vault-encrypted. */
  vaultedFiles: string[];
}

/** Vars files for a group_vars/host_vars name: `<dir>/<name>` file or directory. */
function varsFilesFor(baseDir: string, name: string): string[] {
  const candidates = [name, `${name}.yml`, `${name}.yaml`, `${name}.json`].map((n) =>
    path.join(baseDir, n)
  );
  const files: string[] = [];
  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    const stat = fs.statSync(candidate);
    if (stat.isFile()) {
      files.push(candidate);
    } else if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(candidate).sort()) {
        if (entry.startsWith('.')) continue;
        if (!/\.(ya?ml|json)$/i.test(entry)) continue; // e.g. skip haproxy.cfg
        const full = path.join(candidate, entry);
        if (fs.statSync(full).isFile()) files.push(full);
      }
    }
  }
  return files;
}

/** Directories that may contain group_vars/host_vars: repo root + inventory dirs. */
function varsRoots(root: string, inv: Inventory): string[] {
  const roots = new Set<string>([root]);
  for (const src of inv.sources) {
    roots.add(path.dirname(src));
  }
  return [...roots];
}

function applyLayer(
  resolution: Resolution,
  vars: Record<string, unknown>,
  source: string
): void {
  for (const [name, value] of Object.entries(vars)) {
    const existing = resolution.vars.get(name);
    if (existing) {
      existing.overridden.push(existing.source);
      existing.value = value;
      existing.source = source;
    } else {
      resolution.vars.set(name, { name, value, source, overridden: [] });
    }
  }
}

function applyVarsFiles(resolution: Resolution, root: string, files: string[]): void {
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    if (text.startsWith('$ANSIBLE_VAULT')) {
      resolution.vaultedFiles.push(path.relative(root, file));
      continue;
    }
    const doc = parseYamlLoose(text);
    if (doc && typeof doc === 'object' && !Array.isArray(doc)) {
      applyLayer(resolution, doc as Record<string, unknown>, path.relative(root, file));
    }
  }
}

export function resolveHostVars(root: string, inv: Inventory, hostName: string): Resolution {
  const resolution: Resolution = { host: hostName, vars: new Map(), vaultedFiles: [] };
  const host = inv.hosts.get(hostName);
  const groups = hostGroups(inv, hostName); // all → leaves
  const roots = varsRoots(root, inv);

  // 1. inventory [group:vars]
  for (const groupName of groups) {
    const group = inv.groups.get(groupName);
    if (group && Object.keys(group.vars).length) {
      applyLayer(resolution, group.vars, `${path.relative(root, group.source)} [${groupName}:vars]`);
    }
  }

  // 2 + 3. group_vars (all first thanks to hostGroups ordering)
  for (const groupName of groups) {
    for (const base of roots) {
      applyVarsFiles(resolution, root, varsFilesFor(path.join(base, 'group_vars'), groupName));
    }
  }

  // 4. inline inventory host vars
  if (host && Object.keys(host.vars).length) {
    applyLayer(resolution, host.vars, `${path.relative(root, host.source)} (inline)`);
  }

  // 5. host_vars
  for (const base of roots) {
    applyVarsFiles(resolution, root, varsFilesFor(path.join(base, 'host_vars'), hostName));
  }

  return resolution;
}

/** Renders a resolution as commented YAML, ready to open as a document. */
export function renderResolution(res: Resolution): string {
  const lines: string[] = [
    `# Effective variables for host: ${res.host}`,
    `# (inventory + group_vars + host_vars, highest precedence wins)`,
    '',
  ];
  if (res.vaultedFiles.length) {
    lines.push('# ⚠ vault-encrypted files skipped:');
    for (const f of res.vaultedFiles) lines.push(`#   - ${f}`);
    lines.push('');
  }
  const names = [...res.vars.keys()].sort((a, b) => a.localeCompare(b));
  for (const name of names) {
    const v = res.vars.get(name)!;
    lines.push(`# from: ${v.source}`);
    for (const o of v.overridden) lines.push(`#   overrides: ${o}`);
    lines.push(dumpYaml({ [name]: v.value }).trimEnd());
    lines.push('');
  }
  if (names.length === 0) lines.push('# (no variables found)');
  return lines.join('\n');
}

export { VAULTED };
