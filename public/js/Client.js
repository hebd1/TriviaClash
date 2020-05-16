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
                    seconds--;
                    if (seconds > 0) {
                        display.text(seconds);
                    }
                    else if (seconds < 0) {
                        clearInterval(t);
                        callback();
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
            let numAnswered = 0;

            this.joinRoom = function (data) {
                if (isNewGame) {
                    $('#gameArea').html($('#create-game-template').html());
                    this.numPlayers = 0;
                }
                // Update the lobby screen
                $('#playersWaiting').append('<p>Player ' + data.name + ' joined the game! <p/>');
                players.push(data.name);
                numPlayers += 1;
                if (numPlayers == 2) {
                    console.log('Room is full!');
                    socket.emit('hostRoomFull', gameID);
                    currentRound = 0;
                }
            };

            this.displayNextRound = function(question) {
                console.log(question);
                $('#gameArea').html($('#host-question-template').html());
                $('#p1').text(players[0]);
                $('#p2').text(players[1]);
                // use atob to decode base64 on the client side
                $('#hostWord').text(atob(question.question));
                $('#category').text(atob(question.category));
            }

            this.incrementAnswers = function() {
                numAnswered++;
                console.log('numAnswered: ' + numAnswered);
                console.log('numPlayers' + numPlayers);
                if (numAnswered == numPlayers) {
                    socket.emit('hostDisplayCorrectAnswer', gameID);
                    numAnswered = 0;
                }
            }

            this.endRound = function(data) {
                $('#hostWord').text('Correct Answer: \n' + atob(data.answer));
            };
        }
    }

    // Player information
    class Player extends Client {

        constructor(data) {

            super();
            let hostSocketId = '';
            let name = data.name;
            this.answeredIndex = 0;

            this.joinRoom = function (data) {
                console.log('client is a player;)');
                console.log(data.mySocketId);
                console.log(socket.io.engine.id);
                if (socket.io.engine.id == data.mySocketId) {
                    gameID = data.gameId;
                    $('#playerWaitingMessage').append('<p/>').text('Joined game ' + gameID + '. Please wait for the game to begin..');
                }
            };

            this.displayNextRound = function(question) {
                $('#gameArea').html($('#player-question-template').html());
                $('#player_name').text(name);
                if (atob(question.type) == 'multiple') {
                    $('#answer-template').html($('#player-inner-mc-template').html());
                    let i;
                    for (i = 0; i < 4; i++) {
                        $('#' + i).text(atob(question.answers[i]));
                    }
                } else {
                    $('#answer-template').html($('#player-inner-tf-template').html());
                }
            }

            this.endRound = function(data) {
                $('#answer-template').html($('#player-end-round-template').html());
                if (this.answeredIndex == data.index) {
                    $('#result_text').text('Correct!');
                } else {
                    $('#result_text').text('Incorect!');
                }
            };

            this.setAnswer = function(index) {
                this.answeredIndex = index;
            }
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
        if (role instanceof Host) {
            role.startTimer(4, $('#startCountdown'), function() {socket.emit('hostNextRound', gameID)});
        } else {
            // Display character or logo
            // role.startTimer(3, $('#startCountdown'), function() {socket.emit('playerNextRound', gameID)});
        }
    });

    // Client joined a valid game room
    socket.on('clientJoinedRoom', function (data) {
        console.log('clientJoinedRoom reached')
        // Client is a host
        role.joinRoom(data);
    });


    socket.on('displayNextRound', function(data) {
        console.log('displayNextRound reached');
        console.log(data);
        role.displayNextRound(data);
    });

    socket.on('hostIncrementAnswers', function() {
        if (role instanceof Host) role.incrementAnswers();
    })

    socket.on('endRound', function (data) {
        console.log('end round reached');
        role.endRound(data);
    })



    // Document Interaction Events

    // Welcome page events
    $(document).on('click', '#btnCreateGame', function() {
        socket.emit('hostCreateGame');
    });

   
    $(document).on('click', '#btnJoinGame', function() {
        $('#gameArea').html($('#join-game-template').html());
    });

    $(document).on('click', '.btn-outline-secondary', function(event) {
        $('#answer-template').html($('#player-wait-template').html());
        q = event.target.id;
        console.log('target id: ' + q);
        role.setAnswer(q);
        let data = {
            gameId : gameID,
            index: q
        }
        socket.emit('playerAnswer', data);
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