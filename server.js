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
            rooms[roomCode] = [];
        }

        rooms[roomCode].push({
            id: socket.id,
            name: name
        });

        io.to(roomCode).emit("updatePlayers", rooms[roomCode]);
    });

    socket.on("startGame", (roomCode) => {

        const number = Math.floor(Math.random() * 100) + 1;
        rooms[roomCode].number = number;
        rooms[roomCode].attempts = 0;

        io.to(roomCode).emit("gameStarted");
    });

    socket.on("guess", ({ roomCode, guess }) => {

        const room = rooms[roomCode];
        if (!room) return;

        room.attempts++;

        if (guess == room.number) {
            io.to(roomCode).emit("gameOver", socket.id, room.attempts);
        } else if (guess < room.number) {
            io.to(socket.id).emit("hint", "Too low!");
        } else {
            io.to(socket.id).emit("hint", "Too high!");
        }
    });

    socket.on("disconnect", () => {

        for (let roomCode in rooms) {
            rooms[roomCode] = rooms[roomCode].filter(p => p.id !== socket.id);

            if (rooms[roomCode].length === 0) {
                delete rooms[roomCode];
            } else {
                io.to(roomCode).emit("updatePlayers", rooms[roomCode]);
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running..."));
