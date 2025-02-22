document.addEventListener("DOMContentLoaded", () => {
    const opinionInput = document.getElementById("userOpinion");
    const submitOpinionBtn = document.getElementById("submitOpinion");
    const generateOpinionBtn = document.getElementById("generateOpinion");
    const opinionDisplay = document.getElementById("opinionDisplay");
    const opinionText = document.getElementById("opinionText");
    const stars = document.querySelectorAll(".star");
    const submitRatingBtn = document.getElementById("submitRating");
    const ratingResults = document.getElementById("ratingResults");
    const averageRatingDisplay = document.getElementById("averageRating");

    let currentOpinionId = null;
    let selectedRating = 0;
    
    // Submit an Opinion
    submitOpinionBtn.addEventListener("click", async () => {
        const opinion = opinionInput.value.trim();
        if (opinion === "") return alert("Please enter an opinion!");

        const response = await fetch("/submit-opinion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ opinion })
        });

        if (response.ok) {
            alert("Opinion submitted!");
            opinionInput.value = ""; // Clear input field
        }
    });

    // Generate Random Opinion
    generateOpinionBtn.addEventListener("click", async () => {
        const response = await fetch("/get-opinion");
        const data = await response.json();

        if (data.opinion) {
            currentOpinionId = data.id;
            opinionText.textContent = data.opinion;
            opinionDisplay.classList.remove("hidden");
            ratingResults.classList.add("hidden"); // Hide previous results
        }
    });

    // Handle Star Rating Selection
    stars.forEach(star => {
        star.addEventListener("click", () => {
            selectedRating = parseInt(star.getAttribute("data-value"));
            stars.forEach(s => s.classList.remove("selected"));
            for (let i = 0; i < selectedRating; i++) {
                stars[i].classList.add("selected");
            }
        });
    });

    // Submit Rating
    submitRatingBtn.addEventListener("click", async () => {
        if (selectedRating === 0) return alert("Please select a rating first!");

        const response = await fetch("/submit-rating", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ opinionId: currentOpinionId, rating: selectedRating })
        });

        if (response.ok) {
            fetchHistogramData();
        }
    });

    // Fetch Histogram Data
    async function fetchHistogramData() {
        const response = await fetch(`/get-ratings/${currentOpinionId}`);
        const data = await response.json();

        if (data.ratings && data.average) {
            displayHistogram(data.ratings);
            averageRatingDisplay.textContent = `Average Rating: ${data.average.toFixed(2)} stars`;
            ratingResults.classList.remove("hidden");
        }
    }

    // Display Histogram
    function displayHistogram(ratings) {
        const ctx = document.getElementById("histogram").getContext("2d");
        new Chart(ctx, {
            type: "bar",
            data: {
                labels: ["1★", "2★", "3★", "4★", "5★"],
                datasets: [{
                    label: "Ratings Count",
                    data: ratings,
                    backgroundColor: "white",
                    borderColor: "black",
                    borderWidth: 1
                }]
            },
            options: {
                scales: { y: { beginAtZero: true } }
            }
        });
    }
});
