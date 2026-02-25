import React, { useRef, useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";

type Pin = { id: number; lat: number; lng: number; label: string };

type Props = {
  center: { lat: number; lng: number };
  simulatedLocation: { lat: number; lng: number } | null;
  simMode: boolean;
  targetPins: Pin[];
  selectedTarget: Pin | null;
  currentPos: { lat: number; lng: number } | null;
  showsUserLocation: boolean;
  onMapPress: (lat: number, lng: number) => void;
  onSimDrag: (lat: number, lng: number) => void;
  onTargetSelect: (pin: Pin) => void;
  onMapReady: () => void;
  mapRef?: React.MutableRefObject<any>;
};

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

let leafletLoading = false;
let leafletLoaded = false;
const leafletCallbacks: (() => void)[] = [];

function loadLeaflet(cb: () => void) {
  if (leafletLoaded || (typeof window !== "undefined" && (window as any).L)) {
    leafletLoaded = true;
    cb();
    return;
  }
  leafletCallbacks.push(cb);
  if (leafletLoading) return;
  leafletLoading = true;

  if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = LEAFLET_CSS;
    document.head.appendChild(link);
  }

  if (!document.querySelector(`script[src="${LEAFLET_JS}"]`)) {
    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.onload = () => {
      leafletLoaded = true;
      leafletCallbacks.forEach((fn) => fn());
      leafletCallbacks.length = 0;
    };
    script.onerror = () => {
      leafletLoading = false;
    };
    document.head.appendChild(script);
  }
}

export default function CourseMap(props: Props) {
  const {
    center, simulatedLocation, simMode, targetPins, selectedTarget,
    currentPos, showsUserLocation, onMapPress, onSimDrag, onTargetSelect,
    onMapReady, mapRef,
  } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapObjRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const simMarkerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const polylinesRef = useRef<any[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    loadLeaflet(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (mapObjRef.current) {
      mapObjRef.current.setView([center.lat, center.lng], 16);
      return;
    }

    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19 }
    ).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);

    map.on("click", (e: any) => {
      onMapPress(e.latlng.lat, e.latlng.lng);
    });

    mapObjRef.current = map;

    if (mapRef) {
      mapRef.current = {
        animateToRegion: (region: any, duration: number) => {
          map.flyTo([region.latitude, region.longitude], 16, { duration: duration / 1000 });
        },
      };
    }

    onMapReady();

    return () => {
      map.remove();
      mapObjRef.current = null;
    };
  }, [ready, center.lat, center.lng]);

  useEffect(() => {
    const L = (window as any).L;
    const map = mapObjRef.current;
    if (!L || !map) return;

    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    targetPins.forEach((pin, i) => {
      const isSelected = selectedTarget && selectedTarget.id === pin.id;
      const color = isSelected ? "#FF5722" : "#FFC107";
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:22px;height:22px;border-radius:11px;background:${color};border:2.5px solid #fff;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:#fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);">${i + 1}</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 22],
      });
      const marker = L.marker([pin.lat, pin.lng], { icon }).addTo(map);
      marker.on("click", () => onTargetSelect(pin));
      markersRef.current.push(marker);
    });
  }, [targetPins, selectedTarget]);

  useEffect(() => {
    const L = (window as any).L;
    const map = mapObjRef.current;
    if (!L || !map) return;

    if (simMarkerRef.current) {
      map.removeLayer(simMarkerRef.current);
      simMarkerRef.current = null;
    }

    if (simMode && simulatedLocation) {
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:28px;height:28px;position:relative;display:flex;align-items:center;justify-content:center;"><div style="width:28px;height:28px;border-radius:14px;border:2px solid rgba(33,150,243,0.5);position:absolute;"></div><div style="width:14px;height:14px;border-radius:7px;background:#2196F3;border:2.5px solid #fff;position:absolute;box-shadow:0 2px 6px rgba(33,150,243,0.5);"></div></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const marker = L.marker([simulatedLocation.lat, simulatedLocation.lng], {
        icon,
        draggable: true,
      }).addTo(map);
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onSimDrag(pos.lat, pos.lng);
      });
      simMarkerRef.current = marker;
    }
  }, [simMode, simulatedLocation]);

  useEffect(() => {
    const L = (window as any).L;
    const map = mapObjRef.current;
    if (!L || !map) return;

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    if (!simMode && showsUserLocation && currentPos) {
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:14px;height:14px;border-radius:7px;background:#4285F4;border:2.5px solid #fff;box-shadow:0 0 8px rgba(66,133,244,0.6);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      const marker = L.marker([currentPos.lat, currentPos.lng], { icon }).addTo(map);
      userMarkerRef.current = marker;
    }
  }, [simMode, showsUserLocation, currentPos]);

  useEffect(() => {
    const L = (window as any).L;
    const map = mapObjRef.current;
    if (!L || !map) return;

    polylinesRef.current.forEach((pl) => map.removeLayer(pl));
    polylinesRef.current = [];

    if (currentPos && selectedTarget) {
      const line = L.polyline(
        [[currentPos.lat, currentPos.lng], [selectedTarget.lat, selectedTarget.lng]],
        { color: "#FF5722", weight: 2, dashArray: "8 6" }
      ).addTo(map);
      polylinesRef.current.push(line);
    }

    if (targetPins.length >= 2) {
      const line = L.polyline(
        targetPins.map((p) => [p.lat, p.lng]),
        { color: "rgba(255,193,7,0.5)", weight: 1.5, dashArray: "4 4" }
      ).addTo(map);
      polylinesRef.current.push(line);
    }
  }, [currentPos, selectedTarget, targetPins]);

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
      />
    </View>
  );
}
