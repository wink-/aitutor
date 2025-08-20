/**
 * Validation utilities for AI Terminal Tutor
 * Provides input validation, form validation, and data sanitization
 */

class ValidationError extends Error {
    constructor(message, field = null, code = null) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
        this.code = code;
    }
}

class Validator {
    constructor() {
        this.rules = new Map();
        this.messages = new Map();
        this.setupDefaultMessages();
    }
    
    setupDefaultMessages() {
        this.messages.set('required', 'This field is required');
        this.messages.set('email', 'Please enter a valid email address');
        this.messages.set('min', 'Value must be at least {min}');
        this.messages.set('max', 'Value must be no more than {max}');
        this.messages.set('minLength', 'Must be at least {min} characters long');
        this.messages.set('maxLength', 'Must be no more than {max} characters long');
        this.messages.set('pattern', 'Invalid format');
        this.messages.set('numeric', 'Must be a number');
        this.messages.set('positive', 'Must be a positive number');
        this.messages.set('integer', 'Must be a whole number');
        this.messages.set('url', 'Please enter a valid URL');
        this.messages.set('safe', 'Contains invalid characters');
    }
    
    /**
     * Add a validation rule
     * @param {string} name - Rule name
     * @param {Function} validator - Validation function
     * @param {string} message - Error message
     */
    addRule(name, validator, message) {
        this.rules.set(name, validator);
        this.messages.set(name, message);
    }
    
    /**
     * Validate a single value
     * @param {any} value - Value to validate
     * @param {Array} rules - Array of validation rules
     * @param {string} field - Field name for error messages
     * @returns {Object} Validation result
     */
    validate(value, rules, field = 'field') {
        const errors = [];
        
        for (const rule of rules) {
            const result = this.applyRule(value, rule, field);
            if (result.error) {
                errors.push(result.error);
            }
        }
        
        return {
            valid: errors.length === 0,
            errors,
            value: this.sanitizeValue(value)
        };
    }
    
    /**
     * Apply a single validation rule
     * @param {any} value - Value to validate
     * @param {Object|string} rule - Validation rule
     * @param {string} field - Field name
     * @returns {Object} Rule result
     */
    applyRule(value, rule, field) {
        if (typeof rule === 'string') {
            rule = { type: rule };
        }
        
        const { type, ...params } = rule;\n        
        switch (type) {\n            case 'required':\n                return this.validateRequired(value, field);\n            case 'email':\n                return this.validateEmail(value, field);\n            case 'min':\n                return this.validateMin(value, params.value, field);\n            case 'max':\n                return this.validateMax(value, params.value, field);\n            case 'minLength':\n                return this.validateMinLength(value, params.value, field);\n            case 'maxLength':\n                return this.validateMaxLength(value, params.value, field);\n            case 'pattern':\n                return this.validatePattern(value, params.value, field);\n            case 'numeric':\n                return this.validateNumeric(value, field);\n            case 'positive':\n                return this.validatePositive(value, field);\n            case 'integer':\n                return this.validateInteger(value, field);\n            case 'url':\n                return this.validateUrl(value, field);\n            case 'safe':\n                return this.validateSafe(value, field);\n            case 'custom':\n                return this.validateCustom(value, params.validator, field);\n            default:\n                if (this.rules.has(type)) {\n                    return this.validateCustomRule(value, type, params, field);\n                }\n                return { valid: true };\n        }\n    }
    
    validateRequired(value, field) {
        if (value === null || value === undefined || value === '') {
            return { error: this.formatMessage('required', {}, field) };
        }
        return { valid: true };
    }
    
