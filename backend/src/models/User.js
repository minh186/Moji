import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    hashedPassword: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    avatarUrl: {
      type: String, // link CDN để hiển thị hình
    },
    avatarId: {
      type: String, // lưu Cloudinary public_id, dùng để xóa hình trên cloudinary
    },
    bio: {
      type: String,
      maxLength: 500,
    },
    phone: {
      type: String,
      sparse: null, // cho phép null, nhưng khi có giá trị thì không được trùng
    },
  },
  {
    timestamps: true, // mongo tự động thêm 2 trường createdAt, updatedAt
  },
);

const User = mongoose.model("User", userSchema);
export default User;
