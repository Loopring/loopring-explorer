import numeral from 'numeral';

import AppLink from '../AppLink';
import getTrimmedTxHash from '../../utils/getTrimmedTxHash';
import getTokenAmount from '../../utils/getTokenAmount';
import { EXPLORER_URL } from '../../utils/config';

const makeL1ExplorerCSVLink = (account) => {
  return `"=HYPERLINK(""${EXPLORER_URL}address/${account.address}"",""${account.address}"")"`;
};

const makeCSVLink = (account) => {
  const loopringExplorerLink = `https://${window.location.host}/account/`;
  return `"=HYPERLINK(""${loopringExplorerLink}${account.id}"",""${account.address}"")"`;
};

const makeCSVTokenAmount = (amount, token) => {
  return `${getTokenAmount(amount, token.decimals).toFixed(6)} ${token.symbol}`;
};

export const getCSVTransactionDetailFields = (tx) => {
  switch (tx.__typename) {
    case 'Add':
      return [
        makeCSVLink(tx.account),
        makeCSVLink(tx.pool),
        '',
        '',
        makeCSVTokenAmount(tx.amount, tx.token),
        '',
        '',
        makeCSVTokenAmount(tx.fee, tx.feeToken),
      ];
    case 'Remove':
      return [
        makeCSVLink(tx.pool),
        makeCSVLink(tx.account),
        '',
        '',
        makeCSVTokenAmount(tx.amount, tx.token),
        '',
        '',
        makeCSVTokenAmount(tx.fee, tx.feeToken),
      ];
    case 'Swap':
      return [
        makeCSVLink(tx.account),
        makeCSVLink(tx.pool),
        `${tx.pair.token0.symbol}-${tx.pair.token1.symbol}`,
        tx.pair.token0.symbol === tx.tokenA.symbol ? 'Buy' : 'Sell',
        tx.pair.token0.symbol === tx.tokenA.symbol
          ? makeCSVTokenAmount(tx.fillSB, tx.tokenB)
          : makeCSVTokenAmount(tx.fillSA, tx.tokenA),
        tx.pair.token0.symbol === tx.tokenA.symbol
          ? makeCSVTokenAmount(tx.tokenBPrice, tx.tokenA)
          : makeCSVTokenAmount(tx.tokenAPrice, tx.tokenB),
        tx.pair.token0.symbol === tx.tokenA.symbol
          ? makeCSVTokenAmount(tx.fillSA, tx.tokenA)
          : makeCSVTokenAmount(tx.fillSB, tx.tokenB),
        tx.feeA > 0
          ? makeCSVTokenAmount(tx.feeA, tx.tokenB)
          : tx.feeB > 0
          ? makeCSVTokenAmount(tx.feeB, tx.tokenA)
          : null,
      ];
    case 'OrderbookTrade':
      return [
        makeCSVLink(tx.accountA),
        makeCSVLink(tx.accountB),
        `${tx.pair.token0.symbol}-${tx.pair.token1.symbol}`,
        tx.pair.token0.symbol === tx.tokenA.symbol ? 'Buy' : 'Sell',
        tx.pair.token0.symbol === tx.tokenA.symbol
          ? makeCSVTokenAmount(tx.fillBB, tx.tokenA)
          : makeCSVTokenAmount(tx.fillBA, tx.tokenB),
        tx.pair.token0.symbol === tx.tokenA.symbol
          ? makeCSVTokenAmount(tx.tokenAPrice, tx.tokenB)
          : makeCSVTokenAmount(tx.tokenBPrice, tx.tokenA),
        tx.pair.token0.symbol === tx.tokenA.symbol
          ? makeCSVTokenAmount(tx.fillBA, tx.tokenB)
          : makeCSVTokenAmount(tx.fillBB, tx.tokenA),
        tx.feeA > 0
          ? makeCSVTokenAmount(tx.feeA, tx.tokenB)
          : tx.feeB > 0
          ? makeCSVTokenAmount(tx.feeB, tx.tokenA)
          : null,
      ];
    case 'Deposit':
      return [
        makeL1ExplorerCSVLink(tx.toAccount),
        makeCSVLink(tx.toAccount),
        '',
        '',
        makeCSVTokenAmount(tx.amount, tx.token),
        '',
        '',
        '',
      ];
    case 'Withdrawal':
      return [
        makeCSVLink(tx.fromAccount),
        makeL1ExplorerCSVLink(tx.fromAccount),
        '',
        '',
        makeCSVTokenAmount(tx.amount, tx.withdrawalToken),
        '',
        '',
        makeCSVTokenAmount(tx.fee, tx.withdrawalFeeToken),
      ];
    case 'Transfer':
      return [
        makeCSVLink(tx.fromAccount),
        makeCSVLink(tx.toAccount),
        '',
        '',
        makeCSVTokenAmount(tx.amount, tx.token),
        '',
        '',
        makeCSVTokenAmount(tx.fee, tx.feeToken),
      ];
    case 'AccountUpdate':
      return [makeCSVLink(tx.user), '', '', '', '', '', '', makeCSVTokenAmount(tx.fee, tx.feeToken)];
    case 'AmmUpdate':
      return ['', '', '', '', '', '', ''];
    case 'SignatureVerification':
      return [makeCSVLink(tx.account), '', '', '', '', '', ''];
    case 'TradeNFT':
      return [
        makeCSVLink(tx.accountSeller),
        makeCSVLink(tx.accountBuyer),
        '',
        '',
        makeCSVTokenAmount(tx.realizedNFTPrice, tx.token),
        '',
        '',
        makeCSVTokenAmount(tx.feeBuyer, tx.token),
      ];
    case 'SwapNFT':
      return [makeCSVLink(tx.accountA), makeCSVLink(tx.accountB), '', '', '', '', '', ''];
    case 'WithdrawalNFT':
      return [
        makeCSVLink(tx.fromAccount),
        makeL1ExplorerCSVLink(tx.fromAccount),
        '',
        '',
        '',
        '',
        '',
        makeCSVTokenAmount(tx.fee, tx.withdrawalNFTFeeToken),
      ];
    case 'TransferNFT':
      return [
        makeCSVLink(tx.fromAccount),
        makeCSVLink(tx.toAccount),
        '',
        '',
        '',
        '',
        '',
        makeCSVTokenAmount(tx.fee, tx.feeToken),
      ];
    case 'MintNFT':
      return [makeCSVLink(tx.minter), makeCSVLink(tx.receiver), '', '', '', '', '', ''];
    case 'DataNFT':
      return ['', '', '', '', '', '', '', ''];
    default:
      return ['', '', '', '', '', '', '', ''];
  }
};

