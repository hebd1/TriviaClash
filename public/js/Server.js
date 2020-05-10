let io;
let gameSocket;

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
    }

    // Two players have entered the game room
    hostStartGame(gameId) {
        // setup game logic 
        // query trivia API

        // Display countdown
        // wait 2 seconds before starting
        // TODO: display start button 
        setTimeout(function() {io.sockets.in(gameId).emit('startCountDown', gameId);}, 2000);
        //io.sockets.in(gameId).emit('startCountDown', gameId);
    }

    hostTimeUp() {

    }

    hostNextRound() {
        console.log('host next round reached');
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
            this.emit('error', {message: 'unable to join room'});
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