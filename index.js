const http = require('http');
const server = http.createServer();

const PORT = 3000;

server.on('request', (req, res) => {
    if (req.method === 'POST') {
        console.log('Received message from client');
        // Process the message from the client and update the game state
        const gameState = { player: 'X', board: [null, null, null, null, null, null, null, null, null] };
        // Send the updated game state to all clients
        res.write(JSON.stringify(gameState));
        res.end();
    }
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
