const { spawnSync, spawn } = require("child_process");
const path = require("path");

const command = process.argv[2];
const isWindows = process.platform === "win32";

function commandExists(cmd) {
  const checkCmd = isWindows ? "where" : "which";
  const res = spawnSync(checkCmd, [cmd], { stdio: "ignore", shell: true });
  return res.status === 0;
}

const workDir = process.cwd();
const dockerImage = "coralxyz/anchor:v0.30.1";

switch (command) {
  case "build": {
    if (commandExists("anchor")) {
      console.log("[contracts] Running local anchor build...");
      spawn("anchor", ["build"], { stdio: "inherit", shell: true });
    } else {
      console.log("[contracts] 'anchor' CLI not found on host. Running via Docker (" + dockerImage + ")...");
      const args = ["run", "--rm", "-v", `${workDir}:/work`, "-w", "/work", dockerImage, "anchor", "build"];
      const child = spawn("docker", args, { stdio: "inherit", shell: true });
      child.on("error", () => {
        console.error("Error: Please install Anchor CLI or ensure Docker Desktop is running.");
      });
    }
    break;
  }
  case "dev": {
    if (commandExists("solana-test-validator")) {
      console.log("[contracts] Starting local solana-test-validator...");
      spawn("solana-test-validator", ["--reset"], { stdio: "inherit", shell: true });
    } else {
      console.log("[contracts] 'solana-test-validator' not found. Starting via Docker...");
      const args = [
        "run", "--rm", "-it",
        "-p", "8899:8899",
        "-p", "8900:8900",
        "-v", `${workDir}:/work`,
        "-w", "/work",
        dockerImage,
        "solana-test-validator", "--reset"
      ];
      const child = spawn("docker", args, { stdio: "inherit", shell: true });
      child.on("error", () => {
        console.error("Error: Please install Solana CLI or ensure Docker Desktop is running.");
      });
    }
    break;
  }
  case "test": {
    if (commandExists("anchor")) {
      console.log("[contracts] Running local anchor test...");
      spawn("anchor", ["test"], { stdio: "inherit", shell: true });
    } else {
      console.log("[contracts] 'anchor' CLI not found. Running tests via Docker...");
      const args = ["run", "--rm", "-v", `${workDir}:/work`, "-w", "/work", dockerImage, "anchor", "test"];
      const child = spawn("docker", args, { stdio: "inherit", shell: true });
      child.on("error", () => {
        console.error("Error: Please install Anchor CLI or ensure Docker Desktop is running.");
      });
    }
    break;
  }
  default:
    console.error(`Unknown command: ${command}. Usage: node scripts/runner.js [build|dev|test]`);
    process.exit(1);
}

