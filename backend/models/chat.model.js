import mongoose from "mongoose";

const messageResultSchema = new mongoose.Schema(
  {
    company: { type: String, required: true },
    report: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { _id: false },
);

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: { type: String, required: true },
    results: { type: [messageResultSchema], default: undefined },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const chatSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    messages: { type: [messageSchema], default: [] },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Chat", chatSchema);
