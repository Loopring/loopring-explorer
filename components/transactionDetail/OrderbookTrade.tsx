import React from "react";
import Image from "next/image";

import AppLink from "../AppLink";
import getDateString from "../../utils/getDateString";
import getTokenAmount from "../../utils/getTokenAmount";
import getTrimmedTxHash from "../../utils/getTrimmedTxHash";

interface IOrderbookTradeProps {
  transaction: any;
  isPending?: boolean;
}

const OrderbookTrade: React.FC<IOrderbookTradeProps> = ({
  transaction,
  isPending = false,
}) => {
  const [priceDirectionAtoB, setPriceDirectionAtoB] =
    React.useState<boolean>(true);
  const {
    block,
    accountA,
    accountB,
    tokenA,
    tokenB,
    data,
    fillSA,
    fillSB,
    feeA,
    feeB,
    tokenAPrice,
    tokenBPrice,
  } = transaction;
  return (
    <>
      {block && (
        <tr className="border dark:border-loopring-dark-darkBlue">
          <td className="p-2 lg:w-1/5">Block #</td>
          <td>
            <AppLink path="block" block={block.id}>
              {block.id}
            </AppLink>
          </td>
        </tr>
      )}
      <tr className="border dark:border-loopring-dark-darkBlue">
        <td className="p-2">Status</td>
        <td>
          {isPending ? (
            <span className="italic">Pending</span>
          ) : (
            <div className="flex items-center ">
              <Image src={"/green-tick.svg"} height={20} width={20} />{" "}
              <span className="ml-2">{getDateString(block.timestamp)}</span>
            </div>
          )}
        </td>
      </tr>
      <tr className="border dark:border-loopring-dark-darkBlue">
        <td className="p-2">Transaction Type</td>
        <td>Trade</td>
      </tr>
      <tr className="border dark:border-loopring-dark-darkBlue">
        <td className="p-2">Account 1</td>
        <td>
          <AppLink
            path="account"
            accountId={accountA.id}
            address={accountA.address}
          >
            <span className="hidden lg:block">
              {accountA.address || accountA.id}
            </span>
            <span className="lg:hidden">
              {accountA.address
                ? getTrimmedTxHash(accountA.address, 10, true)
                : accountA.id}
            </span>
          </AppLink>
        </td>
      </tr>
      <tr className="border dark:border-loopring-dark-darkBlue">
        <td className="p-2">Account 2</td>
        <td>
          <AppLink
            path="account"
            accountId={accountB.id}
            address={accountB.address}
          >
            <span className="hidden lg:block">
              {accountB.address || accountB.id}
            </span>
            <span className="lg:hidden">
              {accountB.address
                ? getTrimmedTxHash(accountB.address, 10, true)
                : accountB.id}
            </span>
          </AppLink>
        </td>
      </tr>
      <tr className="border dark:border-loopring-dark-darkBlue">
        <td className="p-2">Trade</td>
        <td>
          {getTokenAmount(fillSA, tokenA.decimals)} {tokenA.symbol} &harr;{" "}
          {getTokenAmount(fillSB, tokenB.decimals)} {tokenB.symbol}
          {!!tokenAPrice && !!tokenAPrice && (
            <button
              className="hover:bg-blue-100 lg:p-2 lg:mx-2 rounded hover:underline"
              onClick={() => setPriceDirectionAtoB((val) => !val)}
            >
              (
              {priceDirectionAtoB ? (
                <>
                  1 {tokenA.symbol} ={" "}
                  {getTokenAmount(tokenAPrice, tokenB.decimals)} {tokenB.symbol}
                </>
              ) : (
                <>
                  1 {tokenB.symbol} ={" "}
                  {getTokenAmount(tokenBPrice, tokenA.decimals)} {tokenA.symbol}
                </>
              )}
              )
            </button>
          )}
        </td>
      </tr>
      <tr className="border dark:border-loopring-dark-darkBlue">
        <td className="p-2">Fee</td>
        <td>
          {feeA > 0
            ? `${getTokenAmount(feeA, tokenB.decimals)} ${tokenB.symbol}`
            : feeB > 0
            ? `${getTokenAmount(feeB, tokenA.decimals)} ${tokenA.symbol}`
            : null}
        </td>
      </tr>
      {data && (
        <tr className="border dark:border-loopring-dark-darkBlue">
          <td className="p-2">Transaction Data</td>
          <td>
            <div className="break-all bg-gray-100 dark:bg-loopring-dark-darkBlue h-32 overflow-auto m-2 rounded p-2 text-gray-500">
              {data}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default OrderbookTrade;
