import assert from "node:assert/strict";
import {
  generateTicketToken,
  encryptTicketToken,
  decryptTicketToken,
  hashTicketToken,
} from "../utils/ticketUtils.js";

const token = generateTicketToken();
const encrypted = encryptTicketToken(token);
const decrypted = decryptTicketToken(encrypted);

assert.equal(decrypted, token);
assert.equal(hashTicketToken(token).length, 64);

console.log("Ticket encryption tests passed!");
