# PoetSync

CouchDB を使わない、WebSocket ベースの Obsidian Vault 同期システムです。
Ubuntu サーバー上で動作する Node.js サーバーと、Obsidian カスタムプラグインで構成されています。

---

## 概要

Obsidian の公式同期や LiveSync（CouchDB）を使わずに、複数デバイス間で Vault をリアルタイム同期するための自作ツールです。

- サーバーが Vault フォルダを監視し、変更をすべての接続クライアントにブロードキャスト
- クライアント（Obsidian プラグイン）はサーバーと WebSocket で通信
- MD5 ハッシュによる差分検出で、不要な転送をスキップ
- オフライン中に作成されたファイルも、再接続時に確実に同期

## アーキテクチャ

```
[Ubuntu Vault]
  chokidar で監視
       ↓
[PoetSync Server]  ←→  WebSocket (port 27124)  ←→  [iPhone / iPad / 他のPC]
  server.js                                           Obsidian Plugin
```

- **サーバー**: Node.js + `chokidar`（ファイル監視）+ `ws`（WebSocket）
- **プラグイン**: TypeScript 製 Obsidian コミュニティプラグイン
- **Ubuntu 上の Obsidian**: `sendEnabled: false` に設定（chokidar がファイル変更を直接検知するため不要）
- **`.obsidian` フォルダ**: 同期対象外（隠しフォルダを除外）

## 対応イベント

| イベント | 方向 | 説明 |
|---|---|---|
| `file_added` | Server → Client | ファイル追加・接続時の初期同期 |
| `file_changed` | Server → Client | ファイル変更 |
| `file_deleted` | 双方向 | ファイル削除（`.trash` 経由も対応）|
| `file_renamed` | 双方向 | ファイル名変更・移動 |
| `get_file` | Client → Server | ファイル内容の要求 |
| `save_file` | Client → Server | ファイルの保存・送信 |

---

## セットアップ

### サーバー

**必要環境**: Node.js 18 以上

```bash
git clone <このリポジトリ>
cd poetsync-server
npm install
```

`server.js` の `CONFIG` を自分の環境に合わせて編集します：

```js
const CONFIG = {
  port: 27124,
  host: '0.0.0.0',
  vaultPath: '/path/to/your/Obsidian/Vault',  // ← 変更
};
```

起動：

```bash
# 通常起動
node server.js

# バックグラウンド起動（ログ付き）
nohup node server.js > /tmp/poetsync.log 2>&1 &
```

ログ確認：

```bash
grep -E "\[GET\]|\[ADD\]|\[CHANGE\]|CONNECT" /tmp/poetsync.log
```

### Obsidian プラグイン

**必要環境**: Node.js 18 以上

```bash
cd poetsync-plugin
npm install
npm run build
```

生成された `main.js` を Vault の `.obsidian/plugins/poetsync/` にコピーして、Obsidian で有効化してください。

プラグインの設定画面で以下を設定します：

| 設定項目 | 説明 |
|---|---|
| サーバーURL | `ws://サーバーのIPアドレス:27124` |
| 同期を有効化 | サーバーへの接続を ON/OFF |
| 送信を有効化 | このデバイスの変更をサーバーに送信する（Ubuntu は OFF でOK）|
| キャッシュをクリア | ハッシュキャッシュをリセットして全ファイルを強制再同期 |

---

## 注意事項

- `.obsidian` フォルダは同期対象外のため、プラグインの更新は各デバイスに手動で配布する必要があります
- `sendEnabled: false` にしたデバイスは受信専用になります（Ubuntu 上の Obsidian 推奨設定）
- ポート 27124 がファイアウォールで許可されていることを確認してください

---

## License

MIT

---

---

# PoetSync (English)

A WebSocket-based Obsidian Vault sync system — no CouchDB required.
Consists of a Node.js server running on Ubuntu and a custom Obsidian plugin.

## Overview

A self-built sync tool for keeping your Obsidian Vault in sync across multiple devices, without relying on Obsidian Sync or LiveSync (CouchDB).

- The server watches the Vault directory and broadcasts changes to all connected clients
- Clients (Obsidian plugin) communicate with the server over WebSocket
- MD5 hash-based diffing skips unnecessary transfers
- Files created while offline are reliably synced upon reconnection

## Architecture

```
[Ubuntu Vault]
  watched by chokidar
       ↓
[PoetSync Server]  ←→  WebSocket (port 27124)  ←→  [iPhone / iPad / other PC]
  server.js                                          Obsidian Plugin
```

- **Server**: Node.js + `chokidar` (file watching) + `ws` (WebSocket)
- **Plugin**: Custom Obsidian plugin written in TypeScript
- **Ubuntu Obsidian**: Set `sendEnabled: false` (chokidar detects changes directly)
- **`.obsidian` folder**: Excluded from sync (hidden folders are ignored)

## Supported Events

| Event | Direction | Description |
|---|---|---|
| `file_added` | Server → Client | File added / initial sync on connect |
| `file_changed` | Server → Client | File modified |
| `file_deleted` | Both | File deleted (including via `.trash`) |
| `file_renamed` | Both | File renamed or moved |
| `get_file` | Client → Server | Request file content |
| `save_file` | Client → Server | Save and push file to server |

## Setup

### Server

**Requirements**: Node.js 18+

```bash
git clone <this repository>
cd poetsync-server
npm install
```

Edit the `CONFIG` in `server.js` to match your environment:

```js
const CONFIG = {
  port: 27124,
  host: '0.0.0.0',
  vaultPath: '/path/to/your/Obsidian/Vault',  // ← change this
};
```

Start the server:

```bash
# Normal
node server.js

# Background with logging
nohup node server.js > /tmp/poetsync.log 2>&1 &
```

Check logs:

```bash
grep -E "\[GET\]|\[ADD\]|\[CHANGE\]|CONNECT" /tmp/poetsync.log
```

### Obsidian Plugin

**Requirements**: Node.js 18+

```bash
cd poetsync-plugin
npm install
npm run build
```

Copy the generated `main.js` to `.obsidian/plugins/poetsync/` in your Vault, then enable it in Obsidian.

Configure in the plugin settings:

| Setting | Description |
|---|---|
| Server URL | `ws://<server-ip>:27124` |
| Enable sync | Toggle the WebSocket connection |
| Enable send | Send this device's changes to the server (turn OFF on Ubuntu) |
| Clear cache | Reset hash cache to force a full re-sync |

## Notes

- `.obsidian` is excluded from sync — plugin updates must be manually distributed to each device
- Setting `sendEnabled: false` makes the device receive-only (recommended for the Ubuntu Obsidian instance)
- Make sure port 27124 is open in your firewall

## License

MIT
