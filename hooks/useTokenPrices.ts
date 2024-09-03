import { useEffect, useState } from 'react';
import { EXPLORER_CONFIG } from '../utils/config';

export const useTokenPricesInUSD = () => {
  const [prices, setPrices] = useState<
    {
      tokenAddr: string;
      priceInUSD: string;
    }[]
  >(undefined);
  useEffect(() => {
    fetch(`${EXPLORER_CONFIG.LOOPRING_API}datacenter/getLatestTokenPrices`)
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
