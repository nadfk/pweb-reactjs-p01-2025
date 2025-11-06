import { useState, useEffect, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import React from "react";
import { bookAPI, genreAPI } from "../services/api";
import Input from "../components/Input";
import Button from "../components/Button";

const bookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  writer: z.string().min(1, "Writer is required"),
  publisher: z.string().min(1, "Publisher is required"),
  publication_year: z.number().min(1000, "Tahun tidak valid").max(new Date().getFullYear() + 10, "Tahun tidak valid"),
  price: z.number().min(0, "Price must be non-negative"),
  stock_quantity: z.number().int().min(0, "Stock must be non-negative"),
  genre_id: z.string().min(1, "Genre is required"),
  description: z.string().optional(),
});

interface Genre {
  id: string;
  name: string;
}

export default function AddBook() {
  const navigate = useNavigate();

  const [genres, setGenres] = useState<Genre[]>([]);
  const [loadingGenres, setLoadingGenres] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    writer: "",
    publisher: "",
    publication_year: new Date().getFullYear(),
    price: 0,
    stock_quantity: 0,
    genre_id: "",
    description: "",
  });

  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      // Ambil semua genre (limit 100 seharusnya cukup untuk dropdown)
      const res = await genreAPI.getAll({ limit: 100 });
      if (res.success) {
        setGenres(res.data as Genre[]);
      }
    } catch (err) {
      console.error("Failed to fetch genres:", err);
    } finally {
      setLoadingGenres(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "publication_year" ||
        name === "price" ||
        name === "stock_quantity"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError("");

    // Validate
    const result = bookSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: any = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0]] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const dataToSend = {
          ...result.data,
          description: result.data.description || undefined, // send undefined if empty string
      };
      
      const res = await bookAPI.create(dataToSend as any);
      if (res.success) {
        alert("Book added successfully!");
        navigate("/books");
      }
    } catch (err: any) {
      setApiError(err.message || "Failed to add book");
    } finally {
      setLoading(false);
    }
  };

  if (loadingGenres) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600">Loading form...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to="/books">
        <Button variant="secondary" className="mb-4">
          ← Back to Books
        </Button>
      </Link>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6">Add New Book</h1>

        {apiError && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            error={errors.title}
          />

          <Input
            label="Writer"
            name="writer"
            value={formData.writer}
            onChange={handleChange}
            error={errors.writer}
          />

          <Input
            label="Publisher"
            name="publisher"
            value={formData.publisher}
            onChange={handleChange}
            error={errors.publisher}
          />

          <Input
            label="Publication Year"
            name="publication_year"
            type="number"
            value={formData.publication_year}
            onChange={handleChange}
            error={errors.publication_year}
          />

          <Input
            label="Price"
            name="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={handleChange}
            error={errors.price}
          />

          <Input
            label="Stock Quantity"
            name="stock_quantity"
            type="number"
            value={formData.stock_quantity}
            onChange={handleChange}
            error={errors.stock_quantity}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Genre
            </label>
            <select
              name="genre_id"
              value={formData.genre_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Genre</option>
              {genres.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.name}
                </option>
              ))}
            </select>
            {errors.genre_id && (
              <p className="text-red-500 text-sm mt-1">{errors.genre_id}</p>
            )}
          </div>

          {/* Mengganti textarea native dengan Input component */}
          <Input
            label="Description (Optional)"
            textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            error={errors.description}
          />

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Adding..." : "Add Book"}
          </Button>
        </form>
      </div>
    </div>
  );
}