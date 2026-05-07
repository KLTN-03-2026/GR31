import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  onlineStatus: {}, // { [userId]: boolean }
  loading: false,
  error: null,
};

const onlineUsersSlice = createSlice({
  name: "onlineUsers",
  initialState,
  reducers: {
    // Reducer này dùng để khởi tạo trạng thái online ban đầu
    // Payload action.payload sẽ là một MẢNG các userId đang online
    setInitialOnlineUsers(state, action) {
  state.onlineStatus = {};
  state.loading = false;
  state.error = null;

  const payload = action.payload;
  if (Array.isArray(payload)) {
    // Nếu payload là mảng (từ InitialOnlineFriends)
    payload.forEach(userId => {
      state.onlineStatus[userId] = true;
    });
  } else if (typeof payload === "object" && payload !== null) {
    // Nếu payload là object (từ code gốc trong SignalRProvider)
    state.onlineStatus = { ...payload };
  } else {
    state.error = "Dữ liệu initialOnlineUsers không hợp lệ";
  }
},
    // Reducer này dùng để cập nhật trạng thái online của một user cụ thể
    // Payload action.payload là userId của user vừa online
    setUserOnline(state, action) {
      state.onlineStatus[action.payload] = true;
    },
    // Reducer này dùng để cập nhật trạng thái offline của một user cụ thể
    // Payload action.payload là userId của user vừa offline
    setUserOffline(state, action) {
      state.onlineStatus[action.payload] = false;
    },
    setLoading(state) {
      state.loading = true;
    },
    setError(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    resetOnlineStatus(state) {
      state.onlineStatus = {};
      state.loading = false;
      state.error = null;
    },
  },
}); 

// Xuất các actions đã được sửa đổi
export const {
  setInitialOnlineUsers, // Đổi tên từ setOnlineStatus
  setUserOnline,
  setUserOffline,
  setLoading,
  setError,
  resetOnlineStatus,
} = onlineUsersSlice.actions;

export default onlineUsersSlice.reducer;