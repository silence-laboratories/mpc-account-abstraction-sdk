// Copyright (c) Silence Laboratories Pte. Ltd.
// This software is licensed under the Silence Laboratories License Agreement.

import { MpcError, MpcErrorCode } from "../error";
import { AccountData, StorageData } from "../types";
import { IStorage } from "./types";

export class LocalStorageManager implements IStorage {
  private VERSION = 1;
  constructor(walletId: string) {
    localStorage.setItem("walletId", walletId);
    this.migrate();
  }

  /**
   * Get wallet id from local storage
   *
   * @returns walletId
   */
  getWalletId(): string {
    let walletId = localStorage.getItem("walletId");
    if (walletId === null) {
      throw new MpcError("Wallet id is not found", MpcErrorCode.UnknownError);
    }
    return walletId;
  }

  /**
   * Check if a storage exist for the wallet
   *
   * @returns true if exists, false otherwise
   */
  isStorageExist = (): boolean => {
    let walletId = this.getWalletId();
    let data = localStorage.getItem(walletId);
    return data !== null;
  };

  /**
   * Delete the stored data, if it exists.
   */
  clearStorageData = () => {
    let walletId = this.getWalletId();
    localStorage.removeItem(walletId);
  };

  /**
   * Save SilentShareStorage
   *
   * @param data obj to save
   */
  setStorageData = (data: StorageData) => {
    if (data === null) {
      throw new MpcError(
        "Storage data cannot be null",
        MpcErrorCode.InvalidStorageData
      );
    }
    let walletId = this.getWalletId();
    data.version = this.VERSION;
    localStorage.setItem(walletId, JSON.stringify(data));
  };

  /**
   * Retrieve SilentShareStorage
   *
   * @returns SilentShareStorage object
   */
  getStorageData = (): StorageData => {
    const _isStorageExist = this.isStorageExist();
    if (!_isStorageExist) {
      throw new MpcError("Wallet is not paired", MpcErrorCode.NotPaired);
    }

    let walletId = this.getWalletId();
    let state = localStorage.getItem(walletId);

    if (!state) {
      throw new MpcError(
        "Wallet failed to fetch state",
        MpcErrorCode.UnknownError
      );
    }

    const jsonObject: StorageData = JSON.parse(state as string);

    return jsonObject;
  };

  migrate = () => {
    if (!this.isStorageExist()) {
      return;
    }

    if (this.version < 1) {
      const walletAccountV0 = JSON.parse(
        localStorage.getItem("walletAccount") || "null"
      );
      const eoaV0 = JSON.parse(
        localStorage.getItem("eoa") || "null"
      ) as AccountData;
      const passwordReadyV0 = JSON.parse(
        localStorage.getItem("passwordReady") || "false"
      );
      const storageData = this.getStorageData();
      storageData.eoa = eoaV0.address;
      storageData.walletAccount = walletAccountV0;
      storageData.passwordReady = passwordReadyV0;
      this.setStorageData(storageData);
      localStorage.removeItem("walletAccount");
      localStorage.removeItem("eoa");
      localStorage.removeItem("passwordReady");
    }
  };

  private get version(): number {
    const storageData = this.getStorageData();
    const version = storageData.version;
    return version || 0;
  }
}
