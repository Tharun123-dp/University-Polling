const express = require("express");
const router = express.Router();
const { registeradmin, loginuser, logout } = require("../controllers/authcontroller");
const isAdminLogin = require("../middlewares/isAdminLogin");

// Admin login page
router.get("/", (req, res) => {
    console.log("✅ GET /admin accessed");
    res.render("adminlog"); // Ensure 'views/adminlog.ejs' exists
});

// Admin login form
router.get("/login", (req, res) => {
    console.log("✅ GET /admin/login accessed");
    res.render("adminlogin"); // Ensure 'views/adminlogin.ejs' exists
});

// Admin registration handler
router.post("/", registeradmin);

// Admin login handler
router.post("/login", loginuser);

// Protected create page
router.get("/create", isAdminLogin, (req, res) => {
    console.log("✅ GET /admin/create accessed");
    res.render("createElection", { admin: req.admin });
});

router.get("/dash",isAdminLogin,(req,res)=>{
    res.render("adminDashboard", {admin : req.admin});
})

// Admin logout handler
router.get("/logout", (req, res) => {
    res.cookie("token", "", { expires: new Date(0) }); // Clears token
    req.flash("success", "Logged out successfully.");
    res.redirect("/admin/login");
});

module.exports = router;
