import { Router } from "express";
import prisma from "../db/prisma";
import { verifyToken } from "../middlewares/authMiddleware";

const router = Router();

// CREATE BOOK (Protected)
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      title,
      writer,
      publisher,
      publication_year,
      description,
      price,
      stock_quantity,
      genre_id,
    } = req.body;

    // Validasi required fields
    if (
      !title ||
      !writer ||
      !publisher ||
      !publication_year ||
      price === undefined ||
      stock_quantity === undefined ||
      !genre_id
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields except description are required",
      });
    }

    // Cek duplikasi judul
    const existingBook = await prisma.book.findFirst({
      where: { title, deleted_at: null },
    });

    if (existingBook) {
      return res.status(409).json({
        success: false,
        message: "Book with this title already exists",
      });
    }

    // Cek genre exists
    const genre = await prisma.genre.findFirst({
      where: { id: genre_id, deleted_at: null },
    });

    if (!genre) {
      return res.status(404).json({
        success: false,
        message: "Genre not found",
      });
    }

    const book = await prisma.book.create({
      data: {
        title,
        writer,
        publisher,
        publication_year: parseInt(publication_year),
        description: description || null,
        price: parseFloat(price),
        stock_quantity: parseInt(stock_quantity),
        genre_id,
      },
      select: { id: true, title: true, created_at: true },
    });

    return res.status(201).json({
      success: true,
      message: "Book added successfully",
      data: book,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// GET ALL BOOKS (Protected)
router.get("/", verifyToken, async (req, res) => {
  try {
    const {
      page = "1",
      limit = "5",
      search = "",
      orderByTitle = "",
      orderByPublishDate = "",
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      deleted_at: null,
    };

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: "insensitive" } },
        { writer: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const orderBy: any = [];
    if (orderByTitle) {
      orderBy.push({ title: orderByTitle === "desc" ? "desc" : "asc" });
    }
    if (orderByPublishDate) {
      orderBy.push({
        publication_year: orderByPublishDate === "desc" ? "desc" : "asc",
      });
    }
    if (orderBy.length === 0) {
      orderBy.push({ created_at: "desc" });
    }

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        select: {
          id: true,
          title: true,
          writer: true,
          publisher: true,
          description: true,
          publication_year: true,
          price: true,
          stock_quantity: true,
          genre: { select: { name: true } },
        },
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.book.count({ where }),
    ]);

    const formattedBooks = books.map((book) => ({
      id: book.id,
      title: book.title,
      writer: book.writer,
      publisher: book.publisher,
      description: book.description,
      publication_year: book.publication_year,
      price: book.price,
      stock_quantity: book.stock_quantity,
      genre: book.genre.name,
    }));

    const totalPages = Math.ceil(total / limitNum);

    return res.json({
      success: true,
      message: "Get all book successfully",
      data: formattedBooks,
      meta: {
        page: pageNum,
        limit: limitNum,
        total: total, // <-- FIX: Tambahkan total
        prev_page: pageNum > 1 ? pageNum - 1 : null,
        next_page: pageNum < totalPages ? pageNum + 1 : null,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// GET BOOKS BY GENRE (Protected)
router.get("/genre/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page = "1",
      limit = "5",
      search = "",
      orderByTitle = "",
      orderByPublishDate = "",
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Cek genre exists
    const genre = await prisma.genre.findFirst({
      where: { id, deleted_at: null },
    });

    if (!genre) {
      return res.status(404).json({
        success: false,
        message: "Genre not found",
      });
    }

    const where: any = {
      genre_id: id,
      deleted_at: null,
    };

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: "insensitive" } },
        { writer: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const orderBy: any = [];
    if (orderByTitle) {
      orderBy.push({ title: orderByTitle === "desc" ? "desc" : "asc" });
    }
    if (orderByPublishDate) {
      orderBy.push({
        publication_year: orderByPublishDate === "desc" ? "desc" : "asc",
      });
    }
    if (orderBy.length === 0) {
      orderBy.push({ created_at: "desc" });
    }

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        select: {
          id: true,
          title: true,
          writer: true,
          publisher: true,
          description: true,
          publication_year: true,
          price: true,
          stock_quantity: true,
          genre: { select: { name: true } },
        },
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.book.count({ where }),
    ]);

    const formattedBooks = books.map((book) => ({
      id: book.id,
      title: book.title,
      writer: book.writer,
      publisher: book.publisher,
      description: book.description,
      genre: book.genre.name,
      publication_year: book.publication_year,
      price: book.price,
      stock_quantity: book.stock_quantity,
    }));

    const totalPages = Math.ceil(total / limitNum);

    return res.json({
      success: true,
      message: "Get all book by genre successfully",
      data: formattedBooks,
      meta: {
        page: pageNum,
        limit: limitNum,
        total: total, // <-- FIX: Tambahkan total
        prev_page: pageNum > 1 ? pageNum - 1 : null,
        next_page: pageNum < totalPages ? pageNum + 1 : null,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// GET BOOK BY ID (Protected)
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const book = await prisma.book.findFirst({
      where: { id, deleted_at: null },
      select: {
        id: true,
        title: true,
        writer: true,
        publisher: true,
        description: true,
        publication_year: true,
        price: true,
        stock_quantity: true,
        genre: { select: { name: true } },
      },
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    return res.json({
      success: true,
      message: "Get book detail successfully",
      data: {
        id: book.id,
        title: book.title,
        writer: book.writer,
        publisher: book.publisher,
        description: book.description,
        publication_year: book.publication_year,
        price: book.price,
        stock_quantity: book.stock_quantity,
        genre: book.genre.name,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// UPDATE BOOK (Protected)
router.patch("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { description, price, stock_quantity } = req.body;

    const book = await prisma.book.findFirst({
      where: { id, deleted_at: null },
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    const updateData: any = {};
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (stock_quantity !== undefined)
      updateData.stock_quantity = parseInt(stock_quantity);

    const updated = await prisma.book.update({
      where: { id },
      data: updateData,
      select: { id: true, title: true, updated_at: true },
    });

    return res.json({
      success: true,
      message: "Book updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// DELETE BOOK (Soft Delete - Protected)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const book = await prisma.book.findFirst({
      where: { id, deleted_at: null },
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    await prisma.book.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return res.json({
      success: true,
      message: "Book removed successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;