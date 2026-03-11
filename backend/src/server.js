import dotenv from "dotenv";
import path from "path";
import net from "node:net";
import { fileURLToPath } from "url";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Always resolve .env from backend root even if server starts from another cwd.
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const port = Number(process.env.PORT || 5000);

const checkPortAvailable = (candidatePort) =>
  new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => {
      resolve(false);
    });

    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(candidatePort, "::");
  });

const findAvailablePort = async (startPort, maxAttempts = 20) => {
  for (let offset = 0; offset < maxAttempts; offset += 1) {
    const candidatePort = startPort + offset;
    // eslint-disable-next-line no-await-in-loop
    const isAvailable = await checkPortAvailable(candidatePort);
    if (isAvailable) {
      return candidatePort;
    }
  }

  throw new Error(
    `No available port found in range ${startPort}-${startPort + maxAttempts - 1}`,
  );
};

const startServer = async () => {
  try {
    await connectDB();
    const selectedPort = await findAvailablePort(port);
    app.listen(selectedPort, () => {
      console.log(`Server running on port ${selectedPort}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

startServer();
