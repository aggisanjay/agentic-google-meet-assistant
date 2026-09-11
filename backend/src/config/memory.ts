import { LibSQLStore } from "@mastra/libsql";
import { PostgresStore } from "@mastra/pg";
import { Memory } from "@mastra/memory";
import { resolve } from "node:path";

function createStore() {
  if (process.env.DATABASE_URL) {
    return new PostgresStore({
      id: "meeting-assistant-memory",
      connectionString: process.env.DATABASE_URL,
    });
  }

  if (process.env.TURSO_DATABASE_URL) {
    return new LibSQLStore({
      id: "meeting-assistant-memory",
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }

  const dbPath = resolve(process.cwd(), "mastra.db");
  return new LibSQLStore({
    id: "meeting-assistant-memory",
    url: `file:${dbPath}`,
  });
}

export const memoryStore = createStore();

export function createAgentMemory() {
  return new Memory({
    storage: memoryStore as any,
    options: {
      lastMessages: 20,
      workingMemory: {
        enabled: true,
        scope: "resource",
        template: `# Meeting preferences
                - Timezone:
                - Default meeting length (minutes):
                - Preferred meeting hours:
                - Usual invitees:
                - Notes:
                `,
      },
    },
  });
}
