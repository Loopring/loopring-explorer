import { BigNumber } from "ethers"
import { dataByBlockIdAndIndex } from "loopring36-block-parser2";
import { INFURA_ENDPOINT, EXPLORER_CONFIG } from "./config";
import { block } from "../graphql/fragments";
import { time } from "console";

export interface Block {
  blockId: number;
  blockSize: number;
  exchange: string;
  txHash: string;
  status: string;
  createdAt: number;
  transactions: any[];
}

export const getBlock = (blockId: number): Promise<Block> => fetch(`${EXPLORER_CONFIG.LOOPRING_API}block/getBlock?id=${blockId}`)
  .then(x => x.json())

export const getLatestBlock = (): Promise<Block> => fetch(`${EXPLORER_CONFIG.LOOPRING_API}block/getBlock`)
  .then(x => x.json())

export const getAccount = (accountId: number) => fetch(`${EXPLORER_CONFIG.LOOPRING_API}account?accountId=${accountId}`)
  .then(x => x.json())

export const getAccountWithAddress = (address: string) => fetch(`${EXPLORER_CONFIG.LOOPRING_API}account?owner=${address}`)
  .then(x => x.json())

export const getTokens = () => fetch(`${EXPLORER_CONFIG.LOOPRING_API}exchange/tokens`)
  .then(x => x.json())

export const getPools = () => fetch(`${EXPLORER_CONFIG.LOOPRING_API}amm/pools`)
  .then(x => x.json())  

const convertTransactionData_Transfer = async (origin: any) => {
  const [
    fromAddress,
    toAddress,
    tokens,
  ] = await Promise.all([
    getAccount(origin.accountFromID).then(x => x.owner),
    getAccount(origin.accountToID).then(x => x.owner),
    getTokens(),
  ])
  const tokenInfo = tokens.find(x => x.tokenId === origin.tokenID)
  if (!tokenInfo) {
    return Promise.reject("Can't find token, maybe an NFT")
  }
  const feeTokenInfo = tokens.find(x => x.tokenId === origin.feeTokenID)
  return {
    transaction: {
      fromAccount: {
        address: fromAddress,
        id: origin.accountFromID,
      },
      toAccount: {
        address: toAddress,
        id: origin.accountToID,
      },
      amount: origin.amount,
      fee: origin.fee,
      token: {
        decimals: tokenInfo.decimals,
        symbol: tokenInfo.symbol,
      },
      feeToken: {
        decimals: feeTokenInfo.decimals,
        symbol: feeTokenInfo.symbol,
      },
      __typename: "Transfer",
      data: origin.txData,
    }
  }
}

const convertTransactionData_Withdraw = async (origin: any) => {
  const tokens = await getTokens()
  const tokenInfo = tokens.find(x => x.tokenId === origin.tokenID)
  const feeTokenInfo = tokens.find(x => x.tokenId === origin.feeTokenID)
  return {
    transaction: {
      amount: origin.amount,
      fee: origin.fee,
      withdrawalToken: {
        decimals: tokenInfo.decimals,
        symbol: tokenInfo.symbol,
      },
      withdrawalFeeToken: {
        decimals: feeTokenInfo.decimals,
        symbol: feeTokenInfo.symbol,
      },
      __typename: "Withdrawal",
      data: origin.txData,
    }
  }
}

