import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// register route
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

// loginUser route
router.route("/login").post(loginUser);

// ----------------- secured routes ---------------------

// logoutUser route
router.route("/logout").post(verifyJWT, logoutUser);

// refresh-token route
router.route("/refresh-token").post(refreshAccessToken);

// change-password route
router.route("/change-password").post(verifyJWT, changeCurrentPassword);

// current-user controller
router.route("/current-user").get(verifyJWT, getCurrentUser);

// update-account controller
router.route("/update-account").patch(verifyJWT, updateAccountDetails);

// update-avatar controller
router
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

// update-coverImage controller
router
  .route("/cover-image")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

export default router;
