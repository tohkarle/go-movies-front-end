import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import Input from "./form/Input";
import Select from "./form/Select";
import TextArea from "./form/TextArea";
import CheckBox from "./form/CheckBox";
import Swal from "sweetalert2";


const EditMovie = () => {
    const navigate = useNavigate();
    const { jwtToken } = useOutletContext();

    const [error, setError] = useState(null);
    const [errors, setErrors] = useState([]);

    const mpaaOptions = [
        { id: "G", value: "G" },
        { id: "PG", value: "PG" },
        { id: "PG-13", value: "PG-13" },
        { id: "R", value: "R" },
        { id: "NC-17", value: "NC-17" },
    ]

    const hasError = (key) => {
        return errors.indexOf(key) !== -1;    // If the element is not present in the array, the indexOf method returns -1.
    }

    const [movie, setMovie] = useState({
        id: 0,
        title: "",
        release_date: "",
        runtime: "",
        mpaa_rating: "",
        description: "",
        genres: [],
        genres_array: [Array(13).fill(false)],    // [false, false, false, false, false, false, false, false, false, false, false, false, false].
    });

    // Get id from the url.
    let { id } = useParams();  // useParams() always returns a string.
    if (id === undefined) {    // In index.js, the path to add movie is hard coded to be '/admin/movie/0' while the path to edit movie is '/admin/movie/:id'.
        id = 0;                // useParams() will find try to find 'id' in the path/url, but it won't find it in '/admin/movie/0' so id will be undefined.
    }

    useEffect(() => {
        if (jwtToken === "") {
            navigate("/login");
            return;
        }

        if (id === 0) {
            // Adding a movie.
            setMovie({
                id: 0,
                title: "",
                release_date: "",
                runtime: "",
                mpaa_rating: "",
                description: "",
                genres: [],
                genres_array: [Array(13).fill(false)],
            });

            const headers = new Headers();
            headers.append("Content-Type", "application/json");

            const requestOptions = {
                method: "GET",
                headers: headers,
            }

            fetch(`${process.env.REACT_APP_BACKEND}/genres`, requestOptions)
                .then((response) => response.json())
                .then((data) => {
                    const checks = [];
                    data.forEach(g => {
                        checks.push({ id: g.id, checked: false, genre: g.genre });
                    })
                    setMovie(m => ({
                        ...m,
                        genres: checks,
                        genres_array: [],
                    }))
                })
                .catch(error => {
                    console.log(error);
                })
        } else {
            // Editing an existing movie.
            const headers = new Headers();
            headers.append("Content-Type", "application/json");
            headers.append("Authorization", "Bearer " + jwtToken);

            const requestOptions = {
                method: "GET",
                headers: headers,
            }

            fetch(`${process.env.REACT_APP_BACKEND}/admin/movies/${id}`, requestOptions)
                .then((response) => {
                    if (response.status !== 200) {
                        setError("Invalid response code: " + response.status);
                    }
                    return response.json()
                })
                .then((data) => {
                    // Fix release date.
                    // When the Movie and Genres structs are marshaled into the JSON object, json:"movie" and json:"genres" are used as the key name. Hence, here you can reference it as 'data.movie' or 'data.genres'.
                    data.movie.release_date = new Date(data.movie.release_date).toISOString().split('T')[0]

                    const checks = [];

                    data.genres.forEach(g => {    // The 'data.genres' here is ALL genres from database.
                        if (data.movie.genres_array.indexOf(g.id) !== -1) {
                            checks.push({ id: g.id, checked: true, genre: g.genre });
                        } else {
                            checks.push({ id: g.id, checked: false, genre: g.genre });
                        }
                    })

                    // Set state.
                    setMovie({
                        ...data.movie,
                        genres: checks,
                    })
                })
                .catch(error => {
                    console.log(error);
                })
        }

    }, [id, jwtToken, navigate]);

    const handleSubmit = (event) => {
        event.preventDefault();

        let errors = [];
        let required = [
            { field: movie.title, name: "title" },
            { field: movie.release_date, name: "release_date" },
            { field: movie.runtime, name: "runtime" },
            { field: movie.description, name: "description" },
            { field: movie.mpaa_rating, name: "mpaa_rating" },
        ]

        required.forEach(function (obj) {    // 'obj' in this case is the variable associated with each object in required, e.g. for obj in required:
            if (obj.field === "") {
                errors.push(obj.name);
            }
        })

        if (movie.genres_array.length === 0) {
            Swal.fire({
                title: "Error!",
                text: "You must choose at least one genre!",
                icon: "error",
                confirmButtonText: "OK",
            })
            errors.push("genres");
        }

        setErrors(errors);

        if (errors.length > 0) {
            return false;
        }

        // Passed validation, so save changes.
        const headers = new Headers();
        headers.append("Content-Type", "application/json")
        headers.append("Authorization", "Bearer " + jwtToken)

        // Assume we are adding a new movie.
        let method = "PUT";

        if (movie.id > 0) {
            method = "PATCH";
        }

        const requestBody = movie;

        // Convert the values in JSON for release date (from string to date).
        requestBody.release_date = new Date(movie.release_date);

        // Convert the values in JSON for runtime from string to int.
        requestBody.runtime = parseInt(movie.runtime, 10);

        let requestOptions = {
            body: JSON.stringify(requestBody),
            method: method,
            headers: headers,
            credentials: "include",
        }

        fetch(`${process.env.REACT_APP_BACKEND}/admin/movies/${movie.id}`, requestOptions)
            .then((response) => response.json())
            .then((data) => {
                if (data.error) {
                    console.log(data.error);
                } else {
                    navigate("/manage-catalogue");
                }
            })
            .catch(error => {
                console.log(error);
            })
    }

    const handleChange = () => (event) => {
        let value = event.target.value;    // Whatever is put into the input field.
        let name = event.target.name;
        setMovie({
            ...movie,
            [name]: value,
        })
    }

    const handleCheck = (event, position) => {
        console.log("handleCheck log");
        console.log("value in handleCheck", event.target.value);
        console.log("checked is", event.target.checked);
        console.log("position is", position)

        let tmpArr = movie.genres;
        tmpArr[position].checked = !tmpArr[position].checked;    // Toggling the check - if was false, now true, vice versa.

        let tmpIDs = movie.genres_array;
        if (!event.target.checked) {    // If not checked.
            tmpIDs.splice(tmpIDs.indexOf(event.target.value));    // The splice() method removes the genre ID from the tmpIDs. The splice() method takes two arguments: the index at which to start removing elements, and the number of elements to remove. The code uses the indexOf() method to find the index of the genre ID in the array, and then passes that index and a count of 1 to the splice() method.
        } else {
            tmpIDs.push(parseInt(event.target.value, 10));    // If the checkbox is checked, the push() method adds the genre ID to the tmpIDs array. The push() method adds the element to the end of the array. The code also uses the parseInt() function to convert the genre ID, which is passed as a string, to an integer.
        }

        setMovie({
            ...movie,
            genres_array: tmpIDs,
        })
    }

    const confirmDelete = () => {
        Swal.fire({
            title: 'Delete movie?',
            text: "You cannot undo this action!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                let headers = new Headers();
                headers.append("Authorization", "Bearer " + jwtToken);

                const requestOptions = {
                    method: "DELETE",
                    headers: headers,
                }

                fetch(`${process.env.REACT_APP_BACKEND}/admin/movies/${movie.id}`, requestOptions)
                    .then((response) => response.json())
                    .then((data) => {
                        if (data.error) {
                            console.log(data.error);
                        } else {
                            navigate("/manage-catalogue");
                        }
                    })
                    .catch(error => {
                        console.log(error);
                    })
            }
        })
    }

    if (error !== null) {
        return <div>Error: {error.message}</div>;
    } else {
        return (
            <div>
                <h2>Add/Edit Movie</h2>
                <hr />
                {/* <pre>{JSON.stringify(movie, null, 3)}</pre> */}

                <form onSubmit={handleSubmit}>
                    <input type="hidden" name="id" value={movie.id} id="id"></input>
                    <Input
                        title="Title"
                        className="form-control"
                        type="text"
                        name="title"
                        value={movie.title}
                        onChange={handleChange("title")}
                        errorDiv={hasError("title") ? "text-danger" : "d-none"}
                        errorMsg="Please enter a title"
                    />

                    <Input
                        title="Release Date"
                        className="form-control"
                        type="date"
                        name="release_date"
                        value={movie.release_date}
                        onChange={handleChange("release_date")}
                        errorDiv={hasError("release_date") ? "text-danger" : "d-none"}
                        errorMsg="Please enter a release date"
                    />

                    <Input
                        title="Runtime"
                        className="form-control"
                        type="text"
                        name="runtime"
                        value={movie.runtime}
                        onChange={handleChange("runtime")}
                        errorDiv={hasError("runtime") ? "text-danger" : "d-none"}
                        errorMsg="Please enter a runtime"
                    />

                    <Select
                        title="MPAA Rating"
                        name="mpaa_rating"
                        options={mpaaOptions}
                        value={movie.mpaa_rating}
                        onChange={handleChange("mpaa_rating")}
                        placeholder="Choose..."
                        errorMsg="Please choose"
                        errorDiv={hasError("mpaa_rating") ? "text-danger" : "d-none"}
                    />

                    <TextArea
                        title="Description"
                        name="description"
                        value={movie.description}
                        rows="3"
                        onChange={handleChange("description")}
                        errorMsg="Please enter a description"
                        errorDiv={hasError("description") ? "text-danger" : "d-none"}
                    />

                    <hr />

                    <h3>Genres</h3>

                    {movie.genres && movie.genres.length > 1 &&
                        <>
                            {Array.from(movie.genres).map((g, index) => (
                                <CheckBox
                                    title={g.genre}
                                    name="genre"
                                    key={index}
                                    id={"genre-" + index}
                                    onChange={(event) => handleCheck(event, index)}
                                    value={g.id}
                                    checked={movie.genres[index].checked}
                                />
                            ))}
                        </>
                    }

                    <hr />

                    <button className="btn btn-primary">Save</button>
                    {movie.id > 0 &&
                        <a href="#!" className="btn btn-danger ms-2" onClick={confirmDelete}>Delete Movie</a>
                    }
                </form>
            </div>
        )
    }
}

export default EditMovie;