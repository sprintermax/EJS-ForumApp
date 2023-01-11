'use strict';

// Check if a user is currently in a session

export default function authMiddleware() {
    return (req, res, next) => {
        if (!req.isAuthenticated()) return res.redirect("/login");
        next();
    };
}
