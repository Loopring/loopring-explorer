import { ApolloClient, InMemoryCache } from '@apollo/client';
import { LOOPRING_SUBGRAPH } from '../utils/config';

const client = new ApolloClient({
  uri: LOOPRING_SUBGRAPH,
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
