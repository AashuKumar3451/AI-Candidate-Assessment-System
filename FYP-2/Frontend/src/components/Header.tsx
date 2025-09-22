
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { BriefcaseIcon, HomeIcon, LogOutIcon, UserIcon } from "lucide-react";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-border sticky top-0 z-10">
      <div className="container flex items-center justify-between h-16 mx-auto px-4">
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-brand-blue flex items-center justify-center">
              <BriefcaseIcon size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl text-gray-800">Fast Interviewer</span>
          </Link>
        </div>

        {user ? (
          <div className="flex items-center gap-4">
            {user.role === 'hr' ? (
              <Link to="/hr/dashboard">
                <Button variant="ghost" size="sm">
                  <BriefcaseIcon className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/jobs">
                <Button variant="ghost" size="sm">
                  <BriefcaseIcon className="mr-2 h-4 w-4" />
                  Browse Jobs
                </Button>
              </Link>
            )}
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                <UserIcon size={16} />
              </div>
              <span>{user.name}</span>
              <span className="px-2 py-1 text-xs rounded-full bg-muted">
                {user.role === 'hr' ? 'HR' : 'Candidate'}
              </span>
            </div>

            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOutIcon className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
