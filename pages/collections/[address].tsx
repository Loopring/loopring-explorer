import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';

import AppLink from '../../components/AppLink';
import NFT from '../../components/NFT';
import { INFURA_ENDPOINT } from '../../utils/config';
import getTrimmedTxHash from '../../utils/getTrimmedTxHash';
import { OrderDirection, useNonFungibleTokensQuery } from '../../generated/loopringExplorer';
import CursorPagination from '../../components/CursorPagination';
import { copyToClipBoard } from '../../utils/clipboard';
import { debounce } from 'lodash';
import { ApolloQueryResult, gql } from '@apollo/client';
import client from '../../graphql';
import { IPFS_URL, NFTInfo, getNFTMetadata, getNFTURI } from '../../utils/nft';


const provider = new ethers.providers.JsonRpcProvider(INFURA_ENDPOINT);
const getMinters = async (address) => {
  if (!address) {
    return [];
  }
  const abi = [
    `function minters()
  external
  view
  returns (address[] memory)`,
  ];
  try {
    const nftContract = new ethers.Contract(address, abi, provider);
    return await nftContract.minters();
  } catch (error) {
    return null;
  }
};

const getCollectionName = async (address) => {
  if (!address) {
    return [];
  }
  try {
    const abi = [`function name() public view virtual override returns (string memory)`];
    const nftContract = new ethers.Contract(address, abi, provider);

    return await nftContract.name();
  } catch (error) {
    return null;
  }
};

const NON_FUNGIBLE_TOKENS = gql`
  query nonFungibleTokens($where: NonFungibleToken_filter, $first: Int, $orderDirection: OrderDirection) {
    nonFungibleTokens(
      where: $where
      first: $first
      orderDirection: $orderDirection
      orderBy: nftID
    ) {
      id,
      nftID,
      nftType
    }
  }
`;

