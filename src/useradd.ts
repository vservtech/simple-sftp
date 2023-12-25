import * as yaml from "https://deno.land/std@0.210.0/yaml/mod.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { simpleExec } from "https://deno.land/x/simple_exec@1.0.1/mod.ts";

/**
 * This script will create users in the alpine container.
 */

const usersYamlPath = `${Deno.cwd()}config/users.yaml`;

// Parse the users.yaml file and create them in the alpine container!
const configUnknown = await Deno.readTextFile(usersYamlPath);
const configString = z.string().parse(configUnknown);
const configRaw = yaml.parse(configString);

const configSchema = z.object({
  users: z.array(
    z.object({
      username: z.string(),
      password: z.string(),
      home: z.string(),
      uid: z.number(),
      gid: z.number(),
    }),
  ),
});

const config = configSchema.parse(configRaw);

for (const user of config.users) {
  console.log(`Creating user ${user.username}...`);
}
