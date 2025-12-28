import { spawn } from "node:child_process";

const port = process.env.PORT || "3000";
const baseUrl = `http://localhost:${port}`;
const healthUrl = `${baseUrl}/api/health`;
const timeoutMs = 30000;
const pollIntervalMs = 500;

const startServer = () =>
  spawn("npm", ["run", "start", "--", "-p", port], {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: port,
    },
  });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForServer = async () => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(healthUrl);
      if (response.ok) {
        return true;
      }
    } catch (error) {
      // Server not ready yet.
    }
    await sleep(pollIntervalMs);
  }
  return false;
};

const main = async () => {
  const server = startServer();

  const stopServer = () => {
    if (!server.killed) {
      server.kill("SIGTERM");
    }
  };

  const handleExit = () => stopServer();
  process.on("exit", handleExit);
  process.on("SIGINT", handleExit);
  process.on("SIGTERM", handleExit);

  try {
    const response = await waitForServer();
    if (!response) {
      throw new Error("Health check did not become available in time.");
    }

    const body = await response.json();
    if (!body?.ok) {
      throw new Error("Health check returned unexpected payload.");
    }

    console.log("Health check succeeded.");
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    stopServer();
  }
};

main();
