const http = require('http');
const server = http.createServer();
const fs = require('fs');
const PORT = 3000;
const dataSent = [];
const activePlayers = [];
let host = -1;
let hostNumber = -1;
let currentPlayer = 0;
let gameID = getRandomInt(1000000000);
const rows = 15;
const columns = 15;
const cellValues = new Array(rows).fill().map(() => new Array(columns).fill(0));
const cellColors = new Array(rows).fill().map(() => new Array(columns).fill(-1));
let gameStarted = false;
const dataToSend = [];
const lastSentData = [];
let firstTurnCompleted = false;
const firstTurnTerminated = [];
let firstTurnData = "makefirstturn:";
//add check in connection if game startet, if so load all cells as response;
//fix kick buttons;
//add leave host button (full game reset);
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
            if (splitMessage[0] === "connect")
            {
                if (splitMessage[1] === 'player') 
                {
                    console.log('connect player');
                    if (activePlayers.length - (host == -1 ? 0 : 1) < 3)
                    {
                        dataSent.push(false);
                        activePlayers.push(true);
                        firstTurnTerminated.push(false);
                        lastSentData.push(0);
                        res.write("success:" + gameID + ":" + (activePlayers.length - 1));
                        res.end();
                    }
                    else
                    {
                        res.write("fail");
                        res.end();
                    }
                }
                if (splitMessage[1] === 'host') 
                {
                    console.log('connect host');
                    let hostPassword;
                    fs.readFile('host.txt', 'utf8', (err, data) => 
                    {
                        if (err) 
                        {
                          console.error('Error reading file:', err);
                          return;
                        }
                        hostPassword = data.trim();
                        console.log('Host Password:', hostPassword);
                    });
                    if (host == -1 && splitMessage[2] === hostPassword)
                    {
                        dataSent.push(false);
                        activePlayers.push(true);
                        firstTurnTerminated.push(false);
                        lastSentData.push(0);
                        host = getRandomInt(1000000000);
                        hostNumber = (activePlayers.length - 1);
                        res.write("success:" + gameID + ":" + (activePlayers.length - 1) + ":" + host);
                        res.end();
                    }
                    else
                    {
                        res.write("fail");
                        res.end();
                    }
                }
            }
            else if (splitMessage[0] === 'host')
            {
                console.log(message + " gameID = " + gameID + ", host = " + host);
                if (splitMessage[1] === 'start' && parseInt(splitMessage[2]) == host)
                {
                    console.log("startet");
                    gameStarted = true;
                    firstTurnCompleted = false;
                    allFirstTurnsTerminated = false;
                    currentPlayer = 0;
                    firstTurnData = "makefirstturn:";
                    res.write(activePlayers.length.toString());
                    res.end();
                }
                else if (splitMessage[1] === 'reset' && parseInt(splitMessage[2]) == host)
                {
                    console.log("resetting");
                    gameID = getRandomInt(1000000000);
                    activePlayers.length = 0;
                    activePlayers.push(true);
                    dataSent.length = 0;
                    dataSent.push(false);
                    firstTurnTerminated.length = 0;
                    firstTurnTerminated.push(false);
                    lastSentData.length = 0;
                    lastSentData.push(0);
                    dataToSend.length = 0;
                    gameStarted = false;
                    firstTurnCompleted = false;
                    dataSendingRequired = false;
                    currentPlayer = 0;
                    hostNumber = 0;
                    firstTurnData = "makefirstturn:";
                    for (let i = 0; i < rows; ++i)
                    {
                        for (let j = 0; j < columns; ++j)
                        {
                            cellValues[i][j] = 0;
                            cellColors[i][j] = -1;
                        }
                    }
                    res.write("resetting:" + gameID);
                    res.end();
                }
                else if (splitMessage[1] === 'deactivate' && parseInt(splitMessage[2]) == host)
                {
                    activePlayers[parseInt(splitMessage[3])] = false;
                    if (currentPlayer == parseInt(splitMessage[3]))
                    {
                        for (let i = 0; i < activePlayers.length; ++i)
                        {
                            currentPlayer++;
                            if (currentPlayer == activePlayers.length)
                            {
                                currentPlayer = 0;
                            }
                            if (activePlayers[currentPlayer])
                            {
                                break;
                            }
                        }
                    }
                }
                else if (splitMessage[1] === 'activate' && parseInt(splitMessage[2]) == host)
                {
                    activePlayers[parseInt(splitMessage[3])] = true;
                }
            }
            else if (parseInt(splitMessage[1]) != gameID)
            {
                res.write("reset");
                res.end();
            }
            else if (gameStarted)
            {
                if (firstTurnCompleted)
                {
                    if (splitMessage[0] === 'waitingturn')
                    {
                        if (lastSentData[parseInt(splitMessage[2])] < dataToSend.length)
                        {
                            res.write(dataToSend[lastSentData[parseInt(splitMessage[2])]++]);
                            res.end();
                        }
                        else
                        {
                            if (currentPlayer == parseInt(splitMessage[2]))
                            {
                                res.write("maketurn");
                                res.end();
                            }
                            else
                            {
                                res.write("wait");
                                res.end();
                            }
                        }
                    }
                    else if (splitMessage[0] === 'turn' && parseInt(splitMessage[2]) == currentPlayer && cellColors[parseInt(splitMessage[3])][parseInt(splitMessage[4])] == currentPlayer)
                    {
                        makeTurn(parseInt(splitMessage[3]), parseInt(splitMessage[4]));
                        res.write("turned");
                        res.end();
                    }
                    else
                    {
                        res.write("wait");
                        res.end();
                    }
                }
                else
                {
                    if (splitMessage[0] === 'waitingturn')
                    {
                        if (lastSentData[parseInt(splitMessage[2])] < dataToSend.length)
                        {
                            res.write(dataToSend[lastSentData[parseInt(splitMessage[2])]++]);
                            res.end();
                        }
                        else
                        {
                            if (currentPlayer == parseInt(splitMessage[2]))
                            {
                                res.write(firstTurnData);
                                res.end();
                            }
                            else
                            {
                                res.write("wait");
                                res.end();
                            }
                        }
                    }
                    else if (splitMessage[0] === 'firstturn' && parseInt(splitMessage[2]) == currentPlayer)
                    {
                        dataToSend.push("setcells:" + splitMessage[3].toString() + "," + splitMessage[4].toString() + ",1," + currentPlayer.toString() + ";");
                        firstTurnData += splitMessage[3].toString() + "," + splitMessage[4].toString() + ";";
                        cellColors[parseInt(splitMessage[3])][parseInt(splitMessage[4])] = parseInt(splitMessage[2]);
                        cellValues[parseInt(splitMessage[3])][parseInt(splitMessage[4])] = 1;
                        currentPlayer++;
                        res.write("turned");
                        res.end();
                        if (currentPlayer == activePlayers.length)
                        {
                            currentPlayer = 0;
                            firstTurnCompleted = true;
                        }
                    }
                    else
                    {
                        res.write("wait");
                        res.end();
                    }
                }
            }
            else
            {
                res.write("wait");
                res.end();
            }
        });
    }
});

