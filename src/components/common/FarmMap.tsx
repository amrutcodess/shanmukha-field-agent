import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface FarmMapProps {
  lat: number;
  lng: number;
  accuracy?: number;
  zoom?: number;
  draggable?: boolean;
  onPositionChange?: (lat: number, lng: number) => void;
  heightClass?: string;
  className?: string;
  readOnly?: boolean;
}

export const FarmMap: React.FC<FarmMapProps> = ({
  lat,
  lng,
  accuracy = 10,
  zoom = 15,
  draggable = false,
  onPositionChange,
  heightClass = 'h-52',
  className = '',
  readOnly = false
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Custom modern green pin icon
    const customIcon = L.divIcon({
      className: 'custom-farm-pin',
      html: `
        <div style="
          width: 38px;
          height: 38px;
          background: #14532D;
          border: 3px solid #FFFFFF;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 14px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 14px;
            height: 14px;
            background: #4CAF50;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 38]
    });

    // Initialize Leaflet map
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: zoom,
        zoomControl: !readOnly,
        dragging: !readOnly,
        scrollWheelZoom: !readOnly ? 'center' : false,
        touchZoom: !readOnly,
        doubleClickZoom: !readOnly
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19
      }).addTo(map);

      // Accuracy radius circle
      const circle = L.circle([lat, lng], {
        radius: Math.max(accuracy, 15),
        color: '#2E7D32',
        fillColor: '#4CAF50',
        fillOpacity: 0.15,
        weight: 1.5
      }).addTo(map);

      // Main pin
      const marker = L.marker([lat, lng], {
        icon: customIcon,
        draggable: draggable
      }).addTo(map);

      if (draggable) {
        marker.on('dragend', (e) => {
          const markerPos = e.target.getLatLng();
          circle.setLatLng(markerPos);
          if (onPositionChange) {
            onPositionChange(
              parseFloat(markerPos.lat.toFixed(6)),
              parseFloat(markerPos.lng.toFixed(6))
            );
          }
        });
      }

      mapInstanceRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;

      // Invalidate size after mount
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    } else {
      // Update existing position
      const map = mapInstanceRef.current;
      map.setView([lat, lng], zoom);
      markerRef.current?.setLatLng([lat, lng]);
      circleRef.current?.setLatLng([lat, lng]);
      circleRef.current?.setRadius(Math.max(accuracy, 15));
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, accuracy, draggable, onPositionChange, readOnly, zoom]);

  return (
    <div 
      className={`relative w-full rounded-2xl overflow-hidden border border-emerald-900/10 shadow-inner ${heightClass} ${className}`}
      data-lenis-prevent
    >
      <div 
        ref={mapContainerRef} 
        className="w-full h-full z-10"
        data-lenis-prevent
      />
    </div>
  );
};
