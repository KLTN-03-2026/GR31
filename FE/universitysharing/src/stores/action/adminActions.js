import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../Service/axiosClient"; // Đường dẫn cần điều chỉnh theo cấu trúc dự án

// Lấy danh sách bài viết có báo cáo
export const fetchReportedPosts = createAsyncThunk(
  "report/fetchReportedPosts",
  async (_, { rejectWithValue }) => {
    try {
 
//       const token = localStorage.getItem("token");
//       if (!token) {
//         return rejectWithValue({ message: "Bạn chưa đăng nhập!" });
//       }
//       const response = await axios.get(
//         `${process.env.REACT_APP_BASE_URL}/api/report/posts-report`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

      const response = await axiosClient.get("/api/report/posts-report");

      return response.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

// Lấy danh sách báo cáo người dùng
export const fetchUserUserReports = createAsyncThunk(
  "report/fetchUserUserReports",
  async (_, { rejectWithValue }) => {
    try {

//       const token = localStorage.getItem("token");
//       if (!token) {
//         return rejectWithValue({ message: "Bạn chưa đăng nhập!" });
//       }
//       const response = await axios.get(
//         `${process.env.REACT_APP_BASE_URL}/api/report/user-user-report`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

      const response = await axiosClient.get("/api/report/user-user-report");

      return response.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

// Lấy danh sách người dùng
export const fetchUsers = createAsyncThunk(
  "admin/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {

//       const token = localStorage.getItem("token");
//       if (!token) {
//         return rejectWithValue({ message: "Bạn chưa đăng nhập!" });
//       }
//       const response = await axios.get(
//         `${process.env.REACT_APP_BASE_URL}/api/Admin/GetallUser`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

      const response = await axiosClient.get("/api/Admin/GetallUser");


      if (response.data.success && response.data.data) {
        return response.data.data.map((user) => ({
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          createdAt: user.createdAt,
          isVerifiedEmail: user.isVerifiedEmail,
          trustScore: user.trustScore,
          role: user.role === 0 ? "User" : "Admin",
          phone: user.phone || "N/A",
          relativePhone: user.relativePhone || "N/A",
          status: user.status,
          totalReports: user.totalReports,
          lastLoginDate: user.lastActive,
        }));
      } else {
        return rejectWithValue({
          message: "Không thể tải danh sách người dùng.",
        });
      }
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

// Lấy danh sách thông báo
export const fetchNotifications = createAsyncThunk(
  "admin/fetchNotifications",
  async (_, { rejectWithValue }) => {
    try {

//       const token = localStorage.getItem("token");
//       if (!token) {
//         return rejectWithValue({ message: "Bạn chưa đăng nhập!" });
//       }
//       const response = await axios.get(
//         `${process.env.REACT_APP_BASE_URL}/api/report/admin/ride-reports`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

      const response = await axiosClient.get("/api/report/admin/ride-reports");

      return response.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

// Action chặn người dùng
export const blockUser = createAsyncThunk(
  "admin/blockUser",
  async ({ userId, untilISO }, { rejectWithValue }) => {
    try {

//       const token = localStorage.getItem("token");
//       if (!token) {
//         return rejectWithValue({ message: "Bạn chưa đăng nhập!" });
//       }
//       const response = await axios.post(
//         `${
//           process.env.REACT_APP_BASE_URL
//         }/api/Admin/${userId}/block?blockUntil=${encodeURIComponent(untilISO)}`,
//         null,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         }

      const response = await axiosClient.post(
        `/api/Admin/${userId}/block?blockUntil=${encodeURIComponent(untilISO)}`,
        null

      );

      if (response.data.success) {
        return { userId, untilISO };
      } else {
        return rejectWithValue({
          message: response.data.message || "Không thể chặn người dùng.",
        });
      }
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

// Action tạm ngưng người dùng
export const suspendUser = createAsyncThunk(
  "admin/suspendUser",
  async ({ userId, untilISO }, { rejectWithValue }) => {
    try {

//       const token = localStorage.getItem("token");
//       if (!token) {
//         return rejectWithValue({ message: "Bạn chưa đăng nhập!" });
//       }
//       const response = await axios.post(
//         `${
//           process.env.REACT_APP_BASE_URL
//         }/api/Admin/${userId}/suspend?suspendUntil=${encodeURIComponent(

      const response = await axiosClient.post(
        `/api/Admin/${userId}/suspend?suspendUntil=${encodeURIComponent(
          untilISO
        )}`,
        null
      );

      if (response.data.success) {
        return { userId, untilISO };
      } else {
        return rejectWithValue({
          message: response.data.message || "Không thể tạm ngưng người dùng.",
        });
      }
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

// Action kích hoạt người dùng
export const activateUser = createAsyncThunk(
  "admin/activateUser",
  async (userId, { rejectWithValue }) => {
    try {

//       const token = localStorage.getItem("token");
//       if (!token) {
//         return rejectWithValue({ message: "Bạn chưa đăng nhập!" });
//       }
//       const response = await axios.post(
//         `${process.env.REACT_APP_BASE_URL}/api/Admin/${userId}/unblock`,
//         null,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         }

      const response = await axiosClient.post(
        `/api/Admin/${userId}/unblock`,
        null

      );

      if (response.data.success) {
        return userId;
      } else {
        return rejectWithValue({
          message: response.data.message || "Không thể kích hoạt người dùng.",
        });
      }
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

// Action xóa bài viết
export const deletePost = createAsyncThunk(
  "report/deletePost",
  async (postId, { rejectWithValue }) => {
    try {

//       const response = await axios.patch(
//         `${process.env.REACT_APP_BASE_URL}/api/report/delete-post-report/${postId}`,
//         null,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }

      const response = await axiosClient.patch(
        `/api/report/delete-post-report/${postId}`,
        null

      );
      return { postId, ...response.data };
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

// Action xóa tất cả báo cáo của bài viết
export const deleteAllReports = createAsyncThunk(
  "report/deleteAllReports",
  async (postId, { rejectWithValue }) => {
    try {

//       const response = await axios.delete(
//         `${process.env.REACT_APP_BASE_URL}/api/report/delete-all-report/${postId}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }

      const response = await axiosClient.delete(
        `/api/report/delete-all-report/${postId}`

      );
      return { postId, ...response.data };
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

// Action lấy danh sách bài post bởi admin
export const fetchPostsByAdmin = createAsyncThunk(
  "adminPosts/fetchPostsByAdmin",
  async ({ pageNumber, pageSize }, { rejectWithValue }) => {
    try {

//       const token = localStorage.getItem("token");
//       if (!token) {
//         return rejectWithValue({ message: "Bạn chưa đăng nhập!" });
//       }

//       const response = await axios.get(
//         `${process.env.REACT_APP_BASE_URL}/api/post/get-posts-by-admin?pageNumber=${pageNumber}&pageSize=${pageSize}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }

      const response = await axiosClient.get(
        `/api/post/get-posts-by-admin?pageNumber=${pageNumber}&pageSize=${pageSize}`

      );
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

// Action duyệt bài viết
export const approvePost = createAsyncThunk(
  "adminPosts/approvePost",
  async (postId, { rejectWithValue }) => {
    try {

//       const response = await axios.patch(
//         `${process.env.REACT_APP_BASE_URL}/api/post/approve?PostId=${postId}`,
//         null,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }

      const response = await axiosClient.patch(
        `/api/post/approve?PostId=${postId}`,
        null

      );
      return { postId, ...response.data };
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

// Xóa bài viết
export const adDeletePost = createAsyncThunk(
  "posts/deletePost",
  async (postID, { rejectWithValue }) => {
    try {

//       const token = localStorage.getItem("token");
//       if (!token) {
//         return rejectWithValue({ message: "Bạn chưa đăng nhập!" });
//       }
//       await axios.delete(
//         `${process.env.REACT_APP_BASE_URL}/api/Post/ad-delete?PostId=${postID}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

      await axiosClient.delete(`/api/Post/ad-delete?PostId=${postID}`);

      return postID;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

// Hàm xử lý lỗi chung
const handleApiError = (error, rejectWithValue) => {
  if (error.response) {
    if (error.response.status === 401) {
      return rejectWithValue({ message: "Phiên đăng nhập hết hạn" });
    }
    return rejectWithValue(
      error.response.data?.message || "Đã xảy ra lỗi khi thực hiện yêu cầu."
    );
  } else if (error.request) {
    return rejectWithValue({ message: "Không kết nối được với server" });
  }
  return rejectWithValue({ message: "Lỗi không xác định" });
};

// Lấy danh sách chuyến đi theo trạng thái (Accepted hoặc Completed)
export const fetchRidesByStatus = createAsyncThunk(
  "adminRides/fetchRidesByStatus",
  async ({ status, pageNumber, pageSize }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(
        `/api/Admin/rides-by-status?Status=${status}&page=${pageNumber}&pageSize=${pageSize}`
      );
      return response.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

// Lấy chi tiết chuyến đi theo ID
export const fetchRideDetails = createAsyncThunk(
  "adminRides/fetchRideDetails",
  async (rideId, { rejectWithValue }) => {
    try {
      console.log("Fetching ride details for ID:", rideId);
      const response = await axiosClient.get(
        `/api/Admin/ride-details/${rideId}`
      );
      console.log("API response:", response.data);
      // Kiểm tra dữ liệu trả về
      if (!response.data) {
        return rejectWithValue({ message: "Không có dữ liệu trả về từ API" });
      }
      return response.data;
    } catch (error) {
      console.error("API error:", error);
      return handleApiError(error, rejectWithValue);
    }
  }
);
