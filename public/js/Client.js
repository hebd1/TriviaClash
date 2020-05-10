$(document).ready(function() {

    // Create web socket connection on page load
    var socket = io.connect();
    let socketID;
    let gameID;
    var role; // player or host
    let currentRound;

    class Client {

        constructor() {

             // Starts a timer with the given seconds, updates the display, and invokes the callback function at end
             this.startTimer = function (seconds, display, callback) {
                var duration = seconds;
                var t = setInterval(function () {
                    display.text(seconds);
                    if (--seconds == 0) {
                        callback();
                        clearInterval(t);
                    }
                }, 1000);
            };
        }
        
    }

    // Controlling host data members
    class Host extends Client {

        constructor() {

            super();
            let players = [];
            let isNewGame = false;
            let numPlayers = 0;
            let correctAnsser = '';

            this.joinRoom = function (data) {
                if (isNewGame) {
                    $('#gameArea').html($('#create-game-template').html());
                }
                // Update the lobby screen
                $('#playersWaiting').append('<p/>').text('Player ' + data.name + ' joined the game!');
                players.push(data);
                numPlayers += 1;
                if (numPlayers == 2) {
                    console.log('Room is full!');
                    socket.emit('hostRoomFull', gameID);
                    currentRound = 0;
                }
            };
        }
    }

    // Player information
    class Player extends Client {

        constructor(data) {

            super();
            let hostSocketId = '';
            let name = data.name;

            this.joinRoom = function (data) {
                console.log('client is a player;)');
                console.log(data.mySocketId);
                console.log(socket.io.engine.id);
                if (socket.io.engine.id == data.mySocketId) {
                    gameID = data.gameId;
                    $('#playerWaitingMessage').append('<p/>').text('Joined game ' + gameID + '. Please wait for the game to begin..');
                }
            };
        }
    }

    // Server messages

    // A new game was created by a host
    socket.on('newGameCreated', function(data) {
        // initialize game
        gameID = data.gameId;
        socketID = data.mySocketId;
        role = new Host();

        // display new game screen
        console.log('newGameCreated reached')
        $('#gameArea').html($('#create-game-template').html());
        $('#gameURL').text(window.location.href);
        $('#NewGameCode').text(data.gameId)
    });

    // Display countdown to new game start
    socket.on('startCountDown', function(data) {
        $('#gameArea').html($('#start-game-countdown-template').html());
        role.startTimer(3, $('#startCountdown'), function() {socket.emit('hostNextRound')});
    });

    // Client joined a valid game room
    socket.on('clientJoinedRoom', function (data) {
        console.log('clientJoinedRoom reached')
        // Client is a host
        role.joinRoom(data);
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

        role = new Player(data);
    });
});