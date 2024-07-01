// Copyright (c) Silence Laboratories Pte. Ltd.
// This software is licensed under the Silence Laboratories License Agreement.

const fs = require("fs").promises;
import path from "path";
import prettier from "prettier";
import chalk from "chalk";
import { ChainId } from "@biconomy/core-types";
import { RPC_PROVIDER_URLS } from "@biconomy/common";
import { generate } from "../mpc";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.error("API_KEY is not set in the environment variables");
  process.exit(1);
}
const INIT_CONFIG: any = {
  "accountIndex": 0,
  "chainId": 11155111,
  "rpcUrl": "https://rpc.sepolia.org",
  "bundlerUrl": `https://bundler.biconomy.io/api/v2/11155111/${API_KEY}`,
  "biconomyPaymasterUrl": "https://paymaster.biconomy.io/api/v1/80001/add_your_api_key_here",
  "preferredToken": "",
  "tokenList": []
};

const CONFIG_PATH = path.resolve(__dirname, "../config.json");

INIT_CONFIG.accountIndex = 0;

export const init = async (chainId: string) => {
  const silentSigner = await generate();
  console.log(chalk.blue("network is: ", chainId));
  console.log(chalk.green("your address is: ", silentSigner.address))
  if (chainId === "sepolia") {
    INIT_CONFIG.chainId = 11155111;
    INIT_CONFIG.rpcUrl = "https://rpc.sepolia.org";
    INIT_CONFIG.bundlerUrl = `https://bundler.biconomy.io/api/v2/11155111/${API_KEY}`;
    INIT_CONFIG.biconomyPaymasterUrl = "https://paymaster.biconomy.io/api/v1/11155111/add_your_api_key_here";
  } else if (chainId === "mumbai") {
    INIT_CONFIG.chainId = ChainId.POLYGON_MUMBAI;
    INIT_CONFIG.rpcUrl = RPC_PROVIDER_URLS[ChainId.POLYGON_MUMBAI];
    INIT_CONFIG.bundlerUrl = `https://bundler.biconomy.io/api/v2/${INIT_CONFIG.chainId}/${API_KEY}`;
    INIT_CONFIG.biconomyPaymasterUrl = `https://paymaster.biconomy.io/api/v1/${INIT_CONFIG.chainId}/${API_KEY}`;
  } else if (chainId === "ethereum") {
    INIT_CONFIG.chainId = ChainId.MAINNET;
    INIT_CONFIG.rpcUrl = RPC_PROVIDER_URLS[ChainId.MAINNET];
    INIT_CONFIG.bundlerUrl = `https://bundler.biconomy.io/api/v2/${INIT_CONFIG.chainId}/${API_KEY}`;
    INIT_CONFIG.biconomyPaymasterUrl = `https://paymaster.biconomy.io/api/v1/${INIT_CONFIG.chainId}/${API_KEY}`;
  } else if (chainId === "goerli") {
    INIT_CONFIG.chainId = ChainId.GOERLI;
    INIT_CONFIG.rpcUrl = RPC_PROVIDER_URLS[ChainId.GOERLI];
    INIT_CONFIG.bundlerUrl = `https://bundler.biconomy.io/api/v2/${INIT_CONFIG.chainId}/${API_KEY}`;
    INIT_CONFIG.biconomyPaymasterUrl = `https://paymaster.biconomy.io/api/v1/${INIT_CONFIG.chainId}/${API_KEY}`;
  } else if (chainId === "polygon") {
    INIT_CONFIG.chainId = ChainId.POLYGON_MAINNET;
    INIT_CONFIG.rpcUrl = RPC_PROVIDER_URLS[ChainId.POLYGON_MAINNET];
    INIT_CONFIG.bundlerUrl = `https://bundler.biconomy.io/api/v2/${INIT_CONFIG.chainId}/${API_KEY}`;
    INIT_CONFIG.biconomyPaymasterUrl = `https://paymaster.biconomy.io/api/v1/${INIT_CONFIG.chainId}/${API_KEY}`;
  } else if (chainId === "bsc-testnet") {
    INIT_CONFIG.chainId = ChainId.BSC_TESTNET;
    INIT_CONFIG.rpcUrl = RPC_PROVIDER_URLS[ChainId.BSC_TESTNET];
    INIT_CONFIG.bundlerUrl = `https://bundler.biconomy.io/api/v2/${INIT_CONFIG.chainId}/${API_KEY}`;
    INIT_CONFIG.biconomyPaymasterUrl = `https://paymaster.biconomy.io/api/v1/${INIT_CONFIG.chainId}/${API_KEY}`;
  } else if (chainId === "bsc") {
    INIT_CONFIG.chainId = ChainId.BSC_MAINNET;
    INIT_CONFIG.rpcUrl = RPC_PROVIDER_URLS[ChainId.BSC_MAINNET];
    INIT_CONFIG.bundlerUrl = `https://bundler.biconomy.io/api/v2/${INIT_CONFIG.chainId}/${API_KEY}`;
    INIT_CONFIG.biconomyPaymasterUrl = `https://paymaster.biconomy.io/api/v1/${INIT_CONFIG.chainId}/${API_KEY}`;
  } else if (chainId === "polygon-zkevm-testnet") {
    INIT_CONFIG.chainId = ChainId.POLYGON_ZKEVM_TESTNET;
    INIT_CONFIG.rpcUrl = RPC_PROVIDER_URLS[ChainId.POLYGON_ZKEVM_TESTNET];
    INIT_CONFIG.bundlerUrl = `https://bundler.biconomy.io/api/v2/${INIT_CONFIG.chainId}/${API_KEY}`;
    INIT_CONFIG.biconomyPaymasterUrl = `https://paymaster.biconomy.io/api/v1/${INIT_CONFIG.chainId}/${API_KEY}`;
  } else if (chainId === "polygon-zkevm") {
    INIT_CONFIG.chainId = ChainId.POLYGON_ZKEVM_MAINNET;
    INIT_CONFIG.rpcUrl = RPC_PROVIDER_URLS[ChainId.POLYGON_ZKEVM_MAINNET];
    INIT_CONFIG.bundlerUrl = `https://bundler.biconomy.io/api/v2/${INIT_CONFIG.chainId}/${API_KEY}`;
    INIT_CONFIG.biconomyPaymasterUrl = `https://paymaster.biconomy.io/api/v1/${INIT_CONFIG.chainId}/${API_KEY}`;
  } else if (chainId === "arbitrum-goerli-testnet") {
    INIT_CONFIG.chainId = ChainId.ARBITRUM_GOERLI_TESTNET;
    INIT_CONFIG.rpcUrl = RPC_PROVIDER_URLS[ChainId.ARBITRUM_GOERLI_TESTNET];
    INIT_CONFIG.bundlerUrl = `https://bundler.biconomy.io/api/v2/${INIT_CONFIG.chainId}/${API_KEY}`;
    INIT_CONFIG.biconomyPaymasterUrl = `https://paymaster.biconomy.io/api/v1/${INIT_CONFIG.chainId}/${API_KEY}`;
  } else if (chainId === "arbitrum-one-mainnet") {
    INIT_CONFIG.chainId = ChainId.ARBITRUM_ONE_MAINNET;
    INIT_CONFIG.rpcUrl = RPC_PROVIDER_URLS[ChainId.ARBITRUM_ONE_MAINNET];
    INIT_CONFIG.bundlerUrl = `https://bundler.biconomy.io/api/v2/${INIT_CONFIG.chainId}/${API_KEY}`;
    INIT_CONFIG.biconomyPaymasterUrl = `https://paymaster.biconomy.io/api/v1/${INIT_CONFIG.chainId}/${API_KEY}`;
  } else if (chainId === "arbitrum-nova-mainnet") {
    INIT_CONFIG.chainId = ChainId.ARBITRUM_NOVA_MAINNET;
    INIT_CONFIG.rpcUrl = RPC_PROVIDER_URLS[ChainId.ARBITRUM_NOVA_MAINNET];
    INIT_CONFIG.bundlerUrl = `https://bundler.biconomy.io/api/v2/${INIT_CONFIG.chainId}/${API_KEY}`;
    INIT_CONFIG.biconomyPaymasterUrl = `https://paymaster.biconomy.io/api/v1/${INIT_CONFIG.chainId}/${API_KEY}`;
  } else {
    throw new Error("Invalid network type");
  }
  INIT_CONFIG.preferredToken = "";
  INIT_CONFIG.tokenList = [];

  const configContent = prettier.format(JSON.stringify({ INIT_CONFIG, silentSigner }, null, 2), { parser: "json" });

  await fs.writeFile(CONFIG_PATH, configContent);
  console.log(chalk.yellow(`Config written to ${CONFIG_PATH}`));
};
