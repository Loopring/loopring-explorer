import { EXPLORER_CONFIG } from './config';
interface Account {
  accountId: number;
  owner: string;
  frozen: boolean;
  publicKey: {
    x: string;
    y: string;
  };
  tags: string;
  nonce: number;
  keyNonce: number;
  keySeed: string;
}
export const getLayer2Account = (accountId: number): Promise<Account> =>
  fetch(`${EXPLORER_CONFIG.LOOPRING_API}account?accountId=${accountId}`).then((x) => x.json());

interface AccountBalance {
  accountId: number;
  tokenId: number;
  total: string;
  locked: string;
  pending: {
    withdraw: string;
    deposit: string;
  };
}
export const getAccountLayer2Balances = (accountId: number): Promise<AccountBalance[]> =>
  fetch(`${EXPLORER_CONFIG.LOOPRING_API}user/balances?accountId=${accountId}`).then((x) => x.json());
interface OrderAmounts {
  minimum: string;
  maximum: string;
  dust: string;
}

interface LuckyTokenAmounts {
  minimum: string;
  maximum: string;
  dust: string;
}

interface GasAmounts {
  distribution: string;
  deposit: string;
}

interface Token {
  type: string;
  tokenId: number;
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  precision: number;
  precisionForOrder: number;
  orderAmounts: OrderAmounts;
  luckyTokenAmounts: LuckyTokenAmounts;
  fastWithdrawLimit: string;
  gasAmounts: GasAmounts;
  enabled: boolean;
}
export const getTokens = (): Promise<Token[]> =>
  fetch(`${EXPLORER_CONFIG.LOOPRING_API}exchange/tokens`).then((x) => x.json());
interface TokenPrice {
  token: string;
  price: string;
}
export const getTokensPrices = (): Promise<TokenPrice[]> =>
  fetch(`${EXPLORER_CONFIG.LOOPRING_API}datacenter/getLatestTokenPrices`)
  .then((x) => x.json())
  .then((x) => x.data);

// https://taiko.loopring.io/api/v3/exchange/tokens