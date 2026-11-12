const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store connected users: { privateNumber: socketId }
const users = {};

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // When user registers their private number
  socket.on("register", (privateNumber) => {
    users[privateNumber] = socket.id;
    socket.privateNumber = privateNumber;
    console.log(`User registered: ${privateNumber}`);
    
    // Notify the user that registration was successful
    socket.emit("registered", { success: true, number: privateNumber });
  });

  // When a message is sent
  socket.on("send_message", (data) => {
    const { to, message, from, fromName } = data;
    
    const targetSocketId = users[to];
    
    if (targetSocketId) {
      // Send to the target user
      io.to(targetSocketId).emit("receive_message", {
        from,
        fromName,
        message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      
      // Also confirm to sender
      socket.emit("message_sent", { success: true });
    } else {
      // User is offline
      socket.emit("message_sent", { 
        success: false, 
        error: "User is offline or not found" 
      });
    }
  });

  // When user disconnects
  socket.on("disconnect", () => {
    if (socket.privateNumber) {
      delete users[socket.privateNumber];
      console.log(`User disconnected: ${socket.privateNumber}`);
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`OUR SPACE server is running on port ${PORT}`);
});
