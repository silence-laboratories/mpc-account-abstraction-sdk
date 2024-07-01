"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/button";

import { useRouter } from "next/navigation";

import { Checkbox } from "@/components/ui/checkbox";
import { AddressCopyPopover } from "@/components/addressCopyPopover";
import Image from "next/image";
import { WALLET_STATUS } from "@/constants";
import { layoutClassName } from "@/utils/ui";
import { RouteLoader } from "@/components/routeLoader";
import { useMpcAuth } from "@/hooks/useMpcAuth";
import {
    getOldEoa,
    getPairingStatus,
    setPairingStatus,
} from "@/storage/localStorage";
function Page() {
    const mpcAuth = useMpcAuth();
    const router = useRouter();
    const oldEoa = getOldEoa() ?? "";
    const eoa = mpcAuth.accountManager.getEoa() ?? "";
    const [showHeadsUp, setShowHeadsUp] = useState(false);
    const [isAgree, setIsAgree] = useState(false);

    const handleRestoreAccount = async () => {
        if (!showHeadsUp) {
            setShowHeadsUp(true);
        } else {
            if (isAgree) {
                try {
                    setPairingStatus(WALLET_STATUS.BackedUp);
                    router.replace("/mint");
                } catch (err) {
                    console.error(err);
                }
            }
        }
    };

    const handleCancelHeadsUp = () => {
        setShowHeadsUp(false);
        setIsAgree(false);
    };

    const handleCancelRestoration = () => {
        setPairingStatus(WALLET_STATUS.Minted);
        router.push("/pair?repair=true");
    };

    const briefAddress = (address: string) => {
        return address && address.length >= 5
            ? `(${address.slice(0, 5)}...${address.slice(-5)})`
            : ``;
    };

    const status = getPairingStatus();
    if (status !== WALLET_STATUS.Mismatched) {
        return <RouteLoader />;
    }

    return (
        <div className={layoutClassName}>
            {showHeadsUp ? (
                <>
                    <div className="flex flex-col items-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="112"
                            height="112"
                            viewBox="0 0 112 112"
                            fill="none"
                        >
                            <path
                                d="M93.2755 101.107H18.7255C16.9973 101.107 15.2692 100.67 13.7598 99.8602C11.288 98.5258 9.49422 96.3164 8.68484 93.6258C7.87547 90.9352 8.15984 88.0914 9.49422 85.6414L46.7473 16.407C48.5848 12.9945 52.1286 10.8945 56.0005 10.8945C59.8723 10.8945 63.4161 13.0164 65.2536 16.407L102.529 85.6414C103.36 87.1727 103.775 88.8789 103.775 90.6289C103.775 93.4289 102.682 96.0758 100.691 98.0445C98.7224 100.035 96.0974 101.107 93.2755 101.107ZM18.7255 94.107H93.2974C94.238 94.107 95.113 93.7352 95.7692 93.0789C96.4255 92.4227 96.7974 91.5477 96.7974 90.607C96.7974 90.0383 96.6442 89.4477 96.3817 88.9445L59.0849 19.732C58.188 18.0695 56.6348 17.8945 56.0005 17.8945C55.3661 17.8945 53.813 18.0695 52.9161 19.732L15.6411 88.9664C15.2036 89.7977 15.0942 90.7383 15.3786 91.6352C15.6411 92.532 16.2536 93.2758 17.063 93.7133C17.5661 93.9758 18.1348 94.107 18.7255 94.107Z"
                                fill="#DC2626"
                            />
                            <path
                                d="M56.0005 72.9312C54.1411 72.9312 52.588 71.4655 52.5005 69.6062L51.2536 42.9187C51.2536 42.8968 51.2536 42.8749 51.2536 42.853V42.7437C51.2317 40.1187 53.3317 37.9749 55.9568 37.953C56.0443 37.953 56.1318 37.953 56.2193 37.953C58.8443 38.0624 60.8787 40.2937 60.7474 42.9187L59.5005 69.6062C59.413 71.4655 57.8599 72.9312 56.0005 72.9312Z"
                                fill="#DC2626"
                            />
                            <path
                                d="M56.0004 86.8866C53.5941 86.8866 51.6254 84.9179 51.6254 82.5116C51.6254 80.1054 53.5941 78.1366 56.0004 78.1366C58.4066 78.1366 60.3754 80.1054 60.3754 82.5116C60.3754 84.9179 58.4066 86.8866 56.0004 86.8866Z"
                                fill="#DC2626"
                            />
                        </svg>
                        <div className="h2-md text-[#DC2626] mt-2 mb-[37px]">
                            Heads up!
                        </div>
                    </div>
                    <div className="label-regular p-2 flex items-start rounded-[8px] border bg-[rgba(248,113,113,0.1)] border-[#991B1B] text-[#FECACA]">
                        <svg
                            className="mr-1"
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 16 20"
                            fill="none"
                        >
                            <path
                                d="M8 1.75C4.55375 1.75 1.75 4.55375 1.75 8C1.75 11.4462 4.55375 14.25 8 14.25C11.4462 14.25 14.25 11.4462 14.25 8C14.25 4.55375 11.4462 1.75 8 1.75ZM8 4.3125C8.1607 4.3125 8.31779 4.36015 8.4514 4.44943C8.58502 4.53871 8.68916 4.6656 8.75065 4.81407C8.81215 4.96253 8.82824 5.1259 8.79689 5.28351C8.76554 5.44112 8.68815 5.58589 8.57452 5.69952C8.46089 5.81315 8.31612 5.89054 8.15851 5.92189C8.0009 5.95324 7.83753 5.93715 7.68907 5.87565C7.5406 5.81416 7.41371 5.71002 7.32443 5.5764C7.23515 5.44279 7.1875 5.2857 7.1875 5.125C7.1875 4.90951 7.2731 4.70285 7.42548 4.55048C7.57785 4.3981 7.78451 4.3125 8 4.3125ZM9.5 11.375H6.75C6.61739 11.375 6.49021 11.3223 6.39645 11.2286C6.30268 11.1348 6.25 11.0076 6.25 10.875C6.25 10.7424 6.30268 10.6152 6.39645 10.5214C6.49021 10.4277 6.61739 10.375 6.75 10.375H7.625V7.625H7.125C6.99239 7.625 6.86521 7.57232 6.77145 7.47855C6.67768 7.38479 6.625 7.25761 6.625 7.125C6.625 6.99239 6.67768 6.86521 6.77145 6.77145C6.86521 6.67768 6.99239 6.625 7.125 6.625H8.125C8.25761 6.625 8.38479 6.67768 8.47855 6.77145C8.57232 6.86521 8.625 6.99239 8.625 7.125V10.375H9.5C9.63261 10.375 9.75979 10.4277 9.85355 10.5214C9.94732 10.6152 10 10.7424 10 10.875C10 11.0076 9.94732 11.1348 9.85355 11.2286C9.75979 11.3223 9.63261 11.375 9.5 11.375Z"
                                fill="#DC2626"
                            />
                        </svg>
                        <div className="flex flex-col text-[#F87171]">
                            <h3>Before restoring, remember:</h3>
                            <ul
                                className="ml-5"
                                style={{ listStyleType: "disc" }}
                            >
                                <li>
                                    Your Stackup dApp can hold only one account
                                    at a time.
                                </li>
                                <li>
                                    Restoring new account{" "}
                                    <span className="text-[#DC2626] b2-bold rounded-[3px] p-[2px]">
                                        {briefAddress(eoa)}
                                    </span>{" "}
                                    will replace the existing account
                                    <span className="text-[#DC2626] b2-bold rounded-[3px] p-[2px]">
                                        {briefAddress(oldEoa)}
                                    </span>
                                </li>
                                <li>
                                    You can however restore the existing account
                                    with any backup you may have.
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="w-full my-4 flex items-center py-[15px]">
                        <Checkbox
                            id="terms"
                            className="w-[18px] h-[18px] border rounded-[2px] border-[#ECEEF2] mr-2 active:bg-indigo-primary"
                            onClick={() => setIsAgree(!isAgree)}
                        />
                        <label
                            htmlFor="terms"
                            className="label-regular peer-disabled:cursor-not-allowed"
                        >
                            I understand the risk and agree to restore
                        </label>
                    </div>
                </>
            ) : (
                <>
                    <Image
                        priority={true}
                        className="mx-auto"
                        src="/mismatch-repair.svg"
                        alt="mismatch-repair"
                        width="187"
                        height="147"
                    />
                    <div
                        className="mt-6 mb-4"
                        style={{
                            textAlign: "center",
                            fontSize: "20px",
                            fontStyle: "normal",
                            fontWeight: "900",
                            lineHeight: "32px",
                        }}
                    >
                        Whoops! We noticed a mismatch!
                    </div>
                    <div className="b2-regular ">
                        <div className="mb-1">
                            <span className="mr-1">
                                Currently active account on the browser:
                            </span>
                            <AddressCopyPopover
                                address={oldEoa}
                                className="text-[#FDD147] rounded-[5px] py-[3px] pl-[10px] pr-[7px]"
                            />
                        </div>
                        <div>
                            <span className="mr-1">
                                Account that you are trying to restore:
                            </span>
                            <AddressCopyPopover
                                address={eoa}
                                className="text-[#FDD147] rounded-[5px] py-[3px] pl-[10px] pr-[7px]"
                            />
                        </div>
                    </div>

                    <div className="b2-regular  mb-6 mt-10">
                        <h3>You can either:</h3>
                        <ul className="ml-5" style={{ listStyleType: "disc" }}>
                            <li>
                                Return to your mobile and try again by selecting
                                the backup file for the existing account{" "}
                                <span className="b2-bold">
                                    {briefAddress(oldEoa)}
                                </span>
                                , or
                            </li>
                            <li>
                                Proceed with restoring the newly selected
                                account{" "}
                                <span className="b2-bold">
                                    {briefAddress(eoa)}
                                </span>
                            </li>
                        </ul>
                    </div>
                    <div className="label-regular p-2 flex items-start rounded-[8px] border bg-[rgba(248,113,113,0.1)] border-[#991B1B] text-[#DC2626] my-6">
                        <svg
                            className="mr-1"
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 16 20"
                            fill="none"
                        >
                            <path
                                d="M8 1.75C4.55375 1.75 1.75 4.55375 1.75 8C1.75 11.4462 4.55375 14.25 8 14.25C11.4462 14.25 14.25 11.4462 14.25 8C14.25 4.55375 11.4462 1.75 8 1.75ZM8 4.3125C8.1607 4.3125 8.31779 4.36015 8.4514 4.44943C8.58502 4.53871 8.68916 4.6656 8.75065 4.81407C8.81215 4.96253 8.82824 5.1259 8.79689 5.28351C8.76554 5.44112 8.68815 5.58589 8.57452 5.69952C8.46089 5.81315 8.31612 5.89054 8.15851 5.92189C8.0009 5.95324 7.83753 5.93715 7.68907 5.87565C7.5406 5.81416 7.41371 5.71002 7.32443 5.5764C7.23515 5.44279 7.1875 5.2857 7.1875 5.125C7.1875 4.90951 7.2731 4.70285 7.42548 4.55048C7.57785 4.3981 7.78451 4.3125 8 4.3125ZM9.5 11.375H6.75C6.61739 11.375 6.49021 11.3223 6.39645 11.2286C6.30268 11.1348 6.25 11.0076 6.25 10.875C6.25 10.7424 6.30268 10.6152 6.39645 10.5214C6.49021 10.4277 6.61739 10.375 6.75 10.375H7.625V7.625H7.125C6.99239 7.625 6.86521 7.57232 6.77145 7.47855C6.67768 7.38479 6.625 7.25761 6.625 7.125C6.625 6.99239 6.67768 6.86521 6.77145 6.77145C6.86521 6.67768 6.99239 6.625 7.125 6.625H8.125C8.25761 6.625 8.38479 6.67768 8.47855 6.77145C8.57232 6.86521 8.625 6.99239 8.625 7.125V10.375H9.5C9.63261 10.375 9.75979 10.4277 9.85355 10.5214C9.94732 10.6152 10 10.7424 10 10.875C10 11.0076 9.94732 11.1348 9.85355 11.2286C9.75979 11.3223 9.63261 11.375 9.5 11.375Z"
                                fill="#F87171"
                            />
                        </svg>
                        Restoring a new account will replace the existing one,
                        as MetaMask can only store one Snap account at a time.
                    </div>
                </>
            )}

            <div className="flex gap-x-[10px] w-full">
                <Button
                    className="w-1/2 min-h-[48px] h-max flex-wrap rounded-[8px] border border-indigo-primary hover:bg-indigo-hover active:bg-indigo-active text-indigo-primary hover:text-[#FFF] bg-[#FFF] btn-sm"
                    onClick={
                        showHeadsUp
                            ? handleCancelHeadsUp
                            : handleCancelRestoration
                    }
                >
                    {showHeadsUp ? "Cancel" : "Cancel restoration"}
                </Button>
                <Button
                    className="w-1/2 min-h-[48px] h-max flex-wrap rounded-[8px] bg-indigo-primary hover:bg-indigo-hover active:bg-indigo-active text-white-primary btn-sm"
                    onClick={handleRestoreAccount}
                    disabled={showHeadsUp && !isAgree}
                >
                    Restore account
                    <span className="b2-bold ml-1">
                        {briefAddress(eoa)}
                    </span>
                </Button>
            </div>
        </div>
    );
}

export default Page;
