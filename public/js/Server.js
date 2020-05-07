let io;
let gameSocket;

module.exports.Server = class{

    constructor(sio, socket) {
        io = sio;
        gameSocket = socket;
        console.log('Connection established');

        // Host Events
        gameSocket.on('hostCreateGame', this.hostCreateGame);
        gameSocket.on('hostRoomFull', this.hostStartGame);
        gameSocket.on('hostTimeUp', this.hostTimeUp);
        gameSocket.on('hostNextround', this.hostNextRound);

        // Player Events
        gameSocket.on('playerReqestJoin', this.playerRequestJoin);
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
    playerRequestJoin(data) {
        console.log('player joined reached');
        var sock = this;

        // verify roome exists
        if (io.sockets.adapter.rooms[data.gameId] != undefined) {
            data.mySocketId = sock.id;
            sock.join(data.gameId);
            io.sockets.in(data.gameId).emit('playerJoinedRoom', data);
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