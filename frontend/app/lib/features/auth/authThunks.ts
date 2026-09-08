import { createAsyncThunk } from "@reduxjs/toolkit";
import { refreshAccessToken } from "../../auth/api";

export const refreshSession = createAsyncThunk("auth/refreshSession", async () => {
  return await refreshAccessToken();
});
