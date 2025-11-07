import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { bookAPI } from "../services/api";
import React from "react";
import Button from "../components/Button";
import Input from "../components/Input";
import {
  useCart
} from "../context/CartContext";

interface Book {
  id: string;
  title: string;
  writer: string;
  publisher: string;
  price: number;
  stock_quantity: number;
  genre: string;
}

interface Meta {
  page: number;
  limit: number;
  total: number; // Harus ada di respons backend
  prev_page: number | null;
  next_page: number | null;
}

export default function BooksList() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [orderByTitle, setOrderByTitle] = useState("");
  const [orderByPublishDate, setOrderByPublishDate] = useState("");
  const [meta, setMeta] = useState<Meta | null>(null);

  const { addToCart } = useCart(); // --- 2. GET CART FUNCTION ---

  const fetchBooks = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await bookAPI.getAll({
        page,
        limit,
        search,
        orderByTitle,
        orderByPublishDate,
      });
      if (res.success) {
        setBooks(res.data as Book[]);
        setMeta(res.meta || null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch books");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset page to 1 when filters or search change
    if (page !== 1 && (search !== searchInput || orderByTitle || orderByPublishDate)) {
        setPage(1);
        return;
    }
    fetchBooks();
  }, [page, search, orderByTitle, orderByPublishDate]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1); 
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearch("");
    setOrderByTitle("");
    setOrderByPublishDate("");
    setPage(1);
  };

  if (loading && books.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-center text-cold-600 animate-pulse">Loading books...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-100/80 backdrop-blur-sm text-red-700 p-4 rounded-lg border border-red-200">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search and Filter Card */}
      <div className="bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl p-6 mb-8 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Input 
            type="search"
            placeholder="Search books..."
            className="w-full sm:w-64 bg-white/50 backdrop-blur-sm border border-white/40 rounded-lg"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <div className="flex flex-wrap gap-4">
            <select
              className="bg-white/50 backdrop-blur-sm border border-white/40 rounded-lg px-4 py-2 text-gray-800"
              value={orderByTitle}
              onChange={(e) => setOrderByTitle(e.target.value)}
            >
              <option value="">Sort by Title</option>
              <option value="asc">Title A-Z</option>
              <option value="desc">Title Z-A</option>
            </select>

            <select
              className="bg-white/50 backdrop-blur-sm border border-white/40 rounded-lg px-4 py-2 text-gray-800"
              value={orderByPublishDate}
              onChange={(e) => setOrderByPublishDate(e.target.value)}
            >
              <option value="">Sort by Year</option>
              <option value="asc">Oldest First</option>
              <option value="desc">Newest First</option>
            </select>

            <Button 
              className="bg-blue-500/80 hover:bg-blue-600/80 text-white px-6 py-2 rounded-lg transition-all duration-300"
              onClick={handleSearch}
            >
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {books.map((book) => (
          <div
            key={book.id}
            className="bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl p-6 hover:shadow-xl transition-all duration-300"
          >
            <h3 className="font-bold text-gray-800 text-lg mb-2">{book.title}</h3>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <p>Writer: {book.writer}</p>
              <p>Publisher: {book.publisher}</p>
              <p>Genre: {book.genre}</p>
              <p>Stock: {book.stock_quantity}</p>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-white/40">
              <span className="text-gray-800 font-bold">${book.price}</span>
              <Button 
                className="bg-blue-500/80 hover:bg-blue-600/80 text-white px-4 py-1.5 rounded-lg text-sm transition-all duration-300 disabled:opacity-50"
                onClick={() => addToCart(book, 1)} 
                disabled={book.stock_quantity === 0}
              >
                {book.stock_quantity > 0 ? "Add to Cart" : "Out of Stock"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}