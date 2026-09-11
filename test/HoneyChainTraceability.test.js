import { expect } from 'chai';

// In Hardhat 3, ethers is available globally via hre when running tests
const BATCH_ID   = 'HC-TN-2026-000001';
const DATA_HASH  = () => ethers.keccak256(ethers.toUtf8Bytes('canonical-batch-data'));
const EVENT_HASH = () => ethers.keccak256(ethers.toUtf8Bytes('canonical-event-data'));

describe('HoneyChainTraceability', function () {
  let contract;
  let owner;
  let unauthorized;

  beforeEach(async function () {
    [owner, unauthorized] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory('HoneyChainTraceability');
    contract = await Factory.deploy();
    await contract.waitForDeployment();
  });

  // ─── 1. Deployment ────────────────────────────────────────────────────────

  describe('Deployment', function () {
    it('sets the deployer as owner', async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });
  });

  // ─── 2. createBatchProof ─────────────────────────────────────────────────

  describe('createBatchProof', function () {
    it('creates proof from owner and emits BatchProofCreated', async function () {
      const hash = DATA_HASH();
      await expect(contract.createBatchProof(BATCH_ID, hash))
        .to.emit(contract, 'BatchProofCreated');

      const proof = await contract.getBatchProof(BATCH_ID);
      expect(proof.dataHash).to.equal(hash);
      expect(proof.creator).to.equal(owner.address);
      expect(proof.exists).to.be.true;
    });

    it('rejects proof from unauthorized address', async function () {
      await expect(
        contract.connect(unauthorized).createBatchProof(BATCH_ID, DATA_HASH())
      ).to.be.revertedWith('HoneyChain: caller is not the owner');
    });

    it('rejects duplicate batch proof', async function () {
      await contract.createBatchProof(BATCH_ID, DATA_HASH());
      await expect(
        contract.createBatchProof(BATCH_ID, DATA_HASH())
      ).to.be.revertedWith('HoneyChain: batch proof already exists');
    });

    it('rejects empty batchId', async function () {
      await expect(
        contract.createBatchProof('', DATA_HASH())
      ).to.be.revertedWith('HoneyChain: batchId cannot be empty');
    });

    it('rejects zero dataHash', async function () {
      await expect(
        contract.createBatchProof(BATCH_ID, ethers.ZeroHash)
      ).to.be.revertedWith('HoneyChain: dataHash cannot be zero');
    });

    it('auto-adds BATCH_CREATED as first event', async function () {
      await contract.createBatchProof(BATCH_ID, DATA_HASH());
      const count = await contract.getBatchEventCount(BATCH_ID);
      expect(count).to.equal(1n);
      const events = await contract.getBatchEvents(BATCH_ID);
      expect(events.eventTypes[0]).to.equal('BATCH_CREATED');
    });
  });

  // ─── 3. addTraceabilityEvent ──────────────────────────────────────────────

  describe('addTraceabilityEvent', function () {
    beforeEach(async function () {
      await contract.createBatchProof(BATCH_ID, DATA_HASH());
    });

    it('appends an event from owner', async function () {
      const hash = EVENT_HASH();
      await expect(
        contract.addTraceabilityEvent(BATCH_ID, 'LAB_VERIFIED', hash)
      ).to.emit(contract, 'TraceabilityEventAdded');

      const events = await contract.getBatchEvents(BATCH_ID);
      expect(events.eventTypes[1]).to.equal('LAB_VERIFIED');
      expect(events.dataHashes[1]).to.equal(hash);
    });

    it('rejects event from unauthorized address', async function () {
      await expect(
        contract.connect(unauthorized).addTraceabilityEvent(BATCH_ID, 'LAB_VERIFIED', EVENT_HASH())
      ).to.be.revertedWith('HoneyChain: caller is not the owner');
    });

    it('rejects event for non-existent batch', async function () {
      await expect(
        contract.addTraceabilityEvent('NON-EXISTENT', 'LAB_VERIFIED', EVENT_HASH())
      ).to.be.revertedWith('HoneyChain: batch proof does not exist');
    });

    it('is append-only — multiple events accumulate', async function () {
      await contract.addTraceabilityEvent(BATCH_ID, 'LAB_SUBMITTED', EVENT_HASH());
      await contract.addTraceabilityEvent(BATCH_ID, 'LAB_VERIFIED', EVENT_HASH());
      await contract.addTraceabilityEvent(BATCH_ID, 'SELLER_VERIFIED', EVENT_HASH());

      const count = await contract.getBatchEventCount(BATCH_ID);
      expect(count).to.equal(4n); // BATCH_CREATED + 3 added

      const events = await contract.getBatchEvents(BATCH_ID);
      expect(events.eventTypes[1]).to.equal('LAB_SUBMITTED');
      expect(events.eventTypes[2]).to.equal('LAB_VERIFIED');
      expect(events.eventTypes[3]).to.equal('SELLER_VERIFIED');
    });
  });

  // ─── 4. verifyBatchHash ───────────────────────────────────────────────────

  describe('verifyBatchHash — tamper detection', function () {
    it('returns (true, true) when hash matches — VERIFIED', async function () {
      const hash = DATA_HASH();
      await contract.createBatchProof(BATCH_ID, hash);
      const [matches, exists] = await contract.verifyBatchHash(BATCH_ID, hash);
      expect(matches).to.be.true;
      expect(exists).to.be.true;
    });

    it('returns (false, true) when hash differs — INTEGRITY_MISMATCH', async function () {
      await contract.createBatchProof(BATCH_ID, DATA_HASH());
      const tampered = ethers.keccak256(ethers.toUtf8Bytes('TAMPERED-quantity-changed'));
      const [matches, exists] = await contract.verifyBatchHash(BATCH_ID, tampered);
      expect(matches).to.be.false;
      expect(exists).to.be.true;
    });

    it('returns (false, false) when proof does not exist — NO_PROOF', async function () {
      const [matches, exists] = await contract.verifyBatchHash('NON-EXISTENT', DATA_HASH());
      expect(matches).to.be.false;
      expect(exists).to.be.false;
    });
  });

  // ─── 5. transferOwnership ────────────────────────────────────────────────

  describe('transferOwnership', function () {
    it('transfers ownership from owner', async function () {
      await contract.transferOwnership(unauthorized.address);
      expect(await contract.owner()).to.equal(unauthorized.address);
    });

    it('rejects transfer from non-owner', async function () {
      await expect(
        contract.connect(unauthorized).transferOwnership(unauthorized.address)
      ).to.be.revertedWith('HoneyChain: caller is not the owner');
    });

    it('rejects zero address as new owner', async function () {
      await expect(
        contract.transferOwnership(ethers.ZeroAddress)
      ).to.be.revertedWith('HoneyChain: new owner is zero address');
    });
  });
});
