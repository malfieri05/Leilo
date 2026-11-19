"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap, CircleMarker } from "leaflet";
import {
  storeLocations,
  storeRegions,
  type StoreLocation,
} from "@/lib/store-locations";
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

function popupNode(store: StoreLocation) {
  const wrap = document.createElement("div");
  const title = document.createElement("p");
  title.style.margin = "0";
  title.style.fontWeight = "600";
  title.textContent = store.name;
  const address = document.createElement("p");
  address.style.margin = "4px 0 0";
  address.style.color = "#5d6a64";
  address.textContent = store.address;
  wrap.append(title, address);
  return wrap;
}

export function StoreMap() {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const groupRef = useRef<LayerGroup | null>(null);
  const markersRef = useRef<Map<number, CircleMarker>>(new Map());
  const selectedIdRef = useRef<number | null>(null);
  const previousSelectedRef = useRef<number | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [markerVersion, setMarkerVersion] = useState(0);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");
  const [showDoors, setShowDoors] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (!showDoors) return [];
    const needle = query.trim().toLowerCase();
    return storeLocations.filter((store) => {
      if (region !== "all" && store.region !== region) return false;
      if (!needle) return true;
      return (
        store.name.toLowerCase().includes(needle) ||
        store.address.toLowerCase().includes(needle) ||
        store.city.toLowerCase().includes(needle) ||
        store.region.toLowerCase().includes(needle)
      );
    });
  }, [query, region, showDoors]);

  const selected = filtered.find((store) => store.id === selectedId) ?? null;
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
      }).setView([39.5, -96], 4);

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
        marker.bindPopup(popupNode(store), { maxWidth: 260 });
        marker.on("click", () => setSelectedId(store.id));
        marker.addTo(group);
        markersRef.current.set(store.id, marker);
      }

      if (cancelled) return;

      if (filtered.length > 0) {
        const bounds = L.latLngBounds(filtered.map((store) => [store.lat, store.lng]));
        map.fitBounds(bounds.pad(0.15), {
          maxZoom: filtered.length === 1 ? 13 : 11,
          animate: false,
        });
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

  return (
    <div className="space-y-4">
      <div className="grid gap-4 rounded-2xl border border-line bg-paper p-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Doors</p>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem]">
            <label className="block text-sm">
              <span className="mb-1 block text-muted">Search</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Store, city, or address"
                className="w-full rounded-lg border border-line bg-foam px-3 py-2 outline-none focus:border-lagoon"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">Region</span>
              <select
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                className="w-full rounded-lg border border-line bg-foam px-3 py-2 outline-none focus:border-lagoon"
              >
                <option value="all">All regions</option>
                {storeRegions.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showDoors}
              onChange={(event) => setShowDoors(event.target.checked)}
              className="accent-lagoon"
            />
            Retail doors
            <span className="text-muted">{filtered.length.toLocaleString()} shown</span>
          </label>
        </div>

        <fieldset disabled className="space-y-3">
          <legend className="text-xs uppercase tracking-[0.14em] text-muted">Sales</legend>
          <p className="text-xs text-muted">
            Date, source, and metric apply once Shopify and distributor feeds are connected.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-muted">From</span>
              <input type="date" className="w-full rounded-lg border border-line bg-foam px-3 py-2" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">To</span>
              <input type="date" className="w-full rounded-lg border border-line bg-foam px-3 py-2" />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-muted">Source</span>
              <select className="w-full rounded-lg border border-line bg-foam px-3 py-2" defaultValue="all">
                <option value="all">All sources</option>
                <option value="shopify">Shopify</option>
                <option value="distributor">Distributor</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">Metric</span>
              <select className="w-full rounded-lg border border-line bg-foam px-3 py-2" defaultValue="cases">
                <option value="cases">Cases</option>
                <option value="revenue">Revenue</option>
                <option value="velocity">Velocity</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full border border-line px-3 py-1 text-muted">Shopify orders</span>
            <span className="rounded-full border border-line px-3 py-1 text-muted">Distributor</span>
          </div>
        </fieldset>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="relative isolate z-0 h-[70vh] min-h-[520px] overflow-hidden rounded-2xl border border-line bg-paper">
          <div ref={mapElementRef} className="store-map h-full w-full" aria-label="Map of Leilo retail doors" />
          {filtered.length === 0 ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="rounded-full bg-paper px-4 py-2 text-sm shadow">No doors match these filters.</p>
            </div>
          ) : null}
        </section>

        <aside className="flex h-[70vh] min-h-[520px] flex-col rounded-2xl border border-line bg-paper">
          <div className="border-b border-line px-4 py-3">
            <h2 className="font-display text-xl text-heading">Doors</h2>
            <p className="text-xs text-muted">
              {filtered.length.toLocaleString()} of {storeLocations.length.toLocaleString()} retail locations
            </p>
          </div>
          {selected ? (
            <div className="border-b border-line px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">Selected</p>
              <p className="mt-1 font-medium">{selected.name}</p>
              <p className="text-sm text-muted">{selected.address}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-xs text-muted">Cases</dt>
                  <dd>—</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Revenue</dt>
                  <dd>—</dd>
                </div>
              </dl>
            </div>
          ) : null}
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
      </div>
    </div>
  );
}
