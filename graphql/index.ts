import { ApolloClient, InMemoryCache, HttpLink, split, ApolloLink } from '@apollo/client';
import { LOOPRING_SUBGRAPH, UNISWAP_SUBGRAPH } from '../utils/config';

const loopringLink = new HttpLink({
  uri: LOOPRING_SUBGRAPH
});

const mapBody = new ApolloLink((operation, forward) => {
  return forward(operation).map(response => {
    return {
      ...response,
      data: {
        ...response.data,
        // @ts-ignore
        ...JSON.parse(response.data).data 
      }
    }
  });
});

const uniswapLink = new HttpLink({
  uri: UNISWAP_SUBGRAPH,
});

const client = new ApolloClient({
  link: split((op) => op.getContext().protocol === 'uniswap', uniswapLink, mapBody.concat(loopringLink)),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          accountTokenBalances: {
            keyArgs: false,
          },
          accountNFTSlots: {
            keyArgs: false,
          },
          blocks: {
            keyArgs: false,
          },
          pairs: {
            keyArgs: false,
          },
          transactions: {
            keyArgs: false,
          },
          swaps: {
            keyArgs: false,
          },
          orderbookTrades: {
            keyArgs: false,
          },
          transactionNFTs: {
            keyArgs: false,
          },
          nonFungibleTokens: {
            keyArgs: false,
          },
        },
      },
    },
    possibleTypes: {
      Account: ['User', 'Pool', 'ProtocolAccount'],
    },
  }),
});

export default client;
