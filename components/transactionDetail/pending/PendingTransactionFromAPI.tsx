import React from 'react';
import { useRouter } from 'next/router';

import useTokens from '../../../hooks/useTokens';
import Add from '../Add';
import MintNFT from '../MintNFT';
import Remove from '../Remove';
import Transfer from '../Transfer';
import Withdrawal from '../Withdrawal';
import usePendingTransactionData from '../../../hooks/usePendingTransactionData';
import Deposit from '../Deposit';
import WithdrawalNFT from '../WithdrawalNFT';
import TransferNFT from '../TransferNFT';
import getTrimmedTxHash from '../../../utils/getTrimmedTxHash';
import useCheckTxConfirmation from '../../../hooks/useCheckTxConfirmation';
import NoTransactionFound from '../NoTransactionFound';
import TradesList from './TradesList';
import TradeNFT from '../TradeNFT';
import AccountUpdate from '../AccountUpdate';
import NFTTradesList from './NFTTradesList';

const dataKey = {
  trade: 'trades',
  joinAmm: 'transactions',
  exitAmm: 'transactions',
  transfer: 'transactions',
  withdraw: 'transactions',
  deposit: 'transactions',
  nftMint: 'mints',
  nftWithdraw: 'withdrawals',
  nftTransfer: 'transfers',
  nftTrade: 'trades',
  accountUpdate: 'transactions',
};

