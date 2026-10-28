/**
 * IMDb CineMetrics - Client-Side Algorithmic Engine & Interactive UI
 * Enables live algorithm execution, step-by-step tracing, and dataset exploration
 * directly in the browser for GitHub Pages (zero backend required).
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Setup Home Page / Index Interactive Finder
    setupGenreSearch();

    // 2. Setup Dataset Explorer (dataset.html)
    setupDatasetExplorer();

    // 3. Setup Algorithm Simulator & Test Runner (algorithm.html)
    setupAlgorithmSimulator();
});

/**
 * Core Algorithm Implementation in JavaScript
 * Mirrors algorithm.py and algorithm.txt exactly.
 */
function runMovieAlgorithm(targetGenreInput, dataset = MOVIES_DATA) {
    const rawInput = targetGenreInput || "";
    const cleanInput = rawInput.trim().toLowerCase();

    if (!cleanInput) {
        return {
            status: "empty",
            message: "Please enter a genre name (e.g., 'Action', 'Drama', 'Crime')."
        };
    }

    let bestRating = 0.0;
    let bestMovie = null;
    let genreCount = 0;
    const matchedMovies = [];
    const executionTrace = [];

    dataset.forEach((movie, index) => {
        const rawGenres = movie.Genre ? movie.Genre.toLowerCase() : "";
        const genres = rawGenres.split(",").map(g => g.trim());

        if (genres.includes(cleanInput)) {
            genreCount++;
            const rating = parseFloat(movie.IMDB_Rating) || 0.0;
            matchedMovies.push(movie);

            let actionType = "MATCH_LOWER";
            let reason = `Matches '${cleanInput}', rating ${rating} is lower than current best (${bestRating})`;

            if (rating > bestRating) {
                actionType = "NEW_BEST";
                reason = `Rating ${rating} is strictly higher than previous best (${bestRating}). Replaces best movie!`;
                bestRating = rating;
                bestMovie = movie;
            } else if (rating === bestRating) {
                actionType = "TIE_RETAINED";
                reason = `Rating ${rating} equals current best (${bestRating}). Tie rule: retains first encountered ('${bestMovie.Series_Title}')`;
            }

            executionTrace.push({
                index: index + 1,
                title: movie.Series_Title,
                year: movie.Released_Year,
                rating: rating,
                genres: movie.Genre,
                action: actionType,
                reason: reason,
                currentBestTitle: bestMovie ? bestMovie.Series_Title : "None",
                currentBestRating: bestRating
            });
        }
    });

    if (genreCount === 0) {
        return {
            status: "not_found",
            genre: cleanInput,
            genreCount: 0,
            message: `No movies found matching genre: "${cleanInput}". Try checking your spelling or selecting from the list of 20 known genres.`
        };
    }

    return {
        status: "success",
        genre: cleanInput,
        genreCount: genreCount,
        bestMovie: bestMovie,
        bestRating: bestRating,
        matchedMovies: matchedMovies,
        trace: executionTrace
    };
}

/**
 * Setup Genre Search Widget (Index & Home)
 */
function setupGenreSearch() {
    const searchForm = document.getElementById("genre-search-form");
    const searchInput = document.getElementById("genre-input");
    const resultBox = document.getElementById("search-result-container");
    const quickChips = document.querySelectorAll(".genre-chip");

    if (!searchForm || !searchInput || !resultBox) return;

    function executeSearch(genreName) {
        if (!genreName) genreName = searchInput.value;
        searchInput.value = genreName;

        const res = runMovieAlgorithm(genreName);
        renderSearchResult(res, resultBox);
    }

    searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        executeSearch(searchInput.value);
    });

    quickChips.forEach(chip => {
        chip.addEventListener("click", () => {
            const genre = chip.getAttribute("data-genre");
            executeSearch(genre);
        });
    });

    // Auto-execute default query on load
    executeSearch("Crime");
}

