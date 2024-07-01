"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/progress";
import { useRouter } from "next/navigation";

import { PasswordBackupScreen } from "@/components/password/passwordBackupScreen";
import { WALLET_STATUS } from "@/constants";
import { RouteLoader } from "@/components/routeLoader";
import { layoutClassName } from "@/utils/ui";
import { getPairingStatus, setPairingStatus } from "@/storage/localStorage";
import { useMpcAuth } from "@/hooks/useMpcAuth";

function Page() {
    const router = useRouter();
    const mpcAuth = useMpcAuth();
    const moveToNext = () => {
        setPairingStatus(WALLET_STATUS.BackedUp);
        router.replace("/afterBackup");
    };
    const status = getPairingStatus();
    if (status !== WALLET_STATUS.Paired || mpcAuth.accountManager.isPasswordReady()) {
        return <RouteLoader />;
    }
    return (
        <div className={layoutClassName}>
            <div className="absolute w-full top-0 right-0">
                <Progress
                    className="w-[99.5%]"
                    value={50}
                    style={{ height: "4px" }}
                />
            </div>
            <Button
                className="rounded-full bg-gray-custom min-w-max aspect-square"
                size="icon"
                disabled={true}
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

            <PasswordBackupScreen
                onProceed={moveToNext}
                onTakeRisk={moveToNext}
            />
        </div>
    );
}

export default Page;
