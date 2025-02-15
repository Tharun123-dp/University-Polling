// var con = require("./connection");
var express = require("express");
var app = express();
var bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ Correct view engine setup
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static('public'));  // Ensure CSS is inside 'public'


app.get("/", (req, res) => {
    res.sendFile(__dirname + "/html/home.html");
});




app.listen(7000, () => {
    console.log("Server running on port 7000");
});
