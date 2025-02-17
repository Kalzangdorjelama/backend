import { Router } from "express";
import { createTweet } from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/create-tweet").post(createTweet);

export default router;
