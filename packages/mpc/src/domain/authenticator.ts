import { aeadEncrypt, requestEntropy } from "../crypto";
import { fromHexStringToBytes, getAddressFromPubkey } from "../utils";
import { IStorage } from "../storage/types";
import {
  Options,
  PairingSessionData,
  SignMetadata,
  StorageData,
  StoragePlatform,
} from "../types";
import { MpcError, MpcErrorCode } from "../error";
import { IP1KeyShare } from "@silencelaboratories/ecdsa-tss";
import { LocalStorageManager } from "../storage/localStorage";
import { AccountManager } from "./account";
import { PairingAction } from "../actions/pairing";
import { KeygenAction } from "../actions/keygen";
import { SignAction } from "../actions/sign";
import { BackupAction } from "../actions/backup";
import { HttpClient } from "../transport/httpClient";

/**
 * Represents an authenticator for managing MPC (Multi-Party Computation) operations such as pairing, key generation, signing, and backup.
 * This class encapsulates the logic for interacting with the underlying storage, managing accounts, and communicating with a remote server for MPC operations.
 */
export class MpcAuthenticator {
  /**
   * The lifetime of a token in milliseconds.
   * @private
   */
  private TOKEN_LIFE_TIME = 60000;
  /**
   * The storage interface for persisting data.
   * @private
   */
  private storage?: IStorage;
  /**
   * The wallet identifier.
   * @private
   */
  private walletId: string = "";
  /**
   * The HTTP client for making requests to the server.
   * @private
   */
  private httpClient: HttpClient;
  private pairingAction: PairingAction;
  private keygenAction: KeygenAction;
  private signAction: SignAction;
  private backupAction: BackupAction;

  /**
   * The manager for account-related operations.
   * @public
   */
  accountManager: AccountManager;

  constructor(configs: Options) {
    const {
      storagePlatform = StoragePlatform.Browser,
      customStorage,
      walletId,
      isDev,
    } = configs;

    if (storagePlatform === StoragePlatform.Browser) {
      this.storage = new LocalStorageManager(walletId);
    } else {
      this.storage = customStorage;
    }
    if (!this.storage) {
      throw new MpcError(
        "Storage not initialized",
        MpcErrorCode.StorageNotInitialized
      );
    }
    this.walletId = walletId;
    this.accountManager = new AccountManager(this.storage);
    this.httpClient = new HttpClient(
      isDev
        ? "https://us-central1-mobile-wallet-mm-snap-staging.cloudfunctions.net"
        : "https://us-central1-mobile-wallet-mm-snap.cloudfunctions.net"
    );
    this.pairingAction = new PairingAction(this.httpClient);
    this.keygenAction = new KeygenAction(this.httpClient);
    this.signAction = new SignAction(this.httpClient);
    this.backupAction = new BackupAction(this.httpClient);
  }

  /**
   * Retrieves the operating system of party 2 device.
   * @returns The operating system of party 2 device.
   * @public
   */
  getDeviceOS = () => {
    return this.accountManager.getDeviceOS();
  };

  /**
   * Retrieves the distribution key from storage.
   * @returns The distribution key if available.
   * @throws {MpcError} If the storage is not initialized.
   * @public
   */
  getDistributionKey() {
    if (!this.storage)
      throw new MpcError(
        "Storage not initialized",
        MpcErrorCode.StorageNotInitialized
      );
    let silentShareStorage = this.storage.getStorageData();
    return silentShareStorage.newPairingState?.distributedKey;
  }

  /**
   * Checks if the device is paired.
   * @returns An object indicating if the device is paired and additional pairing information.
   * @throws {MpcError} If the storage is not initialized.
   * @public
   */
  async isPaired() {
    if (!this.storage)
      throw new MpcError(
        "Storage not initialized",
        MpcErrorCode.StorageNotInitialized
      );
    try {
      let silentShareStorage = this.storage.getStorageData();
      const deviceName = silentShareStorage.pairingData.deviceName;
      return {
        isPaired: true,
        deviceName,
        // Avoid chaning this, have some legacy reference
        isAccountExist:
          silentShareStorage.pairingData.pairingId ===
            silentShareStorage.newPairingState?.pairingData?.pairingId &&
          silentShareStorage.newPairingState?.distributedKey,
      };
    } catch {
      return {
        isPaired: false,
        deviceName: null,
      };
    }
  }

  /**
   * Initializes the pairing process and returns a QR code for pairing.
   * @returns A QR code for pairing.
   * @public
   */
  async initPairing() {
    const walletId = this.getWalletId();
    let qrCode = await this.pairingAction.init(walletId);
    return qrCode;
  }

  /**
   * Starts the pairing session.
   * @returns The result of starting the pairing session.
   * @public
   */
  async runStartPairingSession() {
    return await this.pairingAction.startPairingSession();
  }

  /**
   * Ends the pairing session with the provided session data.
   * @param {PairingSessionData} pairingSessionData - The data from the pairing session.
   * @param {string} [currentAccountAddress] - The current account address, to serve re-pairing operation.
   * @param {string} [password] - The password, if available, to serve re-pairing operation.
   * @returns The result of ending the pairing session.
   * @throws {MpcError} If the storage is not initialized.
   * @public
   */
  async runEndPairingSession(
    pairingSessionData: PairingSessionData,
    currentAccountAddress?: string,
    password?: string
  ) {
    if (!this.storage)
      throw new MpcError(
        "Storage not initialized",
        MpcErrorCode.StorageNotInitialized
      );
    const result = await this.pairingAction.endPairingSession(
      pairingSessionData,
      currentAccountAddress,
      password
    );
    const distributedKey = result.newPairingState.distributedKey;

    const eoa = distributedKey
      ? getAddressFromPubkey(distributedKey.publicKey)
      : null;

    this.storage.setStorageData({
      newPairingState: result.newPairingState,
      pairingData: result.newPairingState.pairingData,
      eoa,
    });

    return {
      pairingStatus: "paired",
      newAccountAddress: eoa,
      deviceName: result.deviceName,
      elapsedTime: result.elapsedTime,
    };
  }