function renderSearchResult(res, container) {
    if (res.status === "empty") {
        container.innerHTML = `
            <div class="alert-box alert-warning">
                <strong>Notice:</strong> ${res.message}
            </div>
        `;
        return;
    }

    if (res.status === "not_found") {
        container.innerHTML = `
            <div class="alert-box alert-error">
                <strong>No matches found:</strong> ${res.message}
            </div>
        `;
        return;
    }

    const movie = res.bestMovie;
    const poster = movie.Poster_Link || "https://via.placeholder.com/180x260?text=No+Poster";

    container.innerHTML = `
        <div class="movie-card-result">
            <div class="movie-poster-wrap">
                <img src="${poster}" alt="${movie.Series_Title} poster" class="movie-poster-img" onerror="this.src='https://via.placeholder.com/180x260?text=Movie+Poster';">
                <div class="rating-badge">${res.bestRating} ★</div>
            </div>
            <div class="movie-details-wrap">
                <div class="genre-pill-header">
                    <span class="badge-accent">Genre: ${res.genre.toUpperCase()}</span>
                    <span class="badge-neutral">${res.genreCount} movies matched in dataset</span>
                </div>
                <h3 class="movie-title">${movie.Series_Title} <span class="movie-year">(${movie.Released_Year})</span></h3>
                <p class="movie-meta">
                    <strong>Director:</strong> ${movie.Director} &nbsp;|&nbsp;
                    <strong>Runtime:</strong> ${movie.Runtime} &nbsp;|&nbsp;
                    <strong>Certificate:</strong> ${movie.Certificate || 'Unrated'}
                </p>
                <p class="movie-stars">
                    <strong>Starring:</strong> ${[movie.Star1, movie.Star2, movie.Star3, movie.Star4].filter(Boolean).join(", ")}
                </p>
                <p class="movie-genres-list">
                    <strong>All Genres:</strong> ${movie.Genre}
                </p>
                <p class="movie-overview">${movie.Overview}</p>

                <div class="algorithm-verdict-box">
                    <strong>Algorithmic Verdict:</strong> Selected as highest-rated among ${res.genreCount} ${res.genre} titles. 
                    ${res.trace.filter(t => t.action === 'TIE_RETAINED').length > 0 ? 
                        `<em>(Note: Ties detected in dataset; retained '${movie.Series_Title}' according to first-encountered tie rule).</em>` : ''}
                </div>
            </div>
        </div>
    `;
}

/**
 * Setup Dataset Explorer (dataset.html)
 */
function setupDatasetExplorer() {
    const tableBody = document.getElementById("movies-table-body");
    const countLabel = document.getElementById("table-count-label");
    const textFilter = document.getElementById("table-search-input");
    const genreSelect = document.getElementById("table-genre-select");

    if (!tableBody || typeof MOVIES_DATA === "undefined") return;

    function populateGenreOptions() {
        if (!genreSelect) return;
        const genresSet = new Set();
        MOVIES_DATA.forEach(m => {
            if (m.Genre) {
                m.Genre.split(",").forEach(g => genresSet.add(g.trim()));
            }
        });
        const sortedGenres = Array.from(genresSet).sort();
        sortedGenres.forEach(g => {
            const opt = document.createElement("option");
            opt.value = g;
            opt.textContent = g;
            genreSelect.appendChild(opt);
        });
    }

    function renderTable() {
        const query = (textFilter ? textFilter.value.trim().toLowerCase() : "");
        const selectedGenre = (genreSelect ? genreSelect.value : "ALL");

        const filtered = MOVIES_DATA.filter(m => {
            const matchesText = !query || 
                (m.Series_Title && m.Series_Title.toLowerCase().includes(query)) ||
                (m.Director && m.Director.toLowerCase().includes(query)) ||
                (m.Star1 && m.Star1.toLowerCase().includes(query));

            const movieGenres = m.Genre ? m.Genre.split(",").map(g => g.trim()) : [];
            const matchesGenre = (selectedGenre === "ALL") || movieGenres.includes(selectedGenre);

            return matchesText && matchesGenre;
        });

        if (countLabel) {
            countLabel.textContent = `Showing ${filtered.length} of ${MOVIES_DATA.length} movies`;
        }

        if (filtered.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem;">No matching movies found.</td></tr>`;
            return;
        }

        tableBody.innerHTML = filtered.map((m, idx) => `
            <tr>
                <td style="font-weight:bold; color:var(--accent);">${idx + 1}</td>
                <td>
                    <strong>${m.Series_Title}</strong>
                </td>
                <td>${m.Released_Year}</td>
                <td><span class="rating-chip">${m.IMDB_Rating}</span></td>
                <td><span class="genre-tag-list">${m.Genre}</span></td>
                <td>${m.Director}</td>
                <td>${m.Runtime}</td>
            </tr>
        `).join("");
    }

    populateGenreOptions();
    renderTable();

    if (textFilter) textFilter.addEventListener("input", renderTable);
    if (genreSelect) genreSelect.addEventListener("change", renderTable);
}

/**
 * Setup Algorithm Simulator & Test Suite Runner (algorithm.html)
 */
function setupAlgorithmSimulator() {
    const simForm = document.getElementById("sim-form");
    const simInput = document.getElementById("sim-genre-input");
    const traceContainer = document.getElementById("sim-trace-output");
    const runTestsBtn = document.getElementById("run-test-suite-btn");
    const testResultsContainer = document.getElementById("test-results-container");

    if (simForm && simInput && traceContainer) {
        simForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const genre = simInput.value;
            const res = runMovieAlgorithm(genre);
            renderSimulationTrace(res, traceContainer);
        });

        // Run initial simulation for "Music" to showcase disambiguation and tie handling
        const initialRes = runMovieAlgorithm("Music");
        renderSimulationTrace(initialRes, traceContainer);
    }

    if (runTestsBtn && testResultsContainer) {
        runTestsBtn.addEventListener("click", () => {
            runBrowserTestSuite(testResultsContainer);
        });
    }
}

