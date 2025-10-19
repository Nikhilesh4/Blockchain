const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter
 * Applies to all API requests
 */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests',
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again in 15 minutes.',
            retryAfter: req.rateLimit.resetTime
        });
    }
});

/**
 * Strict limiter for sensitive operations (minting, revoking)
 */
const strictLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 requests per hour
    message: {
        success: false,
        error: 'Too many requests',
        message: 'Too many operations from this IP, please try again later.'
    },
    skipSuccessfulRequests: false,
    handler: (req, res) => {
        console.warn(`⚠️  Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
        res.status(429).json({
            success: false,
            error: 'Too many requests',
            message: 'Too many sensitive operations. Please try again in 1 hour.',
            retryAfter: req.rateLimit.resetTime
        });
    }
});

/**
 * File upload rate limiter
 */
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // Limit each IP to 20 uploads per hour
    message: {
        success: false,
        error: 'Too many uploads',
        message: 'Too many file uploads from this IP, please try again later.'
    },
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Too many uploads',
            message: 'Upload limit exceeded. Please try again in 1 hour.',
            retryAfter: req.rateLimit.resetTime
        });
    }
});

/**
 * Verification rate limiter (more lenient)
 */
const verificationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 verification requests per 15 minutes
    message: {
        success: false,
        error: 'Too many verification requests',
        message: 'Too many verification attempts, please try again later.'
    },
    skipFailedRequests: true, // Don't count failed requests
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Too many verification requests',
            message: 'Verification rate limit exceeded. Please try again in 15 minutes.',
            retryAfter: req.rateLimit.resetTime
        });
    }
});

/**
 * Stats/Read-only operations limiter (very lenient)
 */
const readOnlyLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 200, // Limit each IP to 200 requests per 5 minutes
    message: {
        success: false,
        error: 'Too many requests',
        message: 'Too many read requests, please try again later.'
    },
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again in a few minutes.',
            retryAfter: req.rateLimit.resetTime
        });
    }
});

/**
 * Create custom rate limiter
 */
const createLimiter = (options) => {
    const defaultOptions = {
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: {
            success: false,
            error: 'Too many requests',
            message: 'Rate limit exceeded'
        },
        standardHeaders: true,
        legacyHeaders: false
    };

    return rateLimit({ ...defaultOptions, ...options });
};

/**
 * Skip rate limit for specific conditions
 */
const skipRateLimit = (req) => {
    // Skip rate limiting for whitelisted IPs
    const whitelist = process.env.RATE_LIMIT_WHITELIST 
        ? process.env.RATE_LIMIT_WHITELIST.split(',')
        : [];
    
    if (whitelist.includes(req.ip)) {
        return true;
    }

    // Skip for localhost in development
    if (process.env.NODE_ENV === 'development' && 
        (req.ip === '127.0.0.1' || req.ip === '::1')) {
        return true;
    }

    return false;
};

/**
 * Dynamic rate limiter based on user type
 */
const dynamicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: async (req) => {
        // Give more quota to verified admins
        if (req.verifiedAdmin) {
            return 500; // 500 requests per 15 minutes for admins
        }
        return 100; // 100 requests per 15 minutes for others
    },
    skip: skipRateLimit,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: req.rateLimit.resetTime
        });
    }
});

module.exports = {
    generalLimiter,
    strictLimiter,
    uploadLimiter,
    verificationLimiter,
    readOnlyLimiter,
    createLimiter,
    dynamicLimiter,
    skipRateLimit
};