$(document).ready(function() {

    // Create web socket connection on page load
    var socket = io.connect();
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

    socket.on('clientJoinedRoom', function (data) {
        console.log('clientJoinedRoom reached')
        // Client is a host
        if (role == 'Host') {
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
        } 
        // Client is a player
        else {
            console.log('client is a player;)');
            console.log(data.mySocketId);
            console.log(socket.io.engine.id);
            if (socket.io.engine.id == data.mySocketId) {
                gameID = data.gameId;
                $('#playerWaitingMessage').append('<p/>').text('Joined game ' + gameID + '. Please wait for the game to begin..');
            }
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
        console.log('start button clicked');
        let data = {
            gameId : $('#inputGameId').val(),
            name : $('#inputPlayerName').val() || 'Anonymous'
        };

        socket.emit('playerRequestJoin', data);

        role = 'Player';
        Player.name = data.name;
    });
});