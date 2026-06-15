import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { VetClinic } from '../types';

interface InteractiveMapProps {
  clinics: VetClinic[];
  selectedClinicId: string | null;
  onSelectClinic: (id: string) => void;
  userLocation: { lat: number; lng: number } | null;
  searchRadius: number; // in km
  navigatingToClinicId: string | null;
}

export default function InteractiveMap({
  clinics,
  selectedClinicId,
  onSelectClinic,
  userLocation,
  searchRadius,
  navigatingToClinicId,
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, any>>({});
  const userMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Center point: Bengaluru, India (Default or user location if available)
    const initialLat = userLocation?.lat || 12.9716;
    const initialLng = userLocation?.lng || 77.5946;

    // Create Leaflet instance if not exists
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 13,
        zoomControl: true,
      });

      // Load copyright-free beautiful map tiles from OpenStreetMap
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapInstanceRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center when user location is detected
  useEffect(() => {
    if (mapInstanceRef.current && userLocation) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 13);
    }
  }, [userLocation?.lat, userLocation?.lng]);

  // Handle User Marker and Radius Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;

    // Remove old user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }
    // Remove old radius circle
    if (radiusCircleRef.current) {
      radiusCircleRef.current.remove();
    }

    // Custom pulsing user beacon SVG
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div class="relative flex items-center justify-center w-8 h-8">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4CAF50] opacity-40"></span>
          <div class="relative rounded-full h-4 w-4 bg-[#4CAF50] border-2 border-white shadow-md"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(map)
      .bindPopup('<b class="font-display text-[#2D3748]">You are here</b><br/><span class="text-xs text-gray-500">Detecting nearby veterinarians</span>')
      .openPopup();

    // Draw selection Radius Circle around user
    radiusCircleRef.current = L.circle([userLocation.lat, userLocation.lng], {
      radius: searchRadius * 1000, // converted to meters
      color: '#58B368',
      fillColor: '#BFE7C4',
      fillOpacity: 0.12,
      weight: 1,
      dashArray: '5, 5',
    }).addTo(map);

  }, [userLocation, searchRadius]);

  // Render Clinic Pins onto the map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old clinic markers
    (Object.values(markersRef.current) as any[]).forEach((marker: any) => marker.remove());
    markersRef.current = {};

    clinics.forEach((clinic) => {
      // Determine if selected
      const isSelected = clinic.id === selectedClinicId;
      const isEmergency = clinic.hasEmergency;

      // Custom HTML Marker using Tailwinds colors
      const iconColor = isSelected 
        ? '#58B368' 
        : (isEmergency ? '#2F855A' : '#7BCB83');

      const markerHtml = `
        <div class="flex flex-col items-center justify-center transition-transform hover:scale-110" style="filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.15));">
          <div class="relative flex items-center justify-center w-9 h-9 rounded-full ${isSelected ? 'border-2 border-white scale-110 animate-bounce' : ''}" style="background-color: ${iconColor};">
            ${
              isEmergency 
                ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19V5"/></svg>' 
                : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 2.91-3.34 3.12-3.5a1.16 1.16 0 0 1 .83-.1 1.05 1.05 0 0 1 .6 1.15c-.24 2.19-1 4.54-2 5.92a7.35 7.35 0 0 1 1.15 4c0 3.86-3.14 7-7 7s-7-3.14-7-7c0-1.42.42-2.73 1.15-4-1-1.38-1.74-3.73-2-5.92a1.05 1.05 0 0 1 .6-1.15 1.16 1.16 0 0 1 .83.1C6.67 1.92 7.8 3.26 9.58 5.26c.65-.17 1.33-.26 2.42-.26Z"/></svg>'
            }
          </div>
          <div class="w-2 h-2 -mt-1 rounded-full bg-slate-800 border border-white" style="background-color: ${iconColor};"></div>
        </div>
      `;

      const clinicIcon = L.divIcon({
        className: 'custom-clinic-marker',
        html: markerHtml,
        iconSize: [36, 42],
        iconAnchor: [18, 42],
      });

      const marker = L.marker([clinic.latitude, clinic.longitude], { icon: clinicIcon })
        .addTo(map)
        .on('click', () => {
          onSelectClinic(clinic.id);
        });

      // Tooltip/Popup binding
      marker.bindPopup(`
        <div class="min-w-[170px] font-sans">
          <h4 class="font-bold text-sm font-display text-gray-900">${clinic.name}</h4>
          <p class="text-xs text-gray-500 mt-1">${clinic.area}</p>
          <div class="flex items-center gap-1 mt-1.5">
            <span class="text-[#8BCF8F]">★</span>
            <span class="text-xs font-bold text-gray-800">${clinic.rating}</span>
            <span class="text-gray-400">(${clinic.reviewsCount})</span>
          </div>
          <p class="text-xs mt-1 font-semibold ${clinic.isOpenNow ? 'text-green-600' : 'text-emerald-700'}">
            ${clinic.isOpenNow ? '● Open Now' : '● Closed'}
          </p>
          ${clinic.hasEmergency ? '<span class="inline-block bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded mt-1.5">Emergency Unit</span>' : ''}
        </div>
      `);

      markersRef.current[clinic.id] = marker;

      // Autopan to active selection
      if (isSelected) {
        marker.openPopup();
        map.panTo([clinic.latitude, clinic.longitude]);
      }
    });

  }, [clinics, selectedClinicId]);

  // Handle Route Navigation Lines
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    if (!userLocation || !navigatingToClinicId) return;

    const clinic = clinics.find((c) => c.id === navigatingToClinicId);
    if (!clinic) return;

    // Setup coordinates for mapping the route
    const startPoint: L.LatLngExpression = [userLocation.lat, userLocation.lng];
    const endPoint: L.LatLngExpression = [clinic.latitude, clinic.longitude];

    // To simulate a realistic path routing experience (avoiding simple flat lines), we generate 2 intermediate coordinates representing typical city street turns.
    const midPoint1: L.LatLngExpression = [
      userLocation.lat + (clinic.latitude - userLocation.lat) * 0.4 + 0.001,
      userLocation.lng + (clinic.longitude - userLocation.lng) * 0.2 - 0.001,
    ];
    const midPoint2: L.LatLngExpression = [
      userLocation.lat + (clinic.latitude - userLocation.lat) * 0.85 - 0.0005,
      userLocation.lng + (clinic.longitude - userLocation.lng) * 0.7 + 0.0005,
    ];

    const routeCoordinates = [startPoint, midPoint1, midPoint2, endPoint];

    // Build the neon route line
    routeLineRef.current = L.polyline(routeCoordinates, {
      color: '#3B82F6',
      weight: 5,
      opacity: 0.8,
      dashArray: '10, 8',
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    // Zoom path to fit fully inside screen space
    const bounds = L.latLngBounds([startPoint, endPoint]);
    map.fitBounds(bounds, { padding: [40, 40] });

  }, [navigatingToClinicId, userLocation, clinics]);

  return (
    <div className="relative w-full h-full min-h-0 bg-slate-100 rounded-3xl overflow-hidden shadow-custom">
      <div id="leaflet-map-element" ref={mapContainerRef} className="w-full h-full min-h-0" />
      
      {/* Visual Navigation Legend */}
      <div className="absolute bottom-4 left-4 z-[999] bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-green-100 shadow-lg text-xs flex flex-col gap-1.5 pointer-events-none">
        <label className="font-bold text-gray-700 font-display">Map Legend</label>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#7BCB83]" />
          <span>Regular Clinic</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#2F855A]" />
          <span>Emergency Vet Clinic</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-100 border-2 border-blue-500" />
          <span>Your Location</span>
        </div>
      </div>
    </div>
  );
}

