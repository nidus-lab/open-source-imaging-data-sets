import fs from "fs/promises"
import path from "path"
import { useMemo, useState } from "react"
import {
   AdjustmentsIcon,
   ChevronDownIcon,
   ChevronUpIcon,
   DownloadIcon,
   ExternalLinkIcon,
   SearchIcon,
   XIcon
} from "@heroicons/react/outline"
import { parseCsvText, rowsToObjects } from "lib/csv"
import { nameSort } from "lib/sort"
import { prefix } from "lib/prefix"
import Container from "components/Container"
import Footer from "components/Footer"
import Header from "components/Header"
import Button from "components/Button"
import Select from "components/Select"

const LOCAL_CSV_PATH = "/data/ultrasound-datasets.csv"
const LOCAL_XLSX_PATH = "/data/ultrasound-datasets.xlsx"
const LOCAL_META_PATH = "/data/ultrasound-datasets.meta.json"
const GOOGLE_SHEET_XLSX_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ2sELYivSNVPtldwGXsAFoaaWEiNo_oaua6DIok4UyBcHtsGf1lITnhNU_UA3fVPFDve2zvNaLTvgU/pub?output=xlsx"
const NIDUS_LAB_URL = "https://www.nidusai.ca/"
const RADOSS_URL = "https://radoss.org/"
const EMPTY_FILTERS = {
   modalities: [],
   application: [],
   licence: []
}

const cleanValue = (value, fallback = "") => {
   if (value === null || value === undefined) return fallback

   const cleaned = String(value)
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim()

   return cleaned || fallback
}

const splitValues = (value) => (
   cleanValue(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
)

const valuesToOptions = (values) => values.map((value) => ({ value, label: value }))
const normaliseSelectedOptions = (values) => {
   if (Array.isArray(values)) return values
   if (!values) return []
   return [values]
}
const truncateText = (value, maxLength = 220) => {
   const cleaned = cleanValue(value)
   if (cleaned.length <= maxLength) return cleaned
   return `${cleaned.slice(0, maxLength).trimEnd()}...`
}

const getLicenceTone = (licenceValue) => {
   const normalised = cleanValue(licenceValue, "Not specified").toLowerCase()

   const isUnspecified = [
      "not specified",
      "not stated",
      "unknown",
      "not listed"
   ].some((term) => normalised.includes(term))

   if (isUnspecified) {
      return "licenceUnspecified"
   }

   const isResearchRestricted = [
      "non-commercial",
      "non commercial",
      "research use",
      "controlled data access",
      "access required",
      "cc by nc",
      "cc-by-nc",
      "cc by-nc",
      "cc-by nc",
      "cc by nc sa",
      "cc-by-nc-sa",
      "cc by-nc-sa",
      "cc-by nc sa",
      "cc by-nc-sa",
      "cc by-nc",
      "cc by nc 3.0",
      "cc by nc 4.0"
   ].some((term) => normalised.includes(term))

   if (isResearchRestricted) {
      return "licenceResearch"
   }

   return "licenceCommercial"
}

const getLicenceSortPriority = (entry) => {
   const licenceTone = getLicenceTone(entry["Licence"])

   switch (licenceTone) {
      case "licenceCommercial":
         return 0
      case "licenceResearch":
         return 1
      case "licenceUnspecified":
      default:
         return 2
   }
}

const isAffirmative = (value) => {
   const normalised = cleanValue(value).toLowerCase()
   return ["y", "yes", "true"].includes(normalised)
}

const getDatasetName = (entry) => cleanValue(entry["Dataset Name"] || entry["Name"], "Untitled dataset")

const formatDate = (dateString) => {
   if (!dateString) return "Unknown"

   return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC"
   }).format(new Date(dateString))
}

const DownloadLink = ({ href, children, subtle = false, external = false, download = false }) => (
   <a
      href={href}
      download={download}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={`inline-flex min-w-0 items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition-colors ${subtle
         ? "border-slate-300 bg-white/70 text-slate-700 hover:bg-white hover:text-slate-900"
         : "border-sky-600 bg-sky-600 text-white hover:border-sky-700 hover:bg-sky-700"
         }`}
   >
      {children}
   </a>
)

