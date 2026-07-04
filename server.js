const WebSocket = require('ws');
const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CONFIG = {
  port: 27124,
  host: '0.0.0.0',
  vaultPath: '/home/hideharu/Obsidian/JW',
};

// .env の POETSYNC_TOKEN が設定されている場合のみ認証を要求する
let AUTH_TOKEN = process.env.POETSYNC_TOKEN || null;
try {
  const envText = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  const m = envText.match(/^POETSYNC_TOKEN=(.+)$/m);
  if (m) AUTH_TOKEN = m[1].trim();
} catch {}

console.log('=================================');
console.log('PoetSync Server starting...');
console.log(`Vault: ${CONFIG.vaultPath}`);
console.log(`Port: ${CONFIG.port}`);
console.log(`Auth: ${AUTH_TOKEN ? 'enabled' : 'disabled'}`);
console.log('=================================');

const wss = new WebSocket.Server({ host: CONFIG.host, port: CONFIG.port });
const clients = new Set();
const fileHashes = new Map();
const pendingSyncClients = new Set();

function getFileHash(filePath) {
  try {
    if (!fs.statSync(filePath).isFile()) return null;
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex');
  } catch { return null; }
}

// Vault 外へのパストラバーサルを防ぐ。不正なら null
function resolveVaultPath(relPath) {
  if (typeof relPath !== 'string' || relPath.length === 0) return null;
  const abs = path.resolve(CONFIG.vaultPath, relPath);
  if (abs === CONFIG.vaultPath) return null;
  if (!abs.startsWith(CONFIG.vaultPath + path.sep)) return null;
  return abs;
}

const BINARY_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'tiff',
  'pdf', 'zip', 'gz', 'tar',
  'mp3', 'mp4', 'wav', 'ogg', 'mov', 'avi', 'mkv',
]);

