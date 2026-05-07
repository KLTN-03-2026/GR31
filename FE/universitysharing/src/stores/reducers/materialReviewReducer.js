// File: stores/reducers/materialReviewReducer.js

import { createSlice } from "@reduxjs/toolkit";
import {
    createMaterialReview,
    deleteMaterialReview,
    fetchMaterialReviewDetail,
    fetchMaterialReviews,
    updateMaterialReview
} from "../action/materialReviewAction.js";

const materialReviewSlice = createSlice({
  name: "materialReview",
  initialState: {
    reviews: [], // Danh sách đánh giá
    reviewDetail: null, // Chi tiết đánh giá
    nextCursor: null,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    resetMaterialReviewState: (state) => {
      state.success = false;
      state.error = null;
    },
    clearReviews: (state) => {
      state.reviews = [];
      state.nextCursor = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // ==================== CREATE REVIEW ====================
      .addCase(createMaterialReview.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createMaterialReview.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Thêm đánh giá mới lên đầu danh sách
        if (action.payload) {
          state.reviews.unshift(action.payload); 
        }
      })
      .addCase(createMaterialReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      
      // ==================== UPDATE REVIEW ====================
      .addCase(updateMaterialReview.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateMaterialReview.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const updatedReview = action.payload;
        if (updatedReview) {
          // Cập nhật trong danh sách reviews
          const index = state.reviews.findIndex(review => review.id === updatedReview.id);
          if (index !== -1) {
            state.reviews[index] = { ...state.reviews[index], ...updatedReview };
          }
          // Cập nhật reviewDetail nếu đang xem chi tiết
          if (state.reviewDetail && state.reviewDetail.id === updatedReview.id) {
            state.reviewDetail = { ...state.reviewDetail, ...updatedReview };
          }
        }
      })
      .addCase(updateMaterialReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      
      // ==================== FETCH ALL REVIEWS ====================
      .addCase(fetchMaterialReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // File: stores/reducers/materialReviewReducer.js
.addCase(fetchMaterialReviews.fulfilled, (state, action) => {
  console.log("=== FULFILLED CALLED ===", action.payload);
  
  state.loading = false;
  state.error = null;
  
  const responseData = action.payload;
  console.log("Reducer received data:", responseData);
  
  // SỬA: Kiểm tra responseData trực tiếp thay vì responseData.reviews
  if (responseData && Array.isArray(responseData.reviews)) {
    const newReviews = responseData.reviews;
    console.log("New reviews length:", newReviews.length);
    
    // Kiểm tra nếu là request đầu tiên (lastId null) thì thay thế, nếu không thì nối thêm
    if (!action.meta.arg?.lastStudyMaterialRatingId) {
      console.log("First load: Replacing reviews");
      state.reviews = newReviews;
    } else {
      console.log("Load more: Appending reviews");
      // Lần tải tiếp theo, nối thêm (loại bỏ trùng lặp)
      const existingIds = new Set(state.reviews.map(r => r.id));
      const uniqueNewReviews = newReviews.filter(r => !existingIds.has(r.id));
      state.reviews = [...state.reviews, ...uniqueNewReviews];
    }

    state.nextCursor = responseData.nextCursor || null;
    
    console.log("Final state reviews length:", state.reviews.length);
    console.log("Final state nextCursor:", state.nextCursor);
  } else {
    console.log("WARNING: responseData is empty or missing reviews!");
    console.log("Response data structure:", responseData);
    state.reviews = [];
    state.nextCursor = null;
  }
})
      
      // ==================== FETCH REVIEW DETAIL ====================
      .addCase(fetchMaterialReviewDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMaterialReviewDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.reviewDetail = action.payload;
      })
      .addCase(fetchMaterialReviewDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ==================== DELETE REVIEW ====================
      .addCase(deleteMaterialReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMaterialReview.fulfilled, (state, action) => {
        state.loading = false;
        // Xóa đánh giá khỏi state bằng ID
        state.reviews = state.reviews.filter(review => review.id !== action.payload);
      })
      .addCase(deleteMaterialReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetMaterialReviewState, clearReviews } = materialReviewSlice.actions;
export default materialReviewSlice.reducer;