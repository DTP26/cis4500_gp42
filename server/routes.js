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
        SELECT name AS title, released AS release_year, rating, background_image AS img
        FROM games
        WHERE rating > 0.0
        ORDER BY RANDOM() 
        LIMIT 1;
      `;
    } 
    // SQL query to get a random movie
    else if (type === 'movie') {
      query = `
        SELECT primary_title AS title, start_year AS release_year, genres, r.average_rating AS rating
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


// broken
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
        ig.rating * 2 AS game_rating,  -- Rating of the game
        'game' AS type  -- Indicate the type is a game
      FROM ImportantGames ig)

      UNION ALL

      (SELECT
        im.movie_title AS title,  -- Title of the movie
        CAST(im.num_votes AS INTEGER) AS reviews_count,  -- Explicitly cast num_votes to INTEGER
        im.average_rating AS game_rating,  -- Rating of the movie
        'movie' AS type  -- Indicate the type is a movie
      FROM ImportantMovies im)

      ORDER BY game_rating DESC  -- Sort by reviews/votes count in descending order
      LIMIT $2;  -- Limit the total number of results (games + movies)
    `;

    // Execute the query with the parameters:
    // - $1 = 'x' (minimum reviews/votes)
    // - $2 = 'limit / 2' (half the limit for games and half for movies)
    // - $3 = 'limit' (total number of results)
    const result = await connection.query(query, [x, limit]);

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
      SELECT g.name AS game_title, g.released AS release_date, g.rating, g.reviews_count, gg.name AS game_genre, background_image AS img
      FROM games g
      JOIN game_genres gg ON gg.game_id = g.id
      WHERE LOWER(gg.name) = LOWER($1) AND g.rating > 3.0
      ORDER BY RANDOM()
      LIMIT 10;
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

// Route: GET /highest_avg_rating
// Description: Finds the highest rated movie(s) and game(s) for the inputted year. 
//              Results are grouped by release year, movie title, and game title.
// Parameters:
//   - year (required): The year to search games and movies from (inclusive).
//   - limit (optional): The amount of movies/games to return. Defaults to 1 if empty
// Example Input:
//   - Fetch the highest-rated movie and game from 2003:
//     http://localhost:8080/highest_avg_rating?year=2003
//   - Fetch the top 5 rated movies and games from 2020:
//     http://localhost:8080/highest_avg_rating?year=2020&&limit=5

const highestAvgRating = async function (req, res) {
  const year = req.query.year ? req.query.year : null;
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;

  // Validate the required parameters
  if (!year) {
    return res.status(400).json({
      error: 'Invalid or missing parameters. Ensure "year" is a valid integer.',
    });
  }

  // Validate the limit parameter
  if (limit != null && (!Number.isInteger(limit) || limit <= 0)) {
    return res.status(400).json({ error: 'Invalid limit parameter. Must be a positive integer.' });
  }

  try {
    const query = `
      WITH GOODMOVIES AS (
        SELECT b.start_year AS release_year, b.primary_title AS title, r.average_rating AS rating, 'movie' AS type
        FROM title_basics b
        JOIN title_ratings r ON b.tconst = r.tconst
        WHERE b.start_year = $2
        ORDER BY r.average_rating DESC
        LIMIT ${limit ? '$3' : '1'}
      ), 
      GOODGAMES AS (
        SELECT SUBSTRING(g.released, 1, 4) AS release_year, g.name AS title, g.rating AS rating, 'game' AS type
        FROM games g
        WHERE g.name IS NOT NULL AND SUBSTRING(g.released, 1, 4) = $1
        ORDER BY g.rating DESC
        LIMIT ${limit ? '$3' : '1'}
      )
      SELECT * FROM GOODMOVIES
      UNION 
      SELECT * FROM GOODGAMES 
      ORDER BY type, rating DESC

      
    `;

    const params = limit ? [year, parseInt(req.query.year, 10), limit] : [year, parseInt(req.query.year, 10)];
    // Execute the query
    const result = await connection.query(query, params);
    res.json(result.rows); // Return the results as JSON
  } catch (err) {
    console.error('Error executing highestAvgRating query:', err);
    res.status(500).json({ error: 'An error occurred while fetching the highest average ratings by year.' });
  }
};


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
  const gameTitle = req.query.game_title; // Game title to match movie titles

  // Validate required parameters
  if (!gameTitle || isNaN(numRatings) || numRatings <= 0) {
    return res.status(400).json({
      error: 'Invalid parameters. Ensure "number" is a positive integer and "game_title" is specified.',
    });
  }

  try {
    const query = `
      SELECT tb.primary_title AS title, tr.num_votes AS num_ratings
      FROM title_basics tb
      JOIN title_ratings tr ON tb.tconst = tr.tconst
      WHERE tb.primary_title ILIKE '%' || $1 || '%' -- Find movies with titles similar to the game title
        AND tr.num_votes >= $2 -- Filter by minimum number of ratings
      ORDER BY tr.num_votes DESC;
    `;

    const params = [gameTitle, numRatings];

    // Execute the query
    const result = await connection.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No movies found with similar titles and sufficient ratings.' });
    }
    res.json(result.rows); // Return the results as JSON
  } catch (err) {
    console.error('Database error:', err.message, err.stack);
    res.status(500).json({ error: 'An error occurred while fetching movies with similar titles.' });
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
      // Movies query: Join `title_ratings` and `title_basics` to get `primary_title`, `average_rating`, and the `type`
      if (upper !== null && lower !== null) {
        query = `
          SELECT tb.primary_title AS name, tr.average_rating AS rating, 'movie' AS type
          FROM title_ratings tr
                 JOIN title_basics tb ON tr.tconst = tb.tconst
          WHERE tr.average_rating BETWEEN $1 AND $2
          ORDER BY RANDOM()
            ${limit ? 'LIMIT $3' : ''};
        `;
        params.push(Math.min(lower, upper), Math.max(lower, upper));
        if (limit) params.push(limit);
      } else if (upper !== null) {
        query = `
          SELECT tb.primary_title AS name, tr.average_rating AS rating, 'movie' AS type
          FROM title_ratings tr
                 JOIN title_basics tb ON tr.tconst = tb.tconst
          WHERE tr.average_rating < $1
          ORDER BY RANDOM()
            ${limit ? 'LIMIT $2' : ''};
        `;
        params.push(upper);
        if (limit) params.push(limit);
      } else if (lower !== null) {
        query = `
          SELECT tb.primary_title AS name, tr.average_rating AS rating, 'movie' AS type
          FROM title_ratings tr
                 JOIN title_basics tb ON tr.tconst = tb.tconst
          WHERE tr.average_rating > $1
          ORDER BY RANDOM()
            ${limit ? 'LIMIT $2' : ''};
        `;
        params.push(lower);
        if (limit) params.push(limit);
      } else {
        return res.status(400).json({ error: 'At least one of the bounds (upper or lower) must be specified.' });
      }
    } else if (type === 'games') {
      // Games query: Add the `type` field as 'game'
      if (upper !== null && lower !== null) {
        query = `
          SELECT name, rating, 'game' AS type
          FROM games
          WHERE rating BETWEEN $1 AND $2 AND name IS NOT NULL
          ORDER BY RANDOM()
            ${limit ? 'LIMIT $3' : ''};
        `;
        params.push(Math.min(lower, upper), Math.max(lower, upper));
        if (limit) params.push(limit);
      } else if (upper !== null) {
        query = `
          SELECT name, rating, 'game' AS type
          FROM games
          WHERE rating < $1 AND name IS NOT NULL
          ORDER BY RANDOM()
            ${limit ? 'LIMIT $2' : ''};
        `;
        params.push(upper);
        if (limit) params.push(limit);
      } else if (lower !== null) {
        query = `
          SELECT name, rating, 'game' AS type
          FROM games
          WHERE rating > $1 AND name IS NOT NULL
          ORDER BY RANDOM()
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
  let word = req.params.word; // Get the search word

  // List of common stop words to ignore
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'but', 'or', 'nor', 'for', 'so', 'to', 'in', 'on', 'at', 'by', 'with', 'as', 'from', 'about', 'of'
  ]);

  // Validate input parameters
  if (!word || word.trim() === '') {
    return res.status(400).json({ error: 'The search word is required and cannot be empty.' });
  }

  if (type !== 'game' && type !== 'movie') {
    return res.status(400).json({ error: 'The type parameter must be either "game" or "movie".' });
  }

  // Split the input into words and filter out stop words
  const words = word
    .split(/\s+/) // Split by spaces (handles multiple spaces or hyphenated words)
    .filter((w) => !stopWords.has(w.toLowerCase())) // Remove stop words
    .map((w) => w.toLowerCase()); // Normalize to lowercase

  if (words.length === 0) {
    return res.status(400).json({ error: 'No valid search words after removing stop words.' });
  }

  try {
    let query;
    let queryParams = [];

    // Dynamically construct the WHERE clause based on the number of words
    let whereClause;
    if (type === 'game') {
      // For games, construct the query
      whereClause = words.map((word, idx) => {
        queryParams.push(`%${word}%`);
        return `LOWER(games.name) LIKE $${idx + 1}`;
      }).join(' OR ');

      query = `
        SELECT game_genres.name as game_genre, games.name AS game_title, games.background_image AS img, released AS release_year, 'game' AS type
        FROM games
        JOIN game_genres ON games.id = game_genres.id
        WHERE ${whereClause}
        ORDER BY games.ratings_count DESC;
      `;
    } else if (type === 'movie') {
      // For movies, construct the query
      whereClause = words.map((word, idx) => {
        queryParams.push(`%${word}%`);
        return `LOWER(primary_title) LIKE $${idx + 1}`;
      }).join(' AND ');

      query = `
        SELECT primary_title AS title, start_year AS release_year, 'movie' AS type, unnest(string_to_array(genres, ',')) AS movie_genre
        FROM title_basics
        WHERE ${whereClause}
        ORDER BY start_year DESC;
      `;
    }

    // Execute the query with the parameterized values
    const result = await connection.query(query, queryParams);
    
    // Send the result as a JSON response
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: 'An error occurred while searching.' });
  }
};

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
      SELECT name, MAX(games_count) AS num_games
      FROM game_genres
      GROUP BY name
      ORDER BY num_games DESC
      LIMIT $1;
    `;

    const result = await connection.query(query, [limit]);
    res.json(result.rows); // Return the results as JSON
  } catch (err) {
    console.error('Error executing topGameGenres query:', err);
    res.status(500).json({ error: 'An error occurred while fetching the top game genres.' });
  }
};

// Need to fix, not working - movieNumRatings
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