server.listen(PORT, () => 
{
    console.log(`Server listening on port ${PORT}`);
});

function makeTurn(row, column)
{
    let newData = "setcells:";
    cellValues[row][column]++;
    newData += row.toString() + "," + column.toString() + "," + cellValues[row][column].toString() + "," + currentPlayer.toString() + ";";
    let cellsToPop = [];
    do
    {
        cellsToPop = [];
        for (let i = 0; i < rows; ++i)
        {
            for (let j = 0; j < columns; ++j)
            {
                if (cellValues[i][j] > 3)
                {
                    cellsToPop.push([i, j]);
                }
            }
        }
        for (let i = 0; i < cellsToPop.length; ++i)
        {
            cellValues[cellsToPop[i][0]][cellsToPop[i][1]] -= 4;
            if (cellValues[cellsToPop[i][0]][cellsToPop[i][1]] == 0)
            {
                cellColors[cellsToPop[i][0]][cellsToPop[i][1]] = -1;
            }
            newData += cellsToPop[i][0].toString() + "," + cellsToPop[i][1].toString() + "," + cellValues[cellsToPop[i][0]][cellsToPop[i][1]].toString() + "," 
            + cellColors[cellsToPop[i][0]][cellsToPop[i][1]].toString() + ";";

            if (cellsToPop[i][0] > 0)
            {
                cellValues[cellsToPop[i][0] - 1][cellsToPop[i][1]]++;
                cellColors[cellsToPop[i][0] - 1][cellsToPop[i][1]] = currentPlayer;
                newData += (cellsToPop[i][0] - 1).toString() + "," + cellsToPop[i][1].toString() + "," + cellValues[cellsToPop[i][0] - 1][cellsToPop[i][1]].toString() + "," 
                + cellColors[cellsToPop[i][0] - 1][cellsToPop[i][1]].toString() + ";";
            }
            if (cellsToPop[i][1] < columns - 1)
            {
                cellValues[cellsToPop[i][0]][cellsToPop[i][1] + 1]++;
                cellColors[cellsToPop[i][0]][cellsToPop[i][1] + 1] = currentPlayer;
                newData += cellsToPop[i][0].toString() + "," + (cellsToPop[i][1] + 1).toString() + "," + cellValues[cellsToPop[i][0]][cellsToPop[i][1] + 1].toString() + "," 
                + cellColors[cellsToPop[i][0]][cellsToPop[i][1] + 1].toString() + ";";
            }
            if (cellsToPop[i][0] < rows - 1)
            {
                cellValues[cellsToPop[i][0] + 1][cellsToPop[i][1]]++;
                cellColors[cellsToPop[i][0] + 1][cellsToPop[i][1]] = currentPlayer;
                newData += (cellsToPop[i][0] + 1).toString() + "," + cellsToPop[i][1].toString() + "," + cellValues[cellsToPop[i][0] + 1][cellsToPop[i][1]].toString() + "," 
                + cellColors[cellsToPop[i][0] + 1][cellsToPop[i][1]].toString() + ";";
            }
            if (cellsToPop[i][1] > 0)
            {
                cellValues[cellsToPop[i][0]][cellsToPop[i][1] - 1]++;
                cellColors[cellsToPop[i][0]][cellsToPop[i][1] - 1] = currentPlayer;
                newData += cellsToPop[i][0].toString() + "," + (cellsToPop[i][1] - 1).toString() + "," + cellValues[cellsToPop[i][0]][cellsToPop[i][1] - 1].toString() + "," 
                + cellColors[cellsToPop[i][0]][cellsToPop[i][1] - 1].toString() + ";";
            }
        }
    }
    while (cellsToPop.length > 0);
    dataToSend.push(newData);
    for (let i = 0; i < activePlayers.length; ++i)
    {
        if (activePlayers[i])
        {
            let count = 0;
            for (let j = 0; j < rows; ++j)
            {
                for (let k = 0; k < columns; ++k)
                {
                    if (cellColors[j][k] == i)
                    {
                        count++;
                        break;
                    }
                }
            }
            if (count == 0)
            {
                activePlayers[i] = false;
                console.log("set to inactive " + i);
            }
        }
    }
    for (let i = 0; i < activePlayers.length; ++i)
    {
        currentPlayer++;
        if (currentPlayer >= activePlayers.length)
        {
            currentPlayer = 0;
        }
        console.log("changed current player to " + currentPlayer);
        if (activePlayers[currentPlayer])
        {
            console.log("active player found " + currentPlayer);
            break;
        }
    }
}

function getRandomInt(max) 
{
    return Math.floor(Math.random() * max);
}
