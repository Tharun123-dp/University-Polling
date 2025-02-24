const express = require("express");
const router = express.Router();
const { registeradmin, loginuser, logout } = require("../controllers/authcontroller");
const isAdminLogin = require("../middlewares/isAdminLogin");

router.get("/", (req, res) => {
    // console.log("✅ GET /admin accessed");
    res.render("adminlog");
});

router.get("/login", (req, res) => {
    // console.log("✅ GET /admin/login accessed");
    res.render("adminlogin");
});

router.post("/", registeradmin);
router.post("/login", loginuser);

router.get("/create", isAdminLogin, (req, res) => {
    // console.log("✅ GET /admin/create accessed");
    res.render("createElection", { admin: req.admin });
});

router.get("/dash", isAdminLogin, (req, res) => {
    res.render("adminDashboard", { admin: req.admin });
});

router.get("/logout", logout);

module.exports = router;
