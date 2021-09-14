import React from "react";

import AppLink from "../AppLink";
import getDateString from "../../utils/getDateString";
import getTokenAmount from "../../utils/getTokenAmount";
import getTrimmedTxHash from "../../utils/getTrimmedTxHash";

const OrderbookTrade: React.FC<{ transaction: any }> = ({ transaction }) => {
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
    __typename,
  } = transaction;

  return (
    <>
      <tr className="border">
        <td className="p-2 lg:w-1/5">Block #</td>
        <td>
          <AppLink path="block" block={block.id}>
            {block.id}
          </AppLink>
        </td>
      </tr>
      <tr className="border">
        <td className="p-2">Submitted at</td>
        <td>{getDateString(block.timestamp)}</td>
      </tr>
      <tr className="border">
        <td className="p-2">Transaction Type</td>
        <td>{__typename}</td>
      </tr>
      <tr className="border">
        <td className="p-2">Account 1</td>
        <td>
          <AppLink path="account" accountId={accountA.id}>
            <span className="hidden lg:block">{accountA.address}</span>
            <span className="lg:hidden">
              {getTrimmedTxHash(accountA.address, 10, true)}
            </span>
          </AppLink>
        </td>
      </tr>
      <tr className="border">
        <td className="p-2">Account 2</td>
        <td>
          <AppLink path="account" accountId={accountB.id}>
            <span className="hidden lg:block">{accountB.address}</span>
            <span className="lg:hidden">
              {getTrimmedTxHash(accountB.address, 10, true)}
            </span>
          </AppLink>
        </td>
      </tr>
      <tr className="border">
        <td className="p-2">Trade</td>
        <td>
          {getTokenAmount(fillSA, tokenA.decimals)} {tokenA.symbol} &harr;{" "}
          {getTokenAmount(fillSB, tokenB.decimals)} {tokenB.symbol}
        </td>
      </tr>
      <tr className="border">
        <td className="p-2">Fee</td>
        <td>
          {feeA > 0
            ? `${getTokenAmount(feeA, tokenB.decimals)} ${tokenB.symbol}`
            : feeB > 0
            ? `${getTokenAmount(feeB, tokenA.decimals)} ${tokenA.symbol}`
            : null}
        </td>
      </tr>
      <tr className="border">
        <td className="p-2">Transaction Data</td>
        <td>
          <div className="break-all bg-gray-100 h-32 overflow-auto m-2 rounded p-2 text-gray-500">
            {data}
          </div>
        </td>
      </tr>
    </>
  );
};

export default OrderbookTrade;
