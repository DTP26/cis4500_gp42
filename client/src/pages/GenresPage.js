import { useEffect, useState } from "react";
import {
    Card,
    CardMedia,
    CardContent,
    Container,
    Typography,
    Grid,
    Box,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { formatReleaseDate } from "../helpers/formatter";

const config = require("../config.json");

export default function GenresPage() {
    const { genre } = useParams();
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`http://${config.server_host}:${config.server_port}/games_by_genre/${genre}`)
            .then((res) => res.json())
            .then((data) => {
                setGames(data);
                setLoading(false);
            })
            .catch((error) => console.error("Error fetching games:", error));
    }, [genre]);

    return (
        <Container>
            <h1
                style={{
                    textAlign: "center",
                    fontFamily: "'Orbitron', sans-serif",
                }}
            >
                Top Games in {genre}
            </h1>

            {loading ? (
                <Typography
                    variant="h5"
                    sx={{
                        textAlign: "center",
                        color: "#a0a0a0",
                    }}
                >
                    Loading games...
                </Typography>
            ) : games.length > 0 ? (
                <Grid
                    container
                    spacing={3}
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                    }}
                >
                    {games.map((game) => (
                        <Grid item xs={12} sm={6} md={4} key={game.id}>
                            <Card
                                sx={{
                                    backgroundColor: "#1a1a1d",
                                    color: "#ffffff",
                                    borderRadius: "16px",
                                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
                                    transition:
                                        "transform 0.2s ease, box-shadow 0.2s ease",
                                    "&:hover": {
                                        transform: "scale(1.05)",
                                        boxShadow:
                                            "0px 8px 16px rgba(0, 0, 0, 0.7)",
                                    },
                                    display: "flex",
                                    flexDirection: "column",
                                    height: "100%",
                                }}
                            >
                                {game.img ? (
                                    <CardMedia
                                        component="img"
                                        image={game.img}
                                        alt={game.title}
                                        sx={{
                                            height: "200px",
                                            objectFit: "cover",
                                            borderTopLeftRadius: "16px",
                                            borderTopRightRadius: "16px",
                                        }}
                                    />
                                ) : (
                                    <Box
                                        sx={{
                                            height: "200px",
                                            backgroundColor: "#333333",
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            borderTopLeftRadius: "16px",
                                            borderTopRightRadius: "16px",
                                        }}
                                    >
                                        <Typography
                                            variant="h6"
                                            sx={{ color: "#a0a0a0" }}
                                        >
                                            No Image
                                        </Typography>
                                    </Box>
                                )}
                                <CardContent
                                    sx={{
                                        flexGrow: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            fontFamily: "'Orbitron', sans-serif",
                                            textAlign: "center",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {game.game_title}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: "#a0a0a0",
                                            textAlign: "center",
                                            marginTop: "10px",
                                        }}
                                    >
                                        Rating: {game.rating || "N/A"}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: "#a0a0a0",
                                            textAlign: "center",
                                            marginTop: "10px",
                                        }}
                                    >
                                        Released: {formatReleaseDate(game.release_date) || "N/A"}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Typography
                    variant="h5"
                    sx={{
                        textAlign: "center",
                        color: "#a0a0a0",
                        marginTop: "20px",
                    }}
                >
                    No games found in {genre}.
                </Typography>
            )}
        </Container>
    );
}