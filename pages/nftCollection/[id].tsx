import React from 'react';
import { useRouter } from 'next/router';
import numeral from 'numeral';
import { ResponsiveContainer, Tooltip, XAxis, Bar, BarChart } from 'recharts';

import useTokenUSDPrice from '../../hooks/useTokenUSDPrice';
import getTokenAmount from '../../utils/getTokenAmount';
import getDateString from '../../utils/getDateString';
import Swaps from '../../components/pairDetail/Swaps';
import Trades from '../../components/pairDetail/Trades';
import { usePairQuery } from '../../generated/loopringExplorer';

const NFTCollection: React.FC<{}> = () => {
  const router = useRouter();
  const pairId = router.query.id;
  const [swapPage, setSwapPage] = React.useState<number>(1);
  const [orderbookPage, setOrderbookPage] = React.useState<number>(1);
  const [chart, setChart] = React.useState('swap+orderbook');
  const { data, loading } = usePairQuery({
    variables: {
      id: pairId as string,
      swapSkip: swapPage,
      swapFirst: 10,
      orderbookSkip: orderbookPage,
      orderbookFirst: 10,
    },
  });
  const { price: token0USDPrice } = useTokenUSDPrice(data && (data as any).pair && (data as any).pair.token0);
  const { price: token1USDPrice } = useTokenUSDPrice(data && (data as any).pair && (data as any).pair.token1);
  const dailyVolumeData = React.useMemo(() => {
    if (data && token0USDPrice) {
      const { dailyEntities, token0 } = (data as any).pair;
      const reverseDailyEntities = [...dailyEntities].reverse();
      return reverseDailyEntities.map((dayData) => {
        const { tradedVolumeToken0, tradedVolumeToken0Swap, tradedVolumeToken0Orderbook } = dayData;

        const totalVolume = getTokenAmount(tradedVolumeToken0, token0.decimals) * token0USDPrice;
        const swapVolume = getTokenAmount(tradedVolumeToken0Swap, token0.decimals) * token0USDPrice;
        const orderbookVolume = getTokenAmount(tradedVolumeToken0Orderbook, token0.decimals) * token0USDPrice;

        return {
          date: dayData.dayEnd * 1000,
          totalVolume,
          totalVolumeString: `$${numeral(totalVolume).format('0a')}`,
          swapVolume,
          orderbookVolume,
        };
      });
    } else {
      return [];
    }
  }, [data, token0USDPrice]);

  if ((loading && !data) || !data || (data && !(data as any).pair)) {
    return null;
  }

  const { token0, token1, token0Price, token1Price, swaps, trades, dailyEntities } = (data as any).pair; // need to do this because of TS complaining. Already have a null check above so this should be fine

  return (
    <div className="bg-white dark:bg-loopring-dark-background rounded p-4 m-2">
      asdkjaskhjdksahdkjashdkjsa
      NFT Collection
      {/* <h1 className="text-3xl mb-5">
        {token0.symbol} / {token1.symbol}
      </h1>
      <div className="rounded-md border border-gray-200 lg:inline px-2 py-1">
        1 {token0.symbol} = {getTokenAmount(token0Price, token1.decimals)} {token1.symbol}
      </div>
      <div className="rounded-md border border-gray-200 lg:inline px-2 py-1 mt-2 lg:mt-0 lg:ml-2">
        1 {token1.symbol} = {getTokenAmount(token1Price, token0.decimals)} {token0.symbol}
      </div>

      <div className="flex flex-col lg:flex-row my-4 border dark:border-loopring-dark-darkBlue rounded lg:pr-2 relative">
        <div className="bg-loopring-blue dark:bg-loopring-dark-darkBlue text-white rounded p-4 lg:mr-4 lg:w-2/12">
          <h3 className="text-3xl">Volume (24hrs)</h3>
          <div className="flex flex-col ">
            <span className="mt-4">Swap + Orderbook:</span>
            <span className="text-3xl">
              $
              {token0USDPrice
                ? numeral(getTokenAmount(dailyEntities[0].tradedVolumeToken1, token1.decimals) * token1USDPrice).format(
                    '0a'
                  )
                : ''}
            </span>
          </div>
          <div className="flex flex-col my-3">
            <span>Swap:</span>
            <span className="text-3xl">
              $
              {token0USDPrice
                ? numeral(
                    getTokenAmount(dailyEntities[0].tradedVolumeToken1Swap, token1.decimals) * token1USDPrice
                  ).format('0a')
                : ''}
            </span>
          </div>
          <div className="flex flex-col ">
            <span>Orderbook</span>
            <span className="text-3xl">
              $
              {token0USDPrice
                ? numeral(
                    getTokenAmount(dailyEntities[0].tradedVolumeToken1Orderbook, token1.decimals) * token1USDPrice
                  ).format('0a')
                : ''}
            </span>
          </div>
        </div>

        <div className="absolute right-4 top-72 lg:top-2 z-10">
          <button
            onClick={() => setChart('swap+orderbook')}
            className={`border rounded px-2 py-1 text-sm ${
              chart === 'swap+orderbook'
                ? 'bg-loopring-darkBlue dark:bg-loopring-dark-blue text-white'
                : 'bg-white text-loopring-blue'
            }`}
          >
            Swap + Orderbook
          </button>
          <button
            onClick={() => setChart('swap')}
            className={`border rounded px-2 py-1 text-sm mx-2 ${
              chart === 'swap'
                ? 'bg-loopring-darkBlue dark:bg-loopring-dark-blue text-white'
                : 'bg-white text-loopring-blue'
            }`}
          >
            Swap
          </button>
          <button
            onClick={() => setChart('orderbook')}
            className={`border rounded px-2 py-1 text-sm ${
              chart === 'orderbook'
                ? 'bg-loopring-darkBlue dark:bg-loopring-dark-blue text-white'
                : 'bg-white text-loopring-blue'
            }`}
          >
            Orderbook
          </button>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={dailyVolumeData} margin={{ top: 50, left: 5, right: 5, bottom: 10 }}>
            <XAxis
              dataKey="date"
              tickFormatter={(tick) => `${new Date(tick).getDate()}`}
              interval="preserveStartEnd"
              minTickGap={9}
            />
            <Tooltip
              formatter={(value, name, props) => props.payload.totalVolumeString}
              labelFormatter={(name, props) => {
                return props && props.length > 0
                  ? getDateString(props[0].payload.date, true, false)
                  : getDateString(Date.now(), true, false);
              }}
              itemStyle={{ textTransform: 'capitalize' }}
            />
            <Bar
              dataKey={chart === 'swap' ? 'swapVolume' : chart === 'orderbook' ? 'orderbookVolume' : 'totalVolume'}
              fill="#5076B7"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h3 className="text-2xl font-light mt-5">Swap Transactions</h3>
      <Swaps pairId={pairId as string} token0USDPrice={token0USDPrice} token0={token0.symbol} />
      <h3 className="text-2xl font-light mt-5">Order Book Transactions</h3>
      <Trades pairId={pairId as string} token0USDPrice={token0USDPrice} token0={token0.symbol} /> */}
    </div>
  );
};

export default NFTCollection;
