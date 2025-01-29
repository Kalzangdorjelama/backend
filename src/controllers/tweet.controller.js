import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  // console.log(req.body)

  // console.log(content);

  if (!content || !content.trim()) {
    throw new ApiError(400, "Tweet cannot be empty");
  }

  const tweet = await Tweet.create({
    content,
    owner: req.user?._id,
  });

  console.log(tweet);

  if (!tweet) {
    throw new ApiError(500, "Error while adding tweets");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet created successfully"));
});

export { createTweet };
