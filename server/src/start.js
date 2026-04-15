import { startServer } from "./index.js";

startServer().catch((error) => {
  console.error("Failed to start the server", error);
  process.exit(1);
});
