import { Router } from "express";
import {
  createTweet,
  deleteTweet,
  getAllTweets,
  getUserByTweets,
  updatedTweet,
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/create-tweet").post(createTweet);
router.route("/user/:userId").get(getUserByTweets);
router.route("/all-tweet").get(getAllTweets);
router.route("/:tweetId").patch(updatedTweet).delete(deleteTweet);

export default router;
