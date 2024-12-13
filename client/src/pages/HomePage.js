import { useEffect, useState } from "react";
import {
    Card,
    CardMedia,
    CardContent,
    Container,
    Divider,
    Typography,
    Box,
} from "@mui/material";
import { NavLink } from "react-router-dom";
import { formatReleaseDate } from "../helpers/formatter";

import LazyTable from "../components/LazyTable";
const config = require("../config.json");

export default function HomePage() {
    const [gameOfTheDay, setGameOfTheDay] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        fetch(`http://${config.server_host}:${config.server_port}/random?type=game`)
            .then((res) => res.json())
            .then((resJson) => {
                if (isMounted) {
                    setGameOfTheDay(resJson);
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const gameColumns = [
        {
            field: "title",
            headerName: "Title",
            renderCell: (row) => (
                <span style={{ color: "#ffffff" }}>
                    {row.type === "game" ? "🎮 " : "🎬 "}
                    {row.title}
                </span>
            ),
        },
        {
            field: "reviews_count",
            headerName: "Reviews Count",
            renderCell: (row) => <span style={{ color: "#ffffff" }}>{row.reviews_count}</span>,
        },
        {
            field: "game_rating",
            headerName: "Rating",
            renderCell: (row) => <span style={{ color: "#ffffff" }}>{row.game_rating}</span>,
        },
        {
            field: "type",
            headerName: "Type",
            renderCell: (row) => <span style={{ color: "#ffffff" }}>{row.type}</span>,
        },
    ];

    const albumColumns = [
        {
            field: "title",
            headerName: "Album Title",
            renderCell: (row) => (
                <NavLink to={`/albums/${row.album_id}`}>{row.title}</NavLink>
            ),
        },
        {
            field: "plays",
            headerName: "Plays",
        },
    ];

    return (
        <Container>
            <Box
                component="img"
                src="/controller.png"
                alt="Bouncing and Spinning Controller"
                sx={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "150px",
                    height: "150px",
                    zIndex: 9999,
                    animation: "bounce-spin 6s infinite linear",
                    "@keyframes bounce-spin": {
                        "0%": { transform: "translate(0, 0) rotate(0deg)" },
                        "25%": { transform: "translate(calc(100vw - 150px)," +
                                " 0) rotate(90deg)" },
                        "50%": { transform: "translate(calc(100vw - 150px)," +
                                " calc(100vh - 150px)) rotate(180deg)" },
                        "75%": { transform: "translate(0, calc(100vh -" +
                                " 150px)) rotate(270deg)" },
                        "100%": { transform: "translate(0, 0) rotate(360deg)" },
                    },
                }}
            />
            <h2 style={{ textAlign: "center" }}>Featured:</h2>
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    margin: "20px 0",
                }}
            >
                {loading ? (
                    <Card
                        style={{
                            width: "80%",
                            maxWidth: "900px",
                            minHeight: "500px",
                            borderRadius: "15px",
                            boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3)",
                            backgroundColor: "#1a1a1d",
                            color: "#ffffff",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <Typography
                            variant="h6"
                            sx={{
                                fontSize: "1.5rem",
                                fontFamily: "'Press Start 2P', 'monospace'",
                                color: "#a0a0a0",
                                textAlign: "center",
                            }}
                        >
                            Loading...
                        </Typography>
                    </Card>
                ) : (
                    <Card
                        style={{
                            width: "80%",
                            maxWidth: "900px",
                            minHeight: "500px",
                            borderRadius: "15px",
                            boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3)",
                            backgroundColor: "#1a1a1d",
                            color: "#ffffff",
                        }}
                    >
                        {gameOfTheDay?.img ? (
                            <CardMedia
                                component="img"
                                image={gameOfTheDay.img}
                                alt={gameOfTheDay.title}
                                style={{
                                    height: "300px",
                                    objectFit: "cover",
                                    borderRadius: "15px 15px 0 0",
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    height: "300px",
                                    backgroundColor: "#333333",
                                    borderRadius: "15px 15px 0 0",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                }}
                            >
                                <Typography
                                    variant="h5"
                                    sx={{
                                        fontSize: "1.5rem",
                                        fontFamily: "'Press Start 2P', 'monospace'",
                                        color: "#a0a0a0",
                                    }}
                                >
                                    Loading Image...
                                </Typography>
                            </div>
                        )}
                        <CardContent
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                                height: "200px",
                                textAlign: "center",
                            }}
                        >
                            <Typography
                                variant="h3"
                                sx={{
                                    fontSize: "2rem",
                                    fontFamily: "'Press Start 2P', 'monospace'",
                                    color: "#ffffff",
                                }}
                            >
                                {gameOfTheDay?.title || "Loading Title..."}
                            </Typography>
                            {gameOfTheDay?.release_date && (
                                <Typography
                                    variant="body1"
                                    sx={{
                                        fontSize: "1rem",
                                        color: "#a0a0a0",
                                        marginTop: "10px",
                                    }}
                                >
                                    Release Date: {formatReleaseDate(gameOfTheDay.release_date)}
                                </Typography>
                            )}
                            {gameOfTheDay?.rating !== undefined && (
                                <Typography
                                    variant="body1"
                                    sx={{
                                        fontSize: "1rem",
                                        color: "#a0a0a0",
                                        marginTop: "10px",
                                    }}
                                >
                                    Rating: {gameOfTheDay.rating || "N/A"}
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
            <Divider />
            <h2>Trending Games</h2>
            <LazyTable
                route={`http://${config.server_host}:${config.server_port}/important_games_movies/1000/50`}
                columns={gameColumns}
                style={{
                    color: "#ffffff",
                }}
            />
            <Divider />
            <h2>Trending Movies</h2>
            <LazyTable
                route={`http://${config.server_host}:${config.server_port}/top_albums`}
                columns={albumColumns}
                defaultPageSize={5}
                rowsPerPageOptions={[5, 10]}
                style={{
                    color: "#ffffff",
                }}
            />
        </Container>
    );
}