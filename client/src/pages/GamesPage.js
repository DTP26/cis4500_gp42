import React, { useState, useEffect } from "react";
import { Box, Typography, Container } from "@mui/material";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";

const config = require("../config.json");

export default function GamesPage() {
  const [trendingMedia, setTrendingMedia] = useState([]);

  useEffect(() => {
    const fetchTrendingMedia = async () => {
      try {
        const response = await fetch(
          `http://${config.server_host}:${config.server_port}/important_games_movies/1000/20`
        );
        const data = await response.json();
        setTrendingMedia(data);
      } catch (error) {
        console.error("Error fetching trending media:", error);
      }
    };

    fetchTrendingMedia();
  }, []);

  const responsive = {
    superLargeDesktop: {
      breakpoint: { max: 4000, min: 1024 },
      items: 5,
    },
    desktop: {
      breakpoint: { max: 1024, min: 768 },
      items: 3,
    },
    tablet: {
      breakpoint: { max: 768, min: 464 },
      items: 2,
    },
    mobile: {
      breakpoint: { max: 464, min: 0 },
      items: 1,
    },
  };

  return (
    <Container maxWidth="lg" style={{ textAlign: "center", padding: "20px" }}>
      <Typography
        variant="h2"
        style={{ fontFamily: "'Orbitron', sans-serif", color: "white", marginBottom: "20px" }}
      >
        Media Explorer: Trending Games & Movies
      </Typography>

      {trendingMedia.length > 0 ? (
        <Carousel responsive={responsive} infinite autoPlay autoPlaySpeed={3000}>
          {trendingMedia.map((item, index) => (
            <Box
              key={index}
              sx={{
                background: `linear-gradient(145deg, ${
                  item.type === "game" ? "#1e3a8a" : "#3a1e8a"
                }, #000000)`,
                color: "white",
                padding: "20px",
                borderRadius: "20px",
                textAlign: "center",
                boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.7)",
                margin: "10px",
                height: "300px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "transform 0.3s ease",
                "&:hover": {
                  transform: "scale(1.05)",
                  boxShadow: "0px 12px 24px rgba(0, 0, 0, 0.9)",
                },
              }}
            >
              <Typography
                variant="h6"
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  marginBottom: "10px",
                  fontWeight: "bold",
                  fontSize: "18px",
                }}
              >
                {item.title || "Unknown Title"}
              </Typography>
              <Typography
                variant="body2"
                style={{ fontFamily: "'Orbitron', sans-serif", marginBottom: "5px" }}
              >
                Type: {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              </Typography>
              <Typography
                variant="body2"
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  marginBottom: "5px",
                  fontSize: "14px",
                }}
              >
                Rating: {item.game_rating || "N/A"}
              </Typography>
              <Typography
                variant="body2"
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  marginBottom: "5px",
                  fontSize: "14px",
                }}
              >
                Reviews: {item.reviews_count || "N/A"}
              </Typography>
            </Box>
          ))}
        </Carousel>
      ) : (
        <Typography
          variant="h6"
          style={{ fontFamily: "'Orbitron', sans-serif", color: "white" }}
        >
          No trending media to display.
        </Typography>
      )}
    </Container>
  );
}
