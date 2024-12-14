import { useState } from 'react';
import { Box, Container, Button, TextField, Typography } from '@mui/material';

const config = require('../config.json');

//uses /containing and /gamesMoviesByGenre
export default function MoviesPage() {
  const [movieTitle, setMovieTitle] = useState('');
  const [games, setGames] = useState([]);

  // Movie-to-game genre mapping
  const genreMapping = {
    Drama: 'Adventure', // Map Drama to Adventure
    Action: 'Action',
    Comedy: 'Family',
    Horror: 'Horror',
    SciFi: 'Sci-Fi',
    Fantasy: 'RPG',
    Romance: 'Narrative',
    Documentary: 'Simulation',
    Thriller: 'Survival',
  };

  // Fetch games based on the movie's genre
  const fetchGamesByMovie = async () => {
    try {
      console.log(`Searching for movies containing: ${movieTitle}`);
      const genreResponse = await fetch(
          `http://${config.server_host}:${config.server_port}/containing/movie/${movieTitle}`
      );
      const movies = await genreResponse.json();
      console.log('Movies Response:', movies);

      let targetGenre = 'Action'; // Default to Action

      if (movies.length > 0) {
        const genreCounts = {};
        movies.forEach((movie) => {
          const genre = movie.movie_genre || '';
          if (genre.trim()) {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
          }
        });

        if (Object.keys(genreCounts).length > 0) {
          const detectedMovieGenre = Object.keys(genreCounts).reduce((a, b) =>
              genreCounts[a] > genreCounts[b] ? a : b
          );
          console.log('Detected Movie Genre:', detectedMovieGenre);

          // Map the detected movie genre to game genres
          targetGenre = genreMapping[detectedMovieGenre] || 'Action';
        }

        console.log('Detected Mapped Genre:', targetGenre);

        const gamesResponse = await fetch(
            `http://${config.server_host}:${config.server_port}/games_movies_by_genre/${targetGenre}?limit=10`
        );
        const gamesJson = await gamesResponse.json();
        console.log('Fetched Games:', gamesJson);

        if (gamesJson.length > 0) {
          const genreResponseGames = await fetch(
            `http://${config.server_host}:${config.server_port}/containing/game/${movieTitle}`
          );
          const gamesTitlesJson = await genreResponseGames.json();
          console.log('Fetched Games Titles:', gamesTitlesJson);
          if (gamesTitlesJson.length > 0) {

            const overlap = gamesTitlesJson.filter(game => game.game_genre === targetGenre);
            console.log('Overlapping Games:', overlap);
            if (overlap.length > 0) {
            setGames(overlap);
            }
            else {
              setGames(gamesTitlesJson)
            }
          } else {
            setGames(gamesJson)

            }
        } else {
          setGames([]);
          alert('No games found for the detected genre.');
        }
      } else {
        setGames([]);
        alert('No matching movies or genres found!');
      }
    } catch (err) {
      console.error('Error fetching games:', err);
      alert('An error occurred. Please check the console for details.');
    }
  };

  return (
      <div>
        <h1 style={{ textAlign: 'center', fontFamily: "'Orbitron'," +
                " sans-serif" }}>Movie2Game Engine</h1>

        {/* Input Field for Movie Title */}
        <Box m={3} textAlign="center">
            <TextField
                label="Enter a Movie Title"
                variant="standard"
                value={movieTitle}
                onChange={(e) => setMovieTitle(e.target.value)}
                style={{
                    width: '300px',
                    marginRight: '10px',
                }}
                InputProps={{
                    sx: {
                        '&:before': {
                            borderBottom: '2px solid #1e4c10',
                        },
                        '&:hover:not(.Mui-disabled):before': {
                            borderBottom: '2px solid #39ff14',
                        },
                        '&:after': {
                            borderBottom: '2px solid #39ff14',
                        },
                    },
                    style: {
                      color: 'white', // Label color
                      fontFamily: "'Orbitron', sans-serif",
                    },
                }}
                InputLabelProps={{
                    style: {
                        color: 'white', // Label color
                        fontFamily: "'Orbitron', sans-serif",
                    },
                }}
            />
          <Button
              variant="contained"
              onClick={fetchGamesByMovie}
              style={{
                backgroundColor: '#004d00',
                color: '#ffffff',
                border: '1px solid #39ff14',
                fontFamily: "'Orbitron', sans-serif",
              }}
          >
            VOYAGE
          </Button>
        </Box>

        {/* Display Games */}
        <Container
            style={{
              display: games.length > 0 ? 'grid' : 'flex',
              gridTemplateColumns: games.length > 0 ? 'repeat(auto-fill, minmax(250px, 1fr))' : undefined,
              gap: games.length > 0 ? '20px' : undefined,
              justifyItems: games.length > 0 ? 'stretch' : undefined,
              justifyContent: games.length === 0 ? 'center' : undefined,
              alignItems: games.length === 0 ? 'center' : undefined,
              height: games.length === 0 ? '100vh' : 'auto',
              textAlign: games.length === 0 ? 'center' : undefined,
            }}
        >
          {games.length > 0 ? (
              games.map((game, index) => (
                  <Box
                      key={index}
                      p={3}
                      m={2}
                      sx={{
                        width: '250px',
                        height: '350px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        background: '#2b2e2b',
                        borderRadius: '16px',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        '&:hover': {
                          transform: 'scale(1.05)',
                          boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.7)',
                        },
                      }}
                  >
                    <Typography variant="h5" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                      {game.game_title || 'Unknown Game'}
                    </Typography>
                    <Typography variant="body2" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                      Genre: {game.game_genre || 'Unknown Rating'}
                    </Typography>
                    <img
                        src={game.img || '/default-thumbnail.png'}
                        alt={`${game.game_title} Thumbnail`}
                        style={{
                          width: '100%',
                          height: '180px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          marginTop: '10px',
                        }}
                    />
                  </Box>
              ))
          ) : (
              <Typography
                  variant="h6"
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    color: '#ffffff',
                  }}
              >
                No games to display.
              </Typography>
          )}
        </Container>
      </div>
  );


  /*const [albums, setAlbums] = useState([]);

  useEffect(() => {
    fetch(`http://${config.server_host}:${config.server_port}/albums`)
      .then(res => res.json())
      .then(resJson => setAlbums(resJson));
  }, []);

  // These formatting options leverage flexboxes, an incredibly powerful tool for formatting dynamic layouts.
  // You can learn more on MDN web docs linked below (or many other online resources)
  // https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Flexbox
  const format1 = {};
  const format2 = { display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly' };
  const format3 = { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-evenly' };
  const format4 = { display: 'grid', justifyContent: 'space-evenly' };

  return (
    // TODO (TASK 22): Try out the different provided formatting options by replacing “format1”  in the Container's style property with the other provided options.
    // TODO (TASK 22): Choose the one that displays all the albums in a fluid grid.
    <Container style={format3}>
      {albums.map((album) =>
        <Box
          key={album.album_id}
          p={3}
          m={2}
          style={{ background: '#c5cae9', borderRadius: '16px', border: '2px solid #000' }}
        >
          <img
            key={album.album_id}
            src={album.thumbnail_url}
            alt={`${album.title} album art`}
          />
          <h4><NavLink to={`/albums/${album.album_id}`}>{album.title}</NavLink></h4>
        </Box>
      )}
    </Container>
  );*/
}