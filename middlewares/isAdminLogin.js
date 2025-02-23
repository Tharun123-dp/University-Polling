const jwt = require("jsonwebtoken");
const con = require("../connection");

module.exports = (req, res, next) => {
    if (!req.cookies.token) {
        console.log("🚨 No token found. Redirecting to login.");
        req.flash("error", "You need to log in first.");
        return res.redirect("/admin/login");
    }

    try {
        let decoded = jwt.verify(req.cookies.token, process.env.JWT_KEY);
        console.log("✅ Token verified:", decoded);

        const query = "SELECT login_id, admin_name, admin_email FROM admin_info WHERE login_id = ?";
        con.query(query, [decoded.login_id], (error, result) => {
            if (error) {
                console.error("🚨 Database Error:", error);
                req.flash("error", "Database error. Please try again.");
                return res.redirect("/admin/login");
            }

            if (result.length === 0) {
                console.log("🚨 No admin found in database. Redirecting to login.");
                req.flash("error", "Invalid session. Please log in again.");
                return res.redirect("/admin/login");
            }

            console.log("✅ Admin found:", result[0]);
            req.admin = result[0]; // Attach admin details
            next();
        });

    } catch (err) {
        console.error("🚨 JWT Error:", err);
        req.flash("error", "Session expired. Please log in again.");
        return res.redirect("/admin/login");
    }
};
