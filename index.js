const http = require('http');
const server = http.createServer();
const PORT = 3000;
const clients = [];

server.on('request', (req, res) => 
{
    if (req.method === 'POST') 
    {
        const body = [];
        req.on('data', (chunk) => 
        {
            body.push(chunk);
        }).on('end', () => 
        {
            const message = Buffer.concat(body).toString();
            if (message === 'connect') 
            {
                console.log('connect player');
                const client = { res };
                clients.push(client);
                for (let i = 0; i < clients.length; ++i)
                {
                    clients[i].res.write("fart");
                }
            } 
        });
    }
});

server.listen(PORT, () => 
{
    console.log(`Server listening on port ${PORT}`);
});
