// File: stores/action/accommodationReviewAction.js

import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import axiosClient from "../../Service/axiosClient"; // Giả định axiosClient đã được cấu hình

// ====================================================================
// 1. CREATE REVIEW (Tạo đánh giá cho bài trọ)
// ====================================================================
export const createAccommodationReview = createAsyncThunk(
  "accommodationReview/createReview",
  async (
    { accommodationPostId, userId, rating, comment, safetyScore, priceScore },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosClient.post(
        "/api/AccommodationReview", // Endpoint BE tương ứng
        {
          accommodationPostId,
          userId,
          rating,
          comment,
          safetyScore,
          priceScore
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.data.success) {
        return rejectWithValue(response.data.message || "Lỗi từ server khi tạo đánh giá");
      }

      toast.success(response.data.message || "Tạo đánh giá thành công!");
      return response.data.data;
    } catch (error) {
      console.error("Error in createAccommodationReview:", error);
      const errorMessage =
        error.response?.data?.message || "Lỗi mạng hoặc server không phản hồi";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// ====================================================================
// 2. GET REVIEWS (Lấy danh sách đánh giá cho bài trọ - GET by postId)
// ====================================================================
export const fetchAccommodationReviews = createAsyncThunk(
  "accommodationReview/fetchReviews",
  async ({ postId, lastReviewId, pageSize }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(
        `/api/AccommodationReview/${postId}`, // Endpoint BE tương ứng (GetAccommodationReviewsQuery)
        {
          params: {
            // Giả định BE hỗ trợ phân trang nếu cần, nhưng theo code BE chỉ có postId
            lastReviewId, // Nếu BE hỗ trợ cursor
            pageSize: pageSize || 10,
          },
        }
      );
      console.log("fetchAccommodationReviews response:", response.data);
      if (!response.data.success) {
        return rejectWithValue(response.data.message || "Lỗi khi lấy danh sách đánh giá");
      }
      
      return response.data.data; // Trả về { postId, nextCursor, totalCount, reviews: [] }
    } catch (error) {
      console.error("Error in fetchAccommodationReviews:", error);
      const errorMessage =
        error.response?.data?.message || "Lỗi mạng hoặc server không phản hồi";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// ====================================================================
// 3. UPDATE REVIEW (Cập nhật đánh giá - PUT)
// ====================================================================
export const updateAccommodationReview = createAsyncThunk(
  "accommodationReview/updateReview",
  async (
    { id, rating, comment },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosClient.put(
        `/api/AccommodationReview/${id}`, // Endpoint BE tương ứng với ID
        {
          reviewId: id,
          rating,
          comment
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.data.success) {
        return rejectWithValue(response.data.message || "Lỗi từ server khi cập nhật đánh giá");
      }

      toast.success(response.data.message || "Cập nhật đánh giá thành công!");
      return response.data.data;
    } catch (error) {
      console.error("Error in updateAccommodationReview:", error);
      const errorMessage =
        error.response?.data?.message || "Lỗi mạng hoặc server không phản hồi";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// ====================================================================
// 4. DELETE REVIEW (Xóa đánh giá)
// ====================================================================
export const deleteAccommodationReview = createAsyncThunk(
  "accommodationReview/deleteReview",
  async (reviewId, { rejectWithValue }) => {
    try {
      const response = await axiosClient.delete(
        `/api/AccommodationReview/${reviewId}`, // Endpoint BE tương ứng với ID
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.data.success) {
        return rejectWithValue(response.data.message || "Lỗi khi xóa đánh giá");
      }

      toast.success(response.data.message || "Xóa đánh giá thành công!");
      return reviewId; // Trả về ID để Reducer xử lý xóa khỏi state
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Lỗi mạng hoặc server không phản hồi";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);