const convertTransactionData_Swap = async (origin: any) => {
  const [
    tokens,
    { pools },
  ] = await Promise.all([
    getTokens(),
    getPools(),
  ])
  const tokenAInfo = tokens.find(x => x.tokenId === origin.tokenAS)
  const tokenBInfo = tokens.find(x => x.tokenId === origin.tokenBS)
  const found = pools.find(x => {
    const [t1Id, t2Id] = x.tokens.pooled
    return (origin.tokenAB === t1Id && origin.tokenBB === t2Id) 
      || (origin.tokenAB === t2Id && origin.tokenBB === t1Id)
  })
  const accountAddress = (await getAccount(origin.accountIdA)).owner
  return {
    transaction: {
      account: {
        address: accountAddress,
        id: origin.accountIdA,
      },
      tokenA: {
        decimals: tokenAInfo.decimals,
        symbol: tokenAInfo.symbol,
      },
      tokenB: {
        decimals: tokenBInfo.decimals,
        symbol: tokenBInfo.symbol,
      },
      fillSA: origin.fillSA,
      fillSB: origin.fillSB,
      tokenBPrice: BigNumber.from(origin.fillSA.toString())
        .mul('1' + '0'.repeat(tokenBInfo.decimals))
        .div(origin.fillSB.toString()),
      tokenAPrice: BigNumber.from(origin.fillSB.toString())
        .mul('1' + '0'.repeat(tokenAInfo.decimals))
        .div(origin.fillSA.toString()),
      pair: {
        id: found.tokens.pooled.join('-')
      },
      feeA: origin.feeA, 
      feeB: origin.feeB,
      pool: {
        address: found.address,
      },
      __typename: "Swap",
      data: origin.txData,
    }
  }
}
const convertTransactionData_Trade = async (origin: any) => {
  
  const [
    tokens,
    accountAddressA,
    accountAddressB,
  ] = await Promise.all([
    getTokens(),
    getAccount(origin.accountIdA).then(x => x.owner),
    getAccount(origin.accountIdB).then(x => x.owner),
  ])

  const tokenAInfo = tokens.find(x => x.tokenId === origin.tokenAS)
  const tokenBInfo = tokens.find(x => x.tokenId === origin.tokenBS)
  return {
    transaction: {
      accountA: {
        address: accountAddressA,
        id: origin.accountIdA,
      },
      accountB: {
        address: accountAddressB,
        id: origin.accountIdB,
      },
      tokenA: {
        decimals: tokenAInfo.decimals,
        symbol: tokenAInfo.symbol,
      },
      tokenB: {
        decimals: tokenBInfo.decimals,
        symbol: tokenBInfo.symbol,
      },
      fillSA: origin.fillSA,
      fillSB: origin.fillSB,
      tokenBPrice: BigNumber.from(origin.fillSA.toString())
        .mul('1' + '0'.repeat(tokenBInfo.decimals))
        .div(origin.fillSB.toString()),
      tokenAPrice: BigNumber.from(origin.fillSB.toString())
        .mul('1' + '0'.repeat(tokenAInfo.decimals))
        .div(origin.fillSA.toString()),
      feeA: origin.feeA, 
      feeB: origin.feeB, 
      __typename: "OrderbookTrade",
      data: origin.txData,
    }
  }
}

