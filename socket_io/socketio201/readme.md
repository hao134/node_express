# Note

quick note on name spaces, name spaces are just the bucket inside of the socket.io server, like the workspaces in slack or there like overall accounts that you have with your one email address

## Namespace/Group Cheatsheet

**All these are server only**

- Send an event from the server to this socket only:

```
socket.emit()
socket.send()
```

- Send an event from a socket to a room:
  NOTE: remember, this will not go to the sending socket

```
socket.to(roomName).emit()
socket.in(roomName).emit()
```

- Because each socket has it's own room, named by it's socket.id, a socket can send a messae to another socket:

```
socket.to(anotherSocketId).emit('hey');
socket.in(anotherSocketId).emit('hey');
```

- A namespace can send a message to any room:

```
io.of(aNamespace).to(roomName).emit()
io.of(aNamespace).in(roomName).emit()
```

- A namespace can send a message to the entire namespace

```
io.emit()
io.of('/').emit()
io.of('/admin').emit()
```

## Workflow:

![](https://i.imgur.com/j5smjmG.png)