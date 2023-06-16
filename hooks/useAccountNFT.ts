import { ApolloQueryResult, gql, useQuery } from "@apollo/client";
import { useCallback, useEffect, useState } from "react";
import client from "../graphql";
import { OrderDirection, useAccountNftSlotsQuery } from "../generated/loopringExplorer";
import { debounce } from "lodash";
import useDebounce from "./useDebounce";

const ACCOUNT_NFT_SLOTS = gql`
  query accountNFTSlots($where: AccountNFTSlot_filter, $orderDirection: OrderDirection, $first: number) {
    accountNFTSlots(orderDirection: $orderDirection, orderBy: id, first: $first, where: $where) {
      id
    }
  }
`;

export const useAccountNFT = (accountId: string) => {
  const SUMMARY = 100;
  const [searchInput, setSearchInput] = useState('')
  const [feedSearchInput, setFeedSearchInput] = useState('')
  const { data, fetchMore, error, loading, refetch } = useAccountNftSlotsQuery({
    variables: {
      where: {
        account: accountId,
        balance_gt: 0,
        ...(
          feedSearchInput
            ? {
              nft_: {
                nftID: feedSearchInput
              }
            }
            : {}
        )
      },
      first: 8,
      orderDirection: OrderDirection.Desc,
    },
    fetchPolicy: 'cache-and-network',
  });
  const onClickSearch = useCallback(() => {
    setFeedSearchInput(searchInput)
  }, [searchInput])
  useEffect(() => {
    refetch()
  }, [feedSearchInput])
  const { data: total } = useAccountNftSlotsQuery({
    fetchPolicy: 'no-cache',
    query: ACCOUNT_NFT_SLOTS,
    variables: {
      where: {
        account: accountId,
        balance_gt: 0,
        ...(
          feedSearchInput
            ? {
              nft_: {
                nftID: feedSearchInput
              }
            }
            : {}
        )
      },
      first: SUMMARY,  
      orderDirection: OrderDirection.Desc,
    },
  })
  return {total, loading, error, data, fetchMore, setSearchInput, searchInput, onClickSearch, feedSearchInput}
}