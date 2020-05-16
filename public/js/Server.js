let io;
let gameSocket;
let triviaGame;
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;


class Game {

    constructor() {
        this.questionIndex = 0;
        this.correct_index = 0;

        // Get trivia questions
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("GET", 'https://opentdb.com/api.php?amount=10&encode=base64', false); // false for synchronous request
        xmlHttp.send(null);
        let response = xmlHttp.responseText;
        console.log(response);
        let obj = JSON.parse(response);
        this.questions = obj.results;
    }

    getRoundPayload() {
        let obj = this.questions[this.questionIndex++];
        let a_array = obj.incorrect_answers;
        this.correct_index =  Math.floor(Math.random() * Math.floor(4));
        a_array.splice(this.correct_index, 0, obj.correct_answer);
        console.log('correct index: ' + this.correct_index);
        let payload = {
            "type": obj.type,
            "question" : obj.question,
            "category": obj.category,
            "answers" : a_array
        }

        return payload;
    }
}

module.exports.Server = class {

    constructor(sio, socket) {
        io = sio;
        gameSocket = socket;
        console.log('Connection established');

        // Host Events
        gameSocket.on('hostCreateGame', this.hostCreateGame);
        gameSocket.on('hostRoomFull', this.hostStartGame);
        gameSocket.on('hostTimeUp', this.hostTimeUp);
        gameSocket.on('hostNextRound', this.hostNextRound);

        // Player Events
        gameSocket.on('playerRequestJoin', this.playerRequestJoin);
        gameSocket.on('playerAnswer', this.playerAnswer);
        gameSocket.on('playerRestart', this.playerRestart);
        gameSocket.on('disconnect', this.playerDisconnect);
    }

    // Host Functions

    hostCreateGame() {
        console.log('createGame reached');
        var thisGameId = (Math.random() * 100000) | 0;
        gameSocket.emit('newGameCreated', { gameId: thisGameId, mySocketId: gameSocket.id });
        gameSocket.join(thisGameId);
        triviaGame = new Game();
    }

    // Two players have entered the game room
    hostStartGame(gameId) {
        setTimeout(function () { io.sockets.in(gameId).emit('startCountDown', gameId); }, 2000);
    }

    hostTimeUp() {

    }

    hostNextRound(gameId) {
        console.log('host next round reached');
        io.sockets.in(gameId).emit('displayNextRound', triviaGame.getRoundPayload());

    }

    // Player Events
    playerRequestJoin(data) {
        console.log('player request join reached');

        // verify roome exists
        if (io.sockets.adapter.rooms[data.gameId] != undefined) {
            data.mySocketId = gameSocket.id;
            gameSocket.join(data.gameId);
            io.sockets.in(data.gameId).emit('clientJoinedRoom', data);
        } else {
            this.emit('error', { message: 'unable to join room' });
        }


    }

    playerAnswer() {

    }

    playerRestart() {

    }

    playerDisconnect() {
        console.log('user disconnected');
    }
}
