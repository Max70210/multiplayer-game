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

        socket.join(roomCode);

        if (!rooms[roomCode]) {
            rooms[roomCode] = {
                players: [],
                host: socket.id,
                number: null,
                attempts: {},
                gameStarted: false
            };
        }

        rooms[roomCode].players.push({
            id: socket.id,
            name: name
        });

        io.to(roomCode).emit("updatePlayers", rooms[roomCode].players);
    });

    socket.on("startGame", (roomCode) => {

        const room = rooms[roomCode];
        if (!room) return;

        room.number = Math.floor(Math.random() * 100) + 1;
        room.gameStarted = true;
        room.attempts = {};

        io.to(roomCode).emit("gameStarted");
    });

    socket.on("guess", ({ roomCode, guess }) => {

        const room = rooms[roomCode];
        if (!room || !room.gameStarted) return;

        if (!room.attempts[socket.id]) {
            room.attempts[socket.id] = 0;
        }

        room.attempts[socket.id]++;

        if (guess == room.number) {

            const winnerAttempts = room.attempts[socket.id];

            io.to(roomCode).emit("gameOver", {
                winnerId: socket.id,
                winnerAttempts
            });

            room.gameStarted = false;

        } else if (guess < room.number) {
            socket.emit("hint", "Too Low!");
        } else {
            socket.emit("hint", "Too High!");
        }
    });

    socket.on("disconnect", () => {
        for (let roomCode in rooms) {
            rooms[roomCode].players =
                rooms[roomCode].players.filter(p => p.id !== socket.id);

            io.to(roomCode).emit("updatePlayers", rooms[roomCode].players);
        }
    });
});

server.listen(process.env.PORT || 3000, () => {
    console.log("Server running...");
});
