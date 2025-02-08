import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      //   type: mongoose.Schema.Types.ObjectId,
      //   Google: https://drive.google.com/file/d/1mdyuhksw9R02qMIjHzeTu_VffVpE_CHg/view
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const Comment = mongoose.model("Comment", commentSchema);
