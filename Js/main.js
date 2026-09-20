d3.csv("Data/Processed/life_expectancy_clean.csv", d3.autoType)
    .then(function(data) {

        console.log("Life Expectancy dataset loaded successfully.");
        console.log("Number of rows:", data.length);
        console.log(data.slice(0, 5));

        d3.select("#status")
            .text("Dataset loaded successfully: " + data.length + " records.");

    })
    .catch(function(error) {

        console.error("Error loading dataset:", error);

        d3.select("#status")
            .text("Error loading the dataset.");

    });