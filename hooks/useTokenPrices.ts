import { useEffect, useState } from 'react';
import { LOOPRING_API } from '../utils/config';

export const useTokenPricesInUSD = () => {
  const [prices, setPrices] = useState<
    {
      tokenAddr: string;
      priceInUSD: string;
    }[]
  >(undefined);
  useEffect(() => {
    fetch(`${LOOPRING_API}datacenter/getLatestTokenPrices`)
      .then((res) => res.json())
      .then((json) => {
        setPrices(
          json.data.map((ele) => {
            return {
              tokenAddr: ele.token,
              priceInUSD: ele.price,
            };
          })
        );
      });
  }, []);

  return {
    prices,
  };
};
