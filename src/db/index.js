import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// Google: https://drive.google.com/file/d/1BabCrydaFTshv92Ijt_jh2_iQ1ilAFUZ/view
const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      `\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("❌ MONGODB connection FAILED... 🥺", error.message);
    process.exit(1);
  }
};

export default connectDB;
