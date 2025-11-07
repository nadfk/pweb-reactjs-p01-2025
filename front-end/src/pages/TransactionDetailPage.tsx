import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { transactionAPI } from "../services/api";
import Button from "../components/Button";

// Tipe data untuk Detail Transaksi (dari API)
interface TransactionItem {
  book_id: string;
  book_title: string;
  quantity: number;
  subtotal_price: number;
}

interface TransactionDetail {
  id: string;
  items: TransactionItem[];
  total_quantity: number;
  total_price: number;
}

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    
    const fetchDetail = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await transactionAPI.getById(id);
        if (res.success) {
          setTransaction(res.data);
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch transaction details");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600">Loading transaction details...</p>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-red-100 text-red-700 p-4 rounded">
          {error || "Transaction not found"}
        </div>
        <Link to="/transactions">
          <Button variant="secondary" className="mt-4">
            ← Back to Transactions
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to="/transactions">
        <Button variant="secondary" className="mb-4">
          ← Back to Transactions
        </Button>
      </Link>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-2">Transaction Detail</h1>
        <p className="text-sm font-mono text-gray-500 mb-6">{transaction.id}</p>
        
        <div className="space-y-4 mb-6">
          {transaction.items.map((item, index) => (
            <div key={index} className="flex justify-between items-center border-b pb-2">
              <div>
                <p className="font-semibold">{item.book_title}</p>
                <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
              </div>
              <p className="text-lg font-medium">${item.subtotal_price.toFixed(2)}</p>
            </div>
          ))}
        </div>
        
        <div className="text-right space-y-2">
          <p className="text-lg">
            Total Items: <span className="font-bold">{transaction.total_quantity}</span>
          </p>
          <p className="text-2xl font-bold">
            Total Price: <span className="text-green-600">${transaction.total_price.toFixed(2)}</span>
          </p>
        </div>
      </div>
    </div>
  );
}