import { createAsyncThunk } from "@reduxjs/toolkit";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../Service/axiosClient";
export const DeeplinkCommentModal = createAsyncThunk(
  "deeplink/DeeplinkCommentModal",
  async (postId, { rejectWithValue }) => {
    const token = localStorage.getItem("token");
    try {
      const response = await axiosInstance.get(
        `/api/Post/get-by-id?id=${postId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // console.error("API trả về>>", response.data);
      return { postId, data: response.data.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Có lỗi xảy ra");
    }
  }
);
