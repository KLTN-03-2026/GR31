import { createAction, createAsyncThunk } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import axiosClient from "../../Service/axiosClient";
// Tạo bài đăng
export const createPost = createAsyncThunk(
  "ride/createPost",
  async (
    { content, startLocation, endLocation, startTime, postType },
    { rejectWithValue }
  ) => {
    try {
      const startTimeUtc = new Date(startTime).toISOString();
      console.log("startTimeUtc", startTimeUtc);
      const response = await axiosClient.post(
        "/api/ridepost/create",
        {
          content,
          startLocation,
          endLocation,
          startTime: startTimeUtc,
          postType,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Add token if required
          },
        }
      );

      if (!response.data.success) {
        return rejectWithValue(response.data.message || "Lỗi từ server");
      }

      toast.success(response.data.message || "Tạo bài đăng thành công!");
      console.log("response.data", response.data);
      return response.data.data;
    } catch (error) {
      console.error("Error in createPost:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.data?.message ||
        error.message ||
        "Có lỗi xảy ra khi tạo bài đăng";
      return rejectWithValue(errorMessage);
    }
  }
);

// Xóa bài viết
export const deleteRidePost = createAsyncThunk(
  "ride/deleteRidePost",
  async (postID, { rejectWithValue }) => {
    try {
      const response = await axiosClient.delete(
        `/api/ridepost/delete?PostId=${postID}`
      );
      return postID;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Sửa bài đăng
export const updatePost = createAsyncThunk(
  "ride/updatePost",
  async (postData, { rejectWithValue }) => {
    try {
      if (!postData.id) throw new Error("Post ID is required");

      const payload = {
        Id: postData.id,
        Content: postData.content || null,
        StartLocation: postData.startLocation || null,
        EndLocation: postData.endLocation || null,
        StartTime: postData.startTime || null,
      };

      console.log("Sending updatePost payload:", payload);
      const response = await axiosClient.put("/api/RidePost/update", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("updatePost response:", response.data);

      // Check for "No changes needed" and treat it as a success
      if (
        response.data.message &&
        response.data.message.includes("No changes needed")
      ) {
        return {
          ...response.data.data,
          message: "No changes needed",
        };
      }

      if (!response.data.success) {
        throw new Error(response.data.message || "Update failed");
      }

      return response.data.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.title ||
        error.response?.data?.message ||
        error.message ||
        "Lỗi khi cập nhật bài đăng";
      console.error("updatePost error:", errorMessage, error.response?.data);
      return rejectWithValue(errorMessage);
    }
  }
);

// Fetch danh sách bài đăng
export const fetchRidePost = createAsyncThunk(
  "ride/fetchRidePost",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get("/api/RidePost/get-all");
      return response.data?.data?.responseRidePostDto || [];
    } catch (error) {
      return rejectWithValue(error.response?.data.data || "Lỗi không xác định");
    }
  }
);

// Tạo ride
export const createRide = createAsyncThunk(
  "ride/createRide",
  async (rideData, { rejectWithValue, dispatch }) => {
    try {
      console.log("rideData", rideData);
      const response = await axiosClient.post("/api/ride/create", rideData);

      if (response.data.success) {
        toast.success(response.data.message || "Tạo chuyến đi thành công!");

        // ✅ Dùng dispatch được lấy đúng cách ở đây
        dispatch(setCurrentUserLocation(rideData));
      } else {
        toast.error(response.data.message || "Có lỗi xảy ra");
      }

      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data.message || "Lỗi không xác định"
      );
    }
  }
);


// Fetch rides theo userId từ API mới
export const fetchRidesByUserId = createAsyncThunk(
  "ride/fetchRidesByUserId",
  async ({ nextCursor, pageSize } = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const decodedToken = jwtDecode(token);
      const userId =
        decodedToken[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ];

      const response = await axiosClient.get(`/api/ridepost/user/${userId}`, {
        params: {
          nextCursor: nextCursor || undefined,
          pageSize: pageSize || 10,
        },
      });
      console.log("Current Ride:", response);
      return {
        driverRides: response.data.data.driverRideList,
        passengerRides: response.data.data.passengerRideList,
        driverNextCursor: response.data.data.driverNextCursor,
        passengerNextCursor: response.data.data.passengerNextCursor,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Lỗi không xác định");
    }
  }
);

// Hủy chuyến đi
export const cancelRide = createAsyncThunk(
  "ride/cancelRide",
  async (rideId, { rejectWithValue }) => {
    try {
      const response = await axiosClient.patch(
        `/api/Ride/cancel-ride?RideId=${rideId}`,
        null
      );
      if (response.data.success) {
        toast.success(response.data.message || "Hủy chuyến đi thành công!");
        return rideId;
      } else {
        throw new Error(response.data.message || "Hủy chuyến đi thất bại");
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi khi hủy chuyến đi"
      );
    }
  }
);

// Đánh giá tài xế
export const rateDriver = createAsyncThunk(
  "rides/rateDriver",
  async ({ rideId, driverId, rating, comment }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post("/api/ride/rate-driver", {
        rideId,
        driverId,
        rating,
        comment,
      });
      return { rideId, driverId, rating, comment };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchCompletedRidesWithRating = createAsyncThunk(
  "ride/fetchCompletedRidesWithRating",
  async (userId, { rejectWithValue }) => {
    try {
      if (!userId) throw new Error("User ID is required");

      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const response = await axiosClient.get("/api/Ride/get-ride-rating", {
        params: { UserId: userId }, // Query parameter
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch rated rides");
      }

      return response.data.data || [];
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Lỗi khi lấy danh sách chuyến đi có đánh giá";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// Fetch danh sách bài đăng
export const fetchLocation = createAsyncThunk(
  "ride/fetchLocation",
  async (rideId, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(
        `/api/UpdateLocation/get-all-by-ride-id?rideId=${rideId}`
      );
      return response.data?.data || []; // Trả về danh sách UpdateLocationDto
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.data || "Lỗi không xác định"
      );
    }
  }
);
export const setCurrentUserLocation = createAction('location/setCurrentUserLocation');

export const sendLocationToServer = createAsyncThunk(
  'location/sendLocationToServer',
  async (locationData, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.accessToken; // Giả sử bạn có accessToken trong auth reducer
      if (!token) {
        throw new Error("No access token found");
      }
      // Ví dụ gọi API để cập nhật vị trí người dùng trên server
      const response = await axiosClient.post('/api/user/location', locationData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data; // Server có thể trả về gì đó, hoặc chỉ status success
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);