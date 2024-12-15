import React, { useState, useEffect } from "react";
import {Typography, Container, Button, Box} from "@mui/material";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";

const config = require("../config.json");

export default function ExplorePage() {
    const [trendingMedia, setTrendingMedia] = useState([]);
    const [year, setYear] = useState('');
    const [limit, setLimit] = useState(1);
    const [results, setResults] = useState([]);
    const [guiltyResults, setGuiltyResults] = useState([]);
    const [error, setError] = useState('');
    const [lowerRating, setLowerRating] = useState('');
    const [upperRating, setUpperRating] = useState('');

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

    useEffect(() => {
        const fetchTrendingMedia = async () => {
            try {
                const response = await fetch(
                    `http://${config.server_host}:${config.server_port}/important_games_movies/1000/5`
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
            console.log("Time machine results:", data); // Debugging log
            setResults(data || []);
        } catch (err) {
            console.error("Error fetching time machine data:", err);
            setError('Failed to fetch data. Please try again later.');
        }
    };

    const handleGuiltySubmit = async (e) => {
        e.preventDefault();
        setError('');
        setGuiltyResults([]);

        if (!lowerRating || isNaN(lowerRating) || lowerRating < 0) {
            setError('Please enter a valid lower rating (e.g., 0.5).');
            return;
        }
        if (!upperRating || isNaN(upperRating) || upperRating > 10) {
            setError('Please enter a valid upper rating (e.g., 5.0).');
            return;
        }

        try {
            const movieResponse = await fetch(
                `http://${config.server_host}:${config.server_port}/ratings?type=movies&lower=${lowerRating}&upper=${upperRating}&limit=10`
            );
            const gameResponse = await fetch(
                `http://${config.server_host}:${config.server_port}/ratings?type=games&lower=${lowerRating}&upper=${upperRating}&limit=10`
            );

            const movieData = await movieResponse.json();
            const gameData = await gameResponse.json();

            console.log("Guilty pleasure results - Movies:", movieData); // Debugging log
            console.log("Guilty pleasure results - Games:", gameData); // Debugging log

            setGuiltyResults({ movies: movieData || [], games: gameData || [] });
        } catch (err) {
            console.error("Error fetching guilty pleasure data:", err);
            setError('Failed to fetch data. Please try again later.');
        }
    };

    return (
        <Container maxWidth="lg" style={{ textAlign: "center", padding: "20px" }}>
            {/* Game/Movie Time Machine */}
            <div style={{ padding: "20px", fontFamily: "'Orbitron', sans-serif", color: "#e0e0e0" }}>
                <Typography
                    variant="h2"
                    style={{ fontFamily: "'Orbitron', sans-serif", marginBottom: "20px" }}
                >
                    Games & Movies Time Machine
                </Typography>
                <Typography style={{ marginBottom: "20px", fontStyle: "italic" }}>
                    Go back in time to find the top movies/games of your favorite year.
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

                {Array.isArray(results) && results.length > 0 ? (
                    <div>
                        <Typography
                            variant="h3"
                            style={{
                                fontFamily: "'Orbitron', sans-serif",
                                marginBottom: "20px",
                                color: "#ffffff",
                            }}
                        >
                            Top Results for {year}
                        </Typography>
                        <ul style={{ listStyle: "none", padding: "0", textAlign: "left", color: "#ffffff" }}>
                            {results.map((item, index) => (
                                <li key={index} style={{ marginBottom: "10px", fontSize: "1.2rem" }}>
                                    <strong>{item.title}</strong> - {item.type.toUpperCase()}, Rating: {item.rating}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <Typography>No results found. Try a different year or limit.</Typography>
                )}
            </div>

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
                                        item.type?.toLowerCase() === "game" ? "#1e3a8a" : "#3a1e8a"
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
                                    Type: {item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : "Unknown"}
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

            {/* Guilty Pleasure Search Engine */}
            <div style={{ marginTop: "40px" }}>
                <Typography
                    variant="h2"
                    style={{ fontFamily: "'Orbitron', sans-serif", marginBottom: "20px", color: "#ffffff" }}
                >
                    Guilty Pleasure Search Engine
                </Typography>
                <Typography style={{ marginBottom: "20px", fontStyle: "italic" }}>
                    We all have our guilty pleasure! Go ahead, search for that movie rated 0.5/10!
                </Typography>
                <form onSubmit={handleGuiltySubmit} style={{ marginBottom: "20px" }}>
                    <div style={{ marginBottom: "10px"  }}>
                        <label htmlFor="lowerRating" style={{ marginRight: "10px" }}>Lower Rating:</label>
                        <input
                            type="number"
                            id="lowerRating"
                            value={lowerRating}
                            onChange={(e) => setLowerRating(e.target.value)}
                            placeholder="e.g., 0.5"
                            style={{
                                padding: "5px",
                                width: "200px",
                                fontFamily: "'Orbitron', sans-serif",
                                fontSize: "1rem",
                            }}
                        />
                    </div>
                    <div style={{ marginBottom: "10px" }}>
                        <label htmlFor="upperRating" style={{ marginRight: "10px" }}>Upper Rating:</label>
                        <input
                            type="number"
                            id="upperRating"
                            value={upperRating}
                            onChange={(e) => setUpperRating(e.target.value)}
                            placeholder="e.g., 5.0"
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
                            backgroundColor: "#FF4500",
                            color: "#fff",
                            fontFamily: "'Orbitron', sans-serif",
                            fontSize: "1rem",
                        }}
                    >
                        Search Guilty Pleasures
                    </Button>
                </form>

                {guiltyResults.movies && guiltyResults.movies.length > 0 ? (
                    <div>
                        <Typography
                            variant="h3"
                            style={{
                                fontFamily: "'Orbitron', sans-serif",
                                marginBottom: "20px",
                                color: "#ffffff",
                            }}
                        >
                            Top Results for your Guilty Pleasure Range
                        </Typography>
                        <ul style={{ listStyle: "none", fontFamily: "'Orbitron', sans-serif", padding: "0", textAlign: "left", color: "#ffffff" }}>
                            {guiltyResults.movies.map((item, index) => (
                                <li key={index} style={{ marginBottom: "10px", fontSize: "1.2rem" }}>
                                    <strong>{item.name}</strong> - MOVIE, Rating: {item.rating}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <Typography>No guilty pleasure movies found.</Typography>
                )}

                {guiltyResults.games && guiltyResults.games.length > 0 ? (
                    <div>
                        <ul style={{ listStyle: "none", fontFamily: "'Orbitron', sans-serif", padding: "0", textAlign: "left", color: "#ffffff" }}>
                            {guiltyResults.games.map((item, index) => (
                                <li key={index} style={{ marginBottom: "10px", fontSize: "1.2rem" }}>
                                    <strong>{item.name}</strong> - GAME, Rating: {item.rating}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <Typography>No guilty pleasure games found.</Typography>
                )}
            </div>
        </Container>
    );
}