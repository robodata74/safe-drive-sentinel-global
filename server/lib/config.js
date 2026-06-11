require("dotenv").config();

function mustGet(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`❌ Missing required env: ${name}`);
  }

  return value;
}

module.exports = {
  PORT: process.env.PORT || 4001,
  REDIS_URL: mustGet("REDIS_URL"),
};
