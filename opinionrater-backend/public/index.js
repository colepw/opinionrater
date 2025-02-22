const API_BASE_URL = "https://opinionrater.onrender.com";

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

        try {
            const response = await fetch(`${API_BASE_URL}/submit-opinion`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ opinion })
            });

            const data = await response.json();
            if (data.success) {
                alert("Opinion submitted!");
                opinionInput.value = "";
            } else {
                alert("Error: " + data.error);
            }
        } catch (error) {
            console.error("Error submitting opinion:", error);
        }
    });

    // Generate Random Opinion
    generateOpinionBtn.addEventListener("click", async () => {
        const response = await fetch(`${API_BASE_URL}/get-opinion`);
        const data = await response.json();

        if (data.opinion) {
            currentOpinionId = data.id;
            opinionText.textContent = data.opinion;
            opinionDisplay.classList.remove("hidden");
            ratingResults.classList.add("hidden");
            selectedRating = 0;
            stars.forEach(s => s.classList.remove("selected"));
        } else {
            alert("No opinions found. Add one first!");
        }
    });

    // Handle Star Rating Selection
    stars.forEach((star, index) => {
        star.addEventListener("click", () => {
            selectedRating = index + 1;
            stars.forEach((s, i) => {
                s.classList.toggle("selected", i < selectedRating);
            });
        });
    });

    // Submit Rating
    submitRatingBtn.addEventListener("click", async () => {
        if (!currentOpinionId) {
            return alert("Generate an opinion first!");
        }
        if (selectedRating === 0) {
            return alert("Please select a rating first!");
        }

        try {
            const response = await fetch(`${API_BASE_URL}/submit-rating`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ opinionId: currentOpinionId, rating: selectedRating })
            });

            if (response.ok) {
                fetchHistogramData();
            } else {
                alert("Error submitting rating.");
            }
        } catch (error) {
            console.error("Error submitting rating:", error);
        }
    });

    // Fetch Histogram Data
    async function fetchHistogramData() {
        console.log("Fetching histogram data...");

        const response = await fetch(`${API_BASE_URL}/get-ratings/${currentOpinionId}`);
        const data = await response.json();
    
        if (data.ratings && data.average !== undefined) {
            displayHistogram(data.ratings);
            document.getElementById("ratingResults").style.display = "block";
        } else {
            console.error("No ratings found.");
        }
    }
    
    function displayHistogram(ratings) {
        const ctx = document.getElementById("histogram").getContext("2d");
    
        if (window.histogramChart) {
            window.histogramChart.destroy();
        }
    
        window.histogramChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: ["1★", "2★", "3★", "4★", "5★"],
                datasets: [{
                    label: "Ratings Count",
                    data: ratings,
                    backgroundColor: "#3b3b38",
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
