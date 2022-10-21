import React from 'react';
import { useRouter } from 'next/router';
import request from 'graphql-request';

import { FETCH_TXS } from '../graphql/queries/transactions';

import TableLoader from '../components/TableLoader';
import AppLink from '../components/AppLink';
import DownloadCSV from '../components/transactionDetail/DownloadCSV';
import TransactionTableDetails from '../components/transactionDetail/TransactionTableDetails';
import getTimeFromNow from '../utils/getTimeFromNow';
import {
  OrderDirection,
  TransactionsQueryVariables,
  TransactionType,
  Transaction_OrderBy,
  useTransactionsQuery,
} from '../generated/loopringExplorer';
import CursorPagination from './CursorPagination';

const Transactions: React.FC<{
  blockIDFilter?: string;
  accountIdFilter?: Array<string>;
  title?: React.ReactNode;
  isPaginated?: boolean;
  totalCount?: number;
  showFilters?: boolean;
}> = ({
  blockIDFilter,
  accountIdFilter,
  title = <h1 className="text-3xl font-bold mb-2 w-1/3">Latest Transactions</h1>,
  isPaginated = true,
  totalCount = 25,
  showFilters = true,
}) => {
  const router = useRouter();
  const [blockId, setBlockId] = React.useState(router.query.block || blockIDFilter);

  const [txType, setTxType] = React.useState((router.query.type as string) || 'all');

  const ENTRIES_PER_PAGE = accountIdFilter || blockIDFilter ? 10 : totalCount;
  const variables: TransactionsQueryVariables = {
    first: ENTRIES_PER_PAGE,
    orderBy: Transaction_OrderBy.InternalId,
    orderDirection: OrderDirection.Desc,
  };

  if (blockIDFilter) {
    variables.where = {
      ...variables.where,
      block: blockIDFilter,
    };
  }
  if (blockId) {
    variables.where = {
      ...variables.where,
      block: blockId as string,
    };
  }
  if (accountIdFilter) {
    variables.where = {
      ...variables.where,
      accounts_contains: accountIdFilter,
    };
  }
  if (txType && txType !== 'all') {
    variables.where = {
      ...variables.where,
      typename: TransactionType[txType],
    };
  }

  const { data, error, loading, fetchMore } = useTransactionsQuery({
    variables,
    fetchPolicy: 'cache-and-network',
  });

  React.useEffect(() => {
    if (router.query && router.query.block) {
      setBlockId(router.query.block);
    } else if (!blockIDFilter) {
      setBlockId(undefined);
    }
    if (router.query && router.query.type) {
      setTxType(router.query.type as string);
    }
  }, [router.query]);

  const submitHandler: React.FormEventHandler<HTMLFormElement> = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { block, txType: txTypeInput } = event.currentTarget;

    if (block) {
      if (block.value !== '') {
        router.push(
          {
            pathname: router.pathname,
            query: { ...router.query, block: block.value },
          },
          undefined,
          {
            shallow: true,
          }
        );
      } else {
        const { block, ...restQuery } = router.query;
        router.push({ pathname: router.pathname, query: { ...restQuery } }, undefined, {
          shallow: true,
        });
      }
    }

    if (txTypeInput && txTypeInput.value !== txType) {
      // if used on the block detail page
      router.push(
        {
          pathname: router.pathname,
          query: { ...router.query, type: txTypeInput.value },
        },
        undefined,
        {
          shallow: true,
        }
      );
    }
  };

  const getTransactionType = (type) => {
    switch (type) {
      case 'Add':
        return 'Amm Join';
      case 'Remove':
        return 'Amm Exit';
      case 'OrderbookTrade':
        return 'Trade';
      default:
        return type;
    }
  };

  return (
    <div className={`bg-white dark:bg-loopring-dark-background rounded min-h-table`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between">
        {title}
        {showFilters && (
          <form
            className="my-2 flex flex-col lg:flex-row justify-end items-end lg:items-center flex-1"
            onSubmit={submitHandler}
          >
            <select className="h-9 rounded-sm px-2 border w-full lg:w-1/4 mb-2 lg:mb-0 lg:mr-2" name="txType">
              <option value="all" selected={txType === 'all'}>
                All Transactions
              </option>
              <option value="Deposit" selected={txType === 'Deposit'}>
                Deposit
              </option>
              <option value="Withdrawal" selected={txType === 'Withdrawal'}>
                Withdrawal
              </option>
              <option value="Swap" selected={txType === 'Swap'}>
                Swap
              </option>
              <option value="Add" selected={txType === 'Add'}>
                Amm Join
              </option>
              <option value="Remove" selected={txType === 'Remove'}>
                Amm Exit
              </option>
              <option value="OrderbookTrade" selected={txType === 'OrderbookTrade'}>
                Trade
              </option>
              <option value="Transfer" selected={txType === 'Transfer'}>
                Transfer
              </option>
              <option value="MintNft" selected={txType === 'MintNft'}>
                NFT Mint
              </option>
              <option value="WithdrawalNft" selected={txType === 'WithdrawalNft'}>
                NFT Withdrawal
              </option>
              <option value="TransferNft" selected={txType === 'TransferNft'}>
                NFT Transfer
              </option>
              <option value="TradeNft" selected={txType === 'TradeNft'}>
                NFT Trade
              </option>
              <option value="DataNft" selected={txType === 'DataNft'}>
                NFT Data
              </option>
              <option value="AccountUpdate" selected={txType === 'AccountUpdate'}>
                AccountUpdate
              </option>
              <option value="AmmUpdate" selected={txType === 'AmmUpdate'}>
                AmmUpdate
              </option>
              <option value="SignatureVerification" selected={txType === 'SignatureVerification'}>
                SignatureVerification
              </option>
            </select>
            {!blockIDFilter && !accountIdFilter && (
              <input
                type="text"
                className="h-9 rounded-sm px-1 border w-full lg:w-2/5 mb-2 lg:mb-0 placeholder-loopring-lightBlue placeholder-opacity-70"
                placeholder="Filter by block"
                name="block"
                defaultValue={blockId}
              />
            )}
            <button
              type="submit"
              className="bg-loopring-darkBlue dark:bg-loopring-dark-blue px-6 ml-2 rounded text-white h-9"
            >
              Filter
            </button>
          </form>
        )}
      </div>
      <div className="w-full overflow-auto">
        <table className="table-auto w-full border-collapse">
          <thead className="bg-loopring-blue border border-loopring-blue dark:border-loopring-dark-darkBlue dark:bg-loopring-dark-darkBlue text-white">
            <tr>
              <th className="p-2 whitespace-nowrap">Tx ID</th>
              <th className="p-2 whitespace-nowrap">Type</th>
              <th className="p-2 whitespace-nowrap">From</th>
              <th className="p-2 whitespace-nowrap">To</th>
              <th className="p-2 whitespace-nowrap">Amount</th>
              <th className="p-2 whitespace-nowrap">Fee</th>
              <th className="p-2 whitespace-nowrap">Verified</th>
            </tr>
          </thead>
          <tbody className="text-center">
            {data &&
              data.transactions.map((tx) => {
                return (
                  <tr className="border dark:border-loopring-dark-background" key={tx.id}>
                    <td className="p-2 border-b dark:border-loopring-dark-darkBlue whitespace-nowrap dark:text-white">
                      <AppLink path="transaction" tx={tx.id}>
                        {tx.id}
                      </AppLink>
                    </td>
                    <td className="p-2 border-b dark:border-loopring-dark-darkBlue whitespace-nowrap dark:text-white">
                      {getTransactionType(tx.__typename)}
                    </td>
                    <TransactionTableDetails
                      tx={tx}
                      type={tx.__typename}
                      cellClassName="p-2 border-b dark:border-loopring-dark-darkBlue whitespace-nowrap dark:text-white"
                    />
                    <td className="p-2 border-b dark:border-loopring-dark-darkBlue whitespace-nowrap dark:text-white">
                      {getTimeFromNow(tx.block.timestamp)}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      {data && data.transactions.length === 0 && (
        <div className="text-gray-400 text-2xl h-40 flex items-center justify-center w-full border">
          No transactions to show
        </div>
      )}
      {loading && <TableLoader rows={ENTRIES_PER_PAGE} columns={6} />}
      {error && (
        <div className="h-40 flex items-center justify-center text-red-400 text-xl">Couldn't fetch transactions</div>
      )}
      <div className="flex flex-col lg:flex-row w-full relative">
        {accountIdFilter ? <DownloadCSV accountIdFilter={accountIdFilter} /> : <span />}
        {isPaginated && (
          <div className="flex-1">
            <CursorPagination
              key={(accountIdFilter && accountIdFilter[0]) ?? blockIDFilter}
              onNextClick={(fetchNext, afterCursor) =>
                fetchNext({
                  variables: {
                    where: {
                      ...variables.where,
                      internalID_lt: afterCursor,
                    },
                  },
                })
              }
              onPreviousClick={(fetchPrevious, beforeCursor) =>
                fetchPrevious({
                  variables: {
                    where: {
                      ...variables.where,
                      internalID_gt: beforeCursor,
                    },
                    orderDirection: OrderDirection.Asc,
                  },
                  updateQuery(_, data) {
                    return {
                      transactions: data.fetchMoreResult.transactions.reverse(),
                    };
                  },
                })
              }
              data={data}
              dataKey="transactions"
              fetchMore={fetchMore}
              totalCount={ENTRIES_PER_PAGE}
              orderBy="internalID"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
