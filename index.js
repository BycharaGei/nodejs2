const http = require('http');
const server = http.createServer();
const PORT = 3000;
const players = [];
const spectators = [];
const host = [];

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
                const client = { res };
                alreadyConnected = false;
                for (let i = 0; i < players.length; i++) 
                {
                    if (players[i].res === res) 
                    {
                        alreadyConnected = true;
                        break;
                    }
                }
                if (players.length - host.length < 3 && !alreadyConnected)
                {
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
                const client = { res };
                spectators.push(client);
                res.write("success");
                res.end();
            }
            if (message === 'connect:host') 
            {
                console.log('connect host');
                if (host.length == 0)
                {
                    const client = { res };
                    players.push(client);
                    spectators.push(client);
                    host.push(client);
                    res.write("success");
                    res.end();
                }
                else
                {
                    res.write("fail");
                    res.end();
                }
            }
            if (host.length > 0)
            {
                console.log('host exists');
            }
            else
            {
                console.log('no host');
            }
            console.log(spectators.length);
            console.log(players.length);
        });
    }
});

server.listen(PORT, () => 
{
    console.log(`Server listening on port ${PORT}`);
});
