import webpush from "web-push";
import fs from "node:fs";
import path from "node:path";

const keys = webpush.generateVAPIDKeys();
const envPath = path.resolve(process.cwd(), ".env");
let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";

function setVar(name: string, value: string) {
  const line = `${name}="${value}"`;
  const re = new RegExp(`^${name}=.*$`, "m");
  if (re.test(env)) env = env.replace(re, line);
  else env = env.trimEnd() + "\n" + line + "\n";
}

setVar("NEXT_PUBLIC_VAPID_PUBLIC_KEY", keys.publicKey);
setVar("VAPID_PRIVATE_KEY", keys.privateKey);

fs.writeFileSync(envPath, env);
console.log("✓ VAPID keys written to .env");
console.log("  NEXT_PUBLIC_VAPID_PUBLIC_KEY=" + keys.publicKey);
console.log("  (private key saved, hidden)");
