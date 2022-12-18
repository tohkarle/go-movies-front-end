import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";


const Movie = () => {
    const [movie, setMovie] = useState({});

    // Matches the ':id' in index.js, if you put ':yello' then you need to put { yellow } here.
    let { id } = useParams();

    useEffect(() => {
        let myMovie = {
            id: 1,
            title: "Highlander",
            release_date: "1986-03-07",
            runtime: 116,
            mpaa_rating: "R",
            description: "Some long description",
        }
        setMovie(myMovie);
    }, [id]);
    // Not sure why 'id' is in this array.

    return (
        <div>
            <h2>Movie: {movie.title}</h2>
            <small><em>{movie.release_date}, {movie.runtime} minutes, Rated {movie.mpaa_rating}</em></small>
            <hr />
            <p>{movie.description}</p>
        </div>
    )
}

export default Movie;