import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

// user to register controller
const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for avatar, check for image
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  // get user data from frontend
  const { fullName, email, username, password } = req.body;
  // console.log("email: ", email);

  // console.log(req.body);
  // console.log(req.files);

  // Validation
  // Google: https://drive.google.com/file/d/1JUmfOomobNmZ3hhw6EWRhM5kjo72wE8d/view
  // Google-Optional chaining (?.): https://drive.google.com/file/d/1uK7TDt0PXcgpVH3Q2oGLgsNkfotfStLO/view
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // check if user already exist in the database
  const existUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  // const existUser = User.findOne({username}) // for checking only the username
  if (existUser) {
    throw new ApiError(409, "User already exist");
  }

  // check for avatar, check for image
  // The optional chaining (?.) operator accesses an object's property or calls a function. If the object accessed or function called using this operator is undefined or null, the expression short circuits and evaluates to undefined instead of throwing an error.
  const avatarLocalPath = req.files?.avatar[0]?.path;

  // const coverImageLocalPath = req.files?.coverImage[0]?.path; // TypeError: Cannot read properties of undefined (reading &#39;0&#39;) yo aauxa if the coverImage is not send but below code can fixed this type of error so better use below code  just try both code one by one in your VsCode
  // Google: https://drive.google.com/file/d/1OJOtiy8pGNP1_T4qQYETSP15p8t_b4SW/view

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  // if (!coverImageLocalPath) {
  //   throw new ApiError(400, "coverImage file is required");
  // }

  // upload them to cloudinary, avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  // create user obj - create entry in database
  const user = await User.create({
    fullName,
    email,
    password,
    username: username.toLowerCase(),
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  // remove password and refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // check for user creation
  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering the user");
  }

  // return response
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

// user to login controller
const loginUser = asyncHandler(async (req, res) => {
  // req body -> data
  // username or email
  // find the user
  // password check
  // access and referesh token
  // send cookie

  // req body -> data
  const { email, username, password } = req.body;

  // username or email
  if (!(username || email)) {
    throw new ApiError(400, "username or email is required");
  }

  // find the user
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // password check
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentails");
  }

  // access and referesh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // send cookie
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

// user to logout controller
const logoutUser = asyncHandler(async (req, res) => {
  // req body -> data
  // username or email
  // find the user
  // password check
  // access and referesh token
  // send cookie

  // Google: https://drive.google.com/file/d/18sjdeRHWyjoLm9tz_B-tLxNXjnniQRFr/view
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

// refreshAccessToken controller
const refreshAccessToken = asyncHandler(async (req, res) => {
  // get the refresh token from the request
  // verify the refresh token
  // find the user
  // check if the refresh token is valid
  // generate new access and refresh token
  // send the new access and refresh token as a response

  // Google: https://drive.google.com/file/d/15uZo0189PoTYxzA4S4bt9_3EFDWaB3r9/view
  // get the refresh token from the request
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    // Google: https://drive.google.com/file/d/1QL7ezU-TYSK3aDRW2bFnxwz7h_sUmHRM/view
    // verify the refresh token
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    //Google: https://drive.google.com/file/d/1uK7TDt0PXcgpVH3Q2oGLgsNkfotfStLO/view
    // find the user
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    // check if the refresh token is valid
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    // generate new access and refresh token
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    // send the new access and refresh token
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});



export { registerUser, loginUser, logoutUser, refreshAccessToken };

