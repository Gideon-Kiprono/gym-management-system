const express = require("express");
const bcrypt = require("bcrypt");
const saltRounds = 6;
const mysql = require("mysql");
const session = require("express-session");

//Connect to database
var conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "gym-ms",
});

//Test the connection
conn.connect((connerr) => {
  if (connerr) {
    console.log("Cannot connect to the database");
  } else {
    console.log("Connection is successful!");
  }
});

const app = express();

const port = process.env.port || 3005;

//Middlewares
app.use(express.static("public")); // -  Static files middleware
app.use(express.urlencoded({ extended: false })); //Supplies req.body with the form data

app.use(
  session({
    secret: "secret word",
    resave: false,
    saveUninitialized: false,
  })
);

//Get routes request
app.get("/", (req, res) => {
  console.log("Home route requested");
  conn.query("SELECT * FROM trainees", (sqlerr, trainees) => {
    if (sqlerr) {
      res.send("Database error occured");
      console.log(sqlerr);
    } else {
      console.log(trainees);
      res.render("home.ejs", { trainees: trainees });
    }
  });
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});
app.get("/updateusers", (req, res) => {
  res.render("updateUsers.ejs");
});

//post routes
app.post("/addUser", (req, res) => {
  //save the data t the db
  //redirect the user to home route
  const hashedPasword = bcrypt.hashSync(req.body.pass, saltRounds);
  console.log(req.body);
  conn.query(
    "INSERT INTO trainees (plan_id,email, name, phone_number, password) VALUES (?,?,?,?,?)",
    [
      Number(req.body.plan),
      req.body.email,
      req.body.name,
      Number(req.body.phone),
      hashedPasword,
    ],
    (sqlerr) => {
      if (sqlerr) {
        console.log(sqlerr);
        res.send("An db error occured while addding a new user");
      } else {
        res.redirect("/");
      }
    }
  );
});
/*app.post("/login",(req,res)=>{
  conn.query("SELECT * FROM trainees WHERE email=?"[req.body.email], (sqlerr, dbresult) => {
    if (sqlerr) {
      res.send("Database error occured")
      console.log(sqlerr);
    } else {
      console.log(dbresult);
      if (dbresult.length <1) {
        res.send("User with email "+req.body.email+ "does not exist")
      } else {
        console.log(dbresult);//making sure email exists
        if (bcrypt.compareSync(req.body.password,dbresult[0].password)) {
          //create a session
          req.session.user = dbresult[0]
          req.session.cookie.expires = new Date(Date.now() + 1000000)
          res.redirect("/")
        } else {
          res.send("Incorrect password")
        }
      }
    }
  })
});*/
app.post("/login", (req, res) => {
  conn.query(
    "SELECT * FROM trainees WHERE email=?",
    [req.body.email],
    (sqlerr, dbresult) => {
      if (sqlerr) {
        res.send("Database error occurred");
        console.log(sqlerr);
      } else {
        console.log(dbresult);
        if (dbresult.length < 1) {
          res.send("User with email " + req.body.email + " does not exist");
        } else {
          console.log(dbresult); // making sure email exists
          if (bcrypt.compareSync(req.body.pass, dbresult[0].password)) {
            // create a session
            console.log("Logged in successfully");
            req.session.user = dbresult[0];
            req.session.cookie.expires = new Date(Date.now() + 1000000);
            res.redirect("/");
          } else {
            res.send("Incorrect password");
            console.log("Entered password:", req.body.pass);
            console.log("Stored hashed password:", dbresult[0].password);
          }
        }
      }
    }
  );
});

app.listen(port, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("App is running and listening on port 3005");
  }
});
