
import { createSlice, PayloadAction, createEntityAdapter } from "@reduxjs/toolkit"
import { getSymbols } from "./symbolThunks"

export interface SymbolData {
	id: string;
	image?: string;
	symbol: string;
	name: string;
	origin?: "trending" | "search" | "api";
}

const adapter = createEntityAdapter<SymbolData>({ selectId: (s) => s.id });

export interface SymbolState {
	symbols: SymbolData[]; // legacy array kept for compatibility
	loading: boolean;
	connected: boolean;
}

const initialState: SymbolState = {
	symbols: [],
	loading: false,
	connected: false,
}

const symbolSlice = createSlice({
	name: "symbols",
	initialState: adapter.getInitialState(initialState),
	reducers: {
		setSymbols(state, action: PayloadAction<SymbolData[]>) {
			adapter.setAll(state, action.payload);
			state.loading = false;
			state.symbols = action.payload;
		},
		setLoading(state, action: PayloadAction<boolean>) {
			state.loading = action.payload
		},
		setConnected(state, action: PayloadAction<boolean>) {
			state.connected = action.payload
		},
		addSymbolIfMissing(state, action: PayloadAction<SymbolData>) {
			const id = action.payload.id;
			if (!state.ids.includes(id)) {
				adapter.addOne(state, action.payload);
				// sync legacy array
				state.symbols = state.ids.map((i) => state.entities[i] as SymbolData);
			}
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(getSymbols.pending, (state) => {
				state.loading = true
			})
			.addCase(getSymbols.fulfilled, (state, action) => {
				state.loading = false
				adapter.setAll(state, action.payload);
				state.symbols = action.payload;
			})
			.addCase(getSymbols.rejected, (state) => {
				state.loading = false
			})
	}
})

export const { setSymbols, setLoading, setConnected, addSymbolIfMissing } = symbolSlice.actions
export default symbolSlice.reducer
