// Inventory parsing: INI-style (the common case) and YAML inventories.
// Pure module — no vscode imports — so it can be unit-tested with plain Node.
import * as fs from 'fs';
import * as path from 'path';
import { parseYamlLoose } from './yamlutil';

export interface HostEntry {
  name: string;
  /** Inline vars from the inventory line, e.g. ansible_host=10.0.0.1 */
  vars: Record<string, unknown>;
  /** Groups the host belongs to directly. */
  groups: string[];
  /** Inventory file it was defined in. */
  source: string;
  /** 0-based line in the source file, for go-to-definition. */
  line: number;
}

export interface GroupEntry {
  name: string;
  hosts: string[];
  children: string[];
  /** Vars from [group:vars] sections or YAML `vars:` blocks. */
  vars: Record<string, unknown>;
  source: string;
}

export interface Inventory {
  hosts: Map<string, HostEntry>;
  groups: Map<string, GroupEntry>;
  /** Files that contributed to this inventory. */
  sources: string[];
}

export function emptyInventory(): Inventory {
  return { hosts: new Map(), groups: new Map(), sources: [] };
}

function ensureGroup(inv: Inventory, name: string, source: string): GroupEntry {
  let g = inv.groups.get(name);
  if (!g) {
    g = { name, hosts: [], children: [], vars: {}, source };
    inv.groups.set(name, g);
  }
  return g;
}

function ensureHost(inv: Inventory, name: string, source: string, line: number): HostEntry {
  let h = inv.hosts.get(name);
  if (!h) {
    h = { name, vars: {}, groups: [], source, line };
    inv.hosts.set(name, h);
  }
  return h;
}

/** Coerces an inline INI value: numbers, booleans, quoted strings. */
function coerce(raw: string): unknown {
  const v = raw.trim();
  if (/^-?\d+$/.test(v)) return parseInt(v, 10);
  if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v);
  if (/^(true|True|yes)$/.test(v)) return true;
  if (/^(false|False|no)$/.test(v)) return false;
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

/** Parses `key=value key2="a b"` inline host vars. */
function parseInlineVars(rest: string): Record<string, unknown> {
  const vars: Record<string, unknown> = {};
  const re = /([\w.]+)=("[^"]*"|'[^']*'|\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(rest)) !== null) {
    vars[m[1]] = coerce(m[2]);
  }
  return vars;
}

/** Strips a trailing comment that is not inside quotes. */
function stripComment(line: string): string {
  let inS = false;
  let inD = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === "'" && !inD) inS = !inS;
    else if (c === '"' && !inS) inD = !inD;
    else if ((c === '#' || c === ';') && !inS && !inD && (i === 0 || /\s/.test(line[i - 1]))) {
      return line.slice(0, i);
    }
  }
  return line;
}

export function parseIniInventory(filePath: string, inv: Inventory): void {
  const text = fs.readFileSync(filePath, 'utf8');
  inv.sources.push(filePath);
  let section = 'ungrouped';
  let sectionKind: 'hosts' | 'children' | 'vars' = 'hosts';
  ensureGroup(inv, 'all', filePath);

  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = stripComment(lines[i]).trim();
    if (!line) continue;

    const header = line.match(/^\[([^\]:]+)(?::(children|vars))?\]$/);
    if (header) {
      section = header[1].trim();
      sectionKind = (header[2] as 'children' | 'vars') || 'hosts';
      ensureGroup(inv, section, filePath);
      continue;
    }

    const group = ensureGroup(inv, section, filePath);
    if (sectionKind === 'children') {
      ensureGroup(inv, line, filePath);
      if (!group.children.includes(line)) group.children.push(line);
    } else if (sectionKind === 'vars') {
      const eq = line.indexOf('=');
      if (eq > 0) group.vars[line.slice(0, eq).trim()] = coerce(line.slice(eq + 1));
    } else {
      const m = line.match(/^(\S+)\s*(.*)$/);
      if (!m) continue;
      const name = m[1];
      // Skip ranges like web[01:20] for the MVP host list, but keep the entry raw.
      const host = ensureHost(inv, name, filePath, i);
      Object.assign(host.vars, parseInlineVars(m[2] || ''));
      if (!host.groups.includes(section)) host.groups.push(section);
      if (!group.hosts.includes(name)) group.hosts.push(name);
    }
  }
}

interface YamlGroupNode {
  hosts?: Record<string, Record<string, unknown> | null>;
  children?: Record<string, YamlGroupNode | null>;
  vars?: Record<string, unknown>;
}