const NFTCollection: React.FC<{}> = () => {
  const router = useRouter();
  const ENTRIES_PER_PAGE = 21;
  const SUMMARY = 100;
  const [minters, setMinters] = React.useState([]);
  const [name, setName] = React.useState<string>();

  React.useEffect(() => {
    (async () => {
      const mintersList = await getMinters(router.query.address);
      const name = await getCollectionName(router.query.address);
      setMinters(mintersList);
      setName(name);
    })();
  }, [router.query.address]);
  const [searchInput, setSearchInput] = useState('')
  const [total, setTotal] = useState<ApolloQueryResult<{ nonFungibleTokens: { id: string, nftType: number }[] }> | undefined>(undefined)
  const [firstMetadata, setFirstMetadata] = React.useState<NFTInfo | undefined>(undefined);
  useEffect(() => {
    if (!router.query.address) return
    (async () => {
      const total = await client.query<{ nonFungibleTokens: { id: string, nftType: number }[] }>({
        query: NON_FUNGIBLE_TOKENS,
        variables: {
          where: {
            token_in: [router.query.address as string],
          },
          first: SUMMARY,
          orderDirection: OrderDirection.Desc,
        },
      })
      setTotal(total)
      const nft = total.data.nonFungibleTokens[0]
      const uri = await getNFTURI(nft);
      const metadata = await getNFTMetadata(uri, nft);
      setFirstMetadata({
        imageUrl: metadata?.image?.replace('ipfs://', IPFS_URL),
        nftType: nft.nftType
      });
    })();
  }, [router.query.address])
  const { data, loading, fetchMore, refetch } = useNonFungibleTokensQuery({
    skip: !router.query.address,
    variables: {
      where: {
        token_in: [router.query.address as string],
        ...(
          searchInput
            ? {
              nftID: searchInput
            }
            : {}
        )
      },
      first: ENTRIES_PER_PAGE,
      orderDirection: OrderDirection.Desc,
    },
  });
  const debouncedFn = useCallback(debounce(() => {
    refetch()
  }, 500), []);

  if (!data || minters?.length === 0 || loading) {
    return null;
  }
  const totalCount = total.data?.nonFungibleTokens
    ? (total.data?.nonFungibleTokens?.length >= 100 ? "100+" : total.data?.nonFungibleTokens?.length)
    : "--"
  const nfts = data.nonFungibleTokens;
  return (
    <div className="p-10">
      <div style={{
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
        width: "100%",
      }}>
        <div style={{
          width: "100%",
          borderRadius: "5px",
          overflow: "hidden",
          maxWidth: "1200px"
        }}>
          <div style={{
            backgroundImage: `url("${firstMetadata?.imageUrl ?? ""}")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            backgroundSize: "cover",
            height: "400px",
            width: "100%"
          }}/>
          {/* <img style={{ width: "100%" }} src={firstMetadata?.imageUrl ?? ""} /> */}
          <div style={{ display: "flex", justifyContent: "space-between", color: "white", background: "#29293F" }}>
            <div style={{ display: "flex" }}>
              <img style={{ borderRadius: "10px", marginLeft: "30px", marginBottom: "30px", marginTop: "-30px", width: "200px", height: "200px" }} src={firstMetadata?.imageUrl ?? ""} />
              <div style={{ marginTop: "20px", marginLeft: "20px", }}>
                <p>{name || "--"}</p>
                <p>
                  <span>{getTrimmedTxHash(router.query.address as string, 14, true)} </span>
                  <img style={{ display: "inline-block", width: "20px", cursor: "pointer" }} src="/copy.svg" onClick={() => {
                    if (typeof router.query.address === "string") {
                      copyToClipBoard(router.query.address)
                    }
                  }} />
                </p>
                <p>
                  Item:
                  <span>{totalCount}</span>
                </p>
              </div>
            </div>
            <p style={{ marginTop: "20px", marginRight: "20px" }}>
              {firstMetadata?.nftType === 1 ? 'ERC-721' : firstMetadata?.nftType === 0 ? 'ERC-1155' : "--"}
            </p>
          </div>
          <h2 style={{
            fontSize: "32px",
            marginBottom: "20px",
            marginTop: "20px"
          }}>
            NFTs
          </h2>
          <div style={{ width: "100%", maxWidth: "1200px", marginBottom: "40px" }}>
            <span style={{
              fontSize: "22px",
            }}>{totalCount} Items</span>
            <input
              type="text"
              name="query"
              className="gray-color h-10 w-full lg:w-auto flex-1 rounded-xl px-3 py-3 lg:py-0 placeholder-loopring-lightBlue placeholder-opacity-70"
              placeholder="Search NFT by Token ID"
              style={{
                background: "transparent",
                marginLeft: "20px",
                border: "1px solid rgb(154 161 185 / var(--tw-text-opacity))",
                width: "300px",
              }}
              value={searchInput}
              onInput={(e) => {
                setSearchInput(e.currentTarget.value)
                debouncedFn()
              }}
            />
          </div>
        </div>

        {nfts.length === 0 ? (
          <div className="text-gray-400 text-2xl h-40 flex items-center justify-center w-full border">
            {'No NFTs to show'}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 m-auto" style={{ maxWidth: 1200 }}>
              {nfts.map((nft) => {
                return (
                  <AppLink path="nft" nftId={nft.id} key={nft.id}>
                    <div
                      className="border rounded-xl overflow-hidden dark:border-loopring-dark-darkBlue m-4"
                      style={{
                        minHeight: 300,
                        minWidth: 300,
                      }}
                    >
                      <NFT nft={nft} />
                    </div>
                  </AppLink>
                );
              })}
            </div>
            <CursorPagination
              onNextClick={(fetchNext, afterCursor) =>
                fetchNext({
                  variables: {
                    where: {
                      token_in: [router.query.address as string],
                      nftID_lt: afterCursor,
                    },
                  },
                })
              }
              onPreviousClick={(fetchPrevious, beforeCursor) =>
                fetchPrevious({
                  variables: {
                    where: {
                      token_in: [router.query.address as string],
                      nftID_gt: beforeCursor,
                    },
                    orderDirection: OrderDirection.Asc,
                  },
                  updateQuery(_, data) {
                    return {
                      nonFungibleTokens: data.fetchMoreResult.nonFungibleTokens.reverse(),
                    };
                  },
                })
              }
              data={data}
              dataKey="nonFungibleTokens"
              fetchMore={fetchMore}
              totalCount={ENTRIES_PER_PAGE}
              orderBy="nftID"
            />
          </>
        )}

      </div>
    </div>
  );
};

export default NFTCollection;
