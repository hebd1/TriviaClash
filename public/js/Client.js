$(document).ready(function() {
    var socket = io.connect();

    socket.on('newGameCreated', function(data) {
        console.log('newGameCreated reached')
        $('#gameArea').html($('#create-game-template').html());
        $('#gameURL').text(window.location.href);
        $('#NewGameCode').text(data.gameId)
    });

    $('#btnCreateGame').click(function () {
        socket.emit('hostCreateGame');
    });

    $('#btnJoinGame').click(function () {
        socket.emit('playerJoinGame');
    });
});