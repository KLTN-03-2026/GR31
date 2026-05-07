import { createSlice } from "@reduxjs/toolkit";
import { fetchLikes } from "../action/likeAction";
import {
  addCommentPost,
  commentPost,
  createPost,
  deleteComments,
  deletePost,
  fetchPosts,
  fetchPostsByOtherUser,
  fetchPostsByOwner,
  getReplyComment,
  likeComment,
  likePost,
  replyComments,
  sharePost,
  updateComment,
  updatePost,
} from "../action/listPostActions";
import { fetchShares } from "../action/shareAction";

const listPostSlice = createSlice({
  name: "posts",
  initialState: {
    posts: [],
    hasMoreAllPosts: true,
    hasMoreOwnerPosts: true,
    comments: {},
    selectedPost: null,
    isShareModalOpen: false,
    isInteractorModalOpen: false,
    isInteractorShareModalOpen: false,
    selectedPostForInteractions: null,
    selectedPostToShare: null,
    selectedPostToOption: null,
    isPostOptionsOpen: false,
    loading: false,
    loadingCreatePost: false,
    openCommentOptionId: null,
    likesLoading: false,
    likesError: null,
    postLikes: {},
    postShares: {},
    sharesLoading: false,
    sharesError: null,
  },
  reducers: {
    hidePost: (state, action) => {
      state.posts = state.posts.filter((post) => post.id !== action.payload);
    },
    openCommentModal: (state, action) => {
      state.selectedPost = {
        ...action.payload,
        initialMediaIndex: action.payload.initialMediaIndex || 0,
      };
    },
    closeCommentModal: (state) => {
      state.selectedPost = null;
    },
    openShareModal: (state, action) => {
      state.selectedPostToShare = action.payload;
      state.isShareModalOpen = true;
    },
    closeShareModal: (state) => {
      state.isShareModalOpen = false;
      state.selectedPostToShare = null;
    },
    openPostOptionModal: (state, action) => {
      state.selectedPostToOption = action.payload;
      state.isPostOptionsOpen = true;
    },
    closePostOptionModal: (state) => {
      state.isPostOptionsOpen = false;
      state.selectedPostToOption = null;
    },
    openCommentOption: (state, action) => {
      state.openCommentOptionId = action.payload;
    },
    closeCommentOption: (state) => {
      state.openCommentOptionId = null;
    },
    openInteractorModal: (state, action) => {
      state.selectedPostForInteractions = action.payload;
      state.isInteractorModalOpen = true;
    },
    closeInteractorModal: (state) => {
      state.isInteractorModalOpen = false;
      state.selectedPostForInteractions = null;
    },
    openInteractorShareModal: (state, action) => {
      state.selectedPostForInteractions = action.payload;
      state.isInteractorShareModalOpen = true;
    },
    closeInteractorShareModal: (state) => {
      state.isInteractorShareModalOpen = false;
      state.selectedPostForInteractions = null;
    },
    clearLikesError: (state) => {
      state.likesError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        const rawPosts = action.payload.posts;

      // THÊM DÒNG NÀY - QUAN TRỌNG NHẤT
      const posts = rawPosts.map(post => ({
        ...post,
        hasLiked: post.hasLiked || post.isLikedByCurrentUser || false, // chuẩn hóa tên trường
      }));
        if (action.meta.arg) {
          state.posts = [...state.posts, ...action.payload.posts];
        } else {
          state.posts = action.payload.posts;
        }
        state.hasMoreAllPosts = action.payload.hasMore;
      })
      .addCase(fetchPostsByOwner.fulfilled, (state, action) => {
        const rawPosts = action.payload.posts;

        // THÊM DÒNG NÀY
        const posts = rawPosts.map(post => ({
          ...post,
          hasLiked: post.hasLiked || post.isLikedByCurrentUser || false,
        }));
        if (action.meta.arg) {
          const newPosts = action.payload.posts.filter(
            (newPost) =>
              !state.posts.some(
                (existingPost) => existingPost.id === newPost.id
              )
          );
          state.posts = [...state.posts, ...newPosts];
        } else {
          state.posts = action.payload.posts;
        }
        state.hasMoreOwnerPosts = action.payload.hasMore;
      })
      .addCase(fetchPostsByOtherUser.fulfilled, (state, action) => {
        const { posts: rawPosts, hasMore } = action.payload;

        // THÊM DÒNG NÀY
        const posts = rawPosts.map(post => ({
          ...post,
          hasLiked: post.hasLiked || post.isLikedByCurrentUser || false,
        }));
        if (action.meta.arg?.lastPostId) {
          state.posts = [...state.posts, ...posts];
        } else {
          state.posts = posts;
        }
        state.hasMoreOwnerPosts = hasMore;
      })
      .addCase(likePost.pending, (state, action) => {
      // action.meta.arg chứa postId được truyền vào likePost(postId)
      const postId = action.meta.arg; 
      const post = state.posts.find((p) => p.id === postId);

      if (post) {
          const isCurrentlyLiked = post.hasLiked;
          
          // 1. Cập nhật Lạc quan: Đảo ngược trạng thái và đổi màu nút tim ngay lập tức
          post.hasLiked = !isCurrentlyLiked;
          
          // 2. Cập nhật Like Count ngay lập tức
          post.likeCount += isCurrentlyLiked ? -1 : 1; 
      }
  })
      .addCase(likePost.fulfilled, (state, action) => {
        const postId = action.payload;
        state.posts = state.posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLiking: false,
              }
            : post
        );
      })
      .addCase(likePost.rejected, (state, action) => {
        const postId = action.meta.arg;
        state.posts = state.posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                hasLiked: !post.hasLiked,
                likeCount: post.hasLiked
                  ? post.likeCount - 1
                  : post.likeCount + 1,
                isLiking: false,
              }
            : post
        );
      })
      .addCase(likeComment.fulfilled, (state, action) => {
        const commentId = action.payload;

        Object.keys(state.comments).forEach((postId) => {
          if (!Array.isArray(state.comments[postId])) {
            state.comments[postId] = [];
          }
          state.comments[postId] = state.comments[postId].map((comment) => {
            if (comment.id === commentId) {
              return {
                ...comment,
                hasLiked: !comment.hasLiked,
                likeCountComment: comment.hasLiked
                  ? comment.likeCountComment - 1
                  : comment.likeCountComment + 1,
              };
            }

            const updatedReplies = Array.isArray(comment.replies)
              ? comment.replies.map((reply) =>
                  reply.id === commentId
                    ? {
                        ...reply,
                        hasLiked: !reply.hasLiked,
                        likeCountComment: reply.hasLiked
                          ? reply.likeCountComment - 1
                          : reply.likeCountComment + 1,
                      }
                    : reply
                )
              : [];
            return { ...comment, replies: updatedReplies };
          });
        });
      })
      .addCase(commentPost.fulfilled, (state, action) => {
        const { postId, comments, hasMore, isInitialLoad } = action.payload;
        if (isInitialLoad) {
          state.comments[postId] = comments;
        } else {
          state.comments[postId] = [
            ...(state.comments[postId] || []),
            ...comments,
          ];
        }

        state.commentsHasMore = state.commentsHasMore || {};
        state.commentsHasMore[postId] = hasMore;
      })
      .addCase(addCommentPost.fulfilled, (state, action) => {
  const { postId, data, userId } = action.payload;
  if (!postId || !data) return;

  const newComment = {
    id: data.commentId,
    userId: userId || "",
    userName: data.fullName,
    profilePicture: data.profilePicture,
    content: data.content,
    createdAt: data.createdAt,
    hasLiked: 0,
    likeCountComment: 0,
    hasMoreReplies: false,
    replies: [],
    parentCommentId: data.parentCommentId || null,
  };

  // Nếu là reply → KHÔNG thêm vào root, để replyComments xử lý
  if (newComment.parentCommentId) {
    return;
  }

  // Đảm bảo mảng tồn tại
  if (!Array.isArray(state.comments[postId])) {
    state.comments[postId] = [];
  }

  // Kiểm tra trùng lặp (rất quan trọng)
  const exists = state.comments[postId].some(c => c.id === newComment.id);
  if (exists) {
    return; // Không thêm nếu đã có
  }

  // CHỈ THÊM 1 LẦN DUY NHẤT Ở ĐÂY
  state.comments[postId].push(newComment);

  // Tăng commentCount
  const postIndex = state.posts.findIndex(p => p.id === postId);
  if (postIndex !== -1) {
    state.posts[postIndex].commentCount += 1;
  }
})
      .addCase(updateComment.fulfilled, (state, action) => {
        const { postId, commentId, content } = action.payload;
        if (state.comments[postId]) {
          state.comments[postId] = state.comments[postId].map((comment) => {
            if (comment.id === commentId) {
              return { ...comment, content };
            }
            const updatedReplies = Array.isArray(comment.replies)
              ? comment.replies.map((reply) =>
                  reply.id === commentId ? { ...reply, content } : reply
                )
              : [];
            return { ...comment, replies: updatedReplies };
          });
        }
      })
      .addCase(fetchLikes.pending, (state) => {
        state.likesLoading = true;
        state.likesError = null;
      })
      .addCase(fetchLikes.fulfilled, (state, action) => {
        state.likesLoading = false;
        const { postId, data, hasReachedEnd } = action.payload;

        if (hasReachedEnd && state.postLikes[postId]?.nextCursor === null) {
          return;
        }
        const existingLikes = state.postLikes[postId] || {
          likeCount: 0,
          likedUsers: [],
          nextCursor: null,
        };

        state.postLikes = {
          ...state.postLikes,
          [postId]: {
            likeCount: data.likeCount,
            likedUsers: [
              ...existingLikes.likedUsers,
              ...(data.likedUsers || []),
            ],
            nextCursor: data.nextCursor,
          },
        };
      })
      .addCase(fetchLikes.rejected, (state, action) => {
        state.likesLoading = false;
        state.likesError = action.payload;
      })
      .addCase(fetchShares.pending, (state) => {
        state.sharesLoading = true;
        state.sharesError = null;
      })
      .addCase(fetchShares.fulfilled, (state, action) => {
        state.sharesLoading = false;
        const { postId, data } = action.payload;
        state.postShares = {
          ...state.postShares,
          [postId]: {
            shareCount: data.shareCount,
            sharedUsers: data.sharedUsers,
            nextCursor: data.nextCursor,
          },
        };
      })
      .addCase(fetchShares.rejected, (state, action) => {
        state.sharesLoading = false;
        state.sharesError = action.payload;
      })
      .addCase(createPost.pending, (state) => {
        state.loadingCreatePost = true;
        state.error = null;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.loadingCreatePost = false;
        state.posts.unshift(action.payload);
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        const { postId, data, fullName, profilePicture, createdAt } =
          action.payload;
        const update = {
          id: data.id,
          userId: data.userId,
          fullName,
          profilePicture,
          content: data.content,
          imageUrl: data.imageUrl,
          videoUrl: data.videoUrl,
          createdAt,
          updateAt: data.updateAt,
          postType: 4,
          commentCount: 0,
          likeCount: 0,
          shareCount: 0,
          hasLiked: 0,
          isSharedPost: false,
        };
        const index = state.posts.findIndex((post) => post.id === data.id);
        if (index !== -1) {
          state.posts[index] = update;
        }
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = state.posts.filter((post) => post.id !== action.payload);
      })
      .addCase(getReplyComment.fulfilled, (state, action) => {
        const { commentId, data } = action.payload;

        let found = false;
        Object.keys(state.comments).forEach((postId) => {
          const commentsArray = state.comments[postId];

          const comment = commentsArray.find((c) => c.id === commentId);
          if (comment) {
            comment.replies = data;
            comment.hasMoreReplies = false;
            found = true;
          }
        });
        if (!found) {
          console.error(
            `⚠️ Không tìm thấy commentId: ${commentId} trong state`
          );
        }
      })
      .addCase(deleteComments.fulfilled, (state, action) => {
        const { postId, commentId } = action.payload;
        if (state.comments[postId]) {
          let deletedCount = 0;

          const isRootComment = state.comments[postId].some(
            (comment) => comment.id === commentId
          );
          if (isRootComment) {
            const commentToDelete = state.comments[postId].find(
              (comment) => comment.id === commentId
            );
            if (commentToDelete) {
              deletedCount = 1 + (commentToDelete.replies?.length || 0);
            }

            state.comments[postId] = state.comments[postId].filter(
              (comment) => comment.id !== commentId
            );
          } else {
            state.comments[postId] = state.comments[postId].map((comment) => {
              const newReplies = comment.replies.filter(
                (reply) => reply.id !== commentId
              );
              if (newReplies.length < comment.replies.length) {
                deletedCount = 1;
              }
              return { ...comment, replies: newReplies };
            });
          }

          const postIndex = state.posts.findIndex((post) => post.id === postId);
          if (postIndex !== -1 && state.posts[postIndex].commentCount > 0) {
            state.posts[postIndex].commentCount = Math.max(
              0,
              state.posts[postIndex].commentCount - deletedCount
            );
          }
        }
      })
      .addCase(replyComments.fulfilled, (state, action) => {
        const { postId, data, userId } = action.payload;
        if (!data) return;
        const { parentCommentId } = data;
        if (!state.comments[postId]) return;
        const newReply = {
          id: data.commentId,
          userId: userId,

          userName: data.fullName,
          profilePicture: data.profilePicture,
          content: data.content,
          createdAt: data.createdAt,
          hasLiked: 0,
          likeCountComment: 0,
          replies: [],
          hasMoreReplies: false,
          parentCommentId,
        };

        const postComment = state.comments[postId];
        const rootComment = postComment.find(
          (comment) => comment.id === parentCommentId
        );
        if (rootComment) {
          rootComment.replies.push(newReply);
        }
        const postIndex = state.posts.findIndex((post) => post.id === postId);
        if (postIndex !== -1) {
          state.posts[postIndex].commentCount += 1;
        }
      })
      .addCase(sharePost.fulfilled, (state, action) => {
        console.log("sharePost payload:", action.payload);
        console.log("action.payload.privacy:", action.payload.privacy);
        const newPost = {
          id: action.payload.id,
          userId: action.payload.userId,
          fullName: action.payload.fullName,
          profilePicture: action.payload.profilePicture,
          content: action.payload.content,
          imageUrl: action.payload.imageUrl || null,
          videoUrl: action.payload.videoUrl || null,
          createdAt: action.payload.createdAt,
          updateAt: null,
          commentCount: 0,
          likeCount: 0,
          shareCount: 0,
          hasLiked: false,
          isSharedPost: action.payload.isSharedPost || true,
          postType: 1,
          originalPost: action.payload.originalPost,
          privacy: action.payload.privacy,
          scope: action.payload.scope || 0,
        };

        if (newPost.scope !== 1) {
          state.posts.unshift(newPost);
        }

        // Always increment the share count of the original post
        if (newPost.originalPost?.postId) {
          const originalPost = state.posts.find(
            (p) => p.id === newPost.originalPost.postId
          );
          if (originalPost) {
            originalPost.shareCount += 1;
          }
        }
      });
  },
});

export const {
  hidePost,
  openCommentModal,
  closeCommentModal,
  openShareModal,
  closeShareModal,
  openPostOptionModal,
  closePostOptionModal,
  openCommentOption,
  closeCommentOption,
  openInteractorModal,
  closeInteractorModal,
  openInteractorShareModal,
  closeInteractorShareModal,
} = listPostSlice.actions;

export default listPostSlice.reducer;
