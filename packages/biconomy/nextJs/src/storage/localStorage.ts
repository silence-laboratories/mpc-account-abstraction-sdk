"use client";
import { WALLET_STATUS } from "@/constants";

export function setPairingStatus(status: WALLET_STATUS) {
    localStorage.setItem("pairingStatus", status);
}

export function getPairingStatus(): WALLET_STATUS {
    return (localStorage.getItem("pairingStatus") ??
        "Unpaired") as WALLET_STATUS;
}

export function setOldEoa(eoa: string) {
    localStorage.setItem("oldEoa", eoa);
}

export function getOldEoa(): string | null{
    return localStorage.getItem("oldEoa");
}

export function clearOldEoa() {
    localStorage.removeItem("oldEoa");
}
