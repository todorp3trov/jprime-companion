import { spawn, spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const backendDir = resolve(rootDir, "backend");
const frontendDir = resolve(rootDir, "frontend");
const composeFile = resolve(backendDir, "docker-compose.yml");
const isWindows = process.platform === "win32";
const activeChildren = new Set();

let shuttingDown = false;

const log = (message) => console.log(`[start] ${message}`);

const formatCommand = (command, args) => [command, ...args].join(" ");

const spawnChild = (command, args, options = {}) =>
  spawn(command, args, {
    cwd: options.cwd ?? rootDir,
    stdio: options.stdio ?? "inherit",
    shell: isWindows,
  });

const run = (command, args, options = {}) =>
  new Promise((resolveRun, rejectRun) => {
    const child = spawnChild(command, args, {
      cwd: options.cwd,
      stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    });

    let stdout = "";
    let stderr = "";

    if (options.capture) {
      child.stdout.on("data", (chunk) => {
        stdout += chunk;
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk;
      });
    }

    child.on("error", rejectRun);
    child.on("exit", (code) => {
      if (code === 0) {
        resolveRun({ stdout, stderr });
        return;
      }

      const error = new Error(
        `${formatCommand(command, args)} exited with code ${code}`,
      );
      error.code = code;
      error.stderr = stderr;
      rejectRun(error);
    });
  });

const postgresStatus = async () => {
  try {
    const { stdout } = await run(
      "docker",
      [
        "inspect",
        "--format",
        "{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}",
        "jprime-postgres",
      ],
      { capture: true },
    );
    return stdout.trim();
  } catch {
    return "";
  }
};

const waitForPostgres = async () => {
  log("Waiting for PostgreSQL to become healthy...");

  const timeoutAt = Date.now() + 90_000;
  let lastStatus = "";

  while (Date.now() < timeoutAt) {
    lastStatus = await postgresStatus();

    if (lastStatus === "healthy") {
      log("PostgreSQL is healthy.");
      return;
    }

    await new Promise((resolveSleep) => setTimeout(resolveSleep, 2_000));
  }

  await run("docker", ["compose", "-f", composeFile, "ps"]).catch(() => {});
  throw new Error(
    `PostgreSQL did not become healthy within 90 seconds (last status: ${
      lastStatus || "unknown"
    }).`,
  );
};

const startLongRunning = (name, command, args, cwd) => {
  log(`Starting ${name}...`);
  const child = spawnChild(command, args, {
    cwd,
  });

  activeChildren.add(child);
  child.once("exit", () => {
    activeChildren.delete(child);
  });

  return child;
};

const childPidsOf = (pid) => {
  if (isWindows) {
    return [];
  }

  const result = spawnSync("pgrep", ["-P", String(pid)], {
    encoding: "utf8",
  });

  if (result.error || result.status !== 0 || !result.stdout.trim()) {
    return [];
  }

  return result.stdout
    .trim()
    .split(/\s+/)
    .map((value) => Number.parseInt(value, 10))
    .filter(Number.isFinite);
};

const descendantPidsOf = (pid) =>
  childPidsOf(pid).flatMap((childPid) => [
    ...descendantPidsOf(childPid),
    childPid,
  ]);

const stopLongRunning = (signal = "SIGTERM") => {
  for (const child of activeChildren) {
    if (!child.pid || child.exitCode !== null || child.signalCode !== null) {
      continue;
    }

    const pids = isWindows
      ? [child.pid]
      : [...descendantPidsOf(child.pid), child.pid];

    for (const pid of pids) {
      try {
        process.kill(pid, signal);
      } catch (error) {
        if (error.code !== "ESRCH") {
          console.error(`[start] Failed to stop process ${pid}:`, error);
        }
      }
    }
  }
};

const handleSignal = (signal) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  log(`Received ${signal}; stopping frontend and backend...`);
  stopLongRunning(signal === "SIGINT" ? "SIGINT" : "SIGTERM");

  setTimeout(() => {
    stopLongRunning("SIGKILL");
    process.exit(signal === "SIGINT" ? 130 : 143);
  }, 5_000).unref();
};

process.once("SIGINT", handleSignal);
process.once("SIGTERM", handleSignal);

const waitForFirstExit = (children) =>
  new Promise((resolveExit) => {
    for (const [name, child] of children) {
      child.once("exit", (code, signal) => {
        resolveExit({ name, code, signal });
      });
    }
  });

try {
  log("Starting PostgreSQL...");
  await run("docker", ["compose", "-f", composeFile, "up", "-d"]);
  await waitForPostgres();

  const backend = startLongRunning(
    "backend",
    isWindows ? "gradlew.bat" : "./gradlew",
    ["bootRun"],
    backendDir,
  );
  const frontend = startLongRunning("frontend", "npm", ["start"], frontendDir);

  const { name, code, signal } = await waitForFirstExit([
    ["backend", backend],
    ["frontend", frontend],
  ]);

  if (!shuttingDown) {
    const reason = signal ? `signal ${signal}` : `code ${code ?? 0}`;
    log(`${name} exited with ${reason}; stopping remaining processes...`);
    stopLongRunning();
  }

  process.exit(code ?? (signal ? 1 : 0));
} catch (error) {
  console.error(`[start] ${error.message}`);
  if (error.stderr) {
    console.error(error.stderr.trim());
  }
  stopLongRunning();
  process.exit(error.code ?? 1);
}
