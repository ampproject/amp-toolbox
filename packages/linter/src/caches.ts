import { existsSync, readFileSync } from "fs";
import AmpCacheList from "@ampproject/toolbox-cache-list";

const cacheList = (existsSync("caches.json")
  ? Promise.resolve(JSON.parse(readFileSync("caches.json").toString()).caches)
  : new AmpCacheList().list()) as Promise<
  Array<{
    cacheDomain: string;
  }>
>;

export function caches() {
  return cacheList;
}
