// Copyright (c) Silence Laboratories Pte. Ltd.
// This software is licensed under the Silence Laboratories License Agreement.

export class MpcError extends Error {
	code: number;
	constructor(message: string, code: MpcErrorCode) {
		super(JSON.stringify({ message, code }));
		this.name = 'MpcError';
		this.code = code;
	}
}

export enum MpcErrorCode {
	FirebaseError = 1,
	RejectedPairingRequest = 2,
	PairingNotInitialized = 3,
	InvalidBackupData = 4,
	InvalidStorageData = 5,
	StorageError = 6,
	NotPaired = 7,
	KeygenResourceBusy = 8,
	InternalLibError = 9,
	UserPhoneDenied = 10,
	KeygenFailed = 11,
	InvalidMessageHashLength = 12,
	WalletNotCreated = 13,
	AccountNotCreated = 14,
	SignResourceBusy = 15,
	SignFailed = 16,
	CannotFindWallet = 17,
	UnknownMethod = 18,
	UnknownError = 19,
	BackupFailed = 20,
	InvalidStoragePlatform = 21,
	StorageNotInitialized = 22,
}
