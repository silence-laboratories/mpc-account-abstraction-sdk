// Copyright (c) Silence Laboratories Pte. Ltd.
// This software is licensed under the Silence Laboratories License Agreement.

import * as utils from "../utils";
import _sodium from "libsodium-wrappers-sumo";
import { DistributedKey, PairingData, PairingSessionData } from "../types";
import { MpcError, MpcErrorCode } from "../error";
import { aeadDecrypt } from "../crypto";
import { HttpClient } from "../transport/httpClient";

export enum PairingRemark {
  WALLET_MISMATCH = "WALLET_MISMATCH",
  NO_BACKUP_DATA_WHILE_REPAIRING = "NO_BACKUP_DATA_WHILE_REPAIRING",
  INVALID_BACKUP_DATA = "INVALID_BACKUP_DATA",
}

export interface PairingDataInit {
  pairingId: string;
  encPair: _sodium.KeyPair;
  signPair: _sodium.KeyPair;
}

export class PairingAction {
  private pairingDataInit?: PairingDataInit;
  httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  init = async (walletId: string) => {
    try {
      let pairingId = await utils.randomPairingId();

      await _sodium.ready;
      const encPair = _sodium.crypto_box_keypair();
      const signPair = _sodium.crypto_sign_keypair();

      this.pairingDataInit = {
        pairingId,
        encPair,
        signPair,
      };

      let qrCode = JSON.stringify({
        walletId,
        pairingId,
        webEncPublicKey: _sodium.to_hex(encPair.publicKey),
        signPublicKey: _sodium.to_hex(signPair.publicKey),
      });

      return qrCode;
    } catch (error) {
      if (error instanceof Error) {
        throw new MpcError(error.message, MpcErrorCode.UnknownError);
      } else throw new MpcError("unkown-error", MpcErrorCode.UnknownError);
    }
  };