const Badge = ({ children, tone = "slate" }) => {
   const tones = {
      slate: "bg-slate-100 text-slate-700",
      sky: "bg-sky-100 text-sky-700",
      emerald: "bg-emerald-100 text-emerald-700",
      amber: "bg-amber-100 text-amber-700"
   }

   return (
      <span className={`inline-flex max-w-full break-words rounded-full px-3 py-1 text-xs font-semibold ${tones[tone] || tones.slate}`}>
         {children}
      </span>
   )
}

const EntryTags = ({ entry, column, tone = "slate" }) => {
   const values = splitValues(entry[column])

   if (!values.length) return null

   return (
      <div className="flex flex-wrap gap-2">
         {values.map((tag) => (
            <Badge key={`${column}-${tag}`} tone={tone}>
               {tag}
            </Badge>
         ))}
      </div>
   )
}

const MetadataItem = ({ label, value, tone = "default" }) => {
   const tones = {
      default: {
         container: "bg-slate-50",
         label: "text-slate-500",
         value: "text-slate-700"
      },
      licenceUnspecified: {
         container: "border border-rose-200 bg-rose-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]",
         label: "text-rose-700",
         value: "text-rose-950"
      },
      licenceResearch: {
         container: "border border-orange-200 bg-orange-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]",
         label: "text-orange-700",
         value: "text-orange-950"
      },
      licenceCommercial: {
         container: "border border-emerald-200 bg-emerald-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]",
         label: "text-emerald-700",
         value: "text-emerald-950"
      }
   }

   const selectedTone = tones[tone] || tones.default

   return (
      <div className={`min-w-0 rounded-2xl px-4 py-3 ${selectedTone.container}`}>
         <div className={`text-xs font-semibold uppercase tracking-[0.18em] ${selectedTone.label}`}>{label}</div>
         <div className={`mt-1 break-words text-sm font-medium ${selectedTone.value}`}>{value}</div>
      </div>
   )
}

const AvailabilityPill = ({ label, value }) => (
   <Badge tone={value ? "emerald" : "slate"}>
      {label}: {value ? "Yes" : "No"}
   </Badge>
)

