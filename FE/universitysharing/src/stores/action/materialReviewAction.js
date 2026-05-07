// File: stores/action/materialReviewAction.js

import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import axiosClient from "../../Service/axiosClient"; // Giả định axiosClient đã được cấu hình

// ====================================================================
// 1. CREATE MATERIAL REVIEW (Tạo đánh giá tài liệu - POST)
// ====================================================================
export const createMaterialReview = createAsyncThunk(
  "materialReview/create",
  async (
    { studyMaterialId, ratingLevel, comment, isHelpful },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosClient.post(
        "/api/StudyMaterialReview", // Endpoint BE tương ứng (CreateStudyMaterialReviewCommand)
        {
          MaterialId: studyMaterialId, // Sửa: MaterialId thay vì StudyMaterialId
          RatingLevel: ratingLevel,
          Comment: comment || '',
          IsHelpful: isHelpful || false,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.data.success) {
        return rejectWithValue(response.data.message || "Lỗi từ server khi tạo đánh giá");
      }

      toast.success(response.data.message || "Đánh giá tài liệu thành công!");
      return response.data.data;
    } catch (error) {
      console.error("Error in createMaterialReview:", error);
      
      // Log chi tiết lỗi từ server
      if (error.response?.data) {
        console.error("Server error details:", error.response.data);
      }
      
      const errorMessage =
        error.response?.data?.message || 
        error.response?.data?.errors?.join(', ') ||
        "Lỗi mạng hoặc server không phản hồi";
      
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// ==================== UPDATE MATERIAL REVIEW ====================
export const updateMaterialReview = createAsyncThunk(
  "materialReview/update",
  async (
    { reviewId, ratingLevel, comment, isHelpful }, // Thêm reviewId
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosClient.put(
        "/api/StudyMaterialReview", // Sửa: PUT /api/StudyMaterialReview (không có route param, body chứa ReviewId)
        {
          ReviewId: reviewId, // Sửa: Thêm ReviewId vào body
          RatingLevel: ratingLevel,
          Comment: comment || '',
          IsHelpful: isHelpful || false,
        },
        {
          headers: {
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
      console.error("Error in updateMaterialReview:", error);
      const errorMessage =
        error.response?.data?.message || "Lỗi mạng hoặc server không phản hồi";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// File: stores/action/materialReviewAction.js

// File: stores/action/materialReviewAction.js

// ====================================================================
// 3. FETCH MATERIAL REVIEWS (Lấy danh sách đánh giá cho tài liệu - GET với route param)
// ====================================================================
// File: stores/action/materialReviewAction.js
export const fetchMaterialReviews = createAsyncThunk(
  "materialReview/fetchAll",
  async ({ studyMaterialId, lastStudyMaterialRatingId, pageSize }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(
        `/api/StudyMaterialReview/${studyMaterialId}`,
        {
          params: {
            LastStudyMaterialRatingId: lastStudyMaterialRatingId,
            PageSize: pageSize || 10,
          },
        }
      );
      
      console.log("fetchMaterialReviews response:", response.data);
      
      if (!response.data.success) {
        return rejectWithValue(response.data.message || "Lỗi khi lấy danh sách đánh giá");
      }
      
      // SỬA QUAN TRỌNG: Trả về toàn bộ data object thay vì chỉ data.data
      return response.data.data; // { reviews: [], nextCursor: null }
    } catch (error) {
      console.error("Error in fetchMaterialReviews:", error);
      const errorMessage =
        error.response?.data?.message || "Lỗi mạng hoặc server không phản hồi";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// ====================================================================
// 4. FETCH MATERIAL REVIEW DETAIL (Lấy chi tiết đánh giá - GET /{id})
// ====================================================================
export const fetchMaterialReviewDetail = createAsyncThunk(
  "materialReview/fetchDetail",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(`/api/StudyMaterialReview/${id}`); // Giả định endpoint tồn tại (thêm nếu cần)

      if (!response.data.success) {
        return rejectWithValue(response.data.message || "Lỗi khi lấy chi tiết đánh giá");
      }
      console.log("fetchMaterialReviewDetail response:", response.data);
      return response.data.data; // Trả về DTO chi tiết
    } catch (error) {
      console.error("Error in fetchMaterialReviewDetail:", error);
      const errorMessage = error.response?.data?.message || "Lỗi mạng hoặc server không phản hồi";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// ====================================================================
// 5. DELETE MATERIAL REVIEW (Xóa đánh giá)
// ====================================================================
export const deleteMaterialReview = createAsyncThunk(
  "materialReview/delete",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosClient.delete(
        `/api/StudyMaterialReview/${id}`, // Endpoint BE tương ứng
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
      return id; // Trả về ID để Reducer xử lý xóa khỏi state
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Lỗi mạng hoặc server không phản hồi";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);