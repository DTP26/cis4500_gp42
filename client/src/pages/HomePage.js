import { useEffect, useState } from "react";
import { Card, CardMedia, CardContent, Container, Divider, Link } from "@mui/material";
import { NavLink } from "react-router-dom";
import { formatReleaseDate } from "../helpers/formatter";

import LazyTable from "../components/LazyTable";
const config = require("../config.json");

export default function HomePage() {
  // We use the setState hook to persist information across renders (such as the result of our API calls)
  const [gameOfTheDay, setGameOfTheDay] = useState({});
  const [name, setName] = useState("");
  const [selectedSongId, setSelectedSongId] = useState(null);

  // The useEffect hook by default runs the provided callback after every render
  // The second (optional) argument, [], is the dependency array which signals
  // to the hook to only run the provided callback if the value of the dependency array
  // changes from the previous render. In this case, an empty array means the callback
  // will only run on the very first render.
  useEffect(() => {
    // Fetch request to get the song of the day. Fetch runs asynchronously.
    // The .then() method is called when the fetch request is complete
    // and proceeds to convert the result to a JSON which is finally placed in state.
      fetch(`http://${config.server_host}:${config.server_port}/random?type=game`)
          .then((res) => res.json())
          .then((resJson) => setGameOfTheDay(resJson));
  }, []);

  // Here, we define the columns of the "Top Songs" table. The songColumns variable is an array (in order)
  // of objects with each object representing a column. Each object has a "field" property representing
  // what data field to display from the raw data, "headerName" property representing the column label,
  // and an optional renderCell property which given a row returns a custom JSX element to display in the cell.
    const gameColumns = [
        {
            field: "title",
            headerName: "Title",
            renderCell: (row) => (
                <span>{row.type === "game" ? "🎮 " : "🎬 "}{row.title}</span>
            ), // Adds an emoji to differentiate games and movies
        },
        {
            field: "reviews_count",
            headerName: "Reviews Count",
        },
        {
            field: "game_rating",
            headerName: "Rating",
        },
        {
            field: "type",
            headerName: "Type",
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
          {/*/!* SongCard is a custom component that we made. selectedSongId && <SongCard .../> makes use of short-circuit logic to only render the SongCard if a non-null song is selected *!/*/}
          {/*{selectedSongId && (*/}
          {/*    <SongCard*/}
          {/*        songId={selectedSongId}*/}
          {/*        handleClose={() => setSelectedSongId(null)}*/}
          {/*    />*/}
          {/*)}*/}
          {/*<h2>*/}
          {/*    Check out your Game of the Day:&nbsp;*/}
          {/*    /!* TODO: edit this at some point to link to another page *!/*/}
          {/*    <Link onClick={() => setSelectedSongId(songOfTheDay.song_id)}>*/}
          {/*        {songOfTheDay.title}*/}
          {/*    </Link>*/}
          {/*</h2>*/}
          <h2 style={{textAlign: "center"}}>Check out your Game of the Day</h2>
          <div style={{
              display: "flex",
              justifyContent: "center",
              margin: "20px 0"
          }}>
              <Card
                  style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      padding: "20px",
                      maxWidth: "400px",
                      width: "90%",
                      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
                  }}
              >
                  {/* Game Image */}
                  {gameOfTheDay.img && (
                      <CardMedia
                          component="img"
                          image={gameOfTheDay.img}
                          alt={gameOfTheDay.title}
                          style={{
                              borderRadius: "8px",
                              height: "250px",
                              width: "100%",
                              objectFit: "cover",
                              marginBottom: "15px",
                          }}
                      />
                  )}

                  {/* Game Details */}
                  <CardContent style={{textAlign: "center"}}>
                      <h3 style={{margin: "10px 0", fontSize: "1.5rem"}}>
                          {gameOfTheDay.title || "Loading..."}
                      </h3>
                      {gameOfTheDay.release_date && (
                          <p style={{ margin: "5px 0", fontSize: "1rem", color: "gray" }}>
                              Release Date: {formatReleaseDate(gameOfTheDay.release_date)}
                          </p>
                      )}
                      {gameOfTheDay.rating !== undefined && (
                          <p style={{ margin: "5px 0", fontSize: "1rem", color: "gray" }}>
                              Rating: {gameOfTheDay.rating || "N/A"}
                          </p>
                      )}
                  </CardContent>
              </Card>
          </div>
          <Divider/>
          <h2>Trending Games</h2>
          {/* TODO: query needs to be fixed so that we can display a set
           amount of trending movies/games without being overpowered by the
            sheer volume of movies with high af ratings */}
          <LazyTable
              route={`http://${config.server_host}:${config.server_port}/important_games_movies/1000/50`}
              columns={gameColumns}
          />
          <Divider/>
          <h2>Trending Movies</h2>
          <Divider/>
          <LazyTable
              route={`http://${config.server_host}:${config.server_port}/top_albums`}
              columns={albumColumns}
              defaultPageSize={5}
              rowsPerPageOptions={[5, 10]}
          />
          <p>Created by {name}</p>
      </Container>
  );
}
