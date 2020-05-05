let io;
let gameSocket;

module.exports.Server = class{

    constructor(sio, socket) {
        io = sio;
        gameSocket = socket;
        console.log('Connection established');
        gameSocket.emit('connected');

        // Host Events
        gameSocket.on('hostCreateGame', this.hostCreateGame);
        gameSocket.on('hostRoomFull', this.hostStartGame);
        gameSocket.on('hostTimeUp', this.hostTimeUp);
        gameSocket.on('hostNextround', this.hostNextRound);

        // Player Events
        gameSocket.on('playerJoinGame', this.playerJoined);
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

    hostStartGame() {

    }

    hostTimeUp() {

    }

    hostNextRound() {

    }

    // Player Events
    playerJoined() {

    }

    playerAnswer() {

    }

    playerRestart() {

    }

    playerDisconnect() {
        console.log('user disconnected');
    }


}