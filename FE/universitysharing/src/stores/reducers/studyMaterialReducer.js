// File: stores/reducers/studyMaterialReducer.js

import { createSlice } from "@reduxjs/toolkit";
import {
  countMaterialDownloads,
  createStudyMaterial,
  deleteStudyMaterial,
  fetchStudyMaterialDetail,
  fetchStudyMaterials,
  updateStudyMaterial
} from "../action/studyMaterialAction.js";

const studyMaterialSlice = createSlice({
  name: "studyMaterial",
  initialState: {
    materials: [], // Danh sách tài liệu
    materialDetail: null, // Chi tiết tài liệu
    nextCursor: null,
    totalCount: 0,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    resetStudyMaterialState: (state) => {
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ==================== CREATE MATERIAL ====================
      .addCase(createStudyMaterial.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createStudyMaterial.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Thêm tài liệu mới lên đầu danh sách
        if (action.payload) {
          state.materials.unshift(action.payload); 
          state.totalCount += 1;
        }
      })
      .addCase(createStudyMaterial.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      
      // ==================== UPDATE MATERIAL ====================
      .addCase(updateStudyMaterial.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateStudyMaterial.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const updatedMaterial = action.payload;
        if (updatedMaterial) {
          // Cập nhật trong danh sách materials
          const index = state.materials.findIndex(material => material.id === updatedMaterial.id);
          if (index !== -1) {
            state.materials[index] = { ...state.materials[index], ...updatedMaterial };
          }
          // Cập nhật materialDetail nếu đang xem chi tiết
          if (state.materialDetail && state.materialDetail.id === updatedMaterial.id) {
            state.materialDetail = { ...state.materialDetail, ...updatedMaterial };
          }
        }
      })
      .addCase(updateStudyMaterial.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      
      // ==================== FETCH ALL MATERIALS ====================
      .addCase(fetchStudyMaterials.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudyMaterials.fulfilled, (state, action) => {
        console.log("=== FULFILLED CALLED ===", action.payload); // Log payload từ thunk
        
        state.loading = false;
        
        const responseData = action.payload;
        console.log("Reducer received data:", responseData); // Debug
        
        if (responseData) {
            const newMaterials = responseData.materials || [];
            console.log("New materials length:", newMaterials.length); // Log độ dài array
            
            // Kiểm tra nếu là request đầu tiên (lastId null) thì thay thế, nếu không thì nối thêm
            if (!action.meta.arg?.LastStudyMaterialId) {
            console.log("First load: Replacing materials"); // Log xác nhận first load
            state.materials = newMaterials;
            } else {
            console.log("Load more: Appending materials");
            // Lần tải tiếp theo, nối thêm (loại bỏ trùng lặp)
            const existingIds = new Set(state.materials.map(m => m.id));
            const uniqueNewMaterials = newMaterials.filter(m => !existingIds.has(m.id));
            state.materials = [...state.materials, ...uniqueNewMaterials];
            }

            state.nextCursor = responseData.nextCursor;
            state.totalCount = responseData.totalCount || newMaterials.length;
            
            console.log("Final state materials length:", state.materials.length); // Log state sau set
            console.log("Final state nextCursor:", state.nextCursor); // Log cursor
        } else {
            console.log("WARNING: responseData is empty!"); // Log nếu data rỗng
        }
        })
      .addCase(fetchStudyMaterials.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ==================== FETCH MATERIAL DETAIL ====================
      .addCase(fetchStudyMaterialDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudyMaterialDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.materialDetail = action.payload; // Lưu dữ liệu chi tiết
      })
      .addCase(fetchStudyMaterialDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ==================== DELETE MATERIAL ====================
      .addCase(deleteStudyMaterial.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStudyMaterial.fulfilled, (state, action) => {
        state.loading = false;
        // Xóa tài liệu khỏi state bằng ID
        state.materials = state.materials.filter(material => material.id !== action.payload);
        state.totalCount = Math.max(0, state.totalCount - 1);
      })
      .addCase(deleteStudyMaterial.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // ==================== COUNT DOWNLOADS ====================
        .addCase(countMaterialDownloads.pending, (state) => {
        state.loading = true;
        state.error = null;
        })
        .addCase(countMaterialDownloads.fulfilled, (state, action) => {
        state.loading = false;
        const { id, count } = action.payload;
        // Cập nhật downloadCount trong danh sách materials
        const index = state.materials.findIndex(material => material.id === id);
        if (index !== -1) {
            state.materials[index].downloadCount = count; // Hoặc state.materials[index].downloadCount += 1 nếu backend chỉ tăng 1
        }
        // Cập nhật materialDetail nếu đang xem chi tiết
        if (state.materialDetail && state.materialDetail.id === id) {
            state.materialDetail.downloadCount = count;
        }
        })
        .addCase(countMaterialDownloads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        });
  },
  
  
});


export const { resetStudyMaterialState } = studyMaterialSlice.actions;
export default studyMaterialSlice.reducer;