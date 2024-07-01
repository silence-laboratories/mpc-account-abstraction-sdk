
## MPC X AA CLI

### Step 1: Clone the Repository

Clone the mpc-account-abstraction-sdk repository. This example is a basic command-line wallet application.

```bash
git clone https://github.com/silence-laboratories/mpc-account-abstraction-sdk
```

Navigate to the cli directory within the cloned repository:

```bash
cd packages/stackup/cli
```

## Configuration Setup

- **Node Version:** Ensure you are using Node.js version 18

### Build MPC Authenticator library

- Follow instruction in [packages/mpc README](../../mpc/README.md)


### Set Up the RPC URL

To set up the rpcUrl, create an instance at StackUp:

1. Create an account or log in if you already have one.
2. Select the Sepolia network for your instance.
3. Once the instance is created, navigate to the "Instances" tab.
4. Copy the API Key for your instance. You will use this API Key in the next step to set environment variables.

### Step 2: Setting Up Environment Variables

1. Create a `.env` file:
    - In the root of your project, create a new file named `.env`.

2. Fill in your Base urls and API keys in `.env`:

    - Replace `your_stackup_api_key_here` with your actual stackup's API key.
    - To run in development environment, add `NODE_ENV=development`.

        ```env
        API_KEY=your_stsackup_api_key_here
        NODE_ENV=development
        ```

## Step 3: Install Dependencies

This example uses the userop.js library to build user operations. You can think of it like ethers.js but for ERC-4337. Install it, and all other dependencies.

```bash
npm install
```

### Step 4: Using the Silent Shard App

As defined earlier, this setup is between your CLI and the Silent Shard Mobile Application. To interact further with this setup, please install the Silent Shard App.

1. Download the Silent Shard App from:
   - [Apple App Store](https://apps.apple.com/us/app/silent-shard/id6468993285)
   - [Google Play Store](https://play.google.com/store/apps/details?id=com.silencelaboratories.silentshard&hl=kr&pli=1)

2. Press the "Connect new Account" button to initiate the QR scanner on the app to pair with the CLI.

## Step 5: Initialising and Distributed Key Generation

Initialize your local configuration by running the following command:

```bash
npm run init
```

A QR code will be generated on your CLI which must be scanned by the QR scanner on your mobile app (refer to Step 4). Note that during the account setup in the init step, the mobile app will ask you to set a password and backup option. For this CLI demo version, please skip all these steps.

Note that the QR code is time-limited, and will expire post 30 seconds of initiation. Upon expiry, you can run the above command again to generate a new QR code

A `config.json` file will be created. The file will look like this:

```json
{
  "rpcUrl": "https://api.stackup.sh/v1/node/YOUR_API_KEY",
  "paymaster": {
    "rpcUrl": "https://api.stackup.sh/v1/paymaster/YOUR_API_KEY",
    "context": {}
  },
  "_isSigner": true,
  "address": "0xYourAddressHere",
  "public_key": "YourPublicKeyHere",
  "p1KeyShare": {
    "x1": "YourX1Here",
    "public_key": "YourPublicKeyHere",
    "paillier_private_key": {
      "p": "YourPaillierPHere",
      "q": "YourPaillierQHere"
    },
    "paillier_public_key": "YourPaillierPublicKeyHere"
  },
  "keygenResult": {
    "distributedKey": {
      "publicKey": "YourDistributedPublicKeyHere",
      "accountId": 1,
      "keyShareData": {
        "x1": "YourX1Here",
        "public_key": "YourPublicKeyHere",
        "paillier_private_key": {
          "p": "YourPaillierPHere",
          "q": "YourPaillierQHere"
        },
        "paillier_public_key": "YourPaillierPublicKeyHere"
      }
    },
    "elapsedTime": 2977
  }
}
```

### Anatomy of the config.json file

- `rpcUrl`: URL of an ERC-4337 bundler and node
- `paymaster`: URL of the Paymaster service you are using and context (optional)
- `keygenResult`: Contains the result of the key generation process, including the distributed public key and key share data, along with the elapsed time for the operation.

## Step 6: Create an account

Create a counterfactual address by running the command:

```bash
npm run simpleAccount address
```

A SimpleAccount address will be returned. At this point, the Smart Account has not been deployed. ERC-4337 account addresses are deterministic, so you don't need to deploy the contract to know its address.

## Step 7: Fund the account

You will now need to deposit the native token of the blockchain you are using into your new Smart Account. Since we are using the sepolia testnet, you will deposit sepolia ETH into the account.

Navigate to a faucet, such as [this link](https://cloud.google.com/application/web3/faucet/ethereum/sepolia). Enter the account address from Step 6 and claim the testnet token.

## Step 8: Initiate the transfer

The simpleAccount transfer command allows you to transfer the native token from the smart contract account to any address. It will create a User Operation, sign it, and send it to the Bundler:

```bash
npm run simpleAccount transfer --to <address> --amount <eth>
```

## Step 9: Approve the signature on the paired Mobile Application

When transferring the token to any address via this integration, your phone will receive a signature alert notification twice. You need to swipe right to approve the transaction both times. Once approved, you will see the signed userOperation object and the transaction hash.

The implementation for all commands is located in the `simpleAccount` directory within the `scripts` directory. All scripts are built using the following open-source packages:

- Sample contracts: [eth-infinitism/account-abstraction](https://github.com/eth-infinitism/account-abstraction)
- JS SDK: [userop.js](https://github.com/eth-infinitism/userop.js)

 
### This integration is built on top of StackUp's Quick Start repository. For more details check out the [docs here](https://github.com/stackup-wallet/erc-4337-examples).
