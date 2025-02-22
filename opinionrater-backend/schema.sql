-- Create the opinions table
CREATE TABLE opinions (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL
);

-- Create the ratings table
CREATE TABLE ratings (
    id SERIAL PRIMARY KEY,
    opinion_id INT REFERENCES opinions(id) ON DELETE CASCADE,
    rating INT CHECK (rating >= 1 AND rating <= 5) NOT NULL
);
