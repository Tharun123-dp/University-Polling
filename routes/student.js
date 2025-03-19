const express = require("express");
const router = express.Router();
const con = require("../connection");
const { loginStudent, logoutStudent } = require("../controllers/usercontroller");
const isUserLogin = require("../middlewares/isUserLogin");

router.get("/login", (req, res) => {
    res.render("userLogin", { messages: req.flash() });
});

router.post("/contest", isUserLogin, (req, res) => {
    const { electionId, whyParticipate } = req.body; // Fetch electionId from frontend
    const regno = req.session.student?.regno; // Get student regno from session

    console.log("Received Contest Request:", { electionId, whyParticipate, regno }); // Debugging

    if (!electionId || !whyParticipate || !regno) {
        console.error("Missing required fields:", { electionId, whyParticipate, regno });
        return res.status(400).json({ message: "Missing required fields" });
    }

    // Step 1: Check if the student has already contested
    const checkQuery = `SELECT 1 FROM contestant_election_info WHERE election_id = ? AND regno = ?`;
    con.query(checkQuery, [electionId, regno], (err, result) => {
        if (err) {
            console.error("Database error checking existing contest entry:", err);
            return res.status(500).json({ message: "Database error. Please try again." });
        }
        if (result.length > 0) {
            console.warn("Student has already contested:", { regno, electionId });
            return res.status(400).json({ message: "You have already contested this election." });
        }

        // Step 2: Insert contestant into `contestant_election_info`
        const insertQuery = `
            INSERT INTO contestant_election_info (election_id, regno, why_participate, no_of_votes)
            VALUES (?, ?, ?, 0)`;

        con.query(insertQuery, [electionId, regno, whyParticipate], (err) => {
            if (err) {
                console.error("Failed to insert contest entry:", err);
                return res.status(500).json({ message: "Failed to contest. Try again." });
            }
            console.log("Successfully registered as a contestant:", { regno, electionId });
            res.json({ message: "Successfully registered as a contestant!" });
        });
    });
});





router.get("/elections", isUserLogin, (req, res) => {
    const regno = req.session.student?.regno;
    if (!regno) return res.status(401).send("Unauthorized: Please login first.");

    console.log("Fetching elections for student:", regno);
    const studentQuery = `SELECT degree_id, branch_id FROM student_info WHERE regno = ?`;

    con.query(studentQuery, [regno], (error, studentResult) => {
        if (error || studentResult.length === 0) return res.status(500).send("Internal Server Error");

        const { degree_id, branch_id } = studentResult[0];
        const electionQuery = `
            SELECT election_id, election_name, election_roles, 
            CASE 
                WHEN NOW() < end_registration_date THEN 'registration'
                WHEN NOW() BETWEEN election_date AND TIMESTAMP(election_date, election_end_time) THEN 'active'
                ELSE 'completed'
            END AS status
            FROM election_info
            WHERE (degree_id = ? AND (branch_id = ? OR all_branch = 1)) OR all_degree = 1;
        `;

        con.query(electionQuery, [degree_id, branch_id], (error, elections) => {
            if (error) return res.status(500).send("Internal Server Error");
            res.render("elections", { student: req.session.student, elections });
        });
    });
});

router.post("/vote", isUserLogin, (req, res) => {
    const { electionId, contestantId } = req.body;
    const regno = req.session.student?.regno;
    if (!electionId || !contestantId || !regno) return res.status(400).json({ message: "Missing required fields" });

    const checkQuery = "SELECT * FROM voted_students_info WHERE regno = ? AND election_id = ?";
    con.query(checkQuery, [regno, electionId], (err, result) => {
        if (err || result.length > 0) return res.status(400).json({ message: "You have already voted!" });
        
        const insertVote = "INSERT INTO voted_students_info (election_id, regno, contestant_id, date, time) VALUES (?, ?, ?, CURDATE(), NOW())";
        con.query(insertVote, [electionId, regno, contestantId], (err) => {
            if (err) return res.status(500).json({ message: "Error processing vote." });

            const updateVote = "UPDATE contestant_election_info SET no_of_votes = no_of_votes + 1 WHERE election_id = ? AND regno = ?";
            con.query(updateVote, [electionId, contestantId], (err) => {
                if (err) return res.status(500).json({ message: "Error updating vote count." });
                res.json({ message: "Vote submitted successfully!" });
            });
        });
    });
});

router.post("/login", loginStudent);
router.get("/logout", logoutStudent);

module.exports = router;
