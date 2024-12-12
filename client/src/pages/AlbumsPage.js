import { useEffect, useState } from 'react';
import { Box, Container, Button, TextField, Typography } from '@mui/material';
import { NavLink } from 'react-router-dom';

const config = require('../config.json');


//uses /containing and /gamesMoviesByGenre
export default function AlbumsPage() {
  const [movieTitle, setMovieTitle] = useState(''); // User's input for the movie title
  const [games, setGames] = useState([]); // List of games related to the movie

  // Fetch games based on the movie's genre
  const fetchGamesByMovie = async () => {
    try {
      console.log(`Searching for movies containing: ${movieTitle}`);
      const genreResponse = await fetch(
        `http://${config.server_host}:${config.server_port}/containing/${movieTitle}`
      );
      const movies = await genreResponse.json();
      console.log('Movies Response:', movies);

      if (movies.length > 0) {
        const genre = movies[0].genre || 'Action'; // Default to 'Action' if genre is missing
        console.log('Detected Genre:', genre);

        const gamesResponse = await fetch(
          `http://${config.server_host}:${config.server_port}/games_movies_by_genre/${genre}?limit=10`
        );
        const gamesJson = await gamesResponse.json();
        console.log('Fetched Games:', gamesJson);

        if (gamesJson.length > 0) {
          setGames(gamesJson);
          //console.log('set the games');
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

  const format = { display: 'flex', flexWrap: 'wrap', justifyContent: 'space-evenly' };
  console.log('Rendered games state:', games);

  return (
    <div>
      <Typography variant="h2" align="center" gutterBottom>
        Find Games Based on a Movie
      </Typography>

      {/* Input Field for Movie Title */}
      <Box m={3} textAlign="center">
        <TextField
          label="Enter a Movie Title"
          variant="outlined"
          value={movieTitle}
          onChange={(e) => setMovieTitle(e.target.value)}
          style={{ width: '300px', marginRight: '10px' }}
        />
        <Button variant="contained" color="primary" onClick={fetchGamesByMovie}>
          Search
        </Button>
      </Box>

      {/* Display Games */}
      <Container style={format}>
        {games.length > 0 ? (
          games.map((game, index) => (
            <Box
              key={index}
              p={3}
              m={2}
              style={{ background: '#e3f2fd', borderRadius: '16px', border: '1px solid #ddd' }}
            >
              <Typography variant="h5">{game.game_title || 'Unknown Game'}</Typography>
              <Typography variant="body2">Rating: {game.game_genre || 'Unknown Rating'}</Typography>
              <img
                src={game.img || '/default-thumbnail.png'}
                alt={`${game.game_title} Thumbnail`}
                style={{ width: '150px', height: '150px', marginTop: '10px' }}
              />
            </Box>
          ))
        ) : (
          <Typography variant="h6" align="center" style={{ marginTop: '20px' }}>
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