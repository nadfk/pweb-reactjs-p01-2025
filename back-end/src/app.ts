import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth";
import healthRoutes from "./routes/health";
import genreRoutes from "./routes/genre";
import booksRoutes from "./routes/books";
import transactionRoutes from "./routes/transaction";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/health-check", healthRoutes);
app.use("/genre", genreRoutes);
app.use("/books", booksRoutes);
app.use("/transactions", transactionRoutes);

export default app;
