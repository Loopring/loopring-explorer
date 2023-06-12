import { ApolloQueryResult, gql } from "@apollo/client";
import { useCallback, useEffect, useState } from "react";
import client from "../graphql";
import { OrderDirection, useAccountNftSlotsQuery } from "../generated/loopringExplorer";
import { debounce } from "lodash";
import useDebounce from "./useDebounce";

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
        fetchPolicy: 'no-cache',
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
  const debouncedSearchTerm = useDebounce(searchInput, 500);
  const callBack = useCallback((searchInput: string) => {
    (async () => {
      console.log('debouncedFn')
      refetch()
      const total = await client.query<{ accountNFTSlots: { id: string, nftType: number }[] }>({
        fetchPolicy: 'no-cache',
        query: ACCOUNT_NFT_SLOTS,
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
          first: SUMMARY,
          orderDirection: OrderDirection.Desc,
        },
      })
      setTotal(total)
    })()
  }, []);
  useEffect(() => {
    callBack(debouncedSearchTerm)
  }, [debouncedSearchTerm])
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
    fetchPolicy: 'no-cache',
  });
  return {total, loading, error,data, fetchMore, setSearchInput, searchInput}
}