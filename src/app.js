import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// routes import

// user route
import userRouter from "./routes/user.routes.js";
// tweet route
import tweetRouter from "./routes/tweet.routes.js";

// routes decleration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/tweets", tweetRouter);

// http://localhost:8000/api/v1/users/register

// app.use("/api/v1/users", tweetRouter);

export { app };
