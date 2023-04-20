# Decentralised Autonomous Organisation (DAO)

Here I've created a Decentralised Autonomous Organisation (DAO). A DAO allows people to coordinate over the blockchain in a decentralised voting system. It's an emerging form of legal structure that has no central governing body and whose members share a common goal to act in the best interest of the entity. Popularised through blockchain technology, DAOs are used to make decisions in a bottom-up management approach. It's a way to organise with other people all around the world, without knowing each other, and establish rules and make decisions autonomously. A DAO is run by smart contracts where code is law and can be immutable. This allows for genuine trust because of its transparency.

The example I've built is a treasury that holds cryptocurrency and the token holders (voters) that are part of this DAO are able to vote on a proposal to release cryptocurrency to a certain indivdual. Token holders vote on the proposal inside of the governance contract. The governance contract has its own set of rules, such as the amount of votes required to set the status of the proposal (the quorum) and time locks to allow voters to participate and create regulation.

[See Contract Files](contracts)

<!-- TABLE OF CONTENTS -->

  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#the-associated-contracts">The Associated Contracts</a></li>
    <li><a href="#test-the-dao">Test The DAO</a></li>
  </ol>

### okeh

<!-- TABLE OF CONTENTS -->
<!-- <details> -->
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#the-associated-contracts">The Associated Contracts</a>
      <ol>
        <li><a href="#1-token-contract">Token Contract</a></li>
        <li><a href="#subchapter-2">Subchapter 2</a></li>
        <li><a href="#subchapter-2">Subchapter 2</a></li>
        <li><a href="#subchapter-2">Subchapter 2</a></li>
      </ol>
    </li>
    <li><a href="#test-the-dao">Test The DAO</a></li>
  </ol>
<!-- </details> -->

## The Associated Contracts

### 1. Token Contract

I used an ERC20 token to allow users to vote, this could've been an ERC721 (NFT) token but I chose to use an ERC20 for this project. This is however not the standard ERC20 token typically used for cryptocurrencies as it has a few extra functionality extensions that make it specifically useful for voting. One of the main extra features is being able to create a snapshot of votes, so that voters can't dump their tokens when the voting period is over.

[See Token Contract File](contracts/Token.sol)

### 2. Treasury Contract

This is where the cyptocurrency is stored until the voters give the approval of the proposal for it to be released.

[See Treasury Contract File](contracts/Treasury.sol)

### 3. TimeLock Contract

This controls the delay for the releasing of the funds after the proposal has passed.

[See TimeLock Contract File](contracts/TimeLock.sol)

### 4. Governance Contract

This is the main contract that controls the project. It's the contract that grants the roles of the DAO, created the proposals, shows the state of proposals and sets the proposal deadline & quorum. This is also where users cast their votes and is then able to return the amount of respective votes for each voting category. When a proposal is accepted, the governance contract is also what releases the funds from the treasury.

[See Governance Contract File](contracts/Governance.sol)

## Test The DAO

I've created a test file that is able to test all aspects required for deploying the respective contracts, setting up the DAO governance and monitoring the proposal & voting status from pending through to execution.

To test the DAO using Hardhat, first ensure you have Node.js installed. You can see if you have it installed by using the following command line prompt to see your Node.js version:

```shell
# Command Prompt (Windows)
node -- version

# Terminal (Mac)
node -v
```

If no Node.js version is shown, then it's not installed. Click on the following link for Node.js's download page: [Node.js Download](https://nodejs.org/en/download)

Once you have Node.js installed, you can download or clone this repository and do the following:

```shell
# Install Hardhat:
npm i -D hardhat

# Run this and click enter 4 times:
npx hardhat

# Install dependencies:
npm install --save-dev @nomicfoundation/hardhat-chai-matchers
npm i -D @nomiclabs/hardhat-waffle

# Run the test file using:
npx hardhat test test/dao_test.js
```
