let io;
let gameSocket;
let socketid;
let triviaGame;
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var Base64 = require('js-base64').Base64;


class Game {

    constructor() {
        this.questionIndex = 0;
        this.correct_index = 0;
        this.round = 0;
        this.answerArray = [];

        // Get trivia questions
        var xmlHttp = new XMLHttpRequest();
        // xmlHttp.open("GET", 'https://opentdb.com/api.php?amount=10&encode=base64', false); // false for synchronous request
        xmlHttp.open("GET", 'https://opentdb.com/api.php?amount=10&category=9&encode=base64', false); // false for synchronous request
        xmlHttp.send(null);
        let response = xmlHttp.responseText;
        console.log(response);
        let obj = JSON.parse(response);
        this.questions = obj.results;
    }

    getStartPayload() {
        let obj = this.questions[this.questionIndex++];
        let answerArrayEnc = obj.incorrect_answers;
        this.answerArray = [];
        for (var i = 0; i <= answerArrayEnc.length; i++) {
            this.answerArray.push(Base64.decode(answerArrayEnc[i]));
        }
        this.correct_index =  Math.floor(Math.random() * Math.floor(4));
        this.answerArray.splice(this.correct_index, 0, Base64.decode(obj.correct_answer));
        console.log('correct index: ' + this.correct_index);
        let payload = {
            "type": Base64.decode(obj.type),
            "question" : Base64.decode(obj.question),
            "category": Base64.decode(obj.category),
            "answers" : this.answerArray
        }

        return payload;
    }

    getEndPayload() {
        let payload = {
            "index" : triviaGame.correct_index,
            "answer" : triviaGame.answerArray[triviaGame.correct_index]
        }

        return payload;
    }
}

module.exports.Server = class {

    constructor(sio, socket) {
        io = sio;
        gameSocket = socket;
        socketid = socket.id;
        console.log('Connection established');

        // Host Events
        gameSocket.on('hostCreateGame', this.hostCreateGame);
        gameSocket.on('hostUpdateScore', this.hostUpdateScore);
        gameSocket.on('hostRoomFull', this.hostRoomFull);
        gameSocket.on('hostTimeUp', this.hostTimeUp);
        gameSocket.on('hostStartGame', this.hostStartGame);
        gameSocket.on('hostEndGame', this.hostEndGame);
        gameSocket.on('hostNextRound', this.hostNextRound);
        gameSocket.on('hostDisplayCorrectAnswer', this.hostDisplayCorrectAnswer);

        // Player Events
        gameSocket.on('playerRequestJoin', this.playerRequestJoin);
        gameSocket.on('playerAnswer', this.playerAnswer);
        gameSocket.on('playerRestart', this.playerRestart);
        gameSocket.on('firstPlayerJoined', this.firstPlayerJoined);
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
        io.sockets.in(gameId).emit('startGame');
    }

    hostUpdateScore(data) {
        console.log('host update score reached');
        io.sockets.in(data.gameId).emit('hostDisplayScore', data);

    }

    hostEndGame (gameId) {
        console.log('host end game reached');
        io.sockets.in(gameId).emit('endGame');
    }

    hostRoomFull(gameId) {
        console.log('host room full reached');
        setTimeout(function () { io.sockets.in(gameId).emit('playerStartCountdown'); }, 2000);
    }

    hostDisplayCorrectAnswer(gameId) {
        console.log('display correct answer reached');
        io.sockets.in(gameId).emit('endRound', triviaGame.getEndPayload());
    }

    hostTimeUp(gameId) {
        console.log('time up reached');
        try {
            io.sockets.in(gameId).emit('endRound', triviaGame.getEndPayload());
        } catch (error) {
            console.log(error);
        }
    }

    hostNextRound(gameId) {
        console.log('host next round reached');
        try {
            io.sockets.in(gameId).emit('displayNextRound', triviaGame.getStartPayload());
        } catch (error) {
            console.log(error);
        }
    }

    // Player Events
    playerRequestJoin(data) {
        console.log('player request join reached');

        // verify roome exists
        if (io.sockets.adapter.rooms[data.gameId] != undefined) {
            console.log('joined');
            // data.mySocketId = gameSocket.id;
            gameSocket.join(data.gameId);
            io.sockets.in(data.gameId).emit('clientJoinedRoom', data);
        } else {
            console.log('didnt join');
            this.emit('error', { message: 'unable to join room' });
        }
    }

    // player selected an answer
    playerAnswer(data) {
        console.log('player answered: ' + data.index);
        io.sockets.in(data.gameId).emit('hostIncrementAnswers', data);
    }

    playerRestart() {

    }

    firstPlayerJoined(data) {
        console.log('first player joined reached');
        io.sockets.in(data.gameId).emit('clientDisplayStartButton', data);
    }

}
