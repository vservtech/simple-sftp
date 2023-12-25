import * as yaml from "https://deno.land/std@0.210.0/yaml/mod.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { simpleExec } from "https://deno.land/x/simple_exec@1.0.1/mod.ts";

/**
 * This script will create users in the alpine container.
 */

// UTILS

export async function groupExists(gid: number): Promise<boolean> {
  const res = await simpleExec(`getent`, [`group`, `${gid}`]);

  if (res.stderr !== "") {
    // always return false on error
    console.error(res.stderr);
    return false;
  }

  if (res.stdout === "") {
    // group not found, output is empty
    return false;
  }

  return true;
}

export async function getGroupName(gid: number): Promise<string | undefined> {
  try {
    const result = (await simpleExec(`getent`, [`group ${gid}`])).stdout;
    const groupName = result.split(":")[0];
    return groupName;
  } catch {
    return undefined;
  }
}

export async function userExists(
  uid: number,
  username: string,
): Promise<boolean> {
  try {
    const res = await simpleExec(`id`, [`-u ${uid}`, username]);
    console.log(res.stderr);
    return true;
  } catch {
    return false;
  }
}

// MAIN SECTION

if (import.meta.main) {
  await main();
}

async function main() {
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
        uid: z.number().optional(),
        gid: z.number().optional(),
        force: z.boolean().optional().default(false),
      }),
    ),
  });

  const config = configSchema.parse(configRaw);

  for (const user of config.users) {
    console.log(`Creating user ${user.username}...`);
    // simpleExec(`useradd`, [`-rm -d ${user.home} -s /bin/zsh -G sudo -u ${user.uid ?? 10001} sftp_user`])
    // CAUTION: We're on alpine here, therefore using adduser, not useradd (like on ubuntu)!

    if (!user.force && user.uid && await userExists(user.uid, user.username)) {
      console.log(`User ${user.username} already exists, skipping...`);
      continue;
    }

    if (
      user.force && user.uid && await userExists(user.uid, user.username)
    ) {
      console.log(
        `User ${user.username} already exists and force:true, deleting...`,
      );
      simpleExec(`deluser`, [`${user.username}`]);
    }

    if (user.gid && !(await groupExists(user.gid))) {
      // create the given usergroup if the gid does not exist yet
      // use the name of the user as group name
      simpleExec(`addgroup`, [`-g ${user.gid}`, `${user.username}`]);
    }

    // creates the user, either with predefined user.gid or with a new group with same id as the generated user
    simpleExec(`adduser`, [
      `-h ${user.home}`,
      `-s /bin/zsh `,
      user.gid ? `-G  ${getGroupName(user.gid)}` : ``,
      `-u ${user.uid ?? 10001} ${user.username}`,
    ]);
  }
}
