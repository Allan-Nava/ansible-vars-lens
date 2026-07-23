// YAML parsing tolerant of Ansible-isms: !vault-encrypted scalars and
// occasional Jinja templates are kept as plain strings instead of erroring.
import * as yaml from 'js-yaml';

export const VAULTED = '<vaulted>';

const vaultType = new yaml.Type('!vault', {
  kind: 'scalar',
  construct: () => VAULTED,
});

// Ansible also allows !unsafe strings.
const unsafeType = new yaml.Type('!unsafe', {
  kind: 'scalar',
  construct: (data) => String(data),
});

const ANSIBLE_SCHEMA = yaml.DEFAULT_SCHEMA.extend([vaultType, unsafeType]);

/** Returns the parsed document, or null when the text is not valid YAML. */
export function parseYamlLoose(text: string): unknown {
  if (text.startsWith('$ANSIBLE_VAULT')) return { [VAULTED]: true };
  try {
    return yaml.load(text, { schema: ANSIBLE_SCHEMA });
  } catch {
    return null;
  }
}

export function dumpYaml(value: unknown): string {
  return yaml.dump(value, { lineWidth: 120, noRefs: true });
}
