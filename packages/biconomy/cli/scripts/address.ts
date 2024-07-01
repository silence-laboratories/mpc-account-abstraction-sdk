// Copyright (c) Silence Laboratories Pte. Ltd.
// This software is licensed under the Silence Laboratories License Agreement.

import chalk from "chalk";
import { SupportedSigner, createSmartAccountClient } from "@biconomy/account";
import { providers } from "ethers";
import { mpcAuth } from "../mpc";
import { MpcSigner } from "@silencelaboratories/mpc-sdk";

export async function getAddress() {
  // Initialize Biconomy Smart Account SDK
  const provider = new providers.JsonRpcProvider("https://rpc.sepolia.org");
  const client = new MpcSigner(mpcAuth, provider);

  const biconomySmartAccount = await createSmartAccountClient({
    signer: client as SupportedSigner,
    bundlerUrl: `https://bundler.biconomy.io/api/v2/11155111/${process.env.API_KEY}`,
  });

  const scwAddress = await biconomySmartAccount.getAccountAddress();

  console.log(chalk.green(`SmartAccount address: ${scwAddress}`));
}