const DatasetCard = ({ entry }) => {
   const [isExpanded, setIsExpanded] = useState(false)
   const datasetUrl = cleanValue(entry["Link"] || entry["URL"])
   const notes = cleanValue(entry["Notes"] || entry["Data notes"], "No extra notes provided.")
   const licence = cleanValue(entry["Licence"], "Not listed")
   const licenceTone = getLicenceTone(licence)
   const source = cleanValue(entry["Source"], "Not listed")
   const subjects = cleanValue(entry["Subjects"], "Not listed")
   const patientRegistration = cleanValue(entry["Registraition Type of Patients"], "Not listed")
   const doi = cleanValue(entry["DOI"], "Not listed")
   const score = cleanValue(entry["SonoMQS Score"])
   const summaryNotes = isExpanded ? notes : truncateText(notes)

   return (
      <article className="flex min-w-0 flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white/95 p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.55)] ring-1 ring-white/70 md:p-6">
         <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
               <h2 className="break-words text-xl font-semibold tracking-tight text-slate-900">
                  {datasetUrl ? (
                     <a
                        href={datasetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-w-0 items-start gap-2 hover:text-sky-700"
                     >
                        <span className="break-words">{getDatasetName(entry)}</span>
                        <ExternalLinkIcon className="mt-1 h-4 w-4 flex-shrink-0" />
                     </a>
                  ) : (
                     getDatasetName(entry)
                  )}
               </h2>
               <p className="mt-3 break-words text-sm leading-6 text-slate-600">{summaryNotes}</p>
            </div>
            {score && (
               <div className="rounded-2xl bg-amber-50 px-4 py-3 text-right text-sm font-semibold text-amber-800">
                  SonoMQS
                  <div className="text-2xl tracking-tight">{score}</div>
               </div>
            )}
         </div>

         <div className="mt-4 flex flex-wrap gap-2">
            <EntryTags entry={entry} column="Modalities" tone="emerald" />
            <EntryTags entry={entry} column="Clinical Application" tone="sky" />
         </div>

         <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MetadataItem label="Subjects" value={subjects} />
            <MetadataItem label="Licence / Access" value={licence} tone={licenceTone} />
            <MetadataItem label="Source" value={source} />
         </div>

         <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <div className="flex flex-wrap gap-3">
               {datasetUrl && (
                  <a
                     href={datasetUrl}
                     target="_blank"
                     rel="noreferrer"
                     className="inline-flex items-center gap-2 font-semibold text-sky-700 hover:text-sky-800"
                  >
                     Visit dataset
                     <ExternalLinkIcon className="h-4 w-4" />
                  </a>
               )}
               {doi && doi !== "Not listed" && (
                  <span className="text-sm text-slate-600">
                     <span className="font-semibold text-slate-700">DOI:</span> {doi}
                  </span>
               )}
            </div>
            <button
               type="button"
               onClick={() => setIsExpanded((current) => !current)}
               aria-expanded={isExpanded}
               className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-sky-200 hover:text-sky-800"
            >
               {isExpanded ? "Show less" : "Show more"}
               {isExpanded ? (
                  <ChevronUpIcon className="h-4 w-4" />
               ) : (
                  <ChevronDownIcon className="h-4 w-4" />
               )}
            </button>
         </div>

         {isExpanded && (
            <div className="mt-5 space-y-5 border-t border-slate-100 pt-5">
               <div className="grid gap-3 sm:grid-cols-2">
                  <MetadataItem label="Patient Registration" value={patientRegistration} />
               </div>

               <div className="flex flex-wrap gap-2">
                  <AvailabilityPill label="Segmentations" value={isAffirmative(entry["Segmentaitions Available"])} />
                  <AvailabilityPill label="Landmarks" value={isAffirmative(entry["Landmarks Available"])} />
                  <AvailabilityPill label="Meshes" value={isAffirmative(entry["Meshes (STL) Available"])} />
                  <AvailabilityPill label="Tracking" value={isAffirmative(entry["Tracking / Pose Data"])} />
                  <AvailabilityPill label="GT transforms" value={isAffirmative(entry["Ground-Truth Transformations"])} />
               </div>
            </div>
         )}
      </article>
   )
}

const Introduction = ({ datasetCount, refreshedAt }) => (
   <section className="relative overflow-hidden pt-4 pb-10 sm:pt-8 sm:pb-14">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.16),_transparent_34%)]" />
      <Container>
         <div className="relative overflow-hidden rounded-[32px] border border-white/60 bg-white/80 px-6 py-8 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.65)] backdrop-blur md:px-10 md:py-10">
            <div className="absolute inset-0 pointer-events-none bg-repeat opacity-[0.035]" style={{ backgroundImage: `url(${prefix}/hideout.svg)` }} />
            <div className="relative grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-end">
               <div className="min-w-0">
                  <div className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                     Open access ultrasound datasets
                  </div>
                  <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                     Find open-access ultrasound datasets faster.
                  </h1>
                  <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
                     Search a curated directory of ultrasound datasets for research, benchmarking, and tool development. Filter by modality, clinical application, or licence, then download the spreadsheet if you want to work offline.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                     <DownloadLink href={`${prefix}${LOCAL_XLSX_PATH}`} download>
                        <DownloadIcon className="h-4 w-4 flex-shrink-0" />
                        Download Excel
                     </DownloadLink>
                     <DownloadLink href={`${prefix}${LOCAL_CSV_PATH}`} download subtle>
                        <DownloadIcon className="h-4 w-4 flex-shrink-0" />
                        Download CSV
                     </DownloadLink>
                     <DownloadLink href={GOOGLE_SHEET_XLSX_URL} external subtle>
                        <ExternalLinkIcon className="h-4 w-4 flex-shrink-0" />
                        View source spreadsheet
                     </DownloadLink>
                  </div>
                  <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                     <span className="font-medium text-slate-700">Maintained by</span>
                     <a
                        href={NIDUS_LAB_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-slate-700 transition-colors hover:border-sky-200 hover:text-sky-700"
                     >
                        <img src={`${prefix}/logo-lab.png`} alt="NIDUS Lab" className="h-5 w-auto" />
                        <span className="font-medium">NIDUS Lab</span>
                     </a>
                     <a
                        href={RADOSS_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-slate-700 transition-colors hover:border-sky-200 hover:text-sky-700"
                     >
                        <img src={`${prefix}/radoss-logo.png`} alt="RadOSS" className="h-6 w-auto" />
                        <span className="font-medium">RadOSS</span>
                     </a>
                  </div>
               </div>
               <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <div className="rounded-[28px] border border-slate-200 bg-slate-900 px-5 py-5 text-white">
                     <div className="text-sm font-medium text-slate-300">Datasets in directory</div>
                     <div className="mt-2 text-4xl font-semibold tracking-tight">{datasetCount}</div>
                     <div className="mt-2 text-sm text-slate-300">Search by name, notes, modality, clinical application, source, DOI, or licence.</div>
                  </div>
                  <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 px-5 py-5 text-emerald-950">
                     <div className="text-sm font-medium text-emerald-700">Last updated</div>
                     <div className="mt-2 text-lg font-semibold tracking-tight">{refreshedAt}</div>
                     <div className="mt-2 text-sm text-emerald-800">Built from the latest cached spreadsheet snapshot so you can browse and download it without leaving the site.</div>
                  </div>
               </div>
            </div>
         </div>
      </Container>
   </section>
)

const DataList = ({ data }) => {
   const [query, setQuery] = useState("")
   const [showFilters, setShowFilters] = useState(false)
   const [activeFilters, setActiveFilters] = useState(EMPTY_FILTERS)

   const columnFilters = useMemo(() => {
      const uniqueValues = (column, splitCommaSeparated = true) => (
         [...new Set(
            data.flatMap((entry) => {
               const rawValue = cleanValue(entry[column])
               if (!rawValue) return []
               return splitCommaSeparated ? splitValues(rawValue) : [rawValue]
            })
         )].sort((left, right) => left.localeCompare(right))
      )

      return {
         modalities: uniqueValues("Modalities"),
         applications: uniqueValues("Clinical Application"),
         licences: uniqueValues("Licence", false)
      }
   }, [data])

   const filteredData = useMemo(() => {
      const searchQuery = cleanValue(query).toLowerCase()
      const matchesSelectedValues = (entryValues, selectedValues) => (
         selectedValues.length === 0 || selectedValues.some((value) => entryValues.includes(value))
      )

      return data.filter((entry) => {
         const searchBlob = [
            getDatasetName(entry),
            cleanValue(entry["Notes"] || entry["Data notes"]),
            cleanValue(entry["Source"]),
            cleanValue(entry["Clinical Application"]),
            cleanValue(entry["Modalities"]),
            cleanValue(entry["DOI"]),
            cleanValue(entry["Licence"])
         ].join(" ").toLowerCase()

         if (searchQuery && !searchBlob.includes(searchQuery)) {
            return false
         }

         if (!matchesSelectedValues(splitValues(entry["Modalities"]), activeFilters.modalities)) {
            return false
         }

         if (!matchesSelectedValues(splitValues(entry["Clinical Application"]), activeFilters.application)) {
            return false
         }

         if (!matchesSelectedValues([cleanValue(entry["Licence"])], activeFilters.licence)) {
            return false
         }

         return true
      }).sort((left, right) => {
         const priorityDifference = getLicenceSortPriority(left) - getLicenceSortPriority(right)

         if (priorityDifference !== 0) {
            return priorityDifference
         }

         return getDatasetName(left).localeCompare(getDatasetName(right))
      })
   }, [activeFilters, data, query])

   const activeFilterCount = Object.values(activeFilters).reduce((count, values) => count + values.length, 0)
   const hasActiveFilters = activeFilterCount > 0 || Boolean(cleanValue(query))

   return (
      <section className="pb-10">
         <Container>
            <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white/90 shadow-[0_30px_80px_-55px_rgba(15,23,42,0.5)]">
               <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                     <div className="min-w-0 flex-1">
                        <div className="relative">
                           <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                           <input
                              type="text"
                              value={query}
                              onChange={(event) => setQuery(event.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                              placeholder="Search datasets, notes, modalities, applications, DOI, or source"
                           />
                        </div>
                     </div>
                     <div className="flex flex-wrap gap-3">
                        <Button type="button" color="outline" onClick={() => setShowFilters(!showFilters)}>
                           <AdjustmentsIcon className="h-4 w-4 flex-shrink-0" />
                           {showFilters ? "Hide filters" : "Show filters"}
                        </Button>
                        {hasActiveFilters && (
                           <Button
                              type="button"
                              color="white"
                              onClick={() => {
                                 setQuery("")
                                 setActiveFilters(EMPTY_FILTERS)
                              }}
                           >
                              <XIcon className="h-4 w-4 flex-shrink-0" />
                              Clear all
                           </Button>
                        )}
                     </div>
                  </div>

                  {showFilters && (
                     <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <Select
                           label="Modalities"
                           multiple
                           placeholder="All modalities"
                           value={valuesToOptions(activeFilters.modalities)}
                           onSelect={(values) => setActiveFilters((current) => ({
                              ...current,
                              modalities: normaliseSelectedOptions(values).map(({ value }) => value)
                           }))}
                           options={columnFilters.modalities.map((entry) => ({ value: entry, label: entry }))}
                        />
                        <Select
                           label="Clinical Application"
                           multiple
                           placeholder="All applications"
                           value={valuesToOptions(activeFilters.application)}
                           onSelect={(values) => setActiveFilters((current) => ({
                              ...current,
                              application: normaliseSelectedOptions(values).map(({ value }) => value)
                           }))}
                           options={columnFilters.applications.map((entry) => ({ value: entry, label: entry }))}
                        />
                        <Select
                           label="Licence"
                           multiple
                           placeholder="All licences"
                           value={valuesToOptions(activeFilters.licence)}
                           onSelect={(values) => setActiveFilters((current) => ({
                              ...current,
                              licence: normaliseSelectedOptions(values).map(({ value }) => value)
                           }))}
                           options={columnFilters.licences.map((entry) => ({ value: entry, label: entry }))}
                        />
                     </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                     <Badge tone="sky">{filteredData.length} results</Badge>
                     {activeFilterCount > 0 && <Badge>{activeFilterCount} filters active</Badge>}
                     {!showFilters && (
                        <span className="text-slate-500">Toggle filters to narrow the directory without losing space on small screens.</span>
                     )}
                  </div>
               </div>

               <div className="px-5 py-6 sm:px-6">
                  {filteredData.length > 0 ? (
                     <div className="grid gap-5 xl:grid-cols-2">
                        {filteredData.map((entry, index) => (
                           <DatasetCard key={`${getDatasetName(entry)}-${index}`} entry={entry} />
                        ))}
                     </div>
                  ) : (
                     <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center text-sm text-slate-600">
                        No datasets matched the current search and filter settings.
                     </div>
                  )}
               </div>
            </div>
         </Container>
      </section>
   )
}

export default function Home({ data = [], refreshedAt = "Unknown" }) {
   return (
      <div className="relative min-h-screen overflow-x-hidden bg-slate-50">
         <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.09),_transparent_32%),radial-gradient(circle_at_80%_20%,_rgba(16,185,129,0.08),_transparent_22%)]" />
         <div className="relative z-10">
            <Header />
            <Introduction datasetCount={data.length} refreshedAt={refreshedAt} />
            <DataList data={data} />
            <Footer />
         </div>
      </div>
   )
}

export async function getStaticProps() {
   const csvPath = path.join(process.cwd(), "public", LOCAL_CSV_PATH.replace(/^\//, ""))
   const metaPath = path.join(process.cwd(), "public", LOCAL_META_PATH.replace(/^\//, ""))
   const csvText = await fs.readFile(csvPath, "utf8")
   const metaText = await fs.readFile(metaPath, "utf8")
   const parsedRows = await parseCsvText(csvText)
   const { data } = rowsToObjects(parsedRows)
   const metadata = JSON.parse(metaText)

   return {
      props: {
         data: [...data].sort(nameSort),
         refreshedAt: formatDate(metadata.refreshedAt)
      }
   }
}
