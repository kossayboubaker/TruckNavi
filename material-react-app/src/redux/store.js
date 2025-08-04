// src/redux/store.js
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice"; // adapte si tu as d'autres slices

const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export default store;
