import React from 'react';

import { getCSVTransactionDetailFields } from '../components/transactionDetail/TransactionTableDetails';
import getDateString from '../utils/getDateString';
import { OrderDirection, Transaction_OrderBy, useTransactionsLazyQuery } from '../generated/loopringExplorer';

const useDownloadCSV = (accountIdFilter: Array<string>) => {
  const [showDownloadModal, setShowDownloadModal] = React.useState<boolean>(false);
  const [showDownloadButton, setShowDownloadButton] = React.useState<boolean>(false);

  const [fetchTxs] = useTransactionsLazyQuery({
    variables: {
      first: 50,
      orderBy: Transaction_OrderBy.InternalId,
      orderDirection: OrderDirection.Desc,
      where: {
        accounts_contains: accountIdFilter,
      },
    },
    fetchPolicy: 'no-cache',
  });

  const getAllTransactions = async (txs: Array<any>, afterCursor: string | null) => {
    const { data: fetchMoreData } = await fetchTxs({
      variables: {
        where: {
          accounts_contains: accountIdFilter,
          internalID_lt: afterCursor,
        },
      },
      fetchPolicy: 'no-cache',
    });

    if (fetchMoreData && fetchMoreData.transactions.length > 0) {
      txs = [...txs, ...fetchMoreData.transactions];
      return getAllTransactions(txs, fetchMoreData.transactions[fetchMoreData.transactions.length - 1].internalID);
    }

    return txs;
  };

  const makeCSV = async (transactions) => {
    const csv = ['Tx ID,Type,From,To,Pair,Side,Amount,Price,Total,Fee,Verified At'];
    transactions.forEach((tx) => {
      const loopringTxExplorerLink = `https://${window.location.host}/tx/${tx.id}`;
      csv.push(
        [
          `"=HYPERLINK(""${loopringTxExplorerLink}"",""${tx.id}"")"`,
          tx.__typename,
          ...getCSVTransactionDetailFields(tx),
          getDateString(tx.block.timestamp),
        ].join(',')
      );
    });

    const csvFile = new Blob([csv.join('\n')], { type: 'text/csv' });

    // Download link
    const downloadLink = document.getElementById('csv-download') as HTMLAnchorElement;

    if (!downloadLink) {
      window.open(URL.createObjectURL(csvFile));
      return;
    }

    // File name
    downloadLink.download = 'transactions';

    // We have to create a link to the file
    downloadLink.href = URL.createObjectURL(csvFile);
  };

  const downloadCSV = async () => {
    setShowDownloadModal(true);
    const { data } = await fetchTxs();
    let txs = [...data.transactions];
    const afterCursor = data.transactions[data.transactions.length - 1].internalID;
    txs = await getAllTransactions(txs, afterCursor);
    await makeCSV(txs);
    setShowDownloadButton(true);
  };

  const closeModal = () => setShowDownloadModal(false);

  return {
    downloadCSV,
    showDownloadModal,
    showDownloadButton,
    closeModal,
  };
};

export default useDownloadCSV;
