import { readDB, writeDB } from "./db.js";

const BLOCK_DURATION = 1000 * 10;
const RATE_LIMIT_PER_MIN = 5;

export const rateLimiter = async (ip) => {
  try {
    const { ipStore = {}, contacts, phNo } = await readDB();

    try {
      const currentTime = Date.now();
      if (ipStore[ip] && ipStore[ip].blockDuration > currentTime) {
        return true;
      }

      if (!ipStore[ip]) {
        ipStore[ip] = {
          rate: 1,
          firstReqTime: currentTime,
        };

        return false;
      } else {
        const interval = currentTime - ipStore[ip].firstReqTime;

        if (interval > BLOCK_DURATION) {
          ipStore[ip].rate = 1;
          ipStore[ip].firstReqTime = currentTime;

          return false;
        } else {
          ipStore[ip].rate += 1;

          if (ipStore[ip].rate > RATE_LIMIT_PER_MIN) {
            ipStore[ip].blockDuration = currentTime + BLOCK_DURATION;

            return true;
          }
        }
      }
    } catch (err) {
      return console.error("Error in rateLimiter: ", err);
    } finally {
      await writeDB({ ipStore, contacts, phNo });
    }
  } catch (err) {
    console.error("Error in rateLimiter: ", err);
  }
};
