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

console.log('=================================');
console.log('PoetSync Server starting...');
console.log(`Vault: ${CONFIG.vaultPath}`);
console.log(`Port: ${CONFIG.port}`);
console.log('=================================');

const wss = new WebSocket.Server({ host: CONFIG.host, port: CONFIG.port });
const clients = new Set();
const fileHashes = new Map();

function getFileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex');
  } catch { return null; }
}

function broadcast(message, excludeClient = null) {
  const data = JSON.stringify(message);
  clients.forEach(client => {
    if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
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
  console.log(`[TRASH] ${fileName} - 他デバイスに削除を通知`);
  // ファイル名でVault内を検索して削除通知
  fileHashes.forEach((hash, relativePath) => {
    if (path.basename(relativePath) === fileName) {
      console.log(`[TRASH→DELETE] ${relativePath}`);
      broadcast({ type: 'file_deleted', path: relativePath, timestamp: Date.now() });
      fileHashes.delete(relativePath);
    }
  });
});

watcher
  .on('add', filePath => {
    const relativePath = path.relative(CONFIG.vaultPath, filePath);
    const hash = getFileHash(filePath);
    if (!watcher.initialized) { fileHashes.set(relativePath, hash); return; }
    if (fileHashes.get(relativePath) === hash) return;
    fileHashes.set(relativePath, hash);
    console.log(`[ADD] ${relativePath}`);
    broadcast({ type: 'file_added', path: relativePath, hash, timestamp: Date.now() });
  })
  .on('change', filePath => {
    const relativePath = path.relative(CONFIG.vaultPath, filePath);
    const hash = getFileHash(filePath);
    if (fileHashes.get(relativePath) === hash) return;
    fileHashes.set(relativePath, hash);
    console.log(`[CHANGE] ${relativePath}`);
    broadcast({ type: 'file_changed', path: relativePath, hash, timestamp: Date.now() });
  })
  .on('unlink', filePath => {
    const relativePath = path.relative(CONFIG.vaultPath, filePath);
    fileHashes.delete(relativePath);
    console.log(`[DELETE] ${relativePath}`);
    broadcast({ type: 'file_deleted', path: relativePath, timestamp: Date.now() });
  })
  .on('ready', () => {
    watcher.initialized = true;
    console.log(`[READY] Watching ${CONFIG.vaultPath}`);
  });

wss.on('connection', (ws, req) => {
  console.log(`[CONNECT] ${req.socket.remoteAddress}`);
  clients.add(ws);
  ws.send(JSON.stringify({ type: 'connected', message: 'PoetSync Server connected', timestamp: Date.now() }));

  // 接続時にファイルごとに file_added を送信（file_listより確実に動作する）
  fileHashes.forEach((hash, relativePath) => {
    ws.send(JSON.stringify({ type: 'file_added', path: relativePath, hash, timestamp: Date.now() }));
  });
  console.log(`[SYNC] Sent ${fileHashes.size} file_added events to ${req.socket.remoteAddress}`);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      if (message.type === 'get_file') {
        const filePath = path.join(CONFIG.vaultPath, message.path);
        if (fs.existsSync(filePath)) {
          console.log(`[GET] ${message.path}`);
          const content = fs.readFileSync(filePath, 'utf8');
          const hash = fileHashes.get(message.path) || getFileHash(filePath);
          ws.send(JSON.stringify({ type: 'file_content', path: message.path, content, hash, timestamp: Date.now() }));
        } else {
          console.log(`[GET-MISS] ${message.path} (not found)`);
        }
      }

      if (message.type === 'get_file_list') {
        const files = {};
        fileHashes.forEach((hash, relativePath) => { files[relativePath] = hash; });
        console.log(`[FILE_LIST] Sending to ${req.socket.remoteAddress} (${Object.keys(files).length} files)`);
        ws.send(JSON.stringify({ type: 'file_list', files }));
      }

      if (message.type === 'save_file') {
        const filePath = path.join(CONFIG.vaultPath, message.path);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const newHash = crypto.createHash('md5').update(message.content).digest('hex');
        if (fileHashes.get(message.path) === newHash) {
          console.log(`[SKIP] ${message.path} (no change)`);
          return;
        }
        fileHashes.set(message.path, newHash);
        fs.writeFileSync(filePath, message.content, 'utf8');
        console.log(`[SAVED] ${message.path}`);
        ws.send(JSON.stringify({ type: 'file_saved', path: message.path, hash: newHash, timestamp: Date.now() }));
        broadcast({ type: 'file_changed', path: message.path, hash: newHash, timestamp: Date.now() }, ws);
      }

      if (message.type === 'delete_file') {
        const filePath = path.join(CONFIG.vaultPath, message.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          fileHashes.delete(message.path);
          console.log(`[DELETED] ${message.path}`);
          broadcast({ type: 'file_deleted', path: message.path, timestamp: Date.now() }, ws);
        }
      }

      if (message.type === 'rename_file') {
        const oldFilePath = path.join(CONFIG.vaultPath, message.oldPath);
        const newFilePath = path.join(CONFIG.vaultPath, message.newPath);
        if (fs.existsSync(oldFilePath)) {
          const dir = path.dirname(newFilePath);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.renameSync(oldFilePath, newFilePath);
          const hash = getFileHash(newFilePath);
          fileHashes.delete(message.oldPath);
          fileHashes.set(message.newPath, hash);
          console.log(`[RENAMED] ${message.oldPath} -> ${message.newPath}`);
          broadcast({ type: 'file_renamed', oldPath: message.oldPath, newPath: message.newPath, timestamp: Date.now() }, ws);
        }
      }

    } catch (err) {
      console.error('[ERROR]', err.message);
    }
  });

  ws.on('close', () => {
    console.log(`[DISCONNECT] ${req.socket.remoteAddress}`);
    clients.delete(ws);
  });
});

console.log(`PoetSync Server listening on ws://0.0.0.0:${CONFIG.port}`);
