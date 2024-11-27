const express = require("express");
const cors = require("cors");
const config = require("./config");
const routes = require("./routes");


const app = express();
app.use(
  cors({
    origin: "*",
  })
);

app.get("/movieNumRatings", routes.movieNumRatings);
app.get("/gameRating", routes.gameRating);
app.get("/gameContaining", routes.gameContaining);
app.get("/ageAppropriateGames", routes.ageAppropriateGames);
app.get("/topMoviesByVotes", routes.topMoviesByVotes);
app.get("/topGameGenres", routes.topGameGenres);

app.listen(config.server_port, () => {
  console.log(
    `Server running at http://${config.server_host}:${config.server_port}/`
  );
});

module.exports = app;
