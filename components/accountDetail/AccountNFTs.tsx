import React from 'react';
import NFT from '../NFT';
import AppLink from '../AppLink';
import { OrderDirection } from '../../generated/loopringExplorer';
import CursorPagination from '../CursorPagination';
import { useAccountNFT } from '../../hooks/useAccountNFT';


interface Props {
  accountId: string;
}

const AccountNFTs: React.FC<Props> = ({ accountId }) => {
  const TOTAL_COUNT = 8;
  const {total, loading, error, data, fetchMore, setSearchInput, searchInput, onClickSearch, feedSearchInput} = useAccountNFT(accountId)

  if (loading) {
    return null;
  }

  if (error) {
    return (
      <div className="text-gray-400 text-2xl h-40 flex items-center justify-center w-full border">
        Couldn't fetch token balances
      </div>
    );
  }

  const totalCount = total?.accountNFTSlots 
    ? (total?.accountNFTSlots?.length >= 100 ? "100+" : total?.accountNFTSlots?.length)
    : "--"

  return (
    <div>
      <div style={{marginBottom: "10px"}}>
        <span style={{
          fontSize: "20px",
          marginRight: "20px",
        }}>{totalCount} Items</span> 
        <input
          type="text"
          name="query"
          className="gray-color h-10 w-full lg:w-auto flex-1 rounded-xl px-3 py-3 lg:py-0 placeholder-loopring-lightBlue placeholder-opacity-70"
          placeholder="Search NFT by NFT ID"
          style={{
            background: "transparent",
            
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
            onClickSearch()
          }}
        >
          Search
        </button>
      </div>
      {data.accountNFTSlots.length === 0 ? (
        <div className="text-gray-400 text-2xl h-40 flex items-center justify-center w-full border">
          No NFTs to show
        </div>
      ) : (
        <>
        
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {data.accountNFTSlots.map((slot, index) => {
              const { id, balance, nft } = slot;
              if (balance == 0) {
                return null;
              }
              return (
                <AppLink path="nft" nftId={nft.id}>
                  <div
                    key={id}
                    className="border rounded-xl overflow-hidden dark:border-loopring-dark-darkBlue m-4"
                    style={{
                      minHeight: 300,
                      minWidth: 300,
                      maxWidth: 300,
                    }}
                  >
                    <NFT nft={nft} />
                  </div>
                </AppLink>
              );
            })}
          </div>
          <CursorPagination
            onNextClick={(fetchNext, afterCursor) => {
              fetchNext({
                variables: {
                  where: {
                    account: accountId,
                    id_lt: afterCursor,
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
                },
              })
            }}
            onPreviousClick={(fetchPrevious, beforeCursor) =>
              fetchPrevious({
                variables: {
                  where: {
                    account: accountId,
                    id_gt: beforeCursor,
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
                  orderDirection: OrderDirection.Asc,
                },
                updateQuery(_, data) {
                  return {
                    accountNFTSlots: data.fetchMoreResult.accountNFTSlots.reverse(),
                  };
                },
              })
            }
            data={data}
            dataKey="accountNFTSlots"
            fetchMore={fetchMore}
            totalCount={TOTAL_COUNT}
            orderBy="id"
          />
        </>
      )}
    </div>
  );
};

export default AccountNFTs;
