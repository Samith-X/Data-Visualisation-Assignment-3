(() => {
    "use strict";

    const PATHS = {
        life: "Data/Processed/life_expectancy_clean.csv",
        expenditure: "Data/Processed/health_expenditure_clean.csv",
        prevention: "Data/Processed/healthcare_prevention_clean.csv",
        risk: "Data/Processed/risk_factors_clean.csv"
    };

    const COLORS = {
        selected: "#f59e0b",
        blue: "#3d7fb1",
        teal: "#0f6b78",
        average: "#8a99a3",
        grid: "#e5edf2",
        gov: "#2a78d6",
        voluntary: "#eb6834",
        text: "#14212b",
        muted: "#667582"
    };

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const DURATION = prefersReducedMotion ? 0 : 550;

    const tooltip = d3.select("#tooltip");
    const fatalError = document.getElementById("fatalError");

    let datasets = null;
    let coreCodes = [];
    let coreCountries = [];

    const state = {
        country: "Australia",
        expenditureScheme: "Total",
        expenditureYear: null,
        preventionIndicator: "Measles",
        preventionYear: null,
        riskIndicator: "Share of population who are daily smokers"
    };

    Promise.all([
        d3.csv(PATHS.life, d3.autoType),
        d3.csv(PATHS.expenditure, d3.autoType),
        d3.csv(PATHS.prevention, d3.autoType),
        d3.csv(PATHS.risk, d3.autoType)
    ])
    .then(([life, expenditure, prevention, risk]) => {
        datasets = { life, expenditure, prevention, risk };

        coreCodes = getCoreCountryCodes(datasets);
        const expCountryMap = new Map(
            expenditure
                .filter(d => coreCodes.includes(d.country_code))
                .map(d => [d.country_code, d.country])
        );
        coreCountries = coreCodes
            .map(code => ({ code, country: expCountryMap.get(code) }))
            .filter(d => d.country)
            .sort((a, b) => d3.ascending(a.country, b.country));

        if (!coreCountries.some(d => d.country === state.country)) {
            state.country = coreCountries[0]?.country || "Australia";
        }

        initialiseControls();
        renderAll();
    })
    .catch(error => {
        console.error("Dashboard data load failed:", error);
        fatalError.hidden = false;
        fatalError.textContent = "The dashboard could not load one or more processed CSV files. Run the project through Live Server/Mercury and confirm the Data/Processed file paths are unchanged.";
    });

    function getCoreCountryCodes({ life, expenditure, prevention, risk }) {
        const sets = [life, expenditure, prevention, risk].map(data => new Set(data.map(d => d.country_code)));
        return [...sets[0]].filter(code => sets.slice(1).every(set => set.has(code))).sort();
    }

    function initialiseControls() {
        populateSelect("#globalCountrySelect", coreCountries.map(d => d.country), state.country);

        const expRows = datasets.expenditure.filter(d => coreCodes.includes(d.country_code) && d.unit === "Percentage of GDP");
        const schemes = [...new Set(expRows.map(d => d.financing_scheme))].sort((a, b) => {
            const order = ["Total", "Government/compulsory schemes", "Voluntary schemes/household out-of-pocket payments"];
            return order.indexOf(a) - order.indexOf(b);
        });
        if (!schemes.includes(state.expenditureScheme)) state.expenditureScheme = schemes[0];
        populateSelect("#financingSchemeSelect", schemes, state.expenditureScheme);

        const expYears = [...new Set(expRows.map(d => d.year))].sort((a, b) => b - a);
        state.expenditureYear = expYears[0];
        populateSelect("#dumbbellYearSelect", expYears, state.expenditureYear);

        const preventionRows = datasets.prevention.filter(d => coreCodes.includes(d.country_code));
        const preventionIndicators = [...new Set(preventionRows.map(d => d.indicator))].sort();
        if (!preventionIndicators.includes(state.preventionIndicator)) state.preventionIndicator = preventionIndicators[0];
        populateSelect("#preventionIndicator", preventionIndicators, state.preventionIndicator);
        updatePreventionYearOptions();

        const riskRows = datasets.risk.filter(d => coreCodes.includes(d.country_code));
        const riskIndicators = [...new Set(riskRows.map(d => d.indicator))].sort();
        if (!riskIndicators.includes(state.riskIndicator)) state.riskIndicator = riskIndicators[0];
        populateSelect("#riskIndicator", riskIndicators, state.riskIndicator);

        document.getElementById("globalCountrySelect").addEventListener("change", event => {
            setSelectedCountry(event.target.value);
        });

        document.getElementById("resetAustralia").addEventListener("click", () => {
            setSelectedCountry(coreCountries.some(d => d.country === "Australia") ? "Australia" : coreCountries[0].country);
        });

        document.getElementById("financingSchemeSelect").addEventListener("change", event => {
            state.expenditureScheme = event.target.value;
            renderExpenditureTrend();
        });

        document.getElementById("dumbbellYearSelect").addEventListener("change", event => {
            state.expenditureYear = Number(event.target.value);
            renderExpenditureDumbbell();
        });

        document.getElementById("preventionIndicator").addEventListener("change", event => {
            state.preventionIndicator = event.target.value;
            updatePreventionYearOptions();
            renderSummary();
            renderPrevention();
        });

        document.getElementById("preventionYear").addEventListener("change", event => {
            state.preventionYear = Number(event.target.value);
            renderPrevention();
        });

        document.getElementById("riskIndicator").addEventListener("change", event => {
            state.riskIndicator = event.target.value;
            renderSummary();
            renderRisk();
        });
    }

    function populateSelect(selector, values, selectedValue) {
        d3.select(selector)
            .selectAll("option")
            .data(values)
            .join("option")
            .attr("value", d => d)
            .text(d => d)
            .property("selected", d => String(d) === String(selectedValue));
    }

    function updatePreventionYearOptions() {
        const rows = datasets.prevention.filter(d =>
            coreCodes.includes(d.country_code) && d.indicator === state.preventionIndicator
        );
        const byYear = d3.rollups(rows, v => new Set(v.map(d => d.country_code)).size, d => d.year)
            .sort((a, b) => d3.descending(a[0], b[0]));
        const maxCoverage = d3.max(byYear, d => d[1]) || 0;
        const bestYears = byYear.filter(d => d[1] === maxCoverage).map(d => d[0]);
        state.preventionYear = bestYears.length ? d3.max(bestYears) : byYear[0]?.[0];
        populateSelect("#preventionYear", byYear.map(d => d[0]), state.preventionYear);
    }

    function setSelectedCountry(country) {
        if (!coreCountries.some(d => d.country === country)) return;
        state.country = country;
        document.getElementById("globalCountrySelect").value = country;
        renderSummary();
        renderLife();
        renderExpenditureTrend();
        renderExpenditureDumbbell();
        renderPrevention();
        renderRisk();
    }

    function renderAll() {
        renderSummary();
        renderLife();
        renderExpenditureTrend();
        renderExpenditureDumbbell();
        renderPrevention();
        renderRisk();
    }

    // ---------- Summary cards ----------
    function renderSummary() {
        const lifeRows = datasets.life
            .filter(d => d.country === state.country)
            .sort((a, b) => d3.ascending(a.year, b.year));
        const latestLife = lifeRows.at(-1);
        if (latestLife) {
            const peers = datasets.life.filter(d => coreCodes.includes(d.country_code) && d.year === latestLife.year);
            const avg = d3.mean(peers, d => d.life_expectancy);
            setText("summaryLifeValue", `${latestLife.life_expectancy.toFixed(1)} years`);
            setText("summaryLifeMeta", `${latestLife.year} · ${formatDelta(latestLife.life_expectancy - avg)} vs core avg`);
        } else {
            setText("summaryLifeValue", "—");
            setText("summaryLifeMeta", "No observation available");
        }

        const expRows = datasets.expenditure
            .filter(d => d.country === state.country && d.financing_scheme === "Total" && d.unit === "Percentage of GDP")
            .sort((a, b) => d3.ascending(a.year, b.year));
        const latestExp = expRows.at(-1);
        if (latestExp) {
            const peers = datasets.expenditure.filter(d => coreCodes.includes(d.country_code) && d.financing_scheme === "Total" && d.unit === "Percentage of GDP" && d.year === latestExp.year);
            const avg = d3.mean(peers, d => d.value);
            setText("summaryExpValue", `${latestExp.value.toFixed(1)}% GDP`);
            setText("summaryExpMeta", `${latestExp.year} · ${formatDelta(latestExp.value - avg)} pp vs core avg`);
        } else {
            setText("summaryExpValue", "—");
            setText("summaryExpMeta", "No observation available");
        }

        const prevRows = datasets.prevention
            .filter(d => d.country === state.country && d.indicator === state.preventionIndicator)
            .sort((a, b) => d3.ascending(a.year, b.year));
        const latestPrev = prevRows.at(-1);
        setText("summaryPreventionLabel", shortPreventionLabel(state.preventionIndicator));
        if (latestPrev) {
            setText("summaryPrevValue", `${latestPrev.value.toFixed(1)}%`);
            setText("summaryPrevMeta", `${latestPrev.year} · latest available`);
        } else {
            setText("summaryPrevValue", "—");
            setText("summaryPrevMeta", "No observation available");
        }

        const riskRows = datasets.risk
            .filter(d => d.country === state.country && d.indicator === state.riskIndicator)
            .sort((a, b) => d3.ascending(a.year, b.year));
        const latestRisk = riskRows.at(-1);
        setText("summaryRiskLabel", state.riskIndicator === "Share of population who are daily smokers" ? "Daily smokers" : "Tobacco consumption");
        if (latestRisk) {
            setText("summaryRiskValue", formatUnitValue(latestRisk.value, latestRisk.unit, true));
            setText("summaryRiskMeta", `${latestRisk.year} · latest available`);
        } else {
            setText("summaryRiskValue", "—");
            setText("summaryRiskMeta", "No observation available");
        }
    }

    // ---------- Life expectancy ----------
    function renderLife() {
        const container = d3.select("#lifeChart");
        container.selectAll("*").remove();

        const selected = datasets.life
            .filter(d => d.country === state.country)
            .sort((a, b) => d3.ascending(a.year, b.year));
        const core = datasets.life.filter(d => coreCodes.includes(d.country_code));
        const average = d3.rollups(core, rows => d3.mean(rows, d => d.life_expectancy), d => d.year)
            .map(([year, value]) => ({ year, value }))
            .sort((a, b) => d3.ascending(a.year, b.year));

        if (!selected.length) return renderEmpty(container, "No life expectancy data available for this country.");

        const width = 920;
        const height = 430;
        const margin = { top: 28, right: 28, bottom: 55, left: 66 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const allYears = [...selected.map(d => d.year), ...average.map(d => d.year)];
        const allValues = [...selected.map(d => d.life_expectancy), ...average.map(d => d.value)];
        const x = d3.scaleLinear().domain(d3.extent(allYears)).range([0, innerWidth]);
        const extent = d3.extent(allValues);
        const y = d3.scaleLinear().domain([extent[0] - 0.6, extent[1] + 0.6]).nice().range([innerHeight, 0]);

        const svg = container.append("svg").attr("viewBox", `0 0 ${width} ${height}`).attr("aria-hidden", "true");
        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
        addGrid(g, y, innerWidth, innerHeight);
        addAxes(g, x, y, innerHeight, selected.length, "Year", "Life expectancy (years)");

        const avgLine = d3.line().x(d => x(d.year)).y(d => y(d.value));
        const selectedLine = d3.line().x(d => x(d.year)).y(d => y(d.life_expectancy));

        g.append("path")
            .datum(average)
            .attr("fill", "none")
            .attr("stroke", COLORS.average)
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "6 6")
            .attr("d", avgLine);

        const path = g.append("path")
            .datum(selected)
            .attr("fill", "none")
            .attr("stroke", COLORS.selected)
            .attr("stroke-width", 3.5)
            .attr("stroke-linecap", "round")
            .attr("stroke-linejoin", "round")
            .attr("d", selectedLine);
        animatePath(path);

        const avgMap = new Map(average.map(d => [d.year, d.value]));
        g.selectAll(".life-point")
            .data(selected)
            .join("circle")
            .attr("class", "life-point interactive-mark")
            .attr("cx", d => x(d.year))
            .attr("cy", d => y(d.life_expectancy))
            .attr("r", 5.5)
            .attr("fill", COLORS.selected)
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .on("mouseenter", (event, d) => {
                const avg = avgMap.get(d.year);
                showTooltip(event, `<strong>${escapeHtml(state.country)} · ${d.year}</strong>Life expectancy: ${d.life_expectancy.toFixed(1)} years<br>Core average: ${avg ? avg.toFixed(1) : "—"} years${avg ? `<br>Difference: ${formatDelta(d.life_expectancy - avg)} years` : ""}`);
            })
            .on("mousemove", moveTooltip)
            .on("mouseleave", hideTooltip);

        const startYear = d3.min(selected, d => d.year);
        const endYear = d3.max(selected, d => d.year);
        setText("lifeChartHeading", `${state.country}: life expectancy over time`);
        setText("lifeStatus", `${selected.length} observations · ${startYear}–${endYear} · dashed line = 14-country core average`);
        setText("lifeCoverageBadge", `${startYear}–${endYear}`);
    }

    // ---------- Expenditure trend ----------
    function renderExpenditureTrend() {
        const container = d3.select("#expenditureTrendChart");
        container.selectAll("*").remove();

        const base = datasets.expenditure.filter(d =>
            coreCodes.includes(d.country_code) &&
            d.unit === "Percentage of GDP" &&
            d.financing_scheme === state.expenditureScheme
        );
        const selected = base.filter(d => d.country === state.country).sort((a, b) => d3.ascending(a.year, b.year));
        const average = d3.rollups(base, rows => d3.mean(rows, d => d.value), d => d.year)
            .map(([year, value]) => ({ year, value }))
            .sort((a, b) => d3.ascending(a.year, b.year));

        if (!selected.length) return renderEmpty(container, "No expenditure data available for this selection.");

        const width = 760;
        const height = 430;
        const margin = { top: 28, right: 26, bottom: 55, left: 64 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;
        const x = d3.scaleLinear().domain(d3.extent(base, d => d.year)).range([0, innerWidth]);
        const values = [...selected.map(d => d.value), ...average.map(d => d.value)];
        const ext = d3.extent(values);
        const pad = Math.max(0.45, (ext[1] - ext[0]) * 0.15);
        const y = d3.scaleLinear().domain([Math.max(0, ext[0] - pad), ext[1] + pad]).nice().range([innerHeight, 0]);

        const svg = container.append("svg").attr("viewBox", `0 0 ${width} ${height}`).attr("aria-hidden", "true");
        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
        addGrid(g, y, innerWidth, innerHeight);
        addAxes(g, x, y, innerHeight, selected.length, "Year", "Health expenditure (% of GDP)");

        const avgLine = d3.line().x(d => x(d.year)).y(d => y(d.value));
        const line = d3.line().x(d => x(d.year)).y(d => y(d.value));
        g.append("path").datum(average).attr("fill", "none").attr("stroke", COLORS.average).attr("stroke-width", 2).attr("stroke-dasharray", "6 6").attr("d", avgLine);
        const path = g.append("path").datum(selected).attr("fill", "none").attr("stroke", COLORS.teal).attr("stroke-width", 3.5).attr("stroke-linejoin", "round").attr("stroke-linecap", "round").attr("d", line);
        animatePath(path);

        const avgMap = new Map(average.map(d => [d.year, d.value]));
        g.selectAll(".exp-point")
            .data(selected)
            .join("circle")
            .attr("class", "exp-point interactive-mark")
            .attr("cx", d => x(d.year))
            .attr("cy", d => y(d.value))
            .attr("r", 5)
            .attr("fill", COLORS.teal)
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .on("mouseenter", (event, d) => {
                const avg = avgMap.get(d.year);
                showTooltip(event, `<strong>${escapeHtml(state.country)} · ${d.year}</strong>${escapeHtml(state.expenditureScheme)}<br>${d.value.toFixed(2)}% of GDP<br>Core average: ${avg ? avg.toFixed(2) : "—"}%`);
            })
            .on("mousemove", moveTooltip)
            .on("mouseleave", hideTooltip);

        setText("expenditureStatus", `${state.country} · ${state.expenditureScheme} · ${selected[0].year}–${selected.at(-1).year}`);
    }

    // ---------- Expenditure dumbbell ----------
    function renderExpenditureDumbbell() {
        const container = d3.select("#expenditureDumbbellChart");
        container.selectAll("*").remove();

        const rows = datasets.expenditure.filter(d => coreCodes.includes(d.country_code) && d.year === state.expenditureYear && d.unit === "Percentage of GDP");
        const gov = new Map(rows.filter(d => d.financing_scheme === "Government/compulsory schemes").map(d => [d.country_code, d]));
        const vol = new Map(rows.filter(d => d.financing_scheme === "Voluntary schemes/household out-of-pocket payments").map(d => [d.country_code, d]));
        const combined = coreCodes.map(code => {
            const g = gov.get(code);
            const v = vol.get(code);
            if (!g || !v) return null;
            return { code, country: g.country, government: g.value, voluntary: v.value };
        }).filter(Boolean).sort((a, b) => d3.descending(a.government, b.government));

        if (!combined.length) return renderEmpty(container, "No funding-mix data available for this year.");

        const width = 760;
        const rowHeight = 31;
        const height = Math.max(500, combined.length * rowHeight + 110);
        const margin = { top: 24, right: 28, bottom: 48, left: 128 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;
        const maxValue = d3.max(combined, d => Math.max(d.government, d.voluntary));
        const x = d3.scaleLinear().domain([0, maxValue * 1.08]).nice().range([0, innerWidth]);
        const y = d3.scaleBand().domain(combined.map(d => d.country)).range([0, innerHeight]).padding(0.38);

        const svg = container.append("svg").attr("viewBox", `0 0 ${width} ${height}`).attr("aria-hidden", "true");
        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        g.append("g").attr("transform", `translate(0,${innerHeight})`).call(d3.axisBottom(x).ticks(6)).call(axis => axis.selectAll("text").attr("fill", COLORS.muted));
        g.append("g").call(d3.axisLeft(y).tickSize(0)).call(axis => axis.select(".domain").remove());
        g.append("text").attr("class", "axis-label-svg").attr("x", innerWidth / 2).attr("y", innerHeight + 42).attr("text-anchor", "middle").text("Health expenditure (% of GDP)");

        g.selectAll(".selected-row")
            .data(combined.filter(d => d.country === state.country))
            .join("rect")
            .attr("x", -6)
            .attr("y", d => y(d.country) - 5)
            .attr("width", innerWidth + 12)
            .attr("height", y.bandwidth() + 10)
            .attr("rx", 8)
            .attr("fill", "#fff5df");

        g.selectAll(".dumbbell-line")
            .data(combined)
            .join("line")
            .attr("x1", d => x(d.government))
            .attr("x2", d => x(d.voluntary))
            .attr("y1", d => y(d.country) + y.bandwidth() / 2)
            .attr("y2", d => y(d.country) + y.bandwidth() / 2)
            .attr("stroke", d => d.country === state.country ? "#d19a35" : "#c8d3da")
            .attr("stroke-width", d => d.country === state.country ? 4 : 2.5)
            .attr("stroke-linecap", "round");

        const dots = [
            { cls: "gov", value: d => d.government, color: COLORS.gov, label: "Government / compulsory" },
            { cls: "vol", value: d => d.voluntary, color: COLORS.voluntary, label: "Voluntary / out-of-pocket" }
        ];

        dots.forEach(series => {
            g.selectAll(`.dot-${series.cls}`)
                .data(combined)
                .join("circle")
                .attr("class", `dot-${series.cls} interactive-mark`)
                .attr("cx", d => x(series.value(d)))
                .attr("cy", d => y(d.country) + y.bandwidth() / 2)
                .attr("r", d => d.country === state.country ? 7.5 : 6)
                .attr("fill", series.color)
                .attr("stroke", d => d.country === state.country ? "#fff" : "none")
                .attr("stroke-width", 2)
                .on("mouseenter", (event, d) => showTooltip(event, `<strong>${escapeHtml(d.country)} · ${state.expenditureYear}</strong>${series.label}: ${series.value(d).toFixed(2)}% of GDP<br>Government: ${d.government.toFixed(2)}%<br>Voluntary/OOP: ${d.voluntary.toFixed(2)}%`))
                .on("mousemove", moveTooltip)
                .on("mouseleave", hideTooltip)
                .on("click", (_, d) => setSelectedCountry(d.country));
        });

        setText("expenditureDumbbellStatus", `${combined.length} core countries · click a point to select a country`);
    }

    // ---------- Prevention ----------
    function renderPrevention() {
        const container = d3.select("#preventionChart");
        container.selectAll("*").remove();

        const raw = datasets.prevention.filter(d =>
            coreCodes.includes(d.country_code) &&
            d.indicator === state.preventionIndicator &&
            d.year === state.preventionYear
        );

        const grouped = d3.rollups(
            raw,
            rows => ({
                code: rows[0].country_code,
                country: rows[0].country,
                unit: rows[0].unit,
                value: d3.mean(rows, d => d.value)
            }),
            d => d.country_code
        ).map(([, value]) => value).sort((a, b) => d3.descending(a.value, b.value));

        if (!grouped.length) return renderEmpty(container, "No prevention data available for this indicator and year.");

        const width = 920;
        const rowHeight = 34;
        const height = Math.max(500, grouped.length * rowHeight + 110);
        const margin = { top: 20, right: 74, bottom: 55, left: 160 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;
        const max = d3.max(grouped, d => d.value);
        const x = d3.scaleLinear().domain([0, Math.max(100, max * 1.04)]).nice().range([0, innerWidth]);
        const y = d3.scaleBand().domain(grouped.map(d => d.country)).range([0, innerHeight]).padding(0.18);

        const svg = container.append("svg").attr("viewBox", `0 0 ${width} ${height}`).attr("aria-hidden", "true");
        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
        addGridX(g, x, innerHeight);
        g.append("g").attr("transform", `translate(0,${innerHeight})`).call(d3.axisBottom(x).ticks(6));
        g.append("g").call(d3.axisLeft(y).tickSize(0)).call(axis => axis.select(".domain").remove());
        const displayMeasure = preventionDisplayLabel(state.preventionIndicator, grouped[0].unit);
        g.append("text")
            .attr("class", "axis-label-svg")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight + 44)
            .attr("text-anchor", "middle")
            .text(displayMeasure);

        g.selectAll(".prevention-bar")
            .data(grouped, d => d.code)
            .join("rect")
            .attr("class", "prevention-bar interactive-mark")
            .attr("x", 0)
            .attr("y", d => y(d.country))
            .attr("height", y.bandwidth())
            .attr("rx", 5)
            .attr("fill", d => d.country === state.country ? COLORS.selected : COLORS.blue)
            .attr("width", 0)
            .on("mouseenter", (event, d) => showTooltip(
                event,
                `<strong>${escapeHtml(d.country)} · ${state.preventionYear}</strong>` +
                `${escapeHtml(state.preventionIndicator)}<br>` +
                `${escapeHtml(displayMeasure)}<br>` +
                `<strong>${d.value.toFixed(1)}%</strong><br>` +
                `Higher = more people protected`
            ))
            .on("mousemove", moveTooltip)
            .on("mouseleave", hideTooltip)
            .on("click", (_, d) => setSelectedCountry(d.country))
            .transition().duration(DURATION).attr("width", d => x(d.value));

        g.selectAll(".prevention-value")
            .data(grouped, d => d.code)
            .join("text")
            .attr("x", d => x(d.value) + 7)
            .attr("y", d => y(d.country) + y.bandwidth() / 2 + 4)
            .attr("fill", COLORS.text)
            .attr("font-size", 11)
            .attr("font-weight", d => d.country === state.country ? 800 : 600)
            .text(d => d.value.toFixed(1));

        setText("preventionChartHeading", `${state.preventionIndicator} · ${state.preventionYear}`);
        setText("preventionMeasureLabel", displayMeasure);
        setText("preventionCue", "Higher = more people protected");
        setText("preventionStatus", `${grouped.length} of ${coreCodes.length} core countries have a valid observation · bars are ranked highest to lowest`);
        setText("preventionCoverageBadge", `${grouped.length}/${coreCodes.length} countries`);
    }

    // ---------- Risk factors ----------
    function renderRisk() {
        const container = d3.select("#riskChart");
        container.selectAll("*").remove();

        const raw = datasets.risk.filter(d => coreCodes.includes(d.country_code) && d.indicator === state.riskIndicator);
        const latest = d3.rollups(raw, rows => {
            const latestYear = d3.max(rows, d => d.year);
            const latestRows = rows.filter(d => d.year === latestYear);
            return {
                code: latestRows[0].country_code,
                country: latestRows[0].country,
                unit: latestRows[0].unit,
                year: latestYear,
                value: d3.mean(latestRows, d => d.value)
            };
        }, d => d.country_code).map(([, value]) => value).sort((a, b) => d3.descending(a.value, b.value));

        if (!latest.length) return renderEmpty(container, "No risk-factor data available for this indicator.");

        const width = 920;
        const rowHeight = 35;
        const height = Math.max(500, latest.length * rowHeight + 115);
        const margin = { top: 20, right: 110, bottom: 55, left: 160 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;
        const max = d3.max(latest, d => d.value);
        const x = d3.scaleLinear().domain([0, max * 1.12]).nice().range([0, innerWidth]);
        const y = d3.scaleBand().domain(latest.map(d => d.country)).range([0, innerHeight]).padding(0.18);

        const svg = container.append("svg").attr("viewBox", `0 0 ${width} ${height}`).attr("aria-hidden", "true");
        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
        addGridX(g, x, innerHeight);
        g.append("g").attr("transform", `translate(0,${innerHeight})`).call(d3.axisBottom(x).ticks(6));
        g.append("g").call(d3.axisLeft(y).tickSize(0)).call(axis => axis.select(".domain").remove());
        g.append("text").attr("class", "axis-label-svg").attr("x", innerWidth / 2).attr("y", innerHeight + 44).attr("text-anchor", "middle").text(latest[0].unit);

        g.selectAll(".risk-bar")
            .data(latest, d => d.code)
            .join("rect")
            .attr("class", "risk-bar interactive-mark")
            .attr("x", 0)
            .attr("y", d => y(d.country))
            .attr("height", y.bandwidth())
            .attr("rx", 5)
            .attr("fill", d => d.country === state.country ? COLORS.selected : COLORS.blue)
            .attr("width", 0)
            .on("mouseenter", (event, d) => showTooltip(event, `<strong>${escapeHtml(d.country)}</strong>${escapeHtml(state.riskIndicator)}<br>Latest year: ${d.year}<br>${formatUnitValue(d.value, d.unit, false)}<br>${escapeHtml(d.unit)}`))
            .on("mousemove", moveTooltip)
            .on("mouseleave", hideTooltip)
            .on("click", (_, d) => setSelectedCountry(d.country))
            .transition().duration(DURATION).attr("width", d => x(d.value));

        g.selectAll(".risk-label")
            .data(latest, d => d.code)
            .join("text")
            .attr("x", d => x(d.value) + 7)
            .attr("y", d => y(d.country) + y.bandwidth() / 2 + 4)
            .attr("fill", COLORS.text)
            .attr("font-size", 11)
            .attr("font-weight", d => d.country === state.country ? 800 : 600)
            .text(d => `${d.value.toFixed(1)} (${d.year})`);

        setText("riskChartHeading", state.riskIndicator);
        setText("riskStatus", `${latest.length} core countries with data · each bar uses that country's latest available observation`);
    }

    // ---------- Generic SVG helpers ----------
    function addGrid(g, yScale, innerWidth, innerHeight) {
        g.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(yScale).ticks(5).tickSize(-innerWidth).tickFormat(""));
    }

    function addGridX(g, xScale, innerHeight) {
        g.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale).ticks(6).tickSize(-innerHeight).tickFormat(""));
    }

    function addAxes(g, xScale, yScale, innerHeight, tickCount, xLabel, yLabel) {
        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale).ticks(Math.min(10, tickCount)).tickFormat(d3.format("d")));
        g.append("g").call(d3.axisLeft(yScale).ticks(5));
        g.append("text").attr("class", "axis-label-svg").attr("x", xScale.range()[1] / 2).attr("y", innerHeight + 45).attr("text-anchor", "middle").text(xLabel);
        g.append("text").attr("class", "axis-label-svg").attr("transform", "rotate(-90)").attr("x", -innerHeight / 2).attr("y", -48).attr("text-anchor", "middle").text(yLabel);
    }

    function animatePath(path) {
        if (!DURATION) return;
        const node = path.node();
        if (!node || typeof node.getTotalLength !== "function") return;
        const length = node.getTotalLength();
        path.attr("stroke-dasharray", `${length} ${length}`)
            .attr("stroke-dashoffset", length)
            .transition()
            .duration(DURATION + 250)
            .ease(d3.easeCubicOut)
            .attr("stroke-dashoffset", 0)
            .on("end", function() {
                d3.select(this).attr("stroke-dasharray", null).attr("stroke-dashoffset", null);
            });
    }

    function renderEmpty(container, message) {
        container.append("div")
            .style("padding", "44px 18px")
            .style("text-align", "center")
            .style("color", COLORS.muted)
            .text(message);
    }

    // ---------- Tooltip ----------
    function showTooltip(event, html) {
        tooltip.html(html).classed("is-visible", true);
        moveTooltip(event);
    }

    function moveTooltip(event) {
        const node = tooltip.node();
        if (!node) return;
        const padding = 14;
        const rect = node.getBoundingClientRect();
        let left = event.clientX + 14;
        let top = event.clientY + 14;
        if (left + rect.width + padding > window.innerWidth) left = event.clientX - rect.width - 14;
        if (top + rect.height + padding > window.innerHeight) top = event.clientY - rect.height - 14;
        tooltip.style("left", `${Math.max(padding, left)}px`).style("top", `${Math.max(padding, top)}px`);
    }

    function hideTooltip() {
        tooltip.classed("is-visible", false);
    }

    // ---------- Text / formatting ----------
    function setText(id, value) {
        const node = document.getElementById(id);
        if (node) node.textContent = value;
    }

    function formatDelta(value) {
        if (!Number.isFinite(value)) return "—";
        const sign = value > 0 ? "+" : "";
        return `${sign}${value.toFixed(1)}`;
    }

    function formatUnitValue(value, unit, short) {
        if (!Number.isFinite(value)) return "—";
        if (/percentage/i.test(unit)) return `${value.toFixed(1)}%`;
        if (/cigarettes/i.test(unit)) return short ? `${value.toFixed(1)}/day` : `${value.toFixed(1)}`;
        return value.toFixed(1);
    }

    function preventionDisplayLabel(indicator, fallbackUnit = "") {
        if (indicator === "Diphtheria, Tetanus, Pertussis" ||
            indicator === "Hepatitis B" ||
            indicator === "Measles") {
            return "Children immunised (% of target age group)";
        }

        if (indicator === "Influenza") {
            return "Adults aged 65+ vaccinated (%)";
        }

        return fallbackUnit || "Vaccination coverage (%)";
    }

    function shortPreventionLabel(indicator) {
        if (indicator === "Diphtheria, Tetanus, Pertussis") return "DTP coverage";
        if (indicator === "Hepatitis B") return "Hepatitis B coverage";
        if (indicator === "Influenza") return "Influenza coverage";
        if (indicator === "Measles") return "Measles coverage";
        return indicator;
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }
})();
