import { SupportedSigner, createSmartAccountClient } from "@biconomy/account";
import { MpcAuthenticator, MpcSigner } from "@silencelaboratories/mpc-sdk";
import { providers } from "ethers";

export async function mintBiconomyWallet(mpcAuth: MpcAuthenticator) {
    const provider = new providers.JsonRpcProvider("https://rpc.sepolia.org");

    const client = new MpcSigner(mpcAuth, provider);

    const biconomySmartAccount = await createSmartAccountClient({
        signer: client as SupportedSigner,
        bundlerUrl: `https://bundler.biconomy.io/api/v2/11155111/${process.env.API_KEY}`,
    });

    const response = await biconomySmartAccount.getAccountAddress();
    mpcAuth.accountManager.setSmartContractAccount({ address: response });
    return response;
}
