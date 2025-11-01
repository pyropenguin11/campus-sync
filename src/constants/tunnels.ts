import type { NodeCategory } from "@/types/tunnels";

export const NODE_TYPE_LABEL: Record<NodeCategory, string> = {
  academic: "Academic Building",
  student: "Student Life",
  research: "Research & Labs",
};

export const NODE_COLORS: Record<NodeCategory, string> = {
  academic: "#7a0019",
  student: "#ffcc33",
  research: "#c26d13",
};

export const TUNNEL_STROKE = "rgba(122, 0, 25, 0.7)";
export const TUNNEL_HIGHLIGHT = "#ffcc33";
