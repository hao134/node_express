const express = require("express");
const app = express();
const socketio = require("socket.io");

app.use(express.static(__dirname + "/public"));

const expressServer = app.listen(9000);
const io = socketio(expressServer, {
  cors: {
    origin: "*",
  },
});
// const io = socketio(expressServer);

//io.of('/').on
io.on("connection", (socket) => {
  socket.emit("messageFromServer", { data: "Welcome to the socketio server" });
  socket.on("messageToServer", (dataFromClient) => {
    console.log(dataFromClient);
  });
  socket.on("newMessageToServer", (msg) => {
    //console.log(msg);
    io.emit("messageToClients", { text: msg.text });
    io.of("/").emit("messageToClients", { text: msg.text });
  });

  // The server can still communicate scross namespaces
  // but on the clientInformation, the socket needs be in THAT namespace
  // in order to get the events

  setTimeout(() => {
    io.of("/admin").emit(
      "welcome",
      "welcome to the admin channel, from the main channel"
    );
  }, 2000);
});

io.of("/admin").on("connection", (socket) => {
  console.log("Someone connected to the admin namespace");
  io.of("/admin").emit("welcome", "Welcome to the admin channel");
});
