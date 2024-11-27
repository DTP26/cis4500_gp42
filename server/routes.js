const { Pool, types } = require("pg");
const config = require("./config.json");

// Override the default parsing for BIGINT (PostgreSQL type ID 20)
types.setTypeParser(20, (val) => parseInt(val, 10)); //DO NOT DELETE THIS

// Create PostgreSQL connection using database credentials provided in config.json
// Do not edit. If the connection fails, make sure to check that config.json is filled out correctly
const connection = new Pool({
  host: config.rds_host,
  user: config.rds_user,
  password: config.rds_password,
  port: config.rds_port,
  database: config.rds_db,
  ssl: {
    rejectUnauthorized: false,
  },
});
connection.connect((err) => err && console.log(err));

// Route: GET /movie_num_ratings/:number
// Returns all movies with a number of ratings above or below a given threshold
// sorted by average rating and title
movie_num_ratings = async function(req, res) {
  const num_ratings = req.params.number;
  const below = req.query.comparison == "below" ? true : false;
  if (below) {
    connection.query(`
      SELECT primary_title AS Title, average_rating 
      FROM title_basics tb JOIN title_ratings tr ON tb.tconst = tr.tconst 
      WHERE tr.num_votes < $1
      ORDER BY average_rating DESC, Title
    `, [num_ratings], (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else {
      res.json(data.rows);
    }
  });
  } else {
    connection.query(`
      SELECT primary_title AS Title, average_rating 
      FROM title_basics tb JOIN title_ratings tr ON tb.tconst = tr.tconst 
      WHERE tr.num_votes > $1
      ORDER BY average_rating DESC, Title
    `, [num_ratings], (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else {
      res.json(data.rows);
    }
  });
  }
}

// Route: GET /game_rating/:rating
// Returns all games with an average rating above/below certain percentage
game_rating = async function(req, res) {
  const rating = req.params.rating;
  const below = req.query.comparison == "below" ? true : false;
  if (below) {
    connection.query(`
      SELECT name, rating 
      FROM Games 
      WHERE g.rating < $1
      ORDER BY r.Title
    `, [rating], (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else {
      res.json(data.rows);
    }
  });
  } else {
    connection.query(`
      SELECT name, rating 
      FROM Games 
      WHERE g.rating > $1
      ORDER BY r.Title
    `, [rating], (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else {
      res.json(data.rows);
    }
  });
  }
}

// Route GET /game_containing/:word
// returns all games with titles containing a particular word
const game_containing = async function(req, res) {
  const word = req.params.word;
  connection.query(`
    SELECT name, release AS release_year
	  FROM Games
	  WHERE Games_ratings.Title LIKE $1
	  ORDER BY release DESC
  `, [word], (err, data) => {
  if (err) {
    console.log(err);
    res.json({});
  } else {
    res.json(data.rows);
  }
});
}