// File: stores/reducers/accommodationSearchAIReducer.js

import { createSlice } from "@reduxjs/toolkit";
import { searchAccommodationByAI } from "../action/searchAccommodationByAI";

const accommodationSearchAISlice = createSlice({
  name: "accommodationSearchAI",
  initialState: {
    answer: null,
    results: [], // responseDataAI
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    resetSearchAIState: (state) => {
      state.success = false;
      state.error = null;
      state.answer = null;
      state.results = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // ==================== SEARCH BY AI ====================
      .addCase(searchAccommodationByAI.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(searchAccommodationByAI.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.answer = action.payload.answer;
        state.results = action.payload.responseDataAI || [];
      })
      .addCase(searchAccommodationByAI.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
        state.answer = null;
        state.results = [];
      });
  },
});

export const { resetSearchAIState } = accommodationSearchAISlice.actions;
export default accommodationSearchAISlice.reducer;