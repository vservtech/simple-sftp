import { simpleExec } from "https://deno.land/x/simple_exec@1.0.1/mod.ts";
import {
  getGroupName,
  groupExists,
  userIdExists,
  userNameExists,
} from "./useradd.ts";
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.210.0/assert/mod.ts";

Deno.test(`getent - root group exists`, async () => {
  const result = await simpleExec(`getent`, [`group`, "0"]);
  assert(result.stdout === "root:x:0:root");
  assert(result.stderr === "");
});

Deno.test(`groupExists() - root group exists`, async () => {
  const result = await groupExists(0);
  assert(result === true);
});

Deno.test(`getent - group does not exist`, async () => {
  const result = await simpleExec(`getent`, [`group`, "10001"]);
  assert(result.stdout === "");
  assert(result.stderr === "");
});

Deno.test(`groupExists() - group does not exist`, async () => {
  const result = await groupExists(10001);
  assert(result === false);
});

Deno.test(`getGroupName() - with root group, id 0`, async () => {
  const result = await getGroupName(0);
  assert(result === "root");
});

Deno.test("userExists() - user exists", async () => {
  const username = "root";
  const result = await userNameExists(username);
  assertEquals(result, true);
});

Deno.test("userExists() - user does not exist", async () => {
  const username = "jane.doe";
  const result = await userNameExists(username);
  assertEquals(result, false);
});

Deno.test("userIdExists() - user ID exists", async () => {
  const userId = 0;
  const result = await userIdExists(userId);
  assertEquals(result, true);
});

Deno.test("userIdExists() - user ID does not exist", async () => {
  const userId = 9999;
  const result = await userIdExists(userId);
  assertEquals(result, false);
});
