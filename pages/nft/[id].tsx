import React from 'react';
import { ethers } from 'ethers';

import { useRouter } from 'next/router';
import useCachedNFT from '../../hooks/useCachedNFT';
import getTrimmedTxHash from '../../utils/getTrimmedTxHash';
import AppLink from '../../components/AppLink';
import NFTTransactions from '../../components/nftDetail/NFTTransactions';
import { INFURA_ENDPOINT, NFT_DISALLOW_LIST } from '../../utils/config';
import useConsentContext from '../../hooks/useConsentContext';
import { useNonFungibleTokenQuery } from '../../generated/loopringExplorer';
import NFTAnimation from '../../components/nftDetail/NFTAnimation';
import FallBackImg from '../../components/FallBackImg';

const provider = new ethers.providers.JsonRpcProvider(INFURA_ENDPOINT);

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

const NFTDetail: React.FC<{}> = () => {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = React.useState(false);
  const { data } = useNonFungibleTokenQuery({
    variables: {
      id: router.query.id && (router.query.id as string).toLowerCase(),
    },
  });

  const nft = data ? data?.nonFungibleToken : null;
  const [collectionName, setCollectionName] = React.useState<string>();
  const { hasConsent, askUserForConsent } = useConsentContext();
  const [hideConsentButton, setHideConsentButton] = React.useState<boolean>(false);
  const [animationType, setAnimationType] = React.useState<string>();
  const metadata = useCachedNFT(nft);
  const { image, name, animation_url, fallBackImage } = metadata;

  React.useEffect(() => {
    if (nft) {
      (async () => {
        const collectionName = await getCollectionName(nft.token);
        setCollectionName(collectionName);
      })();
    }
  }, [nft]);

  React.useEffect(() => {
    if (image && image === '/error' && fallBackImage && fallBackImage === '/error') {
      setIsLoaded(true);
    }
  }, [image, fallBackImage]);

  React.useEffect(() => {
    if (animation_url) {
      (async () => {
        const res = await fetch(animation_url as string, {
          method: 'HEAD',
        }).then((res) => {
          const animType = res.headers.get('content-type');
          setAnimationType(animType);
          setIsLoaded(true);
        });
      })();
    }
  }, [animation_url]);

  React.useEffect(() => {
    if (hasConsent) {
      setHideConsentButton(hasConsent);
    }
  }, [hasConsent]);

  return (
    <div className="pt-12">
      <div className="flex flex-col lg:flex-row w-full lg:w-10/12 mx-auto">
        <div className="flex flex-col items-center justify-end w-full h-[520px] lg:w-4/12 relative nft-image">
          {!isLoaded && (
            <img
              src="/nft-placeholder.svg"
              className="absolute top-0 right-0 h-full w-full object-cover object-center animate-pulse"
            />
          )}
          {animation_url ? (
            <NFTAnimation
              animationURL={animation_url as string}
              animationType={animationType}
              image={image as string}
              fallBackImage={fallBackImage as string}
            />
          ) : animation_url === '/error' ? (
            <img
              src="/nft-error.svg"
              className="top-0 right-0 h-full w-full object-contain object-center bg-white rounded-xl"
            />
          ) : (image || fallBackImage) ? (
            (image === '/error' && fallBackImage === '/error') ? (
              <img
                src="/nft-error.svg"
                className="top-0 right-0 h-full w-full object-contain object-center bg-white rounded-xl"
              />
            ) : (
              <FallBackImg
                src={image as string}
                fallBackSrc={fallBackImage as string}
                alt={name as string}
                className={`z-10 object-contain object-center m-auto h-full rounded-xl ${
                  NFT_DISALLOW_LIST.includes(nft.id) || !hasConsent ? 'filter blur-xl' : ''
                }`}
                ref={(imageElement) => {
                  if (imageElement) {
                    imageElement.onload = () => setIsLoaded(true);
                  }
                }}
              />
            )
          ) : null}
          {
            <div
              style={{ height: '100%', width: '100%' }}
              className={`absolute z-10 top-0 left-0 text-white flex items-center justify-center ${
                !hideConsentButton ? '' : 'hidden'
              }`}
            >
              <button
                className="bg-black bg-opacity-20 rounded-xl px-3 py-2 text-sm text-white"
                onClick={(e) => {
                  if (!hasConsent) {
                    e.stopPropagation();
                    e.preventDefault();
                    askUserForConsent();
                  }
                }}
              >
                View Content
              </button>
            </div>
          }
          {isLoaded && (
            <div className="flex items-center px-4 w-full mt-4 justify-center z-10">
              <a
                href={metadata.uri as string}
                target="_blank"
                className="px-4 py-2 rounded-xl border-2 border-loopring-blue text-loopring-blue dark:text-white mr-4"
              >
                View Metadata
              </a>
              <AppLink
                path="collection"
                collection={nft?.token}
                className="px-4 py-2 rounded-xl bg-loopring-blue force-text-white"
              >
                View Collection
              </AppLink>
            </div>
          )}
        </div>
        <div className="w-full lg:w-3/5 lg:pl-12 h-fulls tracking-wider flex flex-col items-start text-xl">
          <div style={{ minHeight: '10px' }}>
            <AppLink path="collection" collection={nft?.token} className="px-2 md:px-0">
              {collectionName}
            </AppLink>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold p-2 lg:p-0">
            {name ? name : <div className="w-2/3 animate-pulse h-8 bg-gray-400 rounded" />}
          </h1>

          <div className="w-full overflow-auto mt-8">
            <table className="border dark:border-loopring-dark-darkBlue w-full text-base">
              <tbody>
                <tr>
                  <td className="p-4 bg-loopring-blue dark:bg-loopring-dark-darkBlue w-40 lg:w-44 text-white">
                    NFT ID
                  </td>
                  <td className="pl-6 dark:text-white break-all pr-2">{nft?.nftID}</td>
                </tr>
                <tr>
                  <td className="p-4 bg-loopring-blue dark:bg-loopring-dark-darkBlue w-40 lg:w-44 text-white">
                    Minter
                  </td>
                  <td className="pl-6 dark:text-white">
                    <AppLink path="account" accountId={nft?.minter?.id}>
                      <span className="hidden xl:block">{nft?.minter?.address}</span>
                      <span className="xl:hidden">
                        {nft?.minter?.address && getTrimmedTxHash(nft?.minter?.address, 15)}
                      </span>
                    </AppLink>
                  </td>
                </tr>
                <tr>
                  <td className="p-4 bg-loopring-blue dark:bg-loopring-dark-darkBlue w-40 lg:w-44 text-white">
                    Token Address
                  </td>
                  <td className="pl-6 dark:text-white pr-2">
                    <AppLink path="account" address={nft?.token} isExplorerLink accountId="">
                      <span className="hidden xl:block">{nft?.token}</span>
                      <span className="xl:hidden">{nft?.token && getTrimmedTxHash(nft?.token, 15)}</span>
                    </AppLink>
                  </td>
                </tr>
                <tr>
                  <td className="p-4 bg-loopring-blue dark:bg-loopring-dark-darkBlue w-40 lg:w-44 text-white">
                    Token Standard
                  </td>
                  <td className="pl-6 dark:text-white">
                    {nft?.nftType === 1 ? 'ERC-721' : nft?.nftType === 0 ? 'ERC-1155' : null}
                  </td>
                </tr>
                {Boolean(metadata.royalty_percentage) && (
                  <tr>
                    <td className="p-4 bg-loopring-blue dark:bg-loopring-dark-darkBlue w-40 lg:w-44 text-white">
                      Royalty %
                    </td>
                    <td className="pl-6 dark:text-white">{metadata.royalty_percentage}%</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="mt-8 mx-auto px-4">
        <NFTTransactions nftId={nft?.id} />
      </div>
    </div>
  );
};

export default NFTDetail;
