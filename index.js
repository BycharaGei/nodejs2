const http = require('http');
const { arch } = require('os');
const server = http.createServer();
const PORT = 3000;
const players = [];
const dataSent = [];
const activePlayers = [];
let host = -1;
let currentTurn = 0;

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
            const splitMessage = message.split(":");
            if (message === 'connect:player') 
            {
                console.log('connect player');
                if (activePlayers.length - (host == -1 ? 0 : 1) < 3)
                {
                    dataSent.push(false);
                    activePlayers.push(true);
                    res.write("success:" + (activePlayers.length - 1));
                    res.end();
                }
                else
                {
                    res.write("fail");
                    res.end();
                }
            }
            if (message === 'connect:host') 
            {
                console.log('connect host');
                if (host == -1)
                {
                    dataSent.push(false);
                    activePlayers.push(true);
                    host = (activePlayers.length - 1);
                    res.write("success:" + (activePlayers.length - 1));
                    res.end();
                }
                else
                {
                    res.write("fail");
                    res.end();
                }
            }
            if (splitMessage[0] === 'host')
            {
                console.log("host");
                if (splitMessage[1] === 'start' && parseInt(splitMessage[2]) == host)
                {
                    console.log("startet");
                }
            }
            console.log(activePlayers.length);
            console.log(message);
        });
    }
});

server.listen(PORT, () => 
{
    console.log(`Server listening on port ${PORT}`);
});
