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
  }
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new PoetSyncSettingTab(this.app, this));
    if (this.settings.enabled) this.connect();
    this.registerEvent(
      this.app.vault.on("modify", async (file) => {
        if (!this.settings.sendEnabled) return;
        if (this.ignorePaths.has(file.path)) return;
        if (!(file instanceof import_obsidian.TFile)) return;
        if (this.ws?.readyState !== WebSocket.OPEN) return;
        const content = await this.app.vault.read(file);
        this.ws.send(JSON.stringify({ type: "save_file", path: file.path, content, timestamp: Date.now() }));
      })
    );
    this.registerEvent(
      this.app.vault.on("create", async (file) => {
        if (!this.settings.sendEnabled) return;
        if (this.ignorePaths.has(file.path)) return;
        if (!(file instanceof import_obsidian.TFile)) return;
        if (this.ws?.readyState !== WebSocket.OPEN) return;
        const content = await this.app.vault.read(file);
        this.ws.send(JSON.stringify({ type: "save_file", path: file.path, content, timestamp: Date.now() }));
      })
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        if (!this.settings.sendEnabled) return;
        if (this.ignorePaths.has(file.path)) return;
        if (this.ws?.readyState !== WebSocket.OPEN) return;
        console.log(`PoetSync: Sending delete for ${file.path}`);
        this.ws.send(JSON.stringify({ type: "delete_file", path: file.path, timestamp: Date.now() }));
      })
    );
    this.registerEvent(
      this.app.vault.on("rename", async (file, oldPath) => {
        if (!this.settings.sendEnabled) return;
        if (this.ws?.readyState !== WebSocket.OPEN) return;
        console.log(`PoetSync: Sending rename ${oldPath} -> ${file.path}`);
        this.ws.send(JSON.stringify({ type: "rename_file", oldPath, newPath: file.path, timestamp: Date.now() }));
      })
    );
    console.log("PoetSync plugin loaded");
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
    if (message.type === "file_added" || message.type === "file_changed") {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "get_file", path: message.path }));
      }
    }
    if (message.type === "file_content") {
      const filePath = message.path;
      const content = message.content;
      this.ignorePaths.add(filePath);
      const existingFile = vault.getAbstractFileByPath(filePath);
      if (existingFile instanceof import_obsidian.TFile) {
        await vault.modify(existingFile, content);
      } else {
        const dir = filePath.split("/").slice(0, -1).join("/");
        if (dir && !vault.getAbstractFileByPath(dir)) {
          await vault.createFolder(dir);
        }
        await vault.create(filePath, content);
      }
      setTimeout(() => this.ignorePaths.delete(filePath), 5e3);
      console.log(`PoetSync: Synced ${filePath}`);
    }
    if (message.type === "file_deleted") {
      const file = vault.getAbstractFileByPath(message.path);
      if (file) {
        this.ignorePaths.add(message.path);
        await vault.delete(file);
        setTimeout(() => this.ignorePaths.delete(message.path), 5e3);
        console.log(`PoetSync: Deleted ${message.path}`);
      }
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
    }
  }
  onunload() {
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
    if (this.ws) this.ws.close();
    console.log("PoetSync plugin unloaded");
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
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
  }
};
