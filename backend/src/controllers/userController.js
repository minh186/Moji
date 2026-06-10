import { uploadImageFromBuffer } from "../middlewares/uploadMiddleware.js";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import { io } from "../socket/index.js";

// ─── Lấy thông tin người dùng hiện tại ───────────────────────────────────────
export const authMe = async (req, res) => {
  try {
    const user = req.user; //  lấy từ authMiddleware

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Lỗi khi gọi authMe", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// ─── Tìm kiếm người dùng theo username ───────────────────────────────────────
export const searchUserByUsername = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username || username.trim() === "") {
      return res
        .status(400)
        .json({ message: "Cần cung cấp username trong query." });
    }

    const user = await User.findOne({ username }).select(
      "_id displayName username avatarUrl",
    );

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Lỗi xảy ra khi searchUserByUsername", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// ─── Upload avatar ────────────────────────────────────────────────────────────
export const uploadAvatar = async (req, res) => {
  try {
    const file = req.file;
    const userId = req.user._id;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // tạo biến nhận kết quả upload từ cloudinary
    const result = await uploadImageFromBuffer(file.buffer);

    // biến nhận user sau khi update database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        avatarUrl: result.secure_url,
        avatarId: result.public_id,
      },
      {
        new: true, // trả về user đã được cập nhật
      },
    ).select("avatarUrl");

    if (!updatedUser.avatarUrl) {
      return res.status(400).json({ message: "Avatar trả về null" });
    }

    return res.status(200).json({ avatarUrl: updatedUser.avatarUrl });
  } catch (error) {
    console.error("Lỗi xảy ra khi upload avatar", error);
    return res.status(500).json({ message: "Upload failed" });
  }
};

// ─── Cập nhật thông tin cá nhân (real-time) ───────────────────────────────────
// PATCH /api/users/profile
// Fields cho phép sửa: displayName, bio, phone
// Fields không cho sửa: username, email (là định danh tài khoản)
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { displayName, bio, phone } = req.body;

    // ── Validate ──────────────────────────────────────────────────────────────
    if (!displayName || !displayName.trim()) {
      return res.status(400).json({ message: "Tên hiển thị là bắt buộc" });
    }

    if (displayName.trim().length > 50) {
      return res
        .status(400)
        .json({ message: "Tên hiển thị không được vượt quá 50 ký tự" });
    }

    if (bio && bio.length > 500) {
      return res
        .status(400)
        .json({ message: "Giới thiệu không được vượt quá 500 ký tự" });
    }

    // ── Cập nhật DB ───────────────────────────────────────────────────────────
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        displayName: displayName.trim(),
        bio: bio?.trim() || null,
        phone: phone?.trim() || null,
      },
      { new: true, select: "-hashedPassword -avatarId" },
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // ── Emit "profile-updated" tới tất cả contacts ───────────────────────────
    // Tìm tất cả conversation chứa user này → lấy unique participant IDs
    const conversations = await Conversation.find(
      { "participants.userId": userId },
      { "participants.userId": 1 },
    ).lean();

    const contactIds = new Set();
    conversations.forEach((convo) => {
      convo.participants.forEach((p) => {
        const contactId = p.userId.toString();
        if (contactId !== userId.toString()) {
          contactIds.add(contactId);
        }
      });
    });

    // Payload gửi đi: chỉ những field ảnh hưởng tới UI của người khác
    const profileUpdatePayload = {
      userId: userId.toString(),
      displayName: updatedUser.displayName,
      bio: updatedUser.bio ?? null,
      phone: updatedUser.phone ?? null,
      avatarUrl: updatedUser.avatarUrl ?? null,
    };

    // Emit tới personal room của từng contact (socket.join(user._id) trong socket/index.js)
    contactIds.forEach((contactId) => {
      io.to(contactId).emit("profile-updated", profileUpdatePayload);
    });

    return res.status(200).json({ user: updatedUser });
  } catch (error) {
    console.error("Lỗi khi updateProfile", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
