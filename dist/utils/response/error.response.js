"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandling = exports.BadRequestException = exports.ConflictException = exports.ForbiddenException = exports.UnauthorizedException = exports.NotFoundException = exports.ApplicationError = void 0;
class ApplicationError extends Error {
    message;
    statusCode;
    cause;
    constructor(message, statusCode = 400, cause) {
        super();
        this.message = message;
        this.statusCode = statusCode;
        this.cause = cause;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApplicationError = ApplicationError;
class NotFoundException extends ApplicationError {
    constructor(message, cause) {
        super(message, 404, cause);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.NotFoundException = NotFoundException;
class UnauthorizedException extends ApplicationError {
    constructor(message, cause) {
        super(message, 401, cause);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.UnauthorizedException = UnauthorizedException;
class ForbiddenException extends ApplicationError {
    constructor(message, cause) {
        super(message, 403, cause);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ForbiddenException = ForbiddenException;
class ConflictException extends ApplicationError {
    constructor(message, cause) {
        super(message, 409, cause);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ConflictException = ConflictException;
class BadRequestException extends ApplicationError {
    constructor(message, cause) {
        super(message, 400, cause);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.BadRequestException = BadRequestException;
const globalErrorHandling = (error, req, res, next) => {
    return res.status(error.statusCode || 500).json({
        err_message: error.message || `something went wrong`,
        stack: process.env.MOOD === 'development' ? error.stack : undefined,
        cause: error.cause,
        error
    });
};
exports.globalErrorHandling = globalErrorHandling;
