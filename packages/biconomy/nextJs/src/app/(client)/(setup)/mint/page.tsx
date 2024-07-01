"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/button";
import { Progress } from "@/components/progress";
import { useRouter } from "next/navigation";
import LoadingScreen from "@/components/loadingScreen";
import { mintBiconomyWallet } from "@/aaSDK/mintingService";
import { AddressCopyPopover } from "@/components/addressCopyPopover";
import { WALLET_STATUS } from "@/constants";
import { layoutClassName } from "@/utils/ui";
import { RouteLoader } from "@/components/routeLoader";
import { clearOldEoa, getPairingStatus, setPairingStatus } from "@/storage/localStorage";
import { AccountData } from "@silencelaboratories/mpc-sdk/lib/esm/types";
import { useMpcAuth } from "@/hooks/useMpcAuth";

function Page() {
    const mpcAuth = useMpcAuth();
    const [loading, setLoading] = useState<boolean>(false);
    const [eoa, setEoa] = useState<string | null>(null);
    const router = useRouter();

    const status = getPairingStatus();

    useEffect(() => {
        if (status === WALLET_STATUS.Unpaired) {
            router.replace("/intro");
            return;
        }
        setEoa(mpcAuth.accountManager.getEoa()!);
    }, [router, status]);

    const handleMint = async () => {
        setLoading(true);
        try {
            if (eoa) {
                await mintBiconomyWallet(mpcAuth);
                setLoading(true);
                clearOldEoa();
                setPairingStatus(WALLET_STATUS.Minted);
                router.replace("/homescreen");
            } else {
                console.log("Eoa not found.");
                setLoading(false);
            }
        } catch (error) {
            console.log("Minting failed.", error);
            setLoading(false);
        }
    };

    const handleMoveBack = () => {
        mpcAuth.signOut();
        clearOldEoa();
        setPairingStatus(WALLET_STATUS.Unpaired);
        router.replace("/intro");
    };

    if (status !== WALLET_STATUS.BackedUp) {
        return <RouteLoader />;
    }

    return (
        <div className={layoutClassName}>
            <div className="absolute w-full top-0 right-0">
                <Progress
                    className="w-[99.5%]"
                    value={66}
                    style={{ height: "4px" }}
                />
            </div>
            <Button
                className="rounded-full bg-gray-custom min-w-max aspect-square"
                size="icon"
                onClick={handleMoveBack}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                >
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M16.1705 4.4545C16.6098 4.89384 16.6098 5.60616 16.1705 6.0455L10.216 12L16.1705 17.9545C16.6098 18.3938 16.6098 19.1062 16.1705 19.5455C15.7312 19.9848 15.0188 19.9848 14.5795 19.5455L7.8295 12.7955C7.39017 12.3562 7.39017 11.6438 7.8295 11.2045L14.5795 4.4545C15.0188 4.01517 15.7312 4.01517 16.1705 4.4545Z"
                        fill="#B1BBC8"
                    />
                </svg>
            </Button>

            <div className="h2-bold text-blackleading-[38.4px] mt-4">
                Your Phone is Paired
            </div>

            {loading && <LoadingScreen>Minting...</LoadingScreen>}
            {!loading && !!eoa && (
                <>
                    <div className="h3 font-bold text-blackleading-[38.4px] mt-12">
                        Your EOA:
                    </div>

                    <div
                        className="mt-2 mb-12 flex flex-col justify-center p-4 border rounded-[8px] bg-white-primary"
                        style={{
                            border: "1px solid #23272E",
                            padding: "16px 40px",
                        }}
                    >
                        <div className="flex flex-col space-y-1 md:flex-row md:space-y-0 flex-wrap items-center">
                            <div className="mr-3 h-[48px] w-[48px] rounded-full aspect-square bg-[#181625] flex justify-center">
                                <svg
                                    className="self-center"
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="28"
                                    height="28"
                                    viewBox="0 0 28 28"
                                    fill="none"
                                >
                                    <path
                                        fillRule="evenodd"
                                        clipRule="evenodd"
                                        d="M8.58732 5.80487H22.5984C22.7999 5.80478 23.0012 5.81756 23.2011 5.84315C23.1334 5.36757 22.97 4.91064 22.7209 4.4999C22.4718 4.08917 22.1421 3.73313 21.7516 3.45327C21.3612 3.1734 20.9181 2.9755 20.4491 2.8715C19.9802 2.76749 19.495 2.75954 19.0228 2.84811L5.39572 5.17462C5.20928 5.20319 5.0208 5.23491 4.83208 5.27012H4.82015C4.73687 5.28605 4.65445 5.30489 4.57303 5.32657C2.52494 5.84199 1.92539 7.69905 1.92539 8.82366V10.1217C1.90768 10.2626 1.89859 10.4052 1.89844 10.5487V20.8987C1.89944 21.8134 2.26324 22.6903 2.91002 23.3371C3.55681 23.9839 4.43375 24.3477 5.34844 24.3487H22.5984C23.5131 24.3477 24.3901 23.9839 25.0369 23.3371C25.6836 22.6903 26.0474 21.8134 26.0484 20.8987V10.5487C26.0474 9.63397 25.6836 8.75703 25.0369 8.11025C24.3901 7.46346 23.5131 7.09966 22.5984 7.09866H8.82539C7.91274 7.09866 7.81273 5.99258 8.58732 5.80487ZM20.0379 17.4487C19.6967 17.4487 19.3632 17.3475 19.0795 17.1579C18.7959 16.9684 18.5748 16.699 18.4442 16.3838C18.3136 16.0686 18.2795 15.7217 18.346 15.3871C18.4126 15.0525 18.5769 14.7451 18.8181 14.5039C19.0594 14.2627 19.3667 14.0984 19.7014 14.0318C20.036 13.9652 20.3828 13.9994 20.698 14.13C21.0132 14.2605 21.2826 14.4816 21.4722 14.7653C21.6617 15.049 21.7629 15.3825 21.7629 15.7237C21.7629 16.1812 21.5812 16.6199 21.2577 16.9434C20.9342 17.2669 20.4954 17.4487 20.0379 17.4487Z"
                                        fill="#A2A3FF"
                                    />
                                </svg>
                            </div>

                            <div className="flex flex-col">
                                <AddressCopyPopover
                                    address={eoa}
                                    className="text-[black] rounded-[5px] py-[3px] pl-[10px] pr-[7px]"
                                />
                            </div>
                            <div className="ml-auto"></div>
                        </div>
                    </div>

                    <div className="h3 text-center font-bold text-blackleading-[38.4px] mt-12">
                        You can now mint your counterfactual address and create
                        an AA wallet.
                    </div>

                    <Button
                        className="bg-indigo-primary hover:bg-indigo-hover active:bg-indigo-active w-full self-center mt-8"
                        onClick={handleMint}
                    >
                        Mint AA Wallet
                    </Button>
                </>
            )}
        </div>
    );
}

export default Page;
