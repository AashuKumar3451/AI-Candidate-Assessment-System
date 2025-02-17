import { useState } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { signup, setUserRole, signin } from "../Features/AuthStatus";
import { useNavigate } from "react-router-dom";

function Signup() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("candidate");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = {
      name,
      phone,
      email,
      password,
      role,
    };
    try {
      const response = await axios.post("/auth/signup", formData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      localStorage.setItem("token", response.data.token);
    
      dispatch(signup());
      dispatch(setUserRole(response.data.user.role));
      alert("User Created Successfully");
      setName("");
      setPassword("");
      setPhone("");
      setRole("user");
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
        <label htmlFor="name">Name: </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
        />
        <label htmlFor="email">Email: </label>
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          id="email"
        />
        <label htmlFor="phone">Phone: </label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone"
          id="phone"
        />
        <label htmlFor="role">Role: </label>
        <select
          name="role"
          id="role"
          className="bg-gray-700 p-1 border-black "
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="candidate">Candidate</option>
          <option value="hr">HR</option>
          <option value="admin">Admin</option>
        </select>
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

export default Signup;
