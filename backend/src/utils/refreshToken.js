import { randomBytes, createHash } from "node:crypto";

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const generateRefreshToken = () => {
  return randomBytes(32).toString("hex");
};

const hashRefreshToken = (refreshToken) => {
  return createHash("sha256").update(refreshToken).digest("hex");
};

const getRefreshTokenExpiry = () => {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
};
export {
  REFRESH_TOKEN_TTL_MS,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiry,
};
