let stompClient = null;
let connecting = false;
let username = '';

function connect() {
    if (connecting || (stompClient && stompClient.connected)) return;
    username = document.getElementById('username').value.trim();
    if (!username || username.length > 80) return alert('Ingresá un usuario de hasta 80 caracteres');
    let host = document.getElementById('serverIp').value.trim();
    let base;
    try {
        if (!host || host === location.hostname) base = location.origin;
        else {
            if (!/^https?:\/\//i.test(host)) host = location.protocol + '//' + host;
            const url = new URL(host);
            if (!url.port && !/^https?:\/\//i.test(document.getElementById('serverIp').value.trim())) {
                url.port = location.port || '8080';
            }
            base = url.origin;
        }
    } catch (_) { return alert('Dirección del servidor inválida'); }
    connecting = true;
    setConnected(false);
    const client = Stomp.over(new SockJS(base + '/ws'));
    client.debug = null;
    stompClient = client;
    const failed = () => {
        if (stompClient !== client) return;
        connecting = false;
        stompClient = null;
        setConnected(false);
        document.getElementById('status').textContent = 'Conexión cerrada o no disponible';
    };
    client.connect({}, () => {
        if (stompClient !== client) { client.disconnect(); return; }
        connecting = false;
        client.subscribe('/topic/public', frame => {
            try { showMessage(JSON.parse(frame.body)); } catch (error) { console.error(error); }
        });
        client.send('/app/chat.addUser', {}, JSON.stringify({usuario: username, tipo: 'JOIN'}));
        setConnected(true);
    }, failed);
    const onclose = client.ws.onclose;
    client.ws.onclose = event => { if (onclose) onclose(event); failed(); };
}

function disconnect() {
    const client = stompClient;
    stompClient = null;
    connecting = false;
    setConnected(false);
    if (client && client.connected) client.disconnect();
    else if (client && client.ws) client.ws.close();
}

function setConnected(connected) {
    const status = document.getElementById('status');
    status.className = connected ? 'connected' : 'disconnected';
    status.textContent = connected ? 'Conectado' : 'Desconectado';
    document.getElementById('message').disabled = !connected;
    document.getElementById('sendButton').disabled = !connected;
    document.getElementById('connectButton').disabled = connected || connecting;
    document.getElementById('username').disabled = connected || connecting;
    document.getElementById('serverIp').disabled = connected || connecting;
}

function sendMessage() {
    if (!stompClient || !stompClient.connected) { setConnected(false); return; }
    const input = document.getElementById('message');
    const content = input.value.trim();
    if (!content || content.length > 2000) return;
    stompClient.send('/app/chat.sendMessage', {}, JSON.stringify({usuario: username, contenido: content, tipo: 'CHAT'}));
    input.value = '';
}

function showMessage(message) {
    const messages = document.getElementById('messages');
    const row = document.createElement('div');
    row.className = 'message';
    const user = document.createElement('strong');
    user.textContent = (message.usuario || '') + ': ';
    row.append(user, document.createTextNode(message.contenido || ''));
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
}

document.getElementById('message').addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); sendMessage(); }
});
document.getElementById('serverIp').value = location.host;
window.addEventListener('beforeunload', disconnect);
setConnected(false);
