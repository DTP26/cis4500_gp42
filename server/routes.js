const { Pool, types } = require("pg");
const config = require("./config.json");

// Override the default parsing for BIGINT (PostgreSQL type ID 20)
types.setTypeParser(20, (val) => parseInt(val, 10)); //DO NOT DELETE THIS

// database connections

const connection = new Pool({
  host: config.databases.movies.rds_host,
  user: config.databases.movies.rds_user,
  password: config.databases.movies.rds_password,
  port: config.databases.movies.rds_port,
  database: config.databases.movies.rds_db,
  ssl: {
    rejectUnauthorized: false,
  },
})
connection.connect((err) => err && console.log(err));

// handlers 

// Hello World
// Route: GET /
// Returns a welcome message to the developers of the API to make sure the server is running
////////////////////////////////////////////////// Default Connection //////////////////////////////////////////////////
const helloWorld = async function (req, res) {
  res.json({ message: "Hey Jackson, Jeslyn, Kayla, and or Darian!" });
};

// Route: GET /test-db
//////////////////////////////////////////////////// Tests the database connections //////////////////////////////////////////////////
const testDatabaseConnections = async function (req, res) {
  try {
    // Test the movies database connection
    const moviesResult = await connection.query('SELECT 1');
    const moviesStatus = moviesResult ? 'Movies database connected' : 'Movies database not connected';

    res.json({
      connection: moviesStatus,
    });
  } catch (err) {
    console.error('Error testing database connections:', err);
    res.status(500).json({
      error: 'Database connection test failed',
      details: err.message,
    });
  }
};

// Route: GET /list-tables
////////////////////////////////////////////////////// Outputs the names and schemas for every table in the database/ ///////////////////////////////////////////////////
const listTables = async function (req, res) {
  try {
    const query = `
      SELECT table_name, string_agg(column_name, ', ' ORDER BY ordinal_position) AS columns
      FROM information_schema.columns
      WHERE table_schema = 'public'
      GROUP BY table_name
      ORDER BY table_name;
    `;

    // Query the movies database
    const result = await connection.query(query);

    // Format the result into a readable structure
    const formattedOutput = result.rows.map(row => ({
      table: row.table_name,
      columns: row.columns
    }));

    res.json({
      message: "Movies database table and column information",
      tables: formattedOutput,
    });
  } catch (err) {
    console.error('Error retrieving table columns:', err);
    res.status(500).json({
      error: 'Failed to retrieve table columns',
      details: err.message,
    });
  }
};





// Route: GET /highest_avg_rating
// Description: Finds the highest average rating received by a movie and the highest average rating received by a game 
//              for each year within a specified range. Results are grouped by release year, movie title, and game title.
// Parameters:
//   - start_year (required): The starting year for the range (inclusive).
//   - end_year (required): The ending year for the range (exclusive).
//   - limit (optional): The maximum number of years to return. Defaults to returning all results if not specified.
// Example Input:
//   - Fetch all years with the highest-rated movie and game for each between 2010 and 2020:
//     http://localhost:8080/highest_avg_rating?start_year=2010&end_year=2020
//   - Fetch the top 5 years with the highest-rated movie and game for each between 2015 and 2020:
//     http://localhost:8080/highest_avg_rating?start_year=2015&end_year=2020&limit=5

