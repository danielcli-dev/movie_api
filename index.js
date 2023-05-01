const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const uuid = require("uuid");
const methodOverride = require("method-override");
const { check, validationResult } = require("express-validator");
const app = express();

const mongoose = require("mongoose");
const Models = require("./models");
const Movies = Models.Movie;
const Users = Models.User;

// mongoose.connect("mongodb://localhost:27017/cfDB", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

mongoose.connect(process.env.CONNECTION_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(methodOverride());
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(morgan("common"));

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
const cors = require("cors");
app.use(cors());

let auth = require("./auth")(app);
const passport = require("passport");
require("./passport");

// Setting up middleware

// API Endpoints
// Home Page
app.get("/", (req, res) => {
  res.send("This is the Home Page!");
});

// Get list of all movies
app.get(
  "/movies",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.find()
      .then((movies) => {
        res.status(201).json(movies);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// Get data on specific movie
app.get(
  "/movies/:title",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.find({ Title: req.params.title })
      .then((movie) => {
        res.status(200).json(movie);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// Find genre description
app.get(
  "/movies/genre/:genreName",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.findOne({ "Genre.Name": req.params.genreName })
      .then((movie) => {
        res.status(200).send(movie.Genre.Description);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);
// Return data about a director by name
app.get(
  "/movies/director/:directorName",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.findOne({ "Director.Name": req.params.directorName })
      .then((movie) => {
        res.status(200).send(movie.Director);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);
// Get list of users

app.get(
  "/users",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.find()
      .then((users) => {
        res.status(201).json(users);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// Get user by username
app.get(
  "/users/:Username",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOne({ Username: req.params.Username })
      .then((user) => {
        if (!user) {
          res.status(400).send(req.params.Username + " was not found");
        } else {
          res.json(user);
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error" + err);
      });
  }
);

// Create new user
app.post(
  "/users",
  [
    check("Username", "Username is required").isLength({ min: 5 }),
    check(
      "Username",
      "Username contains non alphanumeric characters - not allowed."
    ).isAlphanumeric(),
    check("Password", "Password is required").not().isEmpty(),
    check("Email", "Email does not appear to be valid").isEmail(),
  ],
  (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOne({ Username: req.body.Username })
      .then((user) => {
        if (user) {
          return res.status(400).send(req.body.Username + " already exists");
        } else {
          Users.create({
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday,
          })
            .then((user) => {
              res.status(201).json(user);
            })
            .catch((error) => {
              console.error(error);
              res.status(500).send("Error: " + error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);
// Change username
app.put(
  "/users/:Username",
  [
    check("Username", "Username is required").isLength({ min: 5 }),
    check(
      "Username",
      "Username contains non alphanumeric characters - not allowed."
    ).isAlphanumeric(),
  ],
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);

    Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $set: {
          Username: req.body.Username,
          Password: hashedPassword,
          Email: req.body.Email,
          Birthday: req.body.Birthday,
        },
      },
      { new: true }
    )
      .then((user) => {
        if (!user) {
          res.status(400).send(req.params.Username + " was not found");
        } else {
          res.status(200).json(user);
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

// Add movie to users favorites
app.post(
  "/users/:Username/add/:MovieName",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOneAndUpdate(
      { Username: req.params.Username },
      { $addToSet: { FavoriteMovies: req.params.MovieName } },
      { new: true }
    )
      .then((user) => {
        if (!user) {
          res.status(400).send(req.params.Username + " was not found");
        } else {
          res.status(200).json(user);
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// Delete movie from users favorites
app.delete(
  "/users/:Username/remove/:MovieName",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOneAndUpdate(
      { Username: req.params.Username },
      { $pull: { FavoriteMovies: req.params.MovieName } },
      { new: true }
    )
      .then((user) => {
        if (!user) {
          res.status(400).send(req.params.Username + " was not found");
        } else {
          res.status(200).json(user);
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// Delete user
app.delete(
  "/users/:Username/deregister",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOneAndRemove({ Username: req.params.Username })
      .then((user) => {
        if (!user) {
          res.status(400).send(req.params.Username + " was not found");
        } else {
          res.status(200).send(req.params.Username + " was deleted.");
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log("Listening on Port " + port);
});
