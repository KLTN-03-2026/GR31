// File: stores/reducers/accommodationReviewReducer.js

import { createSlice } from "@reduxjs/toolkit";
import {
  createAccommodationReview,
  deleteAccommodationReview,
  fetchAccommodationReviews,
  updateAccommodationReview
} from "../action/accommodationReviewAction"; // Đảm bảo đường dẫn chính xác

const accommodationReviewSlice = createSlice({
  name: "accommodationReview",
  initialState: {
    reviews: [],
    nextCursor: null,
    totalCount: 0,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    // Reducer để reset trạng thái thành công/lỗi
    resetAccommodationReviewState: (state) => {
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ==================== CREATE REVIEW ====================
      .addCase(createAccommodationReview.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createAccommodationReview.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Thêm đánh giá mới lên đầu danh sách
        state.reviews.unshift(action.payload); 
        state.totalCount += 1;
      })
      .addCase(createAccommodationReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      
      // ==================== FETCH REVIEWS ====================
      .addCase(fetchAccommodationReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccommodationReviews.fulfilled, (state, action) => {
        state.loading = false;
        // Kiểm tra nếu là request đầu tiên (lastReviewId null) thì thay thế, 
        // nếu không thì nối thêm vào
        const newReviews = action.payload.reviews || [];
        if (!state.nextCursor && !action.meta.arg.lastReviewId) {
             // Lần tải đầu tiên
            state.reviews = newReviews;
        } else {
             // Lần tải tiếp theo, nối thêm (Nếu bạn dùng Cursor ID)
            state.reviews = [...state.reviews, ...newReviews]; 
        }

        state.nextCursor = action.payload.nextCursor;
        state.totalCount = action.payload.totalCount || state.totalCount;
      })
      .addCase(fetchAccommodationReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ==================== UPDATE REVIEW ====================
      .addCase(updateAccommodationReview.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateAccommodationReview.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const updatedReview = action.payload;
        // Cập nhật trong danh sách reviews
        const index = state.reviews.findIndex(review => review.id === updatedReview.id);
        if (index !== -1) {
          state.reviews[index] = { ...state.reviews[index], ...updatedReview };
        }
      })
      .addCase(updateAccommodationReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })

      // ==================== DELETE REVIEW ====================
      .addCase(deleteAccommodationReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAccommodationReview.fulfilled, (state, action) => {
        state.loading = false;
        // Xóa đánh giá khỏi state bằng ID (action.payload là reviewId)
        state.reviews = state.reviews.filter(review => review.id !== action.payload);
        state.totalCount -= 1;
      })
      .addCase(deleteAccommodationReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetAccommodationReviewState } = accommodationReviewSlice.actions;
export default accommodationReviewSlice.reducer;