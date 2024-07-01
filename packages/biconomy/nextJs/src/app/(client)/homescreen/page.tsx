"use client";
import { useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { TextInput } from "@/components/textInput";
import { useRouter } from "next/navigation";
import { formatEther } from "ethers/lib/utils";
import { Separator } from "@/components/separator";
import { MoreVertical } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AddressCopyPopover } from "@/components/addressCopyPopover";
import { sendTransaction } from "@/aaSDK/transactionService";
import { PasswordBackupScreen } from "@/components/password/passwordBackupScreen";
import Image from "next/image";
import { SEPOLIA, WALLET_STATUS } from "@/constants";
import Footer from "@/components/footer";
import { RouteLoader } from "@/components/routeLoader";
import {
    clearOldEoa,
    getOldEoa,
    getPairingStatus,
    setOldEoa,
    setPairingStatus,
} from "@/storage/localStorage";
import { AccountData } from "@silencelaboratories/mpc-sdk/lib/esm/types";
import { useMpcAuth } from "@/hooks/useMpcAuth";

const Homescreen: React.FC = () => {
    const mpcAuth = useMpcAuth();
    const oldEoa = getOldEoa();
    const router = useRouter();
    const [walletAccount, setWalletAccount] = useState<AccountData>();
    const [walletBalance, setWalletBalance] = useState<string>("0");
    const [eoa, setEoa] = useState<string>();
    const [network, setNetwork] = useState("...");
    const [switchChain, setSwitchChain] = useState<"none" | "popup" | "button">(
        "none"
    );
    const chainCheckRef = useRef(false);
    const [openSettings, setOpenSettings] = useState(false);
    const [isPasswordReady, setIsPasswordReady] = useState(false);
    const [openPasswordBackupDialog, setOpenPasswordBackupDialog] =
        useState(false);
    const [missingProvider, setMissingProvider] = useState(false);
    const status = getPairingStatus();

    useEffect(() => {
        // @ts-ignore
        if (!window.ethereum) {
            setMissingProvider(true);
            return;
        }
    }, []);

    useEffect(() => {
        try {
            setIsPasswordReady(mpcAuth.accountManager.isPasswordReady());
        } catch (error) {
            console.error("isPasswordReady error", error);
        }
    }, [openPasswordBackupDialog]);

    useEffect(() => {
        try {
            const eoa = mpcAuth.accountManager.getEoa();
            if (!eoa) {
                setPairingStatus(WALLET_STATUS.Unpaired);
                router.replace("/intro");
                return;
            }

            const account = mpcAuth.accountManager.getSmartContractAccount();
            if (!account) {
                setPairingStatus(WALLET_STATUS.BackedUp);
                router.replace("/mint");
                return;
            }

            setPairingStatus(WALLET_STATUS.Minted);
            setWalletAccount(account);
            setEoa(eoa);
        } catch (error) {
            setPairingStatus(WALLET_STATUS.Unpaired);
            router.replace("/intro");
            return;
        }
    }, [router, status]);

    useEffect(() => {
        if (!walletAccount || !eoa || chainCheckRef.current) return;

        const checkAndSwitchChain = async () => {
            const isSepolia = await isChainSepolia();
            if (!isSepolia) {
                setSwitchChain("popup");
                const didUserSwitch = await switchToSepolia();
                if (!didUserSwitch) {
                    setSwitchChain("button");
                    return;
                }
                setSwitchChain("none");
            }
            const didUserSwitch = await switchToSepolia();
            if (isSepolia || didUserSwitch) {
                setNetwork("Sepolia Test Network");
                await updateBalance();
                chainCheckRef.current = true;
            }
        };

        checkAndSwitchChain();
    }, [walletAccount, eoa]);

    async function onSwitchChainClick() {
        if (switchChain === "popup") return;
        try {
            const didUserSwitch = await switchToSepolia();
            didUserSwitch ? setSwitchChain("none") : setSwitchChain("button");
        } catch (error) {
            console.error("onSwitchChainClick error", error);
        }
    }

    async function isChainSepolia() {
        // @ts-ignore
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const sepoliaChainId = 0xaa36a7;
        try {
            const currentChainId = (await provider.getNetwork()).chainId;
            if (currentChainId === sepoliaChainId) {
                return true;
            }
            return false;
        } catch (error) {
            console.error("isChainSepolia error", error);
            return false;
        }
    }

    async function switchToSepolia(): Promise<boolean> {
        try {
            // @ts-ignore
            await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [SEPOLIA],
            });
            if (true) {
                setNetwork("Sepolia Test Network");
                return true;
            }
        } catch (e: unknown) {
            console.log("switchToSepolia error", e);
            return false;
        }
    }

    async function updateBalance() {
        if (!walletAccount) return;
        if (!eoa) return;
        try {
            // @ts-ignore
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const balance_wallet = await provider.getBalance(
                walletAccount.address
            );
            let balance_eoa = await provider.getBalance(eoa);
            setWalletBalance(formatEther(balance_wallet));
            return { balance_wallet, balance_eoa };
        } catch (error) {
            console.error("updateBalance error", error);
        }
    }

    const [showSuccessBanner, setShowSuccessBanner] = useState(false);
    const [showTransactionInitiatedBanner, setShowTransactionInitiatedBanner] =
        useState(false);
    const [showTransactionfailBanner, setShowTransactionfailBanner] =
        useState(false);
    const [showTransactionSignedBanner, setShowTransactionSignedBanner] =
        useState(false);

    const [recipientAddress, setRecipientAddress] = useState<string>("");
    const [amount, setAmount] = useState<string>("");
    const [isSendValid, setIsSendValid] = useState(false);
    const [recipientAddressError, setRecipientAddressError] =
        useState<string>("");
    const [amountError, setAmountError] = useState<string>("");
    const [txHash, setTxHash] = useState<string>("");

    useEffect(() => {
        setIsSendValid(
            switchChain === "none" &&
                recipientAddressError === "" &&
                amountError === "" &&
                recipientAddress !== "" &&
                amount !== ""
        );
    }, [
        recipientAddress,
        amount,
        switchChain,
        recipientAddressError,
        amountError,
    ]);

    const handleRecipientAddressChange = (address_: string) => {
        setRecipientAddress(address_);

        function isValidAddress(address: string): boolean {
            if (/^0x[a-fA-F\d]{40}$/.test(address)) {
                return true;
            }
            return false;
        }
        isValidAddress(address_)
            ? setRecipientAddressError("")
            : setRecipientAddressError("Invalid Address");
    };

    const handleAmountChange = (amount: string) => {
        setAmount(amount);

        const isValidAmount = (
            amount: string
        ): { isValid: boolean; errorMsg: string } => {
            const amountValue = parseFloat(amount);

            if (isNaN(amountValue)) {
                return { isValid: false, errorMsg: "Invalid Amount" };
            }
            if (amount.split(".")[1]?.length > 15) {
                return {
                    isValid: false,
                    errorMsg: "Amount exceeds 15 decimal places",
                };
            }
            if (amountValue < 0) {
                return { isValid: false, errorMsg: "Invalid Amount" };
            }
            if (amountValue > parseFloat(walletBalance)) {
                return { isValid: false, errorMsg: "Insufficient funds" };
            }
            if (!/^\d+(\.\d+)?$/.test(amount)) {
                return { isValid: false, errorMsg: "Amount must numeric" };
            }
            if (amountValue > Number.MAX_SAFE_INTEGER) {
                return {
                    isValid: false,
                    errorMsg: `Amount is too big. Maximum allowed is ${Number.MAX_SAFE_INTEGER}`,
                };
            }

            return { isValid: true, errorMsg: "" };
        };

        const { isValid, errorMsg } = isValidAmount(amount);

        setAmountError(isValid ? "" : errorMsg);
    };

    const handleSend = (event: React.MouseEvent): void => {
        event.preventDefault();
        if (!isSendValid) return;

        (async () => {
            setShowTransactionfailBanner(false);
            setShowTransactionSignedBanner(false);
            setShowTransactionInitiatedBanner(true);
            try {
                const result = await sendTransaction(
                    recipientAddress,
                    amount,
                    mpcAuth
                );
                if (!result.transactionHash) {
                    setShowTransactionInitiatedBanner(false);
                    setShowTransactionfailBanner(true);
                    return;
                }
                setShowTransactionSignedBanner(true);
                setShowTransactionInitiatedBanner(false);
                setTxHash(result.transactionHash);
                await updateBalance();
            } catch (error) {
                setShowTransactionInitiatedBanner(false);
                setShowTransactionfailBanner(true);
            }
        })();
    };

    const handleBackupProceed = () => {
        setOpenPasswordBackupDialog(false);
    };

    const logout = (event: React.MouseEvent): void => {
        event.preventDefault();
        mpcAuth.signOut();
        clearOldEoa();
        setPairingStatus(WALLET_STATUS.Unpaired);
        router.push("/intro");
    };

    const handleRecover = () => {
        if (eoa) {
            setOldEoa(eoa);
            router.push("/pair?repair=true");
        } // TODO: handle undefined eoa case
    };

    if (status !== WALLET_STATUS.Minted) {
        return <RouteLoader />;
    }

    return (
        <div className="animate__animated animate__slideInUp animate__faster relative flex flex-col justify-center py-6 px-10 border rounded-[8px] border-none  w-[100vw] xl:w-[52.75vw] m-auto bg-white-primary">
            <div className="border-none bg-transparent h-max py-0">
                {showSuccessBanner && (
                    <div className="mb-6 flex-none relative flex flex-col justify-center p-4 border rounded-[8px] bg-[#F2FFFB] border-[#166533] w-full text-[#071C0F]">
                        <svg
                            className="absolute top-4 right-4 cursor-pointer"
                            onClick={() => {
                                setShowSuccessBanner(false);
                            }}
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                        >
                            <path
                                d="M9.06193 7.99935L12.0307 5.0306C12.1716 4.88995 12.2508 4.69909 12.251 4.50001C12.2512 4.30093 12.1723 4.10993 12.0316 3.96904C11.891 3.82814 11.7001 3.74889 11.501 3.74871C11.3019 3.74853 11.1109 3.82745 10.9701 3.9681L8.0013 6.93685L5.03255 3.9681C4.89165 3.8272 4.70056 3.74805 4.5013 3.74805C4.30204 3.74805 4.11095 3.8272 3.97005 3.9681C3.82915 4.10899 3.75 4.30009 3.75 4.49935C3.75 4.69861 3.82915 4.8897 3.97005 5.0306L6.9388 7.99935L3.97005 10.9681C3.82915 11.109 3.75 11.3001 3.75 11.4993C3.75 11.6986 3.82915 11.8897 3.97005 12.0306C4.11095 12.1715 4.30204 12.2506 4.5013 12.2506C4.70056 12.2506 4.89165 12.1715 5.03255 12.0306L8.0013 9.06185L10.9701 12.0306C11.1109 12.1715 11.302 12.2506 11.5013 12.2506C11.7006 12.2506 11.8917 12.1715 12.0326 12.0306C12.1734 11.8897 12.2526 11.6986 12.2526 11.4993C12.2526 11.3001 12.1734 11.109 12.0326 10.9681L9.06193 7.99935Z"
                                fill="#4ADE80"
                            />
                        </svg>
                        <div className="full-w full-h flex flex-col justify-center items-center">
                            <svg
                                className="my-4"
                                xmlns="http://www.w3.org/2000/svg"
                                width="64"
                                height="64"
                                viewBox="0 0 64 64"
                                fill="none"
                            >
                                <path
                                    d="M32 6C17.6637 6 6 17.6637 6 32C6 46.3363 17.6637 58 32 58C46.3363 58 58 46.3363 58 32C58 17.6637 46.3363 6 32 6ZM45.5312 23.2862L28.7313 43.2863C28.547 43.5058 28.3177 43.6831 28.0589 43.8062C27.8001 43.9294 27.5178 43.9955 27.2313 44H27.1975C26.9172 43.9999 26.64 43.9409 26.384 43.8267C26.1279 43.7126 25.8987 43.5459 25.7113 43.3375L18.5112 35.3375C18.3284 35.1436 18.1862 34.915 18.0929 34.6653C17.9996 34.4156 17.9572 34.1498 17.9681 33.8835C17.9791 33.6171 18.0431 33.3557 18.1565 33.1145C18.27 32.8733 18.4305 32.6571 18.6286 32.4788C18.8267 32.3005 19.0585 32.1636 19.3103 32.0762C19.5621 31.9887 19.8288 31.9525 20.0948 31.9696C20.3608 31.9867 20.6207 32.0568 20.8592 32.1758C21.0978 32.2948 21.3101 32.4603 21.4837 32.6625L27.145 38.9525L42.4688 20.7138C42.8125 20.3163 43.2988 20.0702 43.8226 20.0284C44.3463 19.9867 44.8655 20.1528 45.2678 20.4907C45.6701 20.8287 45.9233 21.3114 45.9726 21.8345C46.0219 22.3576 45.8634 22.8791 45.5312 23.2862Z"
                                    fill="#1F9D41"
                                />
                            </svg>
                            <div className="text-center text-[#15803C]">
                                {`${
                                    eoa === oldEoa
                                        ? "Your Silent Account is operational again!"
                                        : "Your Distributed AA wallet is ready! Add funds to your wallet from a faucet to get started!"
                                }`}
                            </div>
                        </div>
                    </div>
                )}

                <div
                    className="mb-3 flex flex-col justify-center p-4 border rounded-[8px] bg-white-primary"
                    style={{
                        border: "1px solid #23272E",
                        padding: "32px 40px",
                    }}
                >
                    {(switchChain === "popup" ||
                        switchChain === "button" ||
                        missingProvider) && (
                        <div
                            className="text-center text-indigo-300 font-bold cursor-pointer"
                            onClick={onSwitchChainClick}
                        >
                            {missingProvider
                                ? "Please install Metamask or your favorite ETH Wallet to continue"
                                : " Switch to Sepolia (Testnet) ..."}
                        </div>
                    )}
                    {switchChain === "none" && (
                        <div className="flex flex-col space-y-1 md:flex-row md:space-y-0 items-center">
                            <div className="mr-3 px-[12px] py-[12px] rounded-full aspect-square bg-[#181625] flex justify-center">
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
                            <div className="flex flex-col items-center md:items-start">
                                <div className="text-black-200 text-sm font-bold">
                                    My Wallet
                                </div>
                                <AddressCopyPopover
                                    className="b2-regular text-[#0A0D14]"
                                    address={walletAccount?.address ?? ""}
                                />

                                {
                                    <div className="text-sm text-[#0A0D14] mt-2 b1-bold break-words whitespace-pre-wrap w-[30%] sm:w-[100%]">
                                        {walletBalance} ETH
                                    </div>
                                }
                            </div>

                            <div className="ml-auto"></div>

                            <div className="text-black flex flex-col items-center md:items-end mr-6">
                                <div className="b2-regular text-[#8E95A2]">
                                    EOA
                                </div>
                                <AddressCopyPopover
                                    className="b2-regular text-[#0A0D14]"
                                    address={eoa ?? ""}
                                />

                                <div className="mt-4 rounded-full bg-[#E8EDF3] text-sm py-2 px-3 flex flex-row text-nowrap">
                                    {network === "Sepolia Test Network" && (
                                        <Image
                                            priority={true}
                                            src="./ethereum.svg"
                                            className="mr-2"
                                            width="10"
                                            height="10"
                                            alt="ethereum"
                                        />
                                    )}
                                    <div>{network}</div>
                                </div>
                            </div>
                            <div className="self-center md:self-start">
                                <Popover
                                    open={openSettings}
                                    onOpenChange={setOpenSettings}
                                >
                                    <PopoverTrigger>
                                        <Button
                                            className="bg-[#F6F7F9] rounded-full w-8 h-8 hover:bg-[#F6F7F9]"
                                            size="icon"
                                        >
                                            <MoreVertical className="text-[#526077]" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="flex justify-center w-18 p-1 border-[#B1BBC8] border-[1px]">
                                        <div className="flex flex-col gap-2 bg-[#fff] text-[#25272C] p-2">
                                            <div
                                                className="flex justify-center items-center rounded-[8px] cursor-pointer p-2"
                                                onClick={
                                                    !isPasswordReady
                                                        ? undefined
                                                        : handleRecover
                                                }
                                            >
                                                <div
                                                    className={`flex rounded-full p-2 mr-2 bg-[#ECEEF2] ${
                                                        !isPasswordReady
                                                            ? "opacity-50"
                                                            : "opacity-100"
                                                    }`}
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="20"
                                                        height="20"
                                                        viewBox="0 0 20 20"
                                                        fill="none"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            clipRule="evenodd"
                                                            d="M17.4716 7.42794C17.904 8.43841 18.1263 9.52629 18.125 10.6254C18.1248 15.111 14.4857 18.75 9.99999 18.75C5.51419 18.75 1.87499 15.1108 1.87499 10.625V10.625C1.87511 8.94458 2.396 7.30553 3.36599 5.93338C4.33597 4.56123 5.70737 3.52342 7.29147 2.96276C7.61686 2.8476 7.97401 3.01802 8.08918 3.34342C8.20435 3.66882 8.03392 4.02597 7.70852 4.14114C6.36803 4.61557 5.20752 5.49379 4.3867 6.65493C3.56589 7.81606 3.1251 9.20304 3.12499 10.625L16.875 10.6254C16.875 10.6252 16.875 10.6251 16.875 10.625V10.6246L16.875 10.6242C16.8762 9.69457 16.6881 8.7744 16.3224 7.91971C15.9587 7.06979 15.4268 6.30229 14.7588 5.66338L14.3051 5.27342L12.3168 7.26175C11.923 7.6555 11.25 7.3766 11.25 6.81957V2.50003C11.25 2.33427 11.3158 2.1753 11.4331 2.05809C11.5503 1.94088 11.7092 1.87503 11.875 1.87503H16.1945C16.7516 1.87503 17.0312 2.54808 16.6367 2.94183L15.1915 4.38702L15.598 4.73639L15.6095 4.74735C16.4056 5.50532 17.0391 6.41735 17.4716 7.42794ZM16.875 10.6254L3.12499 10.625C3.12502 14.4205 6.20456 17.5 9.99999 17.5C13.7953 17.5 16.8748 14.4206 16.875 10.6254Z"
                                                            fill="#23272E"
                                                        />
                                                    </svg>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span
                                                        className={`${
                                                            !isPasswordReady
                                                                ? "opacity-50"
                                                                : "opacity-100"
                                                        }`}
                                                    >
                                                        Recover account on phone
                                                    </span>
                                                    {!isPasswordReady && (
                                                        <span>
                                                            (Set a password to
                                                            unlock)
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1"></div>
                                            </div>

                                            <Separator className="w-[248px] ml-3 my-1 bg-[#3A4252]" />
                                            <div
                                                className="flex justify-center items-center rounded-[8px] cursor-pointer p-2"
                                                onClick={
                                                    isPasswordReady
                                                        ? undefined
                                                        : () => {
                                                              setOpenPasswordBackupDialog(
                                                                  true
                                                              );
                                                          }
                                                }
                                            >
                                                <div
                                                    className={`flex rounded-full p-2 mr-2 bg-[#ECEEF2] ${
                                                        isPasswordReady
                                                            ? "opacity-50"
                                                            : "opacity-100"
                                                    }`}
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="24"
                                                        height="24"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                    >
                                                        <path
                                                            d="M20 6H4C2.89543 6 2 6.89543 2 8V16C2 17.1046 2.89543 18 4 18H20C21.1046 18 22 17.1046 22 16V8C22 6.89543 21.1046 6 20 6Z"
                                                            stroke="#23272E"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                        <path
                                                            d="M12 12H12.01"
                                                            stroke="#23272E"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                        <path
                                                            d="M17 12H17.01"
                                                            stroke="#23272E"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                        <path
                                                            d="M7 12H7.01"
                                                            stroke="#23272E"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                    </svg>
                                                </div>
                                                <span
                                                    className={`${
                                                        isPasswordReady
                                                            ? "opacity-50"
                                                            : "opacity-100"
                                                    }`}
                                                >
                                                    Set Password
                                                </span>
                                                <div className="flex-1"></div>
                                            </div>
                                            <Separator className="w-[248px] ml-3 my-1 bg-[#3A4252]" />
                                            <div
                                                className="flex justify-center items-center rounded-[8px] cursor-pointer p-2"
                                                onClick={logout}
                                            >
                                                <div
                                                    className="flex rounded-full p-2 mr-2"
                                                    style={{
                                                        background:
                                                            "rgba(239, 68, 68, 0.15)",
                                                    }}
                                                >
                                                    <svg
                                                        className="self-center"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="20"
                                                        height="20"
                                                        viewBox="0 0 20 20"
                                                        fill="none"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            clipRule="evenodd"
                                                            d="M1.875 10C1.875 5.5142 5.5142 1.875 10 1.875C14.4858 1.875 18.125 5.5142 18.125 10C18.125 14.4858 14.4858 18.125 10 18.125C5.5142 18.125 1.875 14.4858 1.875 10ZM10 3.125C6.20455 3.125 3.125 6.20455 3.125 10C3.125 13.7954 6.20455 16.875 10 16.875C13.7954 16.875 16.875 13.7954 16.875 10C16.875 6.20455 13.7954 3.125 10 3.125Z"
                                                            fill="#F87171"
                                                        />
                                                        <path
                                                            fillRule="evenodd"
                                                            clipRule="evenodd"
                                                            d="M6.25 10C6.25 9.65482 6.52982 9.375 6.875 9.375H13.125C13.4702 9.375 13.75 9.65482 13.75 10C13.75 10.3452 13.4702 10.625 13.125 10.625H6.875C6.52982 10.625 6.25 10.3452 6.25 10Z"
                                                            fill="#F87171"
                                                        />
                                                    </svg>
                                                </div>

                                                <span className="b2-regular text-[#F87171]">
                                                    Delete account
                                                </span>
                                                <div className="flex-1"></div>
                                            </div>

                                            <div className="grid grid-cols-3 items-center gap-4"></div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    )}
                </div>

                {showTransactionInitiatedBanner && (
                    <div className="mb-6 flex-none relative flex flex-col justify-center p-4 border rounded-[8px] bg-[#B1F1C9] border-[#166533] w-full text-[black]">
                        <svg
                            className="absolute top-4 right-4 cursor-pointer"
                            onClick={() => {
                                setShowTransactionInitiatedBanner(false);
                            }}
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                        >
                            <path
                                d="M9.06193 7.99935L12.0307 5.0306C12.1716 4.88995 12.2508 4.69909 12.251 4.50001C12.2512 4.30093 12.1723 4.10993 12.0316 3.96904C11.891 3.82814 11.7001 3.74889 11.501 3.74871C11.3019 3.74853 11.1109 3.82745 10.9701 3.9681L8.0013 6.93685L5.03255 3.9681C4.89165 3.8272 4.70056 3.74805 4.5013 3.74805C4.30204 3.74805 4.11095 3.8272 3.97005 3.9681C3.82915 4.10899 3.75 4.30009 3.75 4.49935C3.75 4.69861 3.82915 4.8897 3.97005 5.0306L6.9388 7.99935L3.97005 10.9681C3.82915 11.109 3.75 11.3001 3.75 11.4993C3.75 11.6986 3.82915 11.8897 3.97005 12.0306C4.11095 12.1715 4.30204 12.2506 4.5013 12.2506C4.70056 12.2506 4.89165 12.1715 5.03255 12.0306L8.0013 9.06185L10.9701 12.0306C11.1109 12.1715 11.302 12.2506 11.5013 12.2506C11.7006 12.2506 11.8917 12.1715 12.0326 12.0306C12.1734 11.8897 12.2526 11.6986 12.2526 11.4993C12.2526 11.3001 12.1734 11.109 12.0326 10.9681L9.06193 7.99935Z"
                                fill="#B1F1C9"
                            />
                        </svg>
                        <div className="full-w full-h flex flex-col justify-center items-center">
                            <div className="text-center">
                                Transaction initiated. Approve the signature on
                                your phone{" "}
                            </div>
                        </div>
                    </div>
                )}

                {showTransactionfailBanner && (
                    <div className="mb-6 flex-none relative flex flex-col justify-center p-4 border rounded-[8px] bg-[white] border-[#166533] w-full text-[red]">
                        <svg
                            className="absolute top-4 right-4 cursor-pointer"
                            onClick={() => {
                                setShowTransactionfailBanner(false);
                            }}
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                        >
                            <path
                                d="M9.06193 7.99935L12.0307 5.0306C12.1716 4.88995 12.2508 4.69909 12.251 4.50001C12.2512 4.30093 12.1723 4.10993 12.0316 3.96904C11.891 3.82814 11.7001 3.74889 11.501 3.74871C11.3019 3.74853 11.1109 3.82745 10.9701 3.9681L8.0013 6.93685L5.03255 3.9681C4.89165 3.8272 4.70056 3.74805 4.5013 3.74805C4.30204 3.74805 4.11095 3.8272 3.97005 3.9681C3.82915 4.10899 3.75 4.30009 3.75 4.49935C3.75 4.69861 3.82915 4.8897 3.97005 5.0306L6.9388 7.99935L3.97005 10.9681C3.82915 11.109 3.75 11.3001 3.75 11.4993C3.75 11.6986 3.82915 11.8897 3.97005 12.0306C4.11095 12.1715 4.30204 12.2506 4.5013 12.2506C4.70056 12.2506 4.89165 12.1715 5.03255 12.0306L8.0013 9.06185L10.9701 12.0306C11.1109 12.1715 11.302 12.2506 11.5013 12.2506C11.7006 12.2506 11.8917 12.1715 12.0326 12.0306C12.1734 11.8897 12.2526 11.6986 12.2526 11.4993C12.2526 11.3001 12.1734 11.109 12.0326 10.9681L9.06193 7.99935Z"
                                fill="red"
                            />
                        </svg>
                        <div className="full-w full-h flex flex-col justify-center items-center">
                            <div className="text-center">
                                Transaction failed!!
                            </div>
                        </div>
                    </div>
                )}

                {showTransactionSignedBanner && (
                    <div className="mb-6 flex-none relative flex flex-col justify-center p-4 border rounded-[8px] bg-[#B1F1C9] border-[#166533] w-full text-[black]">
                        <svg
                            className="absolute top-4 right-4 cursor-pointer"
                            onClick={() => {
                                setShowTransactionSignedBanner(false);
                            }}
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                        >
                            <path
                                d="M9.06193 7.99935L12.0307 5.0306C12.1716 4.88995 12.2508 4.69909 12.251 4.50001C12.2512 4.30093 12.1723 4.10993 12.0316 3.96904C11.891 3.82814 11.7001 3.74889 11.501 3.74871C11.3019 3.74853 11.1109 3.82745 10.9701 3.9681L8.0013 6.93685L5.03255 3.9681C4.89165 3.8272 4.70056 3.74805 4.5013 3.74805C4.30204 3.74805 4.11095 3.8272 3.97005 3.9681C3.82915 4.10899 3.75 4.30009 3.75 4.49935C3.75 4.69861 3.82915 4.8897 3.97005 5.0306L6.9388 7.99935L3.97005 10.9681C3.82915 11.109 3.75 11.3001 3.75 11.4993C3.75 11.6986 3.82915 11.8897 3.97005 12.0306C4.11095 12.1715 4.30204 12.2506 4.5013 12.2506C4.70056 12.2506 4.89165 12.1715 5.03255 12.0306L8.0013 9.06185L10.9701 12.0306C11.1109 12.1715 11.302 12.2506 11.5013 12.2506C11.7006 12.2506 11.8917 12.1715 12.0326 12.0306C12.1734 11.8897 12.2526 11.6986 12.2526 11.4993C12.2526 11.3001 12.1734 11.109 12.0326 10.9681L9.06193 7.99935Z"
                                fill="#B1F1C9"
                            />
                        </svg>
                        <div className="full-w full-h flex flex-col justify-center items-center">
                            <svg
                                className="my-4"
                                xmlns="http://www.w3.org/2000/svg"
                                width="64"
                                height="64"
                                viewBox="0 0 64 64"
                                fill="none"
                            >
                                <path
                                    d="M32 6C17.6637 6 6 17.6637 6 32C6 46.3363 17.6637 58 32 58C46.3363 58 58 46.3363 58 32C58 17.6637 46.3363 6 32 6ZM45.5312 23.2862L28.7313 43.2863C28.547 43.5058 28.3177 43.6831 28.0589 43.8062C27.8001 43.9294 27.5178 43.9955 27.2313 44H27.1975C26.9172 43.9999 26.64 43.9409 26.384 43.8267C26.1279 43.7126 25.8987 43.5459 25.7113 43.3375L18.5112 35.3375C18.3284 35.1436 18.1862 34.915 18.0929 34.6653C17.9996 34.4156 17.9572 34.1498 17.9681 33.8835C17.9791 33.6171 18.0431 33.3557 18.1565 33.1145C18.27 32.8733 18.4305 32.6571 18.6286 32.4788C18.8267 32.3005 19.0585 32.1636 19.3103 32.0762C19.5621 31.9887 19.8288 31.9525 20.0948 31.9696C20.3608 31.9867 20.6207 32.0568 20.8592 32.1758C21.0978 32.2948 21.3101 32.4603 21.4837 32.6625L27.145 38.9525L42.4688 20.7138C42.8125 20.3163 43.2988 20.0702 43.8226 20.0284C44.3463 19.9867 44.8655 20.1528 45.2678 20.4907C45.6701 20.8287 45.9233 21.3114 45.9726 21.8345C46.0219 22.3576 45.8634 22.8791 45.5312 23.2862Z"
                                    fill="#1F9D41"
                                />
                            </svg>
                            <div className="text-center">
                                Signature Successful, check the transaction {``}
                                <span className="font-bold">
                                    <a
                                        href={
                                            "https://sepolia.etherscan.io/tx/" +
                                            `${txHash}`
                                        }
                                    >
                                        {" "}
                                        here
                                    </a>
                                </span>{" "}
                            </div>
                        </div>
                    </div>
                )}

                {!isPasswordReady && (
                    <div
                        onClick={() => {
                            setOpenPasswordBackupDialog(true);
                        }}
                        className="b2-regular p-2 flex rounded-lg border bg-[rgba(253,209,71,0.10)] border-[#85680E] text-[#CA9A04] my-4"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 20 20"
                            fill="none"
                        >
                            <path
                                d="M8 2.25C4.55375 2.25 1.75 5.05375 1.75 8.5C1.75 11.9462 4.55375 14.75 8 14.75C11.4462 14.75 14.25 11.9462 14.25 8.5C14.25 5.05375 11.4462 2.25 8 2.25ZM8 4.8125C8.1607 4.8125 8.31779 4.86015 8.4514 4.94943C8.58502 5.03871 8.68916 5.1656 8.75065 5.31407C8.81215 5.46253 8.82824 5.6259 8.79689 5.78351C8.76554 5.94112 8.68815 6.08589 8.57452 6.19952C8.46089 6.31315 8.31612 6.39054 8.15851 6.42189C8.0009 6.45324 7.83753 6.43715 7.68907 6.37565C7.5406 6.31416 7.41371 6.21002 7.32443 6.0764C7.23515 5.94279 7.1875 5.7857 7.1875 5.625C7.1875 5.40951 7.2731 5.20285 7.42548 5.05048C7.57785 4.8981 7.78451 4.8125 8 4.8125ZM9.5 11.875H6.75C6.61739 11.875 6.49021 11.8223 6.39645 11.7286C6.30268 11.6348 6.25 11.5076 6.25 11.375C6.25 11.2424 6.30268 11.1152 6.39645 11.0214C6.49021 10.9277 6.61739 10.875 6.75 10.875H7.625V8.125H7.125C6.99239 8.125 6.86521 8.07232 6.77145 7.97855C6.67768 7.88479 6.625 7.75761 6.625 7.625C6.625 7.49239 6.67768 7.36521 6.77145 7.27145C6.86521 7.17768 6.99239 7.125 7.125 7.125H8.125C8.25761 7.125 8.38479 7.17768 8.47855 7.27145C8.57232 7.36521 8.625 7.49239 8.625 7.625V10.875H9.5C9.63261 10.875 9.75979 10.9277 9.85355 11.0214C9.94732 11.1152 10 11.2424 10 11.375C10 11.5076 9.94732 11.6348 9.85355 11.7286C9.75979 11.8223 9.63261 11.875 9.5 11.875Z"
                                fill="#EAB308"
                            />
                        </svg>
                        <div className="mr-auto">
                            Password setting is pending
                        </div>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 18 18"
                            fill="none"
                        >
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M7.84467 3.46967C8.13756 3.17678 8.61244 3.17678 8.90533 3.46967L13.4053 7.96967C13.6982 8.26256 13.6982 8.73744 13.4053 9.03033L8.90533 13.5303C8.61244 13.8232 8.13756 13.8232 7.84467 13.5303C7.55178 13.2374 7.55178 12.7626 7.84467 12.4697L11.0643 9.25H3.125C2.71079 9.25 2.375 8.91421 2.375 8.5C2.375 8.08579 2.71079 7.75 3.125 7.75H11.0643L7.84467 4.53033C7.55178 4.23744 7.55178 3.76256 7.84467 3.46967Z"
                                fill="#EAB308"
                            />
                        </svg>
                    </div>
                )}

                <div
                    className="mb-3 flex flex-col justify-center p-4 border rounded-[8px] bg-white-primary"
                    style={{
                        border: "1px solid #23272E",
                        padding: "32px 40px",
                    }}
                >
                    <div className="h2-bold mb-8 text-black">Transact</div>
                    <div className="flex flex-col sm:flex-row gap-6 flex-wrap">
                        <div className="flex flex-col items-end">
                            <TextInput
                                inputClass="b1-bold text-[#25272C]"
                                label="Amount"
                                placeholder={"0.0..."}
                                value={amount}
                                setValue={handleAmountChange}
                                icon={<div className="text-[#B6BAC3]">ETH</div>}
                            />

                            <div className="text-red-500 -mt-3 text-sm">
                                {amountError}
                            </div>
                        </div>

                        <div className="flex flex-col items-end">
                            <TextInput
                                inputClass="b1-regular text-[#0A0D14]"
                                label="To wallet"
                                placeholder={"0x..."}
                                value={recipientAddress}
                                setValue={handleRecipientAddressChange}
                            />
                            <div className="text-red-500 -mt-3 text-sm">
                                {recipientAddressError}
                            </div>
                        </div>
                        <div>
                            <Button
                                onClick={handleSend}
                                className={`self-center mb-4 flex-1 ${
                                    isSendValid
                                        ? "bg-indigo-primary hover:bg-indigo-hover active:bg-indigo-active"
                                        : "bg-gray-400 cursor-not-allowed"
                                }`}
                                disabled={!isSendValid}
                            >
                                Send
                            </Button>
                            <div className="text-red-500">{""}</div>
                        </div>
                    </div>
                </div>

                <Dialog
                    open={openPasswordBackupDialog}
                    onOpenChange={setOpenPasswordBackupDialog}
                >
                    <DialogContent
                        className="flex flex-col  items-start justify-center w-[60vw] h-auto bg-[#fff] border-none outline-none max-w-[754px]"
                        onInteractOutside={(e) => {
                            e.preventDefault();
                        }}
                    >
                        <PasswordBackupScreen
                            showSkipButton={false}
                            onProceed={handleBackupProceed}
                        />
                    </DialogContent>
                </Dialog>
            </div>
            <div className="mt-6 w-full flex justify-center">
                <Footer />
            </div>
        </div>
    );
};

export default Homescreen;
