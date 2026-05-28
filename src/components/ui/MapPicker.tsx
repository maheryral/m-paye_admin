import { useEffect, useMemo, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Crosshair } from 'lucide-react';

// Fix Leaflet marker icons (Webpack/Vite asset handling)
// @ts-expect-error - private leaflet property
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const ANTANANARIVO: [number, number] = [-18.8792, 47.5079];

interface MapPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  onChange: (lat: number, lng: number) => void;
  /** Appelé avec l'adresse lisible résolue (reverse/forward geocoding) à chaque déplacement du pin */
  onAddressChange?: (address: string) => void;
  height?: number;
  label?: string;
}

function ClickHandler({
  onChange,
}: {
  onChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyTo({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, Math.max(map.getZoom(), 13), { duration: 0.8 });
    }
  }, [position, map]);
  return null;
}

export default function MapPicker({
  latitude,
  longitude,
  onChange,
  onAddressChange,
  height = 280,
  label,
}: MapPickerProps) {
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [pendingFly, setPendingFly] = useState<[number, number] | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const reverseAbortRef = useRef<AbortController | null>(null);

  const position: [number, number] | null =
    latitude != null && longitude != null ? [latitude, longitude] : null;

  const center = useMemo<[number, number]>(
    () => position || ANTANANARIVO,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Reverse geocoding : lat/lng → adresse lisible
  async function reverseGeocode(lat: number, lng: number) {
    if (!onAddressChange) return;
    reverseAbortRef.current?.abort();
    const ctrl = new AbortController();
    reverseAbortRef.current = ctrl;
    setResolving(true);
    try {
      const url =
        'https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&addressdetails=1&lat=' +
        lat +
        '&lon=' +
        lng;
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: { 'Accept-Language': 'fr' },
      });
      const data = await res.json();
      if (data?.display_name) onAddressChange(data.display_name);
    } catch {
      // silent
    } finally {
      setResolving(false);
    }
  }

  // Pose le pin + résout l'adresse (knownAddress évite un reverse inutile après une recherche)
  function pick(lat: number, lng: number, knownAddress?: string) {
    onChange(lat, lng);
    setPendingFly([lat, lng]);
    if (knownAddress) {
      onAddressChange?.(knownAddress);
    } else {
      reverseGeocode(lat, lng);
    }
  }

  async function geocode() {
    if (!search.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setSearching(true);
    try {
      const url =
        'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' +
        encodeURIComponent(search + ', Madagascar');
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: { 'Accept-Language': 'fr' },
      });
      const arr = await res.json();
      if (arr && arr[0]) {
        const lat = parseFloat(arr[0].lat);
        const lng = parseFloat(arr[0].lon);
        pick(lat, lng, arr[0].display_name);
      }
    } catch (err) {
      // silent
    } finally {
      setSearching(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        pick(pos.coords.latitude, pos.coords.longitude);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    <div className="space-y-2">
      {label && <label className="label">{label}</label>}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                geocode();
              }
            }}
            placeholder="Rechercher une adresse (ex: Antananarivo Anosibe)…"
            className="input pl-9"
          />
        </div>
        <button
          type="button"
          onClick={geocode}
          disabled={searching}
          className="btn btn-md btn-secondary"
        >
          {searching ? '…' : 'Trouver'}
        </button>
        <button
          type="button"
          onClick={useMyLocation}
          title="Utiliser ma position"
          className="btn btn-md btn-ghost"
        >
          <Crosshair size={14} />
        </button>
      </div>

      <div
        className="rounded-xl overflow-hidden border border-bg-border/60 relative"
        style={{ height }}
      >
        <MapContainer
          center={center}
          zoom={position ? 13 : 6}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onChange={(lat, lng) => pick(lat, lng)} />
          <FlyTo position={pendingFly} />
          {position && <Marker position={position} />}
        </MapContainer>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-ink-dim">
        <MapPin size={11} />
        {position ? (
          <span className="font-mono">
            {position[0].toFixed(5)}, {position[1].toFixed(5)}
          </span>
        ) : (
          <span>Cliquez sur la carte pour positionner le pin</span>
        )}
        {resolving && (
          <span className="text-brand-300">· résolution de l'adresse…</span>
        )}
      </div>
    </div>
  );
}
