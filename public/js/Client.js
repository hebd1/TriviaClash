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
                    else if (seconds <= 0) {
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
            let IDs = [];
            let isNewGame = false;
            let numPlayers = 0;
            let numAnswered = 0;
            let round = 0;
            let topPlayer = '';
            let topScore = 0;
            let tie = false;

            this.joinRoom = function (data) {
                if (isNewGame) {
                    $('#gameArea').html($('#create-game-template').html());
                    this.numPlayers = 0;
                }
                // Update the lobby screen
                $('#playersWaiting').append('<p>Player ' + data.name + ' joined the game! <p/>');
                players.push(data.name);
                IDs.push(data.mySocketId);
                numPlayers += 1;
                // first player decides when game starts
                if (numPlayers == 1) {
                    console.log('first player joined');
                    socket.emit('firstPlayerJoined', data);
                }
                if (numPlayers == 7) {
                    console.log('Room is full!');
                    socket.emit('hostRoomFull', gameID);
                    currentRound = 0;
                }
            };

            this.startGame = function() {
                $('#gameArea').html($('#host-question-template').html());
                var index;
                for (index = 0; index < numPlayers; index++) {
                    $('#p' + index).text(players[index]);
                }
                socket.emit('hostNextRound', gameID);
            }

            this.displayNextRound = function(question) {
                console.log(question);
                $('#timer').text('10');
                $('#hostWord').text(question.question);
                $('#category').text(question.category);
                this.startTimer(10, $('#timer'), function() {socket.emit('hostTimeUp', gameID)});
            }

            this.incrementAnswers = function(data) {
                // make sure rounds match up to avoid a late response
                if (round == data.round) {
                    numAnswered++;
                    console.log('numAnswered: ' + numAnswered);
                    console.log('numPlayers' + numPlayers);
                    if (numAnswered == numPlayers) {
                        // just let the timer run out for now
                        // issue with canceling already started timer
                       // socket.emit('hostTimeUp', gameID);
                        numAnswered = 0;
                    }
                }
            }

            this.endRound = function(data) {
                // Occasional issues with answer received from trivia api not being base64 encoded
                try {
                    $('#hostWord').text('Correct Answer: \n' + data.answer);
                } catch {
                    $('#hostWord').text('Correct Answer: \n' + data.answer);
                }
                $('#timer').text(' ');
                round++;
                if (round < 10) {
                    this.startTimer(4, $(''), function() {socket.emit('hostNextRound', gameID)});
                } else {
                    this.startTimer(4, $(''), function() {socket.emit('hostEndGame', gameID)});
                }

            };

            this.updateScore = function(data) {
                let player_index = players.indexOf(data.pName);
                let cur_score = parseInt($('#score_' + player_index).text());
                let new_score = cur_score + parseInt(data.score);
                if (new_score > topScore) {
                    topScore = new_score;
                    topPlayer = data.pName;
                    tie = false;
                } else if (data.pName != topPlayer && topScore == new_score) {
                    tie = true;
                }
                $('#score_' + player_index).text(new_score);
            }

            this.endGame = function() {
                $('#gameArea').html($('#player-end-game-template').html());
                if (topScore == 0) {
                    $('#winner').text('Wow.. Ya\'ll stupid.');
                    $('#top_score').text('');
                } else if (tie == true) {
                    $('#winner').text('Welp! it\'s a tie..');
                    $('#top_score').text('');
                }
                $('#winner').text('Winner: ' + topPlayer);
                $('#top_score').text('Top Score: ' + topScore);
            }

            this.removePlayer = function(player_Id) {
                console.log('client disconnected reached');

                if (IDs.includes(player_Id)) {
                    console.log('removing player');
                    console.log(IDs);
                    console.log(players);
                    let i = IDs.indexOf(player_Id);
                    console.log(i);
                    IDs.splice(i, 1);
                    players.splice(i, 1);
                    $('#player' + i + 'Score').remove();
                    console.log(IDs);
                    console.log(players);
    
                    // End the game if there aren't enough players
                    if (IDs.length == 0) {
                        $('#gameArea').html($('#player-end-game-template').html());
                        $('#winner').text('Error: Not enough active players to continue..');
                    }
                }
               
            }
        }
    }

    // Player information
    class Player extends Client {

        constructor(data) {

            super();
            let hostSocketId = '';
            let name = data.name;
            this.answeredIndex = 5;
            let round = 0;

            this.joinRoom = function (data) {
                console.log(data.mySocketId);
                console.log(socket.io.engine.id);
                socketID = data.mySocketId;
                if (socket.io.engine.id == data.mySocketId) {
                    gameID = data.gameId;
                    $('#playerWaitingMessage').append('<p/>').text('Joined game ' + gameID + '. Please wait for the game to begin..');
                }
            };

            this.displayNextRound = function(question) {
                $('#gameArea').html($('#player-question-template').html());
                $('#player_name').text(name);
                if (question.type == 'multiple') {
                    $('#answer-template').html($('#player-inner-mc-template').html());
                    let i;
                    for (i = 0; i < 4; i++) {
                        $('#' + i).text(question.answers[i]);
                    }
                } else {
                    $('#answer-template').html($('#player-inner-tf-template').html());
                }
            }

            this.endRound = function(data) {
                $('#answer-template').html($('#player-end-round-template').html());
                let roundScore;
                if (this.answeredIndex == data.index) {
                    $('#result_text').text('Nice one!');
                    $('#round_score').text('+10');
                    roundScore = 10;
                } else {
                    $('#result_text').text('Oof! Too bad..');
                    $('#round_score').text('0');
                    roundScore = 0;
                }
                round++;
                socket.emit('hostUpdateScore', {gameId: gameID, score: roundScore, pName: name});                
            };

            this.displayStartButton = function() {
                console.log('display start button inner reached');
                $('#gameArea').html($('#player-start-button-template').html());
            }

            this.setAnswer = function(index) {
                this.answeredIndex = index;
                let data = {
                    gameId : gameID,
                    index : q,
                    round : round
                }
                socket.emit('playerAnswer', data);
            }

            this.endGame = function() {

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

    socket.on('endGame', function(data) {
        role.endGame();
    });

    // Display countdown to new game start
    socket.on('playerStartCountdown', function() {
        console.log('player start countdown');
        $('#gameArea').html($('#start-game-countdown-template').html());
        if (role instanceof Host) role.startTimer(4, $('#startCountdown'), function() {socket.emit('hostStartGame', gameID)});
    });

    // Client joined a valid game room
    socket.on('clientJoinedRoom', function (data) {
        console.log('clientJoinedRoom reached')
        // Client is a host
        role.joinRoom(data);
    });

    socket.on('clientDisplayStartButton', function (data) {
        console.log('clientDisplayStartButton reached');
        if (role instanceof Player && data.mySocketId == socketID) role.displayStartButton();
    });

    socket.on('startGame', function () {
        console.log('start game reached');
        if (role instanceof Host) role.startGame();
    });


    socket.on('displayNextRound', function(data) {
        console.log('displayNextRound reached');
        console.log(data);
        role.displayNextRound(data);
    });

    socket.on('hostIncrementAnswers', function(data) {
        if (role instanceof Host) role.incrementAnswers(data);
    })

    socket.on('endRound', function (data) {
        console.log('end round reached');
        role.endRound(data);
    })

    socket.on('hostDisplayScore', function (data) {
        console.log('host displaying updated score');
        if (role instanceof Host) role.updateScore(data);
    });

    socket.on('clientDisconnected', function (player_Id) {
        if (role instanceof Host) role.removePlayer(player_Id);
    });


    // Document Interaction Events

    // Welcome page events
    $(document).on('click', '#btnCreateGame', function() {
        socket.emit('hostCreateGame');
    });

    $(document).on('click', '#start_game_btn', function() {
        socket.emit('hostRoomFull', gameID);
    });
   
    $(document).on('click', '#btnJoinGame', function() {
        $('#gameArea').html($('#join-game-template').html());
    });

    // player answered question and clicked an answer
    $(document).on('click', '.btn-outline-secondary', function(event) {
        $('#answer-template').html($('#player-wait-template').html());
        q = event.target.id;
        console.log('target id: ' + q);
        role.setAnswer(q);
    });

    // Join Game Page events
    $(document).on('click', '#btnStart', function() {
        console.log('start button clicked');
        let data = {
            gameId : $('#inputGameId').val(),
            name : $('#inputPlayerName').val() || 'Anonymous',
            mySocketId : socket.id
        };

        socket.emit('playerRequestJoin', data);

        role = new Player(data);
    });
});