import type { UserState } from "@/types/store";
import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { userService } from "@/services/userService";
import { toast } from "sonner";
import { useChatStore } from "./useChatStore";

export const useUserStore = create<UserState>((set, get) => ({
  // ─── Upload avatar ─────────────────────────────────────────────────────────
  updateAvatarUrl: async (formData) => {
    try {
      const { user, setUser } = useAuthStore.getState();
      const data = await userService.uploadAvatar(formData);

      if (user) {
        setUser({
          ...user,
          avatarUrl: data.avatarUrl,
        });

        // Cập nhật lại avatar các thành viên trong conversation
        useChatStore.getState().fetchConversations();
      }
    } catch (error) {
      console.error("Lỗi khi updateAvatarUrl", error);
      toast.error("Upload avatar không thành công!");
    }
  },

  // ─── Cập nhật thông tin cá nhân ───────────────────────────────────────────
  updateProfile: async (data) => {
    try {
      const { user, setUser } = useAuthStore.getState();

      // Gọi API → backend update DB + emit socket tới contacts
      const updatedUser = await userService.updateProfile(data);

      // 1. Cập nhật user trong Zustand auth store (ảnh hưởng ProfileCard, ProfileDialog)
      setUser(updatedUser);

      // 2. Cập nhật participant của CHÍNH MÌNH trong conversation list (ảnh hưởng group chat)
      //    Contacts sẽ được cập nhật qua socket "profile-updated" (xử lý ở useSocketStore)
      if (user) {
        useChatStore.getState().updateParticipant({
          userId: updatedUser._id,
          displayName: updatedUser.displayName,
          bio: updatedUser.bio ?? null,
          phone: updatedUser.phone ?? null,
          avatarUrl: updatedUser.avatarUrl ?? null,
        });
      }

      toast.success("Cập nhật thông tin thành công! 🎉");
    } catch (error) {
      console.error("Lỗi khi updateProfile", error);
      toast.error("Cập nhật thất bại. Vui lòng thử lại!");
      // Re-throw để form biết và tắt loading state
      throw error;
    }
  },
}));
