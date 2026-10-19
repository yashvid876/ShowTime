import { redisClient } from "../config/redis.js";

const LOCK_TTL_SECONDS = 600;

const getLockKey = (showId, seatId) =>
  `seat-lock:show-${showId}:seat-${seatId}`;

export const lockSeat = async (showId, seatId, userId) => {
  const key = getLockKey(showId, seatId);

  const result = await redisClient.set(key, String(userId), {
    NX: true,
    EX: LOCK_TTL_SECONDS,
  });

  return result === "OK";
};

export const isSeatLocked = async (showId, seatId) => {
  const key = getLockKey(showId, seatId);
  return (await redisClient.exists(key)) === 1;
};

export const releaseSeat = async (showId, seatId, userId) => {
  const key = getLockKey(showId, seatId);

  // Release only if the current owner matches userId.
  const script = `
    if redis.call("GET", KEYS[1]) == ARGV[1] then
      return redis.call("DEL", KEYS[1])
    else
      return 0
    end
  `;

  const result = await redisClient.eval(script, {
    keys: [key],
    arguments: [String(userId)],
  });

  return result === 1;
};
