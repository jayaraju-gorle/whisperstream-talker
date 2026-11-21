import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Crosshair, ExternalLink, MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractCoordsFromMapUrl, googleMapsPinUrl } from "@/lib/clinic-form-helpers";
import { resolveMapLink } from "@/lib/portal.functions";

const DEFAULT_CENTER = { lat: 17.4486, lng: 78.3908 }; // Hyderabad fallback

type PlaceSuggestion = {
  label: string;
  lat: number;
  lng: number;
};

const PIN_HTML = `
  <div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;transform:translate(-50%,-100%);">
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="#047857" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 3px 5px rgba(0,0,0,0.32));">
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
      <circle cx="12" cy="10" r="3" fill="#ffffff"/>
    </svg>
  </div>
`;

function scoreMatch(label: string, query: string): number {
  const hay = label.toLowerCase();
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 2);
  let score = 0;
  if (hay.includes(query.toLowerCase())) score += 10;
  for (const t of tokens) {
    if (hay.includes(t)) score += 2;
  }
  return score;
}

async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceSuggestion[]> {
  const clean = query.replace(/\(.*?\)/g, "").trim();
  if (clean.length < 2) return [];

  const init: RequestInit = {
    headers: { Accept: "application/json" },
    ...(signal ? { signal } : {}),
  };

  const fetchPhoton = async (): Promise<PlaceSuggestion[]> => {
    try {
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(clean)}&limit=6&lat=17.4486&lon=78.3908`,
        init,
      );
      if (!res.ok) return [];
      const json = (await res.json()) as {
        features?: Array<{
          geometry?: { coordinates?: [number, number] };
          properties?: {
            name?: string;
            street?: string;
            district?: string;
            city?: string;
            state?: string;
            postcode?: string;
          };
        }>;
      };
      return (json.features ?? [])
        .map((f) => {
          const coords = f.geometry?.coordinates;
          const p = f.properties ?? {};
          if (!coords || coords.length < 2) return null;
          const label = [p.name, p.street, p.district, p.city, p.state, p.postcode]
            .filter(Boolean)
            .filter((v, i, arr) => arr.indexOf(v) === i)
            .join(", ");
          return { label: label || clean, lat: coords[1], lng: coords[0] };
        })
        .filter((x): x is PlaceSuggestion => x !== null);
    } catch {
      return [];
    }
  };

  const fetchNominatim = async (): Promise<PlaceSuggestion[]> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=6&countrycodes=in&q=${encodeURIComponent(clean)}`,
        init,
      );
      if (!res.ok) return [];
      const rows = (await res.json()) as Array<{
        display_name?: string;
        lat?: string;
        lon?: string;
      }>;
      return rows
        .filter((r) => r.lat && r.lon)
        .map((r) => ({
          label: r.display_name || clean,
          lat: Number(r.lat),
          lng: Number(r.lon),
        }));
    } catch {
      return [];
    }
  };

  const [photonItems, nominatimItems] = await Promise.all([fetchPhoton(), fetchNominatim()]);
  const merged = [...photonItems, ...nominatimItems];
  const deduped: PlaceSuggestion[] = [];
  for (const item of merged) {
    const duplicate = deduped.some(
      (existing) =>
        Math.abs(existing.lat - item.lat) < 0.0005 && Math.abs(existing.lng - item.lng) < 0.0005,
    );
    if (!duplicate) deduped.push(item);
  }
  return deduped
    .sort((a, b) => scoreMatch(b.label, clean) - scoreMatch(a.label, clean))
    .slice(0, 6);
}

