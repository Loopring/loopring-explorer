// TODO: remove once env variables are added to vercel.
// export const EXPLORER_NETWORK = 'ETHEREUM';
export const EXPLORER_NETWORK = 'TAIKO';
// export const EXPLORER_NETWORK = process.env.NEXT_PUBLIC_EXPLORER_NETWORK.toUpperCase() ?? 'ETHEREUM';
export const LOOPRING_SUBGRAPH =
  process.env.NEXT_PUBLIC_SUBGRAPH_ENDPOINT ??
  'https://dev.loopring.io/api/v3/forwardRequest';
export const EXPLORER_URL = 'https://etherscan.io/';
export const INFURA_ENDPOINT =
  process.env.NEXT_PUBLIC_INFURA_ENDPOINT ?? 'https://mainneteth.loopring.io';
export const UNISWAP_SUBGRAPH = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2';
export const apiEndpointByTxType = {
  transfer: 'user/transactions',
  deposit: 'user/transactions',
  withdraw: 'user/transactions',
  trade: 'user/trades',
  nftMint: 'user/nft/mints',
  joinAmm: 'user/amm/transactions',
  exitAmm: 'user/amm/transactions',
  nftWithdraw: 'user/nft/withdrawals',
  nftTransfer: 'user/nft/transfers',
  nftDeposit: 'user/nft/deposits',
  nftTrade: 'user/nft/trades',
  accountUpdate: 'user/transactions',
};
export const loopringApiEndpoints = {
  collection: 'nft/public/collection'
};
export const NFT_DISALLOW_LIST = [];
export enum USER_CONTENT {
  YES = 'yes',
  NO = 'no',
}
const EXPLORER_CONFIG_MAP = new Map([
  ['ETHEREUM', {
    LOOPRING_API: 'https://api3.loopring.io/api/v3/',
    SHOW_ID_FOR_USER_LINK: false,
    SHOW_API_SOURCE_TOGGLE: true,
    TITLE: 'Loopring zkRollup Explorer',
    TX_LINK_DISABLED: false,
    L1_EXPLORER_URL: 'https://etherscan.io/',
    SHOW_ACCOUNT_NFTS: true,
    SHOW_ACCOUNT_TXS: true,
    SEARCH_PLACEHOLDER: 'Search for block, tx, account ID, Collection Address',
    TOTAL_ACCOUNTS_WORDING: 'Total L2 Accounts'
  }],
  ['TAIKO', {
    LOOPRING_API: 'https://taiko.loopring.io/api/v3/',
    SHOW_ID_FOR_USER_LINK: true,
    SHOW_API_SOURCE_TOGGLE: false,
    TITLE: 'Loopring zkRollup Explorer (TAIKO)',
    TX_LINK_DISABLED: true,
    L1_EXPLORER_URL: 'https://taikoscan.io/',
    SHOW_ACCOUNT_NFTS: false,
    SHOW_ACCOUNT_TXS: false,
    SEARCH_PLACEHOLDER: 'Search for block, account ID',
    TOTAL_ACCOUNTS_WORDING: 'Total L3 Accounts'
  }],
])
export const EXPLORER_CONFIG = EXPLORER_CONFIG_MAP.get(EXPLORER_NETWORK)