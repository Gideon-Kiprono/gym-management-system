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
  //console.log("Home route requested");
  // check if req.sessision.user---
  conn.query(
    "SELECT trainees.name,trainees.startDate,trainees.endDate, plans.description, trainees.email FROM trainees INNER JOIN plans ON trainees.plan_id=plans.plan_id",
    (sqlerr, trainees) => {
      if (sqlerr) {
        res.send("Database error occured");
        console.log(sqlerr);
      } else {
        //console.log(trainees);
        if (req.session.user) {
          res.render("home.ejs", {
            trainees: trainees,
            user: req.session.user,
          });
        } else {
          res.render("home.ejs", { trainees: trainees });
        }
      }
    }
  );
});
app.get("/plans", async (req, res) => {
  try {
    const data = await conn.query("SELECT * FROM plans", (sqlerr, plans) => {
      if (sqlerr) {
        console.log("Error retrieving data from the database");
      } else {
        //console.log(plans);
        res.render("plans.ejs", { plans });
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/login", (req, res) => {
  res.render("login.ejs");
});
app.get("/updateusers", (req, res) => {
  res.render("updateUsers.ejs");
});
app.get("/signUp", (req, res) => {
  res.render("Signup.ejs");
});
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

//post routes
app.post("/signUp", (req, res) => {
  //console.log(req.body);
  hashedPasword = bcrypt.hashSync(req.body.pass, saltRounds);
  conn.query(
    "INSERT INTO users (users_name, email, gender, password,role) VALUES (?,?,?,?,?)",
    [
      req.body.name,
      req.body.email,
      req.body.gender,
      hashedPasword,
      req.body.role,
    ],
    (sqlerr) => {
      if (sqlerr) {
        console.log(sqlerr);
        res.send("An db error occured while signing up!");
      } else {
        res.redirect("/login");
      }
    }
  );
});
app.post("/addUser", (req, res) => {
  //   //save the data to the db
  //   //redirect the user to home route
  //console.log(req.body);
  conn.query(
    "INSERT INTO trainees (plan_id,email, name, phone_number,startDate,endDate) VALUES (?,?,?,?,?,?)",
    [
      Number(req.body.plan),
      req.body.email,
      req.body.name,
      Number(req.body.phone),
      req.body.startDate,
      req.body.endDate,
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
app.post("/login", (req, res) => {
  conn.query(
    "SELECT * FROM users WHERE email=?",
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
          //console.log(dbresult); // making sure email exists
          //console.log(bcrypt.compareSync(req.body.pass, dbresult[0].password));
          if (bcrypt.compareSync(req.body.pass, dbresult[0].password)) {
            // create a session
            console.log("Logged in successfully");
            req.session.user = dbresult[0]; // in sess
            req.session.cookie.expires = new Date(Date.now() + 1000000);
            res.redirect("/");
          } else {
            res.send("Incorrect password");
          }
        }
      }
    }
  );
});
app.post("/plansUpdate", (req, res) => {
  console.log(req.body);
  conn.query(
    "INSERT INTO plans (plan_name,amount,duration,description) VALUES(?,?,?,?)",
    [
      req.body.name,
      Number(req.body.amount),
      Number(req.body.duration),
      req.body.description,
    ],
    (sqlerr) => {
      if (sqlerr) {
        res.send("A database error occured while adding a new plan");
        console.log(sqlerr);
      } else {
        res.redirect("/plans");
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
