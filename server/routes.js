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

//////////////////////////////////////////////UTIL ROUTES ////////////////////////////////////////////////////




// Route: GET /random
// Description: This route returns a random game or movie based on the provided 'type' parameter.
// Parameters:
//   - type (required): The type of content to fetch, either "game" or "movie".
// Usage Example:
//   - Request: http://localhost:8080/random?type=game
//     This will return a random game from the 'games' table.
//   - Request: http://localhost:8080/random?type=movie
//     This will return a random movie from the 'title_basics' table.
//
// SQL Logic:
//   - If 'type' is 'game', a random game is selected from the 'games' table.
//   - If 'type' is 'movie', a random movie is selected from the 'title_basics' and 'title_ratings' tables.
//   - The results are sorted randomly using 'ORDER BY RANDOM()' and limited to 1 result.
//   - It returns the title and relevant information (rating for games, average rating for movies).

const randomContent = async function (req, res) {
  const type = req.query.type?.toLowerCase(); // Get type parameter (game or movie)

  // Validate the type parameter
  if (type !== 'game' && type !== 'movie') {
    return res.status(400).json({ error: 'The type parameter must be either "game" or "movie".' });
  }

  try {
    let query;
    let params = [];

    // SQL query to get a random game
    if (type === 'game') {
      query = `
        SELECT name AS title, released AS release_year, rating
        FROM games
        ORDER BY RANDOM() 
        LIMIT 1;
      `;
    } 
    // SQL query to get a random movie
    else if (type === 'movie') {
      query = `
        SELECT primary_title AS title, start_year AS release_year, genres, r.average_rating AS rating
        FROM title_basics t
        JOIN title_ratings r ON t.tconst = r.tconst
        ORDER BY RANDOM()
        LIMIT 1;
      `;
    }

    // Execute the query
    const result = await connection.query(query, params);

    // Check if any result was returned
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No content found.' });
    }

    // Return the result
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error executing randomContent query:', err);
    res.status(500).json({ error: 'An error occurred while retrieving the random content.' });
  }
};


// NONSENSICAL!!!!!!!!!!!!!
// Route: GET /important_games_movies/:x/:limit
// Description: 
// Returns the top 'limit' number of games and movies with more than 'x' reviews or votes, respectively, 
// sorted by the number of reviews or votes. The results are divided equally between games and movies. 
// The 'limit' parameter defines how many total records (games + movies) to return, while 'x' defines 
// the minimum number of reviews (for games) or votes (for movies) required.
//
// Example Usage:
// - Request: http://localhost:8080/important_games_movies/1000/50
//   This will return 50 games and 50 movies, each having more than 1000 reviews or votes,
//   ordered by their review/vote counts in descending order.

