"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap, CircleMarker } from "leaflet";
import { doorPopupHtml } from "@/components/door-detail-card";
import { storeRegionsFrom, type StoreLocation } from "@/lib/store-locations";
import "leaflet/dist/leaflet.css";

const LIST_LIMIT = 40;

function markerStyle(selected: boolean) {
  return selected
    ? {
        radius: 9,
        color: "#0f172a",
        weight: 2,
        fillColor: "#57c3ee",
        fillOpacity: 1,
      }
    : {
        radius: 6,
        color: "#fffdf8",
        weight: 1,
        fillColor: "#0f172a",
        fillOpacity: 0.88,
      };
}

async function loadLeaflet() {
  const mod = await import("leaflet");
  return mod.default ?? mod;
}

const USA_CENTER: [number, number] = [39.5, -96];
const USA_ZOOM = 4;

export function StoreMap({
  locations,
  source = "snapshot",
  syncedAt = null,
}: {
  locations: StoreLocation[];
  source?: "sheet" | "snapshot";
  syncedAt?: string | null;
}) {
  const storeRegions = storeRegionsFrom(locations);
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const groupRef = useRef<LayerGroup | null>(null);
  const markersRef = useRef<Map<string | number, CircleMarker>>(new Map());
  const selectedIdRef = useRef<string | number | null>(null);
  const previousSelectedRef = useRef<string | number | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [markerVersion, setMarkerVersion] = useState(0);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");
  const [showDoors, setShowDoors] = useState(true);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);

  const geocoded = useMemo(
    () => locations.filter((store) => Number.isFinite(store.lat) && Number.isFinite(store.lng)),
    [locations],
  );

  const filtered = useMemo(() => {
    if (!showDoors) return [];
    const needle = query.trim().toLowerCase();
    return geocoded.filter((store) => {
      if (region !== "all" && store.region !== region) return false;
      if (!needle) return true;
      return (
        store.name.toLowerCase().includes(needle) ||
        store.address.toLowerCase().includes(needle) ||
        store.city.toLowerCase().includes(needle) ||
        store.region.toLowerCase().includes(needle)
      );
    });
  }, [geocoded, query, region, showDoors]);

  const preview = filtered.slice(0, LIST_LIMIT);
  selectedIdRef.current = selectedId;

  function focusStore(store: StoreLocation) {
    setSelectedId(store.id);
    const map = mapRef.current;
    if (!map) return;
    map.flyTo([store.lat, store.lng], Math.max(map.getZoom(), 11), { duration: 0.45 });
    markersRef.current.get(store.id)?.openPopup();
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = await loadLeaflet();
      if (cancelled || !mapElementRef.current) return;

      const map = L.map(mapElementRef.current, {
        preferCanvas: true,
        scrollWheelZoom: true,
      }).setView(USA_CENTER, USA_ZOOM);

      // OSM tiles: the previous CARTO style now requires an API key.
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      setMapReady(true);
      requestAnimationFrame(() => map.invalidateSize());
    })();

    return () => {
      cancelled = true;
      groupRef.current?.remove();
      groupRef.current = null;
      markersRef.current.clear();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    let cancelled = false;

    (async () => {
      const L = await loadLeaflet();
      if (cancelled) return;

      groupRef.current?.remove();
      markersRef.current.clear();

      const group = L.layerGroup().addTo(map);
      groupRef.current = group;

      for (const store of filtered) {
        const marker = L.circleMarker([store.lat, store.lng], {
          ...markerStyle(store.id === selectedIdRef.current),
          bubblingMouseEvents: false,
        });
        marker.bindPopup(doorPopupHtml(store), { maxWidth: 300, minWidth: 268, className: "door-popup-wrapper", autoPan: true });
        marker.on("click", () => setSelectedId(store.id));
        marker.addTo(group);
        markersRef.current.set(store.id, marker);
      }

      if (cancelled) return;

      if (selectedIdRef.current == null) {
        map.setView(USA_CENTER, USA_ZOOM, { animate: false });
      }

      setMarkerVersion((version) => version + 1);
    })();

    return () => {
      cancelled = true;
    };
  }, [filtered, mapReady]);

  useEffect(() => {
    const previous = previousSelectedRef.current;
    if (previous != null && previous !== selectedId) {
      markersRef.current.get(previous)?.setStyle(markerStyle(false));
    }
    if (selectedId != null) {
      const marker = markersRef.current.get(selectedId);
      marker?.setStyle(markerStyle(true));
      marker?.bringToFront();
    }
    previousSelectedRef.current = selectedId;
  }, [selectedId, markerVersion]);

  useEffect(() => {
    if (selectedId == null) return;
    const store = filtered.find((row) => row.id === selectedId);
    const marker = markersRef.current.get(selectedId);
    if (!store || !marker) return;
    marker.setPopupContent(doorPopupHtml(store));
  }, [filtered, selectedId]);

  const sourceLine =
    source === "sheet"
      ? `Leilo locations sheet${syncedAt ? ` · synced ${new Date(syncedAt).toLocaleString("en-US", { timeZone: "America/New_York" })}` : ""}`
      : "Closeby snapshot until the Leilo locations sheet is synced on Sources.";

  const fieldClass =
    "w-full rounded-lg border border-line bg-foam px-3 py-2 text-sm outline-none focus:border-lagoon";

  return (
    <div className="space-y-4">
      <fieldset
        disabled
        className="rounded-2xl border border-line bg-paper px-4 py-3 sm:px-5 sm:py-4"
      >
        <legend className="text-xs uppercase tracking-[0.14em] text-muted">Sales</legend>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 lg:max-w-md">
            <p className="text-xs leading-relaxed text-muted">
              Date range, source, and metric will layer on the map once Shopify and distributor feeds are
              connected.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-line px-2.5 py-1 text-muted">Shopify orders</span>
              <span className="rounded-full border border-line px-2.5 py-1 text-muted">Distributor</span>
            </div>
          </div>
          <div className="grid w-full min-w-0 gap-3 sm:grid-cols-2 lg:max-w-2xl lg:grid-cols-4">
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-muted">From</span>
              <input type="date" className={fieldClass} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-muted">To</span>
              <input type="date" className={fieldClass} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-muted">Source</span>
              <select className={fieldClass} defaultValue="all">
                <option value="all">All sources</option>
                <option value="shopify">Shopify</option>
                <option value="distributor">Distributor</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-muted">Metric</span>
              <select className={fieldClass} defaultValue="cases">
                <option value="cases">Cases</option>
                <option value="revenue">Revenue</option>
                <option value="velocity">Velocity</option>
              </select>
            </label>
          </div>
        </div>
      </fieldset>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <aside className="order-2 flex h-[70vh] min-h-[520px] flex-col rounded-2xl border border-line bg-paper lg:order-1">
          <div className="shrink-0 space-y-3 border-b border-line px-4 py-3">
            <div>
              <h2 className="font-display text-xl text-heading">Doors</h2>
              <p className="mt-0.5 text-xs text-muted">{sourceLine}</p>
              <p className="text-xs text-muted">
                {filtered.length.toLocaleString()} of {geocoded.length.toLocaleString()} retail locations
              </p>
            </div>
            <label className="block">
              <span className="sr-only">Search stores</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Store, city, or address"
                className={fieldClass}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-muted">Region</span>
              <select
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                className={fieldClass}
              >
                <option value="all">All regions</option>
                {storeRegions.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showDoors}
                onChange={(event) => setShowDoors(event.target.checked)}
                className="accent-lagoon"
              />
              Retail doors
              <span className="text-xs text-muted">{filtered.length.toLocaleString()} on map</span>
            </label>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {preview.map((store) => {
              const active = store.id === selectedId;
              return (
                <li key={store.id} className="border-b border-line last:border-b-0">
                  <button
                    type="button"
                    onClick={() => focusStore(store)}
                    className={`w-full px-4 py-3 text-left ${active ? "bg-lime/40" : "hover:bg-foam"}`}
                    aria-current={active ? "true" : undefined}
                  >
                    <span className="block text-sm font-medium">{store.name}</span>
                    <span className="block text-xs text-muted">
                      {[store.city, store.region].filter(Boolean).join(", ")}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {filtered.length > LIST_LIMIT ? (
            <p className="border-t border-line px-4 py-2 text-xs text-muted">
              Showing {LIST_LIMIT} of {filtered.length.toLocaleString()}. Search to narrow the list.
            </p>
          ) : null}
        </aside>

        <section className="relative order-1 isolate z-0 h-[70vh] min-h-[520px] overflow-hidden rounded-2xl border border-line bg-paper lg:order-2">
          <div ref={mapElementRef} className="store-map h-full w-full" aria-label="Map of Leilo retail doors" />
          {filtered.length === 0 ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="rounded-full bg-paper px-4 py-2 text-sm shadow">No doors match these filters.</p>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
