import multer from "multer";

// Google: https://drive.google.com/file/d/1GK4aPK_mI_2fqtz3dfvprs1dirQU7Lz3/view
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

export const upload = multer({
  storage,
});
