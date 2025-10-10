import type { Entry, Index, Row } from './types';

/**
 * Class to handle a collection of Entry objects with methods for filtering and grouping.
 * Each Entry consists of an index (key-value pairs) and a data array (numeric values).
 */
export default class Entries {
	entries: Entry[];

	/**
	 * Creates an Entries instance from an array of Entry objects.
	 * @param entries Array of Entry objects.
	 */
	constructor(entries: Entry[]) {
		this.entries = entries;
	}

	/**
	 * Static factory method to create an Entries instance from an array of Row objects.
	 * Each Row is split into an index (non-numeric values) and data (numeric values).
	 * @param rows Array of Row objects.
	 * @returns Entries instance.
	 */
	static fromRows(rows: Row[]): Entries {
		return new Entries(
			rows.map((row) => {
				const index: Index = {};
				const data: number[] = [];
				Object.entries(row).forEach(([key, value]) => {
					if (isNaN(value)) {
						index[key] = value as string;
						return;
					} else {
						data.push(Number(value));
					}
				});
				return { index, data };
			})
		);
	}

	/**
	 * Filters the entries based on the provided criteria.
	 * Only entries whose index values match all criteria are included.
	 * If a key in criteria does not exist in an entry's index, that entry might still be included.
	 * @param criteria Object where keys are index fields and values are allowed values for that field.
	 * @returns New Entries instance with filtered entries.
	 */
	filterByCriteria(criteria: Record<string, string[]>): Entries {
		const filteredEntries = this.entries.filter((entry) =>
			Object.entries(criteria).every(
				// Check if entry does not have the key or if the value matches one of the allowed values
				([key, values]) =>
					Object.keys(entry.index).includes(key) ? values.includes(entry.index[key]) : true
			)
		);
		return new Entries(filteredEntries);
	}

	/**
	 * Filters the data arrays of each entry to only include values at the specified indexes.
	 * @param indexes Array of indexes to retain in the data arrays.
	 * @returns New Entries instance with filtered data arrays.
	 */
	filterDataByIndex(indexes: number[]): Entries {
		const filteredEntries = this.entries.map((entry) => {
			return {
				index: entry.index,
				data: indexes.map((i) => entry.data[i])
			};
		});
		return new Entries(filteredEntries);
	}

	/**
	 * Groups and aggregates entries by the specified index fields.
	 * Sums the data arrays for entries with the same group key.
	 * @param fieldNames Array of index field names to group by.
	 * @returns New Entries instance with grouped and aggregated entries.
	 */
	groupBy(fieldNames: string[]): Entries {
		const aggregatedMap: Record<string, number[]> = {};
		const labelMap: Record<string, Index> = {};

		this.entries.forEach((entry) => {
			// Compute label of aggregated entry, initialize it, and compute total for each column
			const group = Object.fromEntries(fieldNames.map((column) => [column, entry.index[column]]));
			const label = Object.values(group).join('_');
			if (!labelMap[label]) {
				labelMap[label] = group;
			}
			if (!aggregatedMap[label]) {
				aggregatedMap[label] = entry.data.slice();
			} else {
				entry.data.forEach((value, i) => {
					aggregatedMap[label][i] += Number(value);
				});
			}
		});

		// Create aggregated entries
		return new Entries(
			Object.entries(aggregatedMap).map(([label, data]) => {
				return {
					index: labelMap[label],
					data: data
				};
			})
		);
	}

	normalize(): Entries {
		const computeTotals = (fn: (v: number) => number) => {
			const totals: number[] = [];
			this.entries.forEach((entry) => {
				entry.data.forEach((value, index) => {
					const val = fn(value);
					if (val <= 0) return;
					totals[index] = (totals[index] ?? 0) + val;
				});
			});
			return totals;
		}
		
		// Get the sum of all positive values for each year
		const positiveTotals = computeTotals((v) => v);
		// If a year has no positive values, we compute the absolute value of the sum of the negative values
		const negativeTotals = computeTotals((v) => -v);

		// Normalize the data by dividing each value by the total for that year
		const normalizedEntries = this.entries.map((entry) => {
			return {
				index: entry.index,
				data: entry.data.reduce((acc, value, index) => {
					if (positiveTotals[index] > 0) {
						acc[index] = value / positiveTotals[index];
					} else if (negativeTotals[index] > 0) {
						acc[index] = value / negativeTotals[index];
					} else {
						acc[index] = 0;
					}
					return acc;
				}, [] as number[])
			};
		});
		return new Entries(normalizedEntries);
	}

	/**
	 * Dumps the entries to the console.
	 * @return Reference to itself for chaining.
	 */
	dump(): Entries {
		console.table(
			this.entries.map((entry) => ({
				...entry.index,
				...Object.fromEntries(entry.data.map((value, i) => [i.toString(), value]))
			}))
		);
		return this;
	}

	*[Symbol.iterator](): Iterator<Entry> {
		return this.entries[Symbol.iterator]();
	}

	forEach(callback: (entry: Entry, index: number, array: Entry[]) => void): Entries {
		this.entries.forEach(callback);
		return this;
	}

	reduce<T>(
		callback: (previousValue: T, currentValue: Entry, currentIndex: number, array: Entry[]) => T,
		initialValue: T
	): T {
		return this.entries.reduce(callback, initialValue);
	}

	find(callback: (entry: Entry, index: number, array: Entry[]) => boolean): Entry | undefined {
		return this.entries.find(callback);
	}

	filter(callback: (entry: Entry, index: number, array: Entry[]) => boolean): Entries {
		return new Entries(this.entries.filter(callback));
	}

	get length(): number {
		return this.entries.length;
	}

	get(index: number): Entry | undefined {
		return this.entries[index];
	}

	toArray(): Entry[] {
		return this.entries;
	}
}
