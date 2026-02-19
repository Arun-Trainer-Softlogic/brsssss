import mongoose from "mongoose";

const kafkaRetrySchema = new mongoose.Schema({
    _id: { _id: String },
    retry: { type: Number },
    error: { type: String }
}, {
    timestamps: true
});

const kafkaRetry = mongoose.model("kafkaRetry", kafkaRetrySchema);

export { kafkaRetry };