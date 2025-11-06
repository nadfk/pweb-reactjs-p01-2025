import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { bookAPI } from "../services/api";
import React from "react";
import Button from "../components/Button";
import Input from "../components/Input";

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
  const [meta, setMeta] = useState<Meta | null>(null); // Menggunakan interface Meta

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
        <p className="text-center text-gray-600">Loading books...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-100 text-red-700 p-4 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Books</h1>
        <Link to="/books/add">
          <Button>Add New Book</Button>
        </Link>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Search by title or writer..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>

          <select
            className="px-3 py-2 border border-gray-300 rounded-lg"
            value={orderByTitle}
            onChange={(e) => {
              setOrderByTitle(e.target.value);
            }}
          >
            <option value="">Sort by Title</option>
            <option value="asc">Title A-Z</option>
            <option value="desc">Title Z-A</option>
          </select>

          <select
            className="px-3 py-2 border border-gray-300 rounded-lg"
            value={orderByPublishDate}
            onChange={(e) => {
              setOrderByPublishDate(e.target.value);
            }}
          >
            <option value="">Sort by Year</option>
            <option value="asc">Oldest First</option>
            <option value="desc">Newest First</option>
          </select>
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={handleSearch}>Search</Button>
          <Button variant="secondary" onClick={handleResetFilters}>
            Reset Filters
          </Button>
        </div>
      </div>

      {books.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No books found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <div
                key={book.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <h3 className="text-xl font-bold mb-2">{book.title}</h3>
                <p className="text-gray-600 mb-1">by {book.writer}</p>
                <p className="text-sm text-gray-500 mb-2">{book.publisher}</p>
                <p className="text-sm text-blue-600 mb-2">{book.genre}</p>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-lg font-bold text-green-600">
                    ${book.price.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-600">
                    Stock: {book.stock_quantity}
                  </span>
                </div>
                <Link to={`/books/${book.id}`}>
                  <Button variant="secondary" fullWidth className="mt-4">
                    View Details
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.total > 0 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button
                onClick={() => setPage(page - 1)}
                disabled={!meta.prev_page}
                variant="secondary"
              >
                Previous
              </Button>
              <span className="text-gray-700">
                Page {meta.page} of {Math.ceil(meta.total / meta.limit)}
              </span>
              <Button
                onClick={() => setPage(page + 1)}
                disabled={!meta.next_page}
                variant="secondary"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}