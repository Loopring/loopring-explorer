import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { GetServerSideProps } from 'next';

import client from '../graphql';
import { FETCH_NETWORK_STATS } from '../graphql/queries/home';

import Blocks, { BlocksTable } from '../components/Blocks';
import Pairs from '../components/Pairs';
import Transactions, { TransactionsTable } from '../components/Transactions';
import NetworkStats, { NetworkStatsProps } from '../components/NetworkStats';
import { useNetworkStatsQuery } from '../generated/loopringExplorer';
import { EXPLORER_CONFIG, EXPLORER_NETWORK } from '../utils/config';
import { Block, convertTransactionData, getBlock, getLatestBlock, mapLoopringTransactionToGraphStructure } from '../utils/transaction';
import { range, sortBy } from 'lodash';

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const res = await client.query({ query: FETCH_NETWORK_STATS });

    return {
      props: { networkStats: res.data },
    };
  } catch (error) {
    console.log(error);
    return { props: { networkStats: null } };
  }
};

interface HomeContentProps {
  networkStats: NetworkStatsProps;
}

const HomeContent: React.FC<HomeContentProps> = ({ networkStats }) => {
  return (
    <div className="mt-10 w-11/12 m-auto">
      <NetworkStats {...networkStats} />
      <div className="w-full mt-8 flex flex-col justify-between">
        <h2 className="text-2xl font-bold p-2 text-loopring-blue dark:text-loopring-dark-gray">Latest Blocks</h2>
        <Blocks isPaginated={false} blocksCount={10} />
        <Link href="/blocks">
          <a className="bg-loopring-darkBlue dark:bg-loopring-dark-blue text-white text-center block rounded-lg py-2 px-6 w-2/3 lg:w-auto m-auto lg:mx-0 mt-5 lg:self-end">
            View More Blocks
          </a>
        </Link>
      </div>
      <div className="w-full mt-8 flex flex-col justify-between">
        <Transactions
          title={
            <h2 className="text-2xl font-bold p-2 text-loopring-blue dark:text-loopring-dark-gray">
              Latest Transactions
            </h2>
          }
          isPaginated={false}
          totalCount={10}
          showFilters={false}
        />
        <Link href="/transactions">
          <a className="bg-loopring-darkBlue dark:bg-loopring-dark-blue text-white text-center block rounded-lg py-2 px-6 w-2/3 lg:w-auto m-auto lg:mx-0 mt-5 mb-6  lg:self-end">
            View More Transactions
          </a>
        </Link>
      </div>
      {EXPLORER_CONFIG.SHOW_MAIN_PAGE_PARIS && (
        <div className="w-full mt-8 flex flex-col justify-between">
          <h2 className="text-2xl font-bold p-2 text-loopring-blue dark:text-loopring-dark-gray">Pairs</h2>
          <Pairs isPaginated={false} />
          <Link href="/pairs">
            <a className="bg-loopring-darkBlue dark:bg-loopring-dark-blue text-white text-center block rounded-lg py-2 px-6 w-2/3 lg:w-auto m-auto lg:mx-0 mt-5 mb-6  lg:self-end">
              View More Pairs
            </a>
          </Link>
        </div>
      )}
    </div>
  );
};

