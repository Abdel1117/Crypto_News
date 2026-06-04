
import { createSlice, PayloadAction, createEntityAdapter } from "@reduxjs/toolkit"
import { getSymbols } from "./symbolThunks"

export interface SymbolData {
	id: string;
	image?: string;
	symbol: string;
	name: string;
	origin?: "trending" | "search" | "api";
}

const adapter = createEntityAdapter<SymbolData>();

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
		// initialize symbols from persisted storage
		initSymbols(state, action: PayloadAction<SymbolData[]>) {
			adapter.setAll(state, action.payload);
			state.symbols = action.payload;
		},
		setSymbols(state, action: PayloadAction<SymbolData[]>) {
			adapter.upsertMany(state, action.payload);
			state.loading = false;
			state.symbols = state.ids.map((i) => state.entities[i] as SymbolData);
			// persist merged symbols
			try {
				if (typeof window !== "undefined" && window.localStorage) {
					window.localStorage.setItem("symbols", JSON.stringify(state.symbols));
				}
			} catch {
				// ignore
			}
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
				// persist updated symbols to localStorage
				try {
					if (typeof window !== "undefined" && window.localStorage) {
						const toSave = state.symbols;
						window.localStorage.setItem("symbols", JSON.stringify(toSave));
					}
				} catch {
					// ignore storage errors
				}
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
				// merge fetched symbols into existing (do not wipe user-added symbols)
				adapter.upsertMany(state, action.payload);
				state.symbols = state.ids.map((i) => state.entities[i] as SymbolData);
				// persist merged symbols to localStorage
				try {
					if (typeof window !== "undefined" && window.localStorage) {
						window.localStorage.setItem("symbols", JSON.stringify(state.symbols));
					}
				} catch {
					// ignore
				}
			})
			.addCase(getSymbols.rejected, (state) => {
				state.loading = false
			})
	}
})

export const { setSymbols, setLoading, setConnected, addSymbolIfMissing } = symbolSlice.actions
export default symbolSlice.reducer

// Utilities to persist/load symbols outside of reducers (used by client components)
export function readLocalSymbols(): SymbolData[] {
	try {
		if (typeof window === "undefined" || !window.localStorage) return [];
		const raw = window.localStorage.getItem("symbols");
		if (!raw) return [];
		return JSON.parse(raw) as SymbolData[];
	} catch {
		return [];
	}
}

export function saveLocalSymbols(symbols: SymbolData[]) {
	try {
		if (typeof window === "undefined" || !window.localStorage) return;
		window.localStorage.setItem("symbols", JSON.stringify(symbols));
	} catch {
		// ignore
	}
}
