import { ApolloQueryResult, gql } from "@apollo/client";
import { useCallback, useEffect, useState } from "react";
import client from "../graphql";
import { OrderDirection, useAccountNftSlotsQuery } from "../generated/loopringExplorer";
import { debounce } from "lodash";

const ACCOUNT_NFT_SLOTS = gql`
  query accountNFTSlots($where: AccountNFTSlot_filter, $orderDirection: OrderDirection) {
    accountNFTSlots(orderDirection: $orderDirection, orderBy: id, first: $first, where: $where) {
      id
    }
  }
`;
export const useAccountNFT = (accountId: string) => {
  const SUMMARY = 100;

  const [total, setTotal] = useState<ApolloQueryResult<{accountNFTSlots: {id: string, nftType: number}[]}> | undefined>(undefined)
  useEffect(() => {
    if (!accountId) return
    (async () => {
      const total = await client.query<{accountNFTSlots: {id: string, nftType: number}[]}>({
        query: ACCOUNT_NFT_SLOTS,
        variables: {
          where: {
            account: accountId,
            balance_gt: 0,
          },
          first: SUMMARY,
          orderDirection: OrderDirection.Desc,
        },
      })
      setTotal(total)
    })();
  }, [accountId])
  const [searchInput, setSearchInput] = useState('')
  const debouncedFn = useCallback(debounce(() => {
    refetch()
  }, 500), []);
  const { data, fetchMore, error, loading, refetch } = useAccountNftSlotsQuery({
    variables: {
      where: {
        account: accountId,
        balance_gt: 0,
        ...(
          searchInput
            ? {
              nft_: {
                nftID: searchInput
              }
              
            }
            : {}
        )
      },
      orderDirection: OrderDirection.Desc,
    },
    fetchPolicy: 'cache-and-network',
  });
  return {total, loading, error,data, fetchMore, debouncedFn, setSearchInput, searchInput}
}