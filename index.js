const http = require('http');
const server = http.createServer();

const PORT = 3000;

// Array to store all connected clients
const clients = [];

server.on('request', (req, res) => {
    if (req.method === 'GET') {
        console.log('Received message from client');
        const gameState = { player: 'X', board: [null, null, null, null, null, null, null, null, null] };
        clients.forEach((c) => {
            c.res.write(JSON.stringify(gameState));
            c.res.end();
        });
    }
    if (req.method === 'POST') {
        console.log('client is waiting');
        const client = { res };
        clients.push(client);
    }
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

/*const http = require('http');

const PORT = 3000;

const waitingConnections = [];

const server = http.createServer((req, res) => {
    if (req.method === 'POST') {
        let data = '';
        req.on('data', (chunk) => {
            data += chunk;
        });
        req.on('end', () => {
            if (data === 'CONNECT') {
                res.write('CONNECTED');
                res.end();
            } else if (data === 'WAITING') {
                waitingConnections.push(res);
            } else if (data === 'WAITING AGAIN') {
                // Do nothing, already waiting
            }
        });
    } else if (req.method === 'GET' && req.url === '/waiting') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        waitingConnections.push(res);
    }
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

setInterval(() => {
    if (waitingConnections.length > 0) {
        const message = 'MESSAGE';
        waitingConnections.forEach((conn) => {
            conn.write(message);
            conn.end();
        });
        waitingConnections.splice(0, waitingConnections.length);
    }
}, 5000);
*/
