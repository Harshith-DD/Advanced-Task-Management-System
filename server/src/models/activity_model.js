import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: [
                "taskCreated",
                "taskUpdated",
                "taskAssigned",
                "taskCompleted"
            ],
            required: true
        },

        task: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
            required: true
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        message: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

const Activity =
    mongoose.model(
        "Activity",
        activitySchema
    );

export default Activity;