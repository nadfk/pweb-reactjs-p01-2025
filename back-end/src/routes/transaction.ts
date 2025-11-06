import { Router } from "express";
import prisma from "../db/prisma";
import { verifyToken, AuthRequest } from "../middlewares/authMiddleware";

const router = Router();

// Terapkan middleware ke semua rute di bawah ini
router.use(verifyToken);

// ==========================================
// 1. CREATE TRANSACTION
// POST /transactions
// ==========================================
router.post("/", async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { items } = req.body as {
    items: { book_id: string; quantity: number }[];
  };

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Items array is required and cannot be empty",
    });
  }

  try {
    // 1. Ambil data buku
    const bookIds = items.map((item) => item.book_id);
    const books = await prisma.book.findMany({
      where: { id: { in: bookIds }, deleted_at: null },
    });

    // 2. Validasi stok & Kalkulasi total (HANYA UNTUK RESPONSE)
    let calculatedTotalPrice = 0;
    let calculatedTotalQuantity = 0;

    for (const item of items) {
      const book = books.find((b) => b.id === item.book_id);
      if (!book) {
        return res.status(404).json({
          success: false,
          message: `Book with ID ${item.book_id} not found`,
        });
      }
      if (book.stock_quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for book: "${book.title}"`,
        });
      }
      calculatedTotalQuantity += item.quantity;
      calculatedTotalPrice += book.price * item.quantity;
    }

    // 3. Jalankan ATOMIC TRANSACTION
    const result = await prisma.$transaction(async (tx) => {
      // a. Buat Order (TANPA total_price/total_quantity)
      const order = await tx.order.create({
        data: {
          user_id: userId,
        },
      });

      // b. Buat OrderItems (TANPA price_per_item)
      await tx.orderItem.createMany({
        data: items.map((item) => ({
          book_id: item.book_id,
          quantity: item.quantity,
          order_id: order.id,
        })),
      });

      // c. Update stok buku
      for (const item of items) {
        await tx.book.update({
          where: { id: item.book_id },
          data: { stock_quantity: { decrement: item.quantity } },
        });
      }

      return order; // Kembalikan order yg baru dibuat
    });

    // 4. Kirim response (gunakan hasil kalkulasi variabel)
    return res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      data: {
        transaction_id: result.id,
        total_quantity: calculatedTotalQuantity,
        total_price: calculatedTotalPrice,
      },
    });
  } catch (err: any) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

// ==========================================
// 2. GET TRANSACTION STATISTICS
// GET /transactions/statistics
// ==========================================
router.get("/statistics", async (req, res) => {
  try {
    // 1. Jumlah keseluruhan transaksi
    const total_transactions = await prisma.order.count();

    // 2. Kalkulasi Rata-rata (Cara Manual)
    // a. Ambil semua item dan harga bukunya
    const allOrderItems = await prisma.orderItem.findMany({
      include: {
        book: {
          select: { price: true },
        },
      },
    });

    // b. Kelompokkan total harga per order_id
    const orderTotalsMap = new Map<string, number>();
    allOrderItems.forEach((item) => {
      if (item.book) {
        const subtotal = item.quantity * item.book.price;
        const currentTotal = orderTotalsMap.get(item.order_id) || 0;
        orderTotalsMap.set(item.order_id, currentTotal + subtotal);
      }
    });

    // c. Hitung rata-rata
    const totalsArray = Array.from(orderTotalsMap.values());
    const sumOfAllTotals = totalsArray.reduce((acc, total) => acc + total, 0);
    const average_transaction_amount =
      totalsArray.length > 0 ? sumOfAllTotals / totalsArray.length : 0;

    // 3. Genre dengan transaksi (penjualan buku) paling banyak & sedikit
    
    const salesPerBook = await prisma.orderItem.groupBy({
      by: ["book_id"],
      _sum: { quantity: true },
    });

    if (salesPerBook.length === 0) {
      return res.json({
        success: true,
        message: "Get transactions statistics successfully",
        data: {
          total_transactions,
          average_transaction_amount,
          fewest_book_sales_genre: "N/A",
          most_book_sales_genre: "N/A",
        },
      });
    }

    const booksWithGenre = await prisma.book.findMany({
      where: {
        id: { in: salesPerBook.map((sale) => sale.book_id) },
      },
      select: {
        id: true,
        genre: { select: { name: true } },
      },
    });

    const salesByGenre: { [key: string]: number } = {};
    for (const sale of salesPerBook) {
      const book = booksWithGenre.find((b) => b.id === sale.book_id);
      if (book && book.genre) {
        const genreName = book.genre.name;
        const quantitySold = sale._sum.quantity || 0;
        salesByGenre[genreName] = (salesByGenre[genreName] || 0) + quantitySold;
      }
    }

    const sortedGenres = Object.entries(salesByGenre)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => a.total - b.total);

    const most_book_sales_genre =
      sortedGenres.length > 0 ? sortedGenres[sortedGenres.length - 1].name : "N/A";
    const fewest_book_sales_genre =
      sortedGenres.length > 0 ? sortedGenres[0].name : "N/A";

    // 4. Kembalikan data
    return res.json({
      success: true,
      message: "Get transactions statistics successfully",
      data: {
        total_transactions,
        average_transaction_amount,
        fewest_book_sales_genre,
        most_book_sales_genre,
      },
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

// ==========================================
// 3. GET ALL TRANSACTIONS (History)
// GET /transactions
// ==========================================
router.get("/", async (req, res) => {
  try {
    const {
      page = "1",
      limit = "5",
      search = "", // id search
      orderById = "", // 'asc' or 'desc'
      orderByAmount = "", // 'asc' or 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.id = { contains: search as string, mode: "insensitive" };
    }

    // Ambil SEMUA order terlebih dahulu untuk kalkulasi
    let allOrders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            book: {
              select: { price: true }, // Ambil harga buku
            },
          },
        },
      },
    });

    // 1. Kalkulasi manual total di JavaScript
    let calculatedOrders = allOrders.map((order) => {
      let total_quantity = 0;
      let total_price = 0;
      order.items.forEach((item) => {
        if (item.book) {
          total_quantity += item.quantity;
          total_price += item.quantity * item.book.price;
        }
      });
      return {
        id: order.id,
        total_quantity,
        total_price,
      };
    });

    // 2. Lakukan sorting di JavaScript (BUKAN di DB)
    if (orderByAmount) {
      calculatedOrders.sort((a, b) => {
        return orderByAmount === "asc"
          ? a.total_price - b.total_price
          : b.total_price - a.total_price;
      });
    } else if (orderById) {
      calculatedOrders.sort((a, b) => {
        if (orderById === "asc") {
          return a.id.localeCompare(b.id);
        } else {
          return b.id.localeCompare(a.id);
        }
      });
    } else {
      // Default sort (jika orderById juga tidak ada, kita sort by id desc)
      calculatedOrders.sort((a, b) => b.id.localeCompare(a.id));
    }

    const paginatedData = calculatedOrders.slice(skip, skip + limitNum);
    const totalData = calculatedOrders.length;
    const totalPages = Math.ceil(totalData / limitNum);

    return res.json({
      success: true,
      message: "Get all transaction successfully",
      data: paginatedData,
      meta: {
        page: pageNum,
        limit: limitNum,
        prev_page: pageNum > 1 ? pageNum - 1 : null,
        next_page: pageNum < totalPages ? pageNum + 1 : null,
      },
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

// ==========================================
// 4. GET TRANSACTION DETAIL BY ID
// GET /transactions/:id
// ==========================================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            book: {
              select: {
                title: true,
                price: true, // Ambil harga buku saat ini
              },
            },
          },
        },
      },
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found" });
    }

    // Kalkulasi manual total
    let calculatedTotalPrice = 0;
    let calculatedTotalQuantity = 0;

    const formattedItems = order.items.map((item) => {
      // Cek jika buku mungkin sudah dihapus
      const price = item.book ? item.book.price : 0;
      const title = item.book ? item.book.title : "[Book Deleted]";
      
      const subtotal_price = item.quantity * price;
      
      calculatedTotalPrice += subtotal_price;
      calculatedTotalQuantity += item.quantity;

      return {
        book_id: item.book_id,
        book_title: title,
        quantity: item.quantity,
        subtotal_price: subtotal_price,
      };
    });

    return res.json({
      success: true,
      message: "Get transaction detail successfully",
      data: {
        id: order.id,
        items: formattedItems,
        total_quantity: calculatedTotalQuantity,
        total_price: calculatedTotalPrice,
      },
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

export default router;