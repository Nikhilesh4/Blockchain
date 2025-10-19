const { ethers } = require('ethers');

/**
 * Validate Ethereum address
 */
const validateAddress = (req, res, next) => {
    const { recipientAddress, adminAddress } = req.body;
    const addressToValidate = recipientAddress || adminAddress;

    if (!addressToValidate) {
        return res.status(400).json({
            success: false,
            error: 'Validation error',
            message: 'Address is required'
        });
    }

    if (!ethers.isAddress(addressToValidate)) {
        return res.status(400).json({
            success: false,
            error: 'Validation error',
            message: 'Invalid Ethereum address format'
        });
    }

    // Check for zero address
    if (addressToValidate === ethers.ZeroAddress) {
        return res.status(400).json({
            success: false,
            error: 'Validation error',
            message: 'Cannot use zero address'
        });
    }

    next();
};

/**
 * Validate token ID
 */
const validateTokenId = (req, res, next) => {
    const tokenId = req.params.tokenId || req.body.tokenId;

    if (!tokenId) {
        return res.status(400).json({
            success: false,
            error: 'Validation error',
            message: 'Token ID is required'
        });
    }

    const tokenIdNumber = Number(tokenId);

    if (isNaN(tokenIdNumber) || tokenIdNumber < 0 || !Number.isInteger(tokenIdNumber)) {
        return res.status(400).json({
            success: false,
            error: 'Validation error',
            message: 'Token ID must be a positive integer'
        });
    }

    // Attach validated token ID to request
    req.validatedTokenId = tokenIdNumber;
    next();
};

/**
 * Validate metadata input
 */
const validateMetadata = (req, res, next) => {
    const { name, description, imageUrl } = req.body;

    const errors = [];

    // Validate name
    if (!name || typeof name !== 'string') {
        errors.push('Name is required and must be a string');
    } else if (name.trim().length === 0) {
        errors.push('Name cannot be empty');
    } else if (name.length > 200) {
        errors.push('Name must be less than 200 characters');
    }

    // Validate description
    if (!description || typeof description !== 'string') {
        errors.push('Description is required and must be a string');
    } else if (description.trim().length === 0) {
        errors.push('Description cannot be empty');
    } else if (description.length > 1000) {
        errors.push('Description must be less than 1000 characters');
    }

    // Validate imageUrl
    if (!imageUrl || typeof imageUrl !== 'string') {
        errors.push('Image URL is required and must be a string');
    } else if (!isValidUrl(imageUrl)) {
        errors.push('Invalid image URL format');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'Validation error',
            message: 'Invalid metadata',
            details: errors
        });
    }

    // Sanitize inputs
    req.body.name = name.trim();
    req.body.description = description.trim();
    req.body.imageUrl = imageUrl.trim();

    next();
};

/**
 * Validate certificate minting input
 */
const validateMintInput = (req, res, next) => {
    const { recipientAddress, metadataUrl } = req.body;

    const errors = [];

    // Validate recipient address
    if (!recipientAddress) {
        errors.push('Recipient address is required');
    } else if (!ethers.isAddress(recipientAddress)) {
        errors.push('Invalid recipient address format');
    } else if (recipientAddress === ethers.ZeroAddress) {
        errors.push('Cannot mint to zero address');
    }

    // Validate metadata URL
    if (!metadataUrl) {
        errors.push('Metadata URL is required');
    } else if (typeof metadataUrl !== 'string') {
        errors.push('Metadata URL must be a string');
    } else if (!metadataUrl.startsWith('ipfs://') && !isValidUrl(metadataUrl)) {
        errors.push('Invalid metadata URL format (must be IPFS URL or valid HTTP URL)');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'Validation error',
            message: 'Invalid minting input',
            details: errors
        });
    }

    next();
};

/**
 * Validate revocation input
 */
const validateRevocationInput = (req, res, next) => {
    const { reason } = req.body;

    // Reason is optional, but if provided, validate it
    if (reason !== undefined) {
        if (typeof reason !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                message: 'Reason must be a string'
            });
        }

        if (reason.length > 500) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                message: 'Reason must be less than 500 characters'
            });
        }

        // Sanitize reason
        req.body.reason = reason.trim();
    }

    next();
};

/**
 * Validate file upload
 */
const validateFileUpload = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: 'Validation error',
            message: 'No file uploaded'
        });
    }

    const file = req.file;
    const maxSize = 10 * 1024 * 1024; // 10MB

    // Check file size
    if (file.size > maxSize) {
        return res.status(400).json({
            success: false,
            error: 'Validation error',
            message: `File size must be less than ${maxSize / 1024 / 1024}MB`
        });
    }

    // Check file type
    if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({
            success: false,
            error: 'Validation error',
            message: 'Only image files are allowed'
        });
    }

    // Check for potentially dangerous file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.php', '.js', '.html'];
    const fileName = file.originalname.toLowerCase();
    
    if (dangerousExtensions.some(ext => fileName.endsWith(ext))) {
        return res.status(400).json({
            success: false,
            error: 'Validation error',
            message: 'File type not allowed'
        });
    }

    next();
};

/**
 * Sanitize string input (prevent XSS)
 */
const sanitizeInput = (req, res, next) => {
    const sanitize = (obj) => {
        if (typeof obj === 'string') {
            return obj
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;')
                .replace(/\//g, '&#x2F;');
        }
        
        if (typeof obj === 'object' && obj !== null) {
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    obj[key] = sanitize(obj[key]);
                }
            }
        }
        
        return obj;
    };

    req.body = sanitize(req.body);
    next();
};

/**
 * Helper function to validate URL
 */
const isValidUrl = (string) => {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'ipfs:';
    } catch (_) {
        return false;
    }
};

/**
 * Validate query parameters
 */
const validateQueryParams = (allowedParams) => {
    return (req, res, next) => {
        const queryKeys = Object.keys(req.query);
        const invalidParams = queryKeys.filter(key => !allowedParams.includes(key));

        if (invalidParams.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                message: `Invalid query parameters: ${invalidParams.join(', ')}`,
                allowedParams
            });
        }

        next();
    };
};

/**
 * Validate pagination parameters
 */
const validatePagination = (req, res, next) => {
    const { page, limit } = req.query;

    if (page !== undefined) {
        const pageNum = Number(page);
        if (isNaN(pageNum) || pageNum < 1 || !Number.isInteger(pageNum)) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                message: 'Page must be a positive integer'
            });
        }
        req.query.page = pageNum;
    }

    if (limit !== undefined) {
        const limitNum = Number(limit);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100 || !Number.isInteger(limitNum)) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                message: 'Limit must be a positive integer between 1 and 100'
            });
        }
        req.query.limit = limitNum;
    }

    next();
};

module.exports = {
    validateAddress,
    validateTokenId,
    validateMetadata,
    validateMintInput,
    validateRevocationInput,
    validateFileUpload,
    sanitizeInput,
    validateQueryParams,
    validatePagination
};