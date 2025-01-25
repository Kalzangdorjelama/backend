import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {
  uploadOnCloudinary,
  deleteImageFromCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { verifyJWT } from "../middlewares/auth.middleware.js";

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
  // console.log(req.file?.path);

  // Validation
  // Google: https://drive.google.com/file/d/1JUmfOomobNmZ3hhw6EWRhM5kjo72wE8d/view
  // Google-Optional chaining (?.): https://drive.google.com/file/d/1uK7TDt0PXcgpVH3Q2oGLgsNkfotfStLO/view
  if (
    [fullName, email, username, password].some(
      (field) =>
        /*console.log("field ma k aako xa: ",field */ field?.trim() === ""
    )
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
  // Google: https://drive.google.com/file/d/1rzRIRp4vC_TtjtZJZDweDCWFUqMeJXy6/view
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
  // find the user and remove the refresh token
  // clear the cookies
  // send response

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

// changeCurrentPassword controller
const changeCurrentPassword = asyncHandler(async (req, res) => {
  // get the old password and new password from the request
  // find the user
  // check if the old password is correct
  // update the password
  // send the response

  // Google: https://drive.google.com/file/d/1mDeRRAdeoLVe4Spacs-acV9_Ob88TYoP/view

  const { oldPassword, newPassword } = req.body;
  //  console.log("here is the password: ",req.body);

  const user = await User.findById(req.user?._id);
  // console.log("user: ",user);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  // console.log("correct password: ", isPasswordCorrect);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  // console.log("The new change password is: ",user.password);

  // Google: https://drive.google.com/file/d/1a49xHWU0D4o9basjBQY-rTsrHBVURkk4/view
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

// getCurrentUser  controller
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

// updateAccountDetails controller
const updateAccountDetails = asyncHandler(async (req, res) => {
  // get the full name and email from the request
  // update the user details
  // send the response

  const { fullName, email } = req.body;
  // console.log("fullname and email :", req.body);

  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      // Google: https://drive.google.com/file/d/1pOyFo0NjBfkVXLhUq4Q5BYGgLsqDZs5z/view
      $set: {
        fullName,
        email,
      },
    },
    // if we write new: true then update baye ko information return hunxa hai
    { new: true }
  ).select("-password");
  // console.log("Email: ", user.email);
  // console.log("FullName: ", user.fullName);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

// updateUserAvatar controller
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  // Google: https://drive.google.com/file/d/123CU82roxcD93kxI4rSfn4Yk2bPU1664/view
  // console.log(avatarLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  // delete old avatar from cloudinary
  const userdetails = await User.findById(req.user?._id);
  // console.log(user.avatar);
  const removeAvatar = await deleteImageFromCloudinary(userdetails.avatar);

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");
  // console.log("Ther avatar is: ", user.avatar);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image updated successfully"));
});

// updateUserCoverImage controller
const updateUserCoverImage = asyncHandler(async (req, res) => {
  // Google: https://drive.google.com/file/d/123CU82roxcD93kxI4rSfn4Yk2bPU1664/view
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "CoverImage file is missing");
  }

  // delete old CoverImage from cloudinary
  const userdetails = await User.findById(req.user?._id);
  console.log(userdetails.coverImage);
  const removeCoverImage = await deleteImageFromCloudinary(
    userdetails.coverImage
  );

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading on CoverImage");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "CoverImage updated successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
};
