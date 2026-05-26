import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: root,
      stdio: "inherit",
      shell: process.platform === "win32",
      env: process.env,
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

async function main() {
  const skipMigrate = process.env.SKIP_DB_MIGRATE === "true";
  if (!skipMigrate) {
    console.log("[start] Running database migrations…");
    try {
      await run("node", ["scripts/migrate.mjs"]);
      console.log("[start] Migrations complete");
    } catch (err) {
      console.error("[start] Migration failed:", err.message);
      console.error(
        "[start] Fix DATABASE_URL. Set SKIP_DB_MIGRATE=true to start without DB."
      );
      process.exit(1);
    }
  } else {
    console.log("[start] SKIP_DB_MIGRATE=true — skipping migrations");
  }

  console.log("[start] Starting Next.js…");
  await run("npx", ["next", "start", "-H", "0.0.0.0", "-p", process.env.PORT || "3000"]);
}

main().catch((err) => {
  console.error("[start] Fatal:", err);
  process.exit(1);
});