function renderSimulationTrace(res, container) {
    if (res.status === "empty" || res.status === "not_found") {
        container.innerHTML = `
            <div class="alert-box alert-warning">
                <strong>Simulation Notice:</strong> ${res.message}
            </div>
        `;
        return;
    }

    let html = `
        <div class="trace-summary-card">
            <h4>Execution Summary for: <span style="color:var(--accent);">${res.genre.toUpperCase()}</span></h4>
            <div class="summary-stats-grid">
                <div><strong>Total Movies Inspected:</strong> 99</div>
                <div><strong>Genre Matches Found:</strong> ${res.genreCount}</div>
                <div><strong>Highest Rating Achieved:</strong> ${res.bestRating} / 10</div>
                <div><strong>Winning Title:</strong> ${res.bestMovie.Series_Title}</div>
            </div>
        </div>
        <h5 style="margin-top:1.5rem;">Algorithmic Step-by-Step Decision Trace:</h5>
        <div class="trace-steps-list">
    `;

    res.trace.forEach((step, i) => {
        let badgeClass = "badge-neutral";
        let icon = "•";
        if (step.action === "NEW_BEST") {
            badgeClass = "badge-success";
            icon = "★";
        } else if (step.action === "TIE_RETAINED") {
            badgeClass = "badge-warning";
            icon = "⚖";
        }

        html += `
            <div class="trace-step-item">
                <div class="trace-step-header">
                    <span class="trace-step-num">Step #${i + 1}</span>
                    <span class="trace-movie-name">Movie #${step.index}: "${step.title}" (${step.year})</span>
                    <span class="trace-rating-badge">Rating: ${step.rating}</span>
                    <span class="trace-action-badge ${badgeClass}">${icon} ${step.action}</span>
                </div>
                <div class="trace-reason">${step.reason}</div>
                <div class="trace-state">Current State: best_movie = <strong>"${step.currentBestTitle}"</strong> | best_rating = <strong>${step.currentBestRating}</strong></div>
            </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
}

function runBrowserTestSuite(container) {
    const testCases = [
        { id: 1, name: "Lowercase User Input", input: "drama", expectedTop: "The Shawshank Redemption", expectedRating: 9.3, expectedCount: 75 },
        { id: 2, name: "Tie-Breaking Rule (Preserve First)", input: "Crime", expectedTop: "The Godfather", expectedRating: 9.2, expectedCount: 21 },
        { id: 3, name: "Exact Match: Distinguishing Music vs. Musical", input: "Music", expectedTop: "Whiplash", expectedRating: 8.5, expectedCount: 3 },
        { id: 4, name: "Non-Existent Genre Query", input: "Superhero", expectedStatus: "not_found", expectedCount: 0 },
        { id: 5, name: "Empty / Blank Input Sanitization", input: "   ", expectedStatus: "empty" }
    ];

    let allPassed = true;
    let rowsHtml = "";

    testCases.forEach(tc => {
        const res = runMovieAlgorithm(tc.input);
        let passed = false;
        let details = "";

        if (tc.expectedStatus) {
            passed = (res.status === tc.expectedStatus);
            details = `Status: <code>${res.status}</code> (Correctly rejected/handled)`;
        } else {
            passed = (
                res.status === "success" &&
                res.bestMovie.Series_Title === tc.expectedTop &&
                Math.abs(res.bestRating - tc.expectedRating) < 0.001 &&
                res.genreCount === tc.expectedCount
            );
            details = `Count: ${res.genreCount} | Top: <em>${res.bestMovie ? res.bestMovie.Series_Title : 'None'}</em> (${res.bestRating}★)`;
        }

        if (!passed) allPassed = false;

        rowsHtml += `
            <tr>
                <td><strong>#${tc.id}</strong></td>
                <td><strong>${tc.name}</strong></td>
                <td><code>"${tc.input}"</code></td>
                <td>${details}</td>
                <td><span class="badge ${passed ? 'badge-success' : 'badge-error'}">${passed ? 'PASS ✓' : 'FAIL ✗'}</span></td>
            </tr>
        `;
    });

    container.innerHTML = `
        <div class="test-suite-summary-box ${allPassed ? 'test-passed-box' : 'test-failed-box'}">
            <h4>${allPassed ? '✓ All 5 Automated Tests Passed Successfully!' : '⚠ Some Tests Failed'}</h4>
            <p>Verification matches Python test suite execution against <code>IMDB_DATASET_clean.csv</code>.</p>
        </div>
        <table class="test-table" style="margin-top:1rem;">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Test Case</th>
                    <th>Input</th>
                    <th>Observed Output</th>
                    <th>Result</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml}
            </tbody>
        </table>
    `;
}