const highestAvgRating = async function (req, res) {
  const startYear = req.query.start_year ? parseInt(req.query.start_year, 10) : null;
  const endYear = req.query.end_year ? parseInt(req.query.end_year, 10) : null;
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;

  // Validate the required parameters
  if (!startYear || !endYear || startYear >= endYear) {
    return res.status(400).json({
      error: 'Invalid or missing parameters. Ensure "start_year" and "end_year" are valid integers and start_year < end_year.',
    });
  }

  // Validate the limit parameter
  if (limit !== null && (!Number.isInteger(limit) || limit <= 0)) {
    return res.status(400).json({ error: 'Invalid limit parameter. Must be a positive integer.' });
  }

  try {
    const query = `
      WITH GOODMOVIES AS (
        SELECT b.start_year AS release_year, b.primary_title AS movie, MAX(r.average_rating) AS movie_rating
        FROM title_basics b
        JOIN title_ratings r ON b.tconst = r.tconst
        WHERE b.start_year >= $1 AND b.start_year < $2
        GROUP BY b.start_year, b.primary_title
      ), 
      GOODGAMES AS (
        SELECT g.released AS release_year, g.name AS game, MAX(g.rating) AS game_rating
        FROM games g
        WHERE g.released >= $1 AND g.released < $2
        GROUP BY g.released, g.name
      )
      SELECT gm.release_year, gm.movie, gm.movie_rating, gg.game, gg.game_rating
      FROM GOODMOVIES gm
      JOIN GOODGAMES gg ON gm.release_year = gg.release_year
      ORDER BY gm.release_year
      ${limit ? 'LIMIT $3' : ''};
    `;

    const params = limit ? [startYear, endYear, limit] : [startYear, endYear];

    // Execute the query
    const result = await connection.query(query, params);
    res.json(result.rows); // Return the results as JSON
  } catch (err) {
    console.error('Error executing highestAvgRating query:', err);
    res.status(500).json({ error: 'An error occurred while fetching the highest average ratings by year.' });
  }
};

  
// DOES NOT WORK!!!!
// Title: Movies with a Number of Ratings
// Parameters: number (number of ratings), game_title (title of the game to match genres)
// Route: GET /movie_num_ratings/:number
// Description: Find all movies with a length below 90 minutes that share a genre with the given game,
// ordered by number of shared genres and secondarily ordered by title, 
// only including movies with a sufficient number of ratings.
// Example input:
// - GET http://localhost:8080/movie_num_ratings/100?game_title=The%20Witcher
// The query will return all movies with a length under 90 minutes, which share at least one genre with "The Witcher" and have more than 100 ratings, 
// ordered by the number of shared genres (desc) and movie title (asc).

const movieNumRatings = async function (req, res) {
  const numRatings = parseInt(req.params.number, 10);
  const gameTitle = req.query.game_title; // Game title to match genres

  // Validate required parameters
  if (!gameTitle || !numRatings || numRatings <= 0) {
    return res.status(400).json({
      error: 'Invalid parameters. Ensure "number" is a positive integer and "game_title" is specified.',
    });
  }

  try {
    const query = `
      
        SELECT genres @> 'name'
        FROM games g
        WHERE g.name = $1
    `;

    const params = [gameTitle];

    // Execute the query
    const result = await connection.query(query, params);
    res.json(result.rows); // Return the results as JSON
  } catch (err) {
    console.error('Error executing movieNumRatings query:', err);
    res.status(500).json({ error: 'An error occurred while fetching movies with shared genres.' });
  }
};








