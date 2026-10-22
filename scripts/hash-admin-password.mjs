import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const scryptOptions = {
  N: 32_768,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024,
};

function readHidden(prompt) {
  const { stdin, stdout } = process;
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    throw new Error("Run this command in an interactive terminal.");
  }

  return new Promise((resolve, reject) => {
    let value = "";
    stdout.write(prompt);
    stdin.setEncoding("utf8");
    stdin.setRawMode(true);
    stdin.resume();

    function finish(error) {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
    }

    function onData(chunk) {
      for (const character of chunk) {
        if (character === "\u0003") {
          finish(new Error("Password setup cancelled."));
          return;
        }
        if (character === "\r" || character === "\n") {
          finish();
          return;
        }
        if (character === "\u007f" || character === "\b") {
          value = Array.from(value).slice(0, -1).join("");
        } else if (character >= " ") {
          value += character;
        }
      }
    }

    stdin.on("data", onData);
  });
}

function deriveKey(password, salt) {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, scryptOptions, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

try {
  const password = await readHidden("Choose a local admin password (16+ characters): ");
  const confirmation = await readHidden("Confirm the password: ");
  const passwordBytes = Buffer.from(password, "utf8");
  const confirmationBytes = Buffer.from(confirmation, "utf8");
  if (
    Array.from(password).length < 16 ||
    passwordBytes.length > 1024 ||
    passwordBytes.length !== confirmationBytes.length ||
    !timingSafeEqual(passwordBytes, confirmationBytes)
  ) {
    throw new Error("Passwords must match and contain at least 16 characters.");
  }

  const salt = randomBytes(16);
  const hash = await deriveKey(password, salt);
  console.log(
    `LOCAL_ADMIN_PASSWORD_HASH=scrypt$32768$8$1$${salt.toString("base64url")}$${hash.toString("base64url")}`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : "Unable to create password hash.");
  process.exitCode = 1;
}
