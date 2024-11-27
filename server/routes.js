const { Pool, types } = require("pg");
const config = require("./config.json");

// Override the default parsing for BIGINT (PostgreSQL type ID 20)
types.setTypeParser(20, (val) => parseInt(val, 10)); //DO NOT DELETE THIS

// database connections

const gamesConnection = new Pool({
  host: config.databases.games.rds_host,
  user: config.databases.games.rds_user,
  password: config.databases.games.rds_password,
  port: config.databases.games.rds_port,
  database: config.databases.games.rds_db,
  ssl: {
    rejectUnauthorized: false,
  },
})
gamesConnection.connect((err) => err && console.log(err));

const moviesConnection = new Pool({
  host: config.databases.movies.rds_host,
  user: config.databases.movies.rds_user,
  password: config.databases.movies.rds_password,
  port: config.databases.movies.rds_port,
  database: config.databases.movies.rds_db,
  ssl: {
    rejectUnauthorized: false,
  },
})
moviesConnection.connect((err) => err && console.log(err));

// handlers 

const ageAppropriateGames = async function (req, res) {
  gamesConnection.query(
    `
    SELECT name, rating
    FROM games
    WHERE esrb_rating->>'name' = 'Everyone'
    ORDER BY rating DESC;
  `,
    (err, data) => {
      if (err) {
        console.log(err);
        res.json([]);
      } else {
        res.json(data.rows);
      }
    }
  );
};

const topMoviesByVotes = async function (req, res) {
  moviesConnection.query(
    `
    SELECT primary_title AS title, num_votes, average_rating
    FROM title_ratings tr
    JOIN title_basics tb ON tr.tconst = tb.tconst
    ORDER BY num_votes DESC
    LIMIT 5;
  `,
    (err, data) => {
      if (err) {
        console.log(err);
        res.json([]);
      } else {
        res.json(data.rows);
      }
    }
  );
};

const topGameGenres = async function (req, res) {
  gamesConnection.query(
    `
    SELECT genre, COUNT(*) AS genre_count, AVG(rating) AS avg_rating
    FROM games
    JOIN game_genres gg ON games.id = gg.game_id
    GROUP BY genre
    ORDER BY genre_count DESC
    LIMIT 5;

  `,
    (err, data) => {
      if (err) {
        console.log(err);
        res.json([]);
      } else {
        res.json(data.rows);
      }
    }
  );
};

module.exports = { ageAppropriateGames, topMoviesByVotes, topGameGenres };
