import type { NextFunction, Request, Response } from "express"


export interface IError extends Error {
    statusCode: number;
}
export class ApplicationError extends Error {
    constructor(
        public override message: string,
        public statusCode: Number = 400,
        public override cause?: unknown
    ) {
        super()
        this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor)
    }
}


export class NotFoundException extends ApplicationError {
    constructor(
        message: string,
        cause?: unknown
    ) {
        super(message, 404, cause)
        this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor)
    }
}
export class UnauthorizedException extends ApplicationError {
    constructor(
        message: string,
        cause?: unknown
    ) {
        super(message, 401, cause)
        this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor)
    }
}


export class ForbiddenException extends ApplicationError {
    constructor(
        message: string,
        cause?: unknown
    ) {
        super(message, 403, cause)
        this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor)
    }
}

export class ConflictException extends ApplicationError {
    constructor(
        message: string,
        cause?: unknown
    ) {
        super(message, 409, cause)
        this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor)
    }
}

export class BadRequestException extends ApplicationError {
    constructor(
        message: string,
        cause?: unknown
    ) {
        super(message, 400, cause)
        this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor)
    }
}

export const globalErrorHandling = (error: IError, req: Request, res: Response, next: NextFunction) => {
    return res.status(error.statusCode || 500).json({
        err_message: error.message || `something went wrong`,
        stack: process.env.MOOD === 'development' ? error.stack : undefined,
        cause: error.cause,
        error
    })
}