const TransactionTableDetails: React.FC<{
  type: string;
  tx: any;
  cellClassName?: string;
}> = ({ type, tx, cellClassName }) => {
  switch (type) {
    case 'Add':
      return (
        <>
          <td className={cellClassName}>
            <AppLink path="account" accountId={tx.account.id}>
              {getTrimmedTxHash(tx.account.address, 10, true)}
            </AppLink>
          </td>
          <td className={cellClassName}>
            <AppLink path="account" accountId={tx.pool.id}>
              {getTrimmedTxHash(tx.pool.address, 10, true)}
            </AppLink>
          </td>
          <td className={cellClassName}>
            {getTokenAmount(tx.amount, tx.token.decimals).toFixed(4)} {tx.token.symbol}
          </td>
          <td className={cellClassName}>
            {getTokenAmount(tx.fee, tx.feeToken.decimals)} {tx.feeToken.symbol}
          </td>
        </>
      );
    case 'Remove':
      return (
        <>
          <td className={cellClassName}>
            <AppLink path="account" accountId={tx.pool.id}>
              {getTrimmedTxHash(tx.pool.address, 10, true)}
            </AppLink>
          </td>
          <td className={cellClassName}>
            <AppLink path="account" accountId={tx.account.id}>
              {getTrimmedTxHash(tx.account.address, 10, true)}
            </AppLink>
          </td>
          <td className={cellClassName}>
            {getTokenAmount(tx.amount, tx.token.decimals).toFixed(4)} {tx.token.symbol}
          </td>
          <td className={cellClassName}>
            {getTokenAmount(tx.fee, tx.feeToken.decimals)} {tx.feeToken.symbol}
          </td>
        </>
      );
    case 'Swap':
      return (
        <>
          <td className={cellClassName}>
            <AppLink path="account" accountId={tx.account.id}>
              {getTrimmedTxHash(tx.account.address, 10, true)}
            </AppLink>
          </td>
          <td className={cellClassName}>
            <AppLink path="account" accountId={tx.pool.id}>
              {getTrimmedTxHash(tx.pool.address, 10, true)}
            </AppLink>
          </td>
          <td className={cellClassName}>
            {numeral(getTokenAmount(tx.fillBA, tx.tokenB.decimals)).format('0[.]00[00]')} {tx.tokenB.symbol}
          </td>
          <td className={cellClassName}>
            {tx.feeA > 0
              ? `${getTokenAmount(tx.feeA, tx.tokenB.decimals)} ${tx.tokenB.symbol}`
              : tx.feeB > 0
              ? `${getTokenAmount(tx.feeB, tx.tokenA.decimals)} ${tx.tokenA.symbol}`
              : null}
          </td>
        </>
      );
    case 'OrderbookTrade':
      return (
        <>
          <td className={cellClassName}>
            <AppLink path="account" accountId={tx.accountA.id}>
              {getTrimmedTxHash(tx.accountA.address, 10, true)}
            </AppLink>
          </td>
          <td className={cellClassName}>
            <AppLink path="account" accountId={tx.accountB.id}>
              {getTrimmedTxHash(tx.accountB.address, 10, true)}
            </AppLink>
          </td>
          <td className={cellClassName}>
            {getTokenAmount(tx.fillBA, tx.tokenB.decimals).toFixed(4)} {tx.tokenB.symbol}
          </td>
          <td className={cellClassName}>
            {tx.feeA > 0
              ? `${getTokenAmount(tx.feeA, tx.tokenB.decimals)} ${tx.tokenB.symbol}`
              : tx.feeB > 0
              ? `${getTokenAmount(tx.feeB, tx.tokenA.decimals)} ${tx.tokenA.symbol}`
              : null}
          </td>
        </>
      );
    case 'Deposit':
      return (
        <>
          <td className={cellClassName}>
            <AppLink path="account" accountId={tx.toAccount.id} address={tx.toAccount.address} isExplorerLink>
              {getTrimmedTxHash(tx.toAccount.address, 10, true)}
            </AppLink>
          </td>
          <td className={cellClassName}>
            <AppLink path="account" accountId={tx.toAccount.id}>
              {getTrimmedTxHash(tx.toAccount.address, 10, true)}
            </AppLink>
          </td>
          <td className={cellClassName}>
            {getTokenAmount(tx.amount, tx.token.decimals).toFixed(4)} {tx.token.symbol}
          </td>
          <td className={cellClassName}></td>
        </>
      );
    case 'Withdrawal':
      return (
        <>
          <td className={cellClassName}>
            <AppLink path="account" accountId={tx.fromAccount.id}>
              {getTrimmedTxHash(tx.fromAccount.address, 10, true)}
            </AppLink>
          </td>
          <td className={cellClassName}>
            <AppLink path="account" accountId={tx.fromAccount.id} address={tx.fromAccount.address} isExplorerLink>
              {getTrimmedTxHash(tx.fromAccount.address, 10, true)}
            </AppLink>
          </td>
          <td className={cellClassName}>
            {getTokenAmount(tx.amount, tx.withdrawalToken.decimals).toFixed(4)} {tx.withdrawalToken.symbol}
          </td>
          <td className={cellClassName}>
            {getTokenAmount(tx.fee, tx.withdrawalFeeToken.decimals)} {tx.withdrawalFeeToken.symbol}
          </td>
        </>
      );
    case 'Transfer':
      return (
        <>
          <td className={cellClassName}>
            <AppLink path="account" accountId={tx.fromAccount.id}>
              {getTrimmedTxHash(tx.fromAccount.address, 10, true)}
            </AppLink>
          </td>
          <td className={cellClassName}>
            <AppLink path="account" accountId={tx.toAccount.id}>
              {getTrimmedTxHash(tx.toAccount.address, 10, true)}
            </AppLink>
          </td>
          <td className={cellClassName}>
            {getTokenAmount(tx.amount, tx.token.decimals).toFixed(4)} {tx.token.symbol}
          </td>
          <td className={cellClassName}>
            {getTokenAmount(tx.fee, tx.feeToken.decimals)} {tx.feeToken.symbol}
          </td>
        </>
      );
    case 'AccountUpdate':
      return (
        <>
          <td className={cellClassName}>
            <AppLink path="account" accountId={tx.user.id}>
              {getTrimmedTxHash(tx.user.address, 10, true)}
            </AppLink>
          </td>
          <td className={cellClassName}></td>
          <td className={cellClassName}></td>
          <td className={cellClassName}>
            {getTokenAmount(tx.fee, tx.feeToken.decimals)} {tx.feeToken.symbol}
          </td>
        </>
      );
    case 'AmmUpdate':
      return (
        <>
          <td className={cellClassName}></td>
          <td className={cellClassName}></td>
          <td className={cellClassName}></td>
          <td className={cellClassName}></td>
        </>
      );
    case 'SignatureVerification':
      return (
        <>
          <td className={cellClassName}>
            <AppLink path="account" accountId={tx.account.id}>
              {getTrimmedTxHash(tx.account.address, 10, true)}
            </AppLink>
          </td>
          <td className={cellClassName}></td>
          <td className={cellClassName}></td>
          <td className={cellClassName}></td>
        </>
      );
    case 'TradeNFT':
      return (
        <>
          <td className={cellClassName}>
            <AppLink path="account" accountId={tx.accountSeller.id}>
              {getTrimmedTxHash(tx.accountSeller.address, 10, true)}
            </AppLink>
          </td>
          <td className={cellClassName}>
            <AppLink path="account" accountId={tx.accountBuyer.id}>
              {getTrimmedTxHash(tx.accountBuyer.address, 10, true)}
            </AppLink>
          </td>
          <td className={cellClassName}>
            {getTokenAmount(tx.realizedNFTPrice, tx.token.decimals)} {tx.token.symbol}
          </td>
          <td className={cellClassName}>
            {getTokenAmount(parseInt(tx.feeBuyer) + parseInt(tx.feeSeller), tx.token.decimals)} {tx.token.symbol}
          </td>
        </>
      );
    case 'SwapNFT':
      return (
        <>
          <td className={cellClassName}>
            <AppLink path="account" accountId={tx.accountA.id}>
              {getTrimmedTxHash(tx.accountA.address, 10, true)}
            </AppLink>
          </td>
          <td className={cellClassName}>
            <AppLink path="account" accountId={tx.accountB.id}>
              {getTrimmedTxHash(tx.accountB.address, 10, true)}
            </AppLink>
          </td>
          <td className={cellClassName}></td>
          <td className={cellClassName}></td>
        </>
      );
    case 'WithdrawalNFT':
      return (
        <>
          <td className={cellClassName}>
            <AppLink path="account" accountId={tx.fromAccount.id}>
              {getTrimmedTxHash(tx.fromAccount.address, 10, true)}
            </AppLink>
          </td>
          <td className={cellClassName}>
            <AppLink path="account" accountId={tx.fromAccount.id} address={tx.fromAccount.address} isExplorerLink>
              {getTrimmedTxHash(tx.fromAccount.address, 10, true)}
            </AppLink>
          </td>
          <td className={cellClassName}></td>
          <td className={cellClassName}>
            {getTokenAmount(tx.fee, tx.withdrawalNFTFeeToken.decimals)} {tx.withdrawalNFTFeeToken.symbol}
          </td>
        </>
      );
    case 'TransferNFT':
      return (
        <>
          <td className={cellClassName}>
            <AppLink path="account" accountId={tx.fromAccount.id}>
              {getTrimmedTxHash(tx.fromAccount.address, 10, true)}
            </AppLink>
          </td>
          <td className={cellClassName}>
            <AppLink path="account" accountId={tx.toAccount.id}>
              {getTrimmedTxHash(tx.toAccount.address, 10, true)}
            </AppLink>
          </td>
          <td className={cellClassName}></td>
          <td className={cellClassName}>
            {getTokenAmount(tx.fee, tx.feeToken.decimals)} {tx.feeToken.symbol}
          </td>
        </>
      );
    case 'MintNFT':
      return (
        <>
          <td className={cellClassName}>
            <AppLink path="account" accountId={tx.minter.id}>
              {getTrimmedTxHash(tx.minter.address, 10, true)}
            </AppLink>
          </td>
          <td className={cellClassName}>
            <AppLink path="account" accountId={tx.receiver.id}>
              {getTrimmedTxHash(tx.receiver.address, 10, true)}
            </AppLink>
          </td>
          <td className={cellClassName}></td>
          <td className={cellClassName}>{/* {getTokenAmount(tx.fee, tx.feeToken.decimals)} {tx.feeToken.symbol} */}</td>
        </>
      );
    case 'DataNFT':
      return (
        <>
          <td className={cellClassName}></td>
          <td className={cellClassName}></td>
          <td className={cellClassName}></td>
          <td className={cellClassName}></td>
        </>
      );
    default:
      return null;
  }
};

export default TransactionTableDetails;
