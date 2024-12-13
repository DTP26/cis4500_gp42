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

const BouncingController = () => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [direction, setDirection] = useState({ x: 1, y: 1 });
    const [rotation, setRotation] = useState(0); // Track the rotation angle
    const controllerSize = 150;

    useEffect(() => {
        const moveController = () => {
            setPosition((prev) => {
                const newX = prev.x + direction.x * 5;
                const newY = prev.y + direction.y * 5;

                let newDirection = { ...direction };

                if (newX + controllerSize > window.innerWidth || newX < 0) {
                    newDirection.x = -direction.x;
                }
                if (newY + controllerSize > window.innerHeight || newY < 0) {
                    newDirection.y = -direction.y;
                }

                setDirection(newDirection);

                // Increment rotation counterclockwise
                setRotation((prevRotation) => (prevRotation - 1) % 360);

                return { x: newX, y: newY };
            });
        };

        const interval = setInterval(moveController, 16);
        return () => clearInterval(interval);
    }, [direction]);

    return (
        <Box
            component={"img"}
            src={"/controller.png"}
            alt={"Bouncing Controller"}
            sx={{
                position: "fixed",
                width: `${controllerSize}px`,
                height: `${controllerSize}px`,
                zIndex: 9999,
                transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg)`,
                transformOrigin: "center",
            }}
        />
    );
};

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
            <BouncingController />
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