import React, { useState } from 'react'
import { setUserRole, signin } from '../Features/AuthStatus';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';

function Signin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = {
      email,
      password,
    };
    try {
      const response = await axios.post("/auth/signin", formData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      localStorage.setItem("token", response.data.token);
    
      dispatch(signin());
      dispatch(setUserRole(response.data.user.role));
      alert("User Login Successfully");
      setPassword("");
      setEmail("");
      navigate("/home");
    } catch (error) {
      alert("Error Occurred");
      console.error("Error Occurred", error);
    }
    
  };

  return (
    <div className="flex flex-col items-center justify-center w-1/2 bg-gray-500 p-3 text-gray-200">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center justify-center gap-2"
      >
        <label htmlFor="email">Email: </label>
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          id="email"
        />
        
        <label htmlFor="password">Password: </label>
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          id="password"
          className="bg-gray-700"
        />
        <button type="submit" className="bg-gray-700 p-2 ">
          Submit
        </button>
      </form>
    </div>
  );
}

export default Signin
