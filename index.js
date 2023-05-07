const http = require('http');
const server = http.createServer();
const PORT = 3000;
const players = [];
const dataSent = [];
const activePlayers = [];
let host = -1;
let currentPlayer = 0;
const rows = 15;
const columns = 15;
const cellValues = new Array(rows).fill().map(() => new Array(columns).fill(0));
const cellColors = new Array(rows).fill().map(() => new Array(columns).fill(-1));
let gameStarted = false;
let dataSendingRequired = false;
let dataToSend = null;
let firstTurnCompleted = false;
const firstTurnTerminated = [];
let allFirstTurnsTerminated = false;
let firstTurnData = "makefirstturn:";

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
            
            if (gameStarted)
            {
                if (firstTurnCompleted)
                {
                    if (splitMessage[0] === 'waitingturn')
                    {
                        if (dataSendingRequired)
                        {
                            if (!dataSent[parseInt(splitMessage[1])])
                            {
                                res.write(dataToSend);
                                res.end();
                                dataSent[parseInt(splitMessage[1])] = true;
                                let foundFalse = false;
                                for (let i = 0; i < dataSent.length; ++i)
                                {
                                    if (!dataSent[i])
                                    {
                                        foundFalse = true;
                                    }
                                }
                                if (!foundFalse)
                                {
                                    dataSendingRequired = false;
                                    dataToSend = null;
                                }
                            }
                        }
                        else
                        {
                            if (currentPlayer == parseInt(splitMessage[1]))
                            {
                                res.write("maketurn");
                                res.end();
                            }
                        }
                    }
                    else if (splitMessage[0] === 'turn' && parseInt(splitMessage[1]) == currentPlayer)
                    {
                        makeTurn(parseInt(splitMessage[2]), parseInt(splitMessage[3]));
                        res.write("wait");
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
                    if (splitMessage[0] === 'waitingfirstturn')
                    {
                        if (dataSendingRequired)
                        {
                            if (!dataSent[parseInt(splitMessage[1])])
                            {
                                res.write(dataToSend);
                                res.end();
                                dataSent[parseInt(splitMessage[1])] = true;
                                let foundFalse = false;
                                console.log("sent first turn to " + splitMessage[1]);
                                for (let i = 0; i < dataSent.length; ++i)
                                {
                                    if (!dataSent[i])
                                    {
                                        foundFalse = true;
                                    }
                                }
                                if (!foundFalse)
                                {
                                    dataSendingRequired = false;
                                    dataToSend = null;
                                    console.log("all first turn data sent");
                                }
                            }
                        }
                        else
                        {
                            if (currentPlayer == parseInt(splitMessage[1]))
                            {
                                res.write(firstTurnData);
                                res.end();
                            }
                            else if (currentPlayer == activePlayers.length)
                            {
                                if (allFirstTurnsTerminated)
                                {
                                    currentPlayer = 0;
                                    firstTurnCompleted = true;
                                }
                                else
                                {
                                    firstTurnTerminated[parseInt(splitMessage[1])] = true;
                                    res.write("firstturnsover");
                                    res.end();
                                    let foundFalse = false;
                                    for (let i = 0; i < firstTurnTerminated.length; ++i)
                                    {
                                        if (!firstTurnTerminated[i])
                                        {
                                            foundFalse = true;
                                            break;
                                        }
                                    }
                                    if (!foundFalse)
                                    {
                                        allFirstTurnsTerminated = true;
                                    }
                                }
                            }
                        }
                    }
                    else if (splitMessage[0] === 'firstturn' && parseInt(splitMessage[1]) == currentPlayer)
                    {
                        dataToSend = "setcells:" + splitMessage[2].toString() + "," + splitMessage[3].toString() + ",1," + currentPlayer.toString() + ";";
                        firstTurnData += splitMessage[2].toString() + "," + splitMessage[3].toString() + ";";
                        currentPlayer++;
                        for (let i = 0; i < dataSent.length; ++i)
                        {
                            dataSent[i] = false;
                        }
                        dataSendingRequired = true;
                        res.write("wait");
                        res.end();
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
                if (message === 'connect:player') 
                {
                    console.log('connect player');
                    if (activePlayers.length - (host == -1 ? 0 : 1) < 3)
                    {
                        dataSent.push(false);
                        activePlayers.push(true);
                        firstTurnTerminated.push(false);
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
                        firstTurnTerminated.push(false);
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
                        gameStarted = true;
                        firstTurnCompleted = false;
                        allFirstTurnsTerminated = false;
                        currentPlayer = 0;
                        firstTurnData = "makefirstturn:";
                    }
                }
                if (splitMessage[0] === 'waitingfirstturn')
                {
                    res.write("wait");
                    res.end();
                }
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
    do
    {
        let cellsToPop = [];
        for (let i = 0; i < rows; ++i)
        {
            for (let j = 0; j < columns; ++j)
            {
                if (cellValues[i][j] > 3)
                {
                    cellsToPop.push({i, j});
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
    for (let i = 0; i < dataSent.length; ++i)
    {
        dataSent[i] = false;
    }
    dataToSend = newData;
    dataSendingRequired = true;
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
                    }
                }
            }
            if (count == 0)
            {
                activePlayers[i] = false;
            }
        }
    }
    let lastPlayer = currentPlayer;
    let newPlayer = currentPlayer;
    do
    {
        newPlayer++;
        if (newPlayer >= activePlayers.length)
        {
            newPlayer = 0;
        }
        if (newPlayer == lastPlayer)
        {
            break;
        }
    }
    while (!activePlayers[newPlayer]);
    currentPlayer = newPlayer;
}

/*import java.io.*;
import java.net.*;

public class LongPollingClient {
    private static final String SERVER_URL = "https://nodejs-production-e5a3.up.railway.app";
    private static final String CONNECTING_MESSAGE = "connecting";
    private static final String WAITING_MESSAGE = "waiting";

    public static void main(String[] args) {
        try {
            URL url = new URL(SERVER_URL);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setDoOutput(true);
            OutputStreamWriter out = new OutputStreamWriter(connection.getOutputStream());
            out.write(CONNECTING_MESSAGE);
            out.flush();
            out.close();
            connection.disconnect();

            while (true) {
                HttpURLConnection waitingConnection = (HttpURLConnection) url.openConnection();
                waitingConnection.setRequestMethod("POST");
                waitingConnection.setDoOutput(true);
                OutputStreamWriter waitingOut = new OutputStreamWriter(waitingConnection.getOutputStream());
                waitingOut.write(WAITING_MESSAGE);
                waitingOut.flush();
                waitingOut.close();

                BufferedReader in = new BufferedReader(new InputStreamReader(waitingConnection.getInputStream()));
                String message = in.readLine();
                if (message != null) {
                    System.out.println("Received message from server: " + message);
                }
                waitingConnection.disconnect();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}*/
