const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let rooms = {};

io.on("connection", (socket) => {

    socket.on("joinRoom", ({ roomCode, name }) => {

        if (!rooms[roomCode]) {
            rooms[roomCode] = {
                players: [],
                number: null,
                started: false,
                wins: {},
                attempts: {}
            };
        }

        const room = rooms[roomCode];

        room.players.push({
            id: socket.id,
            name: name
        });

        if (!room.wins[name]) {
            room.wins[name] = 0;
        }

        room.attempts[socket.id] = 0;

        socket.join(roomCode);

        io.to(roomCode).emit("updatePlayers", room.players);
        io.to(roomCode).emit("updateScoreboard", room.wins);
    });

    socket.on("startGame", (roomCode) => {
        const room = rooms[roomCode];
        if (!room) return;

        room.number = Math.floor(Math.random() * 100) + 1;
        room.started = true;

        io.to(roomCode).emit("gameStarted");
    });

    socket.on("guess", ({ roomCode, guess }) => {
        const room = rooms[roomCode];
        if (!room || !room.started) return;

        room.attempts[socket.id]++;

        if (guess == room.number) {

            const player = room.players.find(p => p.id === socket.id);
            room.wins[player.name]++;

            io.to(roomCode).emit("gameOver", {
                winnerId: socket.id,
                winnerAttempts: room.attempts[socket.id]
            });

            io.to(roomCode).emit("updateScoreboard", room.wins);

            room.started = false;
        }
        else if (guess < room.number) {
            socket.emit("hint", "Too Low!");
        }
        else {
            socket.emit("hint", "Too High!");
        }
    });

    socket.on("playAgain", (roomCode) => {
        const room = rooms[roomCode];
        if (!room) return;

        room.number = Math.floor(Math.random() * 100) + 1;
        room.started = true;

        room.attempts = {};

        io.to(roomCode).emit("gameStarted");
    });

});

server.listen(process.env.PORT || 3000, () => {
    console.log("Server running...");
});
