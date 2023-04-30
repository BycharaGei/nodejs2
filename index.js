const http = require('http');
const server = http.createServer();
const PORT = 3000;
const clients = [];
let firstNumber, secondNumber;

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
                //const client = { res };
                //clients.push(client);
                res.write("success");
                res.end();
            } 
            else if (message === 'connect:host') 
            {
                console.log('connect host');
                //const client = { res };
                //clients.push(client);
                res.write("fail");
                res.end();
            }
        });
    }
});

server.listen(PORT, () => 
{
    console.log(`Server listening on port ${PORT}`);
});
