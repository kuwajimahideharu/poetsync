import { App, Plugin, PluginSettingTab, Setting, Notice, TFile, TFolder } from 'obsidian';

const BINARY_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'tiff',
  'pdf', 'zip', 'gz', 'tar',
  'mp3', 'mp4', 'wav', 'ogg', 'mov', 'avi', 'mkv',
]);

function isBinaryExt(ext: string): boolean {
  return BINARY_EXTENSIONS.has(ext.toLowerCase());
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// "foo/bar.md" → "foo/bar (競合 2026-07-04 1830).md"
function makeConflictPath(filePath: string): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}${pad(d.getMinutes())}`;
  const dot = filePath.lastIndexOf('.');
  const slash = filePath.lastIndexOf('/');
  if (dot > slash) {
    return `${filePath.slice(0, dot)} (競合 ${stamp})${filePath.slice(dot)}`;
  }
  return `${filePath} (競合 ${stamp})`;
}

interface PoetSyncSettings {
  serverUrl: string;
  enabled: boolean;
  sendEnabled: boolean;
  authToken: string;
}

const DEFAULT_SETTINGS: PoetSyncSettings = {
  serverUrl: 'ws://localhost:27124',
  enabled: true,
  sendEnabled: true,
  authToken: ''
};

export default class PoetSyncPlugin extends Plugin {
  settings: PoetSyncSettings;
  ws: WebSocket | null = null;
  reconnectTimer: number | null = null;
  isConnecting: boolean = false;
  ignorePaths: Set<string> = new Set();
  serverFileHashes: Map<string, string> = new Map();
  // サーバーの file_saved 応答がまだ届いていない（＝未送信かもしれない）ローカル変更。
  // オフライン中の作成・編集もここに記録し、再接続時にアップロードする
  pendingPaths: Set<string> = new Set();
  hashSaveTimer: number | null = null;
  isSyncing: boolean = false;
  syncingPaths: Set<string> = new Set();

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new PoetSyncSettingTab(this.app, this));
    if (this.settings.enabled) this.connect();

    this.addRibbonIcon('refresh-cw', 'PoetSync: 再接続', () => {
      this.forceReconnect();
    });

    this.registerEvent(
      this.app.vault.on('modify', async (file) => {
        if (!this.settings.sendEnabled) return;
        if (this.ignorePaths.has(file.path)) return;
        if (!(file instanceof TFile)) return;
        await this.uploadFile(file);
      })
    );

    this.registerEvent(
      this.app.vault.on('create', async (file) => {
        if (!this.settings.sendEnabled) return;
        if (this.ignorePaths.has(file.path)) return;
        if (!(file instanceof TFile)) return;
        await this.uploadFile(file);
      })
    );

    this.registerEvent(
      this.app.vault.on('delete', (file) => {
        if (!this.settings.sendEnabled) return;
        if (this.ignorePaths.has(file.path)) return;
        this.pendingPaths.delete(file.path);
        if (this.ws?.readyState !== WebSocket.OPEN) return;
        if (file instanceof TFolder) {
          this.ws.send(JSON.stringify({ type: 'delete_folder', path: file.path, timestamp: Date.now() }));
        } else {
          this.serverFileHashes.delete(file.path);
          this.ws.send(JSON.stringify({ type: 'delete_file', path: file.path, timestamp: Date.now() }));
        }
      })
    );

    this.registerEvent(
      this.app.vault.on('rename', async (file, oldPath) => {
        if (!this.settings.sendEnabled) return;
        if (file instanceof TFolder) {
          // フォルダの改名・移動はファイルと区別して送る
          const prefix = oldPath + '/';
          for (const key of [...this.serverFileHashes.keys()]) {
            if (key.startsWith(prefix)) {
              const hash = this.serverFileHashes.get(key)!;
              this.serverFileHashes.delete(key);
              this.serverFileHashes.set(file.path + '/' + key.slice(prefix.length), hash);
            }
          }
          for (const key of [...this.pendingPaths]) {
            if (key.startsWith(prefix)) {
              this.pendingPaths.delete(key);
              this.pendingPaths.add(file.path + '/' + key.slice(prefix.length));
            }
          }
          this.scheduleSaveHashes();
          if (this.ws?.readyState !== WebSocket.OPEN) return;
          this.ws.send(JSON.stringify({ type: 'rename_folder', oldPath, newPath: file.path, timestamp: Date.now() }));
          return;
        }
        const oldHash = this.serverFileHashes.get(oldPath);
        this.serverFileHashes.delete(oldPath);
        if (oldHash) this.serverFileHashes.set(file.path, oldHash);
        if (this.pendingPaths.delete(oldPath)) this.pendingPaths.add(file.path);
        this.scheduleSaveHashes();
        if (this.ws?.readyState !== WebSocket.OPEN) return;
        this.ws.send(JSON.stringify({ type: 'rename_file', oldPath, newPath: file.path, timestamp: Date.now() }));
      })
    );

    console.log('PoetSync plugin loaded');
  }

  // ローカルの変更をサーバーへ送る。オフライン時は pendingPaths に記録だけして
  // 再接続時（sync_end 処理）に送信する
  async uploadFile(file: TFile) {
    this.pendingPaths.add(file.path);
    this.scheduleSaveHashes();
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    if (isBinaryExt(file.extension)) {
      const buffer = await this.app.vault.readBinary(file);
      const content = arrayBufferToBase64(buffer);
      this.ws.send(JSON.stringify({ type: 'save_file', path: file.path, content, binary: true, timestamp: Date.now() }));
    } else {
      const content = await this.app.vault.read(file);
      this.ws.send(JSON.stringify({ type: 'save_file', path: file.path, content, timestamp: Date.now() }));
    }
  }

  buildServerUrl(): string {
    const token = this.settings.authToken.trim();
    if (!token) return this.settings.serverUrl;
    const sep = this.settings.serverUrl.includes('?') ? '&' : '?';
    return `${this.settings.serverUrl}${sep}token=${encodeURIComponent(token)}`;
  }

  forceReconnect() {
    new Notice('PoetSync: 再接続中...');
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.isConnecting = false;
    this.connect();
  }

  connect() {
    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      this.ws = new WebSocket(this.buildServerUrl());

      this.ws.onopen = () => {
        this.isConnecting = false;
        new Notice('PoetSync: サーバーに接続しました ✅');
        console.log('PoetSync: Connected');
      };

      this.ws.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          await this.handleMessage(message);
        } catch (err) {
          console.error('PoetSync: Message parse error', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        console.log('PoetSync: Disconnected, reconnecting in 5s...');
        this.reconnectTimer = window.setTimeout(() => this.connect(), 5000);
      };

      this.ws.onerror = (err) => {
        this.isConnecting = false;
        console.error('PoetSync: WebSocket error', err);
      };

    } catch (err) {
      this.isConnecting = false;
      console.error('PoetSync: Connection failed', err);
    }
  }

  async handleMessage(message: any) {
    const vault = this.app.vault;

    if (message.type === 'sync_start') {
      this.isSyncing = true;
      this.syncingPaths.clear();
    }

    if (message.type === 'file_added' || message.type === 'file_changed') {
      if (this.isSyncing) {
        this.syncingPaths.add(message.path);
      }
      const serverHash: string | undefined = message.hash;
      if (serverHash) {
        const lastKnownHash = this.serverFileHashes.get(message.path);
        if (lastKnownHash === serverHash) {
          return;
        }
      }
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'get_file', path: message.path }));
      }
    }

    if (message.type === 'sync_end') {
      this.isSyncing = false;
      const serverPaths = new Set(this.syncingPaths);
      this.syncingPaths.clear();
      this.app.workspace.onLayoutReady(async () => {
        const allLocalFiles = this.app.vault.getFiles();
        for (const file of allLocalFiles) {
          if (serverPaths.has(file.path)) continue;
          if (this.serverFileHashes.has(file.path)) {
            // 同期済みだったファイルがサーバーから消えた → 他デバイスで削除された
            this.ignorePaths.add(file.path);
            this.serverFileHashes.delete(file.path);
            this.pendingPaths.delete(file.path);
            await this.app.vault.delete(file);
            setTimeout(() => this.ignorePaths.delete(file.path), 5000);
            console.log(`PoetSync: Removed stale file ${file.path}`);
          } else if (this.settings.sendEnabled) {
            // 同期履歴がない＝オフライン中などに作られた新規ファイル → 削除せずアップロード
            console.log(`PoetSync: Uploading new local file ${file.path}`);
            await this.uploadFile(file);
          }
        }
        // オフライン中に編集したファイル（サーバーにもあるもの）を送信
        if (this.settings.sendEnabled) {
          for (const p of [...this.pendingPaths]) {
            const f = this.app.vault.getAbstractFileByPath(p);
            if (f instanceof TFile) {
              console.log(`PoetSync: Uploading pending change ${p}`);
              await this.uploadFile(f);
            } else {
              this.pendingPaths.delete(p);
            }
          }
        }
        this.scheduleSaveHashes();
      });
    }

    if (message.type === 'file_content') {
      const filePath: string = message.path;
      const existingFile = vault.getAbstractFileByPath(filePath);

      // ローカルに未送信の変更があるのに、サーバーから別の内容が届いた → 競合。
      // ローカル版を競合コピーとして退避してからサーバー版を適用する
      if (this.pendingPaths.has(filePath) && existingFile instanceof TFile) {
        const conflictPath = makeConflictPath(filePath);
        try {
          if (isBinaryExt(existingFile.extension)) {
            const localBuffer = await vault.readBinary(existingFile);
            await vault.createBinary(conflictPath, localBuffer);
          } else {
            const localContent = await vault.read(existingFile);
            await vault.create(conflictPath, localContent);
          }
          new Notice(`PoetSync: 競合を検出。ローカル版を「${conflictPath}」に保存しました`);
          console.log(`PoetSync: Conflict detected, local copy saved as ${conflictPath}`);
        } catch (err) {
          console.error('PoetSync: Conflict copy failed', err);
        }
        this.pendingPaths.delete(filePath);
      }

      this.ignorePaths.add(filePath);
      const dir = filePath.split('/').slice(0, -1).join('/');
      if (dir && !vault.getAbstractFileByPath(dir)) {
        await vault.createFolder(dir);
      }
      if (message.binary) {
        const arrayBuffer = base64ToArrayBuffer(message.content);
        if (existingFile instanceof TFile) {
          await vault.modifyBinary(existingFile, arrayBuffer);
        } else {
          await vault.createBinary(filePath, arrayBuffer);
        }
      } else {
        if (existingFile instanceof TFile) {
          await vault.modify(existingFile, message.content);
        } else {
          await vault.create(filePath, message.content);
        }
      }
      if (message.hash) {
        this.serverFileHashes.set(filePath, message.hash);
        this.scheduleSaveHashes();
      }
      setTimeout(() => this.ignorePaths.delete(filePath), 5000);
      console.log(`PoetSync: Synced ${filePath}`);
    }

    if (message.type === 'file_saved') {
      this.pendingPaths.delete(message.path);
      if (message.hash) {
        this.serverFileHashes.set(message.path, message.hash);
      }
      this.scheduleSaveHashes();
    }

    if (message.type === 'file_deleted') {
      const file = vault.getAbstractFileByPath(message.path);
      if (file) {
        this.ignorePaths.add(message.path);
        await vault.delete(file);
        setTimeout(() => this.ignorePaths.delete(message.path), 5000);
        console.log(`PoetSync: Deleted ${message.path}`);
      }
      this.serverFileHashes.delete(message.path);
      this.pendingPaths.delete(message.path);
      this.scheduleSaveHashes();
    }

    if (message.type === 'folder_deleted') {
      const folder = vault.getAbstractFileByPath(message.path);
      if (folder) {
        this.ignorePaths.add(message.path);
        await vault.delete(folder, true);
        setTimeout(() => this.ignorePaths.delete(message.path), 5000);
        console.log(`PoetSync: Deleted folder ${message.path}`);
      }
      const prefix = message.path + '/';
      for (const key of this.serverFileHashes.keys()) {
        if (key.startsWith(prefix)) this.serverFileHashes.delete(key);
      }
      for (const key of [...this.pendingPaths]) {
        if (key.startsWith(prefix)) this.pendingPaths.delete(key);
      }
      this.scheduleSaveHashes();
    }

    if (message.type === 'file_renamed') {
      const file = vault.getAbstractFileByPath(message.oldPath);
      if (file) {
        this.ignorePaths.add(message.oldPath);
        this.ignorePaths.add(message.newPath);
        const dir = message.newPath.split('/').slice(0, -1).join('/');
        if (dir && !vault.getAbstractFileByPath(dir)) {
          await vault.createFolder(dir);
        }
        await vault.rename(file, message.newPath);
        setTimeout(() => {
          this.ignorePaths.delete(message.oldPath);
          this.ignorePaths.delete(message.newPath);
        }, 5000);
        console.log(`PoetSync: Renamed ${message.oldPath} -> ${message.newPath}`);
      }
      const oldHash = this.serverFileHashes.get(message.oldPath);
      this.serverFileHashes.delete(message.oldPath);
      if (oldHash) this.serverFileHashes.set(message.newPath, oldHash);
      if (this.pendingPaths.delete(message.oldPath)) this.pendingPaths.add(message.newPath);
      this.scheduleSaveHashes();
    }

    if (message.type === 'folder_renamed') {
      const folder = vault.getAbstractFileByPath(message.oldPath);
      if (folder instanceof TFolder) {
        this.ignorePaths.add(message.oldPath);
        this.ignorePaths.add(message.newPath);
        const dir = message.newPath.split('/').slice(0, -1).join('/');
        if (dir && !vault.getAbstractFileByPath(dir)) {
          await vault.createFolder(dir);
        }
        await vault.rename(folder, message.newPath);
        setTimeout(() => {
          this.ignorePaths.delete(message.oldPath);
          this.ignorePaths.delete(message.newPath);
        }, 5000);
        console.log(`PoetSync: Renamed folder ${message.oldPath} -> ${message.newPath}`);
      }
      const prefix = message.oldPath + '/';
      for (const key of [...this.serverFileHashes.keys()]) {
        if (key.startsWith(prefix)) {
          const hash = this.serverFileHashes.get(key)!;
          this.serverFileHashes.delete(key);
          this.serverFileHashes.set(message.newPath + '/' + key.slice(prefix.length), hash);
        }
      }
      for (const key of [...this.pendingPaths]) {
        if (key.startsWith(prefix)) {
          this.pendingPaths.delete(key);
          this.pendingPaths.add(message.newPath + '/' + key.slice(prefix.length));
        }
      }
      this.scheduleSaveHashes();
    }
  }

  scheduleSaveHashes() {
    if (this.hashSaveTimer) window.clearTimeout(this.hashSaveTimer);
    this.hashSaveTimer = window.setTimeout(() => this.saveSettings(), 3000);
  }

  onunload() {
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
    if (this.hashSaveTimer) window.clearTimeout(this.hashSaveTimer);
    if (this.ws) this.ws.close();
    console.log('PoetSync plugin unloaded');
  }

  async loadSettings() {
    const data = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
    delete (this.settings as any).serverFileHashes;
    delete (this.settings as any).pendingPaths;
    if (data?.serverFileHashes) {
      this.serverFileHashes = new Map(Object.entries(data.serverFileHashes));
      console.log(`PoetSync: Loaded ${this.serverFileHashes.size} cached hashes`);
    }
    if (Array.isArray(data?.pendingPaths)) {
      this.pendingPaths = new Set(data.pendingPaths);
      if (this.pendingPaths.size > 0) {
        console.log(`PoetSync: Loaded ${this.pendingPaths.size} pending paths`);
      }
    }
  }

  async saveSettings() {
    await this.saveData({
      ...this.settings,
      serverFileHashes: Object.fromEntries(this.serverFileHashes),
      pendingPaths: [...this.pendingPaths],
    });
  }
}

class PoetSyncSettingTab extends PluginSettingTab {
  plugin: PoetSyncPlugin;

  constructor(app: App, plugin: PoetSyncPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'PoetSync 設定' });

    new Setting(containerEl)
      .setName('サーバーURL')
      .setDesc('PoetSyncサーバーのWebSocket URL')
      .addText(text => text
        .setPlaceholder('ws://localhost:27124')
        .setValue(this.plugin.settings.serverUrl)
        .onChange(async (value) => {
          this.plugin.settings.serverUrl = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('認証トークン')
      .setDesc('サーバー側で POETSYNC_TOKEN を設定した場合のみ入力（空欄なら認証なし）')
      .addText(text => text
        .setPlaceholder('（未設定）')
        .setValue(this.plugin.settings.authToken)
        .onChange(async (value) => {
          this.plugin.settings.authToken = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('同期を有効化')
      .setDesc('サーバーへの接続を有効にする')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enabled)
        .onChange(async (value) => {
          this.plugin.settings.enabled = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('送信を有効化')
      .setDesc('このデバイスの変更をサーバーに送信する（UbuntuはオフでOK）')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.sendEnabled)
        .onChange(async (value) => {
          this.plugin.settings.sendEnabled = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('再接続')
      .setDesc('WebSocket接続を切り直して再接続する（同期が止まったときに使う）')
      .addButton(button => button
        .setButtonText('再接続')
        .setCta()
        .onClick(() => {
          this.plugin.forceReconnect();
        }));

    new Setting(containerEl)
      .setName('キャッシュをクリア')
      .setDesc('ハッシュキャッシュをリセットして全ファイルを再同期する')
      .addButton(button => button
        .setButtonText('クリア')
        .onClick(async () => {
          this.plugin.serverFileHashes.clear();
          await this.plugin.saveSettings();
          if (this.plugin.ws) this.plugin.ws.close();
          new Notice('PoetSync: キャッシュをクリアしました。5秒後に再接続して全ファイルを再同期します。');
        }));
  }
}
