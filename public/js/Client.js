$(document).ready(function () {
  let socketID;
  let gameID;
  var role; // player or host
  let url;
  let roomCode;
  var socket = io.connect();

  class Client {
    constructor() {
      // Starts a timer with the given seconds, updates the display, and invokes the callback function at end
      this.startTimer = function (seconds, display, callback) {
        var t = setInterval(function () {
          seconds--;
          if (seconds > 0) {
            display.text(seconds);
          } else if (seconds <= 0) {
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
      let playerScores = [];
      let IDs = [];
      let isNewGame = true;
      let numPlayers = 0;
      let numAnswered = 0;
      let round = 0;
     

      this.joinRoom = function (data) {
        numPlayers += 1;
        let index;
        if (numPlayers < 7) {
          // new player
          if (!players.includes(data.name)) {
            players.push(data.name);
            IDs.push(data.mySocketId);
            playerScores.push(0);
            index = numPlayers - 1;
          } 
          // player left the game and is now rejoining
          else {
            index = players.indexOf(data.name);
          }
          if (isNewGame) {
            this.numPlayers = 0;
            // Update the lobby screen
            $("#playersWaiting").append(
              "<p class='p_join'>Player " + data.name + " joined the game! <p/>"
            );
            // remove empty p tags
            $('p').each(function(index, item) {
              if($.trim($(item).text()) === "") {
                  $(item).slideUp(); 
              }
          });
            // first player decides when game starts
            if (numPlayers == 1) {
              console.log("first player joined");
              socket.emit("firstPlayerJoined", data);
            }
            // auto start game with 6 players (max)
            if (numPlayers == 6) {
              console.log("Room is full!");
              socket.emit("hostRoomFull", gameID);
              currentRound = 0;
            }
          } 
          else {
            $(
              '<div class="row playerScore" id="p' + index + '-div"><div class="row p_row" id="player' 
              + index + 'Score"><div class="col-8 p_name"><span class="playerName" id="p' 
              + index + '">PlayerX</span></div><div class="col-4 rounded-circle playerScoreCircle" alt="100x100"><span class="score" id="score_' 
              + index + '">' + playerScores[index] + '</span></div></div></div>'
            ).insertAfter("#p" + (index - 1) + "-div");
            $("#p" + index).text(players[index]);
            $("#p" + index + "-div").animate({ left: "10px" });
          }
        }
      };

      this.startGame = function () {
        console.log(players);
        isNewGame = false;
        $("#gameArea").html($("#host-question-template").html());
        $("#gameUrl").text(url);
        $("#roomCode").text('Room Code: ' + roomCode);
        $("#p0").text(players[0]);
        $("#p0-div").animate({ left: "10px" });
        var index;
        for (index = 1; index < players.length; index++) {
          $(
            '<div class="row playerScore" id="p' + index + '-div"><div class="row p_row" id="player' 
              + index + 'Score"><div class="col-8 p_name"><span class="playerName" id="p' 
              + index + '">PlayerX</span></div><div class="col-4 rounded-circle playerScoreCircle" alt="100x100"><span class="score" id="score_' 
              + index + '">' + playerScores[index] + '</span></div></div></div>'
          ).insertAfter("#p" + (index - 1) + "-div");
          $("#p" + index).text(players[index]);
          $("#p" + index + "-div").animate({ left: "10px" });
        }
        //socket.emit('hostNextRound', gameID);
        socket.emit("hostNextCategory", gameID);
      };

      this.displayNextRound = function (question) {
        console.log(question);
        $("#timer").text("10");
        $("#hostWord").text(question.question);
        $("#category").text(question.category);
        this.startTimer(10, $("#timer"), function () {
          socket.emit("hostTimeUp", gameID);
        });
      };

      this.displayNextCategory = function (data) {
        console.log(data);
        round = 0;
        $("#hostWord").text("Round: " + data.round + "\r\n" + data.category);
        $("#timer").text("");
        this.startTimer(3, $(""), function () {
          socket.emit("hostNextRound", gameID);
        });
      };

      this.incrementAnswers = function (data) {
        // make sure rounds match up to avoid a late response
        if (round == data.round) {
          numAnswered++;
          console.log("numAnswered: " + numAnswered);
          console.log("numPlayers" + numPlayers);
          if (numAnswered == numPlayers) {
            numAnswered = 0;
          }
        }
      };

      this.endRound = function (data) {
        try {
          $("#hostWord").text("Correct Answer: \n" + data.answer);
        } catch {
          $("#hostWord").text("Correct Answer: \n" + data.answer);
        }
        $("#timer").text(" ");
        round++;
        if (round < 10) {
          this.startTimer(4, $(""), function () {
            socket.emit("hostNextRound", gameID);
          });
        } else {
          this.startTimer(4, $(""), function () {
            socket.emit("hostNextCategory", gameID);
          });
        }
      };

      this.updateScore = function (data) {
        let player_index = players.indexOf(data.pName);
        let cur_score = parseInt($("#score_" + player_index).text());
        let new_score = cur_score + parseInt(data.score);
        playerScores[player_index] = new_score;
        $("#score_" + player_index).text(new_score);
      };

      this.endGame = function () {
        isNewGame = true;
        let tie = false;
        console.log(players);
        console.log(playerScores);
        let scoreClone = playerScores.slice();
        scoreClone.sort();
        console.log(scoreClone);
        if (scoreClone[scoreClone.length - 1] == scoreClone[scoreClone.length - 2]) {
          tie = true;
        }
        let topScore = scoreClone[scoreClone.length - 1];
        let topIndex = playerScores.indexOf(topScore);
        let topPlayer = players[topIndex];
        $("#gameArea").html($("#player-end-game-template").html());
        var mp = 150;
        var particleColors = {
          colorOptions: [
            "DodgerBlue",
            "OliveDrab",
            "Gold",
            "pink",
            "SlateBlue",
            "lightblue",
            "Violet",
            "PaleGreen",
            "SteelBlue",
            "SandyBrown",
            "Chocolate",
            "Crimson",
          ],
          colorIndex: 0,
          colorIncrementer: 0,
          colorThreshold: 10,
        };
        $.confetti.start();

        if (topScore == 0) {
          $("#winner").text("Wow.. Ya'll stupid.");
          $("#top_score").text("");
        } else if (tie == true) {
          $("#winner").text("Welp! it's a tie..");
          $("#top_score").text("Top Score: " + topScore);
        }
        $("#winner").text("Winner: " + topPlayer);
        $("#top_score").text("Top Score: " + topScore);
      };

      this.removePlayer = function (player_Id) {
        console.log("client disconnected reached");

        if (IDs.includes(player_Id)) {
          let i = IDs.indexOf(player_Id);
          $("#p" + i + "-div").animate({ left: "-250px" });
          this.startTimer(1, $(""), function () {
             $("#p" + i + "-div").remove();
          });
          // End the game if there aren't enough players
          if ($(".p_row").length == 1) {
            $("#gameArea").html($("#player-end-game-template").html());
            $("#winner").text("Error: Not enough active players to continue..");
          }
        }
      };
    }
  }

  // Player information
  class Player extends Client {
    constructor(data) {
      super();
      let hostSocketId = "";
      let name = data.name;
      this.answeredIndex = 5;
      let round = 0;

      this.joinRoom = function (data) {
        console.log(data.mySocketId);
        console.log(socket.io.engine.id);
        socketID = data.mySocketId;
        if (socket.io.engine.id == data.mySocketId) {
          gameID = data.gameId;
          $("#gameArea").html($("#player-wait-template").html());
        }
      };

      this.displayNextRound = function (question) {
        this.answeredIndex = 5; // reset answer index
        $("#gameArea").html($("#player-question-template").html());
        $("#player_name").text(name);
        if (question.type == "multiple") {
          $("#answer-template").html($("#player-inner-mc-template").html());
          let i;
          for (i = 0; i < 4; i++) {
            $("#" + i).text(question.answers[i]);
          }
        } else {
          $("#answer-template").html($("#player-inner-tf-template").html());
          $("#0").text(question.answers[0]);
          $("#1").text(question.answers[1]);
        }
      };

      this.endRound = function (data) {
        $("#answer-template").html($("#player-end-round-template").html());
        let roundScore;
        if (this.answeredIndex == data.index) {
          $("#result_text").text("Correct!");
          $("#round_score").text("+10");
          roundScore = 10;
        } else {
          $("#result_text").text("Wrong...");
          $("#round_score").text("+0");
          roundScore = 0;
        }
        round++;
        socket.emit("hostUpdateScore", {
          gameId: gameID,
          score: roundScore,
          pName: name,
        });
      };

      this.displayStartButton = function () {
        console.log("display start button inner reached");
        $("#gameArea").html($("#player-start-button-template").html());
      };

      this.setAnswer = function (index) {
        this.answeredIndex = index;
        let data = {
          gameId: gameID,
          index: q,
          round: round,
        };
        socket.emit("playerAnswer", data);
      };

      this.endGame = function () {};
    }
  }

  // Server messages
  socket.on("newGameCreated", function (data) {
    // initialize game
    url = "http://" + data.ip + ":8080";
    gameID = data.gameId;
    socketID = data.mySocketId;
    role = new Host();
    roomCode = data.gameId;
    // display new game screen
    console.log("newGameCreated reached");
    $("#gameArea").html($("#create-game-template").html());
    $("#gameURL").text(url);
    $("#NewGameCode").text(gameID);
  });

  socket.on("endGame", function (data) {
    role.endGame();
  });

  socket.on("err", function (data) {
    $("#playerWaitingMessage")
      .append("<p/>")
      .text("Error: " + data.message);
  });

  // Display countdown to new game start
  socket.on("playerStartCountdown", function () {
    console.log("player start countdown");
    if (role instanceof Host) {
      $("#gameArea").html($("#start-game-countdown-template").html());
      role.startTimer(4, $("#startCountdown"), function () {
        socket.emit("hostStartGame", gameID);
      });
    }
  });

  // Client joined a valid game room
  socket.on("clientJoinedRoom", function (data) {
    console.log("clientJoinedRoom reached");
    // Client is a host
    role.joinRoom(data);
  });

  socket.on("clientDisplayStartButton", function (data) {
    console.log("clientDisplayStartButton reached");
    if (role instanceof Player && data.mySocketId == socketID)
      role.displayStartButton();
  });

  socket.on("startGame", function () {
    console.log("start game reached");
    if (role instanceof Host) role.startGame();
  });

  socket.on("displayNextRound", function (data) {
    console.log("displayNextRound reached");
    console.log(data);
    role.displayNextRound(data);
  });

  socket.on("displayNextCategory", function (data) {
    console.log("display next category reached");
    console.log(data);
    if (role instanceof Host) role.displayNextCategory(data);
  });

  socket.on("hostIncrementAnswers", function (data) {
    if (role instanceof Host) role.incrementAnswers(data);
  });

  socket.on("endRound", function (data) {
    console.log("end round reached");
    role.endRound(data);
  });

  socket.on("hostDisplayScore", function (data) {
    console.log("host displaying updated score");
    if (role instanceof Host) role.updateScore(data);
  });

  socket.on("clientDisconnected", function (player_Id) {
    if (role instanceof Host) role.removePlayer(player_Id);
  });

  socket.on("errorJoinRoom", function () {
    $("#gameArea").html($("#player-end-round-template").html());
    $("#result_text").text("Error: Unable to join room");
  });

  // Document Interaction Events

  // Welcome page events
  $(document).on("click", "#btnCreateGame", function () {
    socket.emit("hostCreateGame");
  });

  $(document).on("click", "#start_game_btn", function () {
    $("#gameArea").html($("#player-wait-template  ").html());
    socket.emit("hostRoomFull", gameID);
  });

  $(document).on("click", "#btnJoinGame", function () {
    $("#gameArea").html($("#join-game-template").html());
  });

  // player answered question and clicked an answer
  $(document).on("click", ".btn-outline-secondary", function (event) {
    $("#answer-template").html($("#player-wait-template").html());
    // $('#player-wait-template').html().insertAfter('#answer-template');
    q = event.target.id;
    console.log("target id: " + q);
    role.setAnswer(q);
  });

  // Join Game Page events
  $(document).on("click", "#btnStart", function () {
    console.log("start button clicked");
    let data = {
      gameId: $("#inputGameId").val(),
      name: $("#inputPlayerName").val() || "Anonymous",
      mySocketId: socket.id,
    };

    socket.emit("playerRequestJoin", data);

    role = new Player(data);
  });

  $("button").attr("disabled", false); // enable buttons on page load
});
