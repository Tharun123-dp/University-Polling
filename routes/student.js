const express = require("express");
const router = express.Router();
const con = require("../connection");
const { loginStudent, logoutStudent } = require("../controllers/usercontroller");
const isUserLogin = require("../middlewares/isUserLogin");

// ✅ Render Login Page
router.get("/login", (req, res) => {
    res.render("userLogin", { messages: req.flash() });
});

router.get('/profile', (req, res) => {
    if (!req.session.student) {
        return res.redirect('/student/login'); // Redirect if not logged in
    }

    const regno = req.session.student.regno; // Assuming 'regno' is stored in session

    const query = 'SELECT regno, fname, lname, email, year, gender, address, mno FROM student_info WHERE regno = ?';

    con.query(query, [regno], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal Server Error');
        }

        if (results.length === 0) {
            return res.status(404).send('Student not found');
        }

        res.render('profile', { student: results[0] });
    });
});

// ✅ Student Contest for Elections
router.post("/contest", isUserLogin, (req, res) => {
    const { electionId, whyParticipate } = req.body;
    const regno = req.session.student?.regno;

    // console.log("Received Contest Request:", { electionId, whyParticipate, regno });

    if (!electionId || !whyParticipate || !regno) {
        console.error("❌ Missing required fields:", { electionId, whyParticipate, regno });
        return res.status(400).json({ message: "Missing required fields" });
    }

    // 🔹 Step 1: Check if the election is in "registration" status
    const electionQuery = `
        SELECT status FROM election_info 
        WHERE election_id = ? 
        AND NOW() BETWEEN start_registration_date AND end_registration_date
    `;
    
    con.query(electionQuery, [electionId], (err, electionResult) => {
        if (err) {
            console.error("❌ Database error checking election status:", err);
            return res.status(500).json({ message: "Database error. Please try again." });
        }
        if(electionResult.length === 0 || electionResult[0].status.toLowerCase() !== "registration") 
            {
            // console.warn("🚫 Contesting is closed for this election.");
            return res.status(400).json({ message: "Contesting is closed for this election." });
        }

        // 🔹 Step 2: Check if the student has already contested
        const checkQuery = `SELECT 1 FROM contestant_election_info WHERE election_id = ? AND contestant_regno = ?`;
        con.query(checkQuery, [electionId, regno], (err, result) => {
            if (err) {
                console.error("❌ Database error checking existing contest entry:", err);
                return res.status(500).json({ message: "Database error. Please try again." });
            }
            if (result.length > 0) {
                // console.warn("🚫 Student has already contested:", { regno, electionId });
                return res.status(400).json({ message: "You have already contested this election." });
            }

            // 🔹 Step 3: Insert contestant into contestant_election_info
            const insertQuery = `
                INSERT INTO contestant_election_info (election_id, contestant_regno, why_participate, no_of_votes)
                VALUES (?, ?, ?, 0)`;

            con.query(insertQuery, [electionId, regno, whyParticipate], (err) => {
                if (err) {
                    console.error("❌ Failed to insert contest entry:", err);
                    return res.status(500).json({ message: "Failed to contest. Try again." });
                }
                // console.log("✅ Successfully registered as a contestant:", { regno, electionId });
                res.json({ message: "Successfully registered as a contestant!" });
            });
        });
    });
});


