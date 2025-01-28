import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweets.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

//this function is working as create tweets
const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  // console.log(req.body)

  //debugg
  // console.log(content);

  if (!content || !content.trim()) {
    throw new ApiError(400, "Tweet cannot be empty");
  }

  const tweet = await Tweet.create({
    content,
    owner: req.user?._id,
  });

  //debbug
  console.log(tweet);

  if (!tweet) {
    throw new ApiError(500, "Error while adding tweets");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet created successfully"));
});

// get tweets by their UserById wise
const getUserByTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!userId || !isValidObjectId(userId)) {
    throw new ApiError(400, "No valid user Id found");
  }

  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: parseInt(limit),
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
        isLiked: {
          $cond: {
            if: {
              $in: [req.user?._id, "$likes.likedBy"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        content: 1,
        owner: 1,
        likesCount: 1,
        isLiked: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  if (!tweets || tweets.length === 0) {
    throw new ApiError(401, "Error while retrieved tweets");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "User tweets retrieved successfully"));
});

//get all tweets
const getAllTweets = asyncHandler(async (req, res) => {
  const { page = 1, limit = 35 } = req.query;

  const tweets = await Tweet.aggregate([
    {
      $sort: { createdAt: -1 },
    },
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: parseInt(limit),
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
        isLiked: {
          $cond: {
            if: {
              $in: [req.user?._id, "$likes.likedBy"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        content: 1,
        owner: 1,
        likesCount: 1,
        isLiked: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  if (!tweets) {
    throw new ApiError(401, "Error while fetching tweets");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, tweets, "Get all tweets retrieved successfully")
    );
});

//update the tweets
const updatedTweet = asyncHandler(async (req, res) => {
  // console.log("Request Params: ", req.params); // Log request params
  // console.log("Request Body: ", req.body); // Log request body

  const { content } = req.body;
  const tweetId = req.params.tweetId;

  // console.log("Content: ", content); // Log content
  // console.log("Tweet ID: ", tweetId); // Log tweetId

  if (!content?.trim()) {
    throw new ApiError(401, "tweet cannot be empty");
  }

  if (!tweetId || !isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet Id");
  }

  const tweets = await Tweet.findById(tweetId);
  if (!tweets) {
    throw new ApiError(500, "Tweet not found");
  }

  if (tweets.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      401,
      "You are not the owner of this tweet and you do not have any permission to update this tweet."
    );
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: { content },
    },
    {
      new: true,
    }
  );

  if (!updatedTweet) {
    throw new ApiError(400, "Error while updating tweets");
  }

  const tweetWithDetails = await Tweet.aggregate([
    {
      $match: { _id: updatedTweet._id },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: { $first: "$owner" },
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$likes" },
        isLiked: {
          $cond: {
            if: {
              $in: [req.user?._id, "$likes.likedBy"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        content: 1,
        owner: 1,
        likesCount: 1,
        isLiked: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  if (!tweetWithDetails.length) {
    throw new ApiError(400, "Error while retrieving updated tweet details");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        tweetWithDetails[0],
        "Tweet details retrieved successfully"
      )
    );
});

//delete the tweets
const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId || !isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet Id");
  }

  const tweets = await Tweet.findById(tweetId);
  if (!tweets) {
    throw new ApiError(500, "Tweet not found");
  }

  if (tweets.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(401, "You do not have permission to delete this tweet");
  }

  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

  if (!deletedTweet) {
    throw new ApiError(400, "Error while deleting tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deletedTweet, "Tweet deleted successfully"));
});

export {
  createTweet,
  deleteTweet,
  getAllTweets,
  getUserByTweets,
  updatedTweet,
};
