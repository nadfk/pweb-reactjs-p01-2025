import React from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const { token, loading } = useAuth();

  if (loading) {
    // Tampilkan loading spinner saat context masih memverifikasi token
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading session...</p>
      </div>
    );
  }

  if (!token) {
    // Jika tidak ada token (setelah loading selesai), redirect ke login
    return <Navigate to="/login" replace />;
  }

  // Jika token ada, tampilkan halaman yang diminta
  return <Outlet />;
}