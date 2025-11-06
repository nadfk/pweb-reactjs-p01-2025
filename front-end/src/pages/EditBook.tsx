import { useState, useEffect, FormEvent } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { z } from "zod";
import { bookAPI } from "../services/api";
import React from "react";
import Input from "../components/Input";
import Button from "../components/Button";

// Schema untuk field yang dapat di-update (price, stock_quantity, description)
const editBookSchema = z.object({
  description: z.string().nullable().optional(),
  price: z.number().min(0, "Harga harus non-negatif").optional(),
  stock_quantity: z.number().int().min(0, "Stok harus non-negatif").optional(),
});

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

type FormData = Partial<BookDetail>;
type Errors = { [key in keyof FormData]?: string[] };


export default function EditBook() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({});
  const [initialLoading, setInitialLoading] = useState(true);

  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    if (id) {
      fetchBookDetails(id);
    }
  }, [id]);

  const fetchBookDetails = async (bookId: string) => {
    setInitialLoading(true);
    setApiError("");
    try {
      const res = await bookAPI.getById(bookId);
      if (res.success) {
        setFormData({
          title: res.data.title,
          writer: res.data.writer,
          publisher: res.data.publisher,
          publication_year: res.data.publication_year,
          price: res.data.price,
          stock_quantity: res.data.stock_quantity,
          description: res.data.description || "",
          genre: res.data.genre,
        });
      }
    } catch (err: any) {
      setApiError(err.message || "Gagal memuat detail buku");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    // Handle number inputs, ensuring compatibility with the form
    const parsedValue =
        name === "price" || name === "stock_quantity" || name === "publication_year"
          ? Number(value)
          : value;
    
    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError("");

    // Prepare data to send (only mutable fields)
    const dataToSend = {
      description: formData.description === "" ? null : formData.description, // API needs null for optional string
      price: formData.price,
      stock_quantity: formData.stock_quantity,
    };

    // Filter out undefined fields and perform validation on mutable data
    const mutableData: { [key: string]: any } = {};
    if (dataToSend.description !== undefined) mutableData.description = dataToSend.description;
    if (dataToSend.price !== undefined) mutableData.price = dataToSend.price;
    if (dataToSend.stock_quantity !== undefined) mutableData.stock_quantity = dataToSend.stock_quantity;
    
    // Validate
    const result = editBookSchema.safeParse(mutableData);
    if (!result.success) {
      const fieldErrors: Errors = {};
      result.error.errors.forEach((err) => {
        const path = err.path[0] as keyof FormData;
        if (path) {
          if (!fieldErrors[path]) {
            fieldErrors[path] = [];
          }
          fieldErrors[path]!.push(err.message);
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await bookAPI.update(id!, result.data);
      if (res.success) {
        alert("Buku berhasil diperbarui!");
        navigate(`/books/${id}`);
      }
    } catch (err: any) {
      setApiError(err.message || "Gagal memperbarui buku");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600">Memuat data buku...</p>
      </div>
    );
  }

  if (apiError && !formData.title) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-100 text-red-700 p-4 rounded">
          Error: {apiError}
        </div>
        <Link to="/books">
          <Button variant="secondary" className="mt-4">
            ← Kembali ke Daftar Buku
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to={`/books/${id}`}>
        <Button variant="secondary" className="mb-4">
          ← Kembali ke Detail Buku
        </Button>
      </Link>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6">Edit Buku: {formData.title}</h1>

        {apiError && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Uneditable fields - displayed as read-only */}
          <Input label="Title" value={formData.title} disabled />
          <Input label="Writer" value={formData.writer} disabled />
          <Input label="Publisher" value={formData.publisher} disabled />
          <Input label="Genre" value={formData.genre} disabled />
          <Input
            label="Publication Year"
            type="number"
            value={formData.publication_year}
            disabled
          />
          
          {/* Editable fields */}
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

          <Input
            label="Description (Opsional)"
            textarea
            name="description"
            value={formData.description || ""}
            onChange={handleChange}
            error={errors.description}
          />

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Memperbarui..." : "Simpan Perubahan"}
          </Button>
        </form>
      </div>
    </div>
  );
}