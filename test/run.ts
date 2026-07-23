// Unit tests for the pure core (inventory + resolver). No vscode needed:
// bundled by `node esbuild.mjs --test` and executed with plain Node.
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { loadInventory, hostGroups } from '../src/core/inventory';
import { resolveHostVars, renderResolution } from '../src/core/resolver';

let failures = 0;
function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`ok   ${name}`);
  } catch (err) {
    failures++;
    console.error(`FAIL ${name}\n     ${err}`);
  }
}

// --- fixture repo built on the fly -----------------------------------------
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'avl-fixture-'));
function write(rel: string, content: string): void {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

write(
  'inventory/main',
  [
    '[web]',
    'web-01  ansible_host=10.0.0.1  ansible_user=root',
    'web-02  ansible_host=10.0.0.2   # comment after host',
    '',
    '[db]',
    'db-01 ansible_host=10.0.1.1',
    '',
    '[prod:children]',
    'web',
    'db',
    '',
    '[prod:vars]',
    'env=production',
    'retries=3',
  ].join('\n')
);
write('group_vars/all/base.yml', 'domain: example.com\ntimeout: 10\n');
write('group_vars/prod.yml', 'timeout: 30\ntier: prod\n');
write('group_vars/web/main.yml', 'timeout: 60\nnginx: true\n');
write('host_vars/web-01/override.yml', 'timeout: 90\nrole_hint: frontend\n');
write('host_vars/web-01/ignored.cfg', 'not yaml at all {{{');
write('host_vars/db-01.yml', 'postgres: true\n');
write(
  'host_vars/web-02/secret.yml',
  '$ANSIBLE_VAULT;1.1;AES256\n61626364656667\n'
);

const inv = loadInventory(root, ['inventory']);

test('INI inventory: hosts, groups, inline vars', () => {
  assert.strictEqual(inv.hosts.size, 3);
  assert.deepStrictEqual(inv.hosts.get('web-01')!.vars, {
    ansible_host: '10.0.0.1',
    ansible_user: 'root',
  });
  assert.ok(inv.groups.get('prod')!.children.includes('web'));
  assert.strictEqual(inv.groups.get('prod')!.vars['env'], 'production');
  assert.strictEqual(inv.groups.get('prod')!.vars['retries'], 3);
});

test('comment after host does not become a var', () => {
  assert.deepStrictEqual(inv.hosts.get('web-02')!.vars, { ansible_host: '10.0.0.2' });
});

test('host groups ordered all → parents → leaves', () => {
  assert.deepStrictEqual(hostGroups(inv, 'web-01'), ['all', 'prod', 'web']);
});

const res = resolveHostVars(root, inv, 'web-01');

test('precedence: host_vars beats group_vars beats all', () => {
  assert.strictEqual(res.vars.get('timeout')!.value, 90);
  assert.deepStrictEqual(res.vars.get('timeout')!.overridden, [
    'group_vars/all/base.yml',
    'group_vars/prod.yml',
    'group_vars/web/main.yml',
  ]);
});

test('group_vars as file and as directory both load', () => {
  assert.strictEqual(res.vars.get('tier')!.value, 'prod');
  assert.strictEqual(res.vars.get('nginx')!.value, true);
  assert.strictEqual(res.vars.get('domain')!.value, 'example.com');
});

test('inventory [group:vars] and inline host vars land', () => {
  assert.strictEqual(res.vars.get('env')!.value, 'production');
  assert.strictEqual(res.vars.get('ansible_user')!.value, 'root');
});

test('non-YAML files inside host_vars dirs are ignored', () => {
  assert.strictEqual(res.vars.get('role_hint')!.value, 'frontend');
});

test('vaulted file is skipped and reported', () => {
  const res2 = resolveHostVars(root, inv, 'web-02');
  assert.deepStrictEqual(res2.vaultedFiles, ['host_vars/web-02/secret.yml']);
});

test('render includes provenance comments', () => {
  const text = renderResolution(res);
  assert.ok(text.includes('# from: host_vars/web-01/override.yml'));
  assert.ok(text.includes('#   overrides: group_vars/web/main.yml'));
  assert.ok(text.includes('timeout: 90'));
});

// --- optional smoke test against a real repo --------------------------------
const real = process.env.AVL_SMOKE_REPO;
if (real && fs.existsSync(real)) {
  test(`smoke: real repo ${real}`, () => {
    const rInv = loadInventory(real, []);
    assert.ok(rInv.hosts.size > 0, 'no hosts found');
    const host = process.env.AVL_SMOKE_HOST || [...rInv.hosts.keys()][0];
    const rRes = resolveHostVars(real, rInv, host);
    assert.ok(rRes.vars.size > 0, `no vars resolved for ${host}`);
    console.log(
      `     ${rInv.hosts.size} host, ${rInv.groups.size} gruppi; ${host}: ${rRes.vars.size} variabili` +
        (rRes.vaultedFiles.length ? `, ${rRes.vaultedFiles.length} file vaulted` : '')
    );
  });
}

fs.rmSync(root, { recursive: true, force: true });
if (failures > 0) {
  console.error(`\n${failures} test failed`);
  process.exit(1);
}
console.log('\nall tests passed');
