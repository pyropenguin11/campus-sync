'use client';

import { useCallback, useMemo, useState } from "react";
import { MapView } from "@/components/map-view";
import { MAP_CENTER, MAP_ZOOM } from "@/constants/map";
import { NODE_TYPE_LABEL } from "@/constants/tunnels";
import type { LatLngTuple } from "@/types/tunnels";
import { api } from "@/trpc/client";

type LeafletInstance = any;

export default function HomePage() {
  const [mapInstance, setMapInstance] = useState<LeafletInstance | null>(null);

  const { data } = api.tunnels.mapData.useQuery();

  const nodes = data?.nodes ?? [];
  const segments = data?.segments ?? [];
  const highlightRoute = data?.highlightRoute ?? [];

  const nodeLookup = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  );

  const tunnelSegments = useMemo(
    () =>
      segments
        .map(([from, to]) => {
          const start = nodeLookup.get(from);
          const end = nodeLookup.get(to);
          if (!start || !end) return null;
          return [start.position, end.position] as [
            LatLngTuple,
            LatLngTuple,
          ];
        })
        .filter(
          (segment): segment is [LatLngTuple, LatLngTuple] => Boolean(segment),
        ),
    [segments, nodeLookup],
  );

  const routePoints = useMemo(
    () =>
      highlightRoute
        .map((id) => nodeLookup.get(id)?.position)
        .filter(
          (value): value is LatLngTuple =>
            Array.isArray(value) && value.length === 2,
        ),
    [highlightRoute, nodeLookup],
  );

  const handleMapReady = useCallback((instance: LeafletInstance | null) => {
    setMapInstance(instance);
  }, []);

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">
            CS
          </span>
          <div>
            <strong>Campus Sync</strong>
            <span className="brand-subtitle">UMN Tunnel Explorer</span>
          </div>
        </div>
        <div className="search-bar" role="search">
          <input
            type="text"
            placeholder="Search buildings, tunnels, or dining"
            aria-label="Search campus map"
          />
          <button type="button">Search</button>
        </div>
        <div className="header-actions">
          <button type="button" className="icon-button" aria-label="Map layers">
            ⊞
          </button>
          <button type="button" className="icon-button" aria-label="Settings">
            ☰
          </button>
          <div className="avatar" aria-hidden="true">
            NK
          </div>
        </div>
      </header>

      <div className="workspace">
        <aside className="side-panel">
          <section className="panel-section">
            <h2>Explore tunnels</h2>
            <p>
              Toggle layers and highlights to plan your trip through the Gopher
              Way tunnel network.
            </p>
            <div className="layer-options">
              <button className="layer-toggle active" type="button">
                <span className="status-dot open" aria-hidden="true" />
                Open tunnels
              </button>
              <button className="layer-toggle" type="button">
                <span className="status-dot limited" aria-hidden="true" />
                Limited access
              </button>
              <button className="layer-toggle" type="button">
                <span className="status-dot construction" aria-hidden="true" />
                Construction updates
              </button>
            </div>
          </section>

          <section className="panel-section">
            <h3>Popular connections</h3>
            <ul className="popular-list">
              <li>
                <span className="node-badge">A</span>
                Northrop → Coffman Union
              </li>
              <li>
                <span className="node-badge">B</span>
                Walter Library → Keller Hall
              </li>
              <li>
                <span className="node-badge">C</span>
                STSS → Peik Hall
              </li>
            </ul>
          </section>

          <section className="panel-section tunnel-legend">
            <h3>Segment legend</h3>
            <ul>
              <li>
                <span className="legend-line open" aria-hidden="true" />
                Open underground connector
              </li>
              <li>
                <span className="legend-line detour" aria-hidden="true" />
                Winter route detour
              </li>
              <li>
                <span className="legend-dot academic" aria-hidden="true" />
                {NODE_TYPE_LABEL.academic}
              </li>
              <li>
                <span className="legend-dot student" aria-hidden="true" />
                {NODE_TYPE_LABEL.student}
              </li>
              <li>
                <span className="legend-dot research" aria-hidden="true" />
                {NODE_TYPE_LABEL.research}
              </li>
            </ul>
          </section>
        </aside>

        <main className="map-area">
          <div className="map-canvas">
            <MapView
              tunnelSegments={tunnelSegments}
              routePoints={routePoints}
              nodes={nodes}
              onMapReady={handleMapReady}
            />

            <div className="floating-card directions-card">
              <header>
                <strong>Route preview</strong>
                <span className="badge badge-live">Live</span>
              </header>
              <ol>
                <li>
                  <span className="step-index">A</span>
                  Northrop Auditorium lobby
                </li>
                <li>
                  <span className="step-index">B</span>
                  Follow main tunnel past Morrill Hall
                </li>
                <li>
                  <span className="step-index">C</span>
                  Exit near Coffman Memorial Union
                </li>
              </ol>
              <button type="button" className="primary-btn">
                Preview route
              </button>
            </div>

            <div className="floating-card status-card">
              <strong>Status</strong>
              <p>
                Heating plant passage open until 11:30&nbsp;PM. Expect
                increased traffic near Coffman due to event setup.
              </p>
            </div>

            <div className="floating-card layer-card">
              <strong>Layers</strong>
              <ul>
                <li>
                  <span className="layer-dot open" />
                  Winter walkways
                </li>
                <li>
                  <span className="layer-dot limited" />
                  Accessible routes
                </li>
                <li>
                  <span className="layer-dot detour" />
                  Maintenance alerts
                </li>
              </ul>
            </div>

            <div className="zoom-controls" role="group" aria-label="Zoom controls">
              <button
                type="button"
                aria-label="Zoom in"
                onClick={() => mapInstance?.zoomIn()}
                disabled={!mapInstance}
              >
                +
              </button>
              <button
                type="button"
                aria-label="Zoom out"
                onClick={() => mapInstance?.zoomOut()}
                disabled={!mapInstance}
              >
                −
              </button>
            </div>

            <button
              type="button"
              className="locate-button"
              aria-label="Center map"
              onClick={() =>
                mapInstance?.flyTo(MAP_CENTER, MAP_ZOOM, { duration: 0.8 })
              }
              disabled={!mapInstance}
            >
              ◎
            </button>

            <div className="scale-indicator" aria-hidden="true">
              <div className="scale-bar" />
              200 ft
            </div>

            <div className="map-attribution">
              Unofficial visualization. Not for outdoor navigation.
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
