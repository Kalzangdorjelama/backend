import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // file has been uploaded successfull
    // console.log("file is uploaded on cloudinary ", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
    return null;
  }
};

// Google: https://drive.google.com/file/d/1xGigl27-7f9EGnrC0qZiYqm77hW1-U2h/view
const deleteImageFromCloudinary = async (imageUrl) => {
  try {
    // Extract the public ID from the Cloudinary image URL
    // Example URL: https://res.cloudinary.com/demo/image/upload/v1612453403/sample.jpg
    const publicId = imageUrl.split("/").pop().split(".")[0];

    // Delete the image from Cloudinary using its public ID
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === "ok") {
      console.log("Image deleted successfully");
    } else {
      console.log("Failed to delete image");
    }
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
  }
};

export { uploadOnCloudinary, deleteImageFromCloudinary };
