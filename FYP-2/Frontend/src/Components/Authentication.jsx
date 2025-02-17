import { useNavigate } from "react-router-dom";
import "../index.css";

function Authentication() {
  const navigate = useNavigate()
  return (
    <div className='text-gray-200 w-2/4 m-auto h-32 p-4 flex flex-col justify-center align-middle bg-gray-600 rounded-lg'>
      <h1 className="">A page that will tell information about makeers of website</h1>
      <br />
      <p>Two button for</p>
      <button className={`border rounded-sm border-black hover:bg-blue-500`} onClick={
        (e)=>{
          e.preventDefault();
          navigate("signup")
        }
      }>Signup</button>
      <button className={`border rounded-sm border-black hover:bg-blue-500`} onClick={
        (e)=>{
          e.preventDefault();
          navigate("signin");
        }
      }>Signin</button>

    </div>
  )
}

export default Authentication