const HomeTaiko = () => {
  const [state, setState] = useState({
    blocks: undefined as Block[] | undefined,
    latestBlockTxs: undefined as any[] | undefined,
  });
  useEffect(() => {
    (async () => {
      const latestBlock = await getLatestBlock();
      mapLoopringTransactionToGraphStructure(latestBlock.transactions, Math.floor(latestBlock.createdAt / 1000)).then((txs) => {
        setState((state) => ({
          ...state,
          latestBlockTxs: txs,
        }));
      });
      Promise.all(
        range(latestBlock.blockId - 10, latestBlock.blockId).map((blockId) => {
          return getBlock(blockId);
        })
      ).then((blocks) => {
        const sorted = sortBy(blocks.concat(latestBlock), (block) => block.blockId).reverse();
        setState((state) => ({
          ...state,
          blocks: sorted,
        }));
      });
    })();
  }, []);

  const networkStats = state.blocks
    ? {
        networkStats: {
          blockHeight: undefined,
          transactionCount: undefined,
          averageBlockTime: undefined,
          hashRate: undefined,
          difficulty: undefined,
          blocks: state.blocks.map((block) => ({
            hash: block.txHash,
            timestamp: Math.floor(block.createdAt / 1000),
            transactionCount: block.transactions.length.toString(),
          })),
          proxy: {
            blockCount: state.blocks[0].blockId,
            transactionCount: undefined,
            userCount: undefined,
          },
        },
      }
    : undefined;
  return (
    <div className="mt-10 w-11/12 m-auto">
      <NetworkStats {...networkStats} />
      <div className="w-full mt-8 flex flex-col justify-between">
        <h2 className="text-2xl font-bold p-2 text-loopring-blue dark:text-loopring-dark-gray">Latest Blocks</h2>
        <BlocksTable 
          isPaginated={false} 
          blocks={state.blocks?.map(block => {
            return {
              id: block.blockId.toString(),
              txHash: block.txHash,
              blockSize: block.transactions.length,
              timestamp: Math.floor(block.createdAt / 1000),
            }
          }) ?? []}
          loading={state.blocks === undefined}
          error={undefined}
          fetchMore={() => {}}
          TOTAL_COUNT={10}
        />
      </div>
      <div className="w-full mt-8 flex flex-col justify-between">
        <TransactionsTable
          data={state.latestBlockTxs ? {transactions: state.latestBlockTxs} : {transactions: []}}
          loading={state.latestBlockTxs === undefined || state.blocks.length === 0}
          error={undefined}
          fetchMore={() => {}}
          title={
            <h2 className="text-2xl font-bold p-2 text-loopring-blue dark:text-loopring-dark-gray">
              Latest Transactions
            </h2>
          }
          isPaginated={false}
          showFilters={false}
          ENTRIES_PER_PAGE={10}
          account={''}
          blockId={'0'}
          txType={''}
          submitHandler={() => {}}
        />
        <Link href="/transactions">
          <a className="bg-loopring-darkBlue dark:bg-loopring-dark-blue text-white text-center block rounded-lg py-2 px-6 w-2/3 lg:w-auto m-auto lg:mx-0 mt-5 mb-6  lg:self-end">
            View More Transactions
          </a>
        </Link>
      </div>
      {EXPLORER_CONFIG.SHOW_MAIN_PAGE_PARIS && (
        <div className="w-full mt-8 flex flex-col justify-between">
          <h2 className="text-2xl font-bold p-2 text-loopring-blue dark:text-loopring-dark-gray">Pairs</h2>
          <Pairs isPaginated={false} />
          <Link href="/pairs">
            <a className="bg-loopring-darkBlue dark:bg-loopring-dark-blue text-white text-center block rounded-lg py-2 px-6 w-2/3 lg:w-auto m-auto lg:mx-0 mt-5 mb-6  lg:self-end">
              View More Pairs
            </a>
          </Link>
        </div>
      )}
    </div>
  );
};

const HomeEthereum = ({ networkStats }) => {
  const { data: networkStatsData } = useNetworkStatsQuery({
    skip: networkStats,
    fetchPolicy: 'network-only',
  });

  return (
    <div className="mt-10 w-11/12 m-auto">
      <NetworkStats networkStats={networkStats ?? networkStatsData} />
      <div className="w-full mt-8 flex flex-col justify-between">
        <h2 className="text-2xl font-bold p-2 text-loopring-blue dark:text-loopring-dark-gray">Latest Blocks</h2>
        <Blocks isPaginated={false} blocksCount={10} />
        <Link href="/blocks">
          <a className="bg-loopring-darkBlue dark:bg-loopring-dark-blue text-white text-center block rounded-lg py-2 px-6 w-2/3 lg:w-auto m-auto lg:mx-0 mt-5 lg:self-end">
            View More Blocks
          </a>
        </Link>
      </div>
      <div className="w-full mt-8 flex flex-col justify-between">
        <Transactions
          title={
            <h2 className="text-2xl font-bold p-2 text-loopring-blue dark:text-loopring-dark-gray">
              Latest Transactions
            </h2>
          }
          isPaginated={false}
          totalCount={10}
          showFilters={false}
        />
        <Link href="/transactions">
          <a className="bg-loopring-darkBlue dark:bg-loopring-dark-blue text-white text-center block rounded-lg py-2 px-6 w-2/3 lg:w-auto m-auto lg:mx-0 mt-5 mb-6  lg:self-end">
            View More Transactions
          </a>
        </Link>
      </div>
      {EXPLORER_CONFIG.SHOW_MAIN_PAGE_PARIS && (
        <div className="w-full mt-8 flex flex-col justify-between">
          <h2 className="text-2xl font-bold p-2 text-loopring-blue dark:text-loopring-dark-gray">Pairs</h2>
          <Pairs isPaginated={false} />
          <Link href="/pairs">
            <a className="bg-loopring-darkBlue dark:bg-loopring-dark-blue text-white text-center block rounded-lg py-2 px-6 w-2/3 lg:w-auto m-auto lg:mx-0 mt-5 mb-6  lg:self-end">
              View More Pairs
            </a>
          </Link>
        </div>
      )}
    </div>
  );
};
// @ts-ignore
export default EXPLORER_NETWORK === 'ETHEREUM' ? HomeEthereum : HomeTaiko;
