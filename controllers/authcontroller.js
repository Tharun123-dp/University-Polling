const con = require("../connection");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const generateToken = require("../utils/generatetoken");  // ✅ Correct import

module.exports.registeradmin = async (req, res) => {
    try {
        const { login_id, admin_name, admin_email, admin_password } = req.body;

        if (!login_id || !admin_name || !admin_email || !admin_password) {
            req.flash("message", "All fields are required.");
            return res.redirect("/admin");
        }

        const checkQuery = "SELECT login_id FROM admin_info WHERE login_id = ?";
        con.query(checkQuery, [login_id], async (error, result) => {
            if (error) {
                req.flash("message", "Database error! Please try again.");
                return res.redirect("/admin");
            }

            if (result.length > 0) {
                req.flash("message", "Login ID already exists.");
                return res.redirect("/admin");
            }

            let hashedPassword = await bcrypt.hash(admin_password, 10);

            const insertQuery =
                "INSERT INTO admin_info (login_id, admin_name, admin_email, admin_password) VALUES (?, ?, ?, ?)";
            con.query(insertQuery, [login_id, admin_name, admin_email, hashedPassword], (insertError) => {
                if (insertError) {
                    req.flash("message", "Error inserting data! Try again.");
                    return res.redirect("/admin");
                }

                let token = generateToken({ login_id: login_id });
                res.cookie("token", token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "strict",
                });

                req.flash("message", "Admin registered successfully.");
                res.redirect("/admin/login");
            });
        });
    } catch (err) {
        req.flash("message", "An unexpected error occurred.");
        res.redirect("/admin");
    }
};

module.exports.loginuser = async (req, res) => {
    try {
        const { login_id, admin_password } = req.body;

        const query = "SELECT * FROM admin_info WHERE login_id = ?";
        con.query(query, [login_id], async (error, result) => {
            if (error) {
                req.flash("error", "Database error! Please try again.");
                return res.redirect("/admin/login");
            }

            if (result.length === 0) {
                req.flash("error", "Invalid login ID or password.");
                return res.redirect("/admin/login");
            }

            let admin = result[0];
            let isMatch = await bcrypt.compare(admin_password, admin.admin_password);

            if (!isMatch) {
                req.flash("error", "Invalid login ID or password.");
                return res.redirect("/admin/login");
            }

            let token = generateToken(admin);
            res.cookie("token", token, { httpOnly: true, secure: false });
            req.flash("success", "Logged in successfully!");
            return res.redirect("/admin/dash");
        });
    } catch (err) {
        req.flash("error", "An error occurred during login.");
        return res.redirect("/admin/login");
    }
};

module.exports.logout = (req, res) => {
    // Clear the token cookie
    res.cookie("token", "", { expires: new Date(0) });

    req.flash("success", "Logged out successfully.");
    res.redirect("/admin/login");  // Redirect to login page after logout
};
