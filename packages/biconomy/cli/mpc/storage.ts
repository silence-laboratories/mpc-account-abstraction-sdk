// Copyright (c) Silence Laboratories Pte. Ltd.
// This software is licensed under the Silence Laboratories License Agreement.

import fs from "fs";
import { IStorage } from "@silencelaboratories/mpc-sdk/lib/esm/storage/types";
import { ErrorCode, SdkError } from "./error";
import { StorageData } from "@silencelaboratories/mpc-sdk/lib/esm/types";

export class CliStorage implements IStorage {
  /**
   * Function to check if a storage exist
   *
   * @returns true if exists, false otherwise
   */
  isStorageExist = (): boolean => {
    try {
      const fileExists = fs.existsSync("storage.json");
      return fileExists;
    } catch (error) {
      throw new SdkError("error", ErrorCode.StorageError);
    }
  };

  /**
   * Delete the stored data, if it exists.
   */
  clearStorageData = () => {
    try {
      if (fs.existsSync("storage.json")) {
        fs.unlinkSync("storage.json");
      }
    } catch (error) {
      throw new SdkError("Error", ErrorCode.StorageError);
    }
  };

  /**
   * Save SilentShareStorage
   *
   * @param data obj to save
   */
  setStorageData = async (data: StorageData) => {
    try {
      if (data == null) {
        throw new SdkError(
          "Storage data cannot be null",
          ErrorCode.InvalidData
        );
      }

      fs.writeFileSync("storage.json", JSON.stringify(data));
    } catch (error) {
      throw new SdkError("error", ErrorCode.StorageError);
    }
  };

  /**
   * Retrieve SilentShareStorage
   *
   * @returns SilentShareStorage object
   */
  getStorageData = (): StorageData => {
    try {
      const fileContent = fs.readFileSync("storage.json", "utf8");
      const jsonObject: StorageData = JSON.parse(fileContent);

      return jsonObject;
    } catch (error) {
      throw new SdkError("error.message", ErrorCode.StorageError);
    }
  };
}
