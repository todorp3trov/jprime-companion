import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const backendDir = resolve(rootDir, "backend");
const isWindows = process.platform === "win32";
const gradleCommand = isWindows ? "gradlew.bat" : "./gradlew";
const gradleArgs = process.argv.slice(2);

if (gradleArgs.length === 0) {
  console.error("Usage: node scripts/run-gradle.mjs <gradle-task> [args...]");
  process.exit(1);
}

const child = spawn(gradleCommand, gradleArgs, {
  cwd: backendDir,
  stdio: "inherit",
  shell: isWindows,
});

child.on("error", (error) => {
  console.error(`[gradle] ${error.message}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