    validateEmail(value, field) {
        if (!value) return { valid: true }; // Optional field
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return { error: this.formatMessage('email', {}, field) };
        }
        return { valid: true };
    }
    
    validateMin(value, min, field) {
        const num = parseFloat(value);
        if (isNaN(num) || num < min) {
            return { error: this.formatMessage('min', { min }, field) };
        }
        return { valid: true };
    }
    
    validateMax(value, max, field) {
        const num = parseFloat(value);
        if (isNaN(num) || num > max) {
            return { error: this.formatMessage('max', { max }, field) };
        }
        return { valid: true };
    }
    
    validateMinLength(value, min, field) {
        if (!value || value.length < min) {
            return { error: this.formatMessage('minLength', { min }, field) };
        }
        return { valid: true };
    }
    
    validateMaxLength(value, max, field) {
        if (value && value.length > max) {
            return { error: this.formatMessage('maxLength', { max }, field) };
        }
        return { valid: true };
    }
    
    validatePattern(value, pattern, field) {
        if (!value) return { valid: true }; // Optional field
        
        const regex = new RegExp(pattern);
        if (!regex.test(value)) {
            return { error: this.formatMessage('pattern', {}, field) };
        }
        return { valid: true };
    }
    
    validateNumeric(value, field) {
        if (!value) return { valid: true }; // Optional field
        
        if (isNaN(parseFloat(value))) {
            return { error: this.formatMessage('numeric', {}, field) };
        }
        return { valid: true };
    }
    
    validatePositive(value, field) {
        const num = parseFloat(value);
        if (isNaN(num) || num <= 0) {
            return { error: this.formatMessage('positive', {}, field) };
        }
        return { valid: true };
    }
    
    validateInteger(value, field) {
        if (!value) return { valid: true }; // Optional field
        
        const num = parseInt(value);
        if (isNaN(num) || num.toString() !== value.toString()) {
            return { error: this.formatMessage('integer', {}, field) };
        }
        return { valid: true };
    }
    
    validateUrl(value, field) {
        if (!value) return { valid: true }; // Optional field
        
        try {
            new URL(value);
            return { valid: true };
        } catch (error) {
            return { error: this.formatMessage('url', {}, field) };
        }
    }
    
    validateSafe(value, field) {
        if (!value) return { valid: true }; // Optional field
        
        // Check for potentially dangerous characters/patterns
        const dangerousPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /data:text\/html/i,
            /vbscript:/i
        ];
        
        const hasDangerous = dangerousPatterns.some(pattern => pattern.test(value));
        if (hasDangerous) {
            return { error: this.formatMessage('safe', {}, field) };
        }
        
        return { valid: true };
    }
    
    validateCustom(value, validator, field) {
        try {
            const result = validator(value);
            if (result === true) {
                return { valid: true };
            } else if (typeof result === 'string') {
                return { error: result };
            } else {
                return { error: `Invalid ${field}` };
            }
        } catch (error) {
            return { error: error.message };
        }
    }
    
    validateCustomRule(value, ruleType, params, field) {
        const validator = this.rules.get(ruleType);
        if (!validator) {
            return { valid: true };
        }
        
        try {
            const result = validator(value, params);
            if (result === true) {
                return { valid: true };
            } else if (typeof result === 'string') {
                return { error: result };
            } else {
                return { error: this.formatMessage(ruleType, params, field) };
            }
        } catch (error) {
            return { error: error.message };
        }
    }
    
    /**
     * Format error message with parameters
     * @param {string} messageKey - Message template key
     * @param {Object} params - Parameters to substitute
     * @param {string} field - Field name
     * @returns {string} Formatted message
     */
    formatMessage(messageKey, params, field) {
        let message = this.messages.get(messageKey) || 'Invalid value';
        
        // Replace parameter placeholders
        Object.entries(params).forEach(([key, value]) => {
            message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        });
        
        return message;
    }
    
    /**
     * Sanitize a value for safe use
     * @param {any} value - Value to sanitize
     * @returns {any} Sanitized value
     */
    sanitizeValue(value) {
        if (typeof value !== 'string') {
            return value;
        }
        
        // Basic HTML entity encoding
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')\n            .trim();\n    }\n    \n    /**\n     * Validate an entire form\n     * @param {Object} data - Form data object\n     * @param {Object} rules - Validation rules for each field\n     * @returns {Object} Validation result\n     */\n    validateForm(data, rules) {\n        const errors = {};\n        const sanitized = {};\n        let valid = true;\n        \n        // Validate each field\n        Object.entries(rules).forEach(([field, fieldRules]) => {\n            const value = data[field];\n            const result = this.validate(value, fieldRules, field);\n            \n            if (!result.valid) {\n                errors[field] = result.errors;\n                valid = false;\n            }\n            \n            sanitized[field] = result.value;\n        });\n        \n        return {\n            valid,\n            errors,\n            data: sanitized\n        };\n    }\n    \n    /**\n     * Validate progress data\n     * @param {Object} progress - Progress object\n     * @returns {Object} Validation result\n     */\n    validateProgress(progress) {\n        const rules = {\n            lessonsCompleted: [{ type: 'numeric' }, { type: 'min', value: 0 }],\n            totalLessons: [{ type: 'numeric' }, { type: 'min', value: 1 }],\n            exercisesCompleted: [{ type: 'numeric' }, { type: 'min', value: 0 }],\n            totalExercises: [{ type: 'numeric' }, { type: 'min', value: 0 }],\n            timeSpent: [{ type: 'numeric' }, { type: 'min', value: 0 }],\n            streak: [{ type: 'numeric' }, { type: 'min', value: 0 }],\n            completedLessons: [{ type: 'custom', validator: (val) => Array.isArray(val) }]\n        };\n        \n        return this.validateForm(progress, rules);\n    }\n    \n    /**\n     * Validate lesson data\n     * @param {Object} lesson - Lesson object\n     * @returns {Object} Validation result\n     */\n    validateLesson(lesson) {\n        const rules = {\n            id: ['required', { type: 'safe' }],\n            title: ['required', { type: 'maxLength', value: 200 }, { type: 'safe' }],\n            description: [{ type: 'maxLength', value: 1000 }, { type: 'safe' }],\n            category: ['required', { type: 'safe' }],\n            difficulty: [\n                'required',\n                {\n                    type: 'custom',\n                    validator: (val) => ['beginner', 'intermediate', 'advanced'].includes(val)\n                }\n            ],\n            estimatedTime: [{ type: 'safe' }]\n        };\n        \n        return this.validateForm(lesson, rules);\n    }\n    \n    /**\n     * Validate search query\n     * @param {string} query - Search query\n     * @returns {Object} Validation result\n     */\n    validateSearchQuery(query) {\n        const rules = [\n            { type: 'maxLength', value: 100 },\n            { type: 'safe' },\n            {\n                type: 'custom',\n                validator: (val) => {\n                    // Prevent extremely short queries that might be too broad\n                    if (val && val.length < 2) {\n                        return 'Search query must be at least 2 characters long';\n                    }\n                    return true;\n                }\n            }\n        ];\n        \n        return this.validate(query, rules, 'search query');\n    }\n    \n    /**\n     * Validate configuration object\n     * @param {Object} config - Configuration object\n     * @returns {Object} Validation result\n     */\n    validateConfig(config) {\n        const rules = {\n            theme: [\n                {\n                    type: 'custom',\n                    validator: (val) => ['light', 'dark', 'auto'].includes(val)\n                }\n            ],\n            fontSize: [\n                {\n                    type: 'custom',\n                    validator: (val) => ['small', 'medium', 'large'].includes(val)\n                }\n            ],\n            autoSave: [\n                {\n                    type: 'custom',\n                    validator: (val) => typeof val === 'boolean'\n                }\n            ]\n        };\n        \n        return this.validateForm(config, rules);\n    }\n}\n\n// Create global validator instance\nconst validator = new Validator();\n\n// Utility functions\nfunction validateEmail(email) {\n    return validator.validate(email, ['email']);\n}\n\nfunction validateRequired(value, fieldName = 'field') {\n    return validator.validate(value, ['required'], fieldName);\n}\n\nfunction sanitizeInput(input) {\n    return validator.sanitizeValue(input);\n}\n\nfunction validateProgress(progress) {\n    return validator.validateProgress(progress);\n}\n\nfunction validateLesson(lesson) {\n    return validator.validateLesson(lesson);\n}\n\nfunction validateSearchQuery(query) {\n    return validator.validateSearchQuery(query);\n}\n\n// Export for use in other modules\nif (typeof window !== 'undefined') {\n    window.Validator = Validator;\n    window.validator = validator;\n    window.validateEmail = validateEmail;\n    window.validateRequired = validateRequired;\n    window.sanitizeInput = sanitizeInput;\n    window.validateProgress = validateProgress;\n    window.validateLesson = validateLesson;\n    window.validateSearchQuery = validateSearchQuery;\n}\n\n// Export for Node.js environments\nif (typeof module !== 'undefined' && module.exports) {\n    module.exports = {\n        Validator,\n        validator,\n        ValidationError,\n        validateEmail,\n        validateRequired,\n        sanitizeInput,\n        validateProgress,\n        validateLesson,\n        validateSearchQuery\n    };\n}