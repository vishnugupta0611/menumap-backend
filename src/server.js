import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import http from "http";
import rateLimit from "express-rate-limit";
import pino from "pino";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import { connectDB } from "./db.js";
import { ocrRouter } from "./routes/ocr.js";
import { qrRouter } from "./routes/qr.js";
import { restaurantsRouter } from "./routes/restaurants.js";
import { searchRouter } from "./routes/search.js";
import { createOrdersRouter } from "./routes/orders.js";
import { authRouter } from "./routes/auth.js";
import { localOrdersRouter } from "./routes/localOrders.js";
import { dummyRouter } from "./routes/dummy.js";
import { errorHandler, notFound } from "./middleware/error-handler.js";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 60 * 1000, limit: 120 }));
app.use(pinoHttp({ logger }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "MenuMap Express API" });
});

app.use("/api/auth", authRouter);
app.use("/api/restaurants", restaurantsRouter);
app.use("/api/search", searchRouter);
app.use("/api/qr", qrRouter);
app.use("/api/ocr", ocrRouter);
app.use("/api/orders", createOrdersRouter(io));
app.use("/api/local-orders", localOrdersRouter);
app.use("/api/dummy", dummyRouter);
app.use(notFound);
app.use(errorHandler);

io.on("connection", (socket) => {
  socket.on("restaurant:join", (restaurantId) => {
    socket.join(restaurantId);
  });
});

const port = process.env.PORT || 4000;

// Connect to Database and start server
async function startServer() {
  await connectDB(logger);
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      logger.error(`Port ${port} is already in use. Stop the existing process or set PORT to another value.`);
      process.exit(1);
    }

    logger.error({ error }, "HTTP server failed");
    process.exit(1);
  });

  server.listen(port, () => {
    logger.info(`MenuMap API listening on http://localhost:${port}`);
  });
}

startServer();
