import { Presets } from "userop";
import { MpcAuthenticator } from "@silencelaboratories/mpc-sdk";
import { MpcSigner } from "@silencelaboratories/mpc-sdk/lib/esm/domain/signer";

export async function mintWallet(mpcAuth: MpcAuthenticator) {
    const simpleAccount = await Presets.Builder.SimpleAccount.init(
        new MpcSigner(mpcAuth),
        `https://api.stackup.sh/v1/node/${process.env.API_KEY}`
    );
    const response = simpleAccount.getSender();
    mpcAuth.accountManager.setSmartContractAccount({ address: response });
    return response;
}
