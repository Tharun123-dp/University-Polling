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

router.get("/elections", (req, res) => {
    const query = `
        SELECT e.election_id, e.election_name, 
               (SELECT COUNT(*) FROM voted_students_info v WHERE v.election_id = e.election_id) AS total_voted,
               (SELECT COUNT(*) FROM contestant_election_info c WHERE c.election_id = e.election_id) AS total_contestants,
               (SELECT CONCAT(s.fname, ' ', s.lname) FROM election_results r 
                JOIN student_info s ON r.regno = s.regno 
                WHERE r.election_id = e.election_id LIMIT 1) AS winner
        FROM election_info e;
    `;

    con.query(query, (err, results) => {
        if (err) throw err;
        res.render("admin/elections", { elections: results });
    });
});


// Get voted students for an election (JSON response for modal)
router.get("/elections/:id/voted", (req, res) => {
    const electionId = req.params.id;

    const query = `
        SELECT 
            v.regno AS student_regno, 
            CONCAT(s.fname, ' ', s.lname) AS student_name, 
            s.year, 
            d.degree_name, 
            b.branch_name, 
            CONCAT(c.fname, ' ', c.lname) AS candidate_name
        FROM voted_students_info v
        JOIN student_info s ON v.regno = s.regno
        JOIN degree_info d ON s.degree_id = d.degree_id
        JOIN branch_info b ON s.branch_id = b.branch_id
        JOIN student_info c ON v.contestant_id = c.regno  
        WHERE v.election_id = ?;
    `;

    con.query(query, [electionId], (err, results) => {
        if (err) {
            console.error("Error fetching voted students:", err);
            return res.status(500).json({ error: "Internal Server Error" });
        }

        res.json({ students: results });
    });
});

// Get contestants for an election (JSON response for modal)
router.get("/elections/:id/contestants", (req, res) => {
    const electionId = req.params.id;
    const query = `
        SELECT 
            CONCAT(s.fname, ' ', s.lname) AS name, 
            s.regno, 
            s.year, 
            d.degree_name, 
            b.branch_name, 
            c.no_of_votes 
        FROM contestant_election_info c
        JOIN student_info s ON c.contestant_regno = s.regno
        JOIN degree_info d ON s.degree_id = d.degree_id
        JOIN branch_info b ON s.branch_id = b.branch_id
        WHERE c.election_id = ?;
    `;

    con.query(query, [electionId], (err, results) => {
        if (err) throw err;
        res.json({ contestants: results });
    });
});

// Delete election route
router.post("/elections/delete/:id", (req, res) => {
    const electionId = req.params.id;

    // First, delete associated records (like contestants and votes) if needed
    const deleteVotes = "DELETE FROM voted_students_info WHERE election_id = ?";
    const deleteContestants = "DELETE FROM contestant_election_info WHERE election_id = ?";
    const deleteElection = "DELETE FROM election_info WHERE election_id = ?";

    con.query(deleteVotes, [electionId], (err) => {
        if (err) {
            console.error("Error deleting votes:", err);
            return res.status(500).send("Error deleting votes.");
        }

        con.query(deleteContestants, [electionId], (err) => {
            if (err) {
                console.error("Error deleting contestants:", err);
                return res.status(500).send("Error deleting contestants.");
            }

            con.query(deleteElection, [electionId], (err) => {
                if (err) {
                    console.error("Error deleting election:", err);
                    return res.status(500).send("Error deleting election.");
                }
                res.sendStatus(200);
            });
        });
    });
});

router.get("/students", (req, res) => {
    const query = `
        SELECT s.regno, COALESCE(CONCAT(s.fname, ' ', s.lname), 'Unknown') AS name, 
       d.degree_name, b.branch_name, s.year
FROM student_info s
JOIN degree_info d ON s.degree_id = d.degree_id
JOIN branch_info b ON s.branch_id = b.branch_id;

    `;

    con.query(query, (err, results) => {
        if (err) return res.status(500).send(err);
        res.render("admin/students", { students: results });
    });
});

// Delete student
router.post("/students/delete/:id", (req, res) => {
    const regno = req.params.id;
    con.query("DELETE FROM student_info WHERE regno = ?", [regno], (err, result) => {
        if (err) return res.status(500).send(err);
        res.redirect("/admin/students");
    });
});




// ✅ Fix Logout Route
router.get("/logout", logout);

module.exports = router;


