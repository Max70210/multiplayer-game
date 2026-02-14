const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let rooms = {};

io.on("connection", (socket) => {

    console.log("User connected:", socket.id);

    socket.on("joinRoom", ({ roomCode, name }) => {

        socket.join(roomCode);

        if (!rooms[roomCode]) {
            rooms[roomCode] = {
                players: {},
                secretNumber: null,
                gameActive: false
            };
        }

        rooms[roomCode].players[socket.id] = {
            name,
            score: 0,
            attempts: 0
        };

        io.to(roomCode).emit("updatePlayers", rooms[roomCode].players);
    });

});
    
server.listen(process.env.PORT || 3000, () => {
    console.log("Server running...");
});
