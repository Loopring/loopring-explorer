import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

import getDateString from '../../utils/getDateString';
import AppLink from '../../components/AppLink';
import Transactions, { TransactionsTable } from '../../components/Transactions';
import getTrimmedTxHash from '../../utils/getTrimmedTxHash';
import { useBlockQuery } from '../../generated/loopringExplorer';
import { EXPLORER_CONFIG, EXPLORER_NETWORK } from '../../utils/config';
import { getBlock, mapLoopringTransactionToGraphStructure } from '../../utils/transaction';

interface BlockData {
  proxy: {
    blockCount: number;
  };
  block: {
    blockHash: string;
    blockSize: number;
    txHash: string;
    timestamp: number;
    operatorAccount: {
      id: string;
      address: string;
    };
    data: string;
    transactions: any[];
  };
}

interface BlockViewProps {
  blockId: string;
  blockIdInt: number | null;
  blockCount: number | null;
  data: BlockData;
  loading: boolean;
}


const Block: React.FC<{}> = () => {
  const router = useRouter();
  const blockId = router.query.id;
  const { data, error, loading } = useBlockQuery({
    variables: {
      id: blockId as string,
    },
  });

  const blockCount = data ? data.proxy.blockCount : null;
  const blockIdInt = blockId ? parseInt(blockId as string) : null;

  return (
    <div className="bg-white dark:bg-loopring-dark-background rounded p-4">
      <h1 className="text-3xl mb-5 flex items-center">
        Block #{blockId}
        {blockIdInt && blockIdInt > 1 && (
          <Link href={`/block/${blockIdInt - 1}`}>
            <a className="text-sm bg-loopring-lightBlue px-2 text-white relative h-5 rounded ml-2">‹</a>
          </Link>
        )}
        {blockCount && blockIdInt && blockIdInt < blockCount && (
          <Link href={`/block/${blockIdInt + 1}`}>
            <a className="text-sm bg-loopring-lightBlue px-2 text-white relative h-5 rounded ml-2">›</a>
          </Link>
        )}
      </h1>
      <div className="border dark:border-loopring-dark-darkBlue rounded w-full mb-10">
        {data && data.block && (
          <table className="w-full table-auto table-fixed">
            <tbody>
              <tr className="border dark:border-loopring-dark-darkBlue">
                <td className="p-2 lg:w-1/5">Block Hash</td>
                <td className="break-all">{data.block.blockHash}</td>
              </tr>
              <tr className="border dark:border-loopring-dark-darkBlue">
                <td className="p-2">Block Size</td>
                <td>{data.block.blockSize}</td>
              </tr>
              <tr className="border dark:border-loopring-dark-darkBlue">
                <td className="p-2">L1 Transaction Hash</td>
                <td className="break-all">
                  <AppLink path="transaction" isExplorerLink tx={data.block.txHash}>
                    <span className="hidden lg:block">{data.block.txHash}</span>
                    <span className="lg:hidden">
                      {data.block.txHash ? getTrimmedTxHash(data.block.txHash, 10) : '--'}
                    </span>
                  </AppLink>
                </td>
              </tr>
              <tr className="border dark:border-loopring-dark-darkBlue">
                <td className="p-2">Verified at</td>
                <td>{getDateString(data.block.timestamp)}</td>
              </tr>
              <tr className="border dark:border-loopring-dark-darkBlue">
                <td className="p-2">Operator Address</td>
                <td className="break-all">
                  <AppLink path="account" accountId={data.block.operatorAccount.id}>
                    <span className="hidden lg:block">{data.block.operatorAccount.address}</span>
                    <span className="lg:hidden">
                      {data.block.operatorAccount.address
                        ? getTrimmedTxHash(data.block.operatorAccount.address, 10, true)
                        : '--'}
                    </span>
                  </AppLink>
                </td>
              </tr>
              <tr className="border dark:border-loopring-dark-darkBlue">
                <td className="p-2">Raw Data</td>
                <td>
                  <div className="break-all bg-gray-100 dark:bg-loopring-dark-darkBlue h-32 overflow-auto m-2 rounded p-2 text-gray-500">
                    {data.block.data}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
      {data && data.block && (
        <div className="p-4">
          <Transactions
            blockIDFilter={blockId as string}
            title={<h2 className="text-2xl font-semibold">Transactions in block #{blockId}</h2>}
            showFilters={true}
          />
        </div>
      )}
      {data && !loading && !data.block && (
        <div className="text-gray-400 text-2xl h-40 flex items-center justify-center w-full border">No block found</div>
      )}
    </div>
  );
};

const BlockTaiko: React.FC<{}> = () => {
  const router = useRouter();
  const blockId = router.query.id;
  const blockIdInt = blockId ? parseInt(blockId as string) : null;

  const [state, setState] = useState<BlockData | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const blockIdInt = blockId ? parseInt(blockId as string) : null;
      if (blockIdInt) {
        setState(undefined);
        const block = await getBlock(blockIdInt);
        const txs = await mapLoopringTransactionToGraphStructure(block.transactions);

        setState({
          proxy: {
            blockCount: block.transactions.length,
          },
          block: {
            blockHash: undefined,
            blockSize: block.transactions.length,
            txHash: block.txHash,
            timestamp: Math.floor(block.createdAt / 1000),
            operatorAccount: {
              id: '',
              address: '',
            },
            data: '',
            transactions: txs,
          },
        });
      }
    })();
  }, [blockId]);

  const blockCount = state?.proxy.blockCount;
  const data = state;
  const loading = state === undefined;

  return (
    <div className="bg-white dark:bg-loopring-dark-background rounded p-4">
      <h1 className="text-3xl mb-5 flex items-center">
        Block #{blockId}
        {blockIdInt && blockIdInt > 1 && (
          <Link href={`/block/${blockIdInt - 1}`}>
            <a className="text-sm bg-loopring-lightBlue px-2 text-white relative h-5 rounded ml-2">‹</a>
          </Link>
        )}
        {blockCount && blockIdInt && blockIdInt < blockCount && (
          <Link href={`/block/${blockIdInt + 1}`}>
            <a className="text-sm bg-loopring-lightBlue px-2 text-white relative h-5 rounded ml-2">›</a>
          </Link>
        )}
      </h1>
      <div className="border dark:border-loopring-dark-darkBlue rounded w-full mb-10">
        {data && data.block && (
          <table className="w-full table-auto table-fixed">
            <tbody>
              <tr className="border dark:border-loopring-dark-darkBlue">
                <td className="p-2 lg:w-1/5">Block Hash</td>
                <td className="break-all">{data.block.blockHash}</td>
              </tr>
              <tr className="border dark:border-loopring-dark-darkBlue">
                <td className="p-2">Block Size</td>
                <td>{data.block.blockSize}</td>
              </tr>
              <tr className="border dark:border-loopring-dark-darkBlue">
                <td className="p-2">L1 Transaction Hash</td>
                <td className="break-all">
                  <AppLink path="transaction" isExplorerLink tx={data.block.txHash}>
                    <span className="hidden lg:block">{data.block.txHash}</span>
                    <span className="lg:hidden">
                      {data.block.txHash ? getTrimmedTxHash(data.block.txHash, 10) : '--'}
                    </span>
                  </AppLink>
                </td>
              </tr>
              <tr className="border dark:border-loopring-dark-darkBlue">
                <td className="p-2">Verified at</td>
                <td>{getDateString(data.block.timestamp)}</td>
              </tr>
              <tr className="border dark:border-loopring-dark-darkBlue">
                <td className="p-2">Operator Address</td>
                <td className="break-all">
                  <AppLink path="account" accountId={data.block.operatorAccount.id}>
                    <span className="hidden lg:block">{data.block.operatorAccount.address}</span>
                    <span className="lg:hidden">
                      {data.block.operatorAccount.address
                        ? getTrimmedTxHash(data.block.operatorAccount.address, 10, true)
                        : '--'}
                    </span>
                  </AppLink>
                </td>
              </tr>
              <tr className="border dark:border-loopring-dark-darkBlue">
                <td className="p-2">Raw Data</td>
                <td>
                  <div className="break-all bg-gray-100 dark:bg-loopring-dark-darkBlue h-32 overflow-auto m-2 rounded p-2 text-gray-500">
                    {data.block.data}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
      {data && data.block && (
        <div className="p-4">
          <TransactionsTable
            data={{ transactions: state.block.transactions }}
            loading={state === undefined || state.block.transactions.length === 0}
            error={undefined}
            fetchMore={() => {}}
            title={<h2 className="text-2xl font-semibold">Transactions in block #{blockId}</h2>}
            isPaginated={false}
            showFilters={false}
            ENTRIES_PER_PAGE={10}
            account={''}
            blockId={'0'}
            txType={''}
            submitHandler={() => {}}
          />
        </div>
      )}
      {data && !loading && !data.block && (
        <div className="text-gray-400 text-2xl h-40 flex items-center justify-center w-full border">No block found</div>
      )}
    </div>
  );
};

export default EXPLORER_NETWORK === 'TAIKO' ? BlockTaiko : Block;
