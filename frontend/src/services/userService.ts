import api from "@/lib/axios";
import type { User } from "@/types/user";
import type { UpdateProfileData } from "@/types/store";

export const userService = {
  // Upload avatar lên Cloudinary
  uploadAvatar: async (formData: FormData) => {
    const res = await api.post("/users/uploadAvatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.status === 400) {
      throw new Error(res.data.message);
    }

    return res.data;
  },

  // Cập nhật thông tin cá nhân (displayName, bio, phone)
  // username và email không cho phép sửa (định danh tài khoản)
  updateProfile: async (data: UpdateProfileData): Promise<User> => {
    const res = await api.patch("/users/profile", data);
    return res.data.user as User;
  },
};
