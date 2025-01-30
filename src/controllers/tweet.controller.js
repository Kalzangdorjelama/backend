import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  // get content from req.body
  // check if content is empty
  // create tweet
  // return response

  const { content } = req.body;
  // console.log("content: ", content);

  // !content.trim() → If content is a string, .trim() removes whitespace from both ends. If the trimmed result is an empty string (""), the condition is true.
  if (!content || !content.trim()) {
    throw new ApiError(400, "Tweet cannot be empty");
  }

  const tweet = await Tweet.create({
    content,
    owner: req.user._id,
  });
  // console.log(tweet);
  if (!tweet) {
    throw new ApiError(500, "Error while adding tweets");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet is created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  //TODO: update tweet
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
