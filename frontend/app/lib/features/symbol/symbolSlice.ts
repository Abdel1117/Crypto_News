
import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { getSymbols } from "./symbolThunks"

interface SymbolData {
	id: string;
	symbol: string;
	name: string;
}

interface SymbolState {
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

export const { setSymbols, setLoading, setConnected } = symbolSlice.actions
export default symbolSlice.reducer
