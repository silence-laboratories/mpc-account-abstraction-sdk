// Copyright (c) Silence Laboratories Pte. Ltd.
// This software is licensed under the Silence Laboratories License Agreement.

import { ethers } from "ethers";
import { Client, Presets } from "userop";
import { CLIOpts } from "./types";
// @ts-ignore
import config from "../../config.json";
import chalk from "chalk";
import { mpcAuth } from "../../mpc";
import { MpcSigner } from "@silencelaboratories/mpc-sdk";

export default async function main(t: string, amt: string, opts: CLIOpts) {
  const paymasterMiddleware = opts.withPM
    ? Presets.Middleware.verifyingPaymaster(
        config.paymaster.rpcUrl,
        config.paymaster.context
      )
    : undefined;
  console.log(
    chalk.yellow(
      "You need to approve twice on your Silent Shard app to send a transaction"
    )
  );
  const simpleAccount = await Presets.Builder.SimpleAccount.init(
    new MpcSigner(mpcAuth),
    config.rpcUrl,
    { paymasterMiddleware, overrideBundlerRpc: opts.overrideBundlerRpc }
  );
  const client = await Client.init(config.rpcUrl, {
    overrideBundlerRpc: opts.overrideBundlerRpc,
  });

  const target = ethers.utils.getAddress(t);
  const value = ethers.utils.parseEther(amt);
  const res = await client.sendUserOperation(
    simpleAccount.execute(target, value, "0x"),
    {
      dryRun: opts.dryRun,
      onBuild: (op) => console.log("Signed UserOperation:", op),
    }
  );
  console.log(chalk.blue(`UserOpHash: ${res.userOpHash}`));

  console.log("Waiting for transaction...");
  const ev = await res.wait();
  console.log(chalk.green(`Transaction hash: ${ev?.transactionHash ?? null}`));
}
