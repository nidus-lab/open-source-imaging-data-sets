const fs = require("fs/promises")
const path = require("path")
const https = require("https")
const http = require("http")
const { URL } = require("url")

const SHEET_BASE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ2sELYivSNVPtldwGXsAFoaaWEiNo_oaua6DIok4UyBcHtsGf1lITnhNU_UA3fVPFDve2zvNaLTvgU/pub"
const OUTPUT_DIR = path.join(process.cwd(), "public", "data")
const CSV_FILENAME = "ultrasound-datasets.csv"
const XLSX_FILENAME = "ultrasound-datasets.xlsx"
const META_FILENAME = "ultrasound-datasets.meta.json"
const REQUEST_TIMEOUT_MS = 30000

const withCacheBust = (url) => {
  const parsedUrl = new URL(url)
  parsedUrl.searchParams.set("cachebust", Date.now().toString())
  return parsedUrl.toString()
}

const fetchBuffer = (url, redirectCount = 0) => (
  new Promise((resolve, reject) => {
    const transport = url.startsWith("https:") ? https : http

    const request = transport.get(url, {
      agent: false,
      headers: {
        "Cache-Control": "no-cache, no-store, max-age=0",
        "Pragma": "no-cache"
      }
    }, (response) => {
      const statusCode = response.statusCode || 500

      if (statusCode >= 300 && statusCode < 400 && response.headers.location) {
        if (redirectCount > 5) {
          response.resume()
          reject(new Error(`Too many redirects while fetching ${url}`))
          return
        }

        const nextUrl = new URL(response.headers.location, url).toString()
        response.resume()
        resolve(fetchBuffer(nextUrl, redirectCount + 1))
        return
      }

      if (statusCode < 200 || statusCode >= 300) {
        response.resume()
        reject(new Error(`Request to ${url} failed with status ${statusCode}`))
        return
      }

      const chunks = []

      response.on("data", (chunk) => {
        chunks.push(chunk)
      })

      response.on("end", () => {
        resolve(Buffer.concat(chunks))
      })

      response.on("error", reject)
    })

    request.setTimeout(REQUEST_TIMEOUT_MS, () => {
      request.destroy(new Error(`Request to ${url} timed out after ${REQUEST_TIMEOUT_MS}ms`))
    })
    request.on("error", reject)
  })
)

const writeFileIfPresent = async (filePath, buffer) => {
  await fs.writeFile(filePath, buffer)
  console.log(`Saved ${path.relative(process.cwd(), filePath)}`)
}

const syncCache = async () => {
  const csvPath = path.join(OUTPUT_DIR, CSV_FILENAME)
  const xlsxPath = path.join(OUTPUT_DIR, XLSX_FILENAME)
  const metaPath = path.join(OUTPUT_DIR, META_FILENAME)
  const sourceCsvUrl = withCacheBust(`${SHEET_BASE_URL}?output=csv`)
  const sourceXlsxUrl = withCacheBust(`${SHEET_BASE_URL}?output=xlsx`)

  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  try {
    const [csvBuffer, xlsxBuffer] = await Promise.all([
      fetchBuffer(sourceCsvUrl),
      fetchBuffer(sourceXlsxUrl)
    ])

    await Promise.all([
      writeFileIfPresent(csvPath, csvBuffer),
      writeFileIfPresent(xlsxPath, xlsxBuffer),
      fs.writeFile(metaPath, JSON.stringify({
        refreshedAt: new Date().toISOString(),
        sourceCsvUrl: `${SHEET_BASE_URL}?output=csv`,
        sourceXlsxUrl: `${SHEET_BASE_URL}?output=xlsx`
      }, null, 2))
    ])

    console.log("Dataset cache refreshed from Google Sheets.")
  } catch (error) {
    const cachedFiles = await Promise.allSettled([
      fs.access(csvPath),
      fs.access(xlsxPath),
      fs.access(metaPath)
    ])
    const hasCachedFiles = cachedFiles.every((result) => result.status === "fulfilled")

    if (!hasCachedFiles) {
      throw error
    }

    console.warn("Unable to refresh spreadsheet cache, keeping the existing local snapshot.")
    console.warn(error.message)
  }
}

syncCache().catch((error) => {
  console.error(error)
  process.exit(1)
})
