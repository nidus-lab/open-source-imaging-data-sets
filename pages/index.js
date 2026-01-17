import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { SearchIcon } from "@heroicons/react/outline"
import { prefix } from "lib/prefix"
import { parseFile } from "lib/csv"
import { Popover } from "@headlessui/react"
import { usePopper } from "react-popper"
import { booleanColumnSearch, valueColumnSearch, commaSeparatedValueSearch, nameSort, textSearch } from "lib/sort"
import Container from "components/Container"
import Footer from "components/Footer"
import Header from "components/Header"
import Button from "components/Button"
import Select from "components/Select"
const Introduction = () => (
   <section className={`flex duration-500 ease-in-out`}>
      <div className="flex-1 flex flex-col justify-center py-6 sm:py-12">
         <Container>
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-center tracking-tighter leading-tight text-gray-800">
               A collection of open access ultrasound imaging data sets.
            </h1>
         </Container>
      </div>
   </section>
)

const EntryTags = ({ entry, column, bgColor, textColor, limit = 3 }) => {

   // Propper config
   let [referenceElement, setReferenceElement] = useState()
   let [popperElement, setPopperElement] = useState()
   let { styles, attributes } = usePopper(referenceElement, popperElement, {
      placement: "top",
      modifiers: [
         {
            name: "offset",
            options: {
               offset: [0, 8]
            }
         }
      ]
   })

   // Tag processing for comma-separated values
   const entryValue = entry[column]
   const matches = entryValue ? entryValue.split(',').map(item => item.trim()).filter(Boolean) : []
   const overflow = matches.slice(limit, matches.length + 1)
   const badgeClass = `${bgColor ? bgColor : 'bg-green-500'} ${textColor ? textColor : 'text-white'} text-xs rounded px-2 py-1 flex-shrink-0`

   // Render
   return (
      <div className="flex flex-shrink-0 space-x-2 mt-3">
         {
            matches.slice(0, limit).map(tag => (
               <div key={tag} className={badgeClass}>
                  {tag}
               </div>
            ))
         }
         {
            overflow.length > 0 && (
               <Popover>

                  {/* Button */}
                  <Popover.Button
                     ref={setReferenceElement}
                     className={badgeClass}
                  >
                     + {overflow.length} more
                  </Popover.Button>

                  {/* Panel */}
                  <Popover.Panel
                     ref={setPopperElement}
                     style={styles.popper}
                     {...attributes.popper}
                  >
                     <div className={badgeClass}>
                        {overflow.join(', ')}
                     </div>
                     <div className="position absolute top-full left-0 right-0">
                        <div className="flex justify-center">
                           <div class="w-4 overflow-hidden inline-block">
                              <div class={`h-2 w-2 -rotate-45 transform origin-top-left ${bgColor ? bgColor : 'bg-green-500'}`}></div>
                           </div>
                        </div>
                     </div>
                  </Popover.Panel>
               </Popover>
            )
         }
      </div>
   )
}

