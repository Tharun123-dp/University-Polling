const bcrypt = require("bcrypt");

(async () => {
    let enteredPassword = "1234"; // Your entered password
    let storedHash = "$2b$10$/jBSWp.eCZVk0"; // Your stored hash

    let isMatch = await bcrypt.compare(enteredPassword, storedHash);
    console.log("Does it match?:", isMatch);
})();

// // ✅ Edit Student (Render Edit Page)
// router.get("/editStudent/:id", isAdminLogin, (req, res) => {
//     const studentId = req.params.id;

//     const studentQuery = `
//     SELECT s.student_id, s.fname, s.lname, s.email, b.branch_name, d.degree_name 
//     FROM student_info s
//     JOIN branch_info b ON s.branch_id = b.branch_id
//     JOIN degree_info d ON s.degree_id = d.degree_id
// `;


//     const branchQuery = "SELECT * FROM branch_info";
//     const degreeQuery = "SELECT * FROM degree_info";

//     con.query(studentQuery, [studentId], (err, studentResult) => {
//         if (err) {
//             console.error("Error fetching student:", err);
//             return res.status(500).send("Database error");
//         }

//         con.query(branchQuery, (err, branches) => {
//             if (err) {
//                 console.error("Error fetching branches:", err);
//                 return res.status(500).send("Database error");
//             }

//             con.query(degreeQuery, (err, degrees) => {
//                 if (err) {
//                     console.error("Error fetching degrees:", err);
//                     return res.status(500).send("Database error");
//                 }

//                 res.render("admin/editStudent", { admin: req.admin, student: studentResult[0], branches, degrees });
//             });
//         });
//     });
// });

// // ✅ Update Student
// router.post("/editStudent/:id", isAdminLogin, (req, res) => {
//     const studentId = req.params.id;
//     const { fname, lname, email, branch_id, degree_id } = req.body;

//     const query = `
//         UPDATE student_info 
//         SET fname = ?, lname = ?, email = ?, branch_id = ?, degree_id = ? 
//         WHERE id = ?
//     `;

//     con.query(query, [fname, lname, email, branch_id, degree_id, studentId], (err) => {
//         if (err) {
//             console.error("Error updating student:", err);
//             return res.status(500).send("Database error");
//         }
//         res.redirect("/admin/students");
//     });
// });

// // ✅ Delete Student
// router.get("/deleteStudent/:id", isAdminLogin, (req, res) => {
//     const studentId = req.params.id;
//     const query = "DELETE FROM student_info WHERE id = ?";

//     con.query(query, [studentId], (err) => {
//         if (err) {
//             console.error("Error deleting student:", err);
//             return res.status(500).send("Database error");
//         }
//         res.redirect("/admin/students");
//     });
// });

// router.get("/elections", isAdminLogin, (req, res) => {
//     const query = "SELECT * FROM election_info";

//     con.query(query, (err, elections) => {
//         if (err) {
//             console.error("Error fetching elections:", err);
//             return res.status(500).send("Database error");
//         }
//         res.render("admin/elections", { admin: req.admin, elections });
//     });
// });

// ✅ Create Election (Render Form)

// // ✅ Edit Election (Render Edit Page with Existing Data)
// router.get("/editElection/:id", isAdminLogin, (req, res) => {
//     const electionId = req.params.id;
//     const query = "SELECT * FROM election_info WHERE id = ?";

//     con.query(query, [electionId], (err, result) => {
//         if (err) {
//             console.error("Error fetching election:", err);
//             return res.status(500).send("Database error");
//         }
//         if (result.length === 0) {
//             return res.status(404).send("Election not found");
//         }

//         res.render("admin/editElection", { admin: req.admin, election: result[0] });
//     });
// });

// // ✅ Update Election (Handle Form Submission)
// router.post("/editElection/:id", isAdminLogin, (req, res) => {
//     const electionId = req.params.id;
//     const { election_name, election_roles, eligible_year, start_registration_date, end_registration_date, election_date, election_start_time, election_end_time } = req.body;

//     const query = `
//         UPDATE election_info 
//         SET election_name = ?, election_roles = ?, eligible_year = ?, 
//             start_registration_date = ?, end_registration_date = ?, election_date = ?, 
//             election_start_time = ?, election_end_time = ? 
//         WHERE id = ?
//     `;

//     con.query(query, [election_name, election_roles, eligible_year, start_registration_date, end_registration_date, election_date, election_start_time, election_end_time, electionId], (err) => {
//         if (err) {
//             console.error("Error updating election:", err);
//             return res.status(500).send("Database error");
//         }
//         res.redirect("/admin/elections");
//     });
// });

// // ✅ Delete Election
// router.get("/deleteElection/:id", isAdminLogin, (req, res) => {
//     const electionId = req.params.id;
//     const query = "DELETE FROM election_info WHERE id = ?";

//     con.query(query, [electionId], (err) => {
//         if (err) {
//             console.error("Error deleting election:", err);
//             return res.status(500).send("Database error");
//         }
//         res.redirect("/admin/elections");
//     });
// });

// ✅ Fix Logout Route
// ✅ Fetch and Display All Students
// router.get("/students", isAdminLogin, (req, res) => {
//     const query = `
//         SELECT s.id, s.fname, s.lname, s.email, b.branch_name, d.degree_name 
//         FROM student_info s
//         JOIN branch_info b ON s.branch_id = b.branch_id
//         JOIN degree_info d ON s.degree_id = d.degree_id
//     `;

//     con.query(query, (err, students) => {
//         if (err) {
//             console.error("Error fetching students:", err);
//             return res.status(500).send("Database error");
//         }
//         res.render("admin/students", { admin: req.admin, students });
//     });
// });