  startPairingSession = async () => {
    try {
      if (!this.pairingDataInit) {
        throw new MpcError(
          "Pairing data not initialized",
          MpcErrorCode.PairingNotInitialized
        );
      }

      const pairingId = this.pairingDataInit.pairingId;
      const signature = _sodium.crypto_sign_detached(
        pairingId,
        this.pairingDataInit.signPair.privateKey
      );

      const pairingSessionData = await this.httpClient.getTokenEndpoint(
        pairingId,
        _sodium.to_hex(signature)
      );
      return pairingSessionData;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      } else throw new MpcError("unkown-error", MpcErrorCode.UnknownError);
    }
  };

  endPairingSession = async (
    pairingSessionData: PairingSessionData,
    currentAccountAddress?: string,
    password?: string
  ) => {
    if (!this.pairingDataInit) {
      throw new MpcError(
        "Pairing data not initialized",
        MpcErrorCode.PairingNotInitialized
      );
    }
    try {
      const startTime = Date.now();
      const sessionToken = pairingSessionData.token;

      let distributedKey: DistributedKey | undefined;
      let accountAddress: string | undefined;

      if (pairingSessionData.backupData && password) {
        try {
          const backupDataJson = await this.decryptAndDeserializeBackupData(
            sessionToken,
            pairingSessionData.backupData,
            password
          );
          distributedKey = backupDataJson.distributedKey;
          accountAddress = backupDataJson.accountAddress;
        } catch (error) {
          throw error;
        }
      }

      await this.validateRePairing(
        sessionToken,
        accountAddress,
        currentAccountAddress
      );

      const pairingData: PairingData = {
        pairingId: this.pairingDataInit.pairingId,
        webEncPublicKey: _sodium.to_hex(this.pairingDataInit.encPair.publicKey),
        webEncPrivateKey: _sodium.to_hex(
          this.pairingDataInit.encPair.privateKey
        ),
        webSignPublicKey: _sodium.to_hex(
          this.pairingDataInit.signPair.publicKey
        ),
        webSignPrivateKey: _sodium.to_hex(
          this.pairingDataInit.signPair.privateKey
        ),
        appPublicKey: pairingSessionData.appPublicKey,
        token: sessionToken,
        tokenExpiration: pairingSessionData.tokenExpiration,
        deviceName: pairingSessionData.deviceName,
      };
      return {
        newPairingState: {
          pairingData,
          distributedKey: distributedKey ?? null,
        },
        elapsedTime: Date.now() - startTime,
        deviceName: pairingSessionData.deviceName,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      } else throw new MpcError("unkown-error", MpcErrorCode.UnknownError);
    }
  };

  refreshToken = async (pairingData: PairingData) => {
    try {
      let startTime = Date.now();
      let signature: Uint8Array;
      signature = _sodium.crypto_sign_detached(
        pairingData.token,
        _sodium.from_hex(pairingData.webSignPrivateKey)
      );

      const data = await this.httpClient.refreshTokenEndpoint(
        pairingData.token,
        _sodium.to_hex(signature)
      );
      const newPairingData: PairingData = {
        ...pairingData,
        ...data,
      };
      return {
        newPairingData: newPairingData,
        elapsedTime: Date.now() - startTime,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      } else throw new MpcError(`unkown-error`, MpcErrorCode.UnknownError);
    }
  };

  private decryptAndDeserializeBackupData = async (
    token: string,
    backupData: string,
    password: string
  ): Promise<{ distributedKey: DistributedKey; accountAddress: string }> => {
    if (!this.pairingDataInit) {
      throw new MpcError(
        "Pairing data not initialized",
        MpcErrorCode.PairingNotInitialized
      );
    }
    try {
      const decreptedMessage = await aeadDecrypt(backupData, password);
      const distributedKey = JSON.parse(
        utils.uint8ArrayToUtf8String(decreptedMessage)
      );
      let accountAddress = utils.getAddressFromPubkey(distributedKey.publicKey);
      return {
        distributedKey,
        accountAddress,
      };
    } catch (error) {
      await this.httpClient.sendMessage(
        token,
        "pairing",
        {
          isPaired: false,
          pairingRemark: PairingRemark.INVALID_BACKUP_DATA,
        },
        false,
        this.pairingDataInit.pairingId
      );

      if (error instanceof MpcError) {
        throw error;
      } else if (error instanceof Error) {
        throw new MpcError(error.message, MpcErrorCode.InvalidBackupData);
      } else
        throw new MpcError(
          "wrong secret key for the given ciphertext",
          MpcErrorCode.InvalidBackupData
        );
    }
  };

  private validateRePairing = async (
    sessionToken: string,
    accountAddress?: string,
    currentAccountAddress?: string
  ) => {
    if (!this.pairingDataInit) {
      throw new MpcError(
        "Pairing data not initialized",
        MpcErrorCode.PairingNotInitialized
      );
    }
    if (currentAccountAddress && !accountAddress) {
      await this.httpClient.sendMessage(
        sessionToken,
        "pairing",
        {
          isPaired: false,
          pairingRemark: PairingRemark.NO_BACKUP_DATA_WHILE_REPAIRING,
        },
        false,
        this.pairingDataInit.pairingId
      );

      throw new MpcError(
        "No backup data while repairing",
        MpcErrorCode.RejectedPairingRequest
      );
    } else if (
      currentAccountAddress &&
      accountAddress &&
      currentAccountAddress !== accountAddress
    ) {
      await this.httpClient.sendMessage(
        sessionToken,
        "pairing",
        {
          isPaired: true,
          pairingRemark: PairingRemark.WALLET_MISMATCH,
        },
        false,
        this.pairingDataInit.pairingId
      );
    } else
      await this.httpClient.sendMessage(
        sessionToken,
        "pairing",
        {
          isPaired: true,
        },
        false,
        this.pairingDataInit.pairingId
      );
  };
}
