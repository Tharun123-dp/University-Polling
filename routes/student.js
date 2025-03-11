const express = require("express");
const router = express.Router();
const con = require("../connection");
const { loginStudent, logoutStudent } = require("../controllers/usercontroller");
const isUserLogin = require("../middlewares/isUserLogin");

router.get("/login", (req, res) => {
    res.render("userLogin", { messages: req.flash() });
});

router.post("/login", loginStudent);

router.get("/logout", logoutStudent);

// Example of student dashboard using regno
router.get("/dashboard", isUserLogin, (req, res) => {
    const regno = req.student.regno; // ✅ Correct field name

    const query = `SELECT * FROM election_info WHERE status = 'ongoing' AND regno = ?`; // ✅ Updated table name
    con.query(query, [regno], (error, elections) => {
        if (error) {
            console.error("🚨 Database Error:", error);
            req.flash("error", "Database error. Please try again.");
            return res.redirect("/student/login");
        }

        res.render("studentDashboard", { student: req.student, elections });
    });
});


module.exports = router;
