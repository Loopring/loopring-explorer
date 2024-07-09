import React from 'react';

import getTokenAmount from '../../utils/getTokenAmount';
import { OrderDirection, useAccountTokenBalancesQuery } from '../../generated/loopringExplorer';
import CursorPagination from '../CursorPagination';
import useTokens from '../../hooks/useTokens';
import { useTokenPricesInUSD } from '../../hooks/useTokenPrices';
import { utils } from 'ethers';
import { numberFormat } from '../../utils/numberFormat';

interface Props {
  accountId: string;
}

const AccountTokenBalances: React.FC<Props> = ({ accountId }) => {
  const TOTAL_COUNT = 10;
  const { data: tokensData, isLoading } = useTokens();

  const { data, fetchMore, error, loading } = useAccountTokenBalancesQuery({
    variables: {
      where: {
        account: accountId,
      },
      orderDirection: OrderDirection.Asc,
    },
    fetchPolicy: 'cache-and-network',
  });

  const {prices} = useTokenPricesInUSD()

  if (loading || isLoading) {
    return null;
  }

  if (error) {
    return (
      <div className="text-gray-400 text-2xl h-40 flex items-center justify-center w-full border">
        Couldn't fetch token balances
      </div>
    );
  }

  const accountTokenBalancesWithSymbol = data.accountTokenBalances
    .filter(({ balance }) => balance > 0)
    .map((accountTokenBalance) => {
      const { token } = accountTokenBalance;
      if (token.name && token.symbol) {
        return accountTokenBalance;
      } else {
        const fullTokenData = tokensData.find(({ tokenId }) => parseInt(token.id) === tokenId);
        if (fullTokenData) {
          return {
            ...accountTokenBalance,
            token: {
              ...accountTokenBalance.token,
              name: fullTokenData.name,
              symbol: fullTokenData.symbol,
              decimals: fullTokenData.decimals,
            },
          };
        } else {
          return null;
        }
      }
    });
  
  const totalInUSD = prices
    ? data.accountTokenBalances.reduce((acc, cur) => {
        const tokenPrice = prices.find((price) => price.tokenAddr === cur.token.address).priceInUSD ?? '0';
        const balance = utils.formatUnits(cur.balance, cur.token.decimals);
        return Number(tokenPrice) * Number(balance) + acc;
      }, 0)
    : undefined;

  return (
    <div>
      {accountTokenBalancesWithSymbol.length === 0 ? (
        <div className="text-gray-400 text-2xl h-40 flex items-center justify-center w-full border">
          No token balances to show
        </div>
      ) : (
        <>
          <p  style={{textAlign: 'left', visibility: totalInUSD ? 'visible' : 'hidden', marginBottom: '4px'}}>Value in USD: ${numberFormat(totalInUSD, {fixed: 2, thousandthPlace: true}) }</p>
          <table className="w-full table-auto table-fixed">
            <thead className="text-center bg-loopring-blue border border-loopring-blue dark:border-loopring-dark-darkBlue dark:bg-loopring-dark-darkBlue text-white">
              <tr>
                <th className="p-2">Token</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody className="text-center">
              {accountTokenBalancesWithSymbol.map((accountTokenBalance, index) => {
                if (!accountTokenBalance) {
                  return null;
                }
                const { id, balance, token } = accountTokenBalance;
                return (
                  <tr key={id} className="border rounded dark:border-loopring-dark-background">
                    <td className="p-2 border-b dark:border-loopring-dark-darkBlue dark:text-white">{token.name}</td>
                    <td className="border-b dark:border-loopring-dark-darkBlue dark:text-white">
                      {getTokenAmount(balance, token.decimals)} {token.symbol}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <CursorPagination
            onNextClick={(fetchNext, afterCursor) =>
              fetchNext({
                variables: {
                  where: {
                    account: accountId,
                    id_gt: afterCursor,
                  },
                },
              })
            }
            onPreviousClick={(fetchPrevious, beforeCursor) =>
              fetchPrevious({
                variables: {
                  where: {
                    account: accountId,
                    id_lt: beforeCursor,
                  },
                  orderDirection: OrderDirection.Desc,
                },
                updateQuery(_, data) {
                  return {
                    accountTokenBalances: data.fetchMoreResult.accountTokenBalances.reverse(),
                  };
                },
              })
            }
            data={data}
            dataKey="accountTokenBalances"
            fetchMore={fetchMore}
            totalCount={TOTAL_COUNT}
          />
        </>
      )}
    </div>
  );
};

export default AccountTokenBalances;
