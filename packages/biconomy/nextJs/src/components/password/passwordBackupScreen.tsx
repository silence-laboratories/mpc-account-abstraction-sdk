"use client";

import React, { useEffect, useState } from "react";
import { Label } from "../ui/label";
import { PasswordInput, PasswordInputErr } from "./passwordInput";
import { PasswordCheckItem, PasswordCheckState } from "./passwordCheckItem";
import { Button } from "../ui/button";
import { checkPassword } from "@/utils/password";
import { Dialog, DialogContent } from "../ui/dialog";
import { Checkbox } from "../ui/checkbox";
import { useMpcAuth } from "@/hooks/useMpcAuth";


export type PasswordBackupScreenProps = {
    onProceed?: () => void;
    onTakeRisk?: () => void;
    showSkipButton?: boolean;
};

export function PasswordBackupScreen({
    onProceed,
    onTakeRisk,
    showSkipButton = true,
}: PasswordBackupScreenProps) {
    const mpcAuth = useMpcAuth();
    const [currentPassword, setCurrentPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [passwordErr, setPasswordErr] = useState<PasswordInputErr>();
    const [passwordConfirmErr, setPasswordConfirmErr] =
        useState<PasswordInputErr>();

    const [openSkipDialog, setOpenSkipDialog] = useState(false);
    const [isAgree, setIsAgree] = useState(false);

    const [passwordCheckState, setPasswordCheckState] = useState<{
        lengthCheck: PasswordCheckState;
        numberCheck: PasswordCheckState;
        lowerCaseCheck: PasswordCheckState;
        upperCaseCheck: PasswordCheckState;
        specialCharCheck: PasswordCheckState;
    }>({
        lengthCheck: "init",
        numberCheck: "init",
        lowerCaseCheck: "init",
        upperCaseCheck: "init",
        specialCharCheck: "init",
    });

    const handlePasswordInputOnBlur = () => {
        const passwordCheck = checkPassword(currentPassword);
        setPasswordCheckState({
            lengthCheck: passwordCheck.lengthCheck ? "checked" : "unchecked",
            numberCheck: passwordCheck.numberCheck ? "checked" : "unchecked",
            lowerCaseCheck: passwordCheck.lowerCaseCheck
                ? "checked"
                : "unchecked",
            upperCaseCheck: passwordCheck.upperCaseCheck
                ? "checked"
                : "unchecked",
            specialCharCheck: passwordCheck.specialCharCheck
                ? "checked"
                : "unchecked",
        });

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

        if (currentPassword !== passwordConfirmation) {
            setPasswordConfirmErr(PasswordInputErr.Confirm);
        } else {
            setPasswordConfirmErr(undefined);
        }
    };

    const handleConfirmPwdOnBlur = () => {
        if (currentPassword !== passwordConfirmation) {
            setPasswordConfirmErr(PasswordInputErr.Confirm);
        } else {
            setPasswordConfirmErr(undefined);
        }
    };

    const handleProceed = async () => {
        if (passwordErr || passwordConfirmErr) {
            return;
        }
        if (currentPassword.length < 8) {
            setPasswordErr(PasswordInputErr.Short);
            return;
        }
        if (passwordConfirmation.length < 8) {
            setPasswordConfirmErr(PasswordInputErr.Short);
            return;
        }
        try {
            await mpcAuth.runBackup(currentPassword);
            onProceed?.();
            mpcAuth.accountManager.setPasswordReady();
        } catch (error) {
            // TODO: Handle error
            console.error(error);
        }
    };

    const handleSkip = () => {
        setOpenSkipDialog(true);
    };

    const handleTakeRisk = () => {
        mpcAuth.runBackup("");
        onTakeRisk?.();
    };

    useEffect(() => {
        const passwordCheck = checkPassword(currentPassword);
        setPasswordCheckState({
            lengthCheck: passwordCheck.lengthCheck ? "checked" : "init",
            numberCheck: passwordCheck.numberCheck ? "checked" : "init",
            lowerCaseCheck: passwordCheck.lowerCaseCheck ? "checked" : "init",
            upperCaseCheck: passwordCheck.upperCaseCheck ? "checked" : "init",
            specialCharCheck: passwordCheck.specialCharCheck
                ? "checked"
                : "init",
        });
    }, [currentPassword]);
    return (
        <div>
            <div className="flex full-w justify-between items-center mt-4">
                <div className="h2-bold text-blackleading-[38.4px] flex">
                    Backup your account
                </div>
            </div>
            <p className="b2-regular text-[#8E95A2]">
                Create a <b>password</b> to protect your backup and unlock
                backup options on the mobile app. This password will be required
                to recover your account on any browser or desktop device.
            </p>
            <div className="space-y-3 my-6 px-14">
                <div>
                    <Label htmlFor="current_password">Enter a password</Label>
                    <PasswordInput
                        id="current_password"
                        error={passwordErr}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        autoComplete="current-password"
                        placeholder="password"
                        onBlur={handlePasswordInputOnBlur}
                    />
                </div>

                <div>
                    <Label htmlFor="password_confirmation">
                        Confirm password
                    </Label>
                    <PasswordInput
                        id="password_confirmation"
                        error={passwordConfirmErr}
                        value={passwordConfirmation}
                        onChange={(e) =>
                            setPasswordConfirmation(e.target.value)
                        }
                        onBlur={handleConfirmPwdOnBlur}
                        autoComplete="new-password"
                        placeholder="password"
                    />
                </div>
                <div className="flex items-start">
                    <svg
                        className="mr-1"
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 16 16"
                        fill="none"
                    >
                        <path
                            d="M8 1.5C4.41594 1.5 1.5 4.41594 1.5 8C1.5 11.5841 4.41594 14.5 8 14.5C11.5841 14.5 14.5 11.5841 14.5 8C14.5 4.41594 11.5841 1.5 8 1.5ZM8 11.4972C7.87639 11.4972 7.75555 11.4605 7.65277 11.3919C7.54999 11.3232 7.46988 11.2256 7.42258 11.1114C7.37527 10.9972 7.36289 10.8715 7.38701 10.7503C7.41112 10.629 7.47065 10.5177 7.55806 10.4302C7.64547 10.3428 7.75683 10.2833 7.87807 10.2592C7.99931 10.2351 8.12497 10.2475 8.23918 10.2948C8.35338 10.3421 8.45099 10.4222 8.51967 10.525C8.58834 10.6277 8.625 10.7486 8.625 10.8722C8.625 11.0379 8.55915 11.1969 8.44194 11.3141C8.32473 11.4313 8.16576 11.4972 8 11.4972ZM8.67875 5.21125L8.49938 9.02375C8.49938 9.15636 8.4467 9.28354 8.35293 9.3773C8.25916 9.47107 8.13198 9.52375 7.99937 9.52375C7.86677 9.52375 7.73959 9.47107 7.64582 9.3773C7.55205 9.28354 7.49937 9.15636 7.49937 9.02375L7.32 5.21313V5.21156C7.31607 5.11998 7.33071 5.02854 7.36305 4.94277C7.39539 4.85699 7.44475 4.77865 7.50817 4.71245C7.57158 4.64626 7.64774 4.59358 7.73205 4.55759C7.81636 4.5216 7.90708 4.50305 7.99875 4.50305C8.09042 4.50305 8.18114 4.5216 8.26545 4.55759C8.34976 4.59358 8.42592 4.64626 8.48933 4.71245C8.55275 4.77865 8.60211 4.85699 8.63445 4.94277C8.66679 5.02854 8.68143 5.11998 8.6775 5.21156L8.67875 5.21125Z"
                            fill="#EAB308"
                        />
                    </svg>
                    <div className="b2-regular text-[#8E95A2]">
                        You will have to remember this password.{" "}
                        <span className="text-[#5B616E]">
                            Once set, it can&apos;t be changed
                        </span>
                    </div>
                </div>

                <div className="b2-regular flex flex-col border border-[#8695AA] rounded-lg my-4 p-2 bg-[rgba(82, 96, 119, 0.05)]">
                    <div className="flex text-[#64748B] mb-2">
                        <svg
                            className="mr-1"
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="17"
                            viewBox="0 0 16 17"
                            fill="none"
                        >
                            <path
                                d="M8 2.25C4.55375 2.25 1.75 5.05375 1.75 8.5C1.75 11.9462 4.55375 14.75 8 14.75C11.4462 14.75 14.25 11.9462 14.25 8.5C14.25 5.05375 11.4462 2.25 8 2.25ZM8 4.8125C8.1607 4.8125 8.31779 4.86015 8.4514 4.94943C8.58502 5.03871 8.68916 5.1656 8.75065 5.31407C8.81215 5.46253 8.82824 5.6259 8.79689 5.78351C8.76554 5.94112 8.68815 6.08589 8.57452 6.19952C8.46089 6.31315 8.31612 6.39054 8.15851 6.42189C8.0009 6.45324 7.83753 6.43715 7.68907 6.37565C7.5406 6.31416 7.41371 6.21002 7.32443 6.0764C7.23515 5.94279 7.1875 5.7857 7.1875 5.625C7.1875 5.40951 7.2731 5.20285 7.42548 5.05048C7.57785 4.8981 7.78451 4.8125 8 4.8125ZM9.5 11.875H6.75C6.61739 11.875 6.49021 11.8223 6.39645 11.7286C6.30268 11.6348 6.25 11.5076 6.25 11.375C6.25 11.2424 6.30268 11.1152 6.39645 11.0214C6.49021 10.9277 6.61739 10.875 6.75 10.875H7.625V8.125H7.125C6.99239 8.125 6.86521 8.07232 6.77145 7.97855C6.67768 7.88479 6.625 7.75761 6.625 7.625C6.625 7.49239 6.67768 7.36521 6.77145 7.27145C6.86521 7.17768 6.99239 7.125 7.125 7.125H8.125C8.25761 7.125 8.38479 7.17768 8.47855 7.27145C8.57232 7.36521 8.625 7.49239 8.625 7.625V10.875H9.5C9.63261 10.875 9.75979 10.9277 9.85355 11.0214C9.94732 11.1152 10 11.2424 10 11.375C10 11.5076 9.94732 11.6348 9.85355 11.7286C9.75979 11.8223 9.63261 11.875 9.5 11.875Z"
                                fill="#8695AA"
                            />
                        </svg>
                        <div>Password must contain at least</div>
                    </div>
                    <ul
                        className="ml-5 text-[#609AFA]"
                        style={{ listStyleType: "disc" }}
                    >
                        <PasswordCheckItem
                            label="Eight (8) characters"
                            state={passwordCheckState.lengthCheck}
                        />

                        <PasswordCheckItem
                            label="One Number"
                            state={passwordCheckState.numberCheck}
                        />

                        <PasswordCheckItem
                            label="One Lower case alphabet"
                            state={passwordCheckState.lowerCaseCheck}
                        />

                        <PasswordCheckItem
                            label="One Upper case alphabet"
                            state={passwordCheckState.upperCaseCheck}
                        />

                        <PasswordCheckItem
                            label="One special character (@,$,#,! etc)"
                            state={passwordCheckState.specialCharCheck}
                        />
                    </ul>
                </div>
            </div>
            <div className="w-full justify-center items-center flex flex-col">
                <Button
                    className="bg-indigo-primary hover:bg-indigo-hover active:bg-indigo-active w-1/2"
                    onClick={handleProceed}
                >
                    Proceed
                </Button>
                {showSkipButton && (
                    <Button
                        className="text-indigo-custom bg-white-primary hover:border hover:bg-[#DFE1FF] w-1/2 mt-1"
                        onClick={handleSkip}
                    >
                        Skip
                    </Button>
                )}
            </div>

            {showSkipButton && (
                <Dialog open={openSkipDialog} onOpenChange={setOpenSkipDialog}>
                    <DialogContent
                        className="flex flex-col  items-start justify-center w-[60vw] h-auto bg-[#fff] border-none outline-none max-w-[654px]"
                        onInteractOutside={(e) => {
                            e.preventDefault();
                        }}
                    >
                        <div className="b1-bold flex text-[#DC2626]">
                            Backup your account
                        </div>
                        <p className="b2-regular text-[#F87171]">
                            Without a password, you will not be able to backup
                            your account.{" "}
                            <span className="text-[#DC2626]">
                                And without a backup, you won’t be able to
                                Recover your wallet in future.
                            </span>
                        </p>
                        <div className="b2-regular p-2 flex rounded-lg border bg-[rgba(96,154,250,0.1)] border-[#93BBFD] text-[#3B82F6] my-4">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 20 20"
                                fill="none"
                            >
                                <path
                                    d="M8 2.25C4.55375 2.25 1.75 5.05375 1.75 8.5C1.75 11.9462 4.55375 14.75 8 14.75C11.4462 14.75 14.25 11.9462 14.25 8.5C14.25 5.05375 11.4462 2.25 8 2.25ZM8 4.8125C8.1607 4.8125 8.31779 4.86015 8.4514 4.94943C8.58502 5.03871 8.68916 5.1656 8.75065 5.31407C8.81215 5.46253 8.82824 5.6259 8.79689 5.78351C8.76554 5.94112 8.68815 6.08589 8.57452 6.19952C8.46089 6.31315 8.31612 6.39054 8.15851 6.42189C8.0009 6.45324 7.83753 6.43715 7.68907 6.37565C7.5406 6.31416 7.41371 6.21002 7.32443 6.0764C7.23515 5.94279 7.1875 5.7857 7.1875 5.625C7.1875 5.40951 7.2731 5.20285 7.42548 5.05048C7.57785 4.8981 7.78451 4.8125 8 4.8125ZM9.5 11.875H6.75C6.61739 11.875 6.49021 11.8223 6.39645 11.7286C6.30268 11.6348 6.25 11.5076 6.25 11.375C6.25 11.2424 6.30268 11.1152 6.39645 11.0214C6.49021 10.9277 6.61739 10.875 6.75 10.875H7.625V8.125H7.125C6.99239 8.125 6.86521 8.07232 6.77145 7.97855C6.67768 7.88479 6.625 7.75761 6.625 7.625C6.625 7.49239 6.67768 7.36521 6.77145 7.27145C6.86521 7.17768 6.99239 7.125 7.125 7.125H8.125C8.25761 7.125 8.38479 7.17768 8.47855 7.27145C8.57232 7.36521 8.625 7.49239 8.625 7.625V10.875H9.5C9.63261 10.875 9.75979 10.9277 9.85355 11.0214C9.94732 11.1152 10 11.2424 10 11.375C10 11.5076 9.94732 11.6348 9.85355 11.7286C9.75979 11.8223 9.63261 11.875 9.5 11.875Z"
                                    fill="#609AFA"
                                />
                            </svg>
                            <div>
                                Connecting your Silent Shard mobile app to your
                                browser generates a distributed key.
                            </div>
                        </div>
                        <div className="w-full flex items-center">
                            <Checkbox
                                id="terms"
                                className="w-[18px] h-[18px] border rounded-[2px] border-[#ECEEF2] mr-2 active:bg-indigo-primary"
                                onClick={() => setIsAgree(!isAgree)}
                            />
                            <label
                                htmlFor="terms"
                                className="label-regular text-[#383A42] peer-disabled:cursor-not-allowed"
                            >
                                I understand the risk and agree to restore
                            </label>
                        </div>
                        <div className="flex gap-x-[10px] w-full">
                            <Button
                                className="w-1/2 min-h-[48px] h-max flex-wrap rounded-[8px] border border-indigo-primary hover:bg-indigo-hover active:bg-indigo-active text-indigo-primary hover:text-[#FFF] bg-[#FFF] btn-sm"
                                onClick={() => {
                                    setOpenSkipDialog(false);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="w-1/2 min-h-[48px] h-max flex-wrap rounded-[8px] bg-[#F87171] text-white-primary btn-sm"
                                onClick={handleTakeRisk}
                                disabled={!isAgree}
                            >
                                Take the risk
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
