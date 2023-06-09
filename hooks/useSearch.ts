import React from 'react';
import { useBlockQuery, useNonFungibleTokensQuery, useTransactionQuery } from '../generated/loopringExplorer';
import useAccounts from './useAccounts';

const useSearch = (query: string) => {
  const { data: blockData, loading: blockIsLoading } = useBlockQuery({
    variables: {
      id: query,
    },
  });
  const { data: txData, loading: txIsLoading } = useTransactionQuery({
    variables: {
      id: query,
    },
  });
  const { data: accountData, isLoading: accountIsLoading } = useAccounts(query);

  const { data: NFTCollectionData, loading: NFTCollectionLoading } = useNonFungibleTokensQuery({
    fetchPolicy: 'no-cache',
    variables: {
      where: {
        token: query,
      },
      first: 1,
    },
  });  

  const [resultLoaded, setResultLoaded] = React.useState(false);

  const [results, setResults] = React.useState([]);

  React.useEffect(() => {
    setResultLoaded(false);
    setResults([]);
  }, [query]);
  console.log('results', results)

  React.useEffect(() => {
    // debugger
    if (!blockIsLoading && !txIsLoading && !accountIsLoading && !NFTCollectionLoading) {
      const allResults = [];
      if (blockData && blockData.block) {
        allResults.push({
          type: 'block',
          link: `/block/${blockData.block.id}`,
          block: blockData.block,
        });
      }
      if (txData && txData.transaction) {
        allResults.push({
          type: 'tx',
          link: `/tx/${txData.transaction.id}`,
          tx: txData.transaction,
        });
      }
      if (NFTCollectionData && NFTCollectionData.nonFungibleTokens[0]) {
        allResults.push({
          type: 'nftCollection',
          link: `/collections/${NFTCollectionData.nonFungibleTokens[0].token}`,
          nftCollection: NFTCollectionData.nonFungibleTokens[0].token,
        });
      }
      if (accountData && accountData.accounts[0]) {
        allResults.push({
          type: 'account',
          link: `/account/${accountData.accounts[0].id}`,
          account: accountData.accounts[0],
        });
      }
      

      setResults(allResults);
      setResultLoaded(true);
    }
  }, [blockIsLoading, blockData, txIsLoading, txData, accountIsLoading, accountData, NFTCollectionData, NFTCollectionLoading, query]);

  return {
    loaded: resultLoaded,
    results,
  };
};

export default useSearch;
