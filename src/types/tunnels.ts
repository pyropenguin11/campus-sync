export type NodeCategory = "academic" | "student" | "research";

export type LatLngTuple = [number, number];

export interface TunnelNode {
  id: string;
  name: string;
  position: LatLngTuple;
  type: NodeCategory;
}

export type TunnelSegment = [string, string];

export interface TunnelMapData {
  nodes: TunnelNode[];
  segments: TunnelSegment[];
  highlightRoute: string[];
}
