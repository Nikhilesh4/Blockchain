/**
 * Custom error class for API errors
 */
class ApiError extends Error {
    constructor(statusCode, message, isOperational = true, stack = '') {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

/**
 * Global error handler middleware
 * Catches all errors and sends appropriate response
 */
const errorHandler = (err, req, res, next) => {
    let { statusCode, message } = err;

    // Default to 500 Internal Server Error if not set
    statusCode = statusCode || 500;
    message = message || 'Internal Server Error';

    // Log error details
    console.error('❌ Error occurred:');
    console.error(`   Status: ${statusCode}`);
    console.error(`   Message: ${message}`);
    console.error(`   Path: ${req.method} ${req.path}`);
    
    if (process.env.NODE_ENV === 'development') {
        console.error(`   Stack: ${err.stack}`);
    }

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
    }

    if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid data format';
    }

    if (err.code === 11000) {
        statusCode = 409;
        message = 'Duplicate entry';
    }

    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }

    // Blockchain specific errors
    if (err.message.includes('revert')) {
        statusCode = 400;
        message = 'Transaction reverted: ' + extractRevertReason(err.message);
    }

    if (err.message.includes('insufficient funds')) {
        statusCode = 400;
        message = 'Insufficient funds for transaction';
    }

    if (err.message.includes('nonce')) {
        statusCode = 400;
        message = 'Transaction nonce error. Please try again';
    }

    // Construct error response
    const response = {
        success: false,
        error: message,
        statusCode
    };

    // Include additional details in development mode
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
        response.details = err.details || null;
    }

    // Send error response
    res.status(statusCode).json(response);
};

/**
 * Handle 404 - Not Found errors
 */
const notFoundHandler = (req, res, next) => {
    const error = new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`);
    next(error);
};

/**
 * Async error wrapper
 * Wraps async functions to catch errors automatically
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Extract revert reason from error message
 */
const extractRevertReason = (message) => {
    const reasonMatch = message.match(/reason="([^"]+)"/);
    if (reasonMatch) {
        return reasonMatch[1];
    }
    
    const revertMatch = message.match(/revert (.+)/);
    if (revertMatch) {
        return revertMatch[1];
    }
    
    return 'Unknown reason';
};

/**
 * Handle multer file upload errors
 */
const multerErrorHandler = (err, req, res, next) => {
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File too large',
                message: 'File size exceeds the maximum allowed size'
            });
        }
        
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: 'Too many files',
                message: 'Number of files exceeds the limit'
            });
        }
        
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                error: 'Unexpected field',
                message: 'Unexpected file field in request'
            });
        }

        return res.status(400).json({
            success: false,
            error: 'File upload error',
            message: err.message
        });
    }
    
    next(err);
};

/**
 * Log errors for monitoring
 */
const logErrors = (err, req, res, next) => {
    // Log to console
    console.error('\n' + '='.repeat(60));
    console.error('ERROR DETAILS:');
    console.error('='.repeat(60));
    console.error('Timestamp:', new Date().toISOString());
    console.error('Method:', req.method);
    console.error('Path:', req.path);
    console.error('IP:', req.ip);
    console.error('User Agent:', req.get('user-agent'));
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    console.error('='.repeat(60) + '\n');

    // In production, you might want to send this to a logging service
    // e.g., Sentry, LogRocket, CloudWatch, etc.

    next(err);
};

/**
 * Handle CORS errors
 */
const corsErrorHandler = (err, req, res, next) => {
    if (err.message.includes('CORS')) {
        return res.status(403).json({
            success: false,
            error: 'CORS error',
            message: 'Cross-origin request blocked'
        });
    }
    next(err);
};

/**
 * Rate limit error handler
 */
const rateLimitErrorHandler = (req, res) => {
    return res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: req.rateLimit?.resetTime
    });
};

/**
 * Validation error formatter
 */
const formatValidationError = (errors) => {
    if (Array.isArray(errors)) {
        return errors.map(err => ({
            field: err.field || err.param,
            message: err.message || err.msg
        }));
    }
    return errors;
};

module.exports = {
    ApiError,
    errorHandler,
    notFoundHandler,
    asyncHandler,
    multerErrorHandler,
    logErrors,
    corsErrorHandler,
    rateLimitErrorHandler,
    formatValidationError
};