const convertTransactionData_Deposit = async (origin: any) => {
  const [
    tokens,
    toAccountAddress,
  ] = await Promise.all([
    getTokens(),
    getAccount(origin.toAccountID).then(x => x.owner)
  ])
  const tokenInfo = tokens.find(x => x.tokenId === origin.tokenID)
  
  return {
    transaction: {
      toAccount: {
        address: toAccountAddress,        
        id: origin.toAccountID,
      },
      token: {
        decimals: tokenInfo.decimals,
        symbol: tokenInfo.symbol,
      },
      amount: origin.amount,
      __typename: "Deposit",
      data: origin.txData,
    }
  }
}
const convertTransactionData_AccountUpdate = async (origin: any) => {
  const tokens = await getTokens()
  const feeTokenInfo = tokens.find(x => x.tokenId === origin.feeTokenID)
  return {
    transaction: {
      user: {
        address: origin.owner,        
        id: origin.accountID,
        publicKey: origin.publicKey
        // publickeyDecimalToHex128(origin.publicKeyY)
      },
      feeToken: {
        decimals: feeTokenInfo.decimals,
        symbol: feeTokenInfo.symbol,
      },
      fee: origin.fee,
      __typename: "AccountUpdate",
      data: origin.txData,
    }
  }
}
const convertTransactionData_AmmJoin = async (origin: any) => {
  const tokens = await getTokens()
  const feeTokenInfo = tokens.find(x => x.tokenId === origin.feeTokenID)
  const tokenInfo = tokens.find(x => x.tokenId === origin.tokenID)
  return {
    transaction: {
      account: {
        address: origin.from,        
        id: origin.accountID,
      },
      token: {
        decimals: tokenInfo.decimals,
        symbol: tokenInfo.symbol,
      },
      pool: {
        address: origin.to,
        id: origin.toTokenID
      },
      amount: origin.amount,
      feeToken: {
        decimals: feeTokenInfo.decimals,
        symbol: feeTokenInfo.symbol,
      },
      fee: origin.fee,
      __typename: "Add",
      data: origin.txData,
    }
  }
}
const convertTransactionData_AmmExit = async (origin: any) => {
  const tokens = await getTokens()
  const feeTokenInfo = tokens.find(x => x.tokenId === origin.feeTokenID)
  const tokenInfo = tokens.find(x => x.tokenId === origin.tokenID)
  return {
    transaction: {
      account: {
        address: origin.to,
        id: origin.accountToID
      },
      token: {
        decimals: tokenInfo.decimals,
        symbol: tokenInfo.symbol,
      },
      pool: {
        address: origin.from,        
        id: origin.accountFromID,
      },
      amount: origin.amount,
      feeToken: {
        decimals: feeTokenInfo.decimals,
        symbol: feeTokenInfo.symbol,
      },
      fee: origin.fee,
      __typename: "Remove",
      data: origin.txData,
    }
  }
}
const convertTransactionData_AmmUpdate = async (origin: any) => {
  return {
    transaction: {
      __typename: "AmmUpdate",
      data: origin.txData,
    }
  }
}
const convertTransactionData_Pre = (origin: any) => {
  return {
    ...origin,
    txData: origin.txData.slice(2),
  }
}
export const convertTransactionData = async (origin: any) => {
  const nextOrigin = convertTransactionData_Pre(origin)
  if (nextOrigin.type === 'TRANSFER') {
    return convertTransactionData_Transfer(nextOrigin)
  } else if (nextOrigin.type === 'WITHDRAWAL') {
    return convertTransactionData_Withdraw(nextOrigin)
  } else if (nextOrigin.type === 'SWAP') {
    return convertTransactionData_Swap(nextOrigin)
  } else if (nextOrigin.type === 'TRADE') {
    return convertTransactionData_Trade(nextOrigin)
  } else if (nextOrigin.type === 'DEPOSIT') {
    return convertTransactionData_Deposit(nextOrigin)
  } else if (nextOrigin.type === 'ACCOUNT_UPDATE') {
    return convertTransactionData_AccountUpdate(nextOrigin)
  } else if (nextOrigin.type === 'AMM_JOIN') {
    return convertTransactionData_AmmJoin(nextOrigin)
  } else if (nextOrigin.type === 'AMM_EXIT') {
    return convertTransactionData_AmmExit(nextOrigin)
  } else if (nextOrigin.type === 'AMM_UPDATE') {
    return convertTransactionData_AmmUpdate(nextOrigin)
  } else {
    return Promise.reject('unable to handle this type')
  }
}
export const getTransactionData = (blockId: number, index: number) => {
  return Promise.all([
    getBlock(blockId),
    dataByBlockIdAndIndex('mainnet', INFURA_ENDPOINT)(blockId, Number(index))
      .then(convertTransactionData)
  ]).then(([blockRaw, data]) => {
    const block = {
      timestamp: blockRaw.createdAt / 1000,
      id: blockRaw.blockId,
      transactionCount: blockRaw.blockSize,
      txHash: blockRaw.txHash,
    }
    return {
      ...data,
      transaction: {
        ...data.transaction,
        block
      }
    }
  }).catch(e => {
    throw e
  })
}

