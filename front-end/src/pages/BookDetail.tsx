import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { bookAPI } from "../services/api";
import React from "react";
import Button from "../components/Button";

interface BookDetail {
  id: string;
  title: string;
  writer: string;
  publisher: string;
  description: string | null;
  publication_year: number;
  price: number;
  stock_quantity: number;
  genre: string;
}

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchBook();
  }, [id]);

  const fetchBook = async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await bookAPI.getById(id);
      if (res.success) {
        setBook(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch book");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this book?")) return;

    setDeleting(true);
    try {
      const res = await bookAPI.delete(id);
      if (res.success) {
        alert("Book deleted successfully");
        navigate("/books");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete book");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600">Loading book details...</p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-100 text-red-700 p-4 rounded">
          {error || "Book not found"}
        </div>
        <Link to="/books">
          <Button variant="secondary" className="mt-4">
            Back to Books
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/books">
        <Button variant="secondary" className="mb-4">
          ← Back to Books
        </Button>
      </Link>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-3xl font-bold">{book.title}</h1>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete Book"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <DetailRow label="Writer" value={book.writer} />
            <DetailRow label="Publisher" value={book.publisher} />
            <DetailRow label="Genre" value={book.genre} />
            <DetailRow
              label="Publication Year"
              value={book.publication_year.toString()}
            />
          </div>

          <div>
            <DetailRow label="Price" value={`$${book.price.toFixed(2)}`} />
            <DetailRow label="Stock" value={book.stock_quantity.toString()} />
          </div>
        </div>

        {book.description && (
          <div className="mt-6">
            <h3 className="font-semibold text-lg mb-2">Description</h3>
            <p className="text-gray-700 leading-relaxed">{book.description}</p>
          </div>
        )}

        <div className="mt-8 flex gap-4">
          <Link to={`/books/edit/${book.id}`} className="flex-1">
            <Button fullWidth>Edit Book</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-4">
      <p className="text-sm font-semibold text-gray-600">{label}</p>
      <p className="text-lg">{value}</p>
    </div>
  );
}