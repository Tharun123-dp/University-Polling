const express = require("express");
const router = express.Router();
const con = require("../connection");
const { registeradmin, loginuser, logout } = require("../controllers/authcontroller");
const isAdminLogin = require("../middlewares/isAdminLogin");

router.get("/", isAdminLogin, (req, res) => {
    res.render("adminlog");
});

router.get("/login", (req, res) => {
    res.render("adminlogin");
});

router.post("/", registeradmin);
router.post("/login", loginuser);

router.get("/dash", isAdminLogin, (req, res) => {
    const ongoingQuery = `
        SELECT * FROM election_info 
        WHERE NOW() BETWEEN start_registration_date AND election_end_time
    `;

    con.query(ongoingQuery, (err, ongoingElections) => {
        if (err) {
            console.error("Error fetching ongoing elections:", err);
            req.flash("error", "Database error.");
            return res.redirect("/admin/login");
        }

        res.render("adminDashboard", { admin: req.admin, ongoingElections });
    });
});


// ✅ Create Student (Render Form)
router.get("/createStudent", isAdminLogin, (req, res) => {
    const degreeQuery = "SELECT * FROM degree_info";
    const branchQuery = "SELECT * FROM branch_info";

    con.query(degreeQuery, (err, degrees) => {
        if (err) {
            console.error("Error fetching degrees:", err);
            return res.status(500).send("Database error");
        }
        
        con.query(branchQuery, (err, branches) => {
            if (err) {
                console.error("Error fetching branches:", err);
                return res.status(500).send("Database error");
            }
            
            res.render("createStudent", { admin: req.admin, degrees, branches });
        });
    });
});

// ✅ Fetch Branches Based on Selected Degree (AJAX)
router.get("/branches/:degreeId", (req, res) => {
    const degreeId = req.params.degreeId;
    const query = "SELECT * FROM branch_info WHERE degree_id = ?";

    con.query(query, [degreeId], (err, results) => {
        if (err) {
            console.error("Error fetching branches:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
});

// ✅ Create Student (Handle Form Submission)
const bcrypt = require("bcrypt");


router.post("/createStudent", isAdminLogin, async (req, res) => {
    const { fname, lname, gender, address, mno, email, degree_id, branch_id, regno, password, year } = req.body;

    try {
        // Check if email or registration number already exists
        const checkQuery = "SELECT * FROM student_info WHERE email = ? OR regno = ?";
        con.query(checkQuery, [email, regno], async (err, result) => {
            if (err) {
                console.error("Database error:", err);
                req.flash("error", "Database error! Please try again.");
                return res.redirect("/admin/dash");
            }

            if (result.length > 0) {
                req.flash("error", "Email or Registration Number already exists.");
                return res.redirect("/admin/dash");
            }

            // Hash the password before storing
            let hashedPassword = await bcrypt.hash(password, 10);

            // Insert the new student
            const insertQuery = `
                INSERT INTO student_info (fname, lname, gender, address, mno, email, degree_id, branch_id, regno, password, year)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            con.query(insertQuery, [fname, lname, gender, address, mno, email, degree_id, branch_id, regno, hashedPassword, year], (insertErr) => {
                if (insertErr) {
                    console.error("Error inserting student:", insertErr);
                    req.flash("error", "Error inserting student! Try again.");
                    return res.redirect("/admin/dash");
                }

                req.flash("success", "Student registered successfully.");
                res.redirect("/admin/dash");
            });
        });
    } catch (err) {
        console.error("Unexpected error:", err);
        req.flash("error", "An unexpected error occurred.");
        res.redirect("/admin/dash");
    }
});




// ✅ Create Election (Render Form)
router.get("/create", isAdminLogin, (req, res) => {
    const query = "SELECT * FROM degree_info";

    con.query(query, (err, degrees) => {
        if (err) {
            console.error("Error fetching degrees:", err);
            return res.status(500).send("Database error");
        }
        res.render("createElection", { admin: req.admin, degrees });
    });
});

// ✅ Create Election (Fixed All Degree/All Branch Logic)
router.post("/create", isAdminLogin, (req, res) => {
    let { 
        election_name, election_roles, all_degree, degree_id, all_branch, branch_id, 
        eligible_year, start_registration_date, end_registration_date, election_date, 
        election_start_time, election_end_time 
    } = req.body;

    all_degree = all_degree === "1" ? "1" : "0";
    all_branch = all_branch === "1" ? "1" : "0";

    degree_id = all_degree === "1" ? null : degree_id;
    branch_id = all_branch === "1" ? null : branch_id;

    const query = `
        INSERT INTO election_info 
        (election_name, election_roles, all_degree, degree_id, all_branch, branch_id, 
         eligible_year, start_registration_date, end_registration_date, election_date, 
         election_start_time, election_end_time) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    con.query(query, [
        election_name, election_roles, all_degree, degree_id, all_branch, branch_id, 
        eligible_year, start_registration_date, end_registration_date, election_date, 
        election_start_time, election_end_time
    ], (err) => {
        if (err) {
            console.error("Error creating election:", err);
            return res.status(500).send("Database error");
        }
        res.redirect("/admin/dash");
    });
});


router.get("/admin/branches/:degreeId", async (req, res) => {
    const degreeId = req.params.degreeId;
    try {
        const branches = await con.query("SELECT branch_id, branch_name FROM branches WHERE degree_id = ?", [degreeId]);
        res.json(branches);
    } catch (error) {
        console.error("Error fetching branches:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// ✅ Fix Logout Route
router.get("/logout", logout);

module.exports = router;
