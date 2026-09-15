class AppError extends Error {
    constructor(
        message,
        statusCode = 500,
        code = "INTERNAL_SERVER_ERROR"
    ) {
        super(message);

        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;

        Error.captureStackTrace(
            this,
            this.constructor
        );
    }
}


export class ValidationError extends AppError {
    constructor(message = "Validation failed") {
        super(
            message,
            400,
            "VALIDATION_ERROR"
        );
    }
}


export class AuthenticationError extends AppError {
    constructor(
        message = "Authentication required"
    ) {
        super(
            message,
            401,
            "AUTHENTICATION_ERROR"
        );
    }
}


export class AuthorizationError extends AppError {
    constructor(
        message = "You are not allowed to perform this action"
    ) {
        super(
            message,
            403,
            "AUTHORIZATION_ERROR"
        );
    }
}


export class NotFoundError extends AppError {
    constructor(
        message = "Resource not found"
    ) {
        super(
            message,
            404,
            "NOT_FOUND"
        );
    }
}


export class ConflictError extends AppError {
    constructor(
        message = "Resource conflict"
    ) {
        super(
            message,
            409,
            "CONFLICT"
        );
    }
}


export class DatabaseError extends AppError {
    constructor(
        message = "Database operation failed"
    ) {
        super(
            message,
            500,
            "DATABASE_ERROR"
        );
    }
}


export class QueueError extends AppError {
    constructor(
        message = "Background job processing failed"
    ) {
        super(
            message,
            500,
            "QUEUE_ERROR"
        );
    }
}


export default AppError;