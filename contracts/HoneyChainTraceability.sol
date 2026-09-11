// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title HoneyChainTraceability
 * @notice Immutable proof and traceability layer for HoneyChain honey batches.
 *
 * Architecture:
 *   PostgreSQL  ← primary application database
 *   This contract ← immutable proof that key records have NOT been tampered with
 *
 * Only the authorized backend wallet (owner) can write proofs.
 * Anyone (customers) can read and verify proofs without a wallet.
 *
 * Customers do NOT need ETH or a wallet — verification is done
 * server-side by the backend and the result is served via the REST API.
 */
contract HoneyChainTraceability {

    // ─── Structs ────────────────────────────────────────────────────────────

    struct BatchProof {
        string  batchId;        // e.g. "HC-TN-2026-000001"
        bytes32 dataHash;       // SHA-256 of canonical batch data
        uint256 createdAt;      // block.timestamp
        address creator;        // backend wallet address
        bool    exists;
    }

    struct TraceabilityEvent {
        string  eventType;      // e.g. "HARVESTED", "LAB_VERIFIED"
        bytes32 dataHash;       // SHA-256 of canonical event data
        uint256 timestamp;      // block.timestamp
        address actor;          // backend wallet address
    }

    // ─── State ──────────────────────────────────────────────────────────────

    address public owner;

    // batchId string → BatchProof
    mapping(string => BatchProof) private batchProofs;

    // batchId string → array of events (append-only)
    mapping(string => TraceabilityEvent[]) private batchEvents;

    // ─── Events ─────────────────────────────────────────────────────────────

    event BatchProofCreated(
        string indexed batchId,
        bytes32 dataHash,
        address indexed creator,
        uint256 timestamp
    );

    event TraceabilityEventAdded(
        string indexed batchId,
        string eventType,
        bytes32 dataHash,
        address indexed actor,
        uint256 timestamp
    );

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    // ─── Modifiers ──────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "HoneyChain: caller is not the owner");
        _;
    }

    modifier batchExists(string calldata batchId) {
        require(batchProofs[batchId].exists, "HoneyChain: batch proof does not exist");
        _;
    }

    modifier batchNotExists(string calldata batchId) {
        require(!batchProofs[batchId].exists, "HoneyChain: batch proof already exists");
        _;
    }

    // ─── Constructor ────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    // ─── Write Functions (onlyOwner) ─────────────────────────────────────────

    /**
     * @notice Create an immutable proof for a honey batch.
     * @param batchId   The canonical batch ID from PostgreSQL (e.g. "HC-TN-2026-000001")
     * @param dataHash  SHA-256 hash of the canonical batch data (as bytes32)
     */
    function createBatchProof(
        string calldata batchId,
        bytes32 dataHash
    ) external onlyOwner batchNotExists(batchId) {
        require(bytes(batchId).length > 0, "HoneyChain: batchId cannot be empty");
        require(dataHash != bytes32(0), "HoneyChain: dataHash cannot be zero");

        batchProofs[batchId] = BatchProof({
            batchId:   batchId,
            dataHash:  dataHash,
            createdAt: block.timestamp,
            creator:   msg.sender,
            exists:    true
        });

        // Also record as first traceability event
        batchEvents[batchId].push(TraceabilityEvent({
            eventType: "BATCH_CREATED",
            dataHash:  dataHash,
            timestamp: block.timestamp,
            actor:     msg.sender
        }));

        emit BatchProofCreated(batchId, dataHash, msg.sender, block.timestamp);
    }

    /**
     * @notice Append an immutable traceability event to an existing batch.
     * @param batchId   The canonical batch ID
     * @param eventType Event type string (e.g. "LAB_VERIFIED", "SELLER_VERIFIED")
     * @param dataHash  SHA-256 hash of the canonical event data
     */
    function addTraceabilityEvent(
        string calldata batchId,
        string calldata eventType,
        bytes32 dataHash
    ) external onlyOwner batchExists(batchId) {
        require(bytes(eventType).length > 0, "HoneyChain: eventType cannot be empty");
        require(dataHash != bytes32(0), "HoneyChain: dataHash cannot be zero");

        batchEvents[batchId].push(TraceabilityEvent({
            eventType: eventType,
            dataHash:  dataHash,
            timestamp: block.timestamp,
            actor:     msg.sender
        }));

        emit TraceabilityEventAdded(batchId, eventType, dataHash, msg.sender, block.timestamp);
    }

    // ─── Read Functions (public) ──────────────────────────────────────────────

    /**
     * @notice Get the initial proof for a batch.
     * @return dataHash   The stored SHA-256 hash
     * @return createdAt  Block timestamp when proof was created
     * @return creator    Backend wallet address that created the proof
     * @return exists     Whether a proof exists for this batch
     */
    function getBatchProof(string calldata batchId)
        external
        view
        returns (
            bytes32 dataHash,
            uint256 createdAt,
            address creator,
            bool    exists
        )
    {
        BatchProof storage proof = batchProofs[batchId];
        return (proof.dataHash, proof.createdAt, proof.creator, proof.exists);
    }

    /**
     * @notice Get all traceability events for a batch.
     * @return eventTypes Array of event type strings
     * @return dataHashes Array of corresponding data hashes
     * @return timestamps Array of corresponding block timestamps
     */
    function getBatchEvents(string calldata batchId)
        external
        view
        returns (
            string[]  memory eventTypes,
            bytes32[] memory dataHashes,
            uint256[] memory timestamps
        )
    {
        TraceabilityEvent[] storage events = batchEvents[batchId];
        uint256 len = events.length;

        eventTypes = new string[](len);
        dataHashes = new bytes32[](len);
        timestamps = new uint256[](len);

        for (uint256 i = 0; i < len; i++) {
            eventTypes[i] = events[i].eventType;
            dataHashes[i] = events[i].dataHash;
            timestamps[i] = events[i].timestamp;
        }
        return (eventTypes, dataHashes, timestamps);
    }

    /**
     * @notice Get the total number of events for a batch.
     */
    function getBatchEventCount(string calldata batchId)
        external
        view
        returns (uint256)
    {
        return batchEvents[batchId].length;
    }

    /**
     * @notice Verify whether a given hash matches the stored proof.
     * @param batchId     The canonical batch ID
     * @param hashToCheck The SHA-256 hash to compare against stored proof
     * @return matches    True if hashes match, false otherwise
     * @return proofExists True if a proof exists for this batch
     */
    function verifyBatchHash(
        string calldata batchId,
        bytes32 hashToCheck
    ) external view returns (bool matches, bool proofExists) {
        BatchProof storage proof = batchProofs[batchId];
        if (!proof.exists) {
            return (false, false);
        }
        return (proof.dataHash == hashToCheck, true);
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    /**
     * @notice Transfer ownership to a new authorized backend wallet.
     * @param newOwner The address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "HoneyChain: new owner is zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