const DataList = ({ query, setQuery }) => {

   // Local state
   const [headers, setHeaders] = useState([])
   const [data, setData] = useState([])
   const [showFilters, setShowFilters] = useState(false)
   const [activeFilters, setActiveFilters] = useState({})

   // Filter data
   const filterData = () => {

      // Check if we have data to filter
      if (data.length == 0) return []

      // Check we have filters to process
      if (!accessFilters && !query) return data

      // Result set
      let results = data

      // Text search
      if (query)
         results = results.filter(item1 => textSearch(query, data).some(item2 => (item1['Dataset Name'] || item1['Name']) === (item2['Dataset Name'] || item2['Name'])))

      // Column filters for comma-separated values
      if (activeFilters['Clinical Application'] && activeFilters['Clinical Application'][0] !== '') {
         results = results.filter(item1 => commaSeparatedValueSearch('Clinical Application', activeFilters['Clinical Application'], data).some(item2 => (item1['Dataset Name'] || item1['Name']) === (item2['Dataset Name'] || item2['Name'])))
      }

      if (activeFilters['Modalities'] && activeFilters['Modalities'][0] !== '') {
         results = results.filter(item1 => commaSeparatedValueSearch('Modalities', activeFilters['Modalities'], data).some(item2 => (item1['Dataset Name'] || item1['Name']) === (item2['Dataset Name'] || item2['Name'])))
      }

      // Access
      if (activeFilters['licence'] && activeFilters['licence'][0] !== '') {
         const licenceValue = activeFilters['licence'][0]
         results = results.filter(item1 => valueColumnSearch('Licence', [licenceValue], data).some(item2 => (item1['Dataset Name'] || item1['Name']) === (item2['Dataset Name'] || item2['Name'])))
      }

      // Merge and return
      return results
   }

   // Computed data for comma-separated values
   const columnFilters = useMemo(() => {
      if (data.length === 0) return { 'Clinical Application': [], 'Modalities': [], 'Licence': [] }

      // Extract all values from comma-separated lists
      const clinicalApplicationValues = [...new Set(
         data.flatMap(entry =>
            entry['Clinical Application'] ?
               entry['Clinical Application'].split(',').map(item => item.trim()).filter(Boolean) :
               []
         )
      )]

      const modalitiesValues = [...new Set(
         data.flatMap(entry =>
            entry['Modalities'] ?
               entry['Modalities'].split(',').map(item => item.trim()).filter(Boolean) :
               []
         )
      )]

      const licenceValues = [...new Set(
         data.flatMap(entry =>
            entry['Licence'] ?
               [entry['Licence'].trim()] :
               []
         )
      )]

      return {
         'Clinical Application': clinicalApplicationValues,
         'Modalities': modalitiesValues,
         'Licence': licenceValues
      }
   }, [data])
   const filteredData = useMemo(() => filterData(), [data, activeFilters, columnFilters, query])

   // Get marker data, parse + store
   const getData = async () => {

      // Parse file
      const data = await parseFile('/data/ultrasound_dataset_complete.csv')

      // Remove headers
      const headers = data.shift()

      // Loop and create associative array
      let rows = []
      for (let i = 0; i < data.length; i++) {
         rows[i] = []
         for (let j = 0; j < headers.length; j++) {
            rows[i][headers[j]] = data[i][j]
         }
      }

      // Set headers
      setHeaders(headers)

      // Set data
      setData([...rows.sort(nameSort)])

   }

   // On load, get markers
   useEffect(() => {
      getData()
   }, [])

   return (
      <section className={`pt-2 pb-6 duration-500 ease-in-out`}>
         <Container>
            <div className={`relative bg-white border border-gray-100 shadow-xl rounded-xl`}>
               <div className="py-6 bg-white rounded-t-xl sticky top-0 px-6">
                  <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:space-x-4 sm:items-center">
                     <div className="relative flex-1">
                        <div className="absolute top-0 left-0 p-3">
                           <SearchIcon className="w-4 h-4 text-gray-800" />
                        </div>
                        <input
                           type="text"
                           value={query}
                           onChange={(e) => setQuery(e.target.value)}
                           className="w-full border-gray-300 pl-10 pr-3 py-2 sm:text-sm text-gray-800 focus:ring-blue-500 focus:ring-2 focus:border-transparent focus:ring-offset-1"
                           placeholder="Search datasets"
                        />
                     </div>
                     <div className="flex flex-col items-stretch">
                        <Button type="button" color="blue" onClick={() => setShowFilters(!showFilters)}>
                           {showFilters ? 'Hide filters' : 'Filter datasets'}
                        </Button>
                     </div>
                  </div>
                  {
               showFilters && (
                  <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:space-x-4 mt-3 mb-2 sm:items-center">
                     <div className="flex-1">
                        <Select
                           label="Modalities"
                           onSelect={({ value, label }) => setActiveFilters({
                              ...activeFilters,
                              'Modalities': [value]
                           })}
                           options={
                              [{ label: 'Select a type', value: '' }].concat(
                                 (columnFilters['Modalities'] || []).map(entry => ({ value: entry, label: entry }))
                              )
                           }
                        />
                     </div>
                     <div className="flex-1">
                        <Select
                           label="Clinical Application"
                           onSelect={({ value, label }) => setActiveFilters({
                              ...activeFilters,
                              'Clinical Application': [value]
                           })}
                           options={
                              [{ label: 'Select a type', value: '' }].concat(
                                 (columnFilters['Clinical Application'] || []).map(entry => ({ value: entry, label: entry }))
                              )
                           }
                        />
                     </div>
                     <div className="flex-1">
                        <Select
                           label="Licence"
                           onSelect={({ value, label }) => setActiveFilters({
                              ...activeFilters,
                              'licence': [value]
                           })}
                           options={
                              [{ label: 'Select a licence', value: '' }].concat(
                                 (columnFilters['Licence'] || []).map(entry => ({ value: entry, label: entry }))
                              )
                           }
                        />
                     </div>
                  </div>
               )
                  }
               </div>
               <div>
                  {
                     filteredData.length > 0 ? (
                        <div className="flex flex-col">
                           <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                              <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                                 <div className="overflow-hidden border-b border-gray-200">
                                    <table className="min-w-full divide-y divide-gray-200">
                                       <thead className="bg-gray-50">
                                          <tr>
                                             <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                                             >
                                                Name
                                             </th>
                                             <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                                             >
                                                Details
                                             </th>
                                             <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                                             >
                                                Availability
                                             </th>
                                             <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                                             >
                                                Licence / Access
                                             </th>
                                          </tr>
                                       </thead>
                                       <tbody className="divide-y divide-gray-200">
                                          {filteredData.map((entry, index) => (
                                             <tr key={index}>
                                                <td className="px-6 py-4">
                                                   <div className="flex space-x-2 items-start">
                                                      <Link href={entry['Link'] || entry['URL'] || '#'}>
                                                         <a target="_blank" className="block text-sm underline font-medium text-gray-900 duration-100 hover:text-gray-500">{entry['Dataset Name'] || entry['Name'] || '-'}</a>
                                                      </Link>
                                                   </div>
                                                   <span className="block text-sm text-gray-500 mt-1">{entry['Notes'] || entry['Data notes']}</span>
                                                   <div className="flex space-x-2 items-start">
                                                      <EntryTags entry={entry} column="Modalities" />
                                                      <EntryTags entry={entry} column="Clinical Application" bgColor="bg-blue-500" textColor="text-white" />
                                                   </div>
                                                   {entry['DOI'] && (
                                                      <span className="block text-xs text-gray-400 mt-1">DOI: {entry['DOI']}</span>
                                                   )}
                                                   {entry['Source'] && (
                                                      <span className="block text-xs text-gray-400 mt-1">Source: {entry['Source']}</span>
                                                   )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                   <div>Subjects: {entry['Subjects'] || 'N/A'}</div>
                                                   <div className="mt-1">Reg. Patients: {entry['Registraition Type of Patients']}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                   <div className="flex flex-col space-y-1">
                                                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${entry['Segmentaitions Available'] === 'Y' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                         Seg: {entry['Segmentaitions Available']}
                                                      </span>
                                                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${entry['Landmarks Available'] === 'Y' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                         Landmarks: {entry['Landmarks Available']}
                                                      </span>
                                                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${entry['Meshes (STL) Available'] === 'Y' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                         Meshes: {entry['Meshes (STL) Available']}
                                                      </span>
                                                   </div>
                                                </td>
                                                <td className="px-6 py-4 flex flex-col space-y-2 items-start">
                                                   {entry['Licence'] && (
                                                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 whitespace-normal">
                                                         {entry['Licence']}
                                                      </span>
                                                   )}
                                                   {entry['Tracking / Pose Data'] === 'Y' && (
                                                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                         Tracking Data
                                                      </span>
                                                   )}
                                                   {entry['Ground-Truth Transformations'] === 'Y' && (
                                                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                         GT Xforms
                                                      </span>
                                                   )}
                                                </td>
                                             </tr>
                                          ))}
                                       </tbody>
                                    </table>
                                 </div>
                              </div>
                           </div>
                        </div>
                     ) : (
                        <div className="text-center text-sm py-6 text-gray-600">
                           No results found.
                        </div>
                     )
                  }
               </div>
            </div>
         </Container>
      </section >
   )
}


export default function Home() {

   // Local state
   const [query, setQuery] = useState('')

   return (
      <div className="relative flex flex-col min-h-screen bg-gray-50">

         {/* Pattern bg */}
         <div className="absolute inset-0 z-[1] pointer-events-none bg-repeat bg-[length:50px_50px] opacity-[3%]" style={{ backgroundImage: `url(${prefix}/hideout.svg)` }}></div>

         {/* Above the fold */}
         <div className="relative z-[3] flex flex-col">
            <Header />
            <Introduction />
         </div>

         {/* Data list */}
         <div className="relative z-[3]">
            <DataList query={query} setQuery={setQuery} />
            <Footer />
         </div>
      </div>
   )
}
