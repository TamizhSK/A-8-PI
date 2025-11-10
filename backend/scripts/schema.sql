
DROP TABLE IF EXISTS recipes;

CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,
    cuisine VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    rating FLOAT,
    prep_time INT,
    cook_time INT,
    total_time INT,
    description TEXT,
    nutrients JSONB,
    serves VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rating ON recipes(rating DESC);
CREATE INDEX idx_cuisine ON recipes(cuisine);
CREATE INDEX idx_title ON recipes(title);
CREATE UNIQUE INDEX idx_unique_recipe ON recipes(title, cuisine);
CREATE INDEX idx_total_time ON recipes(total_time);
CREATE INDEX idx_nutrients_gin ON recipes USING GIN(nutrients);

\d recipes;