export const mapLoopringTransactionToGraphStructure = async (txs: any[]) => {
  // const blockTimestamp = block.timestamp
  const normalTokenList = await fetch(`${EXPLORER_CONFIG.LOOPRING_API}exchange/tokens`)
    .then(x => x.json())
    .then(list => list.map(token => {
      return {
        id: token.tokenId.toString(),
        decimals: token.decimals,
        symbol: token.symbol,
        name: token.name,
        address: token.address,
      }
    }))
  const vaultTokenList = await fetch(`${EXPLORER_CONFIG.LOOPRING_API}vault/tokens`)
    .then(x => x.json())
    .then(list => list.map(token => {
      return {
        id: token.vaultTokenId.toString(),
        decimals: token.decimals,
        symbol: token.symbol,
        name: token.name,
        address: token.address,
      }
    }))
  const tokenList = [...normalTokenList, ...vaultTokenList]
    
  const mapped = txs.map((tx, index) => {
    // timestamp: Math.floor(block.createdAt / 1000),
    // blockNo: block.blockId,
    const commonData = {
      id: tx.blockNo + "-" + tx.blockIndex,
      internalID:  "--",
      validUntil: tx.validUntil,
      block: {
        timestamp: tx.timestamp,
      }
    };
    switch (tx.txType) {
      case "NftData": {
        return {
          __typename: "DataNFT",
          ...commonData,
        };
      }
      case "NftMint":
        return {
          amount: tx.nftToken.amount,
          fee: tx.fee.amount,
          feeToken: {
            id: tx.fee.tokenId.toString(),
            ...tokenList.find(
              (t) => t.id === tx.fee.tokenId.toString()
            ),
          },
          minter: {
            id: tx.minterAccountId,
          },
          nft: {
            id: tx.nftToken.nftId,
          },
          receiver: {
            address: tx.toAccountAddress,
            id: tx.toAccountId.toString(),
          },
          receiverSlot: {
            id: `${tx.toAccountId}-${tx.toToken.tokenId}`,
          },
          __typename: "MintNFT",
          ...commonData,
        };
      case "AmmUpdate": {
        return {
          account: {
            id: tx.accountId,
            address: tx.owner,
          },
          __typename: "AmmUpdate",
          ...commonData,
        };
      }
      case "SpotTrade": {
        const { orderA, orderB } = tx;
        const __typename = orderA.nftData
          ? "TradeNFT"
          : orderB.accountID < 10000
          ? "Swap"
          : "OrderbookTrade";
        let obj;
        if (__typename === "TradeNFT") {
          return {
            __typename,
            accountBuyer: {
              id: orderA.accountID.toString(),
            },
            accountIdA: orderA.accountID,
            accountIdB: orderB.accountID,
            accountSeller: {
              id: orderB.accountID.toString(),
            },
            feeBuyer: BigNumber.from(orderA.amountS)
              .mul(
                BigNumber.from(orderB.feeBips.toString()).add(
                  orderA.feeBips.toString()
                )
              )
              .div("10000")
              .toString(),
            validUntil: tx.orderA.validUntil,
            realizedNFTPrice: orderA.amountS,
            token: {
              __typename: "Token",
              id: orderA.tokenS,
              ...tokenList.find(
                (x) => x.id === orderA.tokenS.toString()
              ),
            },
            ...commonData,
          };
        }
        if (__typename === "Swap") {
          obj = {
            account: {
              id: orderA.accountID.toString(),
            },
            pool: {
              id: orderB.accountID.toString(),
            },
          };
        } else {
          obj = {
            accountA: {
              id: orderA.accountID.toString(),
            },
            accountB: {
              id: orderB.accountID.toString(),
            },
          };
        }
        return {
          ...obj,
          tokenA: {
            id: orderA.tokenS.toString(),
            ...tokenList.find(
              (t) => t.id === orderA.tokenS.toString()
            ),
          },
          tokenB: {
            id: orderA.tokenB.toString(),
            ...tokenList.find(
              (t) => t.id === orderA.tokenB.toString()
            ),
          },
          pair: {
            id: `${orderA.tokenS}-${orderA.tokenB}`,
            token0: {
              symbol: tokenList.find(
                (t) => t.id === orderA.tokenS.toString()
              )?.symbol ?? '--',
            },
            token1: {
              symbol: tokenList.find(
                (t) => t.id === orderA.tokenB.toString()
              )?.symbol ?? '--',
            },
          },
          tokenAPrice: BigNumber.from(orderA.amountS)
            .mul("1" + "0".repeat(18))
            .div(orderA.amountB)
            .toString(),
          tokenBPrice: BigNumber.from(orderA.amountB)
            .mul("1" + "0".repeat(18))
            .div(orderA.amountS)
            .toString(),
          fillSA: orderA.amountS,
          fillSB: orderA.amountB,
          fillBA: orderA.amountB,
          fillBB: orderA.amountS,
          feeA: BigNumber.from(orderA.amountB)
            .mul(orderA.feeBips)
            .div("10000")
            .toString(),
          ...commonData,
          __typename,
          validUntil: tx.orderA.validUntil,
        };
      }
      case "Transfer": {
        const __typename = tx.token.nftData ? "TransferNFT" : "Transfer";
        return {
          fromAccount: tx.accountId
            ? {
                id: tx.accountId,
              }
            : undefined,
          toAccount: {
            id: tx.toAccountId,
          },
          feeToken: tx.fee
            ? {
                id: tx.fee.tokenId,
                ...tokenList.find(
                  (t) => t.id === tx.fee.tokenId.toString()
                ),
              }
            : undefined,
          token: tx.token
            ? {
                id: tx.token.tokenId,
                ...tokenList.find(
                  (t) => t.id === tx.token.tokenId.toString()
                ),
              }
            : undefined,
          toToken: tx.toToken
            ? {
                id: tx.toToken.tokenId,
                ...tokenList.find(
                  (t) => t.id === tx.toToken.tokenId.toString()
                ),
              }
            : undefined,
          amount: tx.token ? tx.token.amount : undefined,
          fee: tx.fee ? tx.fee.amount : undefined,
          __typename,
          ...commonData,
        };
      }
      case "Withdraw":
        const __typename = tx.token.nftData ? "WithdrawalNFT" : "Withdrawal";
        return {
          fromAccount: {
            id: tx.accountId,
          },
          toAddress: tx.toAddress,
          withdrawalFeeToken: tx.fee
            ? {
                id: tx.fee.tokenId,
                ...tokenList.find(
                  (t) => t.id === tx.fee.tokenId.toString()
                ),
              }
            : undefined,
            withdrawalToken:
            __typename === "Withdrawal"
              ? {
                  id: tx.token.tokenId,
                  ...tokenList.find(
                    (t) => t.id === tx.token.tokenId.toString()
                  ),
                }
              : undefined,
          withdrawalNFTFeeToken:
            __typename === "WithdrawalNFT"
              ? {
                  id: tx.token.tokenId,
                  ...tokenList.find(
                    (t) => t.id === tx.token.tokenId.toString()
                  ),
                }
              : undefined,
          __typename,
          amount: tx.token ? tx.token.amount : undefined,
          fee: tx.fee ? tx.fee.amount : undefined,
          ...commonData,
        };
      case "Deposit":
        return {
          fromAccount: tx.accountId
            ? {
                address: tx.fromAddress,
              }
            : undefined,
          toAccount: {
            id: tx.accountId,
            address: tx.toAddress,
          },
          token: tx.token
            ? {
                id: tx.token.tokenId,
                ...tokenList.find(
                  (t) => t.id === tx.token.tokenId.toString()
                ),
              }
            : undefined,
          amount: tx.token ? tx.token.amount : undefined,
          __typename: tx.txType,
          ...commonData,
      };
      case "AccountUpdate": {
        return {
          user: {
            id: tx.accountId,
          },
          feeToken: tx.fee
            ? {
                id: tx.fee.tokenId,
                ...tokenList.find(
                  (t) => t.id === tx.fee.tokenId.toString()
                ),
              }
            : undefined,
          fee: tx.fee ? tx.fee.amount : undefined,
          __typename: tx.txType,
          ...commonData,
        };
      }
    }
  }) as any[];
  return mapped;
};
