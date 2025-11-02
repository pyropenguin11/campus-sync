declare module "maplibre-gl" {
  export class Map {
    constructor(options: any);
    addControl(control: any, position?: string): void;
    addLayer(layer: any): void;
    addSource(id: string, source: any): void;
    fitBounds(bounds: any, options?: any): void;
    getLayer(id: string): any;
    getSource(id: string): any;
    isStyleLoaded(): boolean;
    off(type: string, listener: (...args: unknown[]) => void): void;
    on(type: string, listener: (...args: unknown[]) => void): void;
    once(type: string, listener: (...args: unknown[]) => void): void;
    remove(): void;
    removeLayer(id: string): void;
    removeSource(id: string): void;
  }

  export class NavigationControl {
    constructor(options?: Record<string, unknown>);
  }

  const maplibregl: {
    Map: typeof Map;
    NavigationControl: typeof NavigationControl;
  };

  export default maplibregl;
}
