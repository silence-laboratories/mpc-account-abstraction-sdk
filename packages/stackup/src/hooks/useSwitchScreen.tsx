import { WALLET_STATUS } from "@/constants";
import {
    getEoa,
    isPasswordReady,
} from "@/mpc/storage/account";
import { getWalletStatus } from "@/mpc/storage/wallet";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const useSwitchScreen = () => {
    const router = useRouter();
    const initializeScreen = () => {
        const status = getWalletStatus();
        const eoa = getEoa();

        if (status === WALLET_STATUS.Minted || eoa) {
            router.replace("/homescreen");
        } else if (status === WALLET_STATUS.BackedUp) {
            router.replace("/mint");
        } else if (status === WALLET_STATUS.Paired && !isPasswordReady()) {
            router.replace("/backup");
        } else {
            router.replace("/intro");
        }
    };
    useEffect(() => {
        initializeScreen();
    }, []);
};