// Route: GET /ratings
// Description: Fetches games or movies based on rating criteria. For movies, joins `title_ratings` and `title_basics`
//              to return the primary title and average rating. Supports optional limiting of results.
// Parameters:
//   - type (required): Specifies whether to query the "movies" or "games" table. Must be one of ["movies", "games"].
//   - upper (optional): The upper bound for the rating. If provided, fetches entries with ratings less than or equal to this value.
//   - lower (optional): The lower bound for the rating. If provided, fetches entries with ratings greater than or equal to this value.
//      - If both upper and lower are provided, fetches entries within the range [lower, upper].
//      - If neither upper nor lower is provided, returns an error.
//   - limit (optional): Limits the number of results returned. Must be a positive integer.
// Example Input:
//   - Fetch up to 5 movies with average ratings between 6.0 and 8.0:
//     http://localhost:8080/ratings?type=movies&lower=6.0&upper=8.0&limit=5
//   - Fetch games with ratings less than 4.5, no limit:
//     http://localhost:8080/ratings?type=games&upper=4.5
//   - Fetch up to 10 movies with average ratings greater than 7.0:
//     http://localhost:8080/ratings?type=movies&lower=7.0&limit=10
const getRatings = async function (req, res) {
  const upper = req.query.upper ? parseFloat(req.query.upper) : null; // Parse upper bound if provided
  const lower = req.query.lower ? parseFloat(req.query.lower) : null; // Parse lower bound if provided
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : null; // Parse limit if provided
  const type = req.query.type; // Required parameter to specify movies or games

  try {
    // Validate type parameter
    if (!type || (type !== 'movies' && type !== 'games')) {
      return res.status(400).json({ error: 'Invalid or missing type parameter. Must be "movies" or "games".' });
    }

    // Validate limit parameter
    if (limit !== null && (!Number.isInteger(limit) || limit <= 0)) {
      return res.status(400).json({ error: 'Invalid limit parameter. Must be a positive integer.' });
    }

    let query;
    const params = [];

    if (type === 'movies') {
      // Movies query: Join `title_ratings` and `title_basics` to get `primary_title` and `average_rating`
      if (upper !== null && lower !== null) {
        query = `
          SELECT tb.primary_title AS name, tr.average_rating AS rating
          FROM title_ratings tr
          JOIN title_basics tb ON tr.tconst = tb.tconst
          WHERE tr.average_rating BETWEEN $1 AND $2
          ORDER BY tb.primary_title
          ${limit ? 'LIMIT $3' : ''};
        `;
        params.push(Math.min(lower, upper), Math.max(lower, upper));
        if (limit) params.push(limit);
      } else if (upper !== null) {
        query = `
          SELECT tb.primary_title AS name, tr.average_rating AS rating
          FROM title_ratings tr
          JOIN title_basics tb ON tr.tconst = tb.tconst
          WHERE tr.average_rating < $1
          ORDER BY tb.primary_title
          ${limit ? 'LIMIT $2' : ''};
        `;
        params.push(upper);
        if (limit) params.push(limit);
      } else if (lower !== null) {
        query = `
          SELECT tb.primary_title AS name, tr.average_rating AS rating
          FROM title_ratings tr
          JOIN title_basics tb ON tr.tconst = tb.tconst
          WHERE tr.average_rating > $1
          ORDER BY tb.primary_title
          ${limit ? 'LIMIT $2' : ''};
        `;
        params.push(lower);
        if (limit) params.push(limit);
      } else {
        return res.status(400).json({ error: 'At least one of the bounds (upper or lower) must be specified.' });
      }
    } else if (type === 'games') {
      // Games query
      if (upper !== null && lower !== null) {
        query = `
          SELECT name, rating
          FROM games
          WHERE rating BETWEEN $1 AND $2
          ORDER BY name
          ${limit ? 'LIMIT $3' : ''};
        `;
        params.push(Math.min(lower, upper), Math.max(lower, upper));
        if (limit) params.push(limit);
      } else if (upper !== null) {
        query = `
          SELECT name, rating
          FROM games
          WHERE rating < $1
          ORDER BY name
          ${limit ? 'LIMIT $2' : ''};
        `;
        params.push(upper);
        if (limit) params.push(limit);
      } else if (lower !== null) {
        query = `
          SELECT name, rating
          FROM games
          WHERE rating > $1
          ORDER BY name
          ${limit ? 'LIMIT $2' : ''};
        `;
        params.push(lower);
        if (limit) params.push(limit);
      } else {
        return res.status(400).json({ error: 'At least one of the bounds (upper or lower) must be specified.' });
      }
    }

    // Execute the query
    const result = await connection.query(query, params);
    res.json(result.rows); // Return the results as JSON
  } catch (err) {
    console.error('Error executing ratings query:', err);
    res.status(500).json({ error: 'An error occurred while fetching ratings' });
  }
};



// Route: GET /containing/:word
// Description: Returns all games and movies with titles containing a specific word (case-insensitive), 
// and indicates whether each entry is a game or a movie.
// Parameters:
//   - word (required): The word to search for in titles.
// Usage Example:
//   - Request: http://localhost:8080/containing/war
//     This will return all games and movies where the title contains the word "war" (e.g., "God of War", "War Horse").
// SQL Logic:
//   - Matches the `name` column in the `games` table and the `primary_title` column in the `title_basics` table using case-insensitive pattern matching.
//   - Uses a UNION to combine results from both tables and includes a "type" column to differentiate between games and movies.
//   - Orders the results by release year in descending order (most recent first).
const containing = async function (req, res) {
  const word = req.params.word;

  // Validate input
  if (!word || word.trim() === '') {
    return res.status(400).json({ error: 'The search word is required and cannot be empty.' });
  }

  try {
    // SQL query to find both games and movies with titles containing the word
    const query = `
      (
        SELECT name AS title, released AS release_year, 'game' AS type
        FROM games
        WHERE LOWER(name) LIKE LOWER($1)
      )
      UNION
      (
        SELECT primary_title AS title, start_year AS release_year, 'movie' AS type
        FROM title_basics
        WHERE LOWER(primary_title) LIKE LOWER($1)
      )
      ORDER BY release_year DESC;
    `;

    // Execute the query with the parameter
    const result = await connection.query(query, [`%${word}%`]);

    // Return the results
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing containing query:', err);
    res.status(500).json({ error: 'An error occurred while searching for games and movies.' });
  }
};



