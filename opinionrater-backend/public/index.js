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
            const response = await fetch("/submit-opinion", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ opinion })
            });

            const data = await response.json();
            if (data.success) {
                alert("Opinion submitted!");
                opinionInput.value = ""; // Clear input field
            } else {
                alert("Error: " + data.error);
            }
        } catch (error) {
            console.error("Error submitting opinion:", error);
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
            selectedRating = 0; // Reset rating selection
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
            const response = await fetch("/submit-rating", {
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
        const response = await fetch(`/get-ratings/${currentOpinionId}`);
        const data = await response.json();
    
        if (data.ratings && data.average !== undefined) {
            displayHistogram(data.ratings);
            document.getElementById("averageRating").textContent = `Average Rating: ${data.average.toFixed(2)} stars`;
            document.getElementById("ratingResults").classList.remove("hidden");
        } else {
            console.error("No ratings found.");
        }
    }
    
    function displayHistogram(ratings) {
        const ctx = document.getElementById("histogram").getContext("2d");
    
        if (window.histogramChart) {
            window.histogramChart.destroy(); // Destroy old chart before creating a new one
        }
    
        window.histogramChart = new Chart(ctx, {
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
