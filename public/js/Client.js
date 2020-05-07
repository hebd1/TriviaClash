$(document).ready(function() {

    // Create web socket connection on page load
    let socket = io.connect();
    let socketID;
    let gameID;
    let role; // player or host
    let currentRound;

    var Host = {
        players : [],
        isNewGame : false,
        numPlayers : 0,
        correctAnsser : '',
    }


    // Server messages
    socket.on('connected', function() {
        console.log(socketID);
    });

    socket.on('newGameCreated', function(data) {
        gameID = data.gameId;
        socketID = data.mySocketId;
        role = 'Host';

        console.log('newGameCreated reached')
        $('#gameArea').html($('#create-game-template').html());
        $('#gameURL').text(window.location.href);
        $('#NewGameCode').text(data.gameId)
    });


    // Document Interaction Events

    $('#btnCreateGame').click(function () {
        socket.emit('hostCreateGame');
    });

    $('#btnJoinGame').click(function () {
        socket.emit('playerJoinGame');
    });
});