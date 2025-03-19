const express = require("express");
const app = express();
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const session = require("express-session");
const flash = require("express-flash");
const cookieParser = require("cookie-parser");
const adminRouter = require("./routes/admin");
const userRouter = require("./routes/student");
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
    res.locals.message = req.flash("message") || [];
    res.locals.error = req.flash("error") || [];
    res.locals.success = req.flash("success") || [];
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
    res.render("home", { student: req.session.student });
});

app.get("/about", (req, res) => {
    res.render("about");
});

// Admin routes
app.use("/admin", adminRouter);
app.use("/student", userRouter);

// 🔄 **Election Status Update Function**
const updateElectionStatus = () => {
    const query = `
        UPDATE election_info 
        SET status = 
            CASE 
                WHEN NOW() >= CONCAT(election_date, ' ', election_start_time) 
                     AND NOW() <= CONCAT(election_date, ' ', election_end_time) THEN 'active'
                WHEN NOW() > CONCAT(election_date, ' ', election_end_time) THEN 'completed'
                ELSE 'upcoming'
            END
    `;

    con.query(query, (err, result) => {
        if (err) {
            console.error("❌ Error updating election statuses:", err);
        } else {
            console.log(`✅ Election statuses updated. ${result.affectedRows} rows affected.`);
        }
    });
};


// Run this function every **60 seconds** to update election statuses
setInterval(updateElectionStatus, 60000);

// Start server
app.listen(7000, () => {
    console.log("✅ Server running on port 7000");
});
