const http = require('http');
const server = http.createServer();
const fs = require('fs');
const PORT = 3000;
const dataSent = [];
const activePlayers = [];
const deactivatedPlayers = [];
let host = -1;
let hostNumber = -1;
let currentPlayer = 0;
let currentSpectator = -1;
let gameID = getRandomInt(1000000000);
const rows = 15;
const columns = 15;
const cellValues = new Array(rows).fill().map(() => new Array(columns).fill(0));
const cellColors = new Array(rows).fill().map(() => new Array(columns).fill(-1));
let gameStarted = false;
const dataToSend = [];
const lastSentData = [];
const lastSentDataSpectators = [];
let firstTurnCompleted = false;
let firstTurnData = "makefirstturn:";
const reconnectionDataRequired = [];
const reconnectionDataRequiredSpectators = [];

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
                if (gameStarted)
                {
                    if (splitMessage[1] === 'player')
                    {
                        let foundReconnection = false;
                        let newPlayer = currentSpectator--;
                        for (let i = 0; i < activePlayers.length; ++i)
                        {
                            if (!activePlayers[i])
                            {
                                for (let k = 0; k < rows; ++k)
                                {
                                    for (let j = 0; j < columns; ++j)
                                    {
                                        if (cellColors[k][j] == i)
                                        {
                                            foundReconnection = true;
                                            newPlayer = i;
                                            currentSpectator++;
                                            break;
                                        }
                                    }
                                    if (foundReconnection)
                                    {
                                        break;
                                    }
                                }
                                if (foundReconnection)
                                {
                                    break;
                                }
                            }
                        }
                        if (foundReconnection)
                        {
                            activePlayers[newPlayer] = true;
                            deactivatedPlayers[newPlayer] = false;
                            reconnectionDataRequired[newPlayer] = true;
                            res.write("success:" + gameID + ":" + newPlayer);
                            res.end();
                        }
                        else
                        {
                            lastSentDataSpectators.push(dataToSend.length);
                            reconnectionDataRequiredSpectators.push(true);
                            res.write("success:" + gameID + ":" + newPlayer);
                            res.end();
                        }
                    }
                    else if (splitMessage[1] === 'host')
                    {
                        let hostPassword = fs.readFileSync('host.txt', 'utf8').trim();
                        if (splitMessage[2] === hostPassword)
                        {
                            reconnectionDataRequired[hostNumber] = true;
                            host = getRandomInt(1000000000);
                            res.write("success:" + gameID + ":" + hostNumber + ":" + host);
                            res.end();
                        }
                        else
                        {
                            res.write("fail");
                            res.end();
                        }
                    }
                }
                else if (splitMessage[1] === 'player') 
                {
                    console.log('connect player');
                    if (activePlayers.length - (host == -1 ? 0 : 1) < 3)
                    {
                        dataSent.push(false);
                        activePlayers.push(true);
                        reconnectionDataRequired.push(false);
                        deactivatedPlayers.push(false);
                        lastSentData.push(0);
                        res.write("success:" + gameID + ":" + (activePlayers.length - 1));
                        res.end();
                    }
                    else
                    {
                        lastSentDataSpectators.push(0);
                        reconnectionDataRequiredSpectators.push(false);
                        res.write("success:" + gameID + ":" + currentSpectator--);
                        res.end();
                    }
                }
                else if (splitMessage[1] === 'host') 
                {
                    console.log('connect host');
                    let hostPassword = fs.readFileSync('host.txt', 'utf8').trim();
                    if (splitMessage[2] === hostPassword)
                    {
                        if (hostNumber == -1)
                        {
                            dataSent.push(false);
                            activePlayers.push(true);
                            reconnectionDataRequired.push(false);
                            deactivatedPlayers.push(false);
                            lastSentData.push(0);
                            hostNumber = (activePlayers.length - 1);
                        }
                        host = getRandomInt(1000000000);
                        res.write("success:" + gameID + ":" + hostNumber + ":" + host);
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
                if (splitMessage[1] != 'validate')
                {
                    console.log(message + " gameID = " + gameID + ", host = " + host);
                }
                if (splitMessage[1] === 'start' && parseInt(splitMessage[2]) == host)
                {
                    if (!gameStarted)
                    {
                        console.log("startet");
                        gameStarted = true;
                        firstTurnCompleted = false;
                        allFirstTurnsTerminated = false;
                        currentPlayer = 0;
                        firstTurnData = "makefirstturn:";
                    }
                    else
                    {
                        reconnectionDataRequired[hostNumber] = true;
                    }
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
                    lastSentData.length = 0;
                    lastSentData.push(0);
                    reconnectionDataRequired.length = 0;
                    reconnectionDataRequired.push(false);
                    reconnectionDataRequiredSpectators.length = 0;
                    deactivatedPlayers.length = 0;
                    deactivatedPlayers.push(false);
                    currentSpectator = -1;
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
                    if (parseInt(splitMessage[3]) != currentPlayer)
                    {
                        deactivatedPlayers[parseInt(splitMessage[3])] = true;
                    }
                    if (currentPlayer == parseInt(splitMessage[3]))
                    {
                        for (let i = 0; i < activePlayers.length; ++i)
                        {
                            currentPlayer++;
                            if (currentPlayer == activePlayers.length)
                            {
                                if (!firstTurnCompleted)
                                {
                                    firstTurnCompleted = true;
                                }
                                currentPlayer = 0;
                            }
                            if (activePlayers[currentPlayer])
                            {
                                break;
                            }
                        }
                    }
                    res.write("success");
                    res.end();
                }
                else if (splitMessage[1] === 'activate' && parseInt(splitMessage[2]) == host)
                {
                    activePlayers[parseInt(splitMessage[3])] = true;
                    deactivatedPlayers[parseInt(splitMessage[3])] = false;
                    res.write("success");
                    res.end();
                }
                else if (splitMessage[1] === 'leave' && parseInt(splitMessage[2]) == host)
                {
                    res.write("leave");
                    res.end();
                    host = -1;
                    hostNumber = -1;
                    dataSent.length = 0;
                    activePlayers.length = 0;
                    currentPlayer = 0;
                    reconnectionDataRequired.length = 0;
                    reconnectionDataRequiredSpectators.length = 0;
                    deactivatedPlayers.length = 0;
                    currentSpectator = -1;
                    gameID = getRandomInt(1000000000);
                    for (let i = 0; i < rows; ++i)
                    {
                        for (let j = 0; j < columns; ++j)
                        {
                            cellValues[i][j] = 0;
                            cellColors[i][j] = -1;
                        }
                    }
                    gameStarted = false;
                    dataToSend.length = 0;
                    lastSentData.length = 0;
                    firstTurnCompleted = false;
                    firstTurnData = "makefirstturn:";
                }
                else if (splitMessage[1] === 'validate')
                {
                    if (parseInt(splitMessage[2]) != host)
                    {
                        res.write("reset");
                        res.end();
                        console.log("close host");
                    }
                    else
                    {
                        res.write("valid");
                        res.end();
                    }
                }
            }
            else if (deactivatedPlayers[parseInt(splitMessage[2])] && parseInt(splitMessage[2]) != hostNumber)
            {
                deactivatedPlayers[parseInt(splitMessage[2])] = false;
                res.write("reset");
                res.end();
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
                        if (parseInt(splitMessage[2]) < 0)
                        {
                            let index = parseInt(splitMessage[2]) * (-1) - 1;
                            console.log("spectator " + index.toString());
                            if (reconnectionDataRequiredSpectators[index])
                            {
                                reconnectionDataRequiredSpectators[index] = false;
                                lastSentDataSpectators[index] = dataToSend.length;
                                res.write(getReconnectionData());
                                res.end();
                            }
                            else if (lastSentDataSpectators[index] < dataToSend.length)
                            {
                                res.write(dataToSend[lastSentDataSpectators[index]++]);
                                res.end();
                            }
                            else
                            {
                                res.write("wait");
                                res.end();
                            }
                        }
                        else if (reconnectionDataRequired[parseInt(splitMessage[2])])
                        {
                            reconnectionDataRequired[parseInt(splitMessage[2])] = false;
                            lastSentData[parseInt(splitMessage[2])] = dataToSend.length;
                            res.write(getReconnectionData());
                            res.end();
                        }
                        else if (lastSentData[parseInt(splitMessage[2])] < dataToSend.length)
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
                        if (parseInt(splitMessage[2]) < 0)
                        {
                            let index = parseInt(splitMessage[2]) * (-1) - 1;
                            if (reconnectionDataRequiredSpectators[index])
                            {
                                reconnectionDataRequiredSpectators[index] = false;
                                lastSentDataSpectators[index] = dataToSend.length;
                                res.write(getReconnectionData());
                                res.end();
                            }
                            else if (lastSentDataSpectators[index] < dataToSend.length)
                            {
                                res.write(dataToSend[lastSentDataSpectators[index]++]);
                                res.end();
                            }
                            else
                            {
                                res.write("wait");
                                res.end();
                            }
                        }
                        else if (reconnectionDataRequired[parseInt(splitMessage[2])])
                        {
                            reconnectionDataRequired[parseInt(splitMessage[2])] = false;
                            lastSentData[parseInt(splitMessage[2])] = dataToSend.length;
                            res.write(getReconnectionData());
                            res.end();
                        }
                        else if (lastSentData[parseInt(splitMessage[2])] < dataToSend.length)
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

function getReconnectionData()
{
    let newData = "setcells:";
    for (let i = 0; i < rows; ++i)
    {
        for (let j = 0; j < columns; ++j)
        {
            if (cellValues[i][j] > 0)
            {
                newData += i.toString() + "," + j.toString() + "," + cellValues[i][j].toString() + "," + cellColors[i][j].toString() + ";";
            }
        }
    }
    return newData;
}
