import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { email, logout } = useAuth();
  const nav = useNavigate();

  return (
    <nav>
      <Link to="/books">Books</Link>
      <Link to="/transactions">Transaksi</Link>

      {email ? (
        <>
          <span>{email}</span>
          <button
            onClick={() => {
              logout();
              nav("/login");
            }}
          >
            Logout
          </button>
        </>
      ) : (
        <Link to="/login">Login</Link>
      )}
    </nav>
  );
}
