import Papa from 'papaparse'
import { prefix } from './prefix'

export const loadFile = async (path) => {
   if (!path) return false
   const url = path.startsWith('http') ? path : `${prefix}${path}`
   const response = await fetch(url, {
      cache: 'no-store'
   })
   const reader = response.body.getReader()
   const decoder = new TextDecoder('utf-8')
   const encoded = await reader.read()
   const decoded = decoder.decode(encoded.value)
   return decoded
}

export const parseCsvText = async (data) => (
   new Promise((resolve, reject) => {
      Papa.parse(data, {
         skipEmptyLines: true,
         complete: (results) => {
            resolve(results.data)
         },
         error: err => {
            reject(err)
         }
      });
   })
)

export const rowsToObjects = (rows) => {
   const parsedRows = [...rows]
   const headers = parsedRows.shift() || []
   const data = parsedRows.map((row) => {
      let entry = {}

      for (let index = 0; index < headers.length; index += 1) {
         entry[headers[index]] = row[index]
      }

      return entry
   })

   return {
      headers,
      data
   }
}

export const parseFile = async (path) => {
   const data = await loadFile(path)
   return parseCsvText(data)
}
