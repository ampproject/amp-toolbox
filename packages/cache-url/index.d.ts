export class AmpToolboxCacheUrl {
  static createCacheUrl(
    domainSuffix: string,
    url: string
  ): Promise<string>;
  static createCurlsSubdomain(
    url: string,
  ): Promise<string>;
}
