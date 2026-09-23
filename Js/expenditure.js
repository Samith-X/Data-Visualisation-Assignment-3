// --------------------------------------------------
// STEP 2
// Interactive Health Expenditure Line Chart
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

    console.log("First five rows:");
    console.log(data.slice(0, 5));


    // --------------------------------------------------
    // DISPLAY DATA LOAD STATUS
    // --------------------------------------------------

    d3.select("#expenditureStatus")
        .text(
            "Dataset loaded successfully: "
            + data.length
            + " records."
        );


    // --------------------------------------------------
    // GET UNIQUE COUNTRIES
    // --------------------------------------------------

    const countries = Array.from(
        new Set(
            data.map(function(d) {
                return d.country;
            })
        )
    ).sort();


    console.log("Countries:", countries);


    // --------------------------------------------------
    // GET UNIQUE FINANCING SCHEMES
    // --------------------------------------------------

    const financingSchemes = Array.from(
        new Set(
            data.map(function(d) {
                return d.financing_scheme;
            })
        )
    );


    console.log("Financing schemes:", financingSchemes);


    // --------------------------------------------------
    // CREATE COUNTRY DROPDOWN
    // --------------------------------------------------

    const dropdown = d3.select("#expenditureCountrySelect");


    dropdown
        .selectAll("option")
        .data(countries)
        .enter()
        .append("option")

        .attr("value", function(d) {
            return d;
        })

        .text(function(d) {
            return d;
        });


    // --------------------------------------------------
    // CREATE FINANCING SCHEME DROPDOWN
    // --------------------------------------------------

    const schemeDropdown = d3.select("#financingSchemeSelect");


    schemeDropdown
        .selectAll("option")
        .data(financingSchemes)
        .enter()
        .append("option")

        .attr("value", function(d) {
            return d;
        })

        .text(function(d) {
            return d;
        });


    // --------------------------------------------------
    // SET DEFAULT COUNTRY
    // --------------------------------------------------

    let defaultCountry;


    if (countries.includes("Australia")) {

        defaultCountry = "Australia";

    } else {

        defaultCountry = countries[0];

    }


    dropdown.property(
        "value",
        defaultCountry
    );


    // --------------------------------------------------
    // SET DEFAULT FINANCING SCHEME
    // --------------------------------------------------

    const defaultScheme = "Total";


    schemeDropdown.property(
        "value",
        defaultScheme
    );


    // --------------------------------------------------
    // CHART DIMENSIONS
    // --------------------------------------------------

    const margin = {

        top: 60,

        right: 40,

        bottom: 70,

        left: 80

    };


    const width = 950;

    const height = 520;


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
        .select("#expenditureChart")

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
    // CREATE X SCALE
    // --------------------------------------------------

    const xScale = d3
        .scaleLinear()

        .range([
            0,
            innerWidth
        ]);


    // --------------------------------------------------
    // CREATE Y SCALE
    // --------------------------------------------------

    const yScale = d3
        .scaleLinear()

        .range([
            innerHeight,
            0
        ]);


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
            innerHeight + 55
        )

        .attr(
            "text-anchor",
            "middle"
        )

        .text("Year");


    // --------------------------------------------------
    // Y AXIS LABEL
    // --------------------------------------------------

    chartArea
        .append("text")

        .attr(
            "class",
            "axis-label"
        )

        .attr(
            "transform",
            "rotate(-90)"
        )

        .attr(
            "x",
            -innerHeight / 2
        )

        .attr(
            "y",
            -55
        )

        .attr(
            "text-anchor",
            "middle"
        )

        .text(
            "Health Expenditure (% of GDP)"
        );


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
    // D3 LINE GENERATOR
    // --------------------------------------------------

    const line = d3
        .line()

        .x(function(d) {

            return xScale(
                d.year
            );

        })

        .y(function(d) {

            return yScale(
                d.value
            );

        });


    // --------------------------------------------------
    // CREATE LINE PATH
    // --------------------------------------------------

    const path = chartArea
        .append("path")

        .attr(
            "fill",
            "none"
        )

        .attr(
            "stroke",
            "seagreen"
        )

        .attr(
            "stroke-width",
            3
        );


    // --------------------------------------------------
    // UPDATE CHART FUNCTION
    // Exposed for integration: called whenever the shared
    // country selector or the financing scheme selector changes
    // --------------------------------------------------

    function updateExpenditureChart(country, scheme) {


        // Filter data for selected country and financing scheme,
        // restricted to Percentage of GDP so the axis stays on one scale
        const filteredData = data

            .filter(function(d) {

                return (
                    d.country === country
                    && d.financing_scheme === scheme
                    && d.unit === "Percentage of GDP"
                );

            })

            .sort(function(a, b) {

                return d3.ascending(
                    a.year,
                    b.year
                );

            });


        console.log(
            "Selected Country:",
            country
        );

        console.log(
            "Selected Financing Scheme:",
            scheme
        );

        console.log(
            "Filtered Data:",
            filteredData
        );


        // --------------------------------------------------
        // X SCALE DOMAIN
        // --------------------------------------------------

        xScale.domain(

            d3.extent(
                filteredData,
                function(d) {

                    return d.year;

                }
            )

        );


        // --------------------------------------------------
        // Y SCALE DOMAIN
        // --------------------------------------------------

        const minimumValue =
            d3.min(
                filteredData,
                function(d) {

                    return d.value;

                }
            );


        const maximumValue =
            d3.max(
                filteredData,
                function(d) {

                    return d.value;

                }
            );


        yScale.domain([

            0,

            maximumValue + 1

        ]);


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

                .ticks(
                    filteredData.length
                )

                .tickFormat(
                    d3.format("d")
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
        // UPDATE LINE
        // --------------------------------------------------

        path

            .datum(
                filteredData
            )

            .transition()

            .duration(750)

            .attr(
                "d",
                line
            );


        // --------------------------------------------------
        // UPDATE DATA POINTS
        // --------------------------------------------------

        const circles = chartArea

            .selectAll(
                ".data-point"
            )

            .data(
                filteredData,
                function(d) {

                    return d.year;

                }
            );


        circles.join(


            // ENTER
            function(enter) {

                return enter

                    .append("circle")

                    .attr(
                        "class",
                        "data-point"
                    )

                    .attr(
                        "cx",
                        function(d) {

                            return xScale(
                                d.year
                            );

                        }
                    )

                    .attr(
                        "cy",
                        function(d) {

                            return yScale(
                                d.value
                            );

                        }
                    )

                    .attr(
                        "r",
                        0
                    )

                    .attr(
                        "fill",
                        "seagreen"
                    )

                    .call(
                        function(enter) {

                            enter

                                .transition()

                                .duration(500)

                                .attr(
                                    "r",
                                    5
                                );

                        }
                    );

            },


            // UPDATE
            function(update) {

                return update

                    .call(
                        function(update) {

                            update

                                .transition()

                                .duration(500)

                                .attr(
                                    "cx",
                                    function(d) {

                                        return xScale(
                                            d.year
                                        );

                                    }
                                )

                                .attr(
                                    "cy",
                                    function(d) {

                                        return yScale(
                                            d.value
                                        );

                                    }
                                );

                        }
                    );

            },


            // EXIT
            function(exit) {

                return exit

                    .transition()

                    .duration(300)

                    .attr(
                        "r",
                        0
                    )

                    .remove();

            }

        );


        // --------------------------------------------------
        // UPDATE CHART TITLE
        // --------------------------------------------------

        chartTitle.text(

            country
            + " Health Expenditure — "
            + scheme
            + " (% of GDP)"

        );

    }


    // --------------------------------------------------
    // DRAW INITIAL CHART
    // --------------------------------------------------

    updateExpenditureChart(
        defaultCountry,
        defaultScheme
    );


    // --------------------------------------------------
    // DROPDOWN EVENT LISTENERS
    // --------------------------------------------------

    dropdown.on(
        "change",
        function() {


            const selectedCountry =
                d3.select(this)
                    .property(
                        "value"
                    );

            const selectedScheme =
                schemeDropdown
                    .property(
                        "value"
                    );


            updateExpenditureChart(
                selectedCountry,
                selectedScheme
            );

        }
    );


    schemeDropdown.on(
        "change",
        function() {


            const selectedScheme =
                d3.select(this)
                    .property(
                        "value"
                    );

            const selectedCountry =
                dropdown
                    .property(
                        "value"
                    );


            updateExpenditureChart(
                selectedCountry,
                selectedScheme
            );

        }
    );


    // --------------------------------------------------
    // INTEGRATION HOOK
    // Exposes an update function on window so main.js /
    // a shared country selector can drive this chart too,
    // per the team's shared-controls integration plan.
    // --------------------------------------------------

    window.updateExpenditure = function(country) {

        const currentScheme =
            schemeDropdown
                .property(
                    "value"
                );

        dropdown.property(
            "value",
            country
        );

        updateExpenditureChart(
            country,
            currentScheme
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


    d3.select("#expenditureStatus")
        .text(
            "Error loading the dataset."
        );

});
