import type { TunnelNode, TunnelSegment } from "@/types/tunnels";

export const TUNNEL_NODES: TunnelNode[] = [
  {
    id: "northrop",
    name: "Northrop",
    position: [44.973988, -93.23237],
    type: "academic",
  },
  {
    id: "morrill",
    name: "Morrill Hall",
    position: [44.973751, -93.231247],
    type: "academic",
  },
  {
    id: "walter",
    name: "Walter Library",
    position: [44.974711, -93.231774],
    type: "academic",
  },
  {
    id: "lind",
    name: "Lind Hall",
    position: [44.975258, -93.232522],
    type: "academic",
  },
  {
    id: "keller",
    name: "Keller Hall",
    position: [44.975101, -93.22956],
    type: "research",
  },
  {
    id: "stss",
    name: "Science Teaching & Student Services",
    position: [44.972983, -93.22745],
    type: "student",
  },
  {
    id: "coffman",
    name: "Coffman Memorial Union",
    position: [44.972712, -93.235466],
    type: "student",
  },
  {
    id: "peik",
    name: "Peik Hall",
    position: [44.972326, -93.226106],
    type: "academic",
  },
  {
    id: "anderson",
    name: "Anderson Hall",
    position: [44.972708, -93.23026],
    type: "academic",
  },
  {
    id: "weisman",
    name: "Weisman Art Museum",
    position: [44.972671, -93.230991],
    type: "student",
  },
];

export const TUNNEL_SEGMENTS: TunnelSegment[] = [
  ["northrop", "morrill"],
  ["morrill", "walter"],
  ["walter", "lind"],
  ["lind", "keller"],
  ["walter", "stss"],
  ["stss", "coffman"],
  ["coffman", "anderson"],
  ["anderson", "stss"],
  ["stss", "peik"],
  ["coffman", "weisman"],
];

export const ROUTE_HIGHLIGHT = [
  "northrop",
  "morrill",
  "walter",
  "stss",
  "coffman",
] as const;
