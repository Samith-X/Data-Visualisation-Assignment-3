// ======================================================
// PREVENTIVE HEALTHCARE COMPARISON
// COS30045 Data Visualisation
// ======================================================


// ------------------------------------------------------
// LOAD DATA
// ------------------------------------------------------
//
// We load:
// 1. Healthcare Prevention dataset
// 2. Health Expenditure dataset
//
// The expenditure dataset is used only to identify
// the 14 common/core countries used by the project.
//
// ------------------------------------------------------

Promise.all([

    d3.csv(
        "Data/Processed/healthcare_prevention_clean.csv",
        d3.autoType
    ),

    d3.csv(
        "Data/Processed/health_expenditure_clean.csv",
        d3.autoType
    )

])
.then(function([preventionData, expenditureData]) {


    console.log(
        "Prevention dataset loaded successfully."
    );

    console.log(
        "Number of prevention records:",
        preventionData.length
    );

    console.log(
        preventionData.slice(0, 5)
    );


    // --------------------------------------------------
    // FIND THE 14 CORE COUNTRIES
    // --------------------------------------------------

    const coreCountryCodes =
        new Set(
            expenditureData.map(function(d) {
                return d.country_code;
            })
        );


    console.log(
        "Core countries:",
        coreCountryCodes
    );


    // Only keep prevention records
    // belonging to our core comparison countries.

    const data =
        preventionData.filter(function(d) {

            return coreCountryCodes.has(
                d.country_code
            );

        });


    console.log(
        "Prevention records for core countries:",
        data.length
    );


    // --------------------------------------------------
    // STATUS MESSAGE
    // --------------------------------------------------

    d3.select("#preventionStatus")
        .text(
            "Prevention dataset loaded successfully. "
            + data.length
            + " records available for the core OECD countries."
        );


    // --------------------------------------------------
    // GET INDICATORS
    // --------------------------------------------------

    const indicators =
        Array.from(
            new Set(
                data.map(function(d) {
                    return d.indicator;
                })
            )
        )
        .sort();


    console.log(
        "Prevention indicators:",
        indicators
    );


    // --------------------------------------------------
    // INDICATOR DROPDOWN
    // --------------------------------------------------

    const indicatorDropdown =
        d3.select("#preventionIndicator");


    indicatorDropdown
        .selectAll("option")

        .data(indicators)

        .enter()

        .append("option")

        .attr(
            "value",
            function(d) {
                return d;
            }
        )

        .text(
            function(d) {
                return d;
            }
        );


    // --------------------------------------------------
    // DEFAULT INDICATOR
    // --------------------------------------------------

    let defaultIndicator;


    if (
        indicators.includes("Measles")
    ) {

        defaultIndicator =
            "Measles";

    } else {

        defaultIndicator =
            indicators[0];

    }


    indicatorDropdown
        .property(
            "value",
            defaultIndicator
        );


    // --------------------------------------------------
    // YEAR DROPDOWN
    // --------------------------------------------------

    const yearDropdown =
        d3.select("#preventionYear");


    function updateYearDropdown(
        selectedIndicator
    ) {


        // Get years available for
        // the selected indicator

        const years =
            Array.from(
                new Set(

                    data

                        .filter(
                            function(d) {

                                return (
                                    d.indicator
                                    ===
                                    selectedIndicator
                                );

                            }
                        )

                        .map(
                            function(d) {

                                return d.year;

                            }
                        )

                )
            )

            .sort(
                function(a, b) {

                    return d3.descending(
                        a,
                        b
                    );

                }
            );


        // Remove previous options

        yearDropdown
            .selectAll("option")
            .remove();


        // Add new options

        yearDropdown
            .selectAll("option")

            .data(years)

            .enter()

            .append("option")

            .attr(
                "value",
                function(d) {

                    return d;

                }
            )

            .text(
                function(d) {

                    return d;

                }
            );


        // Use latest year by default

        const latestYear =
            years[0];


        yearDropdown
            .property(
                "value",
                latestYear
            );


        return latestYear;

    }



    // Initial year

    let selectedYear =
        updateYearDropdown(
            defaultIndicator
        );



    // ==================================================
    // CHART SETUP
    // ==================================================


    const margin = {

        top: 70,

        right: 100,

        bottom: 70,

        left: 180

    };


    const width = 950;

    const height = 650;


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

    const svg =
        d3.select(
            "#preventionChart"
        )

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
    // MAIN CHART AREA
    // --------------------------------------------------

    const chartArea =
        svg.append("g")

        .attr(
            "transform",
            `translate(
                ${margin.left},
                ${margin.top}
            )`
        );



    // --------------------------------------------------
    // SCALES
    // --------------------------------------------------

    const xScale =
        d3.scaleLinear()

        .range([
            0,
            innerWidth
        ]);


    const yScale =
        d3.scaleBand()

        .range([
            0,
            innerHeight
        ])

        .padding(0.2);



    // --------------------------------------------------
    // AXIS GROUPS
    // --------------------------------------------------

    const xAxisGroup =
        chartArea
            .append("g")

            .attr(
                "transform",
                `translate(
                    0,
                    ${innerHeight}
                )`
            );


    const yAxisGroup =
        chartArea
            .append("g");



    // --------------------------------------------------
    // X AXIS LABEL
    // --------------------------------------------------

    const xAxisLabel =
        chartArea

        .append("text")

        .attr(
            "class",
            "prevention-axis-label"
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
        );



    // --------------------------------------------------
    // CHART TITLE
    // --------------------------------------------------

    const chartTitle =
        chartArea

        .append("text")

        .attr(
            "class",
            "prevention-title"
        )

        .attr(
            "x",
            innerWidth / 2
        )

        .attr(
            "y",
            -35
        )

        .attr(
            "text-anchor",
            "middle"
        );



    // ==================================================
    // UPDATE CHART FUNCTION
    // ==================================================

    function updatePreventionChart(
        selectedIndicator,
        year
    ) {


        console.log(
            "Selected prevention indicator:",
            selectedIndicator
        );


        console.log(
            "Selected year:",
            year
        );


        // --------------------------------------------------
        // FILTER DATA
        // --------------------------------------------------

        let filteredData =
            data.filter(
                function(d) {

                    return (

                        d.indicator
                        ===
                        selectedIndicator

                        &&

                        d.year
                        ===
                        year

                    );

                }
            );



        // --------------------------------------------------
        // HANDLE POSSIBLE DUPLICATES
        // --------------------------------------------------
        //
        // If the same country has more than one row
        // for the same indicator/year, use the mean
        // rather than drawing duplicate bars.
        //
        // --------------------------------------------------

        filteredData =
            Array.from(

                d3.rollup(

                    filteredData,

                    function(values) {

                        return {

                            country_code:
                                values[0]
                                    .country_code,

                            country:
                                values[0]
                                    .country,

                            indicator:
                                values[0]
                                    .indicator,

                            unit:
                                values[0]
                                    .unit,

                            year:
                                values[0]
                                    .year,

                            value:
                                d3.mean(
                                    values,
                                    function(d) {
                                        return d.value;
                                    }
                                )

                        };

                    },

                    function(d) {
                        return d.country_code;
                    }

                ).values()

            );



        // --------------------------------------------------
        // SORT HIGHEST TO LOWEST
        // --------------------------------------------------

        filteredData.sort(
            function(a, b) {

                return d3.descending(
                    a.value,
                    b.value
                );

            }
        );


        console.log(
            "Filtered prevention data:",
            filteredData
        );



        // --------------------------------------------------
        // HANDLE NO DATA
        // --------------------------------------------------

        if (
            filteredData.length === 0
        ) {

            d3.select(
                "#preventionStatus"
            )
            .text(
                "No data available for this indicator and year."
            );

            return;

        }


        d3.select(
            "#preventionStatus"
        )
        .text(
            "Showing "
            + filteredData.length
            + " countries for "
            + selectedIndicator
            + " in "
            + year
            + "."
        );



        // --------------------------------------------------
        // UPDATE X SCALE
        // --------------------------------------------------

        const maxValue =
            d3.max(
                filteredData,
                function(d) {

                    return d.value;

                }
            );


        xScale
            .domain([
                0,
                maxValue
            ])

            .nice();



        // --------------------------------------------------
        // UPDATE Y SCALE
        // --------------------------------------------------

        yScale
            .domain(

                filteredData.map(
                    function(d) {

                        return d.country;

                    }
                )

            );



        // --------------------------------------------------
        // UPDATE AXES
        // --------------------------------------------------

        xAxisGroup

            .transition()

            .duration(600)

            .call(
                d3.axisBottom(
                    xScale
                )
            );


        yAxisGroup

            .transition()

            .duration(600)

            .call(
                d3.axisLeft(
                    yScale
                )
            );



        // --------------------------------------------------
        // UPDATE AXIS LABEL
        // --------------------------------------------------

        const unit =
            filteredData[0].unit;


        xAxisLabel.text(
            unit
        );



        // --------------------------------------------------
        // UPDATE TITLE
        // --------------------------------------------------

        chartTitle.text(
            selectedIndicator
            + " — "
            + year
        );



        // ==================================================
        // BARS
        // ==================================================

        const bars =
            chartArea

            .selectAll(
                ".prevention-bar"
            )

            .data(
                filteredData,
                function(d) {

                    return d.country_code;

                }
            );



        bars.join(


            // ----------------------------------------------
            // ENTER
            // ----------------------------------------------

            function(enter) {

                return enter

                    .append("rect")

                    .attr(
                        "class",
                        "prevention-bar"
                    )

                    .attr(
                        "x",
                        0
                    )

                    .attr(
                        "y",
                        function(d) {

                            return yScale(
                                d.country
                            );

                        }
                    )

                    .attr(
                        "height",
                        yScale.bandwidth()
                    )

                    .attr(
                        "width",
                        0
                    )

                    .attr(
                        "fill",
                        function(d) {

                            if (
                                d.country
                                ===
                                "Australia"
                            ) {

                                return "darkorange";

                            }

                            return "steelblue";

                        }
                    )


                    // --------------------------------------
                    // TOOLTIP
                    // --------------------------------------

                    .on(
                        "mouseover",
                        function(event, d) {


                            d3.select(this)

                                .attr(
                                    "opacity",
                                    0.75
                                );


                            d3.select(
                                "#tooltip"
                            )

                            .style(
                                "opacity",
                                1
                            )

                            .html(

                                "<strong>"
                                + d.country
                                + "</strong>"

                                + "<br>"

                                + d.indicator

                                + "<br>Year: "
                                + d.year

                                + "<br>Value: "
                                + d.value.toFixed(1)

                                + "<br>"
                                + d.unit

                            );

                        }
                    )


                    .on(
                        "mousemove",
                        function(event) {

                            d3.select(
                                "#tooltip"
                            )

                            .style(
                                "left",
                                (
                                    event.pageX
                                    + 15
                                )
                                + "px"
                            )

                            .style(
                                "top",
                                (
                                    event.pageY
                                    - 25
                                )
                                + "px"
                            );

                        }
                    )


                    .on(
                        "mouseout",
                        function() {


                            d3.select(this)

                                .attr(
                                    "opacity",
                                    1
                                );


                            d3.select(
                                "#tooltip"
                            )

                            .style(
                                "opacity",
                                0
                            );

                        }
                    )


                    // --------------------------------------
                    // ANIMATION
                    // --------------------------------------

                    .call(
                        function(enter) {

                            enter

                                .transition()

                                .duration(700)

                                .attr(
                                    "width",
                                    function(d) {

                                        return xScale(
                                            d.value
                                        );

                                    }
                                );

                        }
                    );

            },



            // ----------------------------------------------
            // UPDATE
            // ----------------------------------------------

            function(update) {

                return update

                    .attr(
                        "fill",
                        function(d) {

                            if (
                                d.country
                                ===
                                "Australia"
                            ) {

                                return "darkorange";

                            }

                            return "steelblue";

                        }
                    )

                    .call(
                        function(update) {

                            update

                                .transition()

                                .duration(700)

                                .attr(
                                    "y",
                                    function(d) {

                                        return yScale(
                                            d.country
                                        );

                                    }
                                )

                                .attr(
                                    "height",
                                    yScale.bandwidth()
                                )

                                .attr(
                                    "width",
                                    function(d) {

                                        return xScale(
                                            d.value
                                        );

                                    }
                                );

                        }
                    );

            },



            // ----------------------------------------------
            // EXIT
            // ----------------------------------------------

            function(exit) {

                return exit

                    .transition()

                    .duration(400)

                    .attr(
                        "width",
                        0
                    )

                    .remove();

            }

        );



        // ==================================================
        // VALUE LABELS
        // ==================================================

        const labels =
            chartArea

            .selectAll(
                ".prevention-value"
            )

            .data(
                filteredData,
                function(d) {

                    return d.country_code;

                }
            );



        labels.join(


            // ENTER

            function(enter) {

                return enter

                    .append("text")

                    .attr(
                        "class",
                        "prevention-value"
                    )

                    .attr(
                        "x",
                        5
                    )

                    .attr(
                        "y",
                        function(d) {

                            return (
                                yScale(
                                    d.country
                                )

                                +

                                yScale.bandwidth()
                                / 2

                                + 4
                            );

                        }
                    )

                    .text(
                        function(d) {

                            return d.value
                                .toFixed(1);

                        }
                    )

                    .call(
                        function(enter) {

                            enter

                                .transition()

                                .duration(700)

                                .attr(
                                    "x",
                                    function(d) {

                                        return (
                                            xScale(
                                                d.value
                                            )
                                            + 6
                                        );

                                    }
                                );

                        }
                    );

            },


            // UPDATE

            function(update) {

                return update

                    .text(
                        function(d) {

                            return d.value
                                .toFixed(1);

                        }
                    )

                    .call(
                        function(update) {

                            update

                                .transition()

                                .duration(700)

                                .attr(
                                    "x",
                                    function(d) {

                                        return (
                                            xScale(
                                                d.value
                                            )
                                            + 6
                                        );

                                    }
                                )

                                .attr(
                                    "y",
                                    function(d) {

                                        return (
                                            yScale(
                                                d.country
                                            )

                                            +

                                            yScale
                                                .bandwidth()
                                            / 2

                                            + 4
                                        );

                                    }
                                );

                        }
                    );

            },


            // EXIT

            function(exit) {

                return exit

                    .remove();

            }

        );

    }



    // ==================================================
    // INITIAL CHART
    // ==================================================

    updatePreventionChart(
        defaultIndicator,
        selectedYear
    );



    // ==================================================
    // INDICATOR EVENT
    // ==================================================

    indicatorDropdown.on(
        "change",
        function() {


            const selectedIndicator =
                d3.select(this)
                    .property(
                        "value"
                    );


            selectedYear =
                updateYearDropdown(
                    selectedIndicator
                );


            updatePreventionChart(
                selectedIndicator,
                selectedYear
            );

        }
    );



    // ==================================================
    // YEAR EVENT
    // ==================================================

    yearDropdown.on(
        "change",
        function() {


            const selectedIndicator =
                indicatorDropdown
                    .property(
                        "value"
                    );


            const selectedYear =
                +d3.select(this)
                    .property(
                        "value"
                    );


            updatePreventionChart(
                selectedIndicator,
                selectedYear
            );

        }
    );


})
.catch(function(error) {


    console.error(
        "Error loading prevention data:",
        error
    );


    d3.select(
        "#preventionStatus"
    )
    .text(
        "Error loading prevention dataset."
    );

});