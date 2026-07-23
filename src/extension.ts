import * as vscode from 'vscode';
import * as path from 'path';
import { Inventory, loadInventory, groupDepths } from './core/inventory';
import { resolveHostVars, renderResolution } from './core/resolver';
import { dumpYaml } from './core/yamlutil';

const SCHEME = 'ansible-var-lens';

class InventoryModel {
  inventory: Inventory | null = null;
  root: string | null = null;
  private emitter = new vscode.EventEmitter<void>();
  readonly onDidChange = this.emitter.event;

  refresh(): void {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) return;
    this.root = folder.uri.fsPath;
    const configured = vscode.workspace
      .getConfiguration('ansibleVarLens')
      .get<string[]>('inventoryPaths', []);
    try {
      this.inventory = loadInventory(this.root, configured);
    } catch (err) {
      void vscode.window.showErrorMessage(`Ansible Var Lens: inventory parse failed — ${err}`);
      this.inventory = null;
    }
    this.emitter.fire();
  }
}

type TreeNode =
  | { kind: 'group'; name: string }
  | { kind: 'host'; name: string };

class InventoryTree implements vscode.TreeDataProvider<TreeNode> {
  private emitter = new vscode.EventEmitter<TreeNode | undefined>();
  readonly onDidChangeTreeData = this.emitter.event;

  constructor(private model: InventoryModel) {
    model.onDidChange(() => this.emitter.fire(undefined));
  }

  getTreeItem(node: TreeNode): vscode.TreeItem {
    if (node.kind === 'group') {
      const item = new vscode.TreeItem(node.name, vscode.TreeItemCollapsibleState.Collapsed);
      item.iconPath = new vscode.ThemeIcon('folder-library');
      item.contextValue = 'group';
      return item;
    }
    const item = new vscode.TreeItem(node.name, vscode.TreeItemCollapsibleState.None);
    item.iconPath = new vscode.ThemeIcon('server');
    item.contextValue = 'host';
    const inlineHost = this.model.inventory?.hosts.get(node.name)?.vars['ansible_host'];
    if (typeof inlineHost === 'string') item.description = inlineHost;
    item.command = {
      command: 'ansibleVarLens.showHostVars',
      title: 'Show Effective Variables',
      arguments: [node.name],
    };
    return item;
  }

  getChildren(node?: TreeNode): TreeNode[] {
    const inv = this.model.inventory;
    if (!inv) return [];
    if (!node) {
      const depths = groupDepths(inv);
      return [...inv.groups.values()]
        .filter((g) => g.name !== 'all' && (g.hosts.length || g.children.length))
        .sort((a, b) => (depths.get(a.name)! - depths.get(b.name)!) || a.name.localeCompare(b.name))
        .map((g) => ({ kind: 'group' as const, name: g.name }));
    }
    if (node.kind === 'group') {
      const group = inv.groups.get(node.name);
      if (!group) return [];
      return [
        ...group.children.sort().map((name) => ({ kind: 'group' as const, name })),
        ...group.hosts.sort().map((name) => ({ kind: 'host' as const, name })),
      ];
    }
    return [];
  }
}

export function activate(context: vscode.ExtensionContext): void {
  const model = new InventoryModel();
  let selectedHost: string | undefined = context.workspaceState.get('ansibleVarLens.host');

  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 90);
  status.command = 'ansibleVarLens.selectHost';
  const updateStatus = () => {
    status.text = `$(server) ${selectedHost ?? 'select host'}`;
    status.tooltip = 'Ansible Var Lens: host used to resolve {{ variables }} on hover';
    status.show();
  };
  updateStatus();

  const tree = new InventoryTree(model);
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('ansibleVarLens.inventory', tree),
    status
  );

  const contentEmitter = new vscode.EventEmitter<vscode.Uri>();
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(SCHEME, {
      onDidChange: contentEmitter.event,
      provideTextDocumentContent(uri: vscode.Uri): string {
        const host = path.basename(uri.path, '.yml');
        if (!model.inventory || !model.root) return '# inventory not loaded';
        return renderResolution(resolveHostVars(model.root, model.inventory, host));
      },
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('ansibleVarLens.refresh', () => model.refresh()),

    vscode.commands.registerCommand('ansibleVarLens.showHostVars', async (host?: string) => {
      if (!host) host = await pickHost(model);
      if (!host) return;
      selectedHost = host;
      void context.workspaceState.update('ansibleVarLens.host', host);
      updateStatus();
      const uri = vscode.Uri.parse(`${SCHEME}:/${host}.yml`);
      contentEmitter.fire(uri);
      const doc = await vscode.workspace.openTextDocument(uri);
      await vscode.languages.setTextDocumentLanguage(doc, 'yaml');
      await vscode.window.showTextDocument(doc, { preview: true });
    }),

    vscode.commands.registerCommand('ansibleVarLens.selectHost', async () => {
      const host = await pickHost(model);
      if (!host) return;
      selectedHost = host;
      void context.workspaceState.update('ansibleVarLens.host', host);
      updateStatus();
    })
  );

  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      [{ language: 'yaml' }, { language: 'ansible' }, { pattern: '**/*.j2' }],
      {
        provideHover(document, position): vscode.Hover | undefined {
          if (!model.inventory || !model.root || !selectedHost) return undefined;
          const range = document.getWordRangeAtPosition(position, /[\w.]+/);
          if (!range) return undefined;
          const word = document.getText(range).split('.')[0];
          const line = document.lineAt(position.line).text;
          if (!line.includes('{{')) return undefined;
          const res = resolveHostVars(model.root, model.inventory, selectedHost);
          const v = res.vars.get(word);
          if (!v) return undefined;
          const md = new vscode.MarkdownString();
          md.appendMarkdown(`**${word}** for \`${selectedHost}\` — from \`${v.source}\`\n`);
          md.appendCodeblock(dumpYaml(v.value).trimEnd(), 'yaml');
          return new vscode.Hover(md, range);
        },
      }
    )
  );

  const watcher = vscode.workspace.createFileSystemWatcher(
    '**/{inventory,inventories,group_vars,host_vars}/**'
  );
  watcher.onDidChange(() => model.refresh());
  watcher.onDidCreate(() => model.refresh());
  watcher.onDidDelete(() => model.refresh());
  context.subscriptions.push(watcher);

  model.refresh();
}

async function pickHost(model: InventoryModel): Promise<string | undefined> {
  if (!model.inventory) return undefined;
  const items = [...model.inventory.hosts.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((h) => ({
      label: h.name,
      description: [h.vars['ansible_host'], h.groups.join(', ')].filter(Boolean).join('  —  '),
    }));
  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: 'Host to resolve variables for',
  });
  return picked?.label;
}

export function deactivate(): void {}
