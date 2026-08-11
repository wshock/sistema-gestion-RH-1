import { compare, hash } from "bcryptjs";

const COST_FACTOR = 12;

export function hashPassword(plainPassword: string): Promise<string> {
  return hash(plainPassword, COST_FACTOR);
}

export function verifyPassword(
  plainPassword: string,
  passwordHash: string,
): Promise<boolean> {
  return compare(plainPassword, passwordHash);
}
