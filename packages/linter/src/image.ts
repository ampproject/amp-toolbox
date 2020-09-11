import { imageSize } from "image-size";
import fetch, { RequestInit } from "node-fetch";

async function probe(url: string | undefined, options: RequestInit) {
  if (url === undefined) url = "";
  const response = await fetch(url, options);
  if (!response.ok)
    throw Error(
      `HTTP Status Code: ${response.status}\nHTTP Status Text: ${response.statusText} \nCouldn't retrieve the following image: ${url}`
    );
  const buffer = await response.buffer();
  const image = imageSize(buffer);
  return image;
}

export { probe };
