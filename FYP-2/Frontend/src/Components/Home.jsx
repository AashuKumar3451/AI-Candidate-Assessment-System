import React, { useEffect, useState } from 'react';

function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Default to true for handling state

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false); // If no token, set to false
    }
  }, []);

  if (!isAuthenticated) {
    return <div>Error: No token found. Please log in.</div>;
  }

  return (
    <div>
      Home Page
    </div>
  );
}

export default Home;