router.get("/elections", isUserLogin, (req, res) => {
    const regno = req.session.student?.regno;
    if (!regno) return res.status(401).send("Unauthorized: Please login first.");

    const studentQuery = `SELECT degree_id, branch_id FROM student_info WHERE regno = ?`;

    con.query(studentQuery, [regno], (error, studentResult) => {
        if (error || studentResult.length === 0) {
            console.error("Error fetching student details:", error);
            return res.status(500).send("Internal Server Error");
        }

        const { degree_id, branch_id } = studentResult[0];

        const electionQuery = `
    SELECT e.election_id, e.election_name, e.election_roles, 
        CASE 
            WHEN NOW() >= CAST(e.start_registration_date AS DATETIME) 
                AND NOW() <= TIMESTAMP(e.end_registration_date, '23:59:59') THEN 'registration'
            WHEN NOW() > TIMESTAMP(e.end_registration_date, '23:59:59') 
                AND NOW() < CAST(e.election_date AS DATETIME) THEN 'upcoming'
            WHEN NOW() BETWEEN CAST(e.election_date AS DATETIME) 
                AND TIMESTAMP(e.election_date, e.election_end_time) THEN 'active'
            ELSE 'completed'
        END AS status,
        (SELECT COUNT(*) FROM contestant_election_info ce WHERE ce.election_id = e.election_id 
        AND ce.contestant_regno = ?) AS already_contested,
        r.regno AS winner_regno, 
        IFNULL(CONCAT(s.fname, ' ', s.lname), 'No winner') AS winner_name,
        (SELECT ce.no_of_votes FROM contestant_election_info ce WHERE ce.election_id = e.election_id 
        AND ce.contestant_regno = r.regno) AS winner_votes
    FROM election_info e
    LEFT JOIN election_results r ON e.election_id = r.election_id
    LEFT JOIN student_info s ON r.regno = s.regno
    WHERE (e.degree_id = ? AND (e.branch_id = ? OR e.all_branch = 1)) OR e.all_degree = 1;
`;


        con.query(electionQuery, [regno, degree_id, branch_id], (error, elections) => {
            if (error) {
                console.error("Error fetching elections:", error);
                return res.status(500).send("Internal Server Error");
            }

            let pendingQueries = elections.length; // Counter to track queries
            if (pendingQueries === 0) {
                return res.render("elections", { student: req.session.student, elections });
            }

            elections.forEach((election) => {
                if (election.status === "completed" && !election.winner_regno) {
                    console.log(`⚡ Auto-declaring winner for Election ID: ${election.election_id}`);

                    const winnerQuery = `
                        SELECT contestant_regno AS regno, no_of_votes 
                        FROM contestant_election_info 
                        WHERE election_id = ? 
                        ORDER BY no_of_votes DESC 
                        LIMIT 1
                    `;

                    con.query(winnerQuery, [election.election_id], (err, winners) => {
                        if (err) {
                            console.error("❌ Error fetching winners:", err);
                        } else if (winners.length > 0) {
                            const winnerRegno = winners[0].regno;
                            const insertWinnerQuery = `INSERT INTO election_results (election_id, regno) VALUES (?, ?)`;

                            con.query(insertWinnerQuery, [election.election_id, winnerRegno], (err) => {
                                if (err) {
                                    console.error("❌ Error inserting winner:", err);
                                } else {
                                    console.log(`🏆 Winner inserted: Election ID ${election.election_id}, Reg No ${winnerRegno}`);
                                }
                            });
                        }
                        pendingQueries--;
                        if (pendingQueries === 0) {
                            res.render("elections", { student: req.session.student, elections });
                        }
                    });
                } else {
                    pendingQueries--;
                    if (pendingQueries === 0) {
                        res.render("elections", { student: req.session.student, elections });
                    }
                }
            });
        });
    });
});




router.get("/election/:electionId/contestants", isUserLogin, (req, res) => {
    const { electionId } = req.params;

    const query = `
        SELECT s.regno, CONCAT(s.fname, ' ', s.lname) AS name 
FROM contestant_election_info c
JOIN student_info s ON c.contestant_regno = s.regno
WHERE c.election_id = ?
`;

    con.query(query, [electionId], (err, results) => {
        if (err) {
            console.error("Error fetching contestants:", err);
            return res.status(500).json({ message: "Internal server error" });
        }
        
        if (results.length === 0) {
            return res.json({ contestants: [] });
        }

        res.json({ contestants: results });
    });
});


// ✅ Handle Voting
router.post("/vote", isUserLogin, (req, res) => {
    const { electionId, contestantId } = req.body;
    const regno = req.session.student?.regno;

    if (!electionId || !contestantId || !regno) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    // Step 1: Check if election is active for voting
    const electionQuery = `
        SELECT election_id FROM election_info 
        WHERE election_id = ? 
        AND NOW() BETWEEN election_date AND TIMESTAMP(election_date, election_end_time)
    `;

    con.query(electionQuery, [electionId], (err, electionResult) => {
        if (err) {
            console.error("❌ Error checking election:", err);
            return res.status(500).json({ message: "Internal server error." });
        }

        if (electionResult.length === 0) {
            return res.status(400).json({ message: "Voting is not open for this election." });
        }

        // Step 2: Check if the student has already voted
        const voteCheckQuery = "SELECT 1 FROM voted_students_info WHERE regno = ? AND election_id = ?";
        con.query(voteCheckQuery, [regno, electionId], (err, voteCheck) => {
            if (err) {
                console.error("❌ Error checking vote:", err);
                return res.status(500).json({ message: "Internal server error." });
            }

            if (voteCheck.length > 0) {
                return res.status(400).json({ message: "You have already voted!" });
            }

            // Step 3: Insert vote
            const insertVoteQuery = `
                INSERT INTO voted_students_info (election_id, regno, contestant_id, date, time) 
                VALUES (?, ?, ?, CURDATE(), NOW())
            `;

            con.query(insertVoteQuery, [electionId, regno, contestantId], (err) => {
                if (err) {
                    console.error("❌ Error inserting vote:", err);
                    return res.status(500).json({ message: "Internal server error." });
                }

                // Step 4: Update vote count
                const updateVoteQuery = `
                    UPDATE contestant_election_info 
                    SET no_of_votes = no_of_votes + 1 
                    WHERE election_id = ? AND contestant_regno = ?
                `;

                con.query(updateVoteQuery, [electionId, contestantId], (err) => {
                    if (err) {
                        console.error("❌ Error updating vote count:", err);
                        return res.status(500).json({ message: "Internal server error." });
                    }

                    res.json({ message: "✅ Vote submitted successfully!" });
                });
            });
        });
    });
});



// ✅ User Authentication
router.post("/login", loginStudent);
router.get("/logout", logoutStudent);

module.exports = router;
