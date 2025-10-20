import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

type NodeCategory = 'academic' | 'student' | 'research'
type LatLngTuple = [number, number]

type TunnelNode = {
  id: string
  name: string
  position: LatLngTuple
  type: NodeCategory
}

const MAP_CENTER: LatLngTuple = [44.9739, -93.2317]
const MAP_ZOOM = 16.5
const TILE_LAYER_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

const TUNNEL_NODES: TunnelNode[] = [
  {
    id: 'northrop',
    name: 'Northrop',
    position: [44.973988, -93.23237],
    type: 'academic',
  },
  {
    id: 'morrill',
    name: 'Morrill Hall',
    position: [44.973751, -93.231247],
    type: 'academic',
  },
  {
    id: 'walter',
    name: 'Walter Library',
    position: [44.974711, -93.231774],
    type: 'academic',
  },
  {
    id: 'lind',
    name: 'Lind Hall',
    position: [44.975258, -93.232522],
    type: 'academic',
  },
  {
    id: 'keller',
    name: 'Keller Hall',
    position: [44.975101, -93.22956],
    type: 'research',
  },
  {
    id: 'stss',
    name: 'Science Teaching & Student Services',
    position: [44.972983, -93.22745],
    type: 'student',
  },
  {
    id: 'coffman',
    name: 'Coffman Memorial Union',
    position: [44.972712, -93.235466],
    type: 'student',
  },
  {
    id: 'peik',
    name: 'Peik Hall',
    position: [44.972326, -93.226106],
    type: 'academic',
  },
  {
    id: 'anderson',
    name: 'Anderson Hall',
    position: [44.972708, -93.23026],
    type: 'academic',
  },
  {
    id: 'weisman',
    name: 'Weisman Art Museum',
    position: [44.972671, -93.230991],
    type: 'student',
  },
]

const TUNNEL_SEGMENTS: Array<[string, string]> = [
  ['northrop', 'morrill'],
  ['morrill', 'walter'],
  ['walter', 'lind'],
  ['lind', 'keller'],
  ['walter', 'stss'],
  ['stss', 'coffman'],
  ['coffman', 'anderson'],
  ['anderson', 'stss'],
  ['stss', 'peik'],
  ['coffman', 'weisman'],
]

const ROUTE_HIGHLIGHT = ['northrop', 'morrill', 'walter', 'stss', 'coffman']

const nodeLookup = new Map(TUNNEL_NODES.map((node) => [node.id, node]))

const typeLabel: Record<NodeCategory, string> = {
  academic: 'Academic Building',
  student: 'Student Life',
  research: 'Research & Labs',
}

const nodeColors: Record<NodeCategory, string> = {
  academic: '#7a0019',
  student: '#ffcc33',
  research: '#c26d13',
}

const tunnelStroke = 'rgba(122, 0, 25, 0.7)'
const tunnelHighlight = '#ffcc33'

type LeafletInstance = any

const leafletVersion = '1.9.4'
const leafletJsCdn = `https://unpkg.com/leaflet@${leafletVersion}/dist/leaflet.js`
const leafletCssCdn = `https://unpkg.com/leaflet@${leafletVersion}/dist/leaflet.css`

let leafletLoader: Promise<LeafletInstance | null> | null = null

const ensureLeafletLink = () => {
  if (typeof document === 'undefined') return
  const existing = document.querySelector<HTMLLinkElement>('link[data-leaflet]')
  if (!existing) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = leafletCssCdn
    link.integrity = 'sha512-pMpr2bqBiKx2ATs3nV846dOOxzXMZO08h8tZz7ZxbYlR5c+3F4iAfDdc/K1Ji/7luWGINuD/7++PK5H+0uQ1pg=='
    link.crossOrigin = ''
    link.setAttribute('data-leaflet', 'true')
    document.head.appendChild(link)
  }
}

const loadLeaflet = async (): Promise<LeafletInstance | null> => {
  if (typeof window === 'undefined') return null
  const existing = (window as typeof window & { L?: LeafletInstance }).L
  if (existing) return existing
  if (!leafletLoader) {
    ensureLeafletLink()
    leafletLoader = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = leafletJsCdn
      script.async = true
      script.integrity =
        'sha512-y7m90PgsSjD/F7kh/3Gzdhvj1io8GZFODdgNpTi27C/medfyqCkCmDYJLdnOjFkWDXe4sdRQ4pQMBYbgl2hF0A=='
      script.crossOrigin = ''
      script.onload = () => resolve((window as any).L ?? null)
      script.onerror = () => reject(new Error('Leaflet failed to load'))
      document.body.appendChild(script)
    }).catch(() => null)
  }
  return leafletLoader
}

