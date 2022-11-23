const express = require("express");
const app = express();
const socketio = require("socket.io");

let namespaces = require("./data/namespaces");

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
  //console.log(socket.handshake);
  // build an array to send back with the img and endpoint for each NS
  let nsData = namespaces.map((ns) => {
    return {
      img: ns.img,
      endpoint: ns.endpoint,
    };
  });
  //console.log(nsData);

  // send the nsData back to the client. We need to use socket, NOT io, because we want it to
  // go to just this client
  socket.emit("nsList", nsData);
});

// loop through each namespace and listen for a connection
namespaces.forEach((namespace) => {
  io.of(namespace.endpoint).on("connection", (nsSocket) => {
    console.log(nsSocket.handshake);
    const username = nsSocket.handshake.query.username;
    // console.log(`${nsSocket.id} has join ${namespace.endpoint}`);
    // a socket has connected to one of our chatgroup namespaces.
    // send that ns group into back
    nsSocket.emit("nsRoomLoad", namespace.rooms);
    nsSocket.on("joinRoom", (roomToJoin, numberOfUsersCallback) => {
      // deal with history.. once we have it
      // console.log(
      //   Array.from(nsSocket.rooms)[Array.from(nsSocket.rooms).length - 1]
      // );
      const roomToLeave = Array.from(nsSocket.rooms)[1];
      nsSocket.leave(roomToLeave);
      updateUsersInRoom(namespace, roomToLeave);
      nsSocket.join(roomToJoin);
      //const clients = await io.of("/wiki").in(roomToJoin).allSockets();
      //console.log(Array.from(clients).length);
      //numberOfUsersCallback(Array.from(clients).length);
      const nsRoom = namespace.rooms.find((room) => {
        return room.roomTitle === roomToJoin;
      });
      nsSocket.emit("historyCatchUp", nsRoom.history);
      updateUsersInRoom(namespace, roomToJoin);
    });

    nsSocket.on("newMessageToServer", (msg) => {
      const fullMsg = {
        text: msg.text,
        time: Date.now(),
        username: username,
        avatar: "https://via.placeholder.com/30",
      };

      //console.log(fullMsg);
      // Send this message to All the sockets that are in the room that THIS socket is in.
      // how can we find out what rooms THIS socket is in?
      //console.log(nsSocket.rooms);
      // the user will be in the 2nd room in the object list
      // this is because tthe socket ALWAYS joins its own room on connection
      // get the keys
      const roomTitle = Array.from(nsSocket.rooms)[1];
      // we need to find the Room object for this room
      const nsRoom = namespace.rooms.find((room) => {
        return room.roomTitle === roomTitle;
      });
      // console.log(
      //   "The room object that we made that matches this NS room is..."
      // );
      // console.log(nsRoom);
      nsRoom.addMessage(fullMsg);
      io.of(namespace.endpoint).to(roomTitle).emit("messageToClients", fullMsg);
    });
  });
});

async function updateUsersInRoom(namespace, roomToJoin) {
  // Send back the number of users in this room to ALL sockets connected to this room
  let clients = await io.of(namespace.endpoint).in(roomToJoin).allSockets();
  io.of(namespace.endpoint)
    .in(roomToJoin)
    .emit("updateMembers", Array.from(clients).length);
}
