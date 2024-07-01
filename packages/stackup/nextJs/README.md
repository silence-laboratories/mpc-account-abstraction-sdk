## MPC X AA DApp
 A NextJs app that uses the Stackup SDK. This DApp allows users to pair with the silent Shard app, mint a smart contact account, and create transactions on the blockchain.

## Prerequisites:
- Node.js v16.13.0 or higher
- Check .env.example file and setup environment variables before running the app
- Build MPC Authenticator library, follow instruction in [packages/mpc README](../../mpc/README.md)

## Setting Up Environment Variables
1. Create a .env file:
- In the root of your project, create a new file named .env

2. Fill in your API keys in .env:
    ``` bash
    API_KEY = your_stackup_api_key_here #update this API key using step 3 below
    NODE_ENV=development #only require for development
    ```
3. Set the rpcUrl:
- To set the rpcUrl, you can create an instance at app.stackup.sh. Follow these steps:
- Create an account or log in if you already have one.
- Select the Sepolia network for your instance.
- Once the instance is created, navigate to the "Instances" tab.
- Copy the API Key for your instance and replace API_KEY in the rpcUrl with your actual API Key.
- You can also set up a paymaster (optional) by configuring the paymaster section:

### How to run
1. `npm install`
2. `npm run dev` to run dev version

Once started, the app is running on http://localhost:3000/. Ensure that you use only port 3000 strictly.

### Using the Silent Shard App
To interact with QR codes essential for this setup, you'll need to use the Silent Shard app. Follow these steps:
1. Download the App:
 - Get the Silent Shard app from the Google Play Store.
2. Scan the QR Code:
 - Launch the Silent Shard app and use it to scan the QR code provided during the setup process. This step is crucial for continued configuration.

Do note that the QR code is time-limited, and will expire post 30 seconds. Post which you can initiate a new QR creation.


