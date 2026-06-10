import type { Socket } from "socket.io-client";
import type { Conversation, Message } from "./chat";
import type { Friend, FriendRequest, User } from "./user";

// ─── Data shapes cho profile update ──────────────────────────────────────────

// Payload gửi lên server (chỉ các field được phép sửa)
export interface UpdateProfileData {
  displayName: string;
  bio?: string;
  phone?: string;
}

// Payload nhận từ socket "profile-updated" (broadcast tới contacts)
export interface ProfileUpdatePayload {
  userId: string;
  displayName: string;
  bio?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;

  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  clearState: () => void;

  signUp: (
    username: string,
    password: string,
    email: string,
    firstName: string,
    lastName: string,
  ) => Promise<void>;

  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchMe: () => Promise<void>;
  refresh: () => Promise<void>;
}

// ─── Theme ───────────────────────────────────────────────────────────────────
export interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (dark: boolean) => void;
}

// ─── Chat ────────────────────────────────────────────────────────────────────
export interface ChatState {
  conversations: Conversation[];
  messages: Record<
    string,
    {
      items: Message[];
      hasMore: boolean; // infinite-scroll
      nextCursor?: string | null; // phân trang
    }
  >;
  activeConversationId: string | null; // lưu id của cuộc trò chuyện đang mở
  convoLoading: boolean; // theo dõi trạng thái request
  messageLoading: boolean;
  loading: boolean;
  reset: () => void;

  setActiveConversation: (id: string | null) => void;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId?: string) => Promise<void>;
  sendDirectMessage: (
    recipientId: string,
    content: string,
    imgUrl?: string,
  ) => Promise<void>;
  sendGroupMessage: (
    conversationId: string,
    content: string,
    imgUrl?: string,
  ) => Promise<void>;

  // add message
  addMessage: (message: Message) => Promise<void>;
  // update convo
  updateConversation: (conversation: unknown) => void;

  markAsSeen: () => Promise<void>;
  addConvo: (convo: Conversation) => void;
  createConversation: (
    type: "group" | "direct",
    name: string,
    memberIds: string[],
  ) => Promise<void>;
  // Cập nhật thông tin participant sau khi nhận socket "profile-updated"
  updateParticipant: (data: ProfileUpdatePayload) => void;
}

// ─── Socket ──────────────────────────────────────────────────────────────────
export interface SocketState {
  socket: Socket | null;
  onlineUsers: string[];
  connectSocket: () => void;
  disconnectSocket: () => void;
}

// ─── Friend ──────────────────────────────────────────────────────────────────
export interface FriendState {
  friends: Friend[];
  loading: boolean;
  receivedList: FriendRequest[];
  sentList: FriendRequest[];
  searchByUsername: (username: string) => Promise<User | null>;
  addFriend: (to: string, message?: string) => Promise<string>;
  getAllFriendRequests: () => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  getFriends: () => Promise<void>;
}

// ─── User ────────────────────────────────────────────────────────────────────
export interface UserState {
  updateAvatarUrl: (formData: FormData) => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
}
