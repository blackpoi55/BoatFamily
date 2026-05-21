import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const secret = crypto.randomBytes(32).toString("base64url");
const envPath = path.resolve(process.cwd(), ".env");
let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";

const line = `CRON_SECRET="${secret}"`;
const re = /^CRON_SECRET=.*$/m;
if (re.test(env)) env = env.replace(re, line);
else env = env.trimEnd() + "\n" + line + "\n";

fs.writeFileSync(envPath, env);
console.log("✓ CRON_SECRET generated and written to .env");
