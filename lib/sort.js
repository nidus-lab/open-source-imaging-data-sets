/**
 * Sort by name property
 */
export const nameSort = (a, b) => {
   const nameA = a['Dataset Name'] || a['Name'] || '';
   const nameB = b['Dataset Name'] || b['Name'] || '';
   if (nameA < nameB) return -1
   if (nameA > nameB) return 1
   return 0
}

/**
 * Basic search which matches search string again title and URL's present in data
 */
export const textSearch = (search, data) => data.filter(entry => {
   const name = entry['Dataset Name'] || entry['Name'] || '';
   return name.toLowerCase().indexOf(search.toLowerCase()) > -1;
}).sort(nameSort)

/**
 * Multi column boolean search (E.G. Imaging type - xray)
 */
export const booleanMultiColumnSearch = (type, identifiers, data) => data.filter(entry => (
   identifiers.filter(identifier => entry[`${type} - ${identifier}`] == "TRUE").length > 0
)).sort(nameSort)


/**
 * Single column boolean search (E.G. Open access)
 */
export const booleanColumnSearch = (column, data) => data.filter(entry => (
   entry[column] == "TRUE"
)).sort(nameSort)

/**
 * Value column search - filters data based on specific column values
 */
export const valueColumnSearch = (column, filterValues, data) => data.filter(entry => (
   filterValues.some(value => entry[column] === value)
)).sort(nameSort)

/**
 * Comma-separated value search - filters data based on values within comma-separated strings
 */
export const commaSeparatedValueSearch = (column, filterValues, data) => data.filter(entry => {
   const entryValues = entry[column] ? entry[column].split(',').map(item => item.trim()) : []
   return filterValues.some(value => entryValues.includes(value))
}).sort(nameSort)
