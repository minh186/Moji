import Friend from "../models/Friend.js";
import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";

export const sendFriendRequest = async (req, res) => {
  try {
    const { to, message } = req.body;

    const from = req.user._id;

    if (from === to) {
      return res
        .status(400)
        .json({ message: "Không thể gửi lời mời kết bạn cho chính mình" });
    }

    const userExists = await User.exists({ _id: to });

    if (!userExists) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // kiểm tra xem giữa 2 người có mqh nào chưa(đã là bạn bè hoặc có lời mời đang chờ)

    let userA = from.toString();
    let userB = to.toString();

    if (userA > userB) {
      [userA, userB] = [userB, userA];
    }

    // chạy 2 query cùng lúc bằng promise.all
    const [alreadyFriends, existingRequest] = await Promise.all([
      Friend.findOne({ userA, userB }),
      FriendRequest.findOne({
        $or: [
          { from, to },
          { from: to, to: from },
        ],
      }),
    ]);

    if (alreadyFriends) {
      return res.status(400).json({ message: "Hai người đã là bạn bè" });
    }

    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "Đã có lời mời kết bạn đang chờ" });
    }

    // nếu đủ điều kiện, tạo lời mời kết bạn
    const request = await FriendRequest.create({ from, to, message });

    return res
      .status(201)
      .json({ message: "Gửi lời mời kết bạn thành công", request });
  } catch (error) {
    console.error("Lỗi khi gửi yêu cầu kết bạn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    //lấy id của lời mời kết bạn từ url param mà client gửi lên
    const { requestId } = req.params;
    const userId = req.user._id;

    // tìm lời mời kết bạn xem nó có tồn tại không
    const request = await FriendRequest.findById(requestId);

    // nếu không tìm thấy request (requestId không hợp lệ hoặc đã bị xóa)
    if (!request) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lời mời kết bạn" });
    }

    // chỉ người nhận được quyền chấp nhận
    if (request.to.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền chấp nhận lời mời này" });
    }

    // tạo mqh bạn bè mới
    const friend = await Friend.create({
      userA: request.from,
      userB: request.to,
    });

    // sau khi là bạn bè, xóa lời mời cũ
    await FriendRequest.findByIdAndDelete(requestId);

    // lấy thông tin của người gửi lời mời để trả về client hiển thị trong giao diện
    const from = await User.findById(request.from)
      .select("_id displayName avatarUrl")
      .lean(); // lean để tối ưu hiệu năng query, giúp nhanh và nhẹ hơn

    return res.status(200).json({
      message: "Chấp nhận lời mời kết bạn thành công",
      newFriend: {
        _id: from?._id,
        displayName: from?.displayName,
        avatarUrl: from?.avatarUrl,
      },
    });
  } catch (error) {
    console.error("Lỗi khi chấp nhận lời mời kết bạn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const declineFriendRequest = async (req, res) => {
  try {
    // -> kiểm tra dữ liệu gửi lên có hợp lệ không rồi xóa yêu cầu kết bạn
    // lấy id của lời mời kết bạn từ url param mà client gửi lên
    const { requestId } = req.params;
    const userId = req.user._id;

    // tìm lời mời kết bạn theo id
    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lời mời kết bạn" });
    }

    if (request.to.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền từ chối lời mời này" });
    }

    // xóa lời mời
    await FriendRequest.findByIdAndDelete(requestId);

    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi từ chối lời mời kết bạn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getAllFriends = async (req, res) => {
  try {
    // lấy userId
    const userId = req.user._id;

    // gửi truy vấn tới mongoDb để lấy danh sách kết bạn
    const friendships = await Friend.find({
      $or: [
        {
          userA: userId,
        },
        {
          userB: userId,
        },
      ],
    })
      .populate("userA", "_id displayName avatarUrl username") // lấy thông tin chi tiết của user
      .populate("userB", "_id displayName avatarUrl username")
      .lean();

    if (!friendships.length) {
      return res.status(200).json({ friends: [] });
    }

    // nếu có bạn, lấy ra danh sách
    const friends = friendships.map(
      (f) => (f.userA._id.toString() === userId.toString() ? f.userB : f.userA), // kiểm tra xem user A hay B là bạn
    );

    return res.status(200).json({ friends });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bạn bè", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    // danh sách các trường cần lấy
    const populateFields = "_id username displayName avatarUrl";

    // lấy các friend request đã gửi và nhận
    const [sent, received] = await Promise.all([
      FriendRequest.find({ from: userId }).populate("to", populateFields),
      FriendRequest.find({ to: userId }).populate("from", populateFields),
    ]);

    res.status(200).json({ sent, received });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách yêu cầu kết bạn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