const importantGamesMovies = async function (req, res) {
  const x = req.params.x;  // Minimum number of reviews (for games) or votes (for movies)
  const limit = req.params.limit;  // The total number of results to return (games + movies)

  try {
    const query = `
      -- Select the top-rated games with more than 'x' reviews
      WITH ImportantGames AS (
        SELECT g.id AS game_id, g.name AS game_title, g.reviews_count, g.rating
        FROM games g
        WHERE CAST(g.reviews_count AS INTEGER) > $1  -- Only games with more than 'x' reviews
        ORDER BY g.reviews_count DESC  -- Sort games by reviews_count in descending order
        --LIMIT $2  -- Limit the number of games to 'limit / 2'
      ),
      -- Select the top-rated movies with more than 'x' votes
      ImportantMovies AS (
        SELECT t.tconst AS movie_id, t.primary_title AS movie_title, r.num_votes, r.average_rating
        FROM title_basics t
        JOIN title_ratings r ON t.tconst = r.tconst
        WHERE CAST(r.num_votes AS INTEGER) > $1  -- Only movies with more than 'x' votes
        ORDER BY r.num_votes DESC  -- Sort movies by num_votes in descending order
        -- LIMIT $2  -- Limit the number of movies to 'limit / 2'
      )

      -- Combine results from games and movies
      (SELECT
        ig.game_title AS title,  -- Title of the game
        ig.reviews_count AS reviews_count,  -- Number of reviews for the game
        ig.rating AS game_rating,  -- Rating of the game
        'game' AS type  -- Indicate the type is a game
      FROM ImportantGames ig)

      UNION ALL

      (SELECT
        im.movie_title AS title,  -- Title of the movie
        CAST(im.num_votes AS INTEGER) AS reviews_count,  -- Explicitly cast num_votes to INTEGER
        im.average_rating AS game_rating,  -- Rating of the movie
        'movie' AS type  -- Indicate the type is a movie
      FROM ImportantMovies im)

      ORDER BY title DESC  -- Sort by reviews/votes count in descending order
      --LIMIT $2;  -- Limit the total number of results (games + movies)
    `;

    // Execute the query with the parameters:
    // - $1 = 'x' (minimum reviews/votes)
    // - $2 = 'limit / 2' (half the limit for games and half for movies)
    // - $3 = 'limit' (total number of results)
    const result = await connection.query(query, [x]);

    // Return the results in JSON format
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing importantGamesMovies query:', err);
    res.status(500).json({ error: 'An error occurred while fetching important games and movies.' });
  }
};





// Route: GET /games_movies_by_genre/:genre
// Description: Returns a list of games and movies that share the specified genre, 
// along with their average ratings, ordered by their average ratings in descending order.
// Parameters:
//   - genre (required): The genre to filter by (e.g., "Action").
//   - limit (optional): The maximum number of results to return (default is 10).
// Usage Example:
//   - Request: http://localhost:8080/games_movies_by_genre/Action?limit=500
//     This will return up to 500 games and movies that share the genre "Action", including their average ratings, ordered by rating.

const gamesMoviesByGenre = async function (req, res) {
  const genre = req.params.genre;  // Genre to filter by
  const limit = req.query.limit || 10;  // Default limit is 10 if not specified

  // Validate input
  if (!genre || genre.trim() === '') {
    return res.status(400).json({ error: 'The genre parameter is required and cannot be empty.' });
  }

  try {
    const query = `
      -- Select games and movies that match the genre, limited by the genre and number of results
      WITH GameGenres AS (
        SELECT g.id AS game_id, g.name AS game_title, gg.name AS game_genre, background_image AS img
        FROM game_genres gg
        JOIN games g ON gg.game_id = g.id
        WHERE LOWER(gg.name) = LOWER($1)  -- Case-insensitive genre filter
        LIMIT $2
      ),
      MovieGenres AS (
        SELECT t.tconst AS movie_id, t.primary_title AS movie_title, unnest(string_to_array(t.genres, ',')) AS movie_genre
        FROM title_basics t
        WHERE t.genres IS NOT NULL
        AND LOWER(t.genres) LIKE LOWER($1)  -- Case-insensitive genre filter
        LIMIT $2
      )
      
      SELECT
        g.game_title,
        g.game_genre,
        t.primary_title,
        r.average_rating AS movie_rating,
        g.game_genre AS shared_genre,
        'game' AS type,
        g.img
      FROM GameGenres g
      JOIN MovieGenres m ON g.game_genre = m.movie_genre
      LEFT JOIN title_basics t ON m.movie_id = t.tconst
      LEFT JOIN title_ratings r ON t.tconst = r.tconst
      ORDER BY r.average_rating DESC
      LIMIT $2;
    `;

    // Execute the query with the genre and limit parameters
    const result = await connection.query(query, [genre, limit]);

    // Return the results
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing gamesMoviesByGenre query:', err);
    res.status(500).json({ error: 'An error occurred while fetching games and movies by genre.' });
  }
};


