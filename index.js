const http = require('http');
const server = http.createServer();

const PORT = 3000;

// Arrays to store all connected clients
const players = [];
const spectators = [];
let host = null;

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function playGame() {
  let currentPlayerIndex = getRandomInt(players.length);
  while (true) {
    const currentPlayer = players[currentPlayerIndex];
    currentPlayer.res.write(`Enter your turn (a, b):`);
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;

    currentPlayer.req.once('data', (data) => {
      const [a, b] = data.toString().trim().split(',');
      const message = `Player ${currentPlayerIndex + 1} played (${a}, ${b})`;
      console.log(message);
      players.forEach((p) => p.res.write(message));
      spectators.forEach((s) => s.res.write(message));
    });
  }
}

server.on('request', (req, res) => {
  if (req.method === 'POST') {
    const data = req.url.split(':')[1];
    if (data === 'connecting:player') {
      if (players.length < 4) {
        const client = { req, res };
        players.push(client);
        spectators.push(client);
        res.write('successfully connected as player\n');
        console.log(`Player ${players.length} connected`);
      } else {
        res.write('failed to connect: too many players\n');
      }
      res.end();
    } else if (data === 'connecting:spectator') {
      const client = { req, res };
      spectators.push(client);
      res.write('successfully connected as spectator\n');
      console.log('Spectator connected');
      res.end();
    } else if (data === 'connecting:host') {
      if (host === null) {
        const client = { req, res };
        host = client;
        spectators.push(client);
        res.write('successfully connected as host\n');
        console.log('Host connected');
        res.end();
        playGame();
      } else {
        res.write('failed to connect: host already exists\n');
        res.end();
      }
    } else {
      res.write('failed to connect: invalid connection request\n');
      res.end();
    }
  } else {
    res.write('Invalid request\n');
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});



/*const http = require('http');
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
});*/