  /**
   * Refreshes the pairing information and session token.
   * @returns The new pairing data.
   * @throws {MpcError} If the storage is not initialized.
   * @public
   */
  async refreshPairing() {
    if (!this.storage)
      throw new MpcError(
        "Storage not initialized",
        MpcErrorCode.StorageNotInitialized
      );
    let silentShareStorage: StorageData = this.storage.getStorageData();
    let pairingData = silentShareStorage.pairingData;
    let result = await this.pairingAction.refreshToken(pairingData);
    this.storage.setStorageData({
      ...silentShareStorage,
      pairingData: result.newPairingData,
    });
    return result.newPairingData;
  }

  /**
   * Runs the key generation process.
   * @returns The result of the key generation process.
   * @throws {MpcError} If the storage is not initialized.
   * @public
   */
  async runKeygen() {
    if (!this.storage)
      throw new MpcError(
        "Storage not initialized",
        MpcErrorCode.StorageNotInitialized
      );
    let { pairingData, silentShareStorage } =
      await this.getPairingDataAndStorage();
    let x1 = fromHexStringToBytes(await requestEntropy());
    let accountId = 1;
    let result = await this.keygenAction.keygen(pairingData, accountId, x1);
    this.storage.setStorageData({
      ...silentShareStorage,
      newPairingState: {
        pairingData: null,
        distributedKey: {
          publicKey: result.publicKey,
          accountId,
          keyShareData: result.keyShareData,
        },
      },
      eoa: getAddressFromPubkey(result.publicKey),
    });
    return {
      distributedKey: {
        publicKey: result.publicKey,
        accountId: accountId,
        keyShareData: result.keyShareData,
      },
      elapsedTime: result.elapsedTime,
    };
  }

  /**
   * Runs the backup process with the provided password.
   * @param {string} password - The password for encrypting the backup.
   * @public
   */
  async runBackup(password: string) {
    let { pairingData, silentShareStorage } =
      await this.getPairingDataAndStorage();
    if (password.length === 0) {
      await this.backupAction.backup(pairingData, "", "", this.getWalletId());
      return;
    }

    if (
      password &&
      password.length >= 8 &&
      silentShareStorage.newPairingState?.distributedKey
    ) {
      try {
        const encryptedMessage = await aeadEncrypt(
          JSON.stringify(silentShareStorage.newPairingState?.distributedKey),
          password
        );
        await this.backupAction.backup(
          pairingData,
          encryptedMessage,
          getAddressFromPubkey(
            silentShareStorage.newPairingState?.distributedKey.publicKey
          ),
          this.getWalletId()
        );
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        } else throw new MpcError("unkown-error", MpcErrorCode.UnknownError);
      }
    }
  }

  /**
   * Runs the signing process with the provided parameters.
   * @param {string} hashAlg - The hash algorithm to use.
   * @param {string} message - The message to sign.
   * @param {string} messageHashHex - The hexadecimal representation of the message hash.
   * @param {SignMetadata} signMetadata - Metadata for the signing process.
   * @param {number} accountId - The account ID.
   * @param {IP1KeyShare} keyShare - The key share for signing.
   * @returns The result of the signing process.
   * @public
   */
  async runSign(
    hashAlg: string,
    message: string,
    messageHashHex: string,
    signMetadata: SignMetadata,
    accountId: number,
    keyShare: IP1KeyShare
  ) {
    if (messageHashHex.startsWith("0x")) {
      messageHashHex = messageHashHex.slice(2);
    }
    if (message.startsWith("0x")) {
      message = message.slice(2);
    }
    let { pairingData } = await this.getPairingDataAndStorage();
    let messageHash = fromHexStringToBytes(messageHashHex);
    if (messageHash.length !== 32) {
      throw new MpcError(
        "Invalid length of messageHash, should be 32 bytes",
        MpcErrorCode.InvalidMessageHashLength
      );
    }

    const walletId = this.getWalletId();

    return await this.signAction.sign({
      pairingData,
      keyShare,
      hashAlg,
      message,
      messageHash,
      signMetadata,
      accountId,
      walletId,
    });
  }

  /**
   * Signs out by clearing the storage data.
   * @throws {MpcError} If the storage is not initialized.
   * @public
   */
  async signOut() {
    if (!this.storage)
      throw new MpcError(
        "Storage not initialized",
        MpcErrorCode.StorageNotInitialized
      );
    this.storage.clearStorageData();
  }

  private async getPairingDataAndStorage() {
    if (!this.storage)
      throw new MpcError(
        "Storage not initialized",
        MpcErrorCode.StorageNotInitialized
      );
    let silentShareStorage: StorageData = this.storage.getStorageData();
    let pairingData = silentShareStorage.pairingData;
    if (pairingData.tokenExpiration < Date.now() - this.TOKEN_LIFE_TIME) {
      pairingData = await this.refreshPairing();
    }
    return { pairingData, silentShareStorage };
  }

  private getWalletId(): string {
    if (this.storage instanceof LocalStorageManager) {
      return this.storage.getWalletId();
    } else {
      return this.walletId;
    }
  }
}
