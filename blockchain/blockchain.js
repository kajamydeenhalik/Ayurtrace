const crypto = require('crypto');

class Block {
  constructor(index, previousHash, transactionData, timestamp = Date.now()) {
    this.index = index;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.transactionData = transactionData;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    const data = this.index + this.previousHash + this.timestamp + JSON.stringify(this.transactionData);
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
  }

  createGenesisBlock() {
    return new Block(0, '0', { message: 'Genesis Block' });
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(transactionData) {
    const previousBlock = this.getLatestBlock();
    const newBlock = new Block(this.chain.length, previousBlock.hash, transactionData);
    this.chain.push(newBlock);
    return newBlock;
  }
}

module.exports = Blockchain;