// Route: GET /games_by_genre/:genre
// Description: Returns all games of a specific genre. The genre name is passed as a parameter.
// Parameters:
//   - genre (required): The genre name to search for in the `game_genres` and `games` tables.
// Usage Example:
//   - Request: http://localhost:8080/games_by_genre/RPG
//     This will return all games that belong to the "RPG" genre.
// SQL Logic:
//   - Joins the `game_genres` table with the `games` table on the `game_id` to retrieve games that belong to a specific genre.
//   - Filters the results by the genre name, which is passed as the `genre` parameter.
//   - Orders the results by the game release date in descending order (most recent first).

const gamesByGenre = async function (req, res) {
  const genre = req.params.genre; // Get the genre parameter

  // Validate input
  if (!genre || genre.trim() === '') {
    return res.status(400).json({ error: 'The genre parameter is required and cannot be empty.' });
  }

  try {
    // SQL query to get all games that belong to a specific genre
    const query = `
      SELECT g.name AS game_title, g.released AS release_year, g.rating, g.reviews_count
      FROM games g
      JOIN game_genres gg ON gg.game_id = g.id
      WHERE LOWER(gg.name) = LOWER($1)  -- Search for the genre in a case-insensitive way
      ORDER BY g.released DESC;  -- Order by release year in descending order
    `;

    // Execute the query with the parameter
    const result = await connection.query(query, [genre]);

    // Return the results
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing gamesByGenre query:', err);
    res.status(500).json({ error: 'An error occurred while retrieving the games.' });
  }
};





// NONSENSE
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



// Route: GET /containing/:type/:word
// Description: Returns all games or movies with titles containing a specific word (case-insensitive),
// and indicates whether each entry is a game or a movie based on the 'type' parameter.
// Parameters:
//   - type (required): The type of content to search for, either 'game' or 'movie'.
//   - word (required): The word to search for in titles.
// Usage Example:
//   - Request: http://localhost:8080/containing/game/war
//     This will return all games where the title contains the word "war" (e.g., "God of War").
//   - Request: http://localhost:8080/containing/movie/war
//     This will return all movies where the title contains the word "war" (e.g., "War Horse").
// SQL Logic:
//   - If 'type' is 'game', matches the `name` column in the `games` table using a case-insensitive pattern.
//   - If 'type' is 'movie', matches the `primary_title` column in the `title_basics` table using a case-insensitive pattern.
//   - Combines the results based on the 'type' and returns a "type" column to differentiate between games and movies.
//   - Orders the results by release year in descending order (most recent first).

const containing = async function (req, res) {
  const type = req.params.type?.toLowerCase(); // Get 'type' parameter (either 'game' or 'movie')
  const word = req.params.word; // Get the search word

  // Validate input parameters
  if (!word || word.trim() === '') {
    return res.status(400).json({ error: 'The search word is required and cannot be empty.' });
  }

  if (type !== 'game' && type !== 'movie') {
    return res.status(400).json({ error: 'The type parameter must be either "game" or "movie".' });
  }

  try {
    let query;
    
    // SQL query to find games or movies with titles containing the word
    if (type === 'game') {
      // Search in the games table
      query = `
        SELECT name AS title, released AS release_year, 'game' AS type
        FROM games
        WHERE LOWER(name) LIKE LOWER($1)
        ORDER BY released DESC;
      `;
    } else if (type === 'movie') {
      // Search in the movies table
      query = `
        SELECT primary_title AS title, start_year AS release_year, 'movie' AS type
        FROM title_basics
        WHERE LOWER(primary_title) LIKE LOWER($1)
        ORDER BY start_year DESC;
      `;
    }

    // Execute the query with the parameter
    const result = await connection.query(query, [`%${word}%`]);

    // Return the results
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing containing query:', err);
    res.status(500).json({ error: 'An error occurred while searching for games or movies.' });
  }
};



////////////// Completely Nonsensical
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
  listTables,
  gamesMoviesByGenre,
  importantGamesMovies,
  randomContent,
  gamesByGenre
};
