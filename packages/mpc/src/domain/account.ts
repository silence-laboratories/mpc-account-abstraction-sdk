// Copyright (c) Silence Laboratories Pte. Ltd.
// This software is licensed under the Silence Laboratories License Agreement.

import { IStorage } from "../storage/types";
import { AccountData, DeviceOS } from "../types";

/**
 * Manages account-related operations, interfacing with a storage mechanism to persist and retrieve account data.
 */
export class AccountManager {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Creates an instance of AccountManager.
   * @param {IStorage} storage - The storage mechanism for persisting account data.
   */
  getEoa(): string | null {
    const storageData = this.storage.getStorageData();
    return storageData.eoa;
  }

  /**
   * Sets the smart contract account information in storage.
   * @param {AccountData} walletAccount - The account data to be stored.
   */
  setSmartContractAccount(walletAccount: AccountData) {
    if (!walletAccount.address) return;
    const storageData = this.storage.getStorageData();
    storageData.walletAccount = walletAccount;
    this.storage.setStorageData(storageData);
  }

  /**
   * Retrieves the smart contract account information from storage.
   * @returns {AccountData | null} The account data if available, otherwise null.
   */
  getSmartContractAccount(): AccountData | null {
    const storageData = this.storage.getStorageData();
    return storageData.walletAccount ?? null;
  }

  /**
   * Checks if the password setup is complete.
   * @returns {boolean} True if the password is set, false otherwise.
   */
  isPasswordReady(): boolean {
    return this.storage.getStorageData().passwordReady ?? false;
  }

  /**
   * Marks the password setup as complete or incomplete in storage.
   * @param {boolean} [isPasswordReady=true] - Indicates whether the password setup is complete.
   */
  setPasswordReady(isPasswordReady: boolean = true) {
    const storageData = this.storage.getStorageData();
    storageData.passwordReady = isPasswordReady;
    this.storage.setStorageData(storageData);
  }

  /**
   * Determines the operating system of the device based on stored pairing data.
   * @returns {DeviceOS} The operating system of the device.
   */
  getDeviceOS(): DeviceOS {
    const storageData = this.storage.getStorageData();
    const deviceName = storageData.pairingData.deviceName;
    try {
      const deviceOS = deviceName
        .split(":")[1]
        .split(",")[0]
        .trim() as DeviceOS;
      return deviceOS ?? "ios";
    } catch (error) {
      return "ios";
    }
  }
}