function walkYamlGroup(inv: Inventory, name: string, node: YamlGroupNode | null, source: string): void {
  const group = ensureGroup(inv, name, source);
  if (!node) return;
  if (node.vars && typeof node.vars === 'object') Object.assign(group.vars, node.vars);
  for (const [hostName, hostVars] of Object.entries(node.hosts || {})) {
    const host = ensureHost(inv, hostName, source, 0);
    if (hostVars && typeof hostVars === 'object') Object.assign(host.vars, hostVars);
    if (!host.groups.includes(name)) host.groups.push(name);
    if (!group.hosts.includes(hostName)) group.hosts.push(hostName);
  }
  for (const [childName, childNode] of Object.entries(node.children || {})) {
    if (!group.children.includes(childName)) group.children.push(childName);
    walkYamlGroup(inv, childName, childNode, source);
  }
}

export function parseYamlInventory(filePath: string, inv: Inventory): void {
  const doc = parseYamlLoose(fs.readFileSync(filePath, 'utf8'));
  if (!doc || typeof doc !== 'object') return;
  inv.sources.push(filePath);
  for (const [name, node] of Object.entries(doc as Record<string, YamlGroupNode | null>)) {
    walkYamlGroup(inv, name, node, filePath);
  }
}

function looksLikeYamlInventory(filePath: string): boolean {
  return /\.(ya?ml|json)$/i.test(filePath);
}

/** Parses a single inventory file or every parsable file in a directory. */
export function loadInventoryPath(p: string, inv: Inventory): void {
  const stat = fs.statSync(p);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(p).sort()) {
      if (entry.startsWith('.')) continue;
      const full = path.join(p, entry);
      if (fs.statSync(full).isFile()) {
        try {
          loadInventoryPath(full, inv);
        } catch {
          // Non-inventory files inside the dir are ignored.
        }
      }
    }
    return;
  }
  if (looksLikeYamlInventory(p)) parseYamlInventory(p, inv);
  else parseIniInventory(p, inv);
}

/** Auto-detects inventory paths for a repo root when none are configured. */
export function detectInventoryPaths(root: string): string[] {
  const found: string[] = [];
  const cfg = path.join(root, 'ansible.cfg');
  if (fs.existsSync(cfg)) {
    const m = fs.readFileSync(cfg, 'utf8').match(/^\s*inventory\s*=\s*(.+)$/m);
    if (m) {
      for (const part of m[1].split(',')) {
        const p = path.resolve(root, part.trim());
        if (fs.existsSync(p)) found.push(p);
      }
    }
  }
  if (found.length === 0) {
    for (const candidate of ['inventory', 'inventories', 'hosts', 'hosts.ini', 'hosts.yml']) {
      const p = path.join(root, candidate);
      if (fs.existsSync(p)) found.push(p);
    }
  }
  return found;
}

export function loadInventory(root: string, configured: string[] = []): Inventory {
  const inv = emptyInventory();
  const paths = configured.length
    ? configured.map((p) => path.resolve(root, p)).filter((p) => fs.existsSync(p))
    : detectInventoryPaths(root);
  for (const p of paths) loadInventoryPath(p, inv);

  // Every group without a parent becomes a child of `all`.
  const all = ensureGroup(inv, 'all', paths[0] || root);
  const referenced = new Set<string>();
  for (const g of inv.groups.values()) g.children.forEach((c) => referenced.add(c));
  for (const g of inv.groups.values()) {
    if (g.name !== 'all' && !referenced.has(g.name) && !all.children.includes(g.name)) {
      all.children.push(g.name);
    }
  }
  return inv;
}

/** Distance of each group from `all` (parents before children in merges). */
export function groupDepths(inv: Inventory): Map<string, number> {
  const depth = new Map<string, number>([['all', 0]]);
  let changed = true;
  let guard = 0;
  while (changed && guard++ < 100) {
    changed = false;
    for (const g of inv.groups.values()) {
      const d = depth.get(g.name);
      if (d === undefined) continue;
      for (const child of g.children) {
        if ((depth.get(child) ?? Infinity) > d + 1) {
          depth.set(child, d + 1);
          changed = true;
        }
      }
    }
  }
  for (const g of inv.groups.values()) if (!depth.has(g.name)) depth.set(g.name, 1);
  return depth;
}

/** All groups a host belongs to, including ancestors, ordered all → leaves. */
export function hostGroups(inv: Inventory, hostName: string): string[] {
  const host = inv.hosts.get(hostName);
  if (!host) return [];
  const parents = new Map<string, string[]>();
  for (const g of inv.groups.values()) {
    for (const child of g.children) {
      if (!parents.has(child)) parents.set(child, []);
      parents.get(child)!.push(g.name);
    }
  }
  const result = new Set<string>();
  const queue = [...host.groups];
  while (queue.length) {
    const name = queue.shift()!;
    if (result.has(name)) continue;
    result.add(name);
    for (const p of parents.get(name) || []) queue.push(p);
  }
  result.add('all');
  const depths = groupDepths(inv);
  return [...result].sort((a, b) => (depths.get(a)! - depths.get(b)!) || a.localeCompare(b));
}
