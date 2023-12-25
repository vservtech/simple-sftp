import { simpleExec } from "https://deno.land/x/simple_exec@1.0.1/mod.ts";
import { groupExists } from "./useradd.ts";
import { assert } from "https://deno.land/std@0.210.0/assert/mod.ts";

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
