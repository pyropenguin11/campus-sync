import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

type Primitive = string | number | boolean;

export type ArcgisQueryParams = Record<string, Primitive | undefined>;

export interface FetchArcgisJsonOptions {
  /**
   * Additional query parameters appended to the request.
   * Existing parameters present on the URL take precedence.
   */
  query?: ArcgisQueryParams;
  /**
   * Optional init passed to the underlying fetch call.
   */
  init?: RequestInit;
}

export interface DownloadArcgisDatasetOptions extends FetchArcgisJsonOptions {
  /**
   * Absolute or workspace-relative path for the JSON output.
   */
  outputPath: string;
  /**
   * When true, output is formatted with indentation.
   */
  pretty?: boolean;
}

const toRecordString = (value: Primitive | undefined): string | undefined => {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (value === undefined) {
    return undefined;
  }
  return String(value);
};

/**
 * Fetches JSON from an ArcGIS FeatureServer endpoint. By default the query
 * ensures `f=json` is present while allowing callers to pass additional query
 * parameters such as `where=1=1` or `outFields=*`.
 */
export async function fetchArcgisJson<T = unknown>(
  endpoint: string,
  options: FetchArcgisJsonOptions = {},
): Promise<T> {
  const url = new URL(endpoint);

  const searchParams = new URLSearchParams(url.search);

  const query: ArcgisQueryParams = {
    f: "json",
    ...options.query,
  };

  for (const [key, value] of Object.entries(query)) {
    const stringValue = toRecordString(value);
    if (stringValue === undefined) {
      continue;
    }
    if (!searchParams.has(key)) {
      searchParams.set(key, stringValue);
    }
  }

  url.search = searchParams.toString();

  const response = await fetch(url, options.init);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ArcGIS data: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as T;
}

/**
 * Downloads JSON from an ArcGIS endpoint and writes it to disk.
 */
export async function downloadArcgisDataset(
  endpoint: string,
  { outputPath, pretty = true, ...options }: DownloadArcgisDatasetOptions,
): Promise<void> {
  const data = await fetchArcgisJson(endpoint, options);

  const serialized = pretty
    ? JSON.stringify(data, null, 2)
    : JSON.stringify(data);

  const absoluteOutputPath = outputPath.startsWith("/")
    ? outputPath
    : `${process.cwd()}/${outputPath}`;

  await mkdir(dirname(absoluteOutputPath), { recursive: true });
  await writeFile(absoluteOutputPath, `${serialized}\n`, "utf-8");
}
