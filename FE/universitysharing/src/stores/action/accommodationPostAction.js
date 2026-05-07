// File: stores/action/accommodationPostAction.js

import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import axiosClient from "../../Service/axiosClient"; // Giả định axiosClient đã được cấu hình

// ====================================================================
// 1. CREATE POST (Đăng bài trọ)
// ====================================================================
export const createAccommodationPost = createAsyncThunk(
  "accommodation/createPost",
  async (
    { title, content, price, area, roomType, amenities, latitude, longitude, addressString,maxPeople,currentPeople },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosClient.post(
        "/api/Accommodation", // Endpoint BE tương ứng
        {
          title,latitude, longitude,addressString,
           content, price, area, roomType, amenities, maxPeople, currentPeople
           
        },
        {
          headers: {
            "Content-Type": "application/json",
            // Giả định token được lấy từ localStorage hoặc Context/Global State khác
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.data.success) {
        return rejectWithValue(response.data.message || "Lỗi từ server khi tạo bài trọ");
      }

      //toast.success(response.data.message || "Đăng bài trọ thành công!");
      return response.data.data;
    } catch (error) {
      console.error("Error in createAccommodationPost:", error);
      const errorMessage =
        error.response?.data?.message || "Lỗi mạng hoặc server không phản hồi";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// ====================================================================
// 2. UPDATE POST (Cập nhật bài trọ - PATCH)
// ====================================================================
export const updateAccommodationPost = createAsyncThunk(
  "accommodation/updatePost",
  async (
    { id, title, content, price, area, roomType, amenities, latitude, longitude, addressString,maxPeople,currentPeople },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosClient.patch(
        `/api/Accommodation`, // Endpoint BE tương ứng với ID
        {
          id,title, content, price, area, roomType, amenities, 
          latitude, longitude, addressString ,maxPeople,currentPeople
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.data.success) {
        return rejectWithValue(response.data.message || "Lỗi từ server khi cập nhật bài trọ");
      }

      //toast.success(response.data.message || "Cập nhật bài trọ thành công!");
      return response.data.data;
    } catch (error) {
      console.error("Error in updateAccommodationPost:", error);
      const errorMessage =
        error.response?.data?.message || "Lỗi mạng hoặc server không phản hồi";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// ====================================================================
// 3. FETCH ALL POSTS (Lấy danh sách trọ mặc định - GET ALL)
// ====================================================================
export const fetchAccommodationPosts = createAsyncThunk(
  "accommodation/fetchPosts",
  async ({ lastPostId, pageSize }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(
        `/api/Accommodation`, // Endpoint BE tương ứng (GetAllAccommodationPostQuery)
        {
          params: {
            // BE sử dụng 'lastPostId' (hoặc NextCursor) và 'pageSize'
            lastPostId,
            pageSize: pageSize || 10,
          },
        }
      );
      console.log("fetchAccommodationPosts response:", response.data);
      if (!response.data.success) {
        return rejectWithValue(response.data.message || "Lỗi khi lấy danh sách bài trọ");
      }
      
      return response.data.data; // Trả về GetAllAccommodationPostDto: { Posts: [], NextCursor: Guid? }
    } catch (error) {
      console.error("Error in fetchAccommodationPosts:", error);
      const errorMessage =
        error.response?.data?.message || "Lỗi mạng hoặc server không phản hồi";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);
// ====================================================================
// 4. FETCH DETAIL POST 
// ====================================================================
export const fetchAccommodationPostDetail = createAsyncThunk(
  "accommodation/fetchAccommodationPostDetail",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(`/api/Accommodation/${id}`); // gọi đúng endpoint

      if (!response.data.success) {
        return rejectWithValue(response.data.message || "Lỗi khi lấy chi tiết bài trọ");
      }
      console.log("fetchAccommodationPostDetail response:", response.data);
      return response.data.data; // trả về DTO chi tiết bài trọ
    } catch (error) {
      console.error("Error in fetchAccommodationPostDetail:", error);
      const errorMessage = error.response?.data?.message || "Lỗi mạng hoặc server không phản hồi";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);


// ====================================================================
// 5. DELETE POST (Xóa bài trọ)
// ====================================================================
export const deleteAccommodationPost = createAsyncThunk(
  "accommodation/deletePost",
  async (postId, { rejectWithValue }) => {
    try {
      const response = await axiosClient.delete(
        `/api/Accommodation/${postId}`, // Endpoint BE tương ứng với ID
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.data.success) {
        return rejectWithValue(response.data.message || "Lỗi khi xóa bài trọ");
      }

      //toast.success(response.data.message || "Xóa bài trọ thành công!");
      return postId; // Trả về ID để Reducer xử lý xóa khỏi state
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Lỗi mạng hoặc server không phản hồi";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);
