import React, { useState, useEffect } from "react";
import { Typography, Container, Button } from "@mui/material";

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
            const response = await fetch(
                `http://${config.server_host}:${config.server_port}/ratings?type=movies&lower=${lowerRating}&upper=${upperRating}&limit=10`
            );
            const data = await response.json();
            console.log("Guilty pleasure results:", data); // Debugging log
            setGuiltyResults(data || []);
        } catch (err) {
            console.error("Error fetching guilty pleasure data:", err);
            setError('Failed to fetch data. Please try again later.');
        }
    };

    return (
        <Container maxWidth="lg" style={{ textAlign: "center", padding: "20px" }}>
            <Typography
                variant="h1"
                style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "2rem", color: "#ffffff" }}
            >
                Explore Media
            </Typography>

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

                {Array.isArray(guiltyResults) && guiltyResults.length > 0 ? (
                    <div>
                        <Typography
                            variant="h3"
                            style={{
                                fontFamily: "'Orbitron', sans-serif",
                                marginBottom: "20px",
                                color: "#ffffff",
                            }}
                        >
                            Guilty Pleasure Results
                        </Typography>
                        <ul style={{ listStyle: "none", padding: "0", textAlign: "left", color: "#ffffff" }}>
                            {guiltyResults.map((item, index) => (
                                <li key={index} style={{ marginBottom: "10px", fontSize: "1.2rem" }}>
                                    <strong>{item.name}</strong> - Rating: {item.rating}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <Typography>No results found. Try adjusting your rating range.</Typography>
                )}
            </div>
        </Container>
    );
}