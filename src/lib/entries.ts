import type { Entry, Index, Row } from './types';

export type FilterCriteria = Record<string, string[]>;

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
					if (value === 'inf') {
						data.push(Infinity);
					} else if (isNaN(value)) {
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

	static get empty(): Entries {
		return new Entries([]);	
	}

	/**
	 * Concatenates multiple Entries instances into a single Entries instance.
	 * @param entriesList Array of Entries instances to concatenate.
	 * @returns New Entries instance containing all entries from the input instances.
	 */
	static concatenate(entriesList: (Entries | null)[]): Entries {
		return new Entries(entriesList.flatMap((e) => e?.toArray() || []));
	}

	/**
	 * Filters the entries based on the provided criteria.
	 * Only entries whose index values match all criteria are included.
	 * If a key in criteria does not exist in an entry's index, that entry might still be included.
	 * @param criteria Object where keys are index fields and values are allowed values for that field.
	 * @returns New Entries instance with filtered entries.
	 */
	filterByCriteria(criteria: FilterCriteria): Entries {
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

	/**
	 * Normalizes the data arrays of each entry so that the sum of positive values for each index is 1.
	 * If a year has no positive values, it normalizes by the absolute sum of negative values.
	 * @returns New Entries instance with normalized data arrays.
	 */
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
		};

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
		if (this.entries.length === 0) {
			console.log('No entries to display.');
		} else if (this.entries[0].data.length + Object.keys(this.entries[0].index).length > 20) {
			console.warn('Data too wide to display all columns, showing sums instead.');
			console.table(
				this.entries.map((entry) => ({
					...entry.index,
					sum: entry.data.reduce((a, b) => a + b, 0)
				}))
			);
		} else {
			console.table(
				this.entries.map((entry) => ({
					...entry.index,
					...Object.fromEntries(entry.data.map((value, i) => [i.toString(), value]))
				}))
			);
		}
		return this;
	}

	/**
	 * Applies a callback function to each value in the data arrays of the entries.
	 * @param callback Function to apply to each data value.
	 * @returns New Entries instance with mapped data.
	 */
	mapData(callback: (value: number, dataIndex: number, dataArray: number[]) => number): Entries {
		const mappedEntries = this.entries.map((entry) => {
			return {
				index: entry.index,
				data: entry.data.map(callback)
			};
		});
		return new Entries(mappedEntries);
	}

	/**
	 * Applies a callback function to each index of the entries.
	 * @param callback Function to apply to each index.
	 * @returns New Entries instance with mapped indexes.
	 */
	mapIndex(callback: (index: Index, entryIndex: number, entriesArray: Entry[]) => Index): Entries {
		const mappedEntries = this.entries.map((entry, i, arr) => {
			return {
				index: callback(entry.index, i, arr),
				data: entry.data
			};
		});
		return new Entries(mappedEntries);
	}

	/**
	 * Applies a callback function to each entry.
	 * @param callback Function to apply to each entry.
	 * @returns New Entries instance with mapped entries.
	 */
	mapEntries(callback: (index: Index, data: number[]) => Entry): Entries {
		const mappedEntries = this.entries.map((entry) => {
			return callback(entry.index, entry.data);
		});
		return new Entries(mappedEntries);
	}

	/**
	 * Iterates over all entries.
	 * @returns An array of all unique index keys across all entries.
	 */
	*[Symbol.iterator](): Iterator<Entry> {
		yield* this.entries[Symbol.iterator]();
	}

	/**
	 * Iterates over all entries.
	 * @returns Reference to itself for chaining.
	 */
	forEach(callback: (entry: Entry, index: number, array: Entry[]) => void): Entries {
		this.entries.forEach(callback);
		return this;
	}

	/**
	 * Reduces the entries to a single value using the provided callback function.
	 * @param callback Callback function to execute on each entry.
	 * @param initialValue Initial value for the reduction.
	 * @returns The final reduced value.
	 */
	reduce<T>(
		callback: (previousValue: T, currentValue: Entry, currentIndex: number, array: Entry[]) => T,
		initialValue: T
	): T {
		return this.entries.reduce(callback, initialValue);
	}

	/**
	 * Finds the first entry that satisfies the provided testing function.
	 * @param callback Function to test each entry.
	 * @returns The first entry that satisfies the testing function, or undefined if none found.
	 */
	find(callback: (entry: Entry, index: number, array: Entry[]) => boolean): Entry | undefined {
		return this.entries.find(callback);
	}

	/**
	 * Filters the entries based on the provided testing function.
	 * @param callback Function to test each entry.
	 * @returns New Entries instance with entries that satisfy the testing function.
	 */
	filter(callback: (entry: Entry, index: number, array: Entry[]) => boolean): Entries {
		return new Entries(this.entries.filter(callback));
	}

	/**
	 * Gets the number of entries.
	 * @returns Number of entries.
	 */
	get length(): number {
		return this.entries.length;
	}

	/**
	 * Gets the entry at the specified index.
	 * @param index Index of the entry to retrieve.
	 * @returns The entry at the specified index, or undefined if out of bounds.
	 */
	get(index: number): Entry | undefined {
		return this.entries[index];
	}

	/**
	 * Converts the Entries instance to a plain array of Entry objects.
	 * @returns Array of Entry objects.
	 */
	toArray(): Entry[] {
		return this.entries;
	}
}
