import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  const currentDate = new Date().toDateString();
  return res.json({
    success: true,
    message: "Hello World!",
    data: currentDate,
  });
});

export default router;