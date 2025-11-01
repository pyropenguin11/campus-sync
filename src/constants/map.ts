import type { LatLngTuple } from "@/types/tunnels";

export const MAP_CENTER: LatLngTuple = [44.9739, -93.2317];
export const MAP_ZOOM = 16.5;

export const TILE_LAYER_URL =
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const LEAFLET_VERSION = "1.9.4";
export const LEAFLET_JS_CDN = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
export const LEAFLET_CSS_CDN = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
