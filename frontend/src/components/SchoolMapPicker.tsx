import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Search, AlertCircle } from 'lucide-react';
import { toast } from '../store/toastStore';

interface SchoolMapPickerProps {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  onChangeLocation: (lat: number, lng: number) => void;
}

export default function SchoolMapPicker({
  latitude,
  longitude,
  radiusMeters,
  onChangeLocation
}: SchoolMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);

  const [isLeafletReady, setIsLeafletReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // 1. Dynamically Load Leaflet CSS & JS if not loaded
  useEffect(() => {
    const existingCss = document.getElementById('leaflet-css');
    if (!existingCss) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if ((window as any).L) {
      setIsLeafletReady(true);
      return;
    }

    const existingJs = document.getElementById('leaflet-js');
    if (!existingJs) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setIsLeafletReady(true);
      document.body.appendChild(script);
    } else {
      existingJs.addEventListener('load', () => setIsLeafletReady(true));
    }
  }, []);

  // 2. Initialize Map & Markers
  useEffect(() => {
    if (!isLeafletReady || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const initialLat = latitude || -5.104631332862634;
    const initialLng = longitude || 119.53457627550816;

    if (!mapInstanceRef.current) {
      // Create Leaflet Map Instance
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true
      }).setView([initialLat, initialLng], 17);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(map);

      // Custom Red Pin Icon
      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div style="
            background: #6c47ff;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(108,71,255,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          ">
            📍
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      // Draggable Marker
      const marker = L.marker([initialLat, initialLng], {
        draggable: true,
        icon: customIcon
      }).addTo(map);

      marker.bindPopup('<b>Titik Sekolah UPT SPF SD INPRES PAJJAIANG 2</b><br>Geser titik ini untuk memindahkan koordinat').openPopup();

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onChangeLocation(Number(pos.lat.toFixed(7)), Number(pos.lng.toFixed(7)));
      });

      // Click Map to Set Marker
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        if (circleRef.current) circleRef.current.setLatLng([lat, lng]);
        onChangeLocation(Number(lat.toFixed(7)), Number(lng.toFixed(7)));
      });

      // Circle Geofence Layer
      const circle = L.circle([initialLat, initialLng], {
        color: '#6c47ff',
        fillColor: '#6c47ff',
        fillOpacity: 0.15,
        radius: Number(radiusMeters) || 150
      }).addTo(map);

      mapInstanceRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;
    } else {
      // Update Marker & Circle Position smoothly without resetting zoom/pan
      const marker = markerRef.current;
      const circle = circleRef.current;

      if (marker) {
        const curPos = marker.getLatLng();
        if (Math.abs(curPos.lat - initialLat) > 0.00001 || Math.abs(curPos.lng - initialLng) > 0.00001) {
          marker.setLatLng([initialLat, initialLng]);
        }
      }
      if (circle) {
        circle.setLatLng([initialLat, initialLng]);
        circle.setRadius(Number(radiusMeters) || 150);
      }
    }
  }, [isLeafletReady, latitude, longitude, radiusMeters]);

  // Handle GPS Current Device Location
  const handleUseCurrentGPS = () => {
    if (!navigator.geolocation) {
      toast.warning('Browser Anda tidak mendukung deteksi lokasi GPS.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(7));
        const lng = Number(pos.coords.longitude.toFixed(7));
        onChangeLocation(lat, lng);
        toast.success(`Lokasi GPS perangkat berhasil dideteksi: ${lat}, ${lng}`);
      },
      () => {
        toast.error('Gagal mengambil GPS perangkat. Pastikan izin lokasi diizinkan di browser.');
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // Search Address via OpenStreetMap Nominatim API
  const handleSearchAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery + ' Makassar'
        )}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const first = data[0];
        const lat = Number(parseFloat(first.lat).toFixed(7));
        const lng = Number(parseFloat(first.lon).toFixed(7));
        onChangeLocation(lat, lng);
        setSearchQuery('');
      } else {
        setSearchError('Lokasi tidak ditemukan. Coba masukkan nama jalan/daerah yang lebih spesifik.');
      }
    } catch (err) {
      setSearchError('Gagal mencari alamat.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Search Bar & Current GPS Button */}
      <div className="flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleSearchAddress} className="flex-1 relative flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama lokasi/jalan (misal: Sudiang, Luwu Raya)..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pl-9 text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <button
            type="submit"
            disabled={isSearching}
            className="hidden sm:block absolute right-1.5 px-2.5 py-1 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-bold text-[10px]"
          >
            {isSearching ? 'Cari...' : 'Cari'}
          </button>
        </form>

        <button
          type="button"
          onClick={handleUseCurrentGPS}
          className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 shrink-0 transition"
        >
          <Navigation className="w-3.5 h-3.5" /> Gunakan GPS HP/Laptop Saya
        </button>
      </div>

      {searchError && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-[11px] font-semibold flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {searchError}
        </div>
      )}

      {/* Interactive Map Canvas Container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-64 z-0" />

        {!isLeafletReady && (
          <div className="absolute inset-0 bg-slate-100/90 flex flex-col items-center justify-center gap-2 text-slate-500 z-10">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold">Memuat Peta Interaktif OpenStreetMap...</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-1">
        <span className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-brand-500" /> Klik peta atau geser pin merah untuk mengubah koordinat.
        </span>
        <span className="text-brand-600 font-bold">Radius Geofence: {radiusMeters}m</span>
      </div>
    </div>
  );
}