// Route: GET /age_appropriate_games
// Description: Fetches all games rated "Everyone" based on their ESRB rating, ordered by rating in descending order.
// The `esrb_rating` field is assumed to be a JSONB column, so this query extracts the "name" property.
// Parameters: None
// Example Input:
//   - Fetch all games rated "Everyone":
//     http://localhost:8080/age_appropriate_games

// THEY ALL ARE NULL!!!!!!!!!!!!!

// const ageAppropriateGames = async function (req, res) {
//   try {
//     const query = `
//       SELECT name, rating
//       FROM games
//       WHERE esrb_rating IS NOT NULL AND esrb_rating->>'name' = 'Everyone'
//       ORDER BY rating DESC;
//     `;

//     const result = await connection.query(query);
//     res.json(result.rows); // Return the results as JSON
//   } catch (err) {
//     console.error('Error executing ageAppropriateGames query:', err);
//     res.status(500).json({ error: 'An error occurred while fetching age-appropriate games.' });
//   }
// };


// Route: GET /top-movies
// Description: Fetches the top movies sorted by the number of votes in descending order. 
//              Allows for an optional `limit` parameter to control the number of results returned.
// Parameters:
//   - limit (optional): The maximum number of movies to return. Defaults to 5 if not specified.
// Example Input:
//   - Fetch the top 10 movies by votes:
//     http://localhost:8080/top_movies?limit=10
//   - Fetch the default top 5 movies:
//     http://localhost:8080/top_movies
const topMoviesByVotes = async function (req, res) {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 5; // Parse the limit parameter or default to 5

  // Validate the limit parameter
  if (!Number.isInteger(limit) || limit <= 0) {
    return res.status(400).json({ error: 'Invalid limit parameter. Must be a positive integer.' });
  }

  try {
    const query = `
      SELECT tb.primary_title AS title, tr.num_votes, tr.average_rating
      FROM title_ratings tr
      JOIN title_basics tb ON tr.tconst = tb.tconst
      ORDER BY tr.num_votes DESC
      LIMIT $1;
    `;

    const result = await connection.query(query, [limit]);
    res.json(result.rows); // Return the results as JSON
  } catch (err) {
    console.error('Error executing topMoviesByVotes query:', err);
    res.status(500).json({ error: 'An error occurred while fetching top movies by votes.' });
  }
};


// Route: GET /top_game_genres
// Description: Fetches the top game genres based on the number of games in each genre, along with the average rating for each genre.
// Parameters:
//   - limit (optional): The maximum number of results to return. Defaults to 5 if not specified.
// Example Input:
//   - Fetch the top 3 game genres:
//     http://localhost:8080/top_game_genres?limit=3

const topGameGenres = async function (req, res) {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 5; // Parse the limit or default to 5

  // Validate the limit parameter
  if (!Number.isInteger(limit) || limit <= 0) {
    return res.status(400).json({ error: 'Invalid limit parameter. Must be a positive integer.' });
  }

  try {
    const query = `
      SELECT name, games_count
      FROM game_genres
      ORDER BY games_count DESC
      LIMIT $1;
    `;

    const result = await connection.query(query, [limit]);
    res.json(result.rows); // Return the results as JSON
  } catch (err) {
    console.error('Error executing topGameGenres query:', err);
    res.status(500).json({ error: 'An error occurred while fetching the top game genres.' });
  }
};

// Need to fix, not working - movieNumRatings, highestAvgRating
module.exports = { 
  helloWorld, 
  movieNumRatings, 
  highestAvgRating, 
  getRatings, 
  containing,  
  topMoviesByVotes, 
  topGameGenres, 
  testDatabaseConnections, 
  listTables 
};
