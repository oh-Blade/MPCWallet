const blockchainService = require('./blockchainService');
const mpcService = require('./mpcService');
const walletService = require('./walletService');
const { ethers } = require('ethers');
const { v4: uuidv4 } = require('uuid');

class TransactionService {
  constructor() {
    // 存储待处理的交易
    this.pendingTransactions = new Map();
  }

  /**
   * 创建交易
   */
  async createTransaction({ from, to, amount, gasLimit, gasPrice, data, walletId }) {
    try {
      // 验证地址格式
      if (!ethers.isAddress(from) || !ethers.isAddress(to)) {
        throw new Error('无效的地址格式');
      }

      // 验证金额
      if (amount <= 0) {
        throw new Error('无效的转账金额');
      }

      // 获取钱包信息
      const wallet = await walletService.findWalletById(walletId);
      if (!wallet) {
        throw new Error('钱包不存在');
      }

      if (wallet.address !== from) {
        throw new Error('发送地址与钱包地址不匹配');
      }

      // 获取当前 nonce
      const nonce = await blockchainService.getNonce(from);

      // 获取当前 Gas 价格（如果没有指定）
      if (!gasPrice) {
        const feeData = await blockchainService.provider.getFeeData();
        gasPrice = feeData.gasPrice;
      }

      // 估算 Gas 限制（如果没有指定）
      if (!gasLimit) {
        const gasEstimate = await this.estimateGas({ from, to, amount, data });
        gasLimit = gasEstimate.gasEstimate;
      }

      // 创建交易对象
      const transaction = {
        id: uuidv4(),
        from,
        to,
        value: ethers.parseEther(amount.toString()),
        gasLimit: BigInt(gasLimit),
        gasPrice: BigInt(gasPrice.toString()),
        nonce,
        data: data || '0x',
        walletId,
        status: 'created',
        createdAt: new Date().toISOString()
      };

      // 计算交易哈希用于签名
      const txHash = ethers.keccak256(
        ethers.defaultAbiCoder.encode(
          ['address', 'address', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes'],
          [transaction.from, transaction.to, transaction.value, transaction.gasLimit, transaction.gasPrice, transaction.nonce, transaction.data]
        )
      );

      transaction.hash = txHash;
      this.pendingTransactions.set(transaction.id, transaction);

      return {
        transactionId: transaction.id,
        transaction: {
          from: transaction.from,
          to: transaction.to,
          value: ethers.formatEther(transaction.value),
          gasLimit: transaction.gasLimit.toString(),
          gasPrice: transaction.gasPrice.toString(),
          nonce: transaction.nonce,
          data: transaction.data
        },
        hash: txHash,
        estimatedCost: ethers.formatEther(transaction.gasLimit * transaction.gasPrice)
      };
    } catch (error) {
      throw new Error(`创建交易失败: ${error.message}`);
    }
  }

  /**
   * 估算 Gas 费用
   */
  async estimateGas({ from, to, amount, data }) {
    try {
      return await blockchainService.estimateGas({ from, to, value: amount, data });
    } catch (error) {
      throw new Error(`估算 Gas 费用失败: ${error.message}`);
    }
  }

  /**
   * 获取当前 Gas 价格
   */
  async getCurrentGasPrice() {
    try {
      return await blockchainService.getCurrentGasPrice();
    } catch (error) {
      throw new Error(`获取 Gas 价格失败: ${error.message}`);
    }
  }

  /**
   * 初始化 MPC 签名
   */
  async initMPCSigning(transactionId) {
    try {
      const transaction = this.pendingTransactions.get(transactionId);
      if (!transaction) {
        throw new Error('交易不存在');
      }

      // 获取钱包信息
      const wallet = await walletService.findWalletById(transaction.walletId);
      if (!wallet || wallet.type !== 'mpc') {
        throw new Error('无效的 MPC 钱包');
      }

      // 初始化 MPC 签名会话
      const signingResult = await mpcService.startSigning(transaction, {
        threshold: wallet.threshold,
        parties: wallet.participantCount
      });

      transaction.signingSessionId = signingResult.sessionId;
      transaction.status = 'signing';
      transaction.signingStartedAt = new Date().toISOString();

      return {
        transactionId,
        signingSession: signingResult,
        nextSteps: {
          description: '请与其他参与方完成多方签名',
          action: 'complete_mpc_signing',
          sessionId: signingResult.sessionId
        }
      };
    } catch (error) {
      throw new Error(`初始化 MPC 签名失败: ${error.message}`);
    }
  }

  /**
   * 完成 MPC 签名并广播交易
   */
  async completeMPCSigningAndBroadcast(transactionId, signature) {
    try {
      const transaction = this.pendingTransactions.get(transactionId);
      if (!transaction) {
        throw new Error('交易不存在');
      }

      // 构建已签名的交易
      const signedTx = {
        from: transaction.from,
        to: transaction.to,
        value: transaction.value,
        gasLimit: transaction.gasLimit,
        gasPrice: transaction.gasPrice,
        nonce: transaction.nonce,
        data: transaction.data,
        r: signature.r,
        s: signature.s,
        v: signature.v
      };

      // 序列化已签名的交易
      const serializedTx = ethers.Transaction.from(signedTx).serialized;

      // 广播交易
      const txHash = await this.broadcastTransaction(serializedTx);

      // 更新交易状态
      transaction.status = 'broadcasted';
      transaction.broadcastedAt = new Date().toISOString();
      transaction.networkTxHash = txHash;
      transaction.signature = signature;

      return {
        transactionId,
        networkTxHash: txHash,
        status: 'broadcasted',
        message: '交易已成功广播到网络'
      };
    } catch (error) {
      throw new Error(`完成签名并广播交易失败: ${error.message}`);
    }
  }

  /**
   * 广播已签名的交易
   */
  async broadcastTransaction(signedTransaction) {
    try {
      return await blockchainService.broadcastTransaction(signedTransaction);
    } catch (error) {
      throw new Error(`广播交易失败: ${error.message}`);
    }
  }

  /**
   * 获取交易状态
   */
  async getTransactionStatus(txHash) {
    try {
      return await blockchainService.getTransactionStatus(txHash);
    } catch (error) {
      throw new Error(`获取交易状态失败: ${error.message}`);
    }
  }

  /**
   * 获取交易历史
   */
  async getTransactionHistory(address, page = 1, limit = 20) {
    try {
      return await blockchainService.getTransactionHistory(address, page, limit);
    } catch (error) {
      throw new Error(`获取交易历史失败: ${error.message}`);
    }
  }

  /**
   * 获取交易详情
   */
  async getTransactionDetail(txHash) {
    try {
      const tx = await blockchainService.provider.getTransaction(txHash);
      if (!tx) {
        return null;
      }

      return await blockchainService.formatTransaction(tx);
    } catch (error) {
      throw new Error(`获取交易详情失败: ${error.message}`);
    }
  }

  /**
   * 取消交易
   */
  async cancelTransaction({ originalTxHash, newGasPrice, walletId }) {
    try {
      // 获取原始交易
      const originalTx = await blockchainService.provider.getTransaction(originalTxHash);
      if (!originalTx) {
        throw new Error('原始交易不存在');
      }

      // 检查交易是否已经确认
      const receipt = await blockchainService.provider.getTransactionReceipt(originalTxHash);
      if (receipt) {
        throw new Error('交易已经确认，无法取消');
      }

      // 创建取消交易（发送给自己，使用相同的 nonce 但更高的 gas 价格）
      const wallet = await walletService.findWalletById(walletId);
      if (!wallet) {
        throw new Error('钱包不存在');
      }

      const cancelTx = await this.createTransaction({
        from: wallet.address,
        to: wallet.address,
        amount: 0, // 发送 0 ETH 给自己
        gasLimit: 21000, // 标准转账的 gas 限制
        gasPrice: BigInt(newGasPrice),
        walletId
      });

      // 设置相同的 nonce
      const transaction = this.pendingTransactions.get(cancelTx.transactionId);
      transaction.nonce = originalTx.nonce;
      transaction.type = 'cancel';
      transaction.originalTxHash = originalTxHash;

      return cancelTx;
    } catch (error) {
      throw new Error(`取消交易失败: ${error.message}`);
    }
  }

  /**
   * 加速交易
   */
  async speedUpTransaction({ originalTxHash, newGasPrice }) {
    try {
      // 获取原始交易
      const originalTx = await blockchainService.provider.getTransaction(originalTxHash);
      if (!originalTx) {
        throw new Error('原始交易不存在');
      }

      // 检查交易是否已经确认
      const receipt = await blockchainService.provider.getTransactionReceipt(originalTxHash);
      if (receipt) {
        throw new Error('交易已经确认，无法加速');
      }

      // 创建加速交易（相同的交易但更高的 gas 价格）
      const speedUpTx = await this.createTransaction({
        from: originalTx.from,
        to: originalTx.to,
        amount: parseFloat(ethers.formatEther(originalTx.value)),
        gasLimit: originalTx.gasLimit.toString(),
        gasPrice: BigInt(newGasPrice),
        data: originalTx.data,
        walletId: null // 需要从钱包服务中找到对应的钱包
      });

      // 设置相同的 nonce
      const transaction = this.pendingTransactions.get(speedUpTx.transactionId);
      transaction.nonce = originalTx.nonce;
      transaction.type = 'speedup';
      transaction.originalTxHash = originalTxHash;

      return speedUpTx;
    } catch (error) {
      throw new Error(`加速交易失败: ${error.message}`);
    }
  }

  /**
   * 获取待处理的交易
   */
  getPendingTransaction(transactionId) {
    return this.pendingTransactions.get(transactionId);
  }

  /**
   * 更新交易状态
   */
  updateTransactionStatus(transactionId, status, additionalData = {}) {
    const transaction = this.pendingTransactions.get(transactionId);
    if (transaction) {
      transaction.status = status;
      transaction.updatedAt = new Date().toISOString();
      Object.assign(transaction, additionalData);
    }
  }

  /**
   * 清理已完成的交易
   */
  cleanupCompletedTransactions() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    for (const [id, transaction] of this.pendingTransactions.entries()) {
      const transactionTime = new Date(transaction.createdAt).getTime();
      
      // 删除一小时前的已完成交易
      if (
        (transaction.status === 'confirmed' || transaction.status === 'failed') &&
        now - transactionTime > oneHour
      ) {
        this.pendingTransactions.delete(id);
      }
    }
  }

  /**
   * 批量获取交易状态更新
   */
  async updatePendingTransactionStatuses() {
    const updates = [];
    
    for (const [id, transaction] of this.pendingTransactions.entries()) {
      if (transaction.networkTxHash && transaction.status === 'broadcasted') {
        try {
          const status = await this.getTransactionStatus(transaction.networkTxHash);
          if (status.status !== 'pending') {
            this.updateTransactionStatus(id, status.status, {
              blockNumber: status.blockNumber,
              gasUsed: status.gasUsed,
              confirmations: status.confirmations
            });
            
            updates.push({
              transactionId: id,
              networkTxHash: transaction.networkTxHash,
              status: status.status,
              blockNumber: status.blockNumber
            });
          }
        } catch (error) {
          console.warn(`更新交易 ${id} 状态失败:`, error.message);
        }
      }
    }

    return updates;
  }
}

module.exports = new TransactionService();
