import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isAuthenticated: localStorage.getItem("token") || null,
  role: "",
};

const signupUser = (state) => {
  return { ...state, isAuthenticated: true };
};

const signinUser = (state) => {
  return { ...state, isAuthenticated: true };
};

const signoutUser = (state) => {
  state.isAuthenticated = false;
  state.role = null;
};

const setRole = (state, action) => {
  return { ...state, role: action.payload };
};

export const AuthSlice = createSlice({
  name: "authStatus",
  initialState,
  reducers: {
    signup: signupUser,
    signin: signinUser,
    signout: signoutUser,
    setUserRole: setRole,
  },
});

export const { signup, signin, signout, setUserRole } = AuthSlice.actions;
export default AuthSlice.reducer;
