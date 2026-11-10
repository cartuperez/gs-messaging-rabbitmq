import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

const port = process.argv[2] || '8080';
const sockets = [];
async function connect(name) {
  const socket = new WebSocket(`ws://localhost:${port}/ws/websocket`);
  sockets.push(socket);
  const messages = [];
  let connected = false;
  let receipt = false;
  socket.onmessage = event => {
    for (const frame of String(event.data).split('\0')) {
      if (frame.startsWith('CONNECTED')) connected = true;
      if (frame.startsWith('RECEIPT')) receipt = true;
      if (frame.startsWith('ERROR')) throw new Error(frame);
      if (frame.startsWith('MESSAGE')) messages.push(JSON.parse(frame.slice(frame.indexOf('\n\n') + 2)));
    }
  };
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  socket.send('CONNECT\naccept-version:1.2\nhost:localhost\nheart-beat:0,0\n\n\0');
  await until(() => connected, 'STOMP connection');
  socket.send('SUBSCRIBE\nid:public\ndestination:/topic/public\nack:auto\nreceipt:subscribed\n\n\0');
  // The in-memory Spring broker does not implement subscription receipts.
  await delay(400);
  send(socket, '/app/chat.addUser', { usuario: name });
  await until(() => messages.some(m => m.usuario === name && m.tipo === 'JOIN'), 'JOIN broadcast');
  return { socket, messages, name };
}
function send(socket, destination, body) {
  socket.send(`SEND\ndestination:${destination}\ncontent-type:application/json\n\n${JSON.stringify(body)}\0`);
}
async function until(predicate, label) {
  const end = Date.now() + 15000;
  while (!predicate()) {
    if (Date.now() > end) throw new Error('Timed out: ' + label);
    await delay(50);
  }
}
try {
  const first = await connect('Ana');
  const second = await connect('Bruno');
  const text = 'Mensaje de prueba ' + Date.now();
  send(first.socket, '/app/chat.sendMessage', { usuario: 'Otro', contenido: text });
  await until(() => [first, second].every(c => c.messages.some(m => m.contenido === text)), 'two-client broadcast');
  assert.equal(second.messages.find(m => m.contenido === text).usuario, 'Ana');
  second.socket.send('DISCONNECT\n\n\0');
  second.socket.close();
  await until(() => first.messages.some(m => m.usuario === 'Bruno' && m.tipo === 'LEAVE'), 'LEAVE broadcast');
  console.log('PASS: STOMP connect, subscribe, JOIN, broadcast to two clients, session username, LEAVE');
} finally {
  for (const socket of sockets) socket.close();
}
