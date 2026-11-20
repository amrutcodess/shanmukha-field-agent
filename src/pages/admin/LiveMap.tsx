import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useAdmin } from '../../context/AdminContext';
import { FieldAssistant, FAStatus, District, AdminVisit } from '../../types/admin';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  MapPin,
  Battery,
  Phone,
  User,
  Footprints,
  Calendar,
  CheckCircle,
  AlertTriangle,
  X,
  Navigation,
} from 'lucide-react';

export const LiveMap: React.FC = () => {
  const { filteredFAs, selectedDistrict, setSelectedDistrict, visits } = useAdmin();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const playbackMarkerRef = useRef<L.Marker | null>(null);

  // Status Filter state
  const [statusFilter, setStatusFilter] = useState<FAStatus | 'ALL'>('ALL');
  const [selectedFA, setSelectedFA] = useState<FieldAssistant | null>(null);

  // Route playback state (Strava style)
  const [playbackVisit, setPlaybackVisit] = useState<AdminVisit | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 5>(1);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Center around Telangana/AP region (lat: 17.85, lng: 78.35)
      const map = L.map(mapContainerRef.current, {
        center: [17.85, 78.35],
        zoom: 9,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Filter FAs
  const displayedFAs = filteredFAs.filter((fa) => {
    if (statusFilter === 'ALL') return true;
    return fa.status === statusFilter;
  });

  // Render FA markers on map
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    displayedFAs.forEach((fa) => {
      const isSelected = selectedFA?.id === fa.id;

      // Color coding by status
      let bgColor = 'bg-stone-500';
      let borderColor = 'border-stone-700';
      let ping = false;

      if (fa.status === 'ON_VISIT') {
        bgColor = 'bg-emerald-600';
        borderColor = 'border-white';
        ping = true;
      } else if (fa.status === 'ACTIVE') {
        bgColor = 'bg-sky-600';
        borderColor = 'border-white';
      } else if (fa.status === 'IDLE') {
        bgColor = 'bg-amber-500';
        borderColor = 'border-white';
      } else if (fa.status === 'LOCATION_OFF') {
        bgColor = 'bg-rose-600';
        borderColor = 'border-white';
      }

      const iconHtml = `
        <div class="relative flex items-center justify-center">
          ${ping ? '<span class="absolute w-8 h-8 rounded-full bg-emerald-400 opacity-75 animate-ping"></span>' : ''}
          <div class="w-8 h-8 rounded-full ${bgColor} border-2 ${borderColor} shadow-lg flex items-center justify-center text-white font-bold text-xs">
            ${fa.name.slice(0, 2).toUpperCase()}
          </div>
          <div class="absolute -bottom-4 whitespace-nowrap px-1.5 py-0.2 rounded-md bg-stone-900/90 text-white text-[9px] font-semibold shadow-xs">
            ${fa.name.split(' ')[0]}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-fa-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([fa.currentLat, fa.currentLng], { icon: customIcon });
      marker.on('click', () => {
        setSelectedFA(fa);
        // Find latest visit for this FA
        const faVisits = visits.filter((v) => v.faId === fa.id);
        if (faVisits.length > 0) {
          setPlaybackVisit(faVisits[0]);
          setPlaybackIndex(0);
          setIsPlaying(false);
        }
      });

      markersLayerRef.current?.addLayer(marker);
    });

    // Auto-fit bounds if we have markers
    if (displayedFAs.length > 0) {
      const bounds = L.latLngBounds(displayedFAs.map((f) => [f.currentLat, f.currentLng]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [displayedFAs, selectedFA]);

  // Handle Route Polyline rendering
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (routeLayerRef.current) {
      mapInstanceRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (playbackMarkerRef.current) {
      mapInstanceRef.current.removeLayer(playbackMarkerRef.current);
      playbackMarkerRef.current = null;
    }

    if (playbackVisit && playbackVisit.routeCoordinates.length > 0) {
      const latlngs = playbackVisit.routeCoordinates.map((c) => [c.lat, c.lng] as [number, number]);

      // Draw Strava style route line (emerald gradient or orange)
      const polyline = L.polyline(latlngs, {
        color: '#E8731A',
        weight: 5,
        opacity: 0.85,
        dashArray: playbackVisit.hasFlags ? '6, 8' : undefined,
      }).addTo(mapInstanceRef.current);

      routeLayerRef.current = polyline;

      // Add Start & End pins
      const startCoord = latlngs[0];
      const endCoord = latlngs[latlngs.length - 1];

      // Add playback runner marker
      const runnerIcon = L.divIcon({
        html: `<div class="w-7 h-7 rounded-full bg-[#0B7A3B] border-2 border-white shadow-xl flex items-center justify-center text-white"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>`,
        className: 'runner-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const runner = L.marker(startCoord, { icon: runnerIcon }).addTo(mapInstanceRef.current);
      playbackMarkerRef.current = runner;

      mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    }
  }, [playbackVisit]);

  // Strava Style Playback Loop
  useEffect(() => {
    if (!isPlaying || !playbackVisit) return;

    const coords = playbackVisit.routeCoordinates;
    if (coords.length === 0) return;

    const intervalTime = 1000 / playbackSpeed;
    const interval = setInterval(() => {
      setPlaybackIndex((prev) => {
        if (prev >= coords.length - 1) {
          setIsPlaying(false);
          return coords.length - 1;
        }
        const nextIdx = prev + 1;
        const target = coords[nextIdx];
        if (playbackMarkerRef.current) {
          playbackMarkerRef.current.setLatLng([target.lat, target.lng]);
        }
        return nextIdx;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isPlaying, playbackVisit, playbackSpeed]);

  const handleSeek = (newIndex: number) => {
    setPlaybackIndex(newIndex);
    if (playbackVisit && playbackMarkerRef.current) {
      const target = playbackVisit.routeCoordinates[newIndex];
      playbackMarkerRef.current.setLatLng([target.lat, target.lng]);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col space-y-4">
      {/* Top Map Control Bar */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* District & Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-stone-700">Filter Map:</span>

          {/* Status Buttons */}
          {(['ALL', 'ON_VISIT', 'ACTIVE', 'IDLE', 'LOCATION_OFF', 'OFFLINE'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-[#0B7A3B] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {st === 'ALL' ? 'All FAs' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium text-stone-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600 border border-white shadow-xs" />
            <span>On Visit ({filteredFAs.filter((f) => f.status === 'ON_VISIT').length})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-sky-600 border border-white shadow-xs" />
            <span>Active ({filteredFAs.filter((f) => f.status === 'ACTIVE').length})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-600 border border-white shadow-xs" />
            <span>Location Off ({filteredFAs.filter((f) => f.status === 'LOCATION_OFF').length})</span>
          </div>
        </div>
      </div>

      {/* Main Map with Floating Overlays */}
      <div className="relative flex-1 rounded-3xl overflow-hidden border border-stone-200 shadow-md">
        {/* Leaflet Map Div */}
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating FA Info Card (when selected) */}
        {selectedFA && (
          <div className="absolute top-4 left-4 z-20 w-80 bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-stone-200/90 shadow-2xl animate-in fade-in slide-in-from-top-2 text-xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-stone-400 font-mono">
                  {selectedFA.id}
                </span>
                <h3 className="text-sm font-bold text-stone-900">{selectedFA.name}</h3>
                <p className="text-[11px] text-stone-500">
                  {selectedFA.district} · {selectedFA.mandal}
                </p>
              </div>
              <button
                onClick={() => setSelectedFA(null)}
                className="p-1 rounded-full text-stone-400 hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
              <div>
                <span className="text-[10px] text-stone-400 block font-semibold">Live Status</span>
                <span className="font-bold text-[#0B7A3B]">{selectedFA.status.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block font-semibold">Battery</span>
                <div className="flex items-center gap-1 font-mono font-bold text-stone-800">
                  <Battery className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{selectedFA.batteryLevel}%</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block font-semibold">Device Model</span>
                <span className="font-medium text-stone-700 truncate block">
                  {selectedFA.deviceModel}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block font-semibold">App Version</span>
                <span className="font-mono text-stone-700">{selectedFA.appVersion}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-stone-500 pt-1">
              <span>Last Sync: {selectedFA.lastSyncTime}</span>
              <span className="font-semibold text-emerald-700">Score: {selectedFA.qualityScore}/100</span>
            </div>
          </div>
        )}

        {/* Strava-Style Route Playback Floating Dashboard */}
        {playbackVisit && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 w-[95%] max-w-2xl bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-stone-200/90 shadow-2xl space-y-3 animate-in slide-in-from-bottom-3 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-[#E8731A]" />
                <span className="font-bold text-stone-900">
                  Route Playback: {playbackVisit.id} ({playbackVisit.faName})
                </span>
              </div>
              <span className="text-[11px] text-stone-500">
                Farmer: {playbackVisit.farmerName} · {playbackVisit.crop}
              </span>
            </div>

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-4 gap-2 text-center bg-stone-50 p-2 rounded-xl">
              <div>
                <span className="text-[10px] text-stone-400 block font-semibold">DISTANCE</span>
                <span className="text-sm font-black text-stone-900">{playbackVisit.distanceKm} km</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block font-semibold">DURATION</span>
                <span className="text-sm font-black text-stone-900">
                  {playbackVisit.durationMinutes} mins
                </span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block font-semibold">CURRENT SPEED</span>
                <span className="text-sm font-black text-[#0B7A3B]">
                  {playbackVisit.routeCoordinates[playbackIndex]?.speedKmH || 3.2} km/h
                </span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block font-semibold">GPS PRECISION</span>
                <span className="text-sm font-black text-emerald-700">
                  ±{playbackVisit.gpsAccuracyMeters}m
                </span>
              </div>
            </div>

            {/* Playback Controls & Scrubber Slider */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-9 h-9 rounded-full bg-[#0B7A3B] hover:bg-[#096330] text-white flex items-center justify-center shadow-md transition"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              <button
                onClick={() => handleSeek(0)}
                className="p-2 rounded-lg hover:bg-stone-100 text-stone-500"
                title="Restart Route"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Seek Slider */}
              <input
                type="range"
                min={0}
                max={playbackVisit.routeCoordinates.length - 1}
                value={playbackIndex}
                onChange={(e) => handleSeek(parseInt(e.target.value))}
                className="flex-1 accent-[#0B7A3B] cursor-pointer"
              />

              {/* Speed Buttons */}
              <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg">
                {([1, 2, 5] as const).map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      playbackSpeed === spd
                        ? 'bg-white text-[#0B7A3B] shadow-xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPlaybackVisit(null)}
                className="p-1 rounded-full text-stone-400 hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
