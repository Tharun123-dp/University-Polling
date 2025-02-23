const express = require("express");
const app = express();
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const session = require("express-session");
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const adminRouter = require("./routes/admin");
const con = require("./connection");

// Load environment variables
dotenv.config({ path: "./.env" });

app.use(
    session({
        secret: process.env.SESSION_SECRET || "your_secret_key",
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 60000 }, // Session expiration time
    })
);

app.use(flash());

// Middleware for flash messages
app.use((req, res, next) => {
    res.locals.message = req.flash("message");
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Set view engine
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static("public"));

// Home route
app.get("/", (req, res) => {
    res.render("home");
});

// Admin routes
app.use("/admin", adminRouter);

// Start server
app.listen(7000, () => {
    console.log("✅ Server running on port 7000");
});
