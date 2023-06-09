import React from 'react';
import { useRouter } from 'next/router';

import TableLoader from '../../components/TableLoader';
import AppLink from '../../components/AppLink';
import TransactionTableDetails from '../../components/transactionDetail/TransactionTableDetails';
import getTimeFromNow from '../../utils/getTimeFromNow';
import { OrderDirection, useTransactionNfTsQuery } from '../../generated/loopringExplorer';
import CursorPagination from '../CursorPagination';

const NFTTransactions: React.FC<{ nftId: string }> = ({ nftId }) => {
  const router = useRouter();

  const [txType, setTxType] = React.useState((router.query.type as string) || 'all');

  const ENTRIES_PER_PAGE = 10;
  const variables = {
    orderDirection: OrderDirection.Desc,
    where: {},
  };
  if (nftId) {
    variables.where = {
      ...variables.where,
      nfts_contains: [nftId],
    };
  }
  if (txType && txType !== 'all') {
    variables.where = {
      ...variables.where,
      typename: txType,
    };
  }
  const { data, error, loading, fetchMore } = useTransactionNfTsQuery({
    fetchPolicy: 'no-cache',
    variables,
  });

  React.useEffect(() => {
    if (router.query && router.query.type) {
      setTxType(router.query.type as string);
    }
  }, [router.query]);

  const submitHandler: React.FormEventHandler<HTMLFormElement> = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { txType: txTypeInput } = event.currentTarget;

    if (txTypeInput && txTypeInput.value !== txType) {
      // if used on the block detail page
      router.push(
        {
          pathname: router.pathname,
          query: { ...router.query, type: txTypeInput.value, page: 1 },
        },
        undefined,
        {
          shallow: true,
        }
      );
    }
  };

  return (
    <div className={`bg-white dark:bg-loopring-dark-background pt-12 rounded min-h-table`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between">
        <h2 className="text-2xl font-bold">Trading History</h2>
        <form className="my-2 flex flex-col lg:flex-row justify-end items-end lg:items-center" onSubmit={submitHandler}>
          <select className="h-9 rounded-sm px-2 border w-full mb-2 lg:mb-0 lg:mr-2" name="txType">
            <option value="all" selected={txType === 'all'}>
              All Transactions
            </option>
            <option value="MintNFT" selected={txType === 'MintNFT'}>
              NFT Mint
            </option>
            <option value="WithdrawalNFT" selected={txType === 'WithdrawalNFT'}>
              NFT Withdrawal
            </option>
            <option value="TransferNFT" selected={txType === 'TransferNFT'}>
              NFT Transfer
            </option>
            <option value="TradeNFT" selected={txType === 'TradeNFT'}>
              NFT Trade
            </option>
            <option value="DataNFT" selected={txType === 'DataNFT'}>
              NFT Data
            </option>
          </select>
          <button
            type="submit"
            className="bg-loopring-darkBlue dark:bg-loopring-dark-blue px-6 ml-2 rounded text-white h-9"
          >
            Filter
          </button>
        </form>
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
              data.transactionNFTs.map((tx) => {
                return (
                  <tr className="border dark:border-loopring-dark-background" key={tx.id}>
                    <td className="p-2 border-b dark:border-loopring-dark-darkBlue whitespace-nowrap dark:text-white">
                      <AppLink path="transaction" tx={tx.id}>
                        {tx.id}
                      </AppLink>
                    </td>
                    <td className="p-2 border-b dark:border-loopring-dark-darkBlue whitespace-nowrap dark:text-white">
                      {tx.__typename}
                    </td>
                    <TransactionTableDetails
                      tx={tx}
                      type={tx.__typename}
                      cellClassName="p-2 border-b dark:border-loopring-dark-darkBlue whitespace-nowrap dark:text-white"
                      account="none"
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
      {data && data.transactionNFTs.length === 0 && (
        <div className="text-gray-400 text-2xl h-40 flex items-center justify-center w-full border">
          No transactions to show
        </div>
      )}
      {loading && <TableLoader rows={ENTRIES_PER_PAGE} columns={6} />}
      {error && (
        <div className="h-40 flex items-center justify-center text-red-400 text-xl">Couldn't fetch transactions</div>
      )}
      <div className="flex flex-col lg:flex-row justify-center w-full">
        <CursorPagination
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
                  transactionNFTs: data.fetchMoreResult.transactionNFTs.reverse(),
                };
              },
            })
          }
          data={data}
          dataKey="transactionNFTs"
          fetchMore={fetchMore}
          totalCount={ENTRIES_PER_PAGE}
          orderBy="internalID"
        />
      </div>
    </div>
  );
};

export default NFTTransactions;
