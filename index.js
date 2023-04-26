const http = require('http');
const server = http.createServer();

const PORT = 3000;

// Array to store all connected clients
const clients = [];

server.on('request', (req, res) => {
    if (req.method === 'POST') {
        console.log('Received message from client');

        // Add the new client to the clients array
        const client = { res };
        clients.push(client);

        // Process the message from the client and update the game state
        const gameState = { player: 'X', board: [null, null, null, null, null, null, null, null, null] };

        // Send the updated game state to all clients
        clients.forEach((c) => {
            c.res.write(JSON.stringify(gameState));
            c.res.end();
        });
    }
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});


//
