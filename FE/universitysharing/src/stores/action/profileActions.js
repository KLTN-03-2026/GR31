import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../Service/axiosClient";
// const token = localStorage.getItem("token");
export const userProfile = createAsyncThunk(
  "profile/userProfile",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axiosInstance.get("/api/UserProfile/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Có lỗi xảy ra!");
    }
  }
);

export const userProfileDetail = createAsyncThunk(
  "profile/userProfileDetail",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axiosInstance.get(
        "/api/UserProfile/profile-detail",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Có lỗi xảy ra!");
    }
  }
);

export const getPostOwner = createAsyncThunk(
  "profile/getPostOwner",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axiosInstance.get("/api/Post/GetPostsByOwner", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data.posts;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Có lỗi xảy ra!");
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  "profile/updateUserProfile",
  async (formData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axiosInstance.put(
        "/api/UserProfile/upProfile",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      // Trả về lỗi từ server nếu có
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchOtherUserProfile = createAsyncThunk(
  "profile/fetchOtherUserProfile",
  async (userId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axiosInstance.get(
        `/api/UserProfile/user-profile?userid=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Có lỗi xảy ra!");
    }
  }
);

export const fetchPostImagesPreview = createAsyncThunk(
  "profile/fetchPostImagesPreview",
  async (userId, { rejectWithValue }) => {
    try {
      if (!userId || userId === "undefined") {
        throw new Error("Invalid userId");
      }
      const token = localStorage.getItem("token");
      console.log("Fetching images for UserId:", userId);
      console.log("Token:", token);
      const response = await axiosInstance.get(
        `/api/UserProfile/post-images-preview?UserId=${userId}`, // Sửa endpoint
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("API Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error:", error.response?.data, error.response?.status);
      return rejectWithValue(
        error.response?.data?.message || error.message || "Có lỗi xảy ra!"
      );
    }
  }
);

export const fetchAllPostImages = createAsyncThunk(
  "profile/fetchAllPostImages",
  async (userId, { rejectWithValue }) => {
    try {
      if (!userId || userId === "undefined") {
        throw new Error("Invalid userId");
      }
      const token = localStorage.getItem("token");
      console.log("Fetching images for UserId:", userId);
      console.log("Token:", token);
      const response = await axiosInstance.get(
        `/api/UserProfile/post-images-all?UserId=${userId}`, // Sửa endpoint
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("API Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error:", error.response?.data, error.response?.status);
      return rejectWithValue(
        error.response?.data?.message || error.message || "Có lỗi xảy ra!"
      );
    }
  }
);
export const updateUserInformation = createAsyncThunk(
  "profile/updateUserInformation",
  async (data, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axiosInstance.put(
        "/api/UserProfile/upInformation",
        {
          PhoneNumber: data.Phone,
          PhoneRelativeNumber: data.PhoneRelative,
          Gender: data.Gender,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
export const fetchTrustScoreHistories = createAsyncThunk(
  "profile/fetchTrustScoreHistories",
  async (cursor = null, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axiosInstance.get(
        "/api/UserProfile/trust-score-histories",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            cursor: cursor || undefined,
          },
        }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Có lỗi xảy ra khi lấy lịch sử điểm uy tín!"
      );
    }
  }
);

export const fetchUserInformationDetail = createAsyncThunk(
  "profile/fetchUserInformationDetail",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return rejectWithValue("Không tìm thấy token xác thực!");
      }

      const response = await axiosInstance.get(
        "/api/UserProfile/user-information-detail",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.data.success) {
        return rejectWithValue(response.data.message || "Lỗi từ server");
      }

      return response.data.data;
    } catch (error) {
      console.error("Error in fetchUserInformationDetail:", error.response);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Có lỗi xảy ra khi lấy thông tin chi tiết tài khoản!";
      return rejectWithValue(errorMessage);
    }
  }
);
