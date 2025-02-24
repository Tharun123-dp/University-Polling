const con = require("../connection");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const generateToken = require("../utils/generatetoken");

module.exports.registeradmin = async (req, res) => {
    try {
        const { admin_name, admin_email, admin_password } = req.body;

        if (!admin_name || !admin_email || !admin_password) {
            req.flash("message", "All fields are required.");
            return res.redirect("/admin");
        }

        const checkQuery = "SELECT admin_email FROM admin_info WHERE admin_email = ?";
        con.query(checkQuery, [admin_email], async (error, result) => {
            if (error) {
                req.flash("message", "Database error! Please try again.");
                return res.redirect("/admin");
            }

            if (result.length > 0) {
                req.flash("message", "Email already registered.");
                return res.redirect("/admin");
            }

            let hashedPassword = await bcrypt.hash(admin_password, 10);
            const insertQuery = "INSERT INTO admin_info (admin_name, admin_email, admin_password) VALUES (?, ?, ?)";
            con.query(insertQuery, [admin_name, admin_email, hashedPassword], (insertError) => {
                if (insertError) {
                    req.flash("message", "Error inserting data! Try again.");
                    return res.redirect("/admin");
                }
                let token = generateToken({ admin_email });
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
        const { admin_email, admin_password } = req.body;
        const query = "SELECT * FROM admin_info WHERE admin_email = ?";
        con.query(query, [admin_email], async (error, result) => {
            if (error) {
                req.flash("error", "Database error! Please try again.");
                return res.redirect("/admin/login");
            }
            if (result.length === 0) {
                req.flash("error", "Invalid email or password.");
                return res.redirect("/admin/login");
            }
            let admin = result[0];
            let isMatch = await bcrypt.compare(admin_password, admin.admin_password);
            if (!isMatch) {
                req.flash("error", "Invalid email or password.");
                return res.redirect("/admin/login");
            }
            let token = generateToken({ admin_email: admin.admin_email });
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
    res.cookie("token", "", { expires: new Date(0) });
    req.flash("success", "Logged out successfully.");
    res.redirect("/admin/login");
};
