"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => PoetSyncPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var BINARY_EXTENSIONS = /* @__PURE__ */ new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "bmp",
  "ico",
  "tiff",
  "pdf",
  "zip",
  "gz",
  "tar",
  "mp3",
  "mp4",
  "wav",
  "ogg",
  "mov",
  "avi",
  "mkv"
]);
function isBinaryExt(ext) {
  return BINARY_EXTENSIONS.has(ext.toLowerCase());
}
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
var DEFAULT_SETTINGS = {
  serverUrl: "ws://localhost:27124",
  enabled: true,
  sendEnabled: true
};
var PoetSyncPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.ws = null;
    this.reconnectTimer = null;
    this.isConnecting = false;
    this.ignorePaths = /* @__PURE__ */ new Set();
    this.serverFileHashes = /* @__PURE__ */ new Map();
    this.hashSaveTimer = null;
    this.isSyncing = false;
    this.syncingPaths = /* @__PURE__ */ new Set();
  }
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new PoetSyncSettingTab(this.app, this));
    if (this.settings.enabled) this.connect();
    this.addRibbonIcon("refresh-cw", "PoetSync: \u518D\u63A5\u7D9A", () => {
      this.forceReconnect();
    });
    this.registerEvent(
      this.app.vault.on("modify", async (file) => {
        if (!this.settings.sendEnabled) return;
        if (this.ignorePaths.has(file.path)) return;
        if (!(file instanceof import_obsidian.TFile)) return;
        if (this.ws?.readyState !== WebSocket.OPEN) return;
        if (isBinaryExt(file.extension)) {
          const buffer = await this.app.vault.readBinary(file);
          const content = arrayBufferToBase64(buffer);
          this.ws.send(JSON.stringify({ type: "save_file", path: file.path, content, binary: true, timestamp: Date.now() }));
        } else {
          const content = await this.app.vault.read(file);
          this.ws.send(JSON.stringify({ type: "save_file", path: file.path, content, timestamp: Date.now() }));
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("create", async (file) => {
        if (!this.settings.sendEnabled) return;
        if (this.ignorePaths.has(file.path)) return;
        if (!(file instanceof import_obsidian.TFile)) return;
        if (this.ws?.readyState !== WebSocket.OPEN) return;
        if (isBinaryExt(file.extension)) {
          const buffer = await this.app.vault.readBinary(file);
          const content = arrayBufferToBase64(buffer);
          this.ws.send(JSON.stringify({ type: "save_file", path: file.path, content, binary: true, timestamp: Date.now() }));
        } else {
          const content = await this.app.vault.read(file);
          this.ws.send(JSON.stringify({ type: "save_file", path: file.path, content, timestamp: Date.now() }));
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        if (!this.settings.sendEnabled) return;
        if (this.ignorePaths.has(file.path)) return;
        if (this.ws?.readyState !== WebSocket.OPEN) return;
        if (file instanceof import_obsidian.TFolder) {
          this.ws.send(JSON.stringify({ type: "delete_folder", path: file.path, timestamp: Date.now() }));
        } else {
          this.serverFileHashes.delete(file.path);
          this.ws.send(JSON.stringify({ type: "delete_file", path: file.path, timestamp: Date.now() }));
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("rename", async (file, oldPath) => {
        if (!this.settings.sendEnabled) return;
        if (this.ws?.readyState !== WebSocket.OPEN) return;
        const oldHash = this.serverFileHashes.get(oldPath);
        this.serverFileHashes.delete(oldPath);
        if (oldHash) this.serverFileHashes.set(file.path, oldHash);
        this.ws.send(JSON.stringify({ type: "rename_file", oldPath, newPath: file.path, timestamp: Date.now() }));
      })
    );
    console.log("PoetSync plugin loaded");
  }
  forceReconnect() {
    new import_obsidian.Notice("PoetSync: \u518D\u63A5\u7D9A\u4E2D...");
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
      this.ws = new WebSocket(this.settings.serverUrl);
      this.ws.onopen = () => {
        this.isConnecting = false;
        new import_obsidian.Notice("PoetSync: \u30B5\u30FC\u30D0\u30FC\u306B\u63A5\u7D9A\u3057\u307E\u3057\u305F \u2705");
        console.log("PoetSync: Connected");
      };
      this.ws.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          await this.handleMessage(message);
        } catch (err) {
          console.error("PoetSync: Message parse error", err);
        }
      };
      this.ws.onclose = () => {
        this.isConnecting = false;
        console.log("PoetSync: Disconnected, reconnecting in 5s...");
        this.reconnectTimer = window.setTimeout(() => this.connect(), 5e3);
      };
      this.ws.onerror = (err) => {
        this.isConnecting = false;
        console.error("PoetSync: WebSocket error", err);
      };
    } catch (err) {
      this.isConnecting = false;
      console.error("PoetSync: Connection failed", err);
    }
  }
  async handleMessage(message) {
    const vault = this.app.vault;
    if (message.type === "sync_start") {
      this.isSyncing = true;
      this.syncingPaths.clear();
    }
    if (message.type === "file_added" || message.type === "file_changed") {
      if (this.isSyncing) {
        this.syncingPaths.add(message.path);
      }
      const serverHash = message.hash;
      if (serverHash) {
        const lastKnownHash = this.serverFileHashes.get(message.path);
        if (lastKnownHash === serverHash) {
          return;
        }
      }
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "get_file", path: message.path }));
      }
    }
    if (message.type === "sync_end") {
      this.isSyncing = false;
      const serverPaths = new Set(this.syncingPaths);
      this.syncingPaths.clear();
      this.app.workspace.onLayoutReady(async () => {
        const allLocalFiles = this.app.vault.getFiles();
        for (const file of allLocalFiles) {
          if (!serverPaths.has(file.path)) {
            this.ignorePaths.add(file.path);
            this.serverFileHashes.delete(file.path);
            await this.app.vault.delete(file);
            setTimeout(() => this.ignorePaths.delete(file.path), 5e3);
            console.log(`PoetSync: Removed stale file ${file.path}`);
          }
        }
        this.scheduleSaveHashes();
      });
    }
    if (message.type === "file_content") {
      const filePath = message.path;
      this.ignorePaths.add(filePath);
      const existingFile = vault.getAbstractFileByPath(filePath);
      const dir = filePath.split("/").slice(0, -1).join("/");
      if (dir && !vault.getAbstractFileByPath(dir)) {
        await vault.createFolder(dir);
      }
      if (message.binary) {
        const arrayBuffer = base64ToArrayBuffer(message.content);
        if (existingFile instanceof import_obsidian.TFile) {
          await vault.modifyBinary(existingFile, arrayBuffer);
        } else {
          await vault.createBinary(filePath, arrayBuffer);
        }
      } else {
        if (existingFile instanceof import_obsidian.TFile) {
          await vault.modify(existingFile, message.content);
        } else {
          await vault.create(filePath, message.content);
        }
      }
      if (message.hash) {
        this.serverFileHashes.set(filePath, message.hash);
        this.scheduleSaveHashes();
      }
      setTimeout(() => this.ignorePaths.delete(filePath), 5e3);
      console.log(`PoetSync: Synced ${filePath}`);
    }
    if (message.type === "file_saved") {
      if (message.hash) {
        this.serverFileHashes.set(message.path, message.hash);
        this.scheduleSaveHashes();
      }
    }
    if (message.type === "file_deleted") {
      const file = vault.getAbstractFileByPath(message.path);
      if (file) {
        this.ignorePaths.add(message.path);
        await vault.delete(file);
        setTimeout(() => this.ignorePaths.delete(message.path), 5e3);
        console.log(`PoetSync: Deleted ${message.path}`);
      }
      this.serverFileHashes.delete(message.path);
      this.scheduleSaveHashes();
    }
    if (message.type === "folder_deleted") {
      const folder = vault.getAbstractFileByPath(message.path);
      if (folder) {
        this.ignorePaths.add(message.path);
        await vault.delete(folder, true);
        setTimeout(() => this.ignorePaths.delete(message.path), 5e3);
        console.log(`PoetSync: Deleted folder ${message.path}`);
      }
      const prefix = message.path + "/";
      for (const key of this.serverFileHashes.keys()) {
        if (key.startsWith(prefix)) this.serverFileHashes.delete(key);
      }
      this.scheduleSaveHashes();
    }
    if (message.type === "file_renamed") {
      const file = vault.getAbstractFileByPath(message.oldPath);
      if (file) {
        this.ignorePaths.add(message.oldPath);
        this.ignorePaths.add(message.newPath);
        const dir = message.newPath.split("/").slice(0, -1).join("/");
        if (dir && !vault.getAbstractFileByPath(dir)) {
          await vault.createFolder(dir);
        }
        await vault.rename(file, message.newPath);
        setTimeout(() => {
          this.ignorePaths.delete(message.oldPath);
          this.ignorePaths.delete(message.newPath);
        }, 5e3);
        console.log(`PoetSync: Renamed ${message.oldPath} -> ${message.newPath}`);
      }
      const oldHash = this.serverFileHashes.get(message.oldPath);
      this.serverFileHashes.delete(message.oldPath);
      if (oldHash) this.serverFileHashes.set(message.newPath, oldHash);
      this.scheduleSaveHashes();
    }
  }
  scheduleSaveHashes() {
    if (this.hashSaveTimer) window.clearTimeout(this.hashSaveTimer);
    this.hashSaveTimer = window.setTimeout(() => this.saveSettings(), 3e3);
  }
  onunload() {
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
    if (this.hashSaveTimer) window.clearTimeout(this.hashSaveTimer);
    if (this.ws) this.ws.close();
    console.log("PoetSync plugin unloaded");
  }
  async loadSettings() {
    const data = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
    if (data?.serverFileHashes) {
      this.serverFileHashes = new Map(Object.entries(data.serverFileHashes));
      console.log(`PoetSync: Loaded ${this.serverFileHashes.size} cached hashes`);
    }
  }
  async saveSettings() {
    await this.saveData({
      ...this.settings,
      serverFileHashes: Object.fromEntries(this.serverFileHashes)
    });
  }
};
var PoetSyncSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "PoetSync \u8A2D\u5B9A" });
    new import_obsidian.Setting(containerEl).setName("\u30B5\u30FC\u30D0\u30FCURL").setDesc("PoetSync\u30B5\u30FC\u30D0\u30FC\u306EWebSocket URL").addText((text) => text.setPlaceholder("ws://localhost:27124").setValue(this.plugin.settings.serverUrl).onChange(async (value) => {
      this.plugin.settings.serverUrl = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("\u540C\u671F\u3092\u6709\u52B9\u5316").setDesc("\u30B5\u30FC\u30D0\u30FC\u3078\u306E\u63A5\u7D9A\u3092\u6709\u52B9\u306B\u3059\u308B").addToggle((toggle) => toggle.setValue(this.plugin.settings.enabled).onChange(async (value) => {
      this.plugin.settings.enabled = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("\u9001\u4FE1\u3092\u6709\u52B9\u5316").setDesc("\u3053\u306E\u30C7\u30D0\u30A4\u30B9\u306E\u5909\u66F4\u3092\u30B5\u30FC\u30D0\u30FC\u306B\u9001\u4FE1\u3059\u308B\uFF08Ubuntu\u306F\u30AA\u30D5\u3067OK\uFF09").addToggle((toggle) => toggle.setValue(this.plugin.settings.sendEnabled).onChange(async (value) => {
      this.plugin.settings.sendEnabled = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("\u518D\u63A5\u7D9A").setDesc("WebSocket\u63A5\u7D9A\u3092\u5207\u308A\u76F4\u3057\u3066\u518D\u63A5\u7D9A\u3059\u308B\uFF08\u540C\u671F\u304C\u6B62\u307E\u3063\u305F\u3068\u304D\u306B\u4F7F\u3046\uFF09").addButton((button) => button.setButtonText("\u518D\u63A5\u7D9A").setCta().onClick(() => {
      this.plugin.forceReconnect();
    }));
    new import_obsidian.Setting(containerEl).setName("\u30AD\u30E3\u30C3\u30B7\u30E5\u3092\u30AF\u30EA\u30A2").setDesc("\u30CF\u30C3\u30B7\u30E5\u30AD\u30E3\u30C3\u30B7\u30E5\u3092\u30EA\u30BB\u30C3\u30C8\u3057\u3066\u5168\u30D5\u30A1\u30A4\u30EB\u3092\u518D\u540C\u671F\u3059\u308B").addButton((button) => button.setButtonText("\u30AF\u30EA\u30A2").onClick(async () => {
      this.plugin.serverFileHashes.clear();
      await this.plugin.saveSettings();
      if (this.plugin.ws) this.plugin.ws.close();
      new import_obsidian.Notice("PoetSync: \u30AD\u30E3\u30C3\u30B7\u30E5\u3092\u30AF\u30EA\u30A2\u3057\u307E\u3057\u305F\u30025\u79D2\u5F8C\u306B\u518D\u63A5\u7D9A\u3057\u3066\u5168\u30D5\u30A1\u30A4\u30EB\u3092\u518D\u540C\u671F\u3057\u307E\u3059\u3002");
    }));
  }
};
