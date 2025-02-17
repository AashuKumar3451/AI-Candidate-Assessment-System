import {
  createBrowserRouter,
  createRoutesFromChildren,
  Route,
  RouterProvider,
  Navigate,
  useNavigate,
} from "react-router-dom";
import Layout from "./Layout.jsx";
import { Home, Authentication, Signup, Signin } from "./Components/index.js";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { signin } from "./Features/AuthStatus.js";

export const App = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const isAuthenticated = useSelector(
    (state) => state.authStatus.isAuthenticated
  );
  //   const navigate = useNavigate();
  const role = useSelector((state) => state.authStatus.role);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      dispatch(signin());
    }
    setIsLoading(false);
  }, [dispatch]);

  if (isLoading) {
    return <div>Loading...</div>; // Prevent routing until auth check is done
  }
  const router = createBrowserRouter(
    createRoutesFromChildren(
      <Route path="" element={<Layout />}>
        <Route
          path="/"
          element={isAuthenticated ? <Home /> : <Authentication />}
        />
        <Route path="signup" element={<Signup />} />
        <Route path="signin" element={<Signin />} />
        <Route path="home" element={<Home />} />
      </Route>
    )
  );
  return <RouterProvider router={router} />;
};