function isBinaryFile(filePath) {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

function broadcast(message, excludeClient = null) {
  const data = JSON.stringify(message);
  clients.forEach(client => {
    if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// 接続時: sync_start → file_added × N → sync_end の順で送信
// クライアントは sync_end 受信後にサーバーにないローカルファイルを整理できる
function sendInitialSync(ws, remoteAddress) {
  if (ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({ type: 'sync_start', timestamp: Date.now() }));
  fileHashes.forEach((hash, relativePath) => {
    ws.send(JSON.stringify({ type: 'file_added', path: relativePath, hash, timestamp: Date.now() }));
  });
  ws.send(JSON.stringify({ type: 'sync_end', timestamp: Date.now() }));
  console.log(`[SYNC] Sent ${fileHashes.size} file_added events to ${remoteAddress}`);
}

// フォルダ移動・改名の共通処理（rename_folder と、旧クライアントがフォルダに送る rename_file の両方から使う）
function renameFolder(oldPath, newPath, senderWs) {
  const oldDir = resolveVaultPath(oldPath);
  const newDir = resolveVaultPath(newPath);
  if (!oldDir || !newDir) { console.log(`[BLOCKED] rename_folder ${oldPath} -> ${newPath}`); return; }
  if (!fs.existsSync(oldDir) || !fs.statSync(oldDir).isDirectory()) return;
  const parent = path.dirname(newDir);
  if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
  fs.renameSync(oldDir, newDir);
  const prefix = oldPath + '/';
  for (const key of [...fileHashes.keys()]) {
    if (key.startsWith(prefix)) {
      const hash = fileHashes.get(key);
      fileHashes.delete(key);
      fileHashes.set(newPath + '/' + key.slice(prefix.length), hash);
    }
  }
  console.log(`[RENAMED-DIR] ${oldPath} -> ${newPath}`);
  broadcast({ type: 'folder_renamed', oldPath, newPath, timestamp: Date.now() }, senderWs);
}

// 通常ファイルの監視（隠しフォルダを除外）
const watcher = chokidar.watch(CONFIG.vaultPath, {
  ignored: /(^|[\/\\])\../,
  persistent: true,
  ignoreInitial: false,
  usePolling: true,
  interval: 1000,
  awaitWriteFinish: {
    stabilityThreshold: 2000,
    pollInterval: 500
  }
});

// .trashフォルダを別途監視（削除検知用）
const trashWatcher = chokidar.watch(path.join(CONFIG.vaultPath, '.trash'), {
  persistent: true,
  ignoreInitial: true,
  usePolling: true,
  interval: 1000,
});

trashWatcher.on('add', filePath => {
  const fileName = path.basename(filePath);
  // .trash にはファイル名しか残らないため、同名ファイルが複数ある場合は
  // どれが削除されたか特定できない → 誤削除を避けるためスキップ
  const matches = [...fileHashes.keys()].filter(p => path.basename(p) === fileName);
  if (matches.length === 1) {
    console.log(`[TRASH→DELETE] ${matches[0]}`);
    broadcast({ type: 'file_deleted', path: matches[0], timestamp: Date.now() });
    fileHashes.delete(matches[0]);
  } else if (matches.length > 1) {
    console.log(`[TRASH-AMBIGUOUS] ${fileName} は ${matches.length} 件に一致するためスキップ: ${matches.join(', ')}`);
  }
});

watcher
  .on('add', filePath => {
    const relativePath = path.relative(CONFIG.vaultPath, filePath);
    const hash = getFileHash(filePath);
    if (hash === null) return;
    if (!watcher.initialized) { fileHashes.set(relativePath, hash); return; }
    if (fileHashes.get(relativePath) === hash) return;
    fileHashes.set(relativePath, hash);
    console.log(`[ADD] ${relativePath}`);
    broadcast({ type: 'file_added', path: relativePath, hash, timestamp: Date.now() });
  })
  .on('change', filePath => {
    const relativePath = path.relative(CONFIG.vaultPath, filePath);
    const hash = getFileHash(filePath);
    if (hash === null) return;
    if (fileHashes.get(relativePath) === hash) return;
    fileHashes.set(relativePath, hash);
    console.log(`[CHANGE] ${relativePath}`);
    broadcast({ type: 'file_changed', path: relativePath, hash, timestamp: Date.now() });
  })
  .on('unlink', filePath => {
    const relativePath = path.relative(CONFIG.vaultPath, filePath);
    if (!fileHashes.has(relativePath)) return;
    fileHashes.delete(relativePath);
    console.log(`[DELETE] ${relativePath}`);
    broadcast({ type: 'file_deleted', path: relativePath, timestamp: Date.now() });
  })
  .on('unlinkDir', dirPath => {
    const relativePath = path.relative(CONFIG.vaultPath, dirPath);
    const prefix = relativePath + '/';
    for (const key of fileHashes.keys()) {
      if (key.startsWith(prefix)) fileHashes.delete(key);
    }
    console.log(`[DELETE-DIR] ${relativePath}`);
    broadcast({ type: 'folder_deleted', path: relativePath, timestamp: Date.now() });
  })
  .on('ready', () => {
    watcher.initialized = true;
    console.log(`[READY] Watching ${CONFIG.vaultPath} (${fileHashes.size} files)`);
    // スキャン完了前に接続したクライアントへ、完全なファイル一覧を送る
    pendingSyncClients.forEach(ws => sendInitialSync(ws, 'pending client'));
    pendingSyncClients.clear();
  });

wss.on('connection', (ws, req) => {
  if (AUTH_TOKEN) {
    let token = null;
    try { token = new URL(req.url, 'ws://localhost').searchParams.get('token'); } catch {}
    if (token !== AUTH_TOKEN) {
      console.log(`[AUTH-FAIL] ${req.socket.remoteAddress}`);
      ws.close(4001, 'unauthorized');
      return;
    }
  }

  console.log(`[CONNECT] ${req.socket.remoteAddress}`);
  clients.add(ws);
  ws.send(JSON.stringify({ type: 'connected', message: 'PoetSync Server connected', timestamp: Date.now() }));

  // Vault スキャン完了前に不完全な一覧を送ると、クライアントが
  // 「サーバーにないファイル」を誤って大量削除する恐れがある → ready まで待つ
  if (watcher.initialized) {
    sendInitialSync(ws, req.socket.remoteAddress);
  } else {
    console.log(`[SYNC-WAIT] ${req.socket.remoteAddress} (vault scan in progress)`);
    pendingSyncClients.add(ws);
  }

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      if (message.type === 'get_file') {
        const filePath = resolveVaultPath(message.path);
        if (!filePath) { console.log(`[BLOCKED] get_file ${message.path}`); return; }
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          console.log(`[GET] ${message.path}`);
          const hash = fileHashes.get(message.path) || getFileHash(filePath);
          if (isBinaryFile(filePath)) {
            const content = fs.readFileSync(filePath).toString('base64');
            ws.send(JSON.stringify({ type: 'file_content', path: message.path, content, hash, binary: true, timestamp: Date.now() }));
          } else {
            const content = fs.readFileSync(filePath, 'utf8');
            ws.send(JSON.stringify({ type: 'file_content', path: message.path, content, hash, timestamp: Date.now() }));
          }
        } else {
          console.log(`[GET-MISS] ${message.path} (not a file)`);
        }
      }

      if (message.type === 'get_file_list') {
        const files = {};
        fileHashes.forEach((hash, relativePath) => { files[relativePath] = hash; });
        console.log(`[FILE_LIST] Sending to ${req.socket.remoteAddress} (${Object.keys(files).length} files)`);
        ws.send(JSON.stringify({ type: 'file_list', files }));
      }

      if (message.type === 'save_file') {
        const filePath = resolveVaultPath(message.path);
        if (!filePath) { console.log(`[BLOCKED] save_file ${message.path}`); return; }
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const buffer = message.binary
          ? Buffer.from(message.content, 'base64')
          : Buffer.from(message.content, 'utf8');
        const newHash = crypto.createHash('md5').update(buffer).digest('hex');
        if (fileHashes.get(message.path) === newHash) {
          console.log(`[SKIP] ${message.path} (no change)`);
          // クライアントは file_saved で送信済みマークを外すため、スキップ時も返す
          ws.send(JSON.stringify({ type: 'file_saved', path: message.path, hash: newHash, timestamp: Date.now() }));
          return;
        }
        // 書き込みが失敗した場合にハッシュだけ残らないよう、書き込み成功後に登録する
        fs.writeFileSync(filePath, buffer);
        fileHashes.set(message.path, newHash);
        console.log(`[SAVED] ${message.path}`);
        ws.send(JSON.stringify({ type: 'file_saved', path: message.path, hash: newHash, timestamp: Date.now() }));
        broadcast({ type: 'file_changed', path: message.path, hash: newHash, timestamp: Date.now() }, ws);
      }

      if (message.type === 'delete_file') {
        const filePath = resolveVaultPath(message.path);
        if (!filePath) { console.log(`[BLOCKED] delete_file ${message.path}`); return; }
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
          fileHashes.delete(message.path);
          console.log(`[DELETED] ${message.path}`);
          broadcast({ type: 'file_deleted', path: message.path, timestamp: Date.now() }, ws);
        }
      }

      if (message.type === 'delete_folder') {
        const dirPath = resolveVaultPath(message.path);
        if (!dirPath) { console.log(`[BLOCKED] delete_folder ${message.path}`); return; }
        if (fs.existsSync(dirPath)) {
          fs.rmSync(dirPath, { recursive: true, force: true });
          const prefix = message.path + '/';
          for (const key of fileHashes.keys()) {
            if (key.startsWith(prefix)) fileHashes.delete(key);
          }
          console.log(`[DELETED-DIR] ${message.path}`);
          broadcast({ type: 'folder_deleted', path: message.path, timestamp: Date.now() }, ws);
        }
      }

      if (message.type === 'rename_file') {
        const oldFilePath = resolveVaultPath(message.oldPath);
        const newFilePath = resolveVaultPath(message.newPath);
        if (!oldFilePath || !newFilePath) { console.log(`[BLOCKED] rename_file ${message.oldPath} -> ${message.newPath}`); return; }
        if (!fs.existsSync(oldFilePath)) return;
        // 旧バージョンのプラグインはフォルダの改名も rename_file で送ってくる
        if (fs.statSync(oldFilePath).isDirectory()) {
          renameFolder(message.oldPath, message.newPath, ws);
          return;
        }
        const dir = path.dirname(newFilePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.renameSync(oldFilePath, newFilePath);
        const hash = getFileHash(newFilePath);
        fileHashes.delete(message.oldPath);
        if (hash !== null) fileHashes.set(message.newPath, hash);
        console.log(`[RENAMED] ${message.oldPath} -> ${message.newPath}`);
        broadcast({ type: 'file_renamed', oldPath: message.oldPath, newPath: message.newPath, timestamp: Date.now() }, ws);
      }

      if (message.type === 'rename_folder') {
        renameFolder(message.oldPath, message.newPath, ws);
      }

    } catch (err) {
      console.error('[ERROR]', err.message);
    }
  });

  ws.on('close', () => {
    console.log(`[DISCONNECT] ${req.socket.remoteAddress}`);
    clients.delete(ws);
    pendingSyncClients.delete(ws);
  });
});

console.log(`PoetSync Server listening on ws://0.0.0.0:${CONFIG.port}`);
