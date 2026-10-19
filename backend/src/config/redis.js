import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => {
  console.error("Redis error:", err.message);
});

// TODO: Connect once during application startup.
// Export the client for controllers to reuse.

export { redisClient };
