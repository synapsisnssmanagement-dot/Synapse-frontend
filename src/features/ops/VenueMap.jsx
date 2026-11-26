"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

const PIN_HTML =
  '<span style="display:block;width:22px;height:22px;border-radius:9999px;background:#047857;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>';

// Draws/updates the venue pin, its range circle and the viewer's position.
function draw(state, props) {
  const { L, map } = state;
  if (!L || !map) return;
  const { center, radius, editable, you } = props;
  if (center) {
    if (state.circle) state.circle.setLatLng([center.lat, center.lng]).setRadius(radius);
    else state.circle = L.circle([center.lat, center.lng], { radius, color: "#047857", weight: 2, fillColor: "#10b981", fillOpacity: 0.15 }).addTo(map);
    if (state.pin) state.pin.setLatLng([center.lat, center.lng]);
    else {
      const marker = L.marker([center.lat, center.lng], {
        draggable: editable,
        keyboard: editable,
        title: "Venue",
        alt: "Venue pin",
        icon: L.divIcon({ className: "", html: PIN_HTML, iconSize: [22, 22], iconAnchor: [11, 11] }),
      }).addTo(map);
      if (editable) {
        marker.on("dragend", () => {
          const p = marker.getLatLng();
          state.onMove?.({ lat: p.lat, lng: p.lng });
        });
      }
      state.pin = marker;
    }
  } else {
    state.circle?.remove();
    state.pin?.remove();
    state.circle = state.pin = undefined;
  }
  if (you) {
    if (state.me) state.me.setLatLng([you.lat, you.lng]);
    else state.me = L.circleMarker([you.lat, you.lng], { radius: 7, color: "white", weight: 2, fillColor: "#2563eb", fillOpacity: 1 }).addTo(map);
    if (you.accuracy) {
      if (state.ring) state.ring.setLatLng([you.lat, you.lng]).setRadius(you.accuracy);
      else state.ring = L.circle([you.lat, you.lng], { radius: you.accuracy, color: "#2563eb", weight: 1, fillOpacity: 0.08 }).addTo(map);
    }
  }
}

// OpenStreetMap map with a venue pin and its check-in circle.
//  - editable: tap the map or drag the pin to move the venue
//  - you: optional { lat, lng, accuracy } shown as a blue dot (volunteer's position)
export default function VenueMap({ center, radius = 300, onMove, editable = false, you = null, height = 320, label = "Map" }) {
  const box = useRef(null);
  const state = useRef({});
  const props = useRef({ center, radius, editable, you });

  useEffect(() => {
    props.current = { center, radius, editable, you };
    state.current.onMove = onMove;
  });

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    const s = state.current;
    import("leaflet").then(({ default: L }) => {
      if (cancelled || !box.current || s.map) return;
      const { center: c, you: y, editable: ed } = props.current;
      const start = c || y || { lat: 20.59, lng: 78.96 }; // India until a point is known
      const map = L.map(box.current).setView([start.lat, start.lng], c || y ? 16 : 5);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      if (ed) map.on("click", (e) => s.onMove?.({ lat: e.latlng.lat, lng: e.latlng.lng }));
      s.L = L;
      s.map = map;
      draw(s, props.current);
    });
    return () => {
      cancelled = true;
      s.map?.remove();
      for (const k of Object.keys(s)) if (k !== "onMove") delete s[k];
    };
  }, []);

  // Redraw on changes; fit venue and viewer together when both are known.
  useEffect(() => {
    const s = state.current;
    draw(s, { center, radius, editable, you });
    if (!s.map || !s.L) return;
    if (center && you) s.map.fitBounds(s.L.latLngBounds([[center.lat, center.lng], [you.lat, you.lng]]).pad(0.4), { maxZoom: 17 });
    else if (center && editable) s.map.panTo([center.lat, center.lng]);
  }, [center, radius, editable, you]);

  return <div ref={box} role="application" aria-label={label} className="z-0 w-full overflow-hidden rounded-xl border border-line" style={{ height }} />;
}
