import { Server } from "socket.io";
import http from "http";
import express from "express";
import { socketAuthMiddleware } from "../middlewares/socketMiddleware.js";
import { getUserConversationsForSocketIO } from "../controllers/conversationController.js";

const app = express();

const server = http.createServer(app);

// tạo socket server
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

io.use(socketAuthMiddleware);

// lưu danh sách user đang online
const onlineUsers = new Map(); // {userId: socketId}

// socket lắng nghe sự kiện kết nối
io.on("connection", async (socket) => {
  const user = socket.user;

  //   console.log(`${user.displayName} online với socket ${socket.id}`);
  // thêm user vào danh sách online
  onlineUsers.set(user._id, socket.id);

  // thông báo cho client biết có người mới online
  io.emit("online-users", Array.from(onlineUsers.keys()));

  // lấy danh sách conversation id của user
  const conversationIds = await getUserConversationsForSocketIO(user._id);
  // cho user join vào từng room tương ứng
  conversationIds.forEach((id) => {
    socket.join(id);
  });

  // khi user tạo coversation mới ở frontend thì server sẽ join vào phòng này
  socket.on("join-conversation", (conversationId) => {
    socket.join(conversationId);
  });

  socket.join(user._id.toString());

  socket.on("disconnect", () => {
    // xóa user khỏi map
    onlineUsers.delete(user._id);
    // cập nhật lại danh sách online
    io.emit("online-users", Array.from(onlineUsers.keys()));
    console.log(`socket disconnected: ${socket.id}`);
  });
});

export { io, app, server };
