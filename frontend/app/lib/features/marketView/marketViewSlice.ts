import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface MarketViewState {
	selectedSymbol: string;
	selectedTimeframe: "1h" | "1d" | "1w" | "1m" | "1y";
}

const initialState: MarketViewState = {
	selectedSymbol: "bitcoin",
	selectedTimeframe: "1d",
};

const marketViewSlice = createSlice({
	name: "marketView",
	initialState,
	reducers: {
		setSelectedSymbol(state, action: PayloadAction<string>) {
			state.selectedSymbol = action.payload;
		},
		setSelectedTimeframe(state, action: PayloadAction<MarketViewState["selectedTimeframe"]>) {
			state.selectedTimeframe = action.payload;
		},
	},
});

export const { setSelectedSymbol, setSelectedTimeframe } = marketViewSlice.actions;
export default marketViewSlice.reducer;
