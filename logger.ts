import fs from "fs";
import path from "path";

const logPath = path.join(process.cwd(), "log.txt");
const logStream = fs.createWriteStream(logPath, { flags: "a" });

const originalLog = console.log;
console.log = (...args: unknown[]) => {
  const msg = `[${new Date().toISOString()}] ${args.join(" ")}`;
  originalLog(...args);
  logStream.write(msg + "\n");
};
