import React from 'react';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';

import AppLink from '../../components/AppLink';
import NFT from '../../components/NFT';
import { INFURA_ENDPOINT } from '../../utils/config';
import getTrimmedTxHash from '../../utils/getTrimmedTxHash';
import { OrderDirection, useNonFungibleTokensQuery } from '../../generated/loopringExplorer';
import CursorPagination from '../../components/CursorPagination';

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

const NFTCollection: React.FC<{}> = () => {
  const router = useRouter();
  const ENTRIES_PER_PAGE = 21;
  const { data, loading, fetchMore } = useNonFungibleTokensQuery({
    skip: !router.query.address,
    variables: {
      where: {
        token_in: [router.query.address as string],
      },
      first: ENTRIES_PER_PAGE,
      orderDirection: OrderDirection.Desc,
    },
  });
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

  if (!data || minters?.length === 0 || loading) {
    return null;
  }

  const nfts = data.nonFungibleTokens;
  return (
    <div className="p-10">
      <div
        className="flex flex-col md:flex-row items-center justify-around py-12 m-auto px-4"
        style={{ maxWidth: 1200 }}
      >
        {
          <h1 className="text-3xl md:text-6xl w-1/2 text-white text-center">
            {name || getTrimmedTxHash(router.query.address as string, 14, true)}
          </h1>
        }
        <div className="flex flex-wrap md:flex-nowrap items-center w-full md:w-1/2 justify-center mt-4 md:mt-0">
          <div className="flex flex-col px-2 md:border-r break-all items-center w-full md:w-1/2 mt-4 md:mt-0">
            Contract Address:
            <AppLink path="account" address={router.query.address as string} isExplorerLink accountId="">
              {getTrimmedTxHash(router.query.address as string, 14, true)}
            </AppLink>
          </div>
          <div className="w-full flex flex-col px-2 break-all items-center w-full md:w-1/2 mt-4 md:mt-0">
            Minter:
            <ul>
              {minters?.map((minter) => {
                return (
                  <li>
                    <AppLink path="account" address={minter} isExplorerLink accountId="" key={minter}>
                      {getTrimmedTxHash(minter, 14, true)}
                    </AppLink>
                  </li>
                );
              })}
            </ul>
          </div>
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
  );
};

export default NFTCollection;
