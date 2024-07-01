// Copyright (c) Silence Laboratories Pte. Ltd.
// This software is licensed under the Silence Laboratories License Agreement.

import { Presets } from "userop";
// @ts-ignore
import config from "../../config.json";
import chalk from "chalk";
import { mpcAuth } from "../../mpc";
import { MpcSigner } from "@silencelaboratories/mpc-sdk";

export default async function main() {
  const simpleAccount = await Presets.Builder.SimpleAccount.init(
    new MpcSigner(
      mpcAuth
    ),
    config.rpcUrl
  );
  const address = simpleAccount.getSender();

  console.log(chalk.blue(`SimpleAccount address: ${address}`));
}
