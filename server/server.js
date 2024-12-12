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

app.get("/", routes.helloWorld);
app.get("/highest_avg_rating", routes.highestAvgRating);
app.get("/movie_num_ratings/:number", routes.movieNumRatings);
app.get("/ratings", routes.getRatings);
app.get("/containing/:word", routes.containing);
// app.get("/age_appropriate_games", routes.ageAppropriateGames);
app.get("/top_movies", routes.topMoviesByVotes);
app.get("/top_game_genres", routes.topGameGenres);
app.get("/test-db", routes.testDatabaseConnections);
app.get("/list-tables", routes.listTables);

app.listen(config.server_port, () => {
  console.log(
    `Server running at http://${config.server_host}:${config.server_port}/`
  );
});

module.exports = app;
