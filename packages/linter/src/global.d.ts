declare module "probe-image-size" {
  export interface ImageSize {
    width: number;
    height: number;
    mime: string;
    [k: string]: string | number;
  }

  export default function probe(
    url: string | undefined,
    args: { headers: { [k: string]: string } }
  ): Promise<ImageSize>;
}

declare module "amphtml-validator" {
  export function getInstance(
    s?: string
  ): Promise<{
    validateString: (s: string) => { status: string; errors: any[] };
  }>;
}

declare module "@ampproject/toolbox-cache-url" {
  export function createCacheUrl(
    cacheSuffix: string,
    url: string
  ): Promise<string>;
}

declare module "@ampproject/toolbox-cache-list" {
  export default class Caches {
    constructor();
    list(): Promise<Array<{ cacheDomain: string }>>;
  }
}
