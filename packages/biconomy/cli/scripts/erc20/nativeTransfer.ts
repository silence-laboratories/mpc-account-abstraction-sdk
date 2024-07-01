// Copyright (c) Silence Laboratories Pte. Ltd.
// This software is licensed under the Silence Laboratories License Agreement.

import { ethers, providers } from "ethers";
import chalk from "chalk";
import { SupportedSigner, createSmartAccountClient } from "@biconomy/account";
import { mpcAuth } from "../../mpc";
import { MpcSigner } from "@silencelaboratories/mpc-sdk";

export const nativeTransferPayERC20 = async (to: string, amount: number) => {
  // ------------------------STEP 1: Initialise Biconomy Smart Account SDK--------------------------------//
  try {
    const provider = new providers.JsonRpcProvider("https://rpc.sepolia.org");
    const client = new MpcSigner(mpcAuth, provider);

    const biconomySmartAccount = await createSmartAccountClient({
      signer: client as SupportedSigner,
      bundlerUrl: `https://bundler.biconomy.io/api/v2/11155111/${process.env.API_KEY}`,
    });

    const requestData = {
      to: to,
      value: ethers.utils.parseEther(amount.toString()).toHexString(),
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

      console.log(chalk.green(`userOp Hash: ${userOpResponse.userOpHash}`));
      const transactionDetails = await userOpResponse.wait();
      console.log(
        chalk.blue(
          `transactionDetails: ${JSON.stringify(
            transactionDetails,
            null,
            "\t"
          )}`
        )
      );
      console.log(chalk.yellow("Transaction Hash:", transactionHash));
      console.log(chalk.green(`userOp Hash: ${userOpResponse.userOpHash}`));
    } catch (e) {
      console.log("Error during transaction processing: ", e);
    }
  } catch (error) {
    console.log(chalk.red("Error initiating transfer: "), error);
  }
};
