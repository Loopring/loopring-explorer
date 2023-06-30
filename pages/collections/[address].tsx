import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';

import AppLink from '../../components/AppLink';
import NFT from '../../components/NFT';
import { INFURA_ENDPOINT, LOOPRING_API, loopringApiEndpoints } from '../../utils/config';
import getTrimmedTxHash from '../../utils/getTrimmedTxHash';
import { OrderDirection, useNonFungibleTokensQuery } from '../../generated/loopringExplorer';
import CursorPagination from '../../components/CursorPagination';
import { copyToClipBoard } from '../../utils/clipboard';
import { gql } from '@apollo/client';
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

const getCollectionName = async (address)=> {
  if (!address) {
    return null;
  }
  try {
    const endpoint = `${LOOPRING_API}${loopringApiEndpoints.collection}?collectionAddress=${address}`;
    const res = await fetch(endpoint).then((res) => res.json());
    return {
      name: res.name as string, 
      avatar: res.avatar as string,
      banner: res.tileUri as string,
      nftType: res.nftType as string,
    }
  } catch (error) {
    return {};
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
  const [metadata, setMetadata] = React.useState<{ avatar?: string, banner?: string, nftType: string } | undefined>(undefined);
  React.useEffect(() => {
    (async () => {
      const mintersList = await getMinters(router.query.address);
      const response = await getCollectionName(router.query.address);
      setMinters(mintersList);
      if (response) {
        setName(response.name);
        setMetadata({
          avatar: response.avatar ? response.avatar.replace('ipfs://', IPFS_URL) : undefined,
          banner: response.banner ? response.banner.replace('ipfs://', IPFS_URL) : undefined,
          nftType: response.nftType ? response.nftType : undefined,
        });
      }
    })();
  }, [router.query.address]);
  const [searchInput, setSearchInput] = useState('')
  const [feedSearchInput, setFeedSearchInput] = useState('')
  const { data, loading, fetchMore, refetch } = useNonFungibleTokensQuery({
    fetchPolicy: 'cache-and-network',
    // skip: !router.query.address,
    variables: {
      where: {
        token_in: [router.query.address as string],
        ...(
          feedSearchInput
            ? {
              nftID: feedSearchInput
            }
            : {}
        )
      },
      first: ENTRIES_PER_PAGE,
      orderDirection: OrderDirection.Desc,
    
    },
  });

  const { data: total } = useNonFungibleTokensQuery({
    fetchPolicy: 'no-cache',
    query: NON_FUNGIBLE_TOKENS,
    variables: {
      where: {
        token_in: [router.query.address as string],
        ...(
          feedSearchInput
            ? {
              nftID: feedSearchInput
            }
            : {}
        )
      },
      first: SUMMARY,
      orderDirection: OrderDirection.Desc,
    },
  })

  
  const [copied, setCopied] = useState(false)

  if (!data || minters?.length === 0 || loading) {
    return <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "70vh",
    }}>
      <img width="80px" src="/loading-line.gif" />
    </div>
  }
  const totalCount = total?.nonFungibleTokens
    ? (total?.nonFungibleTokens?.length >= 100 ? "100+" : total?.nonFungibleTokens?.length)
    : "--"
  const nfts = data.nonFungibleTokens;


  const nftType = metadata?.nftType
    ? (metadata.nftType === "ERC1155"
      ? 'ERC-1155'
      : 'ERC-721'
    )
    : (data && data.nonFungibleTokens[0])
      ? (
        data.nonFungibleTokens[0].nftType === 1
          ? 'ERC-721'
          : data.nonFungibleTokens[0].nftType === 0
            ? 'ERC-1155'
            : "--")
      : "--"
  
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
          {metadata?.banner && <div style={{
            backgroundImage: `url("${metadata?.banner ?? ""}")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            backgroundSize: "cover",
            height: "400px",
            width: "100%"
          }}/>}
          {/* <img style={{ width: "100%" }} src={firstMetadata?.imageUrl ?? ""} /> */}
          <div style={{ display: "flex", justifyContent: "space-between", color: "white", background: "#29293F" }}>
            <div style={{ display: "flex" }}>
              {metadata?.avatar && <img style={{ borderRadius: "10px", marginLeft: "30px", marginBottom: "30px", marginTop: "-30px", width: "200px", height: "200px" }} src={metadata.avatar} />}
              <div style={{ marginTop: "20px", marginLeft: "20px", }}>
                <p>{name || "--"}</p>
                <p>
                  <span>{getTrimmedTxHash(router.query.address as string, 14, true)} </span>
                  
                  <img
                    style={{ display: "inline-block", width: "20px", cursor: "pointer" }}
                    src={copied ? "/green-tick.svg" : "/copy.svg"} 
                    onClick={() => {
                      if (typeof router.query.address === "string") {
                        setCopied(true)
                        copyToClipBoard(router.query.address)
                        setTimeout(() => {
                          setCopied(false)
                        }, 1000);
                      }
                    }}
                  />
                </p>
                <p style={{marginBottom: '24px'}}>
                  Item:
                  <span>{totalCount}</span>
                </p>
              </div>
            </div>
            <p style={{ marginTop: "20px", marginRight: "20px" }}>
              {nftType}
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
              placeholder="Search NFT by NFT ID"
              style={{
                background: "transparent",
                marginLeft: "20px",
                border: "1px solid rgb(154 161 185 / var(--tw-text-opacity))",
                width: "300px",
              }}
              value={searchInput}
              onInput={(e) => {
                setSearchInput(e.currentTarget.value)
              }}
            />
            <button
              type="submit"
              className="bg-loopring-darkBlue mt-4 lg:mt-0 py-1 px-10 ml-2 rounded-xl text-white h-10 dark:bg-loopring-dark-blue"
              onClick={() => {
                setFeedSearchInput(searchInput)
              }}
            >
              Search
            </button>
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
