import React, { useState } from "react";
import axios from "axios";
import {Box, Button, TextField} from "@mui/material";

const GamesPage = () => {
    const [number, setNumber] = useState(""); // Number of ratings
    const [gameTitle, setGameTitle] = useState(""); // Game title
    const [movies, setMovies] = useState([]); // Results
    const [error, setError] = useState(null); // Error handling

    const fetchMovies = async () => {
        if (!number || !gameTitle) {
            setError("Please provide both the number of ratings and the game title.");
            return;
        }

        try {
            const response = await axios.get(
                `http://localhost:8080/movie_num_ratings/${number}`,
                { params: { game_title: gameTitle } }
            );
            setMovies(response.data);
            setError(null); // Clear any previous errors
        } catch (err) {
            setError(err.response?.data?.error || "An unexpected error occurred.");
            setMovies([]);
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <h1 style={{
                textAlign: 'center', fontFamily: "'Orbitron'," +
                    " sans-serif"
            }}>Game2Movie Engine</h1>
            <p>
                Find movies that share genres with your favorite games, ordered
                by
                shared genres and title. Only movies under 90 minutes with sufficient
                ratings are shown.
            </p>
            {/* Input Fields for Game2Movie Engine */}
            <Box m={3} textAlign="center">
                {/* Input Field for Number of Ratings */}
                <TextField
                    label="Min. Number of Ratings"
                    variant="standard"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
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
                            color: 'white', // Input text color
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

                {/* Input Field for Game Title */}
                <TextField
                    label="Game Title"
                    variant="standard"
                    value={gameTitle}
                    onChange={(e) => setGameTitle(e.target.value)}
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
                            color: 'white', // Input text color
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

                {/* Submit Button */}
                <Button
                    variant="contained"
                    onClick={fetchMovies}
                    style={{
                        backgroundColor: '#004d00',
                        color: '#ffffff',
                        border: '1px solid #39ff14',
                        fontFamily: "'Orbitron', sans-serif",
                    }}
                >
                    SEARCH
                </Button>
            </Box>

            {error && <p style={{ color: "red" }}>{error}</p>}

            {movies.length > 0 ? (
                <table border="1" style={{ width: "100%", textAlign: "left" }}>
                    <thead>
                    <tr>
                        <th style={{ fontWeight: "bold" }}>Title</th>
                        <th style={{ fontWeight: "bold" }}>Number of Ratings</th>
                    </tr>
                    </thead>
                    <tbody>
                    {movies.map((movie, index) => (
                        <tr key={index}>
                            <td style={{ fontFamily: "'Orbitron', sans-serif" }}>{movie.title}</td>
                            <td style={{ fontFamily: "'Orbitron', sans-serif" }}>{movie.num_ratings}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            ) : (
                !error && <p>No movies found. Try different parameters.</p>
            )}
        </div>
    );
};

export default GamesPage;