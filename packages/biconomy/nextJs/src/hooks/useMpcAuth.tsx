import { WALLET_ID } from "@/constants";
import { MpcAuthenticator } from "@silencelaboratories/mpc-sdk";
import { StoragePlatform } from "@silencelaboratories/mpc-sdk/lib/esm/types";
import { useState } from "react";
export const useMpcAuth = () => {
    const [sdk] = useState<MpcAuthenticator>(
        new MpcAuthenticator({
            walletId: WALLET_ID,
            storagePlatform: StoragePlatform.Browser,
            isDev: process.env.NODE_ENV === "development",
        })
    );
    return sdk;
};
