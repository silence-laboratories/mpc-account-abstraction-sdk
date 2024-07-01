import { CliStorage } from "./storage";
import qrCodeTerm from "qrcode-terminal";
import { MpcAuthenticator, MpcSigner } from "@silencelaboratories/mpc-sdk";
import { StoragePlatform } from "@silencelaboratories/mpc-sdk";
import 'dotenv/config'
const WALLET_ID = "biconomy";
const storage = new CliStorage();
export const mpcAuth = new MpcAuthenticator({
  walletId: WALLET_ID, 
  storagePlatform: StoragePlatform.CLI, 
  customStorage: storage,
  isDev: process.env.NODE_ENV === "development",
});

export async function generate(): Promise<MpcSigner> {
    const qrCode = await mpcAuth.initPairing();
    qrCodeTerm.generate(
      qrCode,
      {
        small: true,
      },
      function (qrcode: any) {
        console.log(qrcode);
      }
    );

    const pairingSessionData = await mpcAuth.runStartPairingSession();
    await mpcAuth.runEndPairingSession(
      pairingSessionData,
  );

    await mpcAuth.runKeygen();
    await mpcAuth.runBackup("demopassword");
    return new MpcSigner(
      mpcAuth
    );
  }