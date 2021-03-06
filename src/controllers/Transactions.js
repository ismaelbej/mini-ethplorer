import _ from 'lodash';
import {
  getBlock, getCode, getTransaction, getTransactionReceipt,
} from '../lib/ethereum';
import { decodeLogs, decodeFunction } from './Contracts';

function formatTransaction(transaction, receipt, block, code) {
  if (!transaction) {
    return {};
  }
  return {
    ...transaction,
    block,
    receipt: receipt
      ? {
        ...receipt,
        logsDecoded: decodeLogs(receipt.logs),
      }
      : undefined,
    code: typeof code !== 'undefined' ? true : false,
    inputDecoded: decodeFunction(transaction.input),
  };
}

export async function getTransactionInfo(txid) {
  const [tx, receipt] = await Promise.all([getTransaction(txid), getTransactionReceipt(txid)]);
  const block = receipt ? await getBlock(receipt.blockHash) : undefined;
  const code = tx && tx.to ? await getCode(tx.to) : undefined;
  return formatTransaction(tx, receipt, block, code);
}

async function listBlockTransactions(blockId) {
  const block = await getBlock(blockId);
  return Promise.all(block.transactions.map(async txid => {
    const transaction = await getTransaction(txid);
    if (transaction) {
      const receipt = await getTransactionReceipt(transaction.hash);
      const code = transaction.to ? await getCode(transaction.to) : undefined;
      return formatTransaction(transaction, receipt, block, code);
    }
    return undefined;
  }));
}

export async function listTransactions(start, count) {
  const range = _.range(start, _.max([-1, start - count]), -1);
  const blockTransactions = await Promise.all(range.map(listBlockTransactions));
  return _.filter(_.flatten(blockTransactions), tx => typeof tx !== 'undefined');
}

export default {
  getTransactionInfo,
  listTransactions,
};
