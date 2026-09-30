// ======================================================
// RISK FACTORS COMPARISON
// COS30045 Data Visualisation
// ======================================================


// ------------------------------------------------------
// LOAD DATA
// ------------------------------------------------------
//
// Risk-factor reporting is irregular.
// Therefore, this chart uses the latest available
// observation for each country rather than assuming
// every country has data for the same year.
//
// Health Expenditure is loaded only to identify
// the 14 common/core project countries.
//
// ------------------------------------------------------

Promise.all([

    d3.csv(
        "Data/Processed/risk_factors_clean.csv",
        d3.autoType
    ),

    d3.csv(
        "Data/Processed/health_expenditure_clean.csv",
        d3.autoType
    )

])
.then(function([riskData, expenditureData]) {


    console.log(
        "Risk Factors dataset loaded successfully."
    );

    console.log(
        "Risk Factor records:",
        riskData.length
    );


    // --------------------------------------------------
    // GET CORE 14 COUNTRIES
    // --------------------------------------------------

    const coreCountryCodes =
        new Set(
            expenditureData.map(
                function(d) {

                    return d.country_code;

                }
            )
        );


    // Keep only project core countries

    const data =
        riskData.filter(
            function(d) {

                return coreCountryCodes.has(
                    d.country_code
                );

            }
        );


    console.log(
        "Risk-factor records for core countries:",
        data.length
    );


    // --------------------------------------------------
    // GET INDICATORS
    // --------------------------------------------------

    const indicators =
        Array.from(
            new Set(
                data.map(
                    function(d) {

                        return d.indicator;

                    }
                )
            )
        )
        .sort();


    console.log(
        "Risk indicators:",
        indicators
    );


    // --------------------------------------------------
    // POPULATE DROPDOWN
    // --------------------------------------------------

    const indicatorDropdown =
        d3.select(
            "#riskIndicator"
        );


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


    const smokingIndicator =
        "Share of population who are daily smokers";


    if (
        indicators.includes(
            smokingIndicator
        )
    ) {

        defaultIndicator =
            smokingIndicator;

    } else {

        defaultIndicator =
            indicators[0];

    }


    indicatorDropdown
        .property(
            "value",
            defaultIndicator
        );



    // ==================================================
    // CHART DIMENSIONS
    // ==================================================

    const margin = {

        top: 80,

        right: 130,

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
            "#riskChart"
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
    // MAIN CHART GROUP
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
            "risk-axis-label"
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
            "risk-title"
        )

        .attr(
            "x",
            innerWidth / 2
        )

        .attr(
            "y",
            -40
        )

        .attr(
            "text-anchor",
            "middle"
        );



    // --------------------------------------------------
    // SUBTITLE
    // --------------------------------------------------

    const chartSubtitle =
        chartArea

        .append("text")

        .attr(
            "x",
            innerWidth / 2
        )

        .attr(
            "y",
            -15
        )

        .attr(
            "text-anchor",
            "middle"
        )

        .attr(
            "font-size",
            12
        )

        .attr(
            "fill",
            "#666"
        )

        .text(
            "Latest available observation for each country"
        );



    // ==================================================
    // UPDATE FUNCTION
    // ==================================================

    function updateRiskChart(
        selectedIndicator
    ) {


        console.log(
            "Selected risk indicator:",
            selectedIndicator
        );


        // --------------------------------------------------
        // FILTER TO SELECTED INDICATOR
        // --------------------------------------------------

        const indicatorData =
            data.filter(
                function(d) {

                    return (
                        d.indicator
                        ===
                        selectedIndicator
                    );

                }
            );



        // --------------------------------------------------
        // GET LATEST OBSERVATION PER COUNTRY
        // --------------------------------------------------

        const latestByCountry =
            Array.from(

                d3.group(
                    indicatorData,
                    function(d) {

                        return d.country_code;

                    }
                ),

                function([countryCode, values]) {


                    values.sort(
                        function(a, b) {

                            return d3.descending(
                                a.year,
                                b.year
                            );

                        }
                    );


                    return values[0];

                }

            );



        // --------------------------------------------------
        // SORT HIGHEST TO LOWEST
        // --------------------------------------------------

        latestByCountry.sort(
            function(a, b) {

                return d3.descending(
                    a.value,
                    b.value
                );

            }
        );


        console.log(
            "Latest risk data:",
            latestByCountry
        );



        // --------------------------------------------------
        // STATUS MESSAGE
        // --------------------------------------------------

        d3.select(
            "#riskStatus"
        )

        .text(
            "Showing latest available observations for "
            + latestByCountry.length
            + " core OECD countries."
        );



        // --------------------------------------------------
        // HANDLE NO DATA
        // --------------------------------------------------

        if (
            latestByCountry.length === 0
        ) {

            d3.select(
                "#riskStatus"
            )

            .text(
                "No data available for this risk indicator."
            );

            return;

        }



        // --------------------------------------------------
        // UPDATE SCALES
        // --------------------------------------------------

        const maxValue =
            d3.max(
                latestByCountry,
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


        yScale
            .domain(

                latestByCountry.map(
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
        // UPDATE TITLE / UNIT
        // --------------------------------------------------

        chartTitle.text(
            selectedIndicator
        );


        const unit =
            latestByCountry[0].unit;


        xAxisLabel.text(
            unit
        );



        // ==================================================
        // BARS
        // ==================================================

        const bars =
            chartArea

            .selectAll(
                ".risk-bar"
            )

            .data(
                latestByCountry,
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
                        "risk-bar"
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

                                + "<br>Latest year: "
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
                    // ENTER ANIMATION
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
                ".risk-value"
            )

            .data(
                latestByCountry,
                function(d) {

                    return d.country_code;

                }
            );



        labels.join(


            function(enter) {

                return enter

                    .append("text")

                    .attr(
                        "class",
                        "risk-value"
                    )

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
                    );

            },


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


            function(exit) {

                return exit.remove();

            }

        );



        // ==================================================
        // YEAR LABELS
        // ==================================================

        const yearLabels =
            chartArea

            .selectAll(
                ".risk-year"
            )

            .data(
                latestByCountry,
                function(d) {

                    return d.country_code;

                }
            );



        yearLabels.join(


            function(enter) {

                return enter

                    .append("text")

                    .attr(
                        "class",
                        "risk-year"
                    )

                    .attr(
                        "x",
                        function(d) {

                            return (
                                xScale(
                                    d.value
                                )
                                + 45
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

                                yScale.bandwidth()
                                / 2

                                + 4
                            );

                        }
                    )

                    .text(
                        function(d) {

                            return "("
                                + d.year
                                + ")";

                        }
                    );

            },


            function(update) {

                return update

                    .text(
                        function(d) {

                            return "("
                                + d.year
                                + ")";

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
                                            + 45
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


            function(exit) {

                return exit.remove();

            }

        );

    }



    // ==================================================
    // INITIAL CHART
    // ==================================================

    updateRiskChart(
        defaultIndicator
    );



    // ==================================================
    // DROPDOWN EVENT
    // ==================================================

    indicatorDropdown.on(
        "change",
        function() {


            const selectedIndicator =
                d3.select(this)
                    .property(
                        "value"
                    );


            updateRiskChart(
                selectedIndicator
            );

        }
    );


})
.catch(function(error) {


    console.error(
        "Error loading risk-factor data:",
        error
    );


    d3.select(
        "#riskStatus"
    )

    .text(
        "Error loading risk-factor dataset."
    );

});