type MapViewProps = {
  tunnelSegments: Array<[LatLngTuple, LatLngTuple]>
  routePoints: LatLngTuple[]
  nodes: TunnelNode[]
  onMapReady: (map: LeafletInstance | null) => void
}

const MapView = ({ tunnelSegments, routePoints, nodes, onMapReady }: MapViewProps) => {
  const [mapError, setMapError] = useState<string | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let mapInstance: LeafletInstance | null = null
    let layers: LeafletInstance[] = []
    let cancelled = false

    setMapError(null)

    loadLeaflet()
      .then((L) => {
        if (cancelled) return
        if (!L) {
          setMapError('Unable to load map tiles right now.')
          onMapReady(null)
          return
        }
        const target = mapContainerRef.current
        if (!target) {
          onMapReady(null)
          return
        }
        mapInstance = L.map(target, {
          center: MAP_CENTER,
          zoom: MAP_ZOOM,
          scrollWheelZoom: true,
          zoomControl: false,
        })

        L.tileLayer(TILE_LAYER_URL, {
          attribution: TILE_ATTRIBUTION,
          maxZoom: 20,
        }).addTo(mapInstance)

        tunnelSegments.forEach((segment) => {
          const layer = L.polyline(segment, {
            color: tunnelStroke,
            weight: 4,
            opacity: 0.92,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(mapInstance)
          layers.push(layer)
        })

        if (routePoints.length > 1) {
          const highlightLayer = L.polyline(routePoints, {
            color: tunnelHighlight,
            weight: 6,
            opacity: 0.88,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(mapInstance)
          layers.push(highlightLayer)
        }

        nodes.forEach((node) => {
          const marker = L.circleMarker(node.position, {
            color: '#ffffff',
            weight: 2,
            fillColor: nodeColors[node.type],
            fillOpacity: 0.95,
            radius: 9,
          }).addTo(mapInstance)
          marker.bindTooltip(
            `<div class="tooltip-title">${node.name}</div><div class="tooltip-meta">${typeLabel[node.type]}</div>`,
            {
              direction: 'top',
              offset: [0, -12],
              opacity: 0.95,
              className: 'node-tooltip',
            },
          )
          layers.push(marker)
        })

        onMapReady(mapInstance)
        return null
      })
      .catch(() => {
        if (cancelled) return
        setMapError('Unable to load map tiles right now.')
        onMapReady(null)
      })

    return () => {
      cancelled = true
      if (layers.length > 0) {
        layers.forEach((layer) => {
          if (layer?.remove) layer.remove()
        })
      }
      if (mapInstance) {
        mapInstance.remove()
      }
      onMapReady(null)
    }
  }, [tunnelSegments, routePoints, nodes, onMapReady])

  if (mapError) {
    return <div className="map-error">{mapError}</div>
  }

  return (
    <div
      ref={mapContainerRef}
      className="map-shell"
      role="application"
      aria-label="Campus map"
    />
  )
}

const App = () => {
  const [mapInstance, setMapInstance] = useState<LeafletInstance | null>(null)

  const handleMapReady = useCallback((instance: LeafletInstance | null) => {
    setMapInstance(instance)
  }, [])
  const routePoints = useMemo(
    () =>
      ROUTE_HIGHLIGHT.map((id) => nodeLookup.get(id)?.position).filter(
        (value): value is LatLngTuple => Boolean(value),
      ),
    [],
  )

  const tunnelSegments = useMemo(
    () =>
      TUNNEL_SEGMENTS.map(([from, to]) => {
        const start = nodeLookup.get(from)
        const end = nodeLookup.get(to)
        if (!start || !end) return null
        return [start.position, end.position] as [LatLngTuple, LatLngTuple]
      }).filter((segment): segment is [LatLngTuple, LatLngTuple] => Boolean(segment)),
    [],
  )

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
              Toggle layers and highlights to plan your trip through the Gopher Way tunnel
              network.
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
                Academic building
              </li>
              <li>
                <span className="legend-dot student" aria-hidden="true" />
                Student life hub
              </li>
              <li>
                <span className="legend-dot research" aria-hidden="true" />
                Research facility
              </li>
            </ul>
          </section>
        </aside>

        <main className="map-area">
          <div className="map-canvas">
            <MapView
              tunnelSegments={tunnelSegments}
              routePoints={routePoints}
              nodes={TUNNEL_NODES}
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
                Heating plant passage open until 11:30&nbsp;PM. Expect increased traffic near
                Coffman due to event setup.
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
              onClick={() => mapInstance?.flyTo(MAP_CENTER, MAP_ZOOM, { duration: 0.8 })}
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
  )
}

export default App
