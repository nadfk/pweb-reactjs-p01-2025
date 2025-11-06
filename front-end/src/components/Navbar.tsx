import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import React from "react";
import Button from "./Button";

export default function Navbar() {
  const { email, token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Brand */}
          <Link to="/books" className="text-xl font-bold text-blue-600">
            IT Literature Shop
          </Link>

          {/* Navigation Links */}
          {token && (
            <div className="flex items-center gap-6">
              <Link
                to="/books"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Books
              </Link>
              <Link
                to="/transactions"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Transactions
              </Link>

              {/* User Info & Logout */}
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-300">
                {email && (
                  <span className="text-sm text-gray-600">{email}</span>
                )}
                <Button variant="secondary" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          )}

          {/* Login link when not authenticated */}
          {!token && (
            <Link to="/login" className="text-blue-600 hover:text-blue-700">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}