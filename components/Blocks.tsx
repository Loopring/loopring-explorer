import React from 'react';

import TableLoader from '../components/TableLoader';
import AppLink from '../components/AppLink';
import CursorPagination from '../components/CursorPagination';
import { OrderDirection, useBlocksQuery } from '../generated/loopringExplorer';

import getTimeFromNow from '../utils/getTimeFromNow';
import getTrimmedTxHash from '../utils/getTrimmedTxHash';


interface Block {
  id: string;
  txHash: string;
  blockSize: number;
  timestamp: number;
}

interface BlocksTableProps {
  blocks: Block[];
  loading: boolean;
  error: any;
  isPaginated: boolean;
  fetchMore: any;
  TOTAL_COUNT: number;
}

export const BlocksTable: React.FC<BlocksTableProps> = ({ blocks, loading, error, isPaginated, fetchMore, TOTAL_COUNT }) => {
  return (
    <div className="bg-white dark:bg-loopring-dark-background rounded min-h-table">
      <div className="w-full overflow-auto">
        <table className="table-auto w-full border-collapse">
          <thead className="bg-loopring-blue border border-loopring-blue dark:border-loopring-dark-darkBlue text-white text-center dark:bg-loopring-dark-darkBlue">
            <tr>
              <th className="p-2 whitespace-nowrap">Block ID</th>
              <th className="p-2 whitespace-nowrap">L1 Tx</th>
              <th className="p-2 whitespace-nowrap">Size</th>
              <th className="p-2 whitespace-nowrap">Verified At</th>
            </tr>
          </thead>
          <tbody className="text-center">
            {blocks.map((block) => (
              <tr key={block.id} className="border dark:border-loopring-dark-background ml-2">
                <td className="p-2 border-b dark:border-loopring-dark-darkBlue whitespace-nowrap">
                  <AppLink path="block" block={block.id}>
                    {block.id}
                  </AppLink>
                </td>
                <td className="p-2 border-b dark:border-loopring-dark-darkBlue whitespace-nowrap">
                  <AppLink path="transaction" tx={block.txHash} isExplorerLink>
                    {getTrimmedTxHash(block.txHash, 15)}
                  </AppLink>
                </td>
                <td className="p-2 border-b dark:border-loopring-dark-darkBlue text-loopring-gray dark:text-white whitespace-nowrap">
                  {block.blockSize}
                </td>
                <td className="p-2 border-b dark:border-loopring-dark-darkBlue text-loopring-gray dark:text-white whitespace-nowrap">
                  {getTimeFromNow(block.timestamp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {blocks.length === 0 && (
        <div className="text-gray-400 dark:text-white dark:text-loopring-dark-gray text-2xl h-40 flex items-center justify-center w-full border">
          No blocks to show
        </div>
      )}
      {loading && <TableLoader rows={TOTAL_COUNT} />}
      {error && <div className="h-40 flex items-center justify-center text-red-400 text-xl">Couldn't fetch blocks</div>}
      {isPaginated && (
        <CursorPagination
          onNextClick={(fetchNext, afterCursor) =>
            fetchNext({
              variables: {
                where: {
                  internalID_lt: afterCursor,
                },
                orderDirection: OrderDirection.Desc,
              },
            })
          }
          onPreviousClick={(fetchPrevious, beforeCursor) =>
            fetchPrevious({
              variables: {
                where: {
                  internalID_gt: beforeCursor,
                },
                orderDirection: OrderDirection.Asc,
              },
              updateQuery(_, data) {
                return {
                  blocks: data.fetchMoreResult.blocks.reverse(),
                };
              },
            })
          }
          data={{ blocks }}
          dataKey="blocks"
          fetchMore={fetchMore}
        />
      )}
    </div>
  );
};

interface BlocksProps {
  blocksCount?: number;
  isPaginated?: boolean;
}

const Blocks: React.FC<BlocksProps> = ({ blocksCount = 25, isPaginated = true }) => {
  const TOTAL_COUNT = blocksCount;
  const { data, error, loading, fetchMore } = useBlocksQuery({
    variables: {
      first: TOTAL_COUNT,
      orderDirection: OrderDirection.Desc,
    },
    fetchPolicy: 'cache-and-network',
  });

  return (
    <BlocksTable
      blocks={data ? data.blocks : []}
      loading={loading}
      error={error}
      isPaginated={isPaginated}
      fetchMore={fetchMore}
      TOTAL_COUNT={TOTAL_COUNT}
    />
  );
};

export default Blocks;
