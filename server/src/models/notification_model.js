import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        type: {
            type: String,
            enum: [
                "taskAssigned",
                "taskCompleted",
                "taskPriorityChanged"
            ],
            required: true
        },

        task: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
            required: true
        },

        message: {
            type: String,
            required: true,
            trim: true
        },

        read: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

const Notification =
    mongoose.model(
        "Notification",
        notificationSchema
    );

export default Notification;