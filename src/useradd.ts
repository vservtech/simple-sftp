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
  if (!(await groupExists(gid))) {
    return undefined;
  }
  const res = await simpleExec(`getent`, [`group`, `${gid}`]);

  const stdout = res.stdout;
  const groupName = stdout.split(":")[0];
  return groupName;
}

export async function userNameExists(
  username: string,
): Promise<boolean> {
  const res = await simpleExec(`id`, [`-u`, username]);

  if (res.stderr !== "") {
    // always return false on error
    console.error(res.stderr);
    return false;
  }

  if (res.stdout.includes("unknown user")) {
    return false;
  }

  // res.stdout does contain the user id now
  return true;
}

export async function userIdExists(uid: number) {
  const res = await simpleExec(`getent`, [`passwd`, `${uid}`]);

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

    user.uid = user.uid ?? 10001;
    const userExistsBasedOnName = await userNameExists(user.username);
    const userExistsBasedOnId = await userIdExists(user.uid);

    console.debug(`userExistsBasedOnName: ${userExistsBasedOnName}`);
    console.debug(`userExistsBasedOnId: ${userExistsBasedOnId}`);
    const userExists = userExistsBasedOnName || userExistsBasedOnId;

    if (!user.force && userExists) {
      console.log(`User ${user.username} already exists, skipping...`);
      continue;
    }

    if (user.force && userExists) {
      console.log(
        `User ${user.username} already exists, but force is true, deleting...`,
      );
      simpleExec(`deluser`, [user.username]);
    }

    if (user.gid && !(await groupExists(user.gid))) {
      // create the given usergroup if the gid does not exist yet
      // use the name of the user as group name
      simpleExec(`addgroup`, [`-g ${user.gid}`, `${user.username}`]);
    }

    // creates the user, either with predefined user.gid or with a new group with same id as the generated user
    const gidParamArray = user.gid ? [`-G`, `${getGroupName(user.gid)}`] : [];
    const res = await simpleExec(`adduser`, [
      `-h`,
      user.home,
      `-s`,
      `/bin/zsh`,
      ...gidParamArray,
      `-u ${user.uid} ${user.username}`,
    ]);

    console.debug(res.stdout);
    console.debug(res.stderr);
  }
}
