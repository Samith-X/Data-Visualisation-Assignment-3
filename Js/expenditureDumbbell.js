// --------------------------------------------------
// STEP 2
// Interactive Health Expenditure Dumbbell Chart
// Government vs Voluntary/Out-of-Pocket spending, by country
// Owner: Andrew
// --------------------------------------------------


// Load cleaned health expenditure CSV file
d3.csv(
    "Data/Processed/health_expenditure_clean.csv",
    d3.autoType
)
.then(function(data) {

    console.log("Health Expenditure dataset loaded successfully.");

    console.log("Number of rows:", data.length);


    // --------------------------------------------------
    // DISPLAY DATA LOAD STATUS
    // --------------------------------------------------

    d3.select("#expenditureDumbbellStatus")
        .text(
            "Dataset loaded successfully: "
            + data.length
            + " records."
        );


    // --------------------------------------------------
    // GET UNIQUE YEARS
    // --------------------------------------------------

    const years = Array.from(
        new Set(
            data.map(function(d) {
                return d.year;
            })
        )
    ).sort(
        function(a, b) {
            return a - b;
        }
    );


    console.log("Years:", years);


    // --------------------------------------------------
    // CREATE YEAR DROPDOWN
    // --------------------------------------------------

    const yearDropdown = d3.select("#dumbbellYearSelect");


    yearDropdown
        .selectAll("option")
        .data(years)
        .enter()
        .append("option")

        .attr("value", function(d) {
            return d;
        })

        .text(function(d) {
            return d;
        });


    // --------------------------------------------------
    // SET DEFAULT YEAR (LATEST AVAILABLE)
    // --------------------------------------------------

    const defaultYear = years[years.length - 1];


    yearDropdown.property(
        "value",
        defaultYear
    );


    // --------------------------------------------------
    // CHART DIMENSIONS
    // --------------------------------------------------

    const margin = {

        top: 60,

        right: 60,

        bottom: 60,

        left: 140

    };


    const width = 950;

    const height = 560;


    const innerWidth =
        width
        - margin.left
        - margin.right;


    const innerHeight =
        height
        - margin.top
        - margin.bottom;


    // --------------------------------------------------
    // CREATE SVG
    // --------------------------------------------------

    const svg = d3
        .select("#expenditureDumbbellChart")

        .append("svg")

        .attr(
            "width",
            width
        )

        .attr(
            "height",
            height
        );


    // --------------------------------------------------
    // CREATE MAIN CHART GROUP
    // --------------------------------------------------

    const chartArea = svg
        .append("g")

        .attr(
            "transform",
            "translate("
            + margin.left
            + ","
            + margin.top
            + ")"
        );


    // --------------------------------------------------
    // CREATE X SCALE (VALUE, % OF GDP)
    // --------------------------------------------------

    const xScale = d3
        .scaleLinear()

        .range([
            0,
            innerWidth
        ]);


    // --------------------------------------------------
    // CREATE Y SCALE (COUNTRY, BAND)
    // --------------------------------------------------

    const yScale = d3
        .scaleBand()

        .range([
            0,
            innerHeight
        ])

        .padding(0.4);


    // --------------------------------------------------
    // CREATE X AXIS GROUP
    // --------------------------------------------------

    const xAxisGroup = chartArea
        .append("g")

        .attr(
            "transform",
            "translate(0,"
            + innerHeight
            + ")"
        );


    // --------------------------------------------------
    // CREATE Y AXIS GROUP
    // --------------------------------------------------

    const yAxisGroup = chartArea
        .append("g");


    // --------------------------------------------------
    // X AXIS LABEL
    // --------------------------------------------------

    chartArea
        .append("text")

        .attr(
            "class",
            "axis-label"
        )

        .attr(
            "x",
            innerWidth / 2
        )

        .attr(
            "y",
            innerHeight + 45
        )

        .attr(
            "text-anchor",
            "middle"
        )

        .text("% of GDP");


    // --------------------------------------------------
    // CHART TITLE
    // --------------------------------------------------

    const chartTitle = chartArea
        .append("text")

        .attr(
            "class",
            "chart-title"
        )

        .attr(
            "x",
            innerWidth / 2
        )

        .attr(
            "y",
            -25
        )

        .attr(
            "text-anchor",
            "middle"
        );


    // --------------------------------------------------
    // LEGEND
    // --------------------------------------------------

    const legend = chartArea
        .append("g")
        .attr(
            "class",
            "dumbbell-legend"
        )
        .attr(
            "transform",
            "translate(0,-5)"
        );

    legend.append("circle")
        .attr("cx", 0)
        .attr("cy", -30)
        .attr("r", 6)
        .attr("fill", "#2a78d6");

    legend.append("text")
        .attr("x", 12)
        .attr("y", -26)
        .attr("class", "legend-label")
        .text("Government/compulsory");

    legend.append("circle")
        .attr("cx", 220)
        .attr("cy", -30)
        .attr("r", 6)
        .attr("fill", "#eb6834");

    legend.append("text")
        .attr("x", 232)
        .attr("y", -26)
        .attr("class", "legend-label")
        .text("Voluntary / out-of-pocket");


    // --------------------------------------------------
    // UPDATE CHART FUNCTION
    // Exposed for integration, same pattern as
    // updateExpenditure() in expenditure.js
    // --------------------------------------------------

    function updateDumbbellChart(year) {


        // Government/compulsory rows for the selected year
        const govData = data

            .filter(function(d) {

                return (
                    d.year === year
                    && d.financing_scheme === "Government/compulsory schemes"
                );

            });


        // Voluntary/out-of-pocket rows for the selected year
        const volData = data

            .filter(function(d) {

                return (
                    d.year === year
                    && d.financing_scheme === "Voluntary schemes/household out-of-pocket payments"
                );

            });


        // Build one row per country combining both values,
        // sorted by government spending so the chart reads
        // low-to-high, matching the earlier sketch
        const combined = govData

            .map(function(g) {

                const match = volData.find(
                    function(v) {
                        return v.country === g.country;
                    }
                );

                return {
                    country: g.country,
                    government: g.value,
                    voluntary: match ? match.value : null
                };

            })

            .filter(function(d) {

                return d.voluntary !== null;

            })

            .sort(function(a, b) {

                return d3.ascending(
                    a.government,
                    b.government
                );

            });


        console.log(
            "Selected Year:",
            year
        );

        console.log(
            "Combined Data:",
            combined
        );


        // --------------------------------------------------
        // X SCALE DOMAIN
        // --------------------------------------------------

        const maxValue = d3.max(
            combined,
            function(d) {

                return Math.max(
                    d.government,
                    d.voluntary
                );

            }
        );


        xScale.domain([
            0,
            maxValue + 1
        ]);


        // --------------------------------------------------
        // Y SCALE DOMAIN
        // --------------------------------------------------

        yScale.domain(

            combined.map(function(d) {

                return d.country;

            })

        );


        // --------------------------------------------------
        // UPDATE X AXIS
        // --------------------------------------------------

        xAxisGroup

            .transition()

            .duration(500)

            .call(

                d3.axisBottom(
                    xScale
                )

            );


        // --------------------------------------------------
        // UPDATE Y AXIS
        // --------------------------------------------------

        yAxisGroup

            .transition()

            .duration(500)

            .call(

                d3.axisLeft(
                    yScale
                )

            );


        // --------------------------------------------------
        // UPDATE CONNECTING LINES
        // --------------------------------------------------

        const lines = chartArea

            .selectAll(
                ".dumbbell-line"
            )

            .data(
                combined,
                function(d) {
                    return d.country;
                }
            );


        lines.join(

            function(enter) {

                return enter

                    .append("line")

                    .attr(
                        "class",
                        "dumbbell-line"
                    )

                    .attr(
                        "x1",
                        function(d) {
                            return xScale(d.government);
                        }
                    )

                    .attr(
                        "x2",
                        function(d) {
                            return xScale(d.voluntary);
                        }
                    )

                    .attr(
                        "y1",
                        function(d) {
                            return yScale(d.country) + yScale.bandwidth() / 2;
                        }
                    )

                    .attr(
                        "y2",
                        function(d) {
                            return yScale(d.country) + yScale.bandwidth() / 2;
                        }
                    )

                    .attr(
                        "stroke",
                        "#c3c2b7"
                    )

                    .attr(
                        "stroke-width",
                        2
                    );

            },

            function(update) {

                return update

                    .transition()

                    .duration(500)

                    .attr(
                        "x1",
                        function(d) {
                            return xScale(d.government);
                        }
                    )

                    .attr(
                        "x2",
                        function(d) {
                            return xScale(d.voluntary);
                        }
                    )

                    .attr(
                        "y1",
                        function(d) {
                            return yScale(d.country) + yScale.bandwidth() / 2;
                        }
                    )

                    .attr(
                        "y2",
                        function(d) {
                            return yScale(d.country) + yScale.bandwidth() / 2;
                        }
                    );

            },

            function(exit) {

                return exit.remove();

            }

        );


        // --------------------------------------------------
        // UPDATE GOVERNMENT DOTS
        // --------------------------------------------------

        const govDots = chartArea

            .selectAll(
                ".dot-government"
            )

            .data(
                combined,
                function(d) {
                    return d.country;
                }
            );


        govDots.join(

            function(enter) {

                return enter

                    .append("circle")

                    .attr(
                        "class",
                        "dot-government"
                    )

                    .attr(
                        "cx",
                        function(d) {
                            return xScale(d.government);
                        }
                    )

                    .attr(
                        "cy",
                        function(d) {
                            return yScale(d.country) + yScale.bandwidth() / 2;
                        }
                    )

                    .attr("r", 7)

                    .attr("fill", "#2a78d6");

            },

            function(update) {

                return update

                    .transition()

                    .duration(500)

                    .attr(
                        "cx",
                        function(d) {
                            return xScale(d.government);
                        }
                    )

                    .attr(
                        "cy",
                        function(d) {
                            return yScale(d.country) + yScale.bandwidth() / 2;
                        }
                    );

            },

            function(exit) {

                return exit.remove();

            }

        );


        // --------------------------------------------------
        // UPDATE VOLUNTARY / OUT-OF-POCKET DOTS
        // --------------------------------------------------

        const volDots = chartArea

            .selectAll(
                ".dot-voluntary"
            )

            .data(
                combined,
                function(d) {
                    return d.country;
                }
            );


        volDots.join(

            function(enter) {

                return enter

                    .append("circle")

                    .attr(
                        "class",
                        "dot-voluntary"
                    )

                    .attr(
                        "cx",
                        function(d) {
                            return xScale(d.voluntary);
                        }
                    )

                    .attr(
                        "cy",
                        function(d) {
                            return yScale(d.country) + yScale.bandwidth() / 2;
                        }
                    )

                    .attr("r", 7)

                    .attr("fill", "#eb6834");

            },

            function(update) {

                return update

                    .transition()

                    .duration(500)

                    .attr(
                        "cx",
                        function(d) {
                            return xScale(d.voluntary);
                        }
                    )

                    .attr(
                        "cy",
                        function(d) {
                            return yScale(d.country) + yScale.bandwidth() / 2;
                        }
                    );

            },

            function(exit) {

                return exit.remove();

            }

        );


        // --------------------------------------------------
        // UPDATE CHART TITLE
        // --------------------------------------------------

        chartTitle.text(

            "Government vs Voluntary/OOP Health Spending, "
            + year

        );

    }


    // --------------------------------------------------
    // DRAW INITIAL CHART
    // --------------------------------------------------

    updateDumbbellChart(
        defaultYear
    );


    // --------------------------------------------------
    // DROPDOWN EVENT LISTENER
    // --------------------------------------------------

    yearDropdown.on(
        "change",
        function() {

            const selectedYear =
                +d3.select(this)
                    .property(
                        "value"
                    );

            updateDumbbellChart(
                selectedYear
            );

        }
    );


    // --------------------------------------------------
    // INTEGRATION HOOK
    // --------------------------------------------------

    window.updateExpenditureDumbbell = function(year) {

        yearDropdown.property(
            "value",
            year
        );

        updateDumbbellChart(
            year
        );

    };


})
.catch(function(error) {


    // --------------------------------------------------
    // ERROR HANDLING
    // --------------------------------------------------

    console.error(
        "Error loading dataset:",
        error
    );


    d3.select("#expenditureDumbbellStatus")
        .text(
            "Error loading the dataset."
        );

});