const PendingTransactionFromAPI: React.FC<{ txId: string }> = ({ txId }) => {
  const router = useRouter();
  const { data: tokensData } = useTokens();
  const txIdSplit = txId.split('-');

  const txHash = txIdSplit[0];
  const txType = txIdSplit[1];

  const { data, isLoading } = usePendingTransactionData(txType, txHash);

  const accountID =
    data && data[dataKey[txType]] && data[dataKey[txType]].length > 0
      ? data[dataKey[txType]][0].storageInfo?.accountId
      : null;
  const tokenID =
    data && data[dataKey[txType]] && data[dataKey[txType]].length > 0
      ? data[dataKey[txType]][0].storageInfo?.tokenId
      : null;
  const storageID =
    data && data[dataKey[txType]] && data[dataKey[txType]].length > 0
      ? data[dataKey[txType]][0].storageInfo?.storageId
      : null;
  const { data: confirmedTx } = useCheckTxConfirmation(accountID, tokenID, storageID);
  const getParsedTxData = (transaction) => {
    switch (txType) {
      case 'trade':
        return transaction.trades;
      case 'joinAmm':
        return null;
      case 'exitAmm':
        return null;
      case 'transfer':
      case 'withdraw':
        const transactionData = transaction?.transactions[0];
        if (!transactionData) {
          return null;
        }

        const {
          receiver,
          receiverAddress,
          senderAddress,
          amount,
          symbol,
          feeTokenSymbol,
          feeAmount,
          blockIdInfo,
          storageInfo,
          timestamp,
          txHash,
        } = transactionData;
        return {
          block: {
            id: blockIdInfo.blockId != '0' ? blockIdInfo.blockId : null,
            timestamp,
            txHash,
          },
          fromAccount: {
            id: storageInfo.accountId,
            address: senderAddress,
          },
          toAccount: {
            id: receiver,
            address: receiverAddress,
          },
          [txType === 'withdraw' ? 'withdrawalToken' : 'token']: {
            symbol,
            decimals: tokensData.find((token) => token.tokenId == storageInfo.tokenId)?.decimals ?? 0,
          },
          [txType === 'withdraw' ? 'withdrawalFeeToken' : 'feeToken']: {
            symbol: feeTokenSymbol,
            decimals: tokensData.find((token) => token.symbol === feeTokenSymbol)?.decimals ?? 0,
          },
          fee: feeAmount,
          amount,
        };
      case 'deposit':
        const depositData = transaction.transactions[0];
        if (!depositData) {
          return null;
        }
        return {
          block: {
            id: depositData.blockIdInfo.blockId != '0' ? depositData.blockIdInfo.blockId : null,
            timestamp: depositData.timestamp,
          },
          toAccount: {
            id: depositData.storageInfo.accountId,
            address: depositData.receiverAddress,
          },
          token: {
            symbol: depositData.symbol,
            decimals: tokensData.find((token) => token.tokenId == depositData.storageInfo.tokenId)?.decimals ?? 0,
          },
          fee: depositData.feeAmount,
          amount: depositData.amount,
        };
      case 'nftMint':
        const nftMintData = transaction.mints[0];
        if (!nftMintData) {
          return null;
        }
        return {
          block: {
            id: nftMintData.blockIdInfo.blockId != '0' ? nftMintData.blockIdInfo.blockId : null,
          },
          minter: {
            id: nftMintData.minterId,
            address: nftMintData.minterAddress,
          },
          receiver: {
            address: nftMintData.owner,
          },
          fee: nftMintData.feeAmount,
          feeToken: {
            symbol: nftMintData.feeTokenSymbol,
            decimals: tokensData.find((token) => token.symbol == nftMintData.feeTokenSymbol)?.decimals ?? 0,
          },
          nft: {
            nftData: nftMintData.nftData,
          },
        };
      case 'nftWithdraw':
        const nftWithdrawData = transaction.withdrawals[0];
        if (!nftWithdrawData) {
          return null;
        }
        return {
          block: {
            id: nftWithdrawData.blockIdInfo.blockId != '0' ? nftWithdrawData.blockIdInfo.blockId : null,
            timestamp: nftWithdrawData.updatedAt,
          },
          fromAccount: {
            id: nftWithdrawData.accountId,
            address: nftWithdrawData.owner,
          },
          fee: nftWithdrawData.feeAmount,
          withdrawalNFTFeeToken: {
            symbol: nftWithdrawData.feeTokenSymbol,
            decimals: tokensData.find((token) => token.symbol == nftWithdrawData.feeTokenSymbol)?.decimals ?? 0,
          },
          nfts: [],
        };
      case 'nftTransfer':
        const nftTransferData = transaction.transfers[0];
        if (!nftTransferData) {
          return null;
        }
        return {
          block: {
            id: nftTransferData.blockIdInfo.blockId != '0' ? nftTransferData.blockIdInfo.blockId : null,
            timestamp: nftTransferData.updatedAt,
          },
          fromAccount: {
            id: nftTransferData.accountId,
            address: nftTransferData.owner,
          },
          toAccount: {
            id: nftTransferData.payeeId,
            address: nftTransferData.payeeAddress,
          },
          fee: nftTransferData.feeAmount,
          feeToken: {
            symbol: nftTransferData.feeTokenSymbol,
            decimals: tokensData.find((token) => token.symbol == nftTransferData.feeTokenSymbol)?.decimals ?? 0,
          },
          nfts: [],
        };
      case 'nftTrade':
        return transaction.trades;
      case 'accountUpdate':
        const accountUpdateData = transaction.transactions[0];
        if (!accountUpdateData) {
          return null;
        }
        return {
          user: {
            address: accountUpdateData.senderAddress,
            id: accountUpdateData.storageInfo.accountId,
          },
          feeToken: {
            symbol: accountUpdateData.feeTokenSymbol,
            decimals: tokensData.find((token) => token.symbol == accountUpdateData.feeTokenSymbol)?.decimals ?? 0,
          },
          fee: accountUpdateData.feeAmount,
          __typename: 'AccountUpdate',
        };
    }
  };

  const renderTransactionDetails = (transaction) => {
    const parsedTxData = getParsedTxData(transaction);
    if (!parsedTxData) {
      return <NoTransactionFound />;
    }
    switch (txType) {
      case 'trade':
        return <TradesList trades={parsedTxData} txId={txId} />;
      case 'joinAmm':
        return <Add transaction={transaction} isPending />;
      case 'exitAmm':
        return <Remove transaction={transaction} isPending />;
      case 'transfer':
        return <Transfer transaction={parsedTxData} isPending />;
      case 'withdraw':
        return <Withdrawal transaction={parsedTxData} isPending />;
      case 'deposit':
        return <Deposit transaction={parsedTxData} isPending />;
      case 'nftMint':
        return <MintNFT transaction={parsedTxData} isPending />;
      case 'nftWithdraw':
        return <WithdrawalNFT transaction={parsedTxData} isPending />;
      case 'nftTransfer':
        return <TransferNFT transaction={parsedTxData} isPending />;
      case 'nftTrade':
        return <NFTTradesList trades={parsedTxData} txId={txId} />;
      case 'accountUpdate':
        return <AccountUpdate transaction={parsedTxData} isPending />;
      default:
        return null;
    }
  };

  const isConfirmed =
    confirmedTx &&
    (confirmedTx.transfers.length > 0 ||
      confirmedTx.withdrawals.length > 0 ||
      confirmedTx.adds.length > 0 ||
      confirmedTx.removes.length > 0 ||
      confirmedTx.orderbookTrades.length > 0 ||
      confirmedTx.mintNFTs.length > 0 ||
      confirmedTx.transferNFTs.length > 0 ||
      confirmedTx.tradeNFTs.length > 0 ||
      confirmedTx.accountUpdates.length > 0);

  if (isConfirmed) {
    if (confirmedTx.withdrawals.length > 0) router.replace(`/tx/${confirmedTx.withdrawals[0].id}`);
    if (confirmedTx.transfers.length > 0) router.replace(`/tx/${confirmedTx.transfers[0].id}`);
    if (confirmedTx.adds.length > 0) router.replace(`/tx/${confirmedTx.adds[0].id}`);
    if (confirmedTx.removes.length > 0) router.replace(`/tx/${confirmedTx.removes[0].id}`);
    if (confirmedTx.orderbookTrades.length > 0) router.replace(`/tx/${confirmedTx.orderbookTrades[0].id}`);
    if (confirmedTx.mintNFTs.length > 0) router.replace(`/tx/${confirmedTx.mintNFTs[0].id}`);
    if (confirmedTx.transferNFTs.length > 0) router.replace(`/tx/${confirmedTx.transferNFTs[0].id}`);
    if (confirmedTx.tradeNFTs.length > 0) router.replace(`/tx/${confirmedTx.tradeNFTs[0].id}`);
    if (confirmedTx.accountUpdates.length > 0) router.replace(`/tx/${confirmedTx.accountUpdates[0].id}`);

    return null;
  }

  if (isLoading || !tokensData) {
    return null;
  }

  if (!isLoading && !data) {
    return (
      <div className="text-gray-400 dark:text-white text-2xl h-48 flex items-center justify-center w-full border">
        {<NoTransactionFound />}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-loopring-dark-background rounded p-4">
      <h1 className="text-3xl mb-5 flex items-center">Transaction #{getTrimmedTxHash(txHash, 10, true)}</h1>
      <table className="w-full table-auto table-fixed">
        <tbody>{renderTransactionDetails(data)}</tbody>
      </table>
    </div>
  );
};

export default PendingTransactionFromAPI;
