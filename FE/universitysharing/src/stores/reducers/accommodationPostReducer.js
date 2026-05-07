// File: stores/reducers/accommodationPostReducer.js

import { createSlice } from "@reduxjs/toolkit";
import {
  createAccommodationPost,
  deleteAccommodationPost,
  fetchAccommodationPostDetail,
  fetchAccommodationPosts,
  updateAccommodationPost
} from "../action/accommodationPostAction"; // Đảm bảo đường dẫn chính xác

const accommodationPostSlice = createSlice({
  name: "accommodation",
  initialState: {
    posts: [],
    postDetail: null,
    nextCursor: null,
    totalCount: 0,
    loading: false,  // Giữ loading chung cho fetch/create/update/delete
    detailLoading: false,
    error: null,
    success: false,
  },
  reducers: {
    // Reducer để reset trạng thái thành công/lỗi
    resetAccommodationState: (state) => {
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ==================== CREATE POST ====================
      .addCase(createAccommodationPost.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createAccommodationPost.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Thêm bài đăng mới lên đầu danh sách
        state.posts.unshift(action.payload); 
        state.totalCount += 1;
      })
      .addCase(createAccommodationPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      
      // ==================== UPDATE POST ====================
      .addCase(updateAccommodationPost.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateAccommodationPost.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const updatedPost = action.payload;
        // Cập nhật trong danh sách posts
        const index = state.posts.findIndex(post => post.id === updatedPost.id);
        if (index !== -1) {
          state.posts[index] = { ...state.posts[index], ...updatedPost };
        }
        // Cập nhật postDetail nếu đang xem chi tiết bài đó
        if (state.postDetail && state.postDetail.id === updatedPost.id) {
          state.postDetail = { ...state.postDetail, ...updatedPost };
        }
      })
      .addCase(updateAccommodationPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      
      // ==================== FETCH ALL POSTS ====================
      .addCase(fetchAccommodationPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccommodationPosts.fulfilled, (state, action) => {
        state.loading = false;
        // Kiểm tra nếu là request đầu tiên (lastPostId null) thì thay thế, 
        // nếu không thì nối thêm vào
        const newPosts = action.payload.latLogAccommodations || [];
        if (!state.nextCursor && !action.meta.arg.lastPostId) {
             // Lần tải đầu tiên
            state.posts = newPosts;
        } else {
             // Lần tải tiếp theo, nối thêm (Nếu bạn dùng Cursor ID)
            state.posts = [...state.posts, ...newPosts]; 
        }

        state.nextCursor = action.payload.nextCursor;
        state.totalCount = action.payload.totalCount || state.totalCount;
      })
      .addCase(fetchAccommodationPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
            // ==================== FETCH POST DETAIL ====================
      .addCase(fetchAccommodationPostDetail.pending, (state) => {
        state.detailLoading = true;  // Sửa: dùng detailLoading thay vì loading
        state.error = null;
      })
      .addCase(fetchAccommodationPostDetail.fulfilled, (state, action) => {
        state.detailLoading = false;  // Sửa: dùng detailLoading
        state.postDetail = action.payload;
      })
      .addCase(fetchAccommodationPostDetail.rejected, (state, action) => {
        state.detailLoading = false;  // Sửa: dùng detailLoading
        state.error = action.payload;
      })

      // ==================== DELETE POST ====================
      .addCase(deleteAccommodationPost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAccommodationPost.fulfilled, (state, action) => {
        state.loading = false;
        // Xóa bài đăng khỏi state bằng ID (action.payload là postId)
        state.posts = state.posts.filter(post => post.id !== action.payload);
        state.totalCount -= 1;
      })
      .addCase(deleteAccommodationPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetAccommodationState } = accommodationPostSlice.actions;
export default accommodationPostSlice.reducer;