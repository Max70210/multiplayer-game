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
                players: {},
                host: socket.id,
                secretNumber: null,
                gameActive: false
            };
        }

        rooms[roomCode].players[socket.id] = {
            name,
            attempts: 0
        };

        io.to(roomCode).emit("updatePlayers", {
            players: rooms[roomCode].players,
            host: rooms[roomCode].host
        });
    });

    socket.on("startGame", (roomCode) => {

        if (!rooms[roomCode]) return;

        if (socket.id === rooms[roomCode].host) {

            rooms[roomCode].secretNumber = Math.floor(Math.random() * 100) + 1;
            rooms[roomCode].gameActive = true;

            for (let id in rooms[roomCode].players) {
                rooms[roomCode].players[id].attempts = 0;
            }

            io.to(roomCode).emit("gameStarted");
        }
    });

});

server.listen(process.env.PORT || 3000, () => {
    console.log("Server running...");
});
