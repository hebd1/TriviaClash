var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
port = process.env.PORT || 8080

// includes css when sent
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

http.listen(port, () => {
  console.log('listening on: ' + port);
});

io.on('connection', (socket) => {
    console.log('a user connected');
    var numPlayers = 0;

    socket.on('disconnect', () => {
      console.log('user disconnected');
    });

    socket.on('createGame', () => {
        console.log('createGame reached')
        var thisGameId = ( Math.random() * 100000 ) | 0;
        socket.emit('newGameCreated', {gameId: thisGameId, mySocketId: socket.id});
        socket.join(thisGameId)
    });

    socket.on('joinGame', () => {
        // start here
    })
    
});
