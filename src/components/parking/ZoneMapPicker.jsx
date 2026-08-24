import { useEffect, useMemo, useRef, useState } from "react"
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet"
import {
  Loader2,
  MapPin,
  Search,
  SearchX,
} from "lucide-react"
import "leaflet/dist/leaflet.css"

const DEFAULT_CAMPUS_CENTER = [2.3083, 102.3177]
const DEFAULT_CAMPUS_ZOOM = 16
const SELECTED_ZONE_ZOOM = 18

// Main-campus search boundary around UTeM, Durian Tunggal.
// Nominatim viewbox order: left, top, right, bottom.
const UTEM_SEARCH_VIEWBOX = "102.3030,2.3260,102.3340,2.2910"

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search"
const SEARCH_CACHE_PREFIX = "parkutem-zone-geocode:"

function toFiniteNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeSearchText(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
}

function buildSearchUrl(query) {
  const params = new URLSearchParams({
    format: "jsonv2",
    q: query,
    countrycodes: "my",
    viewbox: UTEM_SEARCH_VIEWBOX,
    bounded: "1",
    limit: "5",
    addressdetails: "1",
    "accept-language": "ms,en",
  })

  return `${NOMINATIM_ENDPOINT}?${params.toString()}`
}

function readCachedResults(query) {
  try {
    const raw = window.sessionStorage.getItem(
      `${SEARCH_CACHE_PREFIX}${query.toLowerCase()}`
    )

    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function cacheResults(query, results) {
  try {
    window.sessionStorage.setItem(
      `${SEARCH_CACHE_PREFIX}${query.toLowerCase()}`,
      JSON.stringify(results)
    )
  } catch {
    // Cache failure must never block map search.
  }
}

function MapClickHandler({ disabled, onPick }) {
  useMapEvents({
    click(event) {
      if (disabled) {
        return
      }

      onPick?.({
        latitude: Number(event.latlng.lat.toFixed(6)),
        longitude: Number(event.latlng.lng.toFixed(6)),
      })
    },
  })

  return null
}

function MapRecenter({ latitude, longitude }) {
  const map = useMap()

  useEffect(() => {
    const lat = toFiniteNumber(latitude)
    const lng = toFiniteNumber(longitude)

    if (lat === null || lng === null) {
      return
    }

    map.flyTo([lat, lng], SELECTED_ZONE_ZOOM, {
      animate: true,
      duration: 0.65,
    })
  }, [latitude, longitude, map])

  return null
}

function ZoneMapPicker({
  latitude,
  longitude,
  label = "Selected parking zone",
  locationName = "",
  zoneName = "",
  disabled = false,
  onChange,
}) {
  const lat = toFiniteNumber(latitude)
  const lng = toFiniteNumber(longitude)
  const hasPosition = lat !== null && lng !== null

  const suggestedSearch = useMemo(() => {
    return normalizeSearchText(locationName || label || zoneName)
  }, [label, locationName, zoneName])

  const [searchQuery, setSearchQuery] = useState(suggestedSearch)
  const [searchResults, setSearchResults] = useState([])
  const [searchError, setSearchError] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const lastAutoSuggestionRef = useRef(suggestedSearch)

  useEffect(() => {
    if (
      searchQuery === lastAutoSuggestionRef.current ||
      normalizeSearchText(searchQuery) === ""
    ) {
      setSearchQuery(suggestedSearch)
      lastAutoSuggestionRef.current = suggestedSearch
    }
  }, [suggestedSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  const initialCenter = hasPosition ? [lat, lng] : DEFAULT_CAMPUS_CENTER
  const initialZoom = hasPosition ? SELECTED_ZONE_ZOOM : DEFAULT_CAMPUS_ZOOM

  async function handleSearch(event) {
    event?.preventDefault()
    event?.stopPropagation()

    const query = normalizeSearchText(searchQuery)

    if (!query) {
      setSearchResults([])
      setHasSearched(true)
      setSearchError("Type a place name such as Library, FTMK, FTKE, or Cafeteria.")
      return
    }

    setSearchError("")
    setHasSearched(true)

    const cached = readCachedResults(query)

    if (cached) {
      setSearchResults(cached)
      return
    }

    setIsSearching(true)

    try {
      const response = await fetch(buildSearchUrl(query), {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Location search failed (${response.status}).`)
      }

      const payload = await response.json()

      const safeResults = (Array.isArray(payload) ? payload : [])
        .map((item) => {
          const resultLat = toFiniteNumber(item.lat)
          const resultLng = toFiniteNumber(item.lon)

          if (resultLat === null || resultLng === null) {
            return null
          }

          return {
            placeId: item.place_id,
            latitude: Number(resultLat.toFixed(6)),
            longitude: Number(resultLng.toFixed(6)),
            name:
              item.name ||
              item.display_name?.split(",")?.[0]?.trim() ||
              "Search result",
            displayName: item.display_name || item.name || "Search result",
            type: item.type || item.category || "",
          }
        })
        .filter(Boolean)

      cacheResults(query, safeResults)
      setSearchResults(safeResults)

      if (safeResults.length === 0) {
        setSearchError(
          "No matching place was found inside the UTeM main-campus search area. Try another campus name or Malay spelling."
        )
      }
    } catch (error) {
      console.error("UTeM map place search error:", error)
      setSearchResults([])
      setSearchError(
        error.message || "Unable to search the map right now. You can still click the map manually."
      )
    } finally {
      setIsSearching(false)
    }
  }

  function handleSelectSearchResult(result) {
    onChange?.({
      latitude: result.latitude,
      longitude: result.longitude,
    })

    setSearchQuery(result.name)
    setSearchResults([])
    setSearchError("")
  }

  return (
    <div className="space-y-3">
      <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-3 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value)
                setSearchError("")
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  event.stopPropagation()
                  void handleSearch(event)
                }
              }}
              disabled={disabled || isSearching}
              placeholder="Search UTeM place, e.g. Library, FTMK, Cafeteria..."
              className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <button
            type="button"
            onClick={(event) => {
              void handleSearch(event)
            }}
            disabled={disabled || isSearching || !normalizeSearchText(searchQuery)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSearching ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Search size={17} />
            )}
            {isSearching ? "Searching..." : "Search Map"}
          </button>
        </div>

        <div className="mt-2 flex flex-col gap-1 text-xs font-semibold leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Search is limited to the UTeM main-campus area, so generic terms stay relevant.
          </span>
          <span>Search runs only when you press Enter or Search Map.</span>
        </div>

        {searchError && (
          <div className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs font-semibold leading-5 text-amber-800">
            <SearchX size={16} className="mt-0.5 shrink-0" />
            {searchError}
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">
              Search Results
            </div>

            <div className="divide-y divide-slate-100">
              {searchResults.map((result) => (
                <button
                  key={`${result.placeId}-${result.latitude}-${result.longitude}`}
                  type="button"
                  onClick={() => handleSelectSearchResult(result)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-cyan-50"
                >
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-cyan-50 text-cyan-700">
                    <MapPin size={16} />
                  </span>

                  <span className="min-w-0">
                    <span className="block text-sm font-black text-slate-900">
                      {result.name}
                    </span>
                    <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">
                      {result.displayName}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {hasSearched &&
          !isSearching &&
          !searchError &&
          searchResults.length === 0 && (
            <div className="mt-3 text-xs font-semibold text-slate-500">
              Select a result to move the map and fill the coordinates automatically.
            </div>
          )}
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-100">
        <div className="relative h-[360px] w-full lg:h-[440px]">
          <MapContainer
            center={initialCenter}
            zoom={initialZoom}
            scrollWheelZoom
            className="h-full w-full"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />

            <MapClickHandler disabled={disabled} onPick={onChange} />
            <MapRecenter latitude={latitude} longitude={longitude} />

            {hasPosition && (
              <CircleMarker
                center={[lat, lng]}
                radius={11}
                pathOptions={{
                  color: "#0e7490",
                  fillColor: "#06b6d4",
                  fillOpacity: 0.92,
                  weight: 4,
                }}
              >
                <Popup>
                  <div className="min-w-44">
                    <p className="font-bold">{label}</p>
                    <p className="mt-1 text-xs">
                      {lat.toFixed(6)}, {lng.toFixed(6)}
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            )}
          </MapContainer>

          {!hasPosition && (
            <div className="pointer-events-none absolute left-1/2 top-4 z-[500] -translate-x-1/2 rounded-full border border-white/70 bg-slate-950/85 px-4 py-2 text-xs font-bold text-white shadow-xl backdrop-blur">
              Search above or click the map to place this parking zone
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 border-t border-slate-200 bg-white px-4 py-3 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {disabled
              ? "Map editing is disabled."
              : "Search a campus place, select the result, or click the map manually for final adjustment."}
          </span>
          <span className="font-semibold text-slate-600">
            {hasPosition
              ? `${lat.toFixed(6)}, ${lng.toFixed(6)}`
              : "No map coordinate saved"}
          </span>
        </div>
      </div>
    </div>
  )
}

export default ZoneMapPicker

