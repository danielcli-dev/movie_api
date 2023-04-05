const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const { query } = require("express");
const app = express();
const uuid = require("uuid");
app.use(morgan("common"));
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());
app.use(methodOverride());


let users = [];
let movies = [
  {
    title: "The Shawshank Redemption",
    year: "1994",
    description:
      "Over the course of several years, two convicts form a friendship, seeking consolation and, eventually, redemption through basic compassion.",
    genre: ["Drama"],
    director: "Frank Darabont",
    imageURL: "",
  },
  {
    title: "The Godfather",
    year: "1972",
    description:
      "The aging patriarch of an organized crime dynasty in postwar New York City transfers control of his clandestine empire to his reluctant youngest son.",
    genre: ["Crime", "Drama"],
    director: "Francis Ford Coppola",
    imageURL: "",
  },
  {
    title: "The Dark Knight",
    year: "2008",
    description:
      "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
    genre: ["Action", "Crime", "Drama"],
    director: "Christopher Nolan",
    imageURL: "",
  },
  {
    title: "The Godfather Part II",
    year: "1974",
    description:
      "The early life and career of Vito Corleone in 1920s New York City is portrayed, while his son, Michael, expands and tightens his grip on the family crime syndicate.",
    genre: ["Crime", "Drama"],
    director: "Francis Ford Coppola",
    imageURL: "",
  },
  {
    title: "12 Angry Men",
    year: "1957",
    description:
      "The jury in a New York City murder trial is frustrated by a single member whose skeptical caution forces them to more carefully consider the evidence before jumping to a hasty verdict.",
    genre: ["Crime", "Drama"],
    director: "Sidney Lumet",
    imageURL: "",
  },
  {
    title: "Schindler's List",
    year: "1993",
    description:
      "In German-occupied Poland during World War II, industrialist Oskar Schindler gradually becomes concerned for his Jewish workforce after witnessing their persecution by the Nazis.",
    genre: ["Biography", "Drama", "History"],
    director: "Steven Spielberg",
    imageURL: "",
  },
  {
    title: "The Lord of the Rings: The Return of the King",
    year: "2003",
    description:
      "Gandalf and Aragorn lead the World of Men against Sauron's army to draw his gaze from Frodo and Sam as they approach Mount Doom with the One Ring.",
    genre: ["Action", "Adventure", "Drama"],
    director: "Peter Jackson",
    imageURL: "",
  },
  {
    title: "Pulp Fiction",
    year: "1994",
    description:
      "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
    genre: ["Crime", "Drama"],
    director: "Quentin Tarantino",
    imageURL: "",
  },
  {
    title: "The Lord of the Rings: The Fellowship of the Ring",
    year: "2001",
    description:
      "A meek Hobbit from the Shire and eight companions set out on a journey to destroy the powerful One Ring and save Middle-earth from the Dark Lord Sauron.",
    genre: ["Action", "Adventure", "Drama"],
    director: "Peter Jackson",
    imageURL: "",
  },
  {
    title: "The Good, the Bad and the Ugly",
    year: "1966",
    description:
      "A bounty hunting scam joins two men in an uneasy alliance against a third in a race to find a fortune in gold buried in a remote cemetery.",
    genre: ["Adventure", "Western"],
    director: "Sergio Leone",
    imageURL: "",
  },
];

// Setting up middleware
app.use(express.static("public"));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// API Endpoints
// Home Page
app.get("/", (req, res) => {
  res.send("This is the Home Page!");
});

// Get list of all movies
app.get("/movies", (req, res) => {
  res.json(movies);
});

// Get data on specific movie
app.get("/movies/:title", (req, res) => {
  res.json(
    movies.find((movie) => {
      return movie.title === req.params.title;
    })
  );
});
// Find genre of specific movie
app.get("/movies/:title/genre", (req, res) => {
  movies.find((movie) => {
    if (movie.title === req.params.title) {
      return res.json(movie.genre);
    }
  });
});
// Get list of users
// app.get("/users", (req, res) => {
//   res.json(users);
// });

// Create new user
app.post("/users", (req, res) => {
  let newUser = req.body;

  if (!newUser.name) {
    const message = "Missing name in request body";
    res.status(400).send(message);
  } else {
    newUser.id = uuid.v4();
    newUser.favorites = [];
    users.push(newUser);

    res.status(201).send(newUser);
  }
});

// Change username
app.put("/users/:name", (req, res) => {
  let user = users.find((user) => {
    return user.name === req.params.name;
  });

  let oldName = user.name;

  if (user) {
    user.name = req.body.newName;
    res.status(200).send(oldName + " has changed to " + req.body.newName);
  } else {
    res.status(400).send("Name change failed");
  }
});
// Add movie to users favorites
app.post("/users/:name/add", (req, res) => {
  let user = users.find((user) => {
    return user.name === req.params.name;
  });

  if (user && user.favorites.includes(req.body.movie)) {
    res.status(400).send(req.body.movie + " is already added");
  } else if (user && !user.favorites.includes(req.body.movie)) {
    user.favorites.push(req.body.movie);
    res.status(201).send(req.body.movie + " has been added");
  } else {
    res.status(400).send("Adding movie failed");
  }
});

// Delete movie from users favorites
app.delete("/users/:name/remove", (req, res) => {
  let user = users.find((user) => {
    return user.name === req.params.name;
  });

  if (user && user.favorites.includes(req.body.movie)) {
    user.favorites.splice(user.favorites.indexOf(req.body.movie), 1);
    res.status(200).send(req.body.movie + " has been removed");
  } else if (user && !user.favorites.includes(req.body.movie)) {
    res.status(400).send(req.body.movie + " does not exist");
  } else {
    res.status(400).send("Removing movie failed");
  }
});

// Delete user
app.delete("/users/:name/deregister", (req, res) => {
  let user = users.find((user) => {
    return user.name === req.params.name;
  });
  if (user) {
    users.splice(users.indexOf(user), 1);
    res.status(200).send(req.params.name + " has been deleted");
  } else {
    res.status(400).send("Deregister has failed");
  }
});

app.listen(8080, () => {
  console.log("listening");
});

