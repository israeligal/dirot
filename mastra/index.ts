import { Mastra } from "@mastra/core";
import { dirotAgent } from "./agents/dirot-agent";
import { ConsoleLogger } from "@mastra/core/logger";
import { PostgresStore } from "@mastra/pg";

export const mastra = new Mastra({
  agents: { dirotAgent },
  logger: new ConsoleLogger(),
  storage: new PostgresStore({
    id: "mastra-storage",
    connectionString: process.env.DATABASE_URL!,
  }),
});
