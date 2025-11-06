import { Router } from "express";
import prisma from "../db/prisma";
import { verifyToken } from "../middlewares/authMiddleware";

const router = Router();

// CREATE GENRE (Protected)
router.post("/", verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    // Check duplicate
    const existing = await prisma.genre.findFirst({
      where: { name, deleted_at: null },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Genre already exists",
      });
    }

    const genre = await prisma.genre.create({
      data: { name },
      select: { id: true, name: true, created_at: true },
    });

    return res.status(201).json({
      success: true,
      message: "Genre created successfully",
      data: genre,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// GET ALL GENRES (Public - No Auth)
router.get("/", async (req, res) => {
  try {
    const {
      page = "1",
      limit = "10",
      search = "",
      orderByName = "asc",
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where = {
      deleted_at: null,
      ...(search && {
        name: { contains: search as string, mode: "insensitive" as any },
      }),
    };

    const [genres, total] = await Promise.all([
      prisma.genre.findMany({
        where,
        select: { id: true, name: true },
        orderBy: { name: orderByName === "desc" ? "desc" : "asc" },
        skip,
        take: limitNum,
      }),
      prisma.genre.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return res.json({
      success: true,
      message: "Get all genre successfully",
      data: genres,
      meta: {
        page: pageNum,
        limit: limitNum,
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

// GET GENRE BY ID (Public)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const genre = await prisma.genre.findFirst({
      where: { id, deleted_at: null },
      select: { id: true, name: true },
    });

    if (!genre) {
      return res.status(404).json({
        success: false,
        message: "Genre not found",
      });
    }

    return res.json({
      success: true,
      message: "Get genre detail successfully",
      data: genre,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// UPDATE GENRE (Protected)
router.patch("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    const genre = await prisma.genre.findFirst({
      where: { id, deleted_at: null },
    });

    if (!genre) {
      return res.status(404).json({
        success: false,
        message: "Genre not found",
      });
    }

    const updated = await prisma.genre.update({
      where: { id },
      data: { name },
      select: { id: true, name: true, updated_at: true },
    });

    return res.json({
      success: true,
      message: "Genre updated successfully",
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

// DELETE GENRE (Soft Delete - Protected)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const genre = await prisma.genre.findFirst({
      where: { id, deleted_at: null },
    });

    if (!genre) {
      return res.status(404).json({
        success: false,
        message: "Genre not found",
      });
    }

    // Soft delete - set deleted_at
    await prisma.genre.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return res.json({
      success: true,
      message: "Genre removed successfully",
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