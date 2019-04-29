import { existsSync, readFileSync } from "fs";
import ampCacheList from "amp-toolbox-cache-list";

const cacheList = (existsSync("caches.json")
  ? Promise.resolve(JSON.parse(readFileSync("caches.json").toString()).caches)
  : new ampCacheList().list()) as Promise<
  Array<{
    cacheDomain: string;
  }>
>;

export function caches() {
  return cacheList;
}
