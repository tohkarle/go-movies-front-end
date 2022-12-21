import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";


const Movie = () => {
    const [movie, setMovie] = useState({});

    // Matches the ':id' in index.js, if you put ':yello' then you need to put { yellow } here.
    let { id } = useParams();

    useEffect(() => {
        const headers = new Headers();
        headers.append("Content-Type", "application/json");

        const requestOptions = {
            method: "GET",
            headers: headers,
        }

        fetch(`${process.env.REACT_APP_BACKEND}/movies/${id}`, requestOptions)
            .then((response) => response.json())
            .then((data) => {
                setMovie(data);
            })
            .catch(error => {
                console.log(error);
            })
    }, [id]);

    if (movie.genres) {
        movie.genres = Object.values(movie.genres);
    } else {
        movie.genres = [];
    }

    return (
        <div>
            <h2>Movie: {movie.title}</h2>
            <small><em>{movie.release_date}, {movie.runtime} minutes, Rated {movie.mpaa_rating}</em></small><br />
            {movie.genres.map((g) => (
                <span key={g.genre} className="badge bg-secondary me-2">{g.genre}</span>
            ))}
            <hr />

            {movie.image !== "" &&
                <div className="mb-3">
                    <img src={`https://image.tmdb.org/t/p/w200/${movie.image}`} alt="poster" />
                </div>
            }

            <p>{movie.description}</p>
        </div>
    )
}

export default Movie;