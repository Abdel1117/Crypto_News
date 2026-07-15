import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchOhlcData } from "./marketViewThunk";

export interface MarketViewState {
	selectedSymbol: string;
	selectedTimeFrame:  "1d" | "1w" | "1m" | "1y";
	ohlc: any[];
	ohlcLoading: boolean;
	ohlcError?: string | null;
}

const initialState: MarketViewState = {
	selectedSymbol: "bitcoin",
	selectedTimeFrame: "1d",
	ohlc: [],
	ohlcLoading: false,
	ohlcError: null,
};

const marketViewSlice = createSlice({
	name: "marketView",
	initialState,
	reducers: {
		setSelectedSymbol(state, action: PayloadAction<string>) {
			state.selectedSymbol = action.payload;
		},
		setSelectedTimeframe(state, action: PayloadAction<MarketViewState["selectedTimeFrame"]>) {
			state.selectedTimeFrame = action.payload;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchOhlcData.pending, (state) => {
				state.ohlcLoading = true;
				state.ohlcError = null;
			})
			.addCase(fetchOhlcData.fulfilled, (state, action) => {
				state.ohlcLoading = false;
				state.ohlc = action.payload;
			})
			.addCase(fetchOhlcData.rejected, (state, action) => {
				state.ohlcLoading = false;
				state.ohlcError = action.payload as string || "Erreur lors du chargement des données OHLC";
				state.ohlc = [];
			});
	},
});

export const { setSelectedSymbol, setSelectedTimeframe } = marketViewSlice.actions;
export default marketViewSlice.reducer;
