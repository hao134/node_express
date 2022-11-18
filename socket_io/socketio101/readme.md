# Note

1. Socket emit is going to send this event to the socket; Socket on is going to listen for this event from socket

- **io.on**: means listen for an event on the namespace from ANY socket. So in the chat app, if any socket joins the server, run a callback. Generally, we use it for the connect event.
- **socket.on**: means listen for an event from a particular (ONE) socket. The occasion we use that in the Slack app is when we get a message from a socket. We need to know which one sent it so we can add the correct Avatar, user, etc. This is the one you will use most of the time.

## flow

1.  在 chat.html

```
document
    .querySelector("#message-form")
    .addEventListener("submit", (event) => {
      event.preventDefault();
      const newMessage = document.querySelector("#user-message").value;
      socket.emit("newMessageToServer", { text: newMessage });
    });
```

在 form 中繳出的 message 透過 socket emit 傳送到後端

2. 在 chat.js

```
socket.on("newMessageToServer", (msg) => {
    //console.log(msg);
    io.emit("messageToClients", { text: msg.text });
  });
```

在後端收到前端收到的 message 後(newMessageToServer),廣播到所有 socket(io.emit)

3. 在 chat.html

```
socket.on("messageToClients", (msg) => {
    console.log(msg);
    document.querySelector("#messages").innerHTML += `<li>${msg.text}</li>`;
  });
```

收到訊息(messageToClients)後，在 html 的特定區塊(id = messages)中條列出訊息
