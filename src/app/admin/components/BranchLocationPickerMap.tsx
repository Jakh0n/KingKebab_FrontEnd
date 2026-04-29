"use client";

import L from "leaflet";
import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

const DEFAULT_CENTER: [number, number] = [37.5665, 126.978];

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface BranchLocationPickerMapProps {
  value?: Coordinates;
  onChange: (coordinates: Coordinates) => void;
}

function createPickerIcon() {
  return L.divIcon({
    className: "king-kebab-picker-marker",
    html: "<div><span></span></div>",
    iconSize: [34, 34],
    iconAnchor: [17, 34],
  });
}

function MapClickHandler({
  onChange,
}: {
  onChange: (coordinates: Coordinates) => void;
}) {
  useMapEvents({
    click(event) {
      onChange({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return null;
}

function SelectedLocationController({ value }: { value?: Coordinates }) {
  const map = useMap();

  useEffect(() => {
    if (!value) return;

    map.flyTo([value.latitude, value.longitude], Math.max(map.getZoom(), 15), {
      duration: 0.5,
    });
  }, [map, value]);

  return null;
}

export default function BranchLocationPickerMap({
  value,
  onChange,
}: BranchLocationPickerMapProps) {
  const center: [number, number] = value
    ? [value.latitude, value.longitude]
    : DEFAULT_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={value ? 15 : 11}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onChange={onChange} />
      <SelectedLocationController value={value} />
      {value && (
        <Marker
          position={[value.latitude, value.longitude]}
          icon={createPickerIcon()}
        />
      )}
    </MapContainer>
  );
}
