# MPC Authenticator JS library

## How to build this library for other repositories usage:

```bash
git clone https://github.com/silence-laboratories/mpc-account-abstraction-sdk.git
cd ./mpc-account-abstraction-sdk
npm i
cd ./packages/mpc
npm run build
```

## Components:

The library provides the following 2 main components:

1. MpcAuthenticator
2. MpcSigner

### MpcAuthenticator

The `MpcAuthenticator` class is designed to handle authentication processes using Multi-Party Computation (MPC) techniques. This class provides a secure way to authenticate users without exposing sensitive information to any single party.

An example of `MpcAuthenticator`:

```javascript
const mpcAuth = new MpcAuthenticator({
  walletId: WALLET_ID,
  storagePlatform: StoragePlatform.CLI,
  customStorage: storage,
  isDev: process.env.NODE_ENV === "development",
});

// Use Silent Shard app to scan this generated QR
// Follow to install Silent Shard app: https://github.com/silence-laboratories/mpc-account-abstraction-sdk/tree/main/packages/biconomy/cli#step-4-using-the-silent-shard-app
const qrCode = await mpcAuth.initPairing();

// ... Scanning happens

const pairingSessionData = await mpcAuth.runStartPairingSession();
await mpcAuth.runEndPairingSession(pairingSessionData);

const keygenResult = await mpcAuth.runKeygen(); // Retrieve our MPC keyshares after MPC Key Generation is done

await mpcAuth.runBackup("demopassword"); // (Optional) Sent our backup for key restoration later

```

### MpcSigner

The `MpcSigner` class is responsible for signing Ethereum transactions and messages. It is inherited from ethers.js `Signer` class, so we could use it with any ethers.js compatible interfaces out-of-the-box.

An example of `MpcSigner`:
```javascript
const keygenResult = await mpcAuth.runKeygen(); // Required
const p1KeyShare: IP1KeyShare = keygenResult.distributedKey.keyShareData;
const publicKey = p1KeyShare.public_key;
const address = ethers.utils.computeAddress(`0x04${publicKey}`);
const mpcSigner = new MpcSigner(address, publicKey, p1KeyShare, keygenResult, mpcAuth); // Now, we could use mpcSigner to sign our transactions

```