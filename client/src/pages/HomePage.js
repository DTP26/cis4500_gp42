import { useEffect, useState } from "react";
import { Card, CardMedia, CardContent, Container, Divider, Link, Grid } from "@mui/material";
import { NavLink } from "react-router-dom";
import { formatReleaseDate } from "../helpers/formatter";

import LazyTable from "../components/LazyTable";
const config = require("../config.json");

export default function HomePage() {
    const [gameOfTheDay, setGameOfTheDay] = useState({});
    const [selectedSongId, setSelectedSongId] = useState(null);

    useEffect(() => {
        fetch(`http://${config.server_host}:${config.server_port}/random?type=game`)
            .then((res) => res.json())
            .then((resJson) => setGameOfTheDay(resJson));
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
            <h2 style={{ textAlign: "center" }}>Featured:</h2>
            <div style={{
                display: "flex",
                justifyContent: "center",
                margin: "20px 0"
            }}>
                <Card
                    style={{
                        maxWidth: "900px",
                        minHeight: "500px",
                        borderRadius: "15px",
                        boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3)",
                        backgroundColor: "#1a1a1d",
                        color: "#ffffff",
                    }}
                >
                    {gameOfTheDay.img && (
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
                    )}
                    <CardContent style={{ textAlign: "center" }}>
                        <h3 style={{
                            margin: "20px 0",
                            fontSize: "2rem",
                            fontFamily: "'Press Start 2P', 'monospace'",
                        }}>
                            {gameOfTheDay.title || "Loading..."}
                        </h3>
                        {gameOfTheDay.release_date && (
                            <p style={{
                                margin: "10px 0",
                                fontSize: "1.2rem",
                                color: "#a0a0a0",
                            }}>
                                Release Date: {formatReleaseDate(gameOfTheDay.release_date)}
                            </p>
                        )}
                        {gameOfTheDay.rating !== undefined && (
                            <p style={{
                                margin: "10px 0",
                                fontSize: "1.2rem",
                                color: "#a0a0a0",
                            }}>
                                Rating: {gameOfTheDay.rating || "N/A"}
                            </p>
                        )}
                    </CardContent>
                </Card>
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
            <Divider />
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