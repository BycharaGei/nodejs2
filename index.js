const http = require('http');
const server = http.createServer();
const PORT = 3000;
const players = [];
const spectators = [];
const host = null;

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
            if (message === 'connect:player') 
            {
                console.log('connect player');
                if (players.size() < 3)
                {
                    const client = { res };
                    players.push(client);
                    spectators.push(client);
                    res.write("success");
                    res.end();
                }
                else
                {
                    res.write("fail");
                    res.end();
                }
            } 
            else if (message === 'connect:spectator') 
            {
                console.log('connect spectator');
                const client = { res };d
                spectators.push(client);
                res.write("success");
                res.end();
            }
            if (message === 'connect:host') 
            {
                console.log('connect host');
                if (host != null)
                {
                    const client = { res };
                    players.push(client);
                    spectators.push(client);
                    host = client;
                    res.write("success");
                    res.end();
                }
                else
                {
                    res.write("fail");
                    res.end();
                }
            }
            if (host != null)
            {
                console.log('host exists');
            }
            else
            {
                console.log("no host");
            }
        });
    }
});

server.listen(PORT, () => 
{
    console.log(`Server listening on port ${PORT}`);
});