export function ClinicMapPicker({
  address,
  mapUrl,
  onChangeMapUrl,
}: {
  address: string;
  mapUrl: string;
  onChangeMapUrl: (url: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const onChangeRef = useRef(onChangeMapUrl);
  onChangeRef.current = onChangeMapUrl;

  const initialCoords = extractCoordsFromMapUrl(mapUrl);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(initialCoords);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [resolvingLink, setResolvingLink] = useState(false);
  const resolveLinkFn = useServerFn(resolveMapLink);

  useEffect(() => {
    const parsed = extractCoordsFromMapUrl(mapUrl);
    if (parsed) {
      setCoords(parsed);
      if (mapRef.current && markerRef.current) {
        markerRef.current.setLatLng([parsed.lat, parsed.lng]);
        mapRef.current.setView([parsed.lat, parsed.lng], Math.max(mapRef.current.getZoom(), 15));
      }
    }
  }, [mapUrl]);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void searchPlaces(trimmed, controller.signal).then((items) => {
        if (!controller.signal.aborted) setSuggestions(items);
      });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      const container = containerRef.current;
      if (!container) return;
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !containerRef.current) return;

      const start = extractCoordsFromMapUrl(mapUrl) ?? DEFAULT_CENTER;
      const map = L.map(container, {
        center: [start.lat, start.lng],
        zoom: extractCoordsFromMapUrl(mapUrl) ? 16 : 12,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const pinIcon = L.divIcon({
        html: PIN_HTML,
        className: "",
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([start.lat, start.lng], {
        draggable: true,
        icon: pinIcon,
      }).addTo(map);

      const updatePin = (lat: number, lng: number) => {
        setCoords({ lat, lng });
        onChangeRef.current(googleMapsPinUrl(lat, lng));
      };

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        updatePin(pos.lat, pos.lng);
      });

      map.on("click", (e) => {
        marker.setLatLng(e.latlng);
        updatePin(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;
      markerRef.current = marker;
    }

    void initMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Only initialize once on mount; coordinate updates are synced via the effect above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function movePin(lat: number, lng: number, zoom = 16) {
    setCoords({ lat, lng });
    onChangeMapUrl(googleMapsPinUrl(lat, lng));
    if (mapRef.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapRef.current.setView([lat, lng], zoom, { animate: true });
    }
  }

  function pickSuggestion(place: PlaceSuggestion) {
    setSearchQuery(place.label);
    setSuggestions([]);
    movePin(place.lat, place.lng, 16);
    toast.success("Pinned location — drag the green pin to fine-tune the entrance.");
  }

  async function runSearch(rawQuery: string) {
    const clean = rawQuery.replace(/\(.*?\)/g, "").trim();
    if (!clean) {
      toast.error("Type an area, landmark, or city to search.");
      return;
    }
    setSearching(true);
    try {
      // Try exact query first, then progressively broader parts (e.g. area + city)
      const parts = clean
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      const candidates = [clean];
      if (parts.length > 2) candidates.push(parts.slice(-3).join(", "));
      if (parts.length > 1) candidates.push(parts.slice(-2).join(", "));
      if (parts.length > 1) candidates.push(parts[parts.length - 1]!);

      for (const candidate of candidates) {
        const results = await searchPlaces(candidate);
        if (results[0]) {
          pickSuggestion(results[0]);
          return;
        }
      }
      toast.error(
        "Couldn't find that place. Try searching by area or city (e.g. Kondapur, Hyderabad).",
      );
    } finally {
      setSearching(false);
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error("Location access isn't available on this device.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        movePin(pos.coords.latitude, pos.coords.longitude, 17);
        toast.success("Pinned to your current location.");
      },
      () => {
        setLocating(false);
        toast.error("Couldn't read your current location. Check browser location permissions.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Pin exact clinic location</p>
          <p className="text-xs text-muted-foreground">
            Search any area or landmark, then drag the green pin to your exact clinic entrance.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {address.trim() && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void runSearch(address)}
              loading={searching}
              loadingLabel="Finding…"
            >
              <MapPin className="h-3.5 w-3.5" />
              Locate clinic address
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={useCurrentLocation}
            loading={locating}
            loadingLabel="Locating…"
          >
            <Crosshair className="h-3.5 w-3.5" />
            Use my location
          </Button>
        </div>
      </div>

      {/* Google-style area / landmark search bar */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search area or landmark on map"
              placeholder="Search area, street, or landmark (e.g. Kondapur, Hyderabad)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void runSearch(searchQuery);
                }
              }}
              className="pl-9"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void runSearch(searchQuery)}
            loading={searching}
            loadingLabel="Searching…"
          >
            Search
          </Button>
        </div>
        {suggestions.length > 0 && (
          <ul
            role="listbox"
            aria-label="Matching map locations"
            className="absolute left-0 right-0 top-full z-[500] mt-1 max-h-60 overflow-y-auto rounded-lg border border-border bg-card shadow-lg"
          >
            {suggestions.map((item, idx) => (
              <li key={`${item.lat}-${item.lng}-${idx}`}>
                <button
                  type="button"
                  onClick={() => pickSuggestion(item)}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-accent"
                >
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="line-clamp-2 text-foreground">{item.label}</span>
                </button>
              </li>
            ))}
            <li className="border-t border-border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
              Not seeing the exact building?{" "}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery.trim())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline"
              >
                Find &ldquo;{searchQuery.trim()}&rdquo; on Google Maps
                <ExternalLink className="h-3 w-3" />
              </a>{" "}
              and paste its share link below.
            </li>
          </ul>
        )}
      </div>

      <div
        ref={containerRef}
        aria-label="Interactive clinic location map"
        className="relative z-0 h-56 w-full overflow-hidden rounded-lg border border-border bg-muted sm:h-64"
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          {coords
            ? `Pinned at ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
            : "Search an area above or drag the green pin to save exact coordinates."}
        </span>
        {mapUrl.trim() && (
          <a
            href={mapUrl.trim()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            Preview in Google Maps
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <div className="space-y-1.5 border-t border-border pt-2.5">
        <Label htmlFor="admin-map" className="text-xs text-muted-foreground">
          Google Maps link (auto-filled from pin, or paste any Google Maps share link to snap pin)
        </Label>
        <Input
          id="admin-map"
          placeholder="https://maps.app.goo.gl/..."
          value={mapUrl}
          disabled={resolvingLink}
          onChange={(e) => {
            const val = e.target.value;
            onChangeMapUrl(val);
            const trimmed = val.trim();
            if (
              /^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|(?:www\.)?google\.com\/maps)/i.test(
                trimmed,
              ) &&
              !extractCoordsFromMapUrl(trimmed)
            ) {
              setResolvingLink(true);
              void resolveLinkFn({ data: { url: trimmed } })
                .then((found) => {
                  if (found) {
                    setCoords(found);
                    if (mapRef.current && markerRef.current) {
                      markerRef.current.setLatLng([found.lat, found.lng]);
                      mapRef.current.setView([found.lat, found.lng], 17, { animate: true });
                    }
                    toast.success("Pinned exact location from your Google Maps link.");
                  }
                })
                .catch(() => {
                  /* keep pasted URL even if redirect lookup fails */
                })
                .finally(() => setResolvingLink(false));
            }
          }}
        />
      </div>
    </div>
  );
}
