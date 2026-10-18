const HOST = `
const values = new Map();
const subscribed = new Set();
const listeners = [];
let nextItem = 0;

function itemPath(key) {
  const [list, id, field] = key.split("/");
  return list && id && field ? { list, id, field } : null;
}

function items(key) {
  const value = values.get(key);
  return Array.isArray(value) ? value : [];
}

function read(key) {
  const path = itemPath(key);
  if (!path) return values.has(key) ? values.get(key) : null;
  const item = items(path.list).find((entry) => entry.id === path.id);
  return item && path.field in item.data ? item.data[path.field] : null;
}

function write(key, value) {
  const path = itemPath(key);
  if (!path) return values.set(key, value);
  values.set(path.list, items(path.list).map((item) => item.id === path.id ? { id: item.id, data: { ...item.data, [path.field]: value } } : item));
}

function writeList(message) {
  const list = items(message.key).slice();
  const index = list.findIndex((item) => item.id === message.id);
  if (message.action === "insert") list.splice(message.index, 0, { id: "item" + nextItem++, data: message.data || {} });
  if (message.action === "delete" && index >= 0) list.splice(index, 1);
  if (message.action === "move" && index >= 0) list.splice(message.index, 0, ...list.splice(index, 1));
  if (message.action === "update" && index >= 0) list[index] = { id: list[index].id, data: { ...list[index].data, ...message.patch } };
  values.set(message.key, list);
}

function emit() {
  const out = {};
  for (const key of subscribed) out[key] = read(key);
  const message = { type: "keys", values: out, source: "shell" };
  setTimeout(() => listeners.forEach((callback) => callback(message)));
}

window.host = {
  post(message) {
    if (message.type === "subscribe") subscribed.add(message.key);
    else if (message.type === "set") write(message.key, message.value);
    else if (message.type === "text") write(message.key, message.next);
    else if (message.type === "list") writeList(message);
    else return;
    emit();
  },
  onMessage(callback) {
    listeners.push(callback);
  },
};
`

export function candidateHtml(): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Geist+Mono:wght@100..900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="./main.css">
<style>
  html, body { margin: 0; }
  html {
    --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
    --font-geist-mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
    -webkit-font-smoothing: antialiased;
    font-size: 16px;
  }
  #root { box-sizing: border-box; padding: 1.5rem 1rem 1rem; }
</style>
</head>
<body>
<div id="root"></div>
<script>${HOST}</script>
<script src="./main.js"></script>
</body>
</html>`
}
