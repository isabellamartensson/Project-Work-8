"""
This script implements Step 3 of the project workflow:
Given a user-selected genre, search through the curated IMDb dataset (99 top movies),
count how many movies match the genre, and identify the highest-rated movie.
In case of equal ratings (ties), it retains the first movie encountered.
"""

import csv
import sys
import os

def load_dataset(csv_filepath="IMDB_DATASET_clean.csv"):
    """Loads movies from the cleaned CSV dataset."""
    if not os.path.exists(csv_filepath):
        # Check current directory or parent directory
        alt_path = os.path.join(os.path.dirname(__file__), csv_filepath)
        if os.path.exists(alt_path):
            csv_filepath = alt_path
        else:
            raise FileNotFoundError(f"Cannot find dataset file at: {csv_filepath}")

    movies = []
    with open(csv_filepath, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                row["IMDB_Rating"] = float(row["IMDB_Rating"])
            except ValueError:
                row["IMDB_Rating"] = 0.0
            movies.append(row)
    return movies

def find_best_movie_by_genre(movies, input_genre, verbose=False):
    """
    Finds the highest-rated movie matching the given genre.

    Parameters:
        movies (list): List of movie dictionaries from the curated dataset.
        input_genre (str): The genre query provided by the user.
        verbose (bool): If True, logs step-by-step algorithmic evaluations.

    Returns:
        dict: Summary containing status, genre, genre_count, best_movie, best_rating, and details.
    """
    # 1. Clean and normalize user input
    target_genre = input_genre.strip().lower()
    if not target_genre:
        return {
            "status": "empty",
            "message": "Error: Genre name cannot be blank. Please enter a valid genre."
        }

    # 2. Initialize tracking variables
    best_rating = 0.0
    best_movie = None
    genre_count = 0
    tied_movies = []

    # 3. Iterate through movies
    for movie in movies:
        # Split genre string by comma and normalize each genre
        raw_genres = movie.get("Genre", "").lower()
        genres = [g.strip() for g in raw_genres.split(",") if g.strip()]

        # Check if the target genre is in this movie's genre list
        if target_genre in genres:
            genre_count += 1
            rating = movie["IMDB_Rating"]
            title = movie.get("Series_Title", "Unknown")

            if verbose:
                print(f"  [Match #{genre_count}] '{title}' (Rating: {rating})")

            # Selection: strictly greater rating replaces current best
            if rating > best_rating:
                if verbose and best_movie is not None:
                    print(f"    -> New best rating! Replaces '{best_movie.get('Series_Title')}' ({best_rating}) with '{title}' ({rating})")
                best_rating = rating
                best_movie = movie
                tied_movies = [movie]
            elif rating == best_rating:
                # Document tie: first movie found is preserved
                tied_movies.append(movie)
                if verbose:
                    print(f"    -> Tie detected with rating {rating}. Retaining first found: '{best_movie.get('Series_Title')}'.")

    # 4. Handle results
    if genre_count == 0:
        return {
            "status": "not_found",
            "genre": target_genre,
            "genre_count": 0,
            "message": f"Genre '{target_genre}' was not found in the dataset."
        }

    return {
        "status": "success",
        "genre": target_genre,
        "genre_count": genre_count,
        "best_movie": best_movie.get("Series_Title"),
        "best_rating": best_rating,
        "director": best_movie.get("Director"),
        "released_year": best_movie.get("Released_Year"),
        "overview": best_movie.get("Overview"),
        "poster_link": best_movie.get("Poster_Link"),
        "all_genres": best_movie.get("Genre"),
        "tied_count": len(tied_movies),
        "tied_titles": [m.get("Series_Title") for m in tied_movies]
    }

def run_test_suite(movies):
    """Executes the 5 key test cases defined in algorithm_design.txt."""
    print("=" * 70)
    print("RUNNING ALGORITHM VERIFICATION TEST SUITE (5 TEST CASES)")
    print("=" * 70)

    test_cases = [
        {
            "id": 1,
            "name": "Lowercase User Input",
            "input": "drama",
            "expected_top": "The Shawshank Redemption",
            "expected_rating": 9.3,
            "expected_count": 75
        },
        {
            "id": 2,
            "name": "Tie-Breaking Rule (Preserve First Encountered)",
            "input": "Crime",
            "expected_top": "The Godfather",
            "expected_rating": 9.2,
            "expected_count": 21
        },
        {
            "id": 3,
            "name": "Exact Matching: Distinguishing Music vs. Musical",
            "input": "Music",
            "expected_top": "Whiplash",
            "expected_rating": 8.5,
            "expected_count": 3
        },
        {
            "id": 4,
            "name": "Non-Existent Genre Query",
            "input": "Superhero",
            "expected_status": "not_found",
            "expected_count": 0
        },
        {
            "id": 5,
            "name": "Empty / Blank User Input",
            "input": "   ",
            "expected_status": "empty"
        }
    ]

    all_passed = True
    for tc in test_cases:
        res = find_best_movie_by_genre(movies, tc["input"])
        passed = False

        if tc.get("expected_status"):
            passed = (res["status"] == tc["expected_status"])
        else:
            passed = (
                res["status"] == "success" and
                res["best_movie"] == tc["expected_top"] and
                abs(res["best_rating"] - tc["expected_rating"]) < 1e-4 and
                res["genre_count"] == tc["expected_count"]
            )

        status_label = "PASS [OK]" if passed else "FAIL [X]"
        if not passed:
            all_passed = False

        print(f"Test #{tc['id']}: {tc['name']:<50} -> {status_label}")
        if tc.get("expected_status"):
            print(f"  Input: {repr(tc['input'])} | Status: {res['status']} | Message: {res.get('message')}")
        else:
            print(f"  Input: {repr(tc['input'])} | Count: {res['genre_count']} | Best: {res['best_movie']} ({res['best_rating']})")
        print("-" * 70)

    print(f"OVERALL RESULT: {'ALL 5 TESTS PASSED SUCCESSFULLY' if all_passed else 'SOME TESTS FAILED'}")
    print("=" * 70)
    return all_passed

def main():
    csv_file = "IMDB_DATASET_clean.csv"
    if len(sys.argv) > 1 and sys.argv[1].endswith(".csv"):
        csv_file = sys.argv[1]

    try:
        movies = load_dataset(csv_file)
    except FileNotFoundError:
        # Fallback path
        csv_file = "/workspace/output/IMDB_DATASET_clean.csv"
        movies = load_dataset(csv_file)

    print(f"Loaded {len(movies)} movies from {csv_file}.")

    if len(sys.argv) > 1 and sys.argv[1] in ["--test", "-t"]:
        run_test_suite(movies)
        return

    if len(sys.argv) > 1 and not sys.argv[1].startswith("-"):
        query = " ".join(sys.argv[1:])
        print(f"\nQuerying genre: '{query}'")
        res = find_best_movie_by_genre(movies, query, verbose=True)
        print("\nRESULT:")
        for k, v in res.items():
            print(f"  {k}: {v}")
        return

    # Interactive mode
    print("\nInteractive IMDb Highest-Rated Movie Finder")
    print("Type a genre name (or 'test' to run tests, 'exit' to quit):")
    while True:
        try:
            user_input = input("\nEnter movie genre > ").strip()
            if not user_input:
                continue
            if user_input.lower() in ["exit", "quit", "q"]:
                print("Goodbye!")
                break
            if user_input.lower() == "test":
                run_test_suite(movies)
                continue

            res = find_best_movie_by_genre(movies, user_input)
            if res["status"] == "empty":
                print(f"Warning: {res['message']}")
            elif res["status"] == "not_found":
                print(f"Notice: {res['message']}")
            else:
                print(f"Results for genre: {res['genre'].title()}")
                print(f"  Total movies matching: {res['genre_count']}")
                print(f"  Highest-rated movie:   {res['best_movie']} ({res['best_rating']}/10)")
                print(f"  Year of release:       {res['released_year']}")
                print(f"  Directed by:           {res['director']}")
                print(f"  Genres:                {res['all_genres']}")
                print(f"  Overview:              {res['overview']}")
                if res['tied_count'] > 1:
                    print(f"  Note on ties: {res['tied_count']} movies tied with rating {res['best_rating']}.")
                    print(f"                Preserved first found: '{res['best_movie']}'.")
                    print(f"                Other contenders: {', '.join([t for t in res['tied_titles'] if t != res['best_movie']])}")
        except (KeyboardInterrupt, EOFError):
            print("\nExiting.")
            break

if __name__ == "__main__":
    main()
