# Changelog

## 0.9.1 (2026-01-18)

- Add legend to PNGs of charts.
- Add error route.
- Replace slim-select by custom implementation.
- [Nodal, Storage] Add move in and out buttons.
- [Storage] Only show carriers with storage technologies.
- [Costs] Add pie plot.

## 0.9.0 (2026-01-05)

- [Production] Enable subdivision by default.
- Download data and PNGs of all charts at once.
- Restore strike through line for disabled legend items.
- Integrate Floating UI to position tooltips.
- Add Apache v2 license.
- [Nodal, Storage] Use Entries class.
- Refactor: make all functions camelCase, rename, and reorder them.
- Add brief installation and usage instructions to README.
- Show filter options while data is being fetched.
- Update ZEN-temple endpoints and use new server-side filter by carrier option.
- Add custom error and warning messages.

## 0.8.1 (2025-11-24)

- Fix resetting selection in dropdowns when options change.

## 0.8.0 (2025-11-20)

- New responsive design for the platform with a dark theme.
- [Sankey, Map] Add download SVG button.
- [Nodal] Fix dual plot unit.
- Add download PNG button.
- [Map] Sort carriers alphabetically.
- Always select carrier first.

## 0.7.7 (2025-10-30)

- [Sankey] Give carriers their own row.
- [Sankey] Show cycles on the bottom if that's closer.
- [Production] Hide pie plots after changing solutions.
- [Sankey, Production] Add transport in and out.

## 0.7.6 (2025-10-27)

- The Transition Pathway: compare multiple solutions on one page.
- [Sankey] Add structure only view.
- [Sankey] Add legend to focus on carriers.
- [Sankey] Restructure nodes, smaller layout updates.

## 0.7.5 (2025-10-10)

- [Sankey] Fix wrong numerical values. Closes #130.
- [Nodal] Do not begin at zero in the duals plot. Closes #129.
- Sort nodes and carriers alphabetically. Closes #128.

## 0.7.4 (2025-10-02)

- [Nodal, Storage] Keep zoom level if possible when changing options and solutions.
- Add tests for duals and energy_system plot.
- [Nodal] Remove dual data from upper plot.
- [Sankey] Add divider to tooltip and show total of both inflows and outflows.
- [Sankey] Prevent processing of data for invalid years.
- [Nodal] Add subplot to show dual variables.
- [Sankey] Fix #124 by adding a tooltip and modifying some labels.
- [Sankey] Fix #125. Show storage flows related by reference carriers.

## 0.7.3 (2025-09-25)

- [Sankey] Improve box label placement and color.
- [Navigation] Store all urlParams in the history's state.
- Keep selection when changing solutions if possible.

## 0.7.2 (2025-09-22)

- [Nodal, Storage] Parse quantified response which reduces payload size by up to 80%.
- [Sankey] Add energy system plot.
- [Production] Show pie plots when clicking on bars.
- Shorten URL parameters.

## 0.7.1 (2025-08-15)

- [Map] Make landmasses lighter.

## 0.7.0 (2025-08-15)

- Add Playwright tests to check the state of the frontend.
- Use modified endpoints to download multiple components at once.
- [Nodal, Storage] Disable chart.js parsing and untrack response data and datasets to improve performance.
- Remove gray from the color palette.
- [Map] Change background to shades of gray.
- [Nodal] Rename y axis label to "Energy".
- [Capacity, Emissions, Production] Fix normalization to interval from 0 to 1 (only positive values).
- [Emissions, Production] Use sum of all positive (or negative, if there are no positives) values as reference when normalizing the data.
- [Nodal, Storage] Use decimation plugin to improve chart.js performance.
- [Capacity] Keep carrier when changing solutions.
- Use year that are sent from the server.

## 0.6.2 (2025-06-21)

- Remove unused components property in SolutionDetail.

## 0.6.1 (2025-06-20)

- [Storage] Reorder smoothing window size filter.
- [Nodal] Remove transparency from plot background colors.
- [Costs, Production] Fix setting of URL parameters for technology selection.
- [Emissions] Fix unit when subdivision is unset.
- [Capacity] Change label of yaxis.
- Use ETH colors in all plots.

## 0.6.0 (2025-06-12)

- Refactor all pages to use more of Svelte's reactivity system.
- [Emissions] Fix wrong unit.

## 0.5.8 (2025-05-20)

- [Production] Choose unit based on units from the demand component.

## 0.5.5 (2025-05-20)

- [Production] Fix bug when unselecting a production component.
- [Production] Show all relevant carriers.

## 0.5.5 (2025-05-20)

- [Production] Restructure plot to show all variables simultaneously.
- Add URL parameters to keep the selected solutions across page reloads.
- [Map] Use max edge value in the min/maxEdge computation.

## 0.5.4 (2025-05-13)

- [Map] and [Capacity]: Fix unit for storage with capacity type energy or power.
- [Map] Set min width for tooltip
- [Map] Compute maxRadius across all years.
- [Map] Set default map to "Countries".
- [Map] Always show all carriers for transport technologies.
- [Capacity] and [Production] Fix bug when loading solutions with scenarios.

## 0.5.3 (2025-05-04)

- [Nodal] Fix year selection.

## 0.5.2 (2025-05-04)

- [Map] Label map selection.
- [Map] Remove `world-1.json` and `world-2.json`.

## 0.5.1 (2025-05-01)

- [Map] Fix initial projection when there is only a single node.

## 0.5.0 (2025-05-01)

- Add map plot.
- [Capacity] Fix node, technology, and year selection.
- [Production] Fix selection of carriers.
- [Emissions] Reset filters when cumulation is changed.
- [Costs] Keep accordions open by default.

## 0.4.5 (2025-03-18)

- Fix error if time series is empty
- Fix that conversion to reference year happens twice

## 0.4.4 (2025-03-12)

- Set default title to "ZEN-garden Visualization".

## 0.4.3 (2025-03-12)

- Add default app name.

## 0.4.2 (2025-03-12)

- Import bootstrap inside `layout.svelte`.
- Show active page in navbar.

## 0.4.1 (2025-03-12)

- Fix small bug in `layout.svelte`.

## 0.4.0 (2025-03-11)

- Migrate to Svelte 5.
- Add storage flows to storage plots.
