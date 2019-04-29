import { getInstance } from "amphtml-validator";
import { existsSync } from "fs";

// If validator.js exists locally, use that, otherwise fetch over network.
const validator = existsSync("validator.js")
  ? getInstance("validator.js")
  : getInstance();

export async function validate(s: string) {
  const v = await validator;
  return v.validateString(s);
}
