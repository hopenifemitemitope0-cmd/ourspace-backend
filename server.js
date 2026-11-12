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

// Health check for Render
app.get("/", (req, res) => {
  res.send("OUR SPACE Backend is running");
});

const users = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("register", (privateNumber) => {
    users[privateNumber] = socket.id;
    socket.privateNumber = privateNumber;
    console.log("Registered:", privateNumber);
    socket.emit("registered", { success: true, number: privateNumber });
  });

  socket.on("send_message", (data) => {
    const { to, message, from, fromName } = data;
    const targetSocketId = users[to];

    if (targetSocketId) {
      io.to(targetSocketId).emit("receive_message", {
        from,
        fromName,
        message,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      });
      socket.emit("message_sent", { success: true });
    } else {
      socket.emit("message_sent", { 
        success: false, 
        error: "User is offline" 
      });
    }
  });

  socket.on("disconnect", () => {
    if (socket.privateNumber) {
      delete users[socket.privateNumber];
      console.log("User disconnected:", socket.privateNumber);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`OUR SPACE server running on port ${PORT}`);
});
