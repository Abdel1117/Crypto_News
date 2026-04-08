import { createAsyncThunk } from "@reduxjs/toolkit";
import { fetchTrending } from "../../api/crypto";

export const getTrending = createAsyncThunk(
  "trending/fetch",
  async () => {
    const data = await fetchTrending();
    return data;
  }
);
