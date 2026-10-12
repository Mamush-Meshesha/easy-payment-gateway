"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = void 0;
const jwt_1 = require("./jwt");
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }
        try {
            const decoded = (0, jwt_1.verifyToken)(token);
            req.user = decoded;
            next();
        }
        catch (err) {
            res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
        }
    }
    else {
        res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
};
exports.authenticateJWT = authenticateJWT;
