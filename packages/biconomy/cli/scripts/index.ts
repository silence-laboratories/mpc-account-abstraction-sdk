

// Copyright (c) Silence Laboratories Pte. Ltd.
// This software is licensed under the Silence Laboratories License Agreement.

import yargs from "yargs";
import chalk from "chalk";
import { hideBin } from 'yargs/helpers';
import { init } from "./init";
import { getAddress } from "./address";
import { nativeTransferPayERC20 } from "./erc20/nativeTransfer";

const argv = yargs(hideBin(process.argv))
  .scriptName(chalk.green("smartAccount"))
  .usage("$0 <command> [options]")
  .demandCommand(1, chalk.red.bold("You must specify a command."))
  .recommendCommands()
  // Initialize config file
  .command(
    "init",
    chalk.blue("Create a config file"),
    {
      network: {
        describe: chalk.cyan("Choose chain type"),
        type: "string",
      },
    },
    ({ network }) => {
      console.log(
        chalk.magenta(`Initializing config for ${network || 'default'} network`)
      );
      init(network || "");
    }
  )
  // Get SmartAccount address
  .command("address", chalk.blue("Get counterfactual address"), {}, getAddress)
  // Transfer native assets (ether)
  .command(
    "transfer",
    chalk.blue("Transfer native (ether/matic)"),
    {
      to: {
        describe: chalk.cyan("Recipient address"),
        demandOption: true,
        type: "string",
        default: process.env.TO,
      },
      amount: {
        describe: chalk.cyan("Amount of ether to transfer"),
        demandOption: true,
        type: "number",
        default: process.env.AMOUNT,
      },
      mode: {
        describe: chalk.cyan("Paymaster mode"),
        type: "string",
      },
    },
    ({ amount, to, mode }) => {
      console.log(
        chalk.magenta(`Transferring ${amount} ether to ${to}...`)
      );
      nativeTransferPayERC20(to, Number(amount));
    }
  )

  
  .help()
  .parse();

export default argv;