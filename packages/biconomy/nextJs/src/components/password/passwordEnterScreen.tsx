"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/button";
import { Progress } from "@/components/progress";
import { Label } from "../ui/label";
import { PasswordInput, PasswordInputErr } from "./passwordInput";
import { checkPassword } from "@/utils/password";
import LoadingScreen from "../loadingScreen";
import { useMpcAuth } from "@/hooks/useMpcAuth";

export type PasswordEnterScreenProps = {
    onProceed: (password: string) => Promise<void>;
    onMoveBack: () => void;
};

export const PasswordEnterScreen: React.FC<PasswordEnterScreenProps> = ({
    onProceed,
    onMoveBack,
}) => {
    const mpcAuth = useMpcAuth();
    const [currentPassword, setCurrentPassword] = useState("");
    const [passwordErr, setPasswordErr] = useState<PasswordInputErr>();
    const [isLoading, setIsLoading] = useState(false);
    const [disableBtn, setDisableBtn] = useState(false);

    const handlePasswordOnchange = (pwd: string) => {
        setDisableBtn(false);
        const passwordCheck = checkPassword(pwd);

        const isPasswordAllow =
            passwordCheck.lengthCheck &&
            passwordCheck.numberCheck &&
            passwordCheck.lowerCaseCheck &&
            passwordCheck.upperCaseCheck &&
            passwordCheck.specialCharCheck;
        if (!isPasswordAllow) {
            setPasswordErr(PasswordInputErr.NotAllowed);
        } else {
            setPasswordErr(undefined);
        }
        setCurrentPassword(pwd);
    };

    const handleProceed = async () => {
        if (passwordErr) {
            return;
        }
        if (currentPassword.length < 8) {
            setPasswordErr(PasswordInputErr.Short);
            return;
        }
        setIsLoading(true);
        try {
            await onProceed(currentPassword);
            setIsLoading(false);
            mpcAuth.accountManager.setPasswordReady();
        } catch (error) {
            setIsLoading(false);
            setPasswordErr(PasswordInputErr.IncorrectPassword);
            setDisableBtn(true);
        }
    };

    useEffect(() => {
        if (currentPassword.length === 0) {
            setDisableBtn(true);
        }
    }, [currentPassword]);

    return (
        <div>
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
                onClick={onMoveBack}
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
            <div className="h2-bold text-blackleading-[38.4px] mt-4 w-full text-center">
                Enter your password
            </div>
            {isLoading && <LoadingScreen>Pairing...</LoadingScreen>}
            {!isLoading && (
                <form
                    onSubmit={(event) => {
                        event.preventDefault(); // Prevent the form from refreshing the page
                        handleProceed();
                    }}
                >
                    <p className="b2-regular text-[#8E95A2]">
                        To unlock your backup on this device, enter the password
                        that you had set during account creation.
                    </p>

                    <div className="w-full my-6 px-14">
                        <Label htmlFor="current_password">
                            Enter a password
                        </Label>
                        <PasswordInput
                            id="current_password"
                            error={passwordErr}
                            value={currentPassword}
                            onChange={(e) => {
                                handlePasswordOnchange(e.target.value);
                            }}
                            autoComplete="current-password"
                            placeholder="password"
                        />
                    </div>

                    <div className="w-full justify-center items-center flex flex-col">
                        <Button
                            type="submit"
                            className="bg-indigo-primary hover:bg-indigo-hover active:bg-indigo-active w-1/2"
                            onClick={handleProceed}
                            disabled={disableBtn}
                        >
                            Proceed
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
};
