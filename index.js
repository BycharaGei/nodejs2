const http = require('http');
const server = http.createServer();

const PORT = 3000;

// Array to store all connected clients
const clients = [];
let firstNumber, secondNumber;

server.on('request', (req, res) => {
    if (req.method === 'POST') {
        const body = [];
        req.on('data', (chunk) => {
            body.push(chunk);
        }).on('end', () => {
            const message = Buffer.concat(body).toString();
            if (message === 'connecting') {
                console.log('Received "connecting" message from client');
                const client = { res };
                clients.push(client);
                res.write(JSON.stringify({ numbers: `${firstNumber},${secondNumber}` }));
                res.end();
            } else if (message === 'waiting') {
                console.log('Received "waiting" message from client');
                const client = { res };
                clients.push(client);
            } else {
                console.log('Received invalid message from client');
                res.statusCode = 400;
                res.end();
            }
        });
    }
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    setInterval(() => {
        if (clients.length >= 2) {
            console.log('Two clients are now connected');
            firstNumber = Math.floor(Math.random() * 100);
            secondNumber = Math.floor(Math.random() * 100);
            const result = firstNumber + secondNumber;
            const message = { numbers: `${firstNumber},${secondNumber}`, result };
            clients.forEach((c) => {
                c.res.write(JSON.stringify(message));
                c.res.end();
            });
            clients.splice(0, clients.length);
        }
    }, 1000);
});


/*const http = require('http');
const server = http.createServer();

const PORT = 3000;

// Array to store all connected clients
const clients = [];

server.on('request', (req, res) => {
    if (req.method === 'POST') {
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
//*/
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
