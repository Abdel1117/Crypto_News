
import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { getSymbols } from "./symbolThunks"

export interface SymbolData {
	id: string;
	image : string;
	symbol: string;
	name: string;
}

export interface SymbolState {
	symbols: SymbolData[];
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
	initialState,
	reducers: {
		setSymbols(state, action: PayloadAction<SymbolData[]>) {
			state.symbols = action.payload
			state.loading = false
		},
		setLoading(state, action: PayloadAction<boolean>) {
			state.loading = action.payload
		},
		setConnected(state, action: PayloadAction<boolean>) {
			state.connected = action.payload
		},
		addSymbolIfMissing(state, action: PayloadAction<SymbolData>) {
			const exists = state.symbols.some(s => s.id === action.payload.id);
			if (!exists) {
				state.symbols.push(action.payload);
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
				state.symbols = action.payload
			})
			.addCase(getSymbols.rejected, (state) => {
				state.loading = false
			})
	}
})

export const { setSymbols, setLoading, setConnected, addSymbolIfMissing } = symbolSlice.actions
export default symbolSlice.reducer
