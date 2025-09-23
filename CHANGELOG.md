# Changelog

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
