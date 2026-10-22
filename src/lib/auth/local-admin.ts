import { scrypt, timingSafeEqual } from "node:crypto";

const SCRYPT_COST = 32_768;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_MAX_MEMORY = 64 * 1024 * 1024;
const MIN_PASSWORD_LENGTH = 16;

type LocalAdminConfig = {
  username: string;
  cost: number;
  blockSize: number;
  parallelization: number;
  salt: Buffer;
  hash: Buffer;
};

function readLocalAdminConfig(): LocalAdminConfig | null {
  const username = process.env.LOCAL_ADMIN_USERNAME?.trim();
  const encodedHash = process.env.LOCAL_ADMIN_PASSWORD_HASH;
  if (!username || !encodedHash || username.length > 128) return null;

  const parts = encodedHash.split("$");
  if (parts.length !== 6) return null;
  const [algorithm, costText, blockSizeText, parallelizationText, saltText, hashText] =
    parts;
  const cost = Number(costText);
  const blockSize = Number(blockSizeText);
  const parallelization = Number(parallelizationText);
  if (
    algorithm !== "scrypt" ||
    !Number.isInteger(cost) ||
    cost < 16_384 ||
    cost > SCRYPT_COST ||
    (cost & (cost - 1)) !== 0 ||
    blockSize !== SCRYPT_BLOCK_SIZE ||
    parallelization !== SCRYPT_PARALLELIZATION ||
    !saltText ||
    !hashText
  ) {
    return null;
  }

  const salt = Buffer.from(saltText, "base64url");
  const hash = Buffer.from(hashText, "base64url");
  if (
    salt.length < 16 ||
    salt.length > 64 ||
    hash.length !== SCRYPT_KEY_LENGTH ||
    salt.toString("base64url") !== saltText ||
    hash.toString("base64url") !== hashText
  ) {
    return null;
  }

  return { username, cost, blockSize, parallelization, salt, hash };
}

export function getLocalAdminConfigurationError(): string | null {
  const username = process.env.LOCAL_ADMIN_USERNAME?.trim();
  const encodedHash = process.env.LOCAL_ADMIN_PASSWORD_HASH;
  if (!username && !encodedHash) return null;
  if (!username || !encodedHash) {
    return "LOCAL_ADMIN_USERNAME and LOCAL_ADMIN_PASSWORD_HASH must both be set.";
  }
  if (username.length > 128) {
    return "LOCAL_ADMIN_USERNAME must not exceed 128 characters.";
  }
  if (!readLocalAdminConfig()) {
    return "LOCAL_ADMIN_PASSWORD_HASH is not a valid supported scrypt hash.";
  }
  return null;
}

export function isLocalAdminConfigured() {
  return readLocalAdminConfig() !== null;
}

export async function verifyLocalAdminCredentials(
  username: string,
  password: string,
): Promise<boolean> {
  if (
    process.env.NODE_ENV !== "production" &&
    !process.env.LOCAL_ADMIN_USERNAME &&
    !process.env.LOCAL_ADMIN_PASSWORD_HASH
  ) {
    const suppliedUsername = Buffer.from(username.trim().toLowerCase());
    const expectedUsername = Buffer.from("admin");
    const suppliedPassword = Buffer.from(password);
    const expectedPassword = Buffer.from("admin");

    return (
      suppliedUsername.length === expectedUsername.length &&
      suppliedPassword.length === expectedPassword.length &&
      timingSafeEqual(suppliedUsername, expectedUsername) &&
      timingSafeEqual(suppliedPassword, expectedPassword)
    );
  }

  const config = readLocalAdminConfig();
  if (
    !config ||
    username.trim().length === 0 ||
    username.length > 128 ||
    password.length === 0 ||
    password.length > 1024
  ) {
    return false;
  }

  const derivedHash = await new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password,
      config.salt,
      SCRYPT_KEY_LENGTH,
      {
        N: config.cost,
        r: config.blockSize,
        p: config.parallelization,
        maxmem: SCRYPT_MAX_MEMORY,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
  });

  const usernameMatches =
    username.trim().toLowerCase() === config.username.toLowerCase();
  return timingSafeEqual(derivedHash, config.hash) && usernameMatches;
}

export const localAdminPasswordPolicy = {
  minimumLength: MIN_PASSWORD_LENGTH,
  cost: SCRYPT_COST,
  blockSize: SCRYPT_BLOCK_SIZE,
  parallelization: SCRYPT_PARALLELIZATION,
  keyLength: SCRYPT_KEY_LENGTH,
  maxMemory: SCRYPT_MAX_MEMORY,
};
