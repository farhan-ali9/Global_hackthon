import { spawn, spawnSync } from "node:child_process";

function runStep(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

runStep("prisma", ["migrate", "deploy"]);

if (process.env.SEED_DEMO_DATA === "true") {
  runStep("node", ["dist/prisma/seed.js"]);
}

const server = spawn("node", ["dist/src/index.js"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.kill(signal);
  });
}

server.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
