import {useState} from "react";

export default function () {
    const [movieTitle, setMovieTitle] = useState('');
    const [games, setGames] = useState([]);

    return(
        <h1>
            Hello, world!
        </h1>
    )

}