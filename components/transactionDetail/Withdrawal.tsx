import React from 'react';
import Image from 'next/image';

import AppLink, { makeExplorerURL } from '../AppLink';
import getDateString from '../../utils/getDateString';
import getTokenAmount from '../../utils/getTokenAmount';
import getTrimmedTxHash from '../../utils/getTrimmedTxHash';
import { EXPLORER_URL } from '../../utils/config';

interface IWithdrawalProps {
  transaction: any;
  isPending?: boolean;
}

const Withdrawal: React.FC<IWithdrawalProps> = ({ transaction, isPending = false }) => {
  const {
    block,
    fromAccount,
    withdrawalToken: token,
    amount,
    withdrawalFeeToken: feeToken,
    fee,
    data,
    __typename,
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
              <Image src={'/green-tick.svg'} height={20} width={20} />{' '}
              <span className="ml-2">{getDateString(block.timestamp)}</span>
            </div>
          )}
        </td>
      </tr>
      <tr className="border dark:border-loopring-dark-darkBlue">
        <td className="p-2">Transaction Type</td>
        <td>{__typename || 'Withdrawal'}</td>
      </tr>
      <tr className="border dark:border-loopring-dark-darkBlue">
        <td className="p-2">Withdraw Tx</td>
        <td>
          <AppLink path="transaction" isExplorerLink tx={block.txHash} className="break-words">
            {makeExplorerURL(EXPLORER_URL, `tx/${block.txHash}`)}
          </AppLink>
        </td>
      </tr>
      <tr className="border dark:border-loopring-dark-darkBlue">
        <td className="p-2">Amount</td>
        <td>
          {getTokenAmount(amount, token.decimals)} {token.symbol}
        </td>
      </tr>
      <tr className="border dark:border-loopring-dark-darkBlue">
        <td className="p-2">Fee</td>
        <td>
          {getTokenAmount(fee, feeToken.decimals)} {feeToken.symbol}
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

export default Withdrawal;
