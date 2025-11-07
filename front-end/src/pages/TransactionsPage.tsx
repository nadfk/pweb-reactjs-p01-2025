import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { transactionAPI } from "../services/api";
import { useCart } from "../context/CartContext";
import Button from "../components/Button";
import Input from "../components/Input";
import { useAuth } from "../context/AuthContext";

// Tipe data untuk Riwayat Transaksi (dari API)
interface TransactionHistory {
  id: string;
  total_quantity: number;
  total_price: number;
}

// Tipe data untuk Meta Pagination
interface Meta {
  page: number;
  limit: number;
  total: number; 
  prev_page: number | null;
  next_page: number | null;
}

export default function TransactionsPage() {
  const { cartItems, removeFromCart, updateQuantity, clearCart, totalPrice, itemCount } = useCart();
  const { token } = useAuth();
  const navigate = useNavigate();

  // State untuk keranjang
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  // State untuk Riwayat Transaksi (List)
  const [history, setHistory] = useState<TransactionHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  // State untuk filter & pagination (sesuai BooksList.tsx)
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [orderById, setOrderById] = useState("");
  const [orderByAmount, setOrderByAmount] = useState("");
  const [meta, setMeta] = useState<Meta | null>(null);

  // Fetch riwayat transaksi
  const fetchHistory = async () => {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const res = await transactionAPI.getAll({
        page,
        limit,
        search,
        orderById,
        orderByAmount,
      });
      if (res.success) {
        setHistory(res.data as TransactionHistory[]);
        setMeta(res.meta || null);
      }
    } catch (err: any) {
      setHistoryError(err.message || "Failed to fetch transaction history");
    } finally {
      setHistoryLoading(false);
    }
  };

  // useEffect untuk fetch riwayat
  useEffect(() => {
    if (token) {
      // Hanya fetch jika sudah login
      fetchHistory();
    }
  }, [token, page, search, orderById, orderByAmount]);
  
  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1); 
  };
  
  const handleResetFilters = () => {
    setSearchInput("");
    setSearch("");
    setOrderById("");
    setOrderByAmount("");
    setPage(1);
  };

  // Fungsi untuk "Buat Transaksi"
  const handleCheckout = async () => {
    if (itemCount === 0) return;

    setIsCheckingOut(true);
    setCheckoutError("");
    try {
      const itemsToSubmit = cartItems.map(item => ({
        book_id: item.id,
        quantity: item.quantity
      }));
      
      const res = await transactionAPI.create({ items: itemsToSubmit });
      
      if (res.success) {
        alert("Checkout successful!");
        clearCart(); // Kosongkan keranjang
        fetchHistory(); // Refresh riwayat transaksi
      }
    } catch (err: any) {
      setCheckoutError(err.message || "Checkout failed. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* BAGIAN 1: KERANJANG BELANJA (Buat Transaksi) */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h1 className="text-2xl font-bold mb-4">My Cart</h1>
        {checkoutError && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {checkoutError}
          </div>
        )}
        {cartItems.length === 0 ? (
          <p className="text-gray-500">Your cart is empty.</p>
        ) : (
          <>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-gray-600">${item.price.toFixed(2)} x {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      max={item.stock_quantity}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                      className="w-16 text-center"
                    />
                    <Button variant="danger" onClick={() => removeFromCart(item.id)}>Remove</Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-right">
              <p className="text-xl font-bold">Total: ${totalPrice.toFixed(2)}</p>
              <Button onClick={handleCheckout} disabled={isCheckingOut} className="mt-4">
                {isCheckingOut ? "Processing..." : "Checkout"}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* BAGIAN 2: RIWAYAT TRANSAKSI (List Transaksi) */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Transaction History</h1>

        {/* Filter (Sesuai BooksList) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <Input
            placeholder="Search by Transaction ID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg"
            value={orderById}
            onChange={(e) => setOrderById(e.target.value)}
          >
            <option value="">Sort by ID</option>
            <option value="asc">ID A-Z</option>
            <option value="desc">ID Z-A</option>
          </select>
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg"
            value={orderByAmount}
            onChange={(e) => setOrderByAmount(e.target.value)}
          >
            <option value="">Sort by Amount</option>
            <option value="asc">Lowest First</option>
            <option value="desc">Highest First</option>
          </select>
          <div className="flex gap-2">
            <Button onClick={handleSearch}>Search</Button>
            <Button variant="secondary" onClick={handleResetFilters}>Reset</Button>
          </div>
        </div>

        {/* List Data */}
        {historyLoading && <p>Loading history...</p>}
        {historyError && <p className="text-red-500">{historyError}</p>}
        {!historyLoading && !historyError && history.length === 0 && (
          <p className="text-gray-500 text-center py-4">No transaction history found.</p>
        )}
        
        <div className="space-y-3">
          {history.map(tx => (
            <div key={tx.id} className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <p className="font-mono text-sm text-gray-600">{tx.id}</p>
                <p className="font-semibold text-lg">${tx.total_price.toFixed(2)} ({tx.total_quantity} items)</p>
              </div>
              <Link to={`/transactions/${tx.id}`}>
                <Button variant="secondary">View Details</Button>
              </Link>
            </div>
          ))}
        </div>
        
        {/* Pagination (Sesuai BooksList) */}
        {meta && meta.total > 0 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button onClick={() => setPage(page - 1)} disabled={!meta.prev_page} variant="secondary">
              Previous
            </Button>
            <span className="text-gray-700">Page {meta.page} of {Math.ceil(meta.total / meta.limit)}</span>
            <Button onClick={() => setPage(page + 1)} disabled={!meta.next_page} variant="secondary">
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}