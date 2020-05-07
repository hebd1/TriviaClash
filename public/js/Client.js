$(document).ready(function() {

    // Create web socket connection on page load
    let socket = io.connect();
    let socketID;
    let gameID;
    let role; // player or host
    let currentRound;

    // Controlling host data members
    var Host = {
        players : [],
        isNewGame : false,
        numPlayers : 0,
        correctAnsser : '',
    }

    // Player information
    var Player = {
        hostSocketId : '',
        name : '',

    }

    // Server messages

    socket.on('newGameCreated', function(data) {
        // initialize game
        gameID = data.gameId;
        socketID = data.mySocketId;
        role = 'Host';
        Host.numPlayers = 0;

        // display new game screen
        console.log('newGameCreated reached')
        $('#gameArea').html($('#create-game-template').html());
        $('#gameURL').text(window.location.href);
        $('#NewGameCode').text(data.gameId)
    });

    socket.on('playerJoinedRoom', function (data) {
        if (Host.isNewGame) {
            $('#gameArea').html($('#create-game-template').html());
        }

        // Update the lobby screen
        $('#playersWaiting').append('<p/>').text('Player ' + data.name + ' joined the game!');

        Host.players.push(data);

        Host.numPlayers += 1;

        if (Host.numPlayers == 2) {
            console.log('Room is full!');
            socket.emit('hostRoomFull', gameID);
            currentRound = 0;
        }
    });


    // Document Interaction Events

    // Welcome page events
    $(document).on('click', '#btnCreateGame', function() {
        socket.emit('hostCreateGame');
    });

   
    $(document).on('click', '#btnJoinGame', function() {
        $('#gameArea').html($('#join-game-template').html());
    });

    // Join Game Page events
    $(document).on('click', '#btnStart', function() {
        let data = {
            gameId : $('#inputGameId').val(),
            name : $('#inputPlayerName').val() || 'Anonymous'
        };

        socket.emit('playerRequestJoin', data);

        role = 'Player';
        Player.name = data.name;
    });
});