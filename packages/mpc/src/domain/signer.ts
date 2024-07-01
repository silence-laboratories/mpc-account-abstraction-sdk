// Copyright (c) Silence Laboratories Pte. Ltd.
// This software is licensed under the Silence Laboratories License Agreement.

import { ethers } from "ethers";
import { IP1KeyShare } from "@silencelaboratories/ecdsa-tss";
import { hexlify } from "@ethersproject/bytes";
import { Provider, TransactionRequest } from "@ethersproject/abstract-provider";
import {
  Signer,
  TypedDataDomain,
  TypedDataField,
} from "@ethersproject/abstract-signer";
import { keccak256 } from "@ethersproject/keccak256";
import {
  BytesLike,
  hexZeroPad,
  joinSignature,
  Signature,
  splitSignature,
} from "@ethersproject/bytes";
import { resolveProperties } from "@ethersproject/properties";
import { getAddress } from "@ethersproject/address";
import { serialize, UnsignedTransaction } from "@ethersproject/transactions";
import { hashMessage, _TypedDataEncoder } from "@ethersproject/hash";
import { _toUtf8String } from "@ethersproject/strings/lib/utf8";
import { concat, toUtf8Bytes } from "ethers/lib/utils";
import { MpcAuthenticator } from "./authenticator";
import { DistributedKey } from "../types";

/**
 * Represents a signer that utilizes Multi-Party Computation (MPC) for signing Ethereum transactions and messages.
 * This class extends the ethers.js abstract Signer class, integrating with a custom MPC SDK for the cryptographic operations.
 *
 * @class MpcSigner
 * @extends {Signer}
 *
 * @property {DistributedKey} distributedKey - Distributed key of the signer.
 * @property {string} address - Ethereum address associated with this signer.
 * @property {string} public_key - Public key of the signer.
 * @property {MpcAuthenticator} mpcAuth - MPC SDK instance used for signing operations.
 * @property {Provider} [provider] - Ethers.js provider instance to interact with the Ethereum network.
 *
 * @constructor
 * Creates an instance of MpcSigner.
 * @param {MpcAuthenticator} mpcAuth - MPC SDK instance for signing operations.
 * @param {Provider} [provider] - ethers.js provider instance.
 */
export class MpcSigner extends Signer {
  private mpcAuth: MpcAuthenticator;
  public address: string;
  public public_key: string;
  readonly provider?: ethers.providers.Provider;
  private distributedKey: DistributedKey;

  constructor(mpcAuth: MpcAuthenticator, provider?: Provider) {
    super();
    this.mpcAuth = mpcAuth;
    const distributedKey = mpcAuth.getDistributionKey();
    if (!distributedKey) {
      throw new Error("No distributed key found");
    }
    this.distributedKey = distributedKey;
    this.public_key = distributedKey.publicKey;
    this.address = mpcAuth.accountManager.getEoa()!;
    this.provider = provider;
  }

  /**
   * Returns the Ethereum address associated with this signer.
   *
   * @returns {Promise<string>} The Ethereum address as a promise.
   */
  async getAddress(): Promise<string> {
    return this.address;
  }

  /**
   * Signs a given message using the signer's private key. Get the signature from MpcAuthenticator.
   *
   * @param {ethers.utils.Bytes} message - The message to sign.
   * @returns {Promise<string>} The signed message as a promise.
   */
  async signMessage(message: ethers.utils.Bytes): Promise<string> {
    const messagePrefix = "\x19Ethereum Signed Message:\n";

    const messageDigest = hashMessage(message);
    const messageSome = concat([
      toUtf8Bytes(messagePrefix),
      toUtf8Bytes(String(message.length)),
      message,
    ]);

    const hexMessage = hexlify(messageSome);
    const signSdk = await this.mpcAuth.runSign(
      "keccak256",
      hexMessage,
      messageDigest,
      "eth_sign",
      this.mpcAuth.getDistributionKey()!.accountId,
      this.mpcAuth.getDistributionKey()!.keyShareData
    );

    const signBytes = Buffer.from(signSdk.signature, "hex");
    const r = signBytes.subarray(0, 32);
    const s = signBytes.subarray(32, 64);
    const recid = signSdk.recId;

    const split = splitSignature({
      recoveryParam: recid,
      r: hexZeroPad(`0x${r.toString("hex")}`, 32),
      s: hexZeroPad(`0x${s.toString("hex")}`, 32),
    });

    const signedMsg = joinSignature(split);

    return signedMsg;
  }

  /**
   * Signs a transaction with the signer's private key. Get the signature from MpcAuthenticator.
   *
   * @param {TransactionRequest} transaction - The transaction to sign.
   * @returns {Promise<string>} The signed transaction as a promise.
   */
  async signTransaction(transaction: TransactionRequest): Promise<string> {
    return resolveProperties(transaction).then(async (tx: any) => {
      if (tx.from != null) {
        if (getAddress(tx.from) !== this.address) {
          throw new Error(
            `transaction from address mismatch (from:${tx.from} address:${this.address})`
          );
        }
        tx.from = undefined;
      }

      const signature = await this.signDigest(
        keccak256(serialize(<UnsignedTransaction>tx))
      );

      return serialize(<UnsignedTransaction>tx, signature);
    });
  }

  /**
   * Signs a digest with the signer's private key.
   *
   * @param {BytesLike} digest - The digest to sign.
   * @returns {Promise<Signature>} The signature as a promise.
   */
  async signDigest(digest: BytesLike): Promise<Signature> {
    const messageDigest = hexlify(digest);
    const sign = await this.mpcAuth.runSign(
      "keccak256",
      " ",
      messageDigest,
      "eth_sign",
      this.distributedKey.accountId,
      this.distributedKey.keyShareData
    );

    const signBytes = Buffer.from(sign.signature, "hex");
    const r = signBytes.subarray(0, 32);
    const s = signBytes.subarray(32, 64);
    const recid = sign.recId;

    return splitSignature({
      recoveryParam: recid,
      r: hexZeroPad(`0x${r.toString("hex")}`, 32),
      s: hexZeroPad(`0x${s.toString("hex")}`, 32),
    });
  }

  /**
   * Connects the signer with a provider.
   *
   * @param {Provider} provider - The ETH provider to connect with.
   * @returns {MpcSigner} A new instance of MpcSigner connected with the specified provider.
   */
  connect(provider: Provider): MpcSigner {
    return new MpcSigner(this.mpcAuth, provider);
  }

  private async _signTypedData(
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    // rome-ignore lint/suspicious/noExplicitAny: Etherjs uses any
    value: Record<string, any>
  ): Promise<string> {
    // Populate any ENS names
    const populated = await _TypedDataEncoder.resolveNames(
      domain,
      types,
      value,
      //@ts-ignore
      (name: string) => {
        if (this.provider == null) {
          throw new Error("cannot resolve ENS names without a provider");
        }
        return this.provider.resolveName(name);
      }
    );

    return joinSignature(
      await this.signDigest(
        _TypedDataEncoder.hash(populated.domain, types, populated.value)
      )
    );
  }
}
