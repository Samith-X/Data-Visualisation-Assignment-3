# Data-Visualisation-Assignment-3
COS30045 FINAL INTERACTIVE VISUALISATION
========================================

Project title
-------------
How Healthy is Australia?
Comparing Australia's health outcomes, expenditure, preventive healthcare and selected risk factors with OECD countries.

Run the project
---------------
1. Keep the folder structure unchanged.
2. Open the project folder in VS Code.
3. Run index.html using Live Server (recommended) OR deploy the same folder structure to Mercury.
4. Do not open index.html directly with file:// because browser security rules can block CSV loading.
5. Internet access is required for the D3 v7 CDN used by index.html.

Final files
-----------
index.html                  Final integrated dashboard page
Css/style.css               Final modern/responsive styling
Js/app.js                   Final integrated D3 application
Data/Processed/*.csv        Four processed datasets used by the dashboard
Archive/Original/           Original uploaded prototype/contributor files preserved for reference

Final dashboard interactions
----------------------------
- Shared country selector controls the selected country across all views.
- Clicking a country in prevention, risk-factor or expenditure funding-mix views changes the shared country selection.
- Life Expectancy shows the selected country against the 14-country core average.
- Health Expenditure trend supports financing-scheme filtering and selected-country comparison against the core average.
- Health Expenditure funding mix uses an interactive year selector and dumbbell comparison.
- Prevention supports indicator and year filtering, ranked bars, tooltips and selected-country highlighting.
- Risk Factors uses the latest available observation for each country because reporting years are irregular.
- Summary cards update with the selected country and active prevention/risk indicators.

Data rules
----------
The 14-country comparison group is the intersection of country codes available across all four processed datasets.
Missing observations are not replaced by zero.
Prevention comparisons use valid observations for the selected indicator/year.
Risk-factor comparisons use the latest available observation for each country.

Integration note
----------------
The final app consolidates the functionality from the supplied prototype modules into one coordinated application to avoid duplicate event listeners and merge conflicts. Original supplied files are retained in Archive/Original for traceability.

Pre-submission checks
---------------------
[ ] Test every dropdown.
[ ] Click countries in the comparison charts and confirm the shared selector changes.
[ ] Confirm Australia can be restored with the Reset to Australia button.
[ ] Check all charts on Mercury, not only Live Server.
[ ] Open browser Developer Tools and confirm there are no console errors.
[ ] Test at desktop and mobile/tablet widths.
[https://mercury.swin.edu.au/cos30045/s104441373/assignment3/index.html ] Insert the final Mercury URL in the Process Book.
[ ] Capture final screenshots for the Process Book and Standup evidence.
