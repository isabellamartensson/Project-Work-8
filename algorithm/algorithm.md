```
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
```

## Testing
Tested against website/IMDB_DATASET_clean.csv (99 movies)

- **Input: romance**
  - Expected (from spreadsheet): Forrest Gump, 8.8, 7 movies
  - Actual (from tracing pseudocode): Forrest Gump, 8.8, 7 movies
  - Result: Pass, the algorithm handles lowercase input

- **Input: Comedy**
  - Expected (from spreadsheet): Gisaengchung, 8.6, 11 movies
  - Actual (from tracing pseudocode): Gisaengchung, 8.6, 11 movies
  - Result: Pass, the tie rule keeps Gisaengchung because it appears first in the dataset

- **Input: Music**
  - Expected (from spreadsheet): Whiplash, 8.5, 3 movies
  - Actual (from tracing pseudocode): Whiplash, 8.5, 3 movies
  - Result: Pass. The matching movies are Whiplash, The Pianist, and Andhadhun. The Pianist has the same rating as Whiplash, but the tie rule keeps Whiplash because it appears first in the dataset. Anand is excluded because its genre is Musical, not Music.

- **Input: not a genre**
  - Expected (from spreadsheet): Genre not found
  - Actual (from tracing pseudocode): "Results for: not a genre" followed by "Genre not found"
  - Result: Pass

- **Input: (empty)**
  - Expected: Please enter a genre
  - Actual (from tracing pseudocode): "Please enter a genre"
  - Result: Pass
