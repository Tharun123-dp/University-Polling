var con = require("./connection");
var express = require("express");
var app = express();
var bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ Correct view engine setup
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/register.html");
});

app.post("/", (req, res) => {
    var name = req.body.name;
    var email = req.body.email;
    var mno = req.body.mno;

    var sql = "INSERT INTO students(name, email, mno) VALUES (?, ?, ?)";
    con.query(sql, [name, email, mno], (error, result) => {
        if (error) {
            console.error("Error inserting data:", error);
            return res.status(500).send("Database error");
        }
        res.redirect("/students");
        res.send("Student registered successfully. ID: " + result.insertId);
    });
});

app.get("/students", (req, res) => {
    var sql = "SELECT * FROM students";
    con.query(sql, (error, result) => {
        if (error) {
            console.error("Error fetching students:", error);
            return res.status(500).send("Database error");
        }
        res.render("students", { students: result });  // ✅ No need for __dirname
    });
});

app.get("/delete-student",(req,res)=>{
    con.connect((error)=>{
        if(error) console.log(error);
        var sql = "delete from students where id=?";
        var id = req.query.id;
        con.query(sql,[id],(error, result) => {
            if (error) {
                console.log(error);
            }
            res.redirect("/students");
        });
    })
    
})

app.get("/update-student",(req,res)=>{
    con.connect((error)=>{
        if(error) console.log(error);
        var sql = "select * from students where id=?";
        var id = req.query.id;
        con.query(sql,[id],(error, result) => {
            if (error) {
                console.log(error);
            }
            res.render("update",{student:result});
        });
    })
    
})


app.post("/update-student",(req,res)=>{
    var name =req.body.name;
    var email =req.body.email;
    var mno = req.body.mno;
    var id = req.body.id;
    con.connect((error)=>{
        if(error) console.log(error);
        var sql = "update students set name=? ,email=? ,mno=? where id=?";
        
        con.query(sql,[name,email,mno,id],(error, result) => {
            if (error) {
                console.log(error);
            }
            res.redirect("/students");
        });
    })
})

app.get("/search-students",(req,res)=>{
    var sql = "SELECT * FROM students";
    con.query(sql, (error, result) => {
        if (error) {
            console.error("Error fetching students:", error);
            return res.status(500).send("Database error");
        }
        res.render("search-students", { students: result });  // ✅ No need for __dirname
    });
})

// app.get("/search",(req,res)=>{
//     var name = req.query.name;
//     var email = req.query.email;
//     var mno = req.query.mno;

//     con.connect((error)=>{
//         if(error) console.log(error);

//         var sql = "SELECT * FROM students WHERE name LIKE '%"+name+"%' AND '%"+email+"%' AND '%"+mno+"%'";

//         con.query(sql,[name,email.mno],(error,result)=>{
//             if(error) console.log(error);
//             res.render("search-students",{students:result});
//         })
//     })
// })

app.get("/search", (req, res) => {
    var name = req.query.name || "";
    var email = req.query.email || "";
    var mno = req.query.mno || "";

    var sql = "SELECT * FROM students WHERE name LIKE ? AND email LIKE ? AND mno LIKE ?";

    var values = [`%${name}%`, `%${email}%`, `%${mno}%`]; // ✅ Correct parameterized values

    con.query(sql, values, (error, result) => {  // ✅ No need for `con.connect()`
        if (error) {
            console.error("Error fetching search results:", error);
            return res.status(500).send("Database error");
        }
        res.render("search-students", { students: result });
    });
});


app.listen(7000, () => {
    console.log("Server running on port 7000");
});
