import React, { useEffect, useState } from 'react';

import AppLink from '../../components/AppLink';
import Transactions from '../../components/Transactions';

import getDateString from '../../utils/getDateString';
import getTrimmedTxHash from '../../utils/getTrimmedTxHash';
import AccountTokenBalances from '../../components/accountDetail/AccountTokenBalances';
import TabbedView from '../../components/TabbedView';
import AccountNFTs from '../../components/accountDetail/AccountNFTs';
import { useAccountsQuery } from '../../generated/loopringExplorer';
import { NextRouter, useRouter } from 'next/router';
import { EXPLORER_CONFIG, EXPLORER_NETWORK } from '../../utils/config';
import { getAccountLayer2Balances, getLayer2Account } from '../../utils/accountAPI';

interface AccountDetailsProps {
  accountId: string;
  address: string;
  createdAtTransaction: {
    id: string;
    block: {
      timestamp: number;
    };
  } | undefined;
  __typename: string | undefined;
  currentTab: number;
  setCurrentTab: (tab: number) => void;
  id: string;
  router: NextRouter;
}

export const AccountDetails: React.FC<AccountDetailsProps> = ({
  accountId,
  address,
  createdAtTransaction,
  __typename,
  currentTab,
  setCurrentTab,
  id,
  router,
}) => {
  return (
    <div className="bg-white dark:bg-loopring-dark-background rounded p-4 min-h-table">
      <h1 className="text-3xl mb-5">Account #{accountId}</h1>
      <div className="border dark:border-loopring-dark-darkBlue rounded w-full mb-10 overflow-auto">
        <table className="w-full table-auto table-fixed">
          <tbody>
            <tr className="border dark:border-loopring-dark-darkBlue">
              <td className="p-2 lg:w-1/5 whitespace-nowrap">L1 Address</td>
              <td>
                <AppLink path="account" accountId={address} isExplorerLink address={address}>
                  <span className="flex items-center break-all">
                    <span className="hidden lg:block">{address}</span>
                    <span className="lg:hidden">{getTrimmedTxHash(address, 7)}</span>
                  </span>
                </AppLink>
              </td>
            </tr>
            <tr className="border dark:border-loopring-dark-darkBlue">
              <td className="p-2 w-1/5">Account Type</td>
              <td>{__typename ? __typename : '--'}</td>
            </tr>
            <tr className="border dark:border-loopring-dark-darkBlue">
              <td className="p-2 w-1/5">Created at</td>
              {createdAtTransaction ? (
                <td>
                  Tx{' '}
                  <AppLink path="transaction" tx={createdAtTransaction?.id}>
                    <span className="font-bold dark:text-white">#{createdAtTransaction?.id}</span>
                  </AppLink>
                  &nbsp;at {createdAtTransaction && getDateString(createdAtTransaction.block.timestamp)}
                </td>
              ) : (
                <td>--</td>
              )}
            </tr>
          </tbody>
        </table>
      </div>
      <TabbedView
        key={accountId as string}
        tabs={[
          {
            title: 'Token Balances',
            view: <AccountTokenBalances accountId={accountId} />,
          },
          ...(EXPLORER_CONFIG.SHOW_ACCOUNT_NFTS
            ? [
                {
                  title: 'NFTs',
                  view: <AccountNFTs accountId={accountId} />,
                },
              ]
            : []),
        ]}
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 0) {
            router.push(`/account/${id}`);
          } else {
            router.push(`/account/${id}-nfts`);
          }
        }}
      />
      {EXPLORER_CONFIG.SHOW_ACCOUNT_TXS && (
        <div className="pt-8 pb-4">
          <Transactions
            accountIdFilter={[accountId]}
            title={<h2 className="text-2xl font-semibold">Transactions in account #{accountId}</h2>}
          />
        </div>
      )}
    </div>
  );
};

type WhereFilter = {
  address?: string;
  id?: string;
};

const Account: React.FC<{}> = () => {
  const router = useRouter();
  const rawId = router.query.id;
  const list = (rawId as string)?.split('-');
  const id = list ? list[0] : undefined;
  const isNFT = list ? list[1] === 'nfts' : false;

  const whereFilter: WhereFilter = {};
  if (id && (id as string).startsWith('0x')) {
    whereFilter.address = (id as string).toLowerCase();
  } else {
    whereFilter.id = id as string;
  }

  const { data } = useAccountsQuery({
    variables: {
      where: whereFilter,
      first: 1,
    },
    skip: !id,
  });
  const [currentTab, setCurrentTab] = React.useState(0);
  useEffect(() => {
    setCurrentTab(isNFT ? 1 : 0);
  }, [isNFT]);

  if (!data || !data.accounts) {
    return null;
  }

  if (data.accounts.length === 0) {
    return (
      <div className="text-gray-400 dark:text-white text-2xl h-40 flex items-center justify-center w-full border">
        No account found
      </div>
    );
  }

  const {
    address,
    createdAtTransaction,
    __typename,
    id: accountId,
  } = (data.accounts.length > 0 && data.accounts[0]) || {};

  return (
    <AccountDetails
      accountId={accountId}
      address={address}
      createdAtTransaction={createdAtTransaction}
      __typename={__typename}
      currentTab={currentTab}
      setCurrentTab={setCurrentTab}
      id={id}
      router={router}
    />
  );
};

const AccountTaiko: React.FC<{}> = () => {
  const [state, setState] = useState<{
    address: string | undefined;
  }>();
  const router = useRouter();
  const rawId = router.query.id;
  const list = (rawId as string)?.split('-');
  const id = list ? list[0] : undefined;
  useEffect(() => {
    (async () => {
      if (id && Number(id)) {
        const account = await getLayer2Account(Number(id));
        const accountBalances = await getAccountLayer2Balances(Number(id));
        setState({
          address: account.owner,
        });
      }
    })();
  }, [id]);
  return (
    <AccountDetails
      accountId="1"
      address={state?.address ?? ''}
      createdAtTransaction={undefined}
      __typename={undefined}
      currentTab={0}
      setCurrentTab={() => {}}
      id="1"
      router={useRouter()}
    />
  );
};

export default EXPLORER_NETWORK === 'TAIKO' ? AccountTaiko : Account;
