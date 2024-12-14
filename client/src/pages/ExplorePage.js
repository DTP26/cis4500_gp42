import React, { useState, useEffect } from "react";
import { Box, Typography, Container, Button } from "@mui/material";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";

const config = require("../config.json");

export default function ExplorePage() {
    const [trendingMedia, setTrendingMedia] = useState([]);
    const [year, setYear] = useState('');
    const [limit, setLimit] = useState(1);
    const [results, setResults] = useState([]);
    const [error, setError] = useState('');

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setResults([]);

        if (!year || isNaN(year) || year.length !== 4) {
            setError('Please enter a valid 4-digit year.');
            return;
        }
        if (limit <= 0 || isNaN(limit)) {
            setError('Please enter a valid positive number for limit.');
            return;
        }

        try {
            const response = await fetch(
                `http://${config.server_host}:${config.server_port}/highest_avg_rating?year=${year}&limit=${limit}`
            );
            const data = await response.json();
            setResults(data || []);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError('Failed to fetch data. Please try again later.');
        }
    };

    const responsive = {
        superLargeDesktop: { breakpoint: { max: 4000, min: 1024 }, items: 5 },
        desktop: { breakpoint: { max: 1024, min: 768 }, items: 3 },
        tablet: { breakpoint: { max: 768, min: 464 }, items: 2 },
        mobile: { breakpoint: { max: 464, min: 0 }, items: 1 },
    };

    return (
        <Container maxWidth="lg" style={{ textAlign: "center", padding: "20px" }}>
            <Typography
                variant="h1"
                style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "2rem", color: "#ffffff" }}
            >
                Explore Media
            </Typography>

            <div style={{ padding: "20px", fontFamily: "'Orbitron', sans-serif", color: "#e0e0e0" }}>
                <Typography
                    variant="h2"
                    style={{ fontFamily: "'Orbitron', sans-serif", marginBottom: "20px" }}
                >
                    Games & Movies Time Machine
                </Typography>
                <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
                    <div style={{ marginBottom: "10px" }}>
                        <label htmlFor="year" style={{ marginRight: "10px" }}>Year:</label>
                        <input
                            type="text"
                            id="year"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            placeholder="e.g., 2003"
                            style={{
                                padding: "5px",
                                width: "200px",
                                fontFamily: "'Orbitron', sans-serif",
                                fontSize: "1rem",
                            }}
                        />
                    </div>
                    <div style={{ marginBottom: "10px" }}>
                        <label htmlFor="limit" style={{ marginRight: "10px" }}>Number of Results:</label>
                        <input
                            type="number"
                            id="limit"
                            value={limit}
                            onChange={(e) => setLimit(e.target.value)}
                            placeholder="e.g., 5"
                            style={{
                                padding: "5px",
                                width: "200px",
                                fontFamily: "'Orbitron', sans-serif",
                                fontSize: "1rem",
                            }}
                        />
                    </div>
                    <Button
                        type="submit"
                        variant="contained"
                        style={{
                            backgroundColor: "#007BFF",
                            color: "#fff",
                            fontFamily: "'Orbitron', sans-serif",
                            fontSize: "1rem",
                        }}
                    >
                        Find Games & Movies
                    </Button>
                </form>

                {error && <Typography style={{ color: "red", fontFamily: "'Orbitron', sans-serif" }}>{error}</Typography>}

                <div>
                    {Array.isArray(results) && results.length > 0 ? (
                        <div>
                            <Typography
                                variant="h3"
                                style={{ fontFamily: "'Orbitron', sans-serif", marginBottom: "20px" }}
                            >
                                Top Results for {year}
                            </Typography>
                            <div style={{ textAlign: "left", marginLeft: "20px" }}>
                                {results.map((item, index) => (
                                    <div key={index} style={{ marginBottom: "10px" }}>
                                        <strong>Title:</strong> {item.title} <br />
                                        <strong>Type:</strong> {item.type === "game" ? "Game" : "Movie"} <br />
                                        <strong>Rating:</strong> {item.rating} {item.type === "game" ? "/5" : "/10"} <br />
                                        <strong>Release Year:</strong> {item.release_year}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <Typography>No results found. Try a different year or limit.</Typography>
                    )}
                </div>
            </div>

            <div style={{ marginTop: "40px" }}>
                <Typography
                    variant="h2"
                    style={{ fontFamily: "'Orbitron', sans-serif", marginBottom: "20px", color: "#ffffff" }}
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
                                    style={{
                                        fontFamily: "'Orbitron', sans-serif",
                                        marginBottom: "5px",
                                    }}
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
                    <Typography>No trending media to display.</Typography>
                )}
            </div>
        </Container>
    );
}