const con = require("../connection");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const generateToken = require("../utils/generatetoken");


module.exports.loginStudent = async (req, res) => {
    try {
        const { email, password } = req.body; // ✅ Login using email
        const query = "SELECT * FROM student_info WHERE email = ?"; // ✅ Query using email

        con.query(query, [email], async (error, result) => {
            if (error) {
                req.flash("error", "Database error! Please try again.");
                return res.redirect("/student/login");
            }

            if (result.length === 0) {
                req.flash("error", "Invalid email or password.");
                return res.redirect("/student/login");
            }

            let student = result[0];

            // ✅ Compare hashed password
            let isMatch = await bcrypt.compare(password, student.password);
            if (!isMatch) {
                req.flash("error", "Invalid email or password.");
                return res.redirect("/student/login");
            }

            // ✅ Store student session data (including regno for election)
            req.session.student = {
                regno: student.regno, // ✅ Store regno for election verification
                fname: student.fname,
                lname: student.lname,
                email: student.email
            };

            req.flash("success", "Logged in successfully!");
            return res.redirect("/"); // ✅ Redirect to dashboard
        });
    } catch (err) {
        req.flash("error", "An error occurred during login.");
        return res.redirect("/student/login");
    }
};

module.exports.logoutStudent = (req, res) => {
    req.flash("success", "Logged out successfully."); // ✅ Store the flash message first
    req.session.destroy(() => {
        res.redirect("/"); // ✅ Redirect after session is destroyed
    });
};

