import { randomBytes, scrypt } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isLocalAdminConfigured,
  localAdminPasswordPolicy,
  verifyLocalAdminCredentials,
} from "../src/lib/auth/local-admin";

function derivePasswordHash(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password,
      salt,
      localAdminPasswordPolicy.keyLength,
      {
        N: 16_384,
        r: localAdminPasswordPolicy.blockSize,
        p: localAdminPasswordPolicy.parallelization,
        maxmem: localAdminPasswordPolicy.maxMemory,
      },
      (error, key) => {
        if (error) reject(error);
        else resolve(key);
      },
    );
  });
}

async function configureAdmin(password: string) {
  const salt = randomBytes(16);
  const hash = await derivePasswordHash(password, salt);
  vi.stubEnv("LOCAL_ADMIN_USERNAME", "root");
  vi.stubEnv(
    "LOCAL_ADMIN_PASSWORD_HASH",
    `scrypt$16384$8$1$${salt.toString("base64url")}$${hash.toString("base64url")}`,
  );
}

describe("local administrator authentication", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("validates the configured root account and password", async () => {
    const password = randomBytes(32).toString("base64url");
    await configureAdmin(password);

    expect(isLocalAdminConfigured()).toBe(true);
    await expect(verifyLocalAdminCredentials("ROOT", password)).resolves.toBe(
      true,
    );
    await expect(
      verifyLocalAdminCredentials("root", randomBytes(32).toString("base64url")),
    ).resolves.toBe(false);
    await expect(
      verifyLocalAdminCredentials("admin", password),
    ).resolves.toBe(false);
  });

  it("does not enable local sign-in when the hash is malformed", () => {
    vi.stubEnv("LOCAL_ADMIN_USERNAME", "admin");
    vi.stubEnv("LOCAL_ADMIN_PASSWORD_HASH", "not-a-password-hash");

    expect(isLocalAdminConfigured()).toBe(false);
  });

  it("allows the temporary admin/admin credentials only outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("LOCAL_ADMIN_USERNAME", "");
    vi.stubEnv("LOCAL_ADMIN_PASSWORD_HASH", "");

    await expect(verifyLocalAdminCredentials("admin", "admin")).resolves.toBe(
      true,
    );
    await expect(verifyLocalAdminCredentials("admin", "wrong")).resolves.toBe(
      false,
    );

    vi.stubEnv("NODE_ENV", "production");
    await expect(verifyLocalAdminCredentials("admin", "admin")).resolves.toBe(
      false,
    );
  });
});
