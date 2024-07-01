import { Client, Presets } from "userop";
import { ethers } from "ethers";
import { MpcAuthenticator } from "@silencelaboratories/mpc-sdk";
import { MpcSigner } from "@silencelaboratories/mpc-sdk/lib/esm/domain/signer";

export async function sendTransaction(
    recipientAddress: string,
    amount: string,
    mpcAuth: MpcAuthenticator
) {
    const requestData = {
        to: recipientAddress,
        amount: convertEtherToWei(amount),
    };
    const eoa = mpcAuth.accountManager.getEoa();
    if (!eoa) {
        throw new Error("Eoa not found");
    }
    const simpleAccount = await Presets.Builder.SimpleAccount.init(
        new MpcSigner(mpcAuth),
        `https://api.stackup.sh/v1/node/${process.env.API_KEY}`
    );
    const client = await Client.init(
        `https://api.stackup.sh/v1/node/${process.env.API_KEY}`
    );
    try {
        const target = ethers.utils.getAddress(requestData.to);
        const value = requestData.amount;

        const res = await client.sendUserOperation(
            simpleAccount.execute(target, value, "0x"),
            {
                // Add necessary options as needed
                onBuild: (op) => console.log("Signed UserOperation:", op),
            }
        );
        console.log("userOp Hash", res.userOpHash);

        const ev = await res.wait();
        console.log("transactionHash", ev?.transactionHash ?? null);

        return {
            success: true,
            transactionHash: ev?.transactionHash ?? null,
            userOpHash: res.userOpHash,
        };
    } catch (error) {
        console.log("transaction error :", error);
        return { success: false, error: error };
    }
}

function convertEtherToWei(etherString: string) {
    const ether = Number(etherString);
    const weiString = (ether * 1e18).toString();
    return BigInt(weiString);
}
