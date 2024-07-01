// Copyright (c) Silence Laboratories Pte. Ltd.
// This software is licensed under the Silence Laboratories License Agreement.

import fs from "fs/promises";
import path from "path";
import prettier from "prettier";
import chalk from "chalk";
import { generate } from "../mpc";


const INIT_CONFIG = {
  rpcUrl: `https://api.stackup.sh/v1/node/${process.env.API_KEY}`,
  paymaster: {
    rpcUrl:
      "https://api.stackup.sh/v1/paymasterhttps://api.stackup.sh/v1/paymaster/32bbc56086c93278c34d5b3376a487e6b57147f052ec41688c1ad65bd984af7e",
    context: {},
  },
};
const CONFIG_PATH = path.resolve(__dirname, "../config.json");


async function main() {
  const silentSigner = await generate();

  return fs.writeFile(
    CONFIG_PATH,
    prettier.format(
      JSON.stringify({ ...INIT_CONFIG, ...silentSigner }, null, 2),
      { parser: "json" }
    )
  );
}

main()
  .then(() => console.log(chalk.yellow(`Config written to ${CONFIG_PATH}`)))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
