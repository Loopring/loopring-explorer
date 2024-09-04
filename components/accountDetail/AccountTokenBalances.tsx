import React, { useEffect, useState } from 'react';

import getTokenAmount from '../../utils/getTokenAmount';
import {
  AccountTokenBalance,
  AccountTokenBalancesQuery,
  OrderDirection,
  useAccountTokenBalancesQuery,
} from '../../generated/loopringExplorer';
import CursorPagination from '../CursorPagination';
import useTokens from '../../hooks/useTokens';
import { useTokenPricesInUSD } from '../../hooks/useTokenPrices';
import { utils } from 'ethers';
import { numberFormat } from '../../utils/numberFormat';
import { gql, useQuery } from '@apollo/client';
import { EXPLORER_NETWORK } from '../../utils/config';
import { useRouter } from 'next/router';
import { getAccountLayer2Balances, getTokensPrices, getTokens } from '../../utils/accountAPI';
import { isSameEVMAddress } from '../../utils/address';
import Decimal from 'decimal.js';


interface AccountTokenBalancesViewProps {
  accountId: string;
  accountTokenBalancesWithSymbol: {
    token: {
      name: string;
      symbol: string;
      decimals: number;
      __typename?: string;
      id: number;
      address: string;
    };
    __typename: string;
    id: number;
    balance: string;
  }[];
  totalInUSD?: string;
  fetchMore: any;
  TOTAL_COUNT: number;
  data?: AccountTokenBalancesQuery;
  hideBalancesPagination: boolean;
}

const AccountTokenBalancesView: React.FC<AccountTokenBalancesViewProps> = ({
  accountId,
  accountTokenBalancesWithSymbol,
  totalInUSD,
  fetchMore,
  TOTAL_COUNT,
  data,
  hideBalancesPagination,
}) => {
  return (
    <div>
      {accountTokenBalancesWithSymbol.length === 0 ? (
        <div className="text-gray-400 text-2xl h-40 flex items-center justify-center w-full border">
          No token balances to show
        </div>
      ) : (
        <>
          <p style={{ textAlign: 'left', visibility: totalInUSD ? 'visible' : 'hidden', marginBottom: '4px' }}>
            Value in USD: ${numberFormat(totalInUSD, { fixed: 2, thousandthPlace: true })}
          </p>
          <table className="w-full table-auto table-fixed">
            <thead className="text-center bg-loopring-blue border border-loopring-blue dark:border-loopring-dark-darkBlue dark:bg-loopring-dark-darkBlue text-white">
              <tr>
                <th className="p-2">Token</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody className="text-center">
              {accountTokenBalancesWithSymbol.map((accountTokenBalance) => {
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
          {!hideBalancesPagination && (
            <CursorPagination
              data={data}
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
              dataKey="accountTokenBalances"
              fetchMore={fetchMore}
              totalCount={TOTAL_COUNT}
            />
          )}
        </>
      )}
    </div>
  );
};

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

  const { prices } = useTokenPricesInUSD();

  const { data: totalData } = useQuery(
    gql`
      query accountTokenBalances($address: String) {
        accountTokenBalances(orderBy: id, first: 99, where: { account: "${accountId}" }) {
          id
          balance
          token {
            id
            name
            symbol
            decimals
            address
          }
        }
      }
    `,
    { fetchPolicy: 'no-cache' }
  );

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
              id: Number(accountTokenBalance.token.id), // Convert id to number
            },
          };
        } else {
          return null;
        }
      }
    });

  const totalInUSD =
    totalData && prices
      ? totalData.accountTokenBalances.reduce((acc, cur) => {
          const tokenPrice =
            prices.find((price) => price.tokenAddr.toLowerCase() === cur.token.address.toLowerCase())?.priceInUSD ??
            '0';
          const balance = utils.formatUnits(cur.balance, cur.token.decimals);
          return Number(tokenPrice) * Number(balance) + acc;
        }, 0)
      : undefined;

  return (
    <AccountTokenBalancesView
      accountId={accountId}
      accountTokenBalancesWithSymbol={accountTokenBalancesWithSymbol}
      totalInUSD={totalInUSD}
      fetchMore={fetchMore}
      TOTAL_COUNT={TOTAL_COUNT}
      data={data}
      hideBalancesPagination={false}
    />
  );
};

const AccountTokenBalancesTaiko = () => {
  const [state, setState] = useState<{
    balances:
      | {
          token: {
            name: string;
            symbol: string;
            decimals: number;
            __typename?: string;
            id: number;
            address: string;
          };
          __typename: string;
          id: number;
          balance: string;
        }[]
      | undefined;
      totalInUSD: string | undefined
  }>();
  const router = useRouter();
  const rawId = router.query.id;
  const list = (rawId as string)?.split('-');
  const id = list ? list[0] : undefined;
  useEffect(() => {
    (async () => {
      if (id && Number(id)) {
        const accountBalances = await getAccountLayer2Balances(Number(id));
        const tokens = await getTokens()
        const tokenPrices = await getTokensPrices()
        const balances = accountBalances.map(balance => {
          const token = tokens.find(t => t.tokenId === balance.tokenId) 
          return {
            token: {
              name: token.name,
              symbol: token.symbol,
              decimals: 18,
              __typename: 'Token',
              id: token.tokenId,
              address: token.address,
            },
            __typename: 'AccountTokenBalance',
            id: token.tokenId,
            balance: balance.total,
          }
        })
        const totalInUSD = accountBalances.reduce((acc, balance) => {
          const token = tokens.find(t => t.tokenId === balance.tokenId) 
          const tokenPrice = tokenPrices.find(p => isSameEVMAddress(p.token, token.address)) 
          return acc.add(new Decimal(tokenPrice.price).mul(utils.formatUnits(balance.total, token.decimals)))
        }, new Decimal('0')).toString()
        setState({
          balances: balances,
          totalInUSD: totalInUSD
        });
      }
    })();
  }, [id]);
  return (
    <AccountTokenBalancesView
      accountId={id ?? ""}
      accountTokenBalancesWithSymbol={state?.balances ?? []}
      totalInUSD={state?.totalInUSD ?? ""}
      fetchMore={() => {}}
      TOTAL_COUNT={1}
      hideBalancesPagination
    />
  );
};

export default EXPLORER_NETWORK === 'TAIKO' ? AccountTokenBalancesTaiko : AccountTokenBalances;
