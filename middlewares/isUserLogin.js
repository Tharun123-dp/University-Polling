const con = require("../connection");

module.exports = (req, res, next) => {
    if (!req.session.student) {
        req.flash("error", "Please log in first.");
        return res.redirect("/student/login");
    }

    const studentEmail = req.session.student.email;

    if (!studentEmail) {
        req.flash("error", "Session expired. Please log in again.");
        return res.redirect("/student/login");
    }

    // Updated query to use `regno` instead of `student_id`
    const query = `SELECT regno, fname, lname, email FROM student_info WHERE email = ?`;

    con.query(query, [studentEmail], (error, results) => {
        if (error) {
            console.error("🚨 Database Error:", error);
            req.flash("error", "Database error. Please try again.");
            return res.redirect("/student/login");
        }

        if (results.length === 0) {
            req.flash("error", "No user found. Please log in again.");
            return res.redirect("/student/login");
        }

        req.student = results[0]; // Attach student info to request
        next();
    });
};
