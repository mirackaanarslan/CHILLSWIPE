"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.authenticateUser = void 0;
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'No authorization token provided'
            });
        }
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        // Verify the Firebase ID token
        const decodedToken = await (0, auth_1.getAuth)().verifyIdToken(token);
        // Add user info to request
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email
        };
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({
            success: false,
            error: 'Invalid authentication token'
        });
    }
};
exports.authenticateUser = authenticateUser;
const requireAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        const db = (0, firestore_1.getFirestore)();
        const adminDoc = await db.collection('admins').doc(req.user.uid).get();
        if (!adminDoc.exists) {
            return res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
        }
        req.user.isAdmin = true;
        next();
    }
    catch (error) {
        console.error('Admin check error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to verify admin status'
        });
    }
};
exports.requireAdmin = requireAdmin;
//# sourceMappingURL=auth.js.map