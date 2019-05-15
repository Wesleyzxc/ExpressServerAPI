const express = require("express");
const mysql = require("mysql");

const router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "The World Database API" });
});

router.post("/api/search", function (req, res, next) {
  // res.render('index', { title: 'Lots of route available' });
  let token = req.headers['x-access-token'];
  let results = [];

  if (!token) return res.status(401).send({ auth: false, error: 'Looks like the authorization header is missing!' });
  req.jwt.verify(token, req.cf.secret, function (err, decoded) {
    if (err) {
      return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
    }
    else {
      req.db
        .from("offences")
        .select("area")
        .sum(`${req.body.offence} as total`)
        .groupBy("area")
        .then(rows => {
          rows.map(row => {
            results.push({ "LGA": row.area, "total": row.total });
            // console.log(results);
          })
          res.status(200).json({ "query": req.body.offence, "results": { results } });
        })
        .catch(err => {
          return res.json({ "message": "something is wrong with your parameters!" })
        });
    }
  })

});

router.post("/api/login", function (req, res, next) {
  req.db
    .from("users")
    .select("password")
    .where({ email: req.body.email })
    .then(data => {
      if (data) { return data[0].password };
      throw new Error(data.error);
    })
    .then(response => {
      let token = req.bc.compare(req.body.password, response)
        .then(response => {
          // true
          if (response) {
            let token = req.jwt.sign({ id: req.body.email }, req.cf.secret, {
              expiresIn: 86400 // expires in 24 hours
            });
            return token;
          }
          else { console.log("Your credentials are wrong") }
        })
      return token;
    }).then(result => {
      res.status(200).send({ "token": result, "expiresIn": 86400 });
    })

    .catch(function (err) {
      // res.status(401).send({ "message": "Your credentials are wrong" })
    })

});

// res.status(200).send({ "token": returnToken });

router.post("/api/register", function (req, res, next) {
  // res.render('index', { title: 'Lots of route available' });
  // body is  x-www-form-urlencoded
  let hashedPassword = req.bc.hashSync(req.body.password, 8);
  console.log(hashedPassword);
  // let second = req.bc.hashSync("demouserpassword", 8);
  // console.log(second);

  req
    .db("users")
    .insert({ email: req.body.email, password: hashedPassword })
    .then(data => {
      // console.log(data); // just the id
      res.status(200).send({ message: "you successfully registered" });
    })
    .catch(err => {
      console.log("Your account already exists.");
      res.status(400);
      res.json({ message: "this user exists." });
    });
});

router.get("/api/offences", function (req, res) {
  req.db
    .from("offence_columns")
    .select("pretty as offence")
    .then(rows => {
      let reducedArray = [];
      rows.map(row => {
        reducedArray.push(row.offence);
      });
      res.json({ Offences: reducedArray });
    })
    .catch(err => {
      // console.log(err);
      res.json({ Error: true, Message: "Error in MySQL query" });
    });
});

router.get("/api/areas", function (req, res, next) {
  req.db
    .from("areas")
    .select("*")
    .then(rows => {
      res.json({
        Error: false,
        Message: "Success",
        "Local Government Areas": rows
      });
    })
    .catch(err => {
      // console.log(err);
      res.json({ Error: true, Message: "Error in MySQL query" });
    });
});

router.get("/api/ages", function (req, res, next) {
  req.db
    .from("offences")
    .select("age")
    .distinct()
    .then(rows => {
      let reducedArray = [];
      rows.map(row => {
        reducedArray.push(row.age);
      });
      res.json({ Error: false, Message: "Success", Age: reducedArray });
    })
    .catch(er => {
      // console.log(err);
      res.json({ Error: true, Message: "Error executing MySQL query" });
    });
});

router.get("/api/years", function (req, res, next) {
  req.db
    .from("offences")
    .select("year")
    .distinct()
    .then(rows => {
      let reducedArray = [];
      rows.map(row => {
        reducedArray.push(row.year);
      });
      res.json({ Error: false, Message: "Success", Year: reducedArray });
    })
    .catch(er => {
      // console.log(err);
      res.json({ Error: true, Message: "Error executing MySQL query" });
    });
});

router.get("/api/genders", function (req, res, next) {
  req.db
    .from("offences")
    .select("gender")
    .distinct()
    .then(rows => {
      let reducedArray = [];
      rows.map(row => {
        reducedArray.push(row.gender);
      });
      res.json({ Error: false, Message: "Success", Gender: reducedArray });
    })
    .catch(er => {
      // console.log(err);
      res.json({ Error: true, Message: "Error executing MySQL query" });
    });
});

module.exports = router;
