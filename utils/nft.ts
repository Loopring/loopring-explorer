import { ethers } from 'ethers';

import { INFURA_ENDPOINT } from '../utils/config';
import LRUCache from '../utils/cache';

export interface NFTInfo {
  imageUrl: string;
  nftType: number
}

export const IPFS_URL = 'https://loopring.mypinata.cloud/ipfs/';

// Two caches need to maintained
// NFT URI cache {key-> token_address:nft_id}
// NFT metadata cache { key -> metadata_url}

const uriCache = new LRUCache();
const metadataCache = new LRUCache();
const provider = new ethers.providers.JsonRpcProvider(INFURA_ENDPOINT);

const getCounterFactualNFT = async (nft) => {
  try {
    const contractABIERC1155 = [`function uri(uint256 id) external view returns (string memory)`];

    const nftContract = new ethers.Contract('0xB25f6D711aEbf954fb0265A3b29F7b9Beba7E55d', contractABIERC1155, provider);

    const uri = await nftContract.uri(nft.nftID);
    return uri;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const getERC721URI = async (nft, isFailOver = false) => {
  try {
    const contractABIERC721 = [
      `function tokenURI(uint256 tokenId) public view virtual override returns (string memory)`,
    ];

    const nftContract = new ethers.Contract(nft.token, contractABIERC721, provider);

    const uri = await nftContract.tokenURI(nft.nftID);
    return uri;
  } catch (error) {
    console.error(error);
    if (!isFailOver) {
      return await getERC1155URI(nft, true);
    } else {
      return await getCounterFactualNFT(nft);
    }
  }
};

const getERC1155URI = async (nft, isFailOver = false) => {
  try {
    const contractABIERC1155 = [`function uri(uint256 id) external view returns (string memory)`];

    const nftContract = new ethers.Contract(nft.token, contractABIERC1155, provider);

    const uri = await nftContract.uri(nft.nftID);
    return uri;
  } catch (error) {
    console.error(error);
    if (!isFailOver) {
      return await getERC721URI(nft, true);
    } else {
      return await getCounterFactualNFT(nft);
    }
  }
};

export const getNFTURI = async (nft) => {
  const cacheKey = nft.id;
  let cacheResult = uriCache.get(cacheKey);
  if (cacheResult) {
    return cacheResult;
  } else {
    if (nft.nftType === 1) {
      const uri = await getERC721URI(nft);
      uriCache.set(cacheKey, uri);
      return uri;
    } else {
      const uri = await getERC1155URI(nft);
      uriCache.set(cacheKey, uri);
      return uri;
    }
  }
};

export const getNFTMetadata = async (uri, nft, isErrorFallback = false) => {
  const cacheKey = nft.id;
  let cacheResult = metadataCache.get(cacheKey);
  if (cacheResult) {
    return cacheResult;
  } else {
    if (!uri) {
      return {
        image: '/error',
        animation_url: '/error',
        name: "Couldn't fetch NFT details",
      };
    }
    try {
      const metadata = await fetch(uri.replace('ipfs://', IPFS_URL)).then((res) => res.json());
      metadataCache.set(cacheKey, metadata);
      return metadata;
    } catch (error) {
      if (!isErrorFallback) {
        return getNFTMetadata(`${uri}/metadata.json`, nft, true);
      }
      return {
        image: '/error',
        name: "Couldn't fetch NFT details",
      };
    }
  }
};
export const getCollectionMetadata = async (uri) => {
  return fetch(uri).then((res) => res.json());
  // const cacheKey = nft.id;
  // let cacheResult = metadataCache.get(cacheKey);
  // if (cacheResult) {
  //   return cacheResult;
  // } else {
  //   if (!uri) {
  //     return {
  //       image: '/error',
  //       animation_url: '/error',
  //       name: "Couldn't fetch NFT details",
  //     };
  //   }
  //   try {
  //     const metadata = await fetch(uri.replace('ipfs://', IPFS_URL)).then((res) => res.json());
  //     metadataCache.set(cacheKey, metadata);
  //     return metadata;
  //   } catch (error) {
  //     if (!isErrorFallback) {
  //       return getNFTMetadata(`${uri}/metadata.json`, nft, true);
  //     }
  //     return {
  //       image: '/error',
  //       name: "Couldn't fetch NFT details",
  //     };
  //   }
  // }
};