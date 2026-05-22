import mongoose from "mongoose";

const friendRequestSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      maxlength: 300,
    },
  },
  {
    timestamps: true,
  },
);

friendRequestSchema.index({ from: 1, to: 1 }, { unique: true }); // index đảm bảo from và to là duy nhất, mongoose sẽ
// báo lỗi khi gửi trùng lời mời
// truy vấn nhanh lời mời kết bạn đã gửi và nhận
friendRequestSchema.index({ from: 1 });
friendRequestSchema.index({ to: 1 });

const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);
export default FriendRequest;
