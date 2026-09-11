import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck, ShieldAlert, ShieldOff, Shield, Loader2,
  ExternalLink, Hash, Clock, User, Package, FlaskConical,
  ChevronRight, Copy, CheckCircle2, AlertTriangle, Wifi, WifiOff
} from 'lucide-react';
import { blockchain, batches } from '../services/api';
import { useApp } from '../context/AppContext';

// ─── Status config ──────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  VERIFIED: {
    icon: ShieldCheck,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    label: 'Blockchain Integrity Verified',
    desc: 'The data stored in this system matches the immutable blockchain proof. This honey batch has not been tampered with.',
  },
  INTEGRITY_MISMATCH: {
    icon: ShieldAlert,
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/30',
    label: 'Integrity Verification Failed',
    desc: 'The current data does NOT match the blockchain proof. This may indicate the record was modified after it was anchored.',
  },
  NO_PROOF: {
    icon: Shield,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
    label: 'No Blockchain Proof Available',
    desc: 'This batch has not yet been anchored on the blockchain. The blockchain proof may still be processing.',
  },
  BLOCKCHAIN_UNAVAILABLE: {
    icon: WifiOff,
    color: 'text-slate-400',
    bg: 'bg-slate-500/10 border-slate-500/30',
    label: 'Blockchain Verification Unavailable',
    desc: 'The blockchain verification service is currently unavailable. The batch data may still be valid — please try again later.',
  },
};

// ─── Helper components ──────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} className="ml-2 text-slate-400 hover:text-amber-400 transition-colors">
      {copied ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
    </button>
  );
}

