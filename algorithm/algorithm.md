BEGIN

    LOAD movie dataset

    SET best_rating = 0
    SET best_movie = NONE
    SET genre_count = 0

    ASK user to enter a movie genre
    STORE input as selected_genre

    CONVERT selected_genre to lowercase
    REMOVE extra spaces from selected_genre

    IF selected_genre is empty THEN

        DISPLAY "Please enter a genre"

    ELSE

        DISPLAY "Results for: " + selected_genre

        FOR each movie in movie dataset

            CONVERT movie.Genre to lowercase
            SPLIT movie.Genre at each ", "
                INTO genre_list

            IF selected_genre is in genre_list THEN

                INCREASE genre_count by 1

                // Ties keep the first movie found
                IF movie.IMDB_Rating > best_rating THEN

                    SET best_rating = movie.IMDB_Rating
                    SET best_movie = movie

                END IF

            END IF

        END FOR

        IF genre_count = 0 THEN

            DISPLAY "Genre not found"

        ELSE

            DISPLAY "Best movie: " + best_movie.Series_Title
            DISPLAY "Rating: " + best_rating
            DISPLAY "Number of movies in genre: " + genre_count

        END IF

    END IF

END