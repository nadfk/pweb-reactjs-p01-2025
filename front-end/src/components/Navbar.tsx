import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import React from "react";
import Button from "./Button";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { email, token, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-md shadow-lg border-b border-white/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Brand */}
          <Link
            to="/books"
            className="text-xl font-bold bg-gradient-to-r from-cold-600 to-cold-800 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            IT Literature Shop
          </Link>

          {/* Navigation Links */}
          {token && (
            <div className="flex items-center gap-6">
              <Link
                to="/books"
                className="text-cold-700 hover:text-cold-900 transition-colors relative group"
              >
                <span className="relative">
                  Books
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cold-500 transition-all duration-300 group-hover:w-full"></span>
                </span>
              </Link>
              <Link
                to="/transactions"
                className="flex items-center text-cold-700 hover:text-cold-900 transition-colors relative group"
              >
                <span className="relative">
                  Transactions
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cold-500 transition-all duration-300 group-hover:w-full"></span>
                </span>
                {itemCount > 0 && (
                  <span className="ml-1.5 bg-cold-500 text-white text-xs font-bold rounded-full px-2 py-0.5 shadow-sm">
                    {itemCount}
                  </span>
                )}
              </Link>

              {/* User Info & Logout */}
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-cold-200/50">
                {email && (
                  <span className="text-sm text-cold-600 font-medium">{email}</span>
                )}
                <Button
                  variant="secondary"
                  onClick={handleLogout}
                  className="px-4 py-1.5 text-sm font-medium text-cold-600 hover:text-cold-800 bg-cold-100/50 hover:bg-cold-200/50 rounded-lg transition-all duration-300"
                >
                  Logout
                </Button>
              </div>
            </div>
          )}

          {/* Login link when not authenticated */}
          {!token && (
            <Link
              to="/login"
              className="px-4 py-1.5 text-sm font-medium text-cold-600 hover:text-cold-800 bg-cold-100/50 hover:bg-cold-200/50 rounded-lg transition-all duration-300"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}