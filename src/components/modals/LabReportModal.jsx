import React, { useState } from 'react';
import { X, FlaskConical, CheckCircle, AlertCircle, Download, ExternalLink } from 'lucide-react';

export default function LabReportModal({ report, onClose }) {
  if (!report) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-cream-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <FlaskConical size={20} className="text-blue-700" />
            </div>
            <div>
              <h2 className="font-display font-bold text-charcoal-800">Laboratory Report</h2>
              <p className="text-xs text-charcoal-400">Report ID: {report.reportNo}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-cream-100 text-charcoal-500">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Lab info */}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-charcoal-400 font-medium mb-1">Laboratory</p>
              <p className="text-sm font-semibold text-charcoal-800">{report.labName}</p>
              <p className="text-xs text-charcoal-500">{report.accreditationNo}</p>
            </div>
            <div>
              <p className="text-xs text-charcoal-400 font-medium mb-1">Report Date</p>
              <p className="text-sm font-semibold text-charcoal-800">{report.reportDate}</p>
            </div>
            <div>
              <p className="text-xs text-charcoal-400 font-medium mb-1">Sample ID</p>
              <p className="text-sm font-mono font-semibold text-charcoal-800">{report.sampleId}</p>
            </div>
            <div>
              <p className="text-xs text-charcoal-400 font-medium mb-1">Batch ID</p>
              <p className="text-sm font-mono font-semibold text-honey-700">{report.batchId}</p>
            </div>
          </div>

          {/* Overall status */}
          <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${
            report.overallStatus === 'COMPLIANT'
              ? 'bg-forest-50 border-forest-300'
              : 'bg-yellow-50 border-yellow-300'
          }`}>
            {report.overallStatus === 'COMPLIANT'
              ? <CheckCircle size={24} className="text-forest-600" />
              : <AlertCircle size={24} className="text-yellow-600" />
            }
            <div>
              <p className="font-bold text-charcoal-800">
                {report.overallStatus === 'COMPLIANT' ? '🟢 COMPLIANT' : '⚠️ REVIEW REQUIRED'}
              </p>
              <p className="text-xs text-charcoal-500">
                {report.overallStatus === 'COMPLIANT'
                  ? 'All sampled parameters are within the standard limits for this batch.'
                  : 'Review required — see individual parameters.'}
              </p>
            </div>
          </div>

          {/* Test standard */}
          <div>
            <p className="text-xs text-charcoal-400 font-medium mb-1">Test Standard</p>
            <p className="text-sm text-charcoal-700">{report.testStandard}</p>
          </div>

          {/* Parameters */}
          <div>
            <h4 className="font-semibold text-charcoal-800 mb-3 flex items-center gap-2">
              <FlaskConical size={16} className="text-blue-600" />
              Test Parameters
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cream-200">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-charcoal-500 uppercase tracking-wide">Parameter</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-charcoal-500 uppercase tracking-wide">Result</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-charcoal-500 uppercase tracking-wide">Limit (Illustrative)</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-charcoal-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.parameters.map((param, i) => (
                    <tr key={i} className="border-b border-cream-100 hover:bg-cream-50">
                      <td className="py-3 px-3 font-medium text-charcoal-800">{param.name}</td>
                      <td className="py-3 px-3 font-mono text-charcoal-700">{param.result}</td>
                      <td className="py-3 px-3 text-charcoal-500">{param.limit}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          param.status === 'WITHIN LIMIT' ? 'bg-forest-100 text-forest-700' :
                          param.status === 'EXCEEDS LIMIT' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {param.status === 'WITHIN LIMIT' && <CheckCircle size={10} />}
                          {param.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-cream-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-charcoal-600 mb-1">Notes</p>
            <p className="text-xs text-charcoal-500">{report.notes}</p>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm">
              <Download size={16} /> Download Report
            </button>
            <button onClick={onClose} className="px-6 btn-primary text-sm">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
