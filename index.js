"use strict";
var express = require("express");
var app = express();
var http = require("http").createServer(app);
var io = require("socket.io")(http);
var port = process.env.PORT || 8080;
var s = require("./public/js/Server.js");
var servers = [];

// includes css when sent
app.use(express.static("public"));

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/public/index.html");
});

http.listen(port, function () {
  console.log("listening on: " + port);
});

io.on("connection", function (socket) {
  console.log("a user connected");
  servers.push(new s.Server(io, socket));

  socket.on("disconnect", function () {
    console.log("disconnecting");
    var i = servers.indexOf(socket);
    io.sockets.emit("clientDisconnected", socket.id);
    servers.splice(i, 1);
  });
});
