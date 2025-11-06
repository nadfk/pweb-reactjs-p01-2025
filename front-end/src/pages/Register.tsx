import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { authAPI } from "../services/api";
import React from "react";
import Input from "../components/Input";
import Button from "../components/Button";

const registerSchema = z.object({
  username: z.string().optional(),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type FormData = z.infer<typeof registerSchema>;
type Errors = { [key in keyof FormData]?: string[] };


export default function Register() {
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError("");

    const result = registerSchema.safeParse(formData);
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
      const res = await authAPI.register(result.data);
      if (res.success) {
        alert("Pendaftaran berhasil! Silakan login.");
        navigate("/login");
      }
    } catch (err: any) {
      setApiError(err.message || "Pendaftaran gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-center mb-6">Register Akun Baru</h1>

          {apiError && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username (Opsional)"
              name="username"
              value={formData.username}
              onChange={handleChange}
              error={errors.username}
              placeholder="Masukkan Username Anda"
            />

            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="your@email.com"
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="minimal 6 karakter"
            />

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? "Mendaftar..." : "Register"}
            </Button>
          </form>

          <p className="text-center mt-4 text-sm text-gray-600">
            Sudah punya akun?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}