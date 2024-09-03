import React from 'react';

import { apiEndpointByTxType, EXPLORER_CONFIG } from '../utils/config';

const getQueryParamName = (txType) => {
  switch (txType) {
    case 'trade':
      return 'orderHash';
    case 'nftTrade':
      return 'tradeHash';
    case 'accountUpdate':
      return 'types=change_password&hashes';
    default:
      return 'hashes';
  }
};

const usePendingTransactionData = (txType, txHash) => {
  const [data, setData] = React.useState<object>();

  React.useEffect(() => {
    (async () => {
      try {
        const endpoint = `${EXPLORER_CONFIG.LOOPRING_API}${apiEndpointByTxType[txType]}?${getQueryParamName(
          txType
        )}=${txHash}&accountId=0`;
        const res = await fetch(endpoint).then((res) => res.json());
        setData(res);
      } catch (error) {
        console.log(error);
      }
    })();
  }, []);

  return {
    data,
    isLoading: !data,
  };
};

export default usePendingTransactionData;
