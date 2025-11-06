import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import React from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Navbar from "./components/Navbar";
import BooksList from "./pages/BooksList";
import BookDetail from "./pages/BookDetail";
import AddBook from "./pages/AddBook";
import EditBook from "./pages/EditBook";

function Protected({ children }: { children: JSX.Element }) {
  const { token, loading } = useAuth(); // Ambil token dan loading

  if (loading) {
    // Tampilkan loading screen saat token sedang divalidasi
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl text-blue-600 animate-pulse">Loading...</p>
      </div>
    );
  }

  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        {/* Rute Autentikasi */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rute Protected: Manajemen Buku */}
        <Route
          path="/books"
          element={<Protected><BooksList /></Protected>} 
        />
        <Route
          path="/books/add"
          element={<Protected><AddBook /></Protected>}
        />
        <Route
          path="/books/:id"
          element={<Protected><BookDetail /></Protected>}
        />
        <Route
          path="/books/edit/:id"
          element={<Protected><EditBook /></Protected>}
        />

        {/* Rute Protected: Transaksi (Placeholder) */}
        <Route
          path="/transactions"
          element={<Protected>
            <div className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold">Halaman Transaksi</h1>
                <p>Fitur Transaksi tidak diimplementasi sesuai permintaan.</p>
            </div>
          </Protected>}
        />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/books" replace />} />
        <Route path="*" element={<Navigate to="/books" replace />} />
      </Routes>
    </AuthProvider>
  );
}