import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';

const config = require('../config.json');

export default function MediaExplorerPage() {
  const [trendingMedia, setTrendingMedia] = useState([]); // List of trending media

  // Fetch trending media (games and movies) from the backend
  const fetchTrendingMedia = async () => {
    try {
      const response = await fetch(
        `http://${config.server_host}:${config.server_port}/important_games_movies/100/10` // Replace 100 and 10 with desired values for reviews and limit
      );
      const mediaJson = await response.json();
      console.log('Fetched Trending Media:', mediaJson);

      setTrendingMedia(mediaJson);
    } catch (err) {
      console.error('Error fetching trending media:', err);
      alert('An error occurred while fetching trending media. Please check the console for details.');
    }
  };

  // Fetch trending media on component mount
  useEffect(() => {
    fetchTrendingMedia();
  }, []);

  const responsive = {
    superLargeDesktop: {
      breakpoint: { max: 4000, min: 1024 },
      items: 5
    },
    desktop: {
      breakpoint: { max: 1024, min: 768 },
      items: 3
    },
    tablet: {
      breakpoint: { max: 768, min: 464 },
      items: 2
    },
    mobile: {
      breakpoint: { max: 464, min: 0 },
      items: 1
    }
  };

  return (
    <div>
      <Typography
        variant="h2"
        align="center"
        gutterBottom
        style={{
          fontFamily: "'Orbitron', sans-serif",
          marginBottom: '20px',
        }}
      >
        Media Explorer: Trending Games & Movies
      </Typography>

      {/* Display Trending Media in a Carousel */}
      <Carousel responsive={responsive} infinite autoPlay autoPlaySpeed={3000}>
        {trendingMedia.length > 0 ? (
          trendingMedia.map((media, index) => (
            <Box
              key={index}
              style={{
                background: media.type === 'game' 
                  ? 'linear-gradient(135deg, #4caf50 30%, #81c784 90%)' 
                  : 'linear-gradient(135deg, #1e88e5 30%, #64b5f6 90%)',
                color: 'white',
                borderRadius: '16px',
                width: '250px',
                height: '350px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px',
                textAlign: 'center',
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
                margin: '10px',
              }}
            >
              <Typography
                variant="h6"
                style={{
                  fontWeight: 'bold',
                  fontFamily: "'Orbitron', sans-serif",
                  marginBottom: '10px',
                }}
              >
                {media.title || 'Unknown Title'}
              </Typography>
              <Typography
                variant="body2"
                style={{
                  fontStyle: 'italic',
                  marginBottom: '10px',
                }}
              >
                Type: {media.type.charAt(0).toUpperCase() + media.type.slice(1)}
              </Typography>
              <Typography variant="body2" style={{ marginBottom: '10px' }}>
                Rating: {media.rating || 'N/A'}
              </Typography>
              <Typography variant="body2">
                Reviews: {media.reviews_count || 'N/A'}
              </Typography>
            </Box>
          ))
        ) : (
          <Typography
            variant="h6"
            align="center"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              color: '#ffffff',
              marginTop: '20px',
            }}
          >
            No trending media to display.
          </Typography>
        )}
      </Carousel>
    </div>
  );
}