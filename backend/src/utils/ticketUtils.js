import crypto from "crypto";
import QRCode from "qrcode";
// import { pool } from "../config/db.js";

const generateTicketToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const hashTicketToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const generateTicketQR = async (token) => {
  return QRCode.toDataURL(token);
};

const encryptTicketToken = (token) => {
  const keyHex = process.env.TICKET_ENCRYPTION_KEY;

  if (!keyHex || !/^[0-9a-fA-F]{64}$/.test(keyHex)) {
    throw new Error("TICKET_ENCRYPTION_KEY must be 32 bytes in hex");
  }

  const key = Buffer.from(keyHex, "hex");
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return JSON.stringify({
    iv: iv.toString("hex"),
    encrypted: encrypted.toString("hex"),
    authTag: authTag.toString("hex"),
  });
};

const decryptTicketToken = (encryptedData) => {
  const keyHex = process.env.TICKET_ENCRYPTION_KEY;

  if (!keyHex || !/^[0-9a-fA-F]{64}$/.test(keyHex)) {
    throw new Error("TICKET_ENCRYPTION_KEY must be 32 bytes in hex");
  }

  const key = Buffer.from(keyHex, "hex");
  const { iv, encrypted, authTag } = JSON.parse(encryptedData);

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(iv, "hex"),
  );

  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
};

export {
  generateTicketToken,
  hashTicketToken,
  generateTicketQR,
  encryptTicketToken,
  decryptTicketToken,
};
