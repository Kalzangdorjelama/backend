import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  // Google: https://drive.google.com/file/d/1EtaGMcA38GLmj8nm88s1EjLjHrk0ER19/view?usp=drivesdk

  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    // console.log("token: ",token);

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // console.log("decodedToken: ",decodedToken);

    const user = await User.findById(decodedToken?._id).select(
      // "-password -refreshToken"
      "-password -refreshToken"
    );

    // console.log("user: ",user);

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    req.user = user;
    // console.log("req.user: ",req.user);

    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
