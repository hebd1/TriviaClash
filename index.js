"use strict";
var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 8080;
//import * as Server from './public/js/Server';
var s = require('./public/js/Server.js');
//var s = new server();

// includes css when sent
app.use(express.static('public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

http.listen(port, function () {
    console.log('listening on: ' + port);
});

io.on('connection', function (socket) {
    console.log('a user connected');
    const server = new s.Server(io, socket);
});
