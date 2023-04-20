const { expect } = require("chai");
const { ethers } = require("hardhat");
const { keccak256, toUtf8Bytes } = require("ethers/lib/utils");

describe("DAO Test", async function () {
  it("Deploy Token Contract: Allows Users to Vote With Tokens", async function () {
    console.log("   Deploy Token, TimeLock, Governance & Treasury Contracts");
    [
      this.admin,
      this.proposer,
      this.voter1,
      this.voter2,
      this.voter3,
      this.voter4,
      this.voter5,
    ] = await ethers.getSigners();

    // Set Token Details
    tokenName = "Zar Token";
    tokenSymbol = "ZRT";
    tokenSupply = ethers.utils.parseUnits("1000", 18);

    // Deploy Token & Mint to msg.sender
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy(tokenName, tokenSymbol, tokenSupply);
    this.token = await token.deployed();
  });

  it("Deploy TimeLock Contract: Used For Setting Execution Wait After Proposal Is Passed", async function () {
    // How long do we have to wait until we can execute after a passed proposal
    const minDelay = 0;

    // TimeLock constructor takes: minDelay and 2 address arrays
    // The 1st array contains addresses of those who are allowed to make a proposal.
    // The 2nd array contains addresses of those who are allowed to make executions.
    const TimeLock = await ethers.getContractFactory("TimeLock");
    const timeLock = await TimeLock.deploy(
      minDelay,
      [this.proposer.address],
      [this.admin.address],
      this.admin.address
    );
    this.timeLock = await timeLock.deployed();
  });

  it("Deploy Governance Contract: Used For DAO Management", async function () {
    // Governor constructor: DAO name: "Zar DAO" is already set inside contract
    // GovernorSettings constructor: Voting Delay, Voting Period & Proposal Threshold are already set inside factory
    // GovernorVotes constructor: Takes Token address which is passed in below
    // GovernorVotesQuorumFraction constructor: Quorom of 4% is set inside contract
    // GovernorTimelockControl constructor: TimeLock address is passed in below
    const Governance = await ethers.getContractFactory("Governance");
    const governance = await Governance.deploy(
      this.token.address,
      this.timeLock.address,
      {
        gasLimit: 20000000,
      }
    );
    this.governance = await governance.deployed();
  });

  it("Deploy Treasury Contract: Holds Funds", async function () {
    // Timelock contract will be the owner of our treasury contract.
    // In the provided example, once the proposal is successful and executed,
    // timelock contract will be responsible for calling the function.

    const funds = ethers.utils.parseUnits("25", 18);

    const Treasury = await ethers.getContractFactory("Treasury");
    const treasury = await Treasury.deploy(this.admin.address, {
      value: funds,
    });
    this.treasury = await treasury.deployed();

    await this.treasury.transferOwnership(this.timeLock.address, {
      from: this.admin.address,
    });
  });

  it("Distribute Tokens To Voters", async function () {
    console.log("   Setup The DAO Governance");
    const amountToVoters = ethers.utils.parseUnits("50", 18);

    await this.token.transfer(this.voter1.address, amountToVoters, {
      from: this.admin.address,
    });
    await this.token.transfer(this.voter2.address, amountToVoters, {
      from: this.admin.address,
    });
    await this.token.transfer(this.voter3.address, amountToVoters, {
      from: this.admin.address,
    });
    await this.token.transfer(this.voter4.address, amountToVoters, {
      from: this.admin.address,
    });
    await this.token.transfer(this.voter5.address, amountToVoters, {
      from: this.admin.address,
    });

    expect(await this.token.balanceOf(this.voter1.address)).to.equal(
      amountToVoters
    );
    expect(await this.token.balanceOf(this.voter2.address)).to.equal(
      amountToVoters
    );
    expect(await this.token.balanceOf(this.voter3.address)).to.equal(
      amountToVoters
    );
    expect(await this.token.balanceOf(this.voter4.address)).to.equal(
      amountToVoters
    );
    expect(await this.token.balanceOf(this.voter5.address)).to.equal(
      amountToVoters
    );
  });

  it("Assign Roles Of DAO", async function () {
    // You can view more information about timelock roles from the openzeppelin documentation:
    // --> https://docs.openzeppelin.com/contracts/4.x/api/governance#timelock-proposer
    // --> https://docs.openzeppelin.com/contracts/4.x/api/governance#timelock-admin

    const proposerRole = await this.timeLock.PROPOSER_ROLE();
    const executorRole = await this.timeLock.EXECUTOR_ROLE();

    // TIMELOCK_ADMIN_ROLE is identified by the value: 0x5f58e3a2316349923ce3780f8d587db2d72378aed66a8261c916544fa6846ca5
    // PROPOSER_ROLE is identified by the value: 0xb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc1
    // EXECUTOR_ROLE is identified by the value: 0xd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e63

    await this.timeLock.grantRole(proposerRole, this.governance.address);
    await this.timeLock.grantRole(executorRole, this.governance.address);
  });

  it("Set Delegates Of Vote", async function () {
    await this.token.connect(this.voter1).delegate(this.voter1.address);
    await this.token.connect(this.voter2).delegate(this.voter2.address);
    await this.token.connect(this.voter3).delegate(this.voter3.address);
    await this.token.connect(this.voter4).delegate(this.voter4.address);
    await this.token.connect(this.voter5).delegate(this.voter5.address);
  });

  it("Create Proposal ID That Releases Funds From Treasury", async function () {
    isReleased = await this.treasury.isReleased();
    expect(isReleased).to.equal(false);

    const balance = await ethers.provider.getBalance(this.treasury.address);
    treasuryBalanceInHuman = parseInt(ethers.utils.formatUnits(balance, 18));
    expect(treasuryBalanceInHuman).to.equal(25);

    this.encodedFunction =
      this.treasury.interface.encodeFunctionData("releaseFunds");
    // console.log(this.encodedFunction);
    const description = "Release Funds from Treasury";

    tx = await this.governance
      .connect(this.proposer)
      .propose(
        [this.treasury.address],
        [0],
        [this.encodedFunction],
        description
      );

    const receipt = await tx.wait();
    this.proposalId = receipt.events[0].args.proposalId;
    // console.log(this.proposalId);
  });

  it("Initial State Of Proposal", async function () {
    console.log("   Monitor Voting & Proposal");

    proposalState = await this.governance.state(this.proposalId);
    proposalSnapshot = await this.governance.proposalSnapshot(this.proposalId);
    proposalDeadline = await this.governance.proposalDeadline(this.proposalId);
    // console.log("proposalDeadline", Number(proposalDeadline));

    expect(proposalState).to.equal(0);
    expect(proposalSnapshot.toNumber()).to.be.greaterThan(0);
    expect(proposalDeadline.toNumber()).to.be.greaterThan(
      proposalSnapshot.toNumber()
    );

    // Quorum is the number of votes required to pass, in this case its a percentage
    blockNumber = await ethers.provider.getBlockNumber();
    quorum = await this.governance.quorum(blockNumber - 1);
  });

  it("Cast Votes & Close Out Voting Period", async function () {
    // ProposalStates: Pending (0), Active (1), Canceled (2), Defeated (3), Succeeded (4), Queued (5), Expired (6), Executed (7)
    proposalState = await this.governance.state(this.proposalId);

    expect(proposalState).to.equal(0);

    // VoteIDs: 0 = Against, 1 = For, 2 = Abstain
    await this.governance.connect(this.voter1).castVote(this.proposalId, 1);
    await this.governance.connect(this.voter2).castVote(this.proposalId, 1);
    await this.governance.connect(this.voter3).castVote(this.proposalId, 0);
    await this.governance.connect(this.voter4).castVote(this.proposalId, 2);
    await this.governance.connect(this.voter5).castVote(this.proposalId, 1);

    // NOTE: Transfer serves no purposes, it's just used to fast forward one block after the voting period ends
    amount = ethers.utils.parseUnits("5", 18);
    await this.token
      .connect(this.admin)
      .transfer(this.proposer.address, amount);
  });

  it("Get Vote Counts", async function () {
    // VoteIDs: 0 = Against, 1 = For, 2 = Abstain
    const { againstVotes, forVotes, abstainVotes } =
      await this.governance.proposalVotes(this.proposalId);

    votesAgainst = parseInt(ethers.utils.formatUnits(againstVotes, 18));
    votesFor = parseInt(ethers.utils.formatUnits(forVotes, 18));
    votesAbstained = parseInt(ethers.utils.formatUnits(abstainVotes, 18));

    expect(votesAgainst).to.be.greaterThan(0);
    expect(votesFor).to.be.greaterThan(0);
    expect(votesAbstained).to.be.greaterThan(0);

    // ProposalStates: Pending (0), Active (1), Canceled (2), Defeated (3), Succeeded (4), Queued (5), Expired (6), Executed (7)
    proposalState = await this.governance.state(this.proposalId);

    expect(proposalState).to.equal(4);
  });

  it("Queue & Execute Proposal", async function () {
    // ProposalStates: Pending (0), Active (1), Canceled (2), Defeated (3), Succeeded (4), Queued (5), Expired (6), Executed (7)

    // Queue the proposal for execution
    const hash = keccak256(toUtf8Bytes("Release Funds from Treasury"));
    await this.governance.queue(
      [this.treasury.address],
      [0],
      [this.encodedFunction],
      hash
    );
    proposalState = await this.governance.state(this.proposalId);
    expect(proposalState).to.equal(5);

    // Execute the proposal
    await this.governance.execute(
      [this.treasury.address],
      [0],
      [this.encodedFunction],
      hash
    );
    proposalState = await this.governance.state(this.proposalId);
    expect(proposalState).to.equal(7);
  });

  it("Ensure Proposal Is Released/Executed", async function () {
    isReleased = await this.treasury.isReleased();

    const balance = await ethers.provider.getBalance(this.treasury.address);
    treasuryBalanceInHuman = parseInt(ethers.utils.formatUnits(balance, 18));

    expect(isReleased).to.equal(true);
    expect(treasuryBalanceInHuman).to.equal(0);
  });
});
