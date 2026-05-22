import { useAuthStore } from "@/stores/useAuthStore";
import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";

const ProtectedRoute = () => {
  const { accessToken, user, loading, refresh, fetchMe } = useAuthStore();
  const [starting, setStarting] = useState(true);

  const init = async () => {
    // có thể xảy ra khi refresh trang
    if (!accessToken) {
      await refresh();
    }

    if (accessToken && !user) {
      await fetchMe();
    }

    setStarting(false);
  };

  useEffect(() => {
    init();
  }, []);

  if (starting || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Đang tải trang...
      </div>
    );
  }

  if (!accessToken) {
    return (
      <Navigate
        to="signIn"
        replace // khi chuyển trang, thay thế route hiện tại trong lịch sử trình duyệt, ng dùng ko thể ấn nút quay lại để quay lại trang trước vì trang đó bị chặn
      />
    );
  }

  return (
    <Outlet></Outlet> // component hiển thị route con trong route cha
  );
};

export default ProtectedRoute;
