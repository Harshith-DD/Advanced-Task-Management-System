import mongoose from "mongoose";

import AppError, {
    ValidationError,
    DatabaseError,
    ConflictError
} from "../errors/app_error.js";


// ========================================
// CENTRAL ERROR HANDLER
// ========================================

export function errorHandler(
    error,
    req,
    res,
    next
) {
    console.error(
        `${req.method} ${req.originalUrl}`,
        error
    );


    // ----------------------------------------
    // MONGOOSE VALIDATION ERROR
    // ----------------------------------------

    if (
        error instanceof mongoose.Error.ValidationError
    ) {
        const messages =
            Object.values(error.errors)
                .map(
                    (item) => item.message
                );

        error =
            new ValidationError(
                messages.join(", ")
            );
    }


    // ----------------------------------------
    // MONGOOSE CAST ERROR
    // ----------------------------------------

    else if (
        error instanceof mongoose.Error.CastError
    ) {
        error =
            new ValidationError(
                `Invalid ${error.path}`
            );
    }


    // ----------------------------------------
    // MONGOOSE DUPLICATE KEY ERROR
    // ----------------------------------------

    else if (
        error?.code === 11000
    ) {
        error =
            new ConflictError(
                "A resource with the same unique value already exists"
            );
    }


    // ----------------------------------------
    // MONGOOSE / DATABASE ERROR
    // ----------------------------------------

    else if (
        error?.name === "MongoServerError" ||
        error?.name === "MongoNetworkError"
    ) {
        error =
            new DatabaseError();
    }


    // ----------------------------------------
    // UNKNOWN ERROR
    // ----------------------------------------

    if (!(error instanceof AppError)) {
        error =
            new AppError(
                "Internal server error"
            );
    }


    // ----------------------------------------
    // SEND RESPONSE
    // ----------------------------------------

    const response = {
        success: false,

        error: {
            code: error.code,
            message: error.message
        }
    };


    // Include stack only during development.
    if (
        process.env.NODE_ENV === "development"
    ) {
        response.error.stack =
            error.stack;
    }


    return res
        .status(error.statusCode)
        .json(response);
}