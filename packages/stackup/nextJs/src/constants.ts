export const WALLET_ID = "stackup";

export const SEPOLIA = {
    chainId: "0xaa36a7", // in hex
    chainName: "Sepolia Test Network",
    nativeCurrency: {
        name: "sepolia",
        symbol: "ETH",
        decimals: 18,
    },
    rpcUrls: ["https://rpc.sepolia.org"],
    blockExplorerUrls: ["https://sepolia.etherscan.io/"],
};

export enum WALLET_STATUS {
    Paired = "Paired",
    Unpaired = "Unpaired",
    BackedUp = "BackedUp",
    Minted = "Minted",
    Mismatched = "Mismatched",
}