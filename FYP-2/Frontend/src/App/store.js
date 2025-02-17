import { configureStore } from "@reduxjs/toolkit";
import AuthSlice from "../Features/AuthStatus";

export const store = configureStore({
    reducer: {
        "authStatus": AuthSlice,
    }
});