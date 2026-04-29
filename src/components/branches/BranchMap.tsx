"use client";

import { Button } from "@/components/ui/button";
import { Branch } from "@/types";
import L from "leaflet";
import { Building2, Edit, MapPin, Navigation, Phone } from "lucide-react";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

const DEFAULT_CENTER: [number, number] = [37.5665, 126.978];
const DEFAULT_ZOOM = 11;

interface BranchMapProps {
  branches: Branch[];
  selectedBranchId?: string | null;
  onBranchSelect?: (branchId: string) => void;
  onEditBranch?: (branch: Branch) => void;
  heightClassName?: string;
  containerClassName?: string;
}

interface MappedBranch {
  branch: Branch;
  position: [number, number];
}

function hasValidCoordinates(branch: Branch): branch is Branch & {
  location: Branch["location"] & {
    coordinates: { latitude: number; longitude: number };
  };
} {
  const coordinates = branch.location.coordinates;
  return (
    typeof coordinates?.latitude === "number" &&
    typeof coordinates.longitude === "number" &&
    coordinates.latitude >= -90 &&
    coordinates.latitude <= 90 &&
    coordinates.longitude >= -180 &&
    coordinates.longitude <= 180
  );
}

function createBranchIcon(isSelected: boolean) {
  return L.divIcon({
    className: "king-kebab-branch-marker",
    html: `
			<div class="${isSelected ? "is-selected" : ""}">
				<span></span>
			</div>
		`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -30],
  });
}

function getDirectionsUrl(position: [number, number]): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${position[0]},${position[1]}`;
}

function isVisibleLocationPart(value?: string): value is string {
  const trimmedValue = value?.trim();
  return Boolean(trimmedValue && trimmedValue !== "-" && trimmedValue !== "—");
}

function formatBranchAddress(branch: Branch): string {
  return [
    branch.location.address,
    branch.location.city,
    branch.location.district,
  ]
    .filter(isVisibleLocationPart)
    .join(", ");
}

function BoundsController({
  branches,
  selectedBranch,
}: {
  branches: MappedBranch[];
  selectedBranch?: MappedBranch;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedBranch) {
      map.flyTo(selectedBranch.position, 15, { duration: 0.6 });
      return;
    }

    if (branches.length === 1) {
      map.setView(branches[0].position, 14);
      return;
    }

    if (branches.length > 1) {
      map.fitBounds(L.latLngBounds(branches.map(({ position }) => position)), {
        padding: [40, 40],
      });
    }
  }, [branches, map, selectedBranch]);

  return null;
}

export default function BranchMap({
  branches,
  selectedBranchId,
  onBranchSelect,
  onEditBranch,
  heightClassName = "h-[520px]",
  containerClassName,
}: BranchMapProps) {
  const mappedBranches = useMemo<MappedBranch[]>(
    () =>
      branches.filter(hasValidCoordinates).map((branch) => ({
        branch,
        position: [
          branch.location.coordinates.latitude,
          branch.location.coordinates.longitude,
        ],
      })),
    [branches],
  );

  const selectedBranch = mappedBranches.find(
    ({ branch }) => branch._id === selectedBranchId,
  );

  return (
    <div
      className={
        containerClassName ??
        `${heightClassName} overflow-hidden rounded-2xl border border-border bg-card shadow-sm`
      }
    >
      {mappedBranches.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="rounded-full bg-primary/10 p-4">
            <MapPin className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">
              No branch coordinates yet
            </h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Add latitude and longitude to a branch to show it on the map.
            </p>
          </div>
        </div>
      ) : (
        <MapContainer
          center={
            selectedBranch?.position ??
            mappedBranches[0]?.position ??
            DEFAULT_CENTER
          }
          zoom={selectedBranch ? 15 : DEFAULT_ZOOM}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <BoundsController
            branches={mappedBranches}
            selectedBranch={selectedBranch}
          />
          {mappedBranches.map(({ branch, position }) => (
            <Marker
              key={branch._id}
              position={position}
              icon={createBranchIcon(branch._id === selectedBranchId)}
              eventHandlers={{
                click: () => onBranchSelect?.(branch._id),
              }}
            >
              <Popup closeButton={false} minWidth={280} maxWidth={360}>
                <div className="w-[18rem] max-w-[calc(100vw-4rem)] space-y-4 rounded-[1.75rem] bg-white/95 p-1 text-slate-950 backdrop-blur-xl sm:w-[20rem]">
                  <div className="flex items-start gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 shadow-inner shadow-blue-100/80">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p className="truncate text-xl font-semibold tracking-tight">
                        {branch.name}
                      </p>
                      <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold tracking-wide text-slate-500">
                        {branch.code}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2.5 text-sm text-slate-600">
                    {formatBranchAddress(branch) && (
                      <p className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <span className="leading-relaxed">
                          {formatBranchAddress(branch)}
                        </span>
                      </p>
                    )}
                    {branch.contact?.phone && (
                      <p className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                        <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                        {branch.contact.phone}
                      </p>
                    )}
                  </div>
                  <Button
                    asChild
                    type="button"
                    size="lg"
                    className="h-12 w-full rounded-2xl bg-blue-600 text-base font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500 hover:text-white"
                  >
                    <a
                      href={getDirectionsUrl(position)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-white"
                    >
                      <Navigation className="mr-2 h-4 w-4" />
                      Directions
                    </a>
                  </Button>
                  {onEditBranch && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-11 w-full rounded-2xl"
                      onClick={() => onEditBranch(branch)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Branch
                    </Button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
}
