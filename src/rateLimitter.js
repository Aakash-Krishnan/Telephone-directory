import { readDB, writeDB } from "./db.js";

const BLOCK_DURATION = 1000 * 10;
const RATE_LIMIT_PER_MIN = 5;

// This function checks the rate limit of the user and blocks the user if the rate limit exceeds also updates in the db.json.
// It returns true if the user is blocked, else false.
export const rateLimiter = async (ip) => {
  try {
    const { ipStore = {}, contacts, phNo } = await readDB();

    try {
      const currentTime = Date.now();

      // If the block_duration is greater, then block the user.
      if (ipStore[ip] && ipStore[ip].blockDuration > currentTime) {
        return true;
      }

      // Initializing the rate limit for the user.
      if (!ipStore[ip]) {
        ipStore[ip] = {
          rate: 1,
          firstReqTime: currentTime,
        };

        return false;
      } else {
        const interval = currentTime - ipStore[ip].firstReqTime;

        // If the interval is greater than the BLOCK_DURATION, then reset the rate limit.
        if (interval > BLOCK_DURATION) {
          ipStore[ip].rate = 1;
          ipStore[ip].firstReqTime = currentTime;

          return false;
        } else {
          ipStore[ip].rate += 1;

          // If the rate limit exceeds the RATE_LIMIT_PER_MIN, then block the user.
          if (ipStore[ip].rate > RATE_LIMIT_PER_MIN) {
            ipStore[ip].blockDuration = currentTime + BLOCK_DURATION;

            return true;
          }
        }
      }
    } catch (err) {
      return console.error("Error in rateLimiter: ", err);
    } finally {
      // Update the ipStore in the db.json file.
      await writeDB({ ipStore, contacts, phNo });
    }
  } catch (err) {
    console.error("Error in rateLimiter: ", err);
  }
};