function HashDisplay({ label, value, explorerUrl }) {
  if (!value) return null;
  const short = `${value.substring(0, 10)}...${value.substring(value.length - 8)}`;
  return (
    <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
      <div className="text-xs text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
        <Hash size={11} /> {label}
      </div>
      <div className="flex items-center gap-2 font-mono text-sm text-amber-300 break-all">
        <span className="hidden sm:inline">{value}</span>
        <span className="sm:hidden">{short}</span>
        <CopyButton text={value} />
        {explorerUrl && (
          <a
            href={`${explorerUrl}${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-amber-400 transition-colors ml-auto"
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────
export default function VerifyBatch() {
  const { batchId } = useParams();
  const { t } = useApp();

  const [loading, setLoading]         = useState(true);
  const [batchData, setBatchData]     = useState(null);
  const [verification, setVerification] = useState(null);
  const [proof, setProof]             = useState(null);
  const [error, setError]             = useState(null);
  const [checkedAt, setCheckedAt]     = useState(null);

  // Explorer base URL from env — don't hardcode
  const explorerBase = import.meta.env.VITE_BLOCKCHAIN_EXPLORER_URL || '';

  useEffect(() => {
    if (!batchId) return;
    loadVerification();
  }, [batchId]);

  async function loadVerification() {
    setLoading(true);
    setError(null);
    try {
      // Load batch data and blockchain verification in parallel
      const [batchRes, verifyRes, proofRes] = await Promise.all([
        batches.traceability(batchId).catch(() => null),
        blockchain.verify(batchId).catch((e) => ({ verification: 'BLOCKCHAIN_UNAVAILABLE', error: e.message })),
        blockchain.getProof(batchId).catch(() => null),
      ]);

      if (!batchRes) {
        setError('Batch not found. Please check the batch ID and try again.');
        return;
      }

      setBatchData(batchRes);
      setVerification(verifyRes);
      setProof(proofRes);
      setCheckedAt(verifyRes?.checkedAt || new Date().toISOString());
    } catch (err) {
      setError(err.message || 'Failed to load verification data.');
    } finally {
      setLoading(false);
    }
  }

  const status = verification?.verification || 'BLOCKCHAIN_UNAVAILABLE';
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.BLOCKCHAIN_UNAVAILABLE;
  const StatusIcon = statusCfg.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <Shield size={14} /> HoneyChain Blockchain Verification
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Batch Verification</h1>
          <p className="text-slate-400 text-sm">
            Cryptographic proof that this honey's records have not been altered since creation.
          </p>
          <div className="mt-3 font-mono text-amber-400 text-lg font-bold">{batchId}</div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
            <p className="text-slate-400 text-sm">Checking blockchain verification...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
            <ShieldOff className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-red-400 font-semibold text-lg mb-2">Batch Not Found</h2>
            <p className="text-slate-400 text-sm mb-6">{error}</p>
            <Link to="/traceability" className="text-amber-400 hover:text-amber-300 text-sm transition-colors">
              ← Try the Traceability page
            </Link>
          </div>
        )}

        {/* Results */}
        {!loading && !error && batchData && (
          <div className="space-y-4">

            {/* ── Blockchain Verification Status ─────────── */}
            <div className={`rounded-2xl p-6 border ${statusCfg.bg}`}>
              <div className="flex items-start gap-4">
                <StatusIcon className={`w-10 h-10 ${statusCfg.color} shrink-0 mt-0.5`} />
                <div>
                  <h2 className={`text-lg font-bold ${statusCfg.color}`}>{statusCfg.label}</h2>
                  <p className="text-slate-300 text-sm mt-1 leading-relaxed">{statusCfg.desc}</p>
                </div>
              </div>

              {/* Hash comparison */}
              {verification?.currentHash && verification?.storedHash && (
                <div className="mt-5 grid grid-cols-1 gap-3">
                  <div className="bg-black/30 rounded-xl p-3 text-xs font-mono">
                    <div className="text-slate-500 mb-1">Current data hash (recalculated now)</div>
                    <div className="text-slate-200 break-all">{verification.currentHash}</div>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3 text-xs font-mono">
                    <div className="text-slate-500 mb-1">Stored blockchain hash (immutable)</div>
                    <div className={`break-all ${status === 'VERIFIED' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {/* Convert 0x bytes32 to hex for display */}
                      {verification.storedHash}
                    </div>
                  </div>
                </div>
              )}

              {checkedAt && (
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                  <Clock size={12} />
                  Verified at {new Date(checkedAt).toLocaleString()}
                </div>
              )}
            </div>

            {/* ── Batch Info ────────────────────────────── */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Package size={16} className="text-amber-400" /> Batch Information
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Batch ID',    value: batchData.batch?.batch_id },
                  { label: 'Product',     value: batchData.batch?.product_name },
                  { label: 'Quantity',    value: batchData.batch?.quantity ? `${batchData.batch.quantity} ${batchData.batch.unit || 'kg'}` : null },
                  { label: 'Harvest',     value: batchData.batch?.harvest_date ? new Date(batchData.batch.harvest_date).toLocaleDateString() : null },
                  { label: 'Farm',        value: batchData.batch?.farm_name },
                  { label: 'Batch Status', value: batchData.batch?.batch_status },
                ].map(({ label, value }) =>
                  value ? (
                    <div key={label} className="bg-slate-900/50 rounded-xl p-3">
                      <div className="text-xs text-slate-500 mb-1">{label}</div>
                      <div className="text-slate-200 font-medium text-sm">{value}</div>
                    </div>
                  ) : null
                )}
              </div>
            </div>

            {/* ── Seller Info ───────────────────────────── */}
            {batchData.batch?.seller_name && (
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <User size={16} className="text-amber-400" /> Seller
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
                    {batchData.batch.seller_name[0]}
                  </div>
                  <div>
                    <div className="text-white font-medium">{batchData.batch.seller_name}</div>
                    {batchData.batch.seller_verification === 'VERIFIED' && (
                      <div className="flex items-center gap-1 text-xs text-emerald-400 mt-0.5">
                        <CheckCircle2 size={12} /> Verified Seller
                      </div>
                    )}
                    {batchData.batch.district && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        {batchData.batch.district}{batchData.batch.state ? `, ${batchData.batch.state}` : ''}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Lab Report ───────────────────────────── */}
            {batchData.batch?.lab_status && (
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <FlaskConical size={16} className="text-amber-400" /> Lab Report
                </h3>
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    batchData.batch.lab_status === 'COMPLIANT'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : batchData.batch.lab_status === 'NON_COMPLIANT'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {batchData.batch.lab_status}
                  </div>
                  {batchData.batch.laboratory_name && (
                    <span className="text-slate-400 text-sm">{batchData.batch.laboratory_name}</span>
                  )}
                </div>
                {/* Lab blockchain status */}
                {batchData.batch.lab_blockchain_tx_hash && (
                  <div className="mt-3">
                    <HashDisplay
                      label="Lab Report Blockchain Proof"
                      value={batchData.batch.lab_blockchain_tx_hash}
                      explorerUrl={explorerBase}
                    />
                  </div>
                )}
              </div>
            )}

            {/* ── Blockchain Proof Details ─────────────── */}
            {proof?.postgresql?.blockchainTxHash && (
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Wifi size={16} className="text-amber-400" /> Blockchain Proof
                </h3>
                <div className="space-y-3">
                  <HashDisplay
                    label="Transaction Hash"
                    value={proof.postgresql.blockchainTxHash}
                    explorerUrl={explorerBase}
                  />
                  {proof.postgresql.blockchainDataHash && (
                    <HashDisplay
                      label="Anchored Data Hash"
                      value={proof.postgresql.blockchainDataHash}
                    />
                  )}
                  {proof.postgresql.blockchainVerifiedAt && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                      <Clock size={12} />
                      Anchored on {new Date(proof.postgresql.blockchainVerifiedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Traceability link ─────────────────────── */}
            <Link
              to={`/traceability?batch=${batchId}`}
              className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-amber-400 hover:bg-amber-500/15 transition-colors group"
            >
              <span className="text-sm font-medium">View Full Supply Chain Timeline</span>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* ── No proof — info ───────────────────────── */}
            {status === 'NO_PROOF' && (
              <div className="bg-slate-800/20 border border-slate-700/30 rounded-2xl p-5 text-sm text-slate-400">
                <AlertTriangle size={16} className="text-amber-500 inline mr-2" />
                This batch exists in our database but its blockchain proof is still pending.
                If you are the seller, you can retry the blockchain submission from your dashboard.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
