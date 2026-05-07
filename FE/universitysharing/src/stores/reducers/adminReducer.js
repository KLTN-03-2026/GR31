import { createSlice } from "@reduxjs/toolkit";
import {
  activateUser,
  adDeletePost,
  approvePost,
  blockUser,
  deleteAllReports,
  deletePost,
  fetchNotifications,
  fetchPostsByAdmin,
  fetchReportedPosts,
  fetchRideDetails,
  fetchRidesByStatus,
  fetchUserUserReports,
  fetchUsers,
  suspendUser,
} from "../action/adminActions";

const reporAdmintSlice = createSlice({
  name: "reportAdmintSlice",
  initialState: {
    posts: [],
    totalCount: 0,
    reportedPosts: [],
    userUserReports: [],
    users: [],
    notifications: [],
    rides: [],
    rideDetails: null,
    rideTotalCount: 0,
    loading: false,
    success: false,
    error: null,
  },
  reducers: {
    clearReportState: (state) => {
      state.success = false;
      state.error = null;
    },
    clearPostState: (state) => {
      state.success = false;
      state.error = null;
    },
    clearRideState: (state) => {
      state.success = false;
      state.error = null;
      state.rideDetails = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReportedPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReportedPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.reportedPosts = action.payload;
        state.success = true;
        state.error = null;
      })
      .addCase(fetchReportedPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.success = false;
      })
      .addCase(fetchUserUserReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserUserReports.fulfilled, (state, action) => {
        state.loading = false;
        state.userUserReports = action.payload;
        state.success = true;
        state.error = null;
      })
      .addCase(fetchUserUserReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.success = false;
      })
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
        state.success = true;
        state.error = null;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.success = false;
      })
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
        state.success = true;
        state.error = null;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.success = false;
      })
      .addCase(blockUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(blockUser.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = null;
        state.users = state.users.map((user) =>
          user.id === action.payload.userId
            ? {
                ...user,
                status: "Blocked",
                blockedUntil: action.payload.untilISO,
              }
            : user
        );
      })
      .addCase(blockUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.success = false;
      })
      .addCase(suspendUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(suspendUser.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = null;
        state.users = state.users.map((user) =>
          user.id === action.payload.userId
            ? {
                ...user,
                status: "Suspended",
                suspendedUntil: action.payload.untilISO,
              }
            : user
        );
      })
      .addCase(suspendUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.success = false;
      })
      .addCase(activateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(activateUser.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = null;
        state.users = state.users.map((user) =>
          user.id === action.payload
            ? {
                ...user,
                status: "Active",
                blockedUntil: null,
                suspendedUntil: null,
              }
            : user
        );
      })
      .addCase(activateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.success = false;
      })
      .addCase(deletePost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = null;
        state.reportedPosts = state.reportedPosts.filter(
          (post) => post.id !== action.payload.postId
        );
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.success = false;
      })
      .addCase(deleteAllReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAllReports.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = null;
        state.reportedPosts = state.reportedPosts.filter(
          (post) => post.id !== action.payload.postId
        );
      })
      .addCase(deleteAllReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.success = false;
      })
      .addCase(fetchPostsByAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(fetchPostsByAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = action.payload?.posts || [];
        state.totalCount = action.payload?.totalCount || 0;
        state.success = true;
        state.error = null;
      })
      .addCase(fetchPostsByAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.success = false;
      })
      .addCase(approvePost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approvePost.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = null;
        state.posts = state.posts.map((post) =>
          post.id === action.payload.postId
            ? { ...post, approvalStatus: 1 }
            : post
        );
      })
      .addCase(approvePost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.success = false;
      })
      .addCase(adDeletePost.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(adDeletePost.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = null;
        state.posts = state.posts.map((post) =>
          post.id === action.payload
            ? { ...post, isDeleted: true, approvalStatus: 2 }
            : post
        );
      })
      .addCase(adDeletePost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message || "Không thể xóa bài viết";
        state.success = false;
      })
      // Lấy danh sách chuyến đi theo trạng thái
      .addCase(fetchRidesByStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(fetchRidesByStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.rides = action.payload?.rides || [];
        state.rideTotalCount = action.payload?.totalRecords || 0;
        state.success = true;
        state.error = null;
      })
      .addCase(fetchRidesByStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.success = false;
      })

      // Lấy chi tiết chuyến đi
      .addCase(fetchRideDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(fetchRideDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.rideDetails = action.payload;
        state.success = true;
        state.error = null;
      })
      .addCase(fetchRideDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.success = false;
      });
  },
});

export const { clearReportState, clearPostState, clearRideState } =
  reporAdmintSlice.actions;
export default reporAdmintSlice.reducer;
