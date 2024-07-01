// Copyright (c) Silence Laboratories Pte. Ltd.
// This software is licensed under the Silence Laboratories License Agreement.

import { ethers } from "ethers";
import chalk from "chalk";
import { SupportedSigner, createSmartAccountClient } from "@biconomy/account";
import { mpcAuth } from "../../mpc";
import { MpcSigner } from "@silencelaboratories/mpc-sdk";
export const mintNftPayERC20 = async () => {
  const provider = new ethers.providers.JsonRpcProvider(
    "https://rpc.sepolia.org"
  );
  const client = new MpcSigner(mpcAuth, provider);

  const biconomySmartAccount = await createSmartAccountClient({
    signer: client as SupportedSigner,
    bundlerUrl: `https://bundler.biconomy.io/api/v2/11155111/${process.env.API_KEY}`,
  });

  const requestData = {
    to: "validAddress", // Replace with a valid address
    value: ethers.utils.parseEther("validAmount").toHexString(), // Replace with a valid amount
  };

  console.log(chalk.blue("Sending transaction request..."));
  const userOpResponse = await biconomySmartAccount.sendTransaction(
    requestData
  );

  console.log(chalk.blue("Waiting for transaction receipt..."));
  const userOpReceipt = await userOpResponse.wait();

  console.log(
    chalk.blue(`userOp: ${JSON.stringify(userOpReceipt, null, "\t")}`)
  );

  try {
    const { transactionHash } = await userOpResponse.waitForTxHash();
    console.log("Transaction Hash:", transactionHash);
    console.log(chalk.green(`userOp Hash: ${userOpResponse.userOpHash}`));
    const transactionDetails = await userOpResponse.wait();
    console.log(
      chalk.blue(
        `transactionDetails: ${JSON.stringify(transactionDetails, null, "\t")}`
      )
    );
  } catch (e) {
    console.log("Error during transaction processing: ", e);
  }
};
