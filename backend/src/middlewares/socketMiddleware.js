import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const socketAuthMiddleware = async (socket, next) => {
  try {
    // lấy access token
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Unauthorized - Token không tồn tại"));
    }

    // verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (!decoded) {
      return next(
        new Error("Unauthorized - Token không hợp lệ hoặc đã hết hạn"),
      );
    }

    // khi token hợp lệ, tìm user
    const user = await User.findById(decoded.userId).select("-hashedPassword");
    if (!user) {
      return next(new Error("User không tồn tại"));
    }

    // gán user lên socket để các event của socket biết user là ai
    socket.user = user;

    next();
  } catch (error) {
    console.error("Lỗi khi verify JWT trong socketMiddleware", error);
    next(new Error("Unauthorized"));
  }
};
