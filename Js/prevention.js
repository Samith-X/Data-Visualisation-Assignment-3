// --------------------------------------------------
// Prevention & Risk Factors Visualisation
// D3 v7
//
// Required HTML:
// <div id="preventionChart"></div>
// --------------------------------------------------

Promise.all([
    d3.csv("Data/Processed/risk_factors_clean.csv", d3.autoType),
    d3.csv("Data/Processed/healthcare_prevention_clean.csv", d3.autoType)
])
.then(function ([riskData, preventionData]) {

    console.log("Risk factors loaded:", riskData.length);
    console.log("Healthcare prevention loaded:", preventionData.length);

    // -----------------------------------------------
    // PREPARE DATA
    // -----------------------------------------------

    riskData.forEach(function (d) {
        d.dataset = "Risk factors";
    });

    preventionData.forEach(function (d) {
        d.dataset = "Healthcare prevention";
    });

    const allData = riskData
        .concat(preventionData)
        .filter(function (d) {
            return d.country &&
                d.indicator &&
                Number.isFinite(+d.year) &&
                Number.isFinite(+d.value);
        });


    // -----------------------------------------------
    // FIND CHART CONTAINER
    // -----------------------------------------------

    const container = d3.select("#preventionChart");

    if (container.empty()) {
        console.error(
            'Could not find <div id="preventionChart"></div>'
        );

        return;
    }

    container.selectAll("*").remove();


    // -----------------------------------------------
    // CONTROLS
    // -----------------------------------------------

    const controls = container
        .append("div")
        .attr("class", "prevention-controls");


    // Dataset selector

    controls
        .append("label")
        .attr("for", "preventionDatasetSelect")
        .text("Dataset: ");

    const datasetSelect = controls
        .append("select")
        .attr("id", "preventionDatasetSelect");

    datasetSelect
        .selectAll("option")
        .data([
            "Risk factors",
            "Healthcare prevention"
        ])
        .enter()
        .append("option")
        .attr("value", function (d) {
            return d;
        })
        .text(function (d) {
            return d;
        });


    controls.append("span").text("  ");


    // Indicator selector

    controls
        .append("label")
        .attr("for", "preventionIndicatorSelect")
        .text("Indicator: ");

    const indicatorSelect = controls
        .append("select")
        .attr("id", "preventionIndicatorSelect");


    controls.append("span").text("  ");


    // Year selector

    controls
        .append("label")
        .attr("for", "preventionYearSelect")
        .text("Year: ");

    const yearSelect = controls
        .append("select")
        .attr("id", "preventionYearSelect");


    // Status text

    container
        .append("p")
        .attr("id", "preventionStatus")
        .text(
            "Datasets loaded successfully: " +
            allData.length +
            " records."
        );


    // -----------------------------------------------
    // CHART DIMENSIONS
    // -----------------------------------------------

    const margin = {
        top: 75,
        right: 70,
        bottom: 65,
        left: 190
    };

    const width = 950;
    const height = 560;

    const innerWidth =
        width - margin.left - margin.right;

    const innerHeight =
        height - margin.top - margin.bottom;


    // -----------------------------------------------
    // SVG
    // -----------------------------------------------

    const svg = container
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr(
            "viewBox",
            "0 0 " + width + " " + height
        )
        .style("max-width", "100%")
        .style("height", "auto");


    const chartArea = svg
        .append("g")
        .attr(
            "transform",
            "translate(" +
            margin.left +
            "," +
            margin.top +
            ")"
        );


    // -----------------------------------------------
    // SCALES
    // -----------------------------------------------

    const xScale = d3
        .scaleLinear()
        .range([0, innerWidth]);


    const yScale = d3
        .scaleBand()
        .range([0, innerHeight])
        .padding(0.18);


    // -----------------------------------------------
    // AXES
    // -----------------------------------------------

    const xAxisGroup = chartArea
        .append("g")
        .attr(
            "transform",
            "translate(0," +
            innerHeight +
            ")"
        );


    const yAxisGroup = chartArea
        .append("g");


    // Gridlines

    const gridGroup = chartArea
        .append("g")
        .attr("class", "grid");


    // -----------------------------------------------
    // TITLE
    // -----------------------------------------------

    const title = svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", 28)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("font-weight", "bold");


    const subtitle = svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", 51)
        .attr("text-anchor", "middle")
        .style("font-size", "13px");


    // X-axis label

    const xAxisLabel = svg
        .append("text")
        .attr(
            "x",
            margin.left +
            innerWidth / 2
        )
        .attr("y", height - 12)
        .attr("text-anchor", "middle")
        .style("font-size", "14px");


    // -----------------------------------------------
    // TOOLTIP
    // -----------------------------------------------

    const tooltip = d3
        .select("body")
        .append("div")
        .attr(
            "class",
            "prevention-tooltip"
        )
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "white")
        .style(
            "border",
            "1px solid #999"
        )
        .style(
            "border-radius",
            "4px"
        )
        .style(
            "padding",
            "8px 10px"
        )
        .style(
            "font-size",
            "13px"
        )
        .style(
            "pointer-events",
            "none"
        )
        .style(
            "box-shadow",
            "0 2px 6px rgba(0,0,0,0.15)"
        );


    // -----------------------------------------------
    // GET CURRENT DATASET
    // -----------------------------------------------

    function getDatasetRows() {

        const selectedDataset =
            datasetSelect.property("value");

        return allData.filter(
            function (d) {

                return d.dataset ===
                    selectedDataset;

            }
        );
    }


    // -----------------------------------------------
    // UPDATE INDICATORS
    // -----------------------------------------------

    function updateIndicatorOptions() {

        const rows =
            getDatasetRows();


        const indicators =
            Array.from(
                new Set(
                    rows.map(
                        function (d) {
                            return d.indicator;
                        }
                    )
                )
            ).sort();


        indicatorSelect
            .selectAll("option")
            .remove();


        indicatorSelect
            .selectAll("option")
            .data(indicators)
            .enter()
            .append("option")
            .attr(
                "value",
                function (d) {
                    return d;
                }
            )
            .text(
                function (d) {
                    return d;
                }
            );


        // Try to start with a useful
        // risk factor automatically

        const preferredIndicators = [
            "smoking",
            "obesity",
            "overweight",
            "alcohol"
        ];


        let defaultIndicator =
            indicators[0];


        if (
            datasetSelect.property("value") ===
            "Risk factors"
        ) {

            for (
                const preferred
                of preferredIndicators
            ) {

                const match =
                    indicators.find(
                        function (indicator) {

                            return indicator
                                .toLowerCase()
                                .includes(
                                    preferred
                                );

                        }
                    );


                if (match) {

                    defaultIndicator =
                        match;

                    break;
                }
            }
        }


        indicatorSelect.property(
            "value",
            defaultIndicator
        );


        updateYearOptions();
    }


    // -----------------------------------------------
    // UPDATE YEARS
    // -----------------------------------------------

    function updateYearOptions() {

        const indicator =
            indicatorSelect.property(
                "value"
            );


        const rows =
            getDatasetRows()
                .filter(
                    function (d) {

                        return d.indicator ===
                            indicator;

                    }
                );


        const years =
            Array.from(
                new Set(
                    rows.map(
                        function (d) {
                            return +d.year;
                        }
                    )
                )
            )
            .sort(
                function (a, b) {
                    return b - a;
                }
            );


        yearSelect
            .selectAll("option")
            .remove();


        yearSelect
            .selectAll("option")
            .data(years)
            .enter()
            .append("option")
            .attr(
                "value",
                function (d) {
                    return d;
                }
            )
            .text(
                function (d) {
                    return d;
                }
            );


        // Use latest available year

        if (years.length > 0) {

            yearSelect.property(
                "value",
                years[0]
            );
        }


        updateChart();
    }


    // -----------------------------------------------
    // UPDATE CHART
    // -----------------------------------------------

    function updateChart() {

        const selectedDataset =
            datasetSelect.property(
                "value"
            );


        const selectedIndicator =
            indicatorSelect.property(
                "value"
            );


        const selectedYear =
            +yearSelect.property(
                "value"
            );


        // Filter selected indicator/year

        let filtered =
            allData.filter(
                function (d) {

                    return (
                        d.dataset ===
                            selectedDataset &&

                        d.indicator ===
                            selectedIndicator &&

                        +d.year ===
                            selectedYear
                    );

                }
            );


        // -------------------------------------------
        // ONE VALUE PER COUNTRY
        // -------------------------------------------

        filtered =
            Array.from(

                d3.rollup(

                    filtered,

                    function (values) {

                        return {

                            country:
                                values[0]
                                    .country,

                            value:
                                d3.mean(
                                    values,
                                    function (d) {
                                        return +d.value;
                                    }
                                ),

                            unit:
                                values[0]
                                    .unit
                        };

                    },

                    function (d) {
                        return d.country;
                    }

                ).values()

            );


        // Highest value first

        filtered.sort(
            function (a, b) {

                return d3.descending(
                    a.value,
                    b.value
                );

            }
        );


        // -------------------------------------------
        // LIMIT NUMBER OF COUNTRIES
        // -------------------------------------------

        let displayData =
            filtered.slice(0, 15);


        // Always include Australia
        // if it exists in the data

        const australia =
            filtered.find(
                function (d) {

                    return (
                        d.country ===
                        "Australia"
                    );

                }
            );


        if (
            australia &&
            !displayData.some(
                function (d) {

                    return (
                        d.country ===
                        "Australia"
                    );

                }
            )
        ) {

            displayData.push(
                australia
            );
        }


        displayData.sort(
            function (a, b) {

                return d3.descending(
                    a.value,
                    b.value
                );

            }
        );


        // -------------------------------------------
        // NO DATA
        // -------------------------------------------

        if (
            displayData.length === 0
        ) {

            chartArea
                .selectAll(".bar")
                .remove();


            chartArea
                .selectAll(
                    ".value-label"
                )
                .remove();


            title.text(
                selectedIndicator ||
                "Prevention and Risk Factors"
            );


            subtitle.text(
                "No data available for the selected year."
            );


            return;
        }


        // -------------------------------------------
        // UNIT
        // -------------------------------------------

        const unit =
            displayData[0].unit || "";


        // -------------------------------------------
        // UPDATE SCALES
        // -------------------------------------------

        xScale.domain([
            0,

            d3.max(
                displayData,
                function (d) {
                    return d.value;
                }
            ) * 1.08
        ]);


        yScale.domain(
            displayData.map(
                function (d) {
                    return d.country;
                }
            )
        );


        // -------------------------------------------
        // UPDATE AXES
        // -------------------------------------------

        xAxisGroup
            .transition()
            .duration(600)
            .call(
                d3.axisBottom(
                    xScale
                )
                .ticks(7)
            );


        yAxisGroup
            .transition()
            .duration(600)
            .call(
                d3.axisLeft(
                    yScale
                )
            );


        // -------------------------------------------
        // GRIDLINES
        // -------------------------------------------

        gridGroup
            .attr(
                "transform",
                "translate(0," +
                innerHeight +
                ")"
            )
            .transition()
            .duration(600)
            .call(

                d3.axisBottom(
                    xScale
                )
                .ticks(7)
                .tickSize(
                    -innerHeight
                )
                .tickFormat("")

            );


        gridGroup
            .select(".domain")
            .remove();


        gridGroup
            .selectAll("line")
            .attr(
                "stroke-opacity",
                0.12
            );


        // -------------------------------------------
        // UPDATE TITLE
        // -------------------------------------------

        title.text(
            selectedIndicator
        );


        subtitle.text(
            selectedYear +
            " — Australia compared with OECD countries"
        );


        xAxisLabel.text(unit);


        // -------------------------------------------
        // BARS
        // -------------------------------------------

        const bars =
            chartArea
                .selectAll(".bar")
                .data(

                    displayData,

                    function (d) {
                        return d.country;
                    }

                );


        // Remove old bars

        bars.exit()
            .transition()
            .duration(400)
            .attr("width", 0)
            .remove();


        // Add new bars

        const barsEnter =
            bars.enter()
                .append("rect")
                .attr(
                    "class",
                    "bar"
                )
                .attr("x", 0)
                .attr(
                    "y",
                    function (d) {

                        return yScale(
                            d.country
                        );

                    }
                )
                .attr(
                    "height",
                    yScale.bandwidth()
                )
                .attr("width", 0)

                // Australia highlighted
                .attr(
                    "fill",
                    function (d) {

                        if (
                            d.country ===
                            "Australia"
                        ) {

                            return "#d95f02";

                        }

                        return "#4c78a8";
                    }
                )


                // -----------------------------------
                // TOOLTIP EVENTS
                // -----------------------------------

                .on(
                    "mouseover",
                    function (event, d) {

                        d3.select(this)
                            .attr(
                                "opacity",
                                0.75
                            );


                        tooltip
                            .style(
                                "visibility",
                                "visible"
                            )
                            .html(

                                "<strong>" +
                                d.country +
                                "</strong><br>" +

                                selectedIndicator +
                                "<br>" +

                                selectedYear +
                                ": <strong>" +

                                d3.format(
                                    ".2~f"
                                )(d.value) +

                                "</strong> " +
                                unit

                            );

                    }
                )


                .on(
                    "mousemove",
                    function (event) {

                        tooltip
                            .style(
                                "left",
                                (
                                    event.pageX +
                                    12
                                ) +
                                "px"
                            )
                            .style(
                                "top",
                                (
                                    event.pageY -
                                    28
                                ) +
                                "px"
                            );

                    }
                )


                .on(
                    "mouseout",
                    function () {

                        d3.select(this)
                            .attr(
                                "opacity",
                                1
                            );


                        tooltip
                            .style(
                                "visibility",
                                "hidden"
                            );

                    }
                );


        // Update bars

        barsEnter
            .merge(bars)
            .transition()
            .duration(600)

            .attr(
                "y",
                function (d) {

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
                function (d) {

                    return xScale(
                        d.value
                    );

                }
            )

            .attr(
                "fill",
                function (d) {

                    if (
                        d.country ===
                        "Australia"
                    ) {

                        return "#d95f02";

                    }

                    return "#4c78a8";
                }
            );


        // -------------------------------------------
        // VALUE LABELS
        // -------------------------------------------

        const labels =
            chartArea
                .selectAll(
                    ".value-label"
                )
                .data(

                    displayData,

                    function (d) {
                        return d.country;
                    }

                );


        labels.exit()
            .remove();


        labels
            .enter()
            .append("text")
            .attr(
                "class",
                "value-label"
            )
            .style(
                "font-size",
                "11px"
            )
            .attr(
                "dominant-baseline",
                "middle"
            )

            .merge(labels)

            .transition()
            .duration(600)

            .attr(
                "x",
                function (d) {

                    return (
                        xScale(
                            d.value
                        ) + 5
                    );

                }
            )

            .attr(
                "y",
                function (d) {

                    return (
                        yScale(
                            d.country
                        ) +

                        yScale.bandwidth()
                        / 2
                    );

                }
            )

            .text(
                function (d) {

                    return d3.format(
                        ".2~f"
                    )(d.value);

                }
            );


        console.log(
            "Selected:",
            selectedDataset,
            selectedIndicator,
            selectedYear
        );
    }


    // -----------------------------------------------
    // EVENTS
    // -----------------------------------------------

    datasetSelect.on(
        "change",
        function () {

            updateIndicatorOptions();

        }
    );


    indicatorSelect.on(
        "change",
        function () {

            updateYearOptions();

        }
    );


    yearSelect.on(
        "change",
        function () {

            updateChart();

        }
    );


    // -----------------------------------------------
    // INITIALISE
    // -----------------------------------------------

    datasetSelect.property(
        "value",
        "Risk factors"
    );


    updateIndicatorOptions();


    // -----------------------------------------------
    // SHARED DASHBOARD SUPPORT
    //
    // Later, when all visualisations are combined,
    // the group's shared country selector can call:
    //
    // updatePreventionCountry("Australia");
    //
    // -----------------------------------------------

    window.updatePreventionCountry =
        function (country) {

            chartArea
                .selectAll(".bar")
                .attr(
                    "fill",
                    function (d) {

                        if (
                            d.country ===
                            country
                        ) {

                            return "#d95f02";

                        }

                        return "#4c78a8";
                    }
                );

        };

})
.catch(function (error) {

    console.error(
        "Error loading prevention/risk factor data:",
        error
    );


    d3.select("#preventionChart")
        .append("p")
        .text(
            "Error loading prevention/risk-factor datasets. Check the CSV file paths."
        );

});