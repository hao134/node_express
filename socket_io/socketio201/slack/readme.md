## Workflow:

![](https://i.imgur.com/j5smjmG.png)

## Overview

好讀版：
https://hackmd.io/N2-OumDGTVyOL0P_PofstQ

- use express only on:

```javascript=
const express = require('express')
const app = express();

app.use(express.static(__dirname + '/public'));
const expressServer = app.listen(9000)
```

->slack.js

- io.on:

```javascript=
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
```

->slack.js
在最底 socket.emit("nsList", nsData)
將資料傳到前端
因此在 scripts.js

```javascript=
socket.on("nsList", (nsData) => {
  console.log("The list of namespaces has arrived");
  //console.log(nsData);
  let namespacesDiv = document.querySelector(".namespaces");
  namespacesDiv.innerHTML = "";
  nsData.forEach((ns) => {
    namespacesDiv.innerHTML += `<div class="namespace" ns=${ns.endpoint} ><img src="${ns.img}" /></div>`;
  });

  //Add a clicklistener for each NS
  console.log(document.getElementsByClassName("namespace"));
  Array.from(document.getElementsByClassName("namespace")).forEach((elem) => {
    //console.log(elem);
    elem.addEventListener("click", (e) => {
      const nsEndpoint = elem.getAttribute("ns");
      console.log(`${nsEndpoint} I should go to now`);
      joinNs(nsEndpoint);
    });
  });
  joinNs("/wiki");
});
```

上面的作用旨在製造這樣的畫面
![](https://i.imgur.com/3MHzJWL.png)

在 joinNs.js 上面 確保 nsSocket 是新創立的

```javascript=
if (nsSocket) {
    // check to see if nsSocket is actually a socket
    nsSocket.close();
    // remove the eventListener before it's added again
    document
      .querySelector("#user-input")
      .removeEventListener("submit", formSubmission);
  }
nsSocket = io(`http://localhost:9000${endpoint}`);
```

中下的這個部分讓 input 框能新增訊息：

```javascript=
nsSocket.on("messageToClients", (msg) => {
    console.log(msg);
    const newMsg = buildHTML(msg);
    document.querySelector("#messages").innerHTML += newMsg;
  });
  document
    .querySelector(".message-form")
    .addEventListener("submit", formSubmission);
```

回到 Slack.js, 這段被 trigged 在 joinNs 裏面的

```
nsSocket = io(`http://localhost:9000${endpoint}`);
```

```javascript=
// loop through each namespace and listen for a connection
namespaces.forEach((namespace) => {
  io.of(namespace.endpoint).on("connection", (nsSocket) => {
      ...
```

繼續在 Slack 往下看：
emit nsRoomLoad

```
nsSocket.emit("nsRoomLoad", namespace.rooms);
```

在 joinNs 中，listen

```javascript=
nsSocket.on("nsRoomLoad", (nsRooms) => {
    //console.log(nsRooms);
    let roomList = document.querySelector(".room-list");
    roomList.innerHTML = "";
    nsRooms.forEach((room) => {
      let glyph;
      if (room.privateRoom) {
        glyph = "lock";
      } else {
        glyph = "globe";
      }
      roomList.innerHTML += `<li class="room"><span class="glyphicon glyphicon-${glyph}"></span>${room.roomTitle}</li>`;
    });
```

這段旨在呈現：
![](https://i.imgur.com/LaJ375n.png)
繼續在 joinNs 這段往下看

```javascript=
let roomNodes = document.getElementsByClassName("room");
Array.from(roomNodes).forEach((elem) => {
      elem.addEventListener("click", (e) => {
        //console.log("Someone clicked on ", e.target.innerText);
        joinRoom(e.target.innerText);
     });
});
    // add room automatically... first time here
const topRoom = document.querySelector(".room");
const topRoomName = topRoom.innerText;
    //console.log(topRoomName);
joinRoom(topRoomName);
```

joinRoom

```javascript=
function joinRoom(roomName) {
  // send this roomname to the server
  // socket.emit(eventName[,...args][,ack])
  nsSocket.emit("joinRoom", roomName, (newNumberOfMembers) => {
    //we want to update the room member total now that we have joined
    document.querySelector(
      ".curr-room-num-users"
    ).innerHTML = `${newNumberOfMembers} <span class="glyphicon glyphicon-user"></span>`;
  });
  nsSocket.on("historyCatchUp", (history) => {
    //console.log(history);
    const messagesUl = document.querySelector("#messages");
    messagesUl.innerHTML = "";
    history.forEach((msg) => {
      const newMsg = buildHTML(msg);
      const currentMessages = messagesUl.innerHTML;
      messagesUl.innerHTML = currentMessages + newMsg;
    });
    messagesUl.scrollTo(0, messagesUl.scrollHeight);
  });
  nsSocket.on("updateMembers", (numMembers) => {
    document.querySelector(
      ".curr-room-num-users"
    ).innerHTML = `${numMembers} <span class="glyphicon glyphicon-user"></span>`;
    document.querySelector(".curr-room-text").innerText = `${roomName}`;
    let searchBox = document.querySelector("#search-box");
    searchBox.addEventListener("input", (e) => {
      console.log(e.target.value);
      let messages = Array.from(
        document.getElementsByClassName("message-text")
      );
      console.log(messages);
      messages.forEach((msg) => {
        if (
          msg.innerText.toLowerCase().indexOf(e.target.value.toLowerCase()) ===
          -1
        ) {
          // the msg does not contain the user search term!
          msg.style.display = "none";
        } else {
          msg.style.display = "block";
        }
      });
    });
  });
}
```

回到 slack , joinRoom 中 emit

```
nsSocket.emit("joinRoom", roomName, (newNumberOfMembers) => {
```

在 slack 中 listen:

```javascript=
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

async function updateUsersInRoom(namespace, roomToJoin) {
  // Send back the number of users in this room to ALL sockets connected to this room
  let clients = await io.of(namespace.endpoint).in(roomToJoin).allSockets();
  io.of(namespace.endpoint)
    .in(roomToJoin)
    .emit("updateMembers", Array.from(clients).length);
}
```

這段旨在避免重複加入多個 room 中造成訊息重複，

```javascript=
const roomToLeave = Array.from(nsSocket.rooms)[1];
nsSocket.leave(roomToLeave);
updateUsersInRoom(namespace, roomToLeave);
nsSocket.join(roomToJoin);
```

以及更新訊息內容

```javascript=
//slack
nsSocket.emit("historyCatchUp", nsRoom.history);
updateUsersInRoom(namespace, roomToJoin);
```

```javascript=
//joinRoom
nsSocket.on("historyCatchUp", (history) => {
    //console.log(history);
    const messagesUl = document.querySelector("#messages");
    messagesUl.innerHTML = "";
    history.forEach((msg) => {
      const newMsg = buildHTML(msg);
      const currentMessages = messagesUl.innerHTML;
      messagesUl.innerHTML = currentMessages + newMsg;
    });
```
