import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  RefreshCw, 
  AlertTriangle, 
  ShieldCheck, 
  FileText,
  Filter,
  CheckCircle2
} from 'lucide-react';

export default function App() {
  const [selectedOrg, setSelectedOrg] = useState('ORG-A');
  const [reasonFilter, setReasonFilter] = useState('');
  const [sortField, setSortField] = useState('value');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    org: 'ORG-A',
    total_disagreements: 0,
    reasons_summary: {},
    disagreements: []
  });
  const [error, setError] = useState(null);

  // Fetch from Django API with strict tenant parameter
  const fetchDisagreements = async () => {
    setLoading(true);
    setError(null);
    try {
      const sortParam = sortDirection === 'desc' ? `-${sortField}` : sortField;
      const url = new URL('/api/disagreements/', window.location.origin);
      url.searchParams.set('org', selectedOrg);
      if (reasonFilter) {
        url.searchParams.set('reason', reasonFilter);
      }
      url.searchParams.set('sort', sortParam);

      // Support direct backend URL fallback if running standalone Vite dev server
      const targetUrl = window.location.port === '5174' 
        ? url.toString() 
        : `http://127.0.0.1:8000/api/disagreements/?org=${selectedOrg}&reason=${reasonFilter}&sort=${sortParam}`;

      const res = await fetch(targetUrl);
      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch disagreements:', err);
      setError(err.message || 'Failed to connect to reconciliation API backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisagreements();
  }, [selectedOrg, reasonFilter, sortField, sortDirection]);

  const handleSortToggle = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Currency formatter
  const formatCurrency = (val) => {
    if (val === null || val === undefined || val === '') return '';
    const num = parseFloat(val);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const getReasonBadgeClass = (reason) => {
    switch (reason) {
      case 'MISSING_IN_B': return 'badge-amber';
      case 'ORPHAN_IN_B': return 'badge-rose';
      case 'DUPLICATE_IN_B': return 'badge-purple';
      case 'VALUE_MISMATCH': return 'badge-red';
      case 'LOCATION_MISMATCH': return 'badge-cyan';
      case 'DATE_MISMATCH': return 'badge-blue';
      case 'VOIDED_RECORD': return 'badge-slate';
      default: return 'badge-default';
    }
  };

  const reasonOptions = [
    { value: '', label: 'All Disagreements' },
    { value: 'MISSING_IN_B', label: 'MISSING_IN_B (Record in A, missing in B)' },
    { value: 'ORPHAN_IN_B', label: 'ORPHAN_IN_B (Entry in B, unknown in A)' },
    { value: 'DUPLICATE_IN_B', label: 'DUPLICATE_IN_B (Multiple entries not summing)' },
    { value: 'VALUE_MISMATCH', label: 'VALUE_MISMATCH (Value mismatch or blank)' },
    { value: 'LOCATION_MISMATCH', label: 'LOCATION_MISMATCH (Cross-location diff)' },
    { value: 'DATE_MISMATCH', label: 'DATE_MISMATCH (Event date diff)' },
    { value: 'VOIDED_RECORD', label: 'VOIDED_RECORD (Voided record has entry)' },
  ];

  return (
    <div className="reconcile-app">
      {/* Top Header */}
      <header className="reconcile-header">
        <div className="header-brand">
          <div className="brand-logo">
            <Building2 size={22} />
          </div>
          <div>
            <h1 className="brand-title">DealerOS Ledger Reconciliation</h1>
            <p className="brand-subtitle">
              Automated multi-tenant comparison between System A (Ledger) and System B (Entries)
            </p>
          </div>
        </div>

        {/* Tenant Organization Selector */}
        <div className="tenant-selector-box">
          <span className="tenant-label">Current Tenant:</span>
          <div className="tenant-pill-group">
            <button
              type="button"
              className={`tenant-pill ${selectedOrg === 'ORG-A' ? 'active' : ''}`}
              onClick={() => setSelectedOrg('ORG-A')}
            >
              <ShieldCheck size={14} />
              <span>ORG-A (LOC-101..103)</span>
            </button>
            <button
              type="button"
              className={`tenant-pill ${selectedOrg === 'ORG-B' ? 'active' : ''}`}
              onClick={() => setSelectedOrg('ORG-B')}
            >
              <ShieldCheck size={14} />
              <span>ORG-B (LOC-201..202)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="reconcile-main">
        {/* Tenant Isolation Banner */}
        <div className="tenant-security-banner">
          <div className="security-left">
            <span className="security-shield">✓ Isolated Boundary</span>
            <p>
              Strictly querying records for <strong>{selectedOrg}</strong>. Cross-tenant data is never loaded, and cross-organization locations are automatically redacted.
            </p>
          </div>
          <button 
            type="button" 
            className="btn-refresh" 
            onClick={fetchDisagreements}
            disabled={loading}
            title="Refresh from database"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>{loading ? 'Reconciling...' : 'Refresh'}</span>
          </button>
        </div>

        {/* Error message if API fails */}
        {error && (
          <div className="error-alert">
            <AlertTriangle size={18} />
            <div>
              <strong>Failed to load reconciliation data:</strong> {error}
              <p className="error-hint">Make sure the Django backend is running on <code>http://127.0.0.1:8000</code>.</p>
            </div>
          </div>
        )}

        {/* Metrics Row */}
        <div className="summary-cards-row">
          <div className="summary-card stat-total">
            <span className="stat-label">Total Disagreements</span>
            <span className="stat-number">{data.total_disagreements}</span>
          </div>

          {Object.entries(data.reasons_summary || {}).map(([reason, count]) => (
            <div key={reason} className="summary-card">
              <span className={`stat-pill ${getReasonBadgeClass(reason)}`}>{reason}</span>
              <span className="stat-number">{count}</span>
            </div>
          ))}
        </div>

        {/* Filters and Actions Bar */}
        <div className="table-controls-bar">
          <div className="filter-group">
            <Filter size={16} className="filter-icon" />
            <select
              className="reason-select"
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              aria-label="Filter by disagreement reason"
            >
              {reasonOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="table-meta-text">
            Showing <strong>{data.disagreements.length}</strong> flagged line items
          </div>
        </div>

        {/* Reconciled Disagreements Table */}
        <div className="table-card">
          <table className="disagreements-table">
            <thead>
              <tr>
                <th onClick={() => handleSortToggle('reason')} className="sortable-th">
                  <div className="th-content">
                    <span>Reason</span>
                    {sortField === 'reason' && (sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
                  </div>
                </th>
                <th onClick={() => handleSortToggle('record_id')} className="sortable-th">
                  <div className="th-content">
                    <span>Record ID</span>
                    {sortField === 'record_id' && (sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
                  </div>
                </th>
                <th>Entry ID (Sys B)</th>
                <th>Location</th>
                <th onClick={() => handleSortToggle('value')} className="sortable-th text-right">
                  <div className="th-content th-right">
                    <span>System A Total</span>
                    {sortField === 'value' && (sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
                  </div>
                </th>
                <th className="text-right">System B Value</th>
                <th onClick={() => handleSortToggle('difference')} className="sortable-th text-right">
                  <div className="th-content th-right">
                    <span>Difference</span>
                    {sortField === 'difference' && (sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
                  </div>
                </th>
                <th>Discrepancy Details</th>
              </tr>
            </thead>
            <tbody>
              {data.disagreements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-table-cell">
                    <CheckCircle2 size={32} className="empty-icon text-emerald" />
                    <h3>No Disagreements Found</h3>
                    <p>Both ledgers are fully in agreement for the selected filters.</p>
                  </td>
                </tr>
              ) : (
                data.disagreements.map((row, idx) => (
                  <tr key={`${row.reason}-${row.record_id}-${row.entry_id}-${idx}`}>
                    {/* Reason */}
                    <td>
                      <span className={`reason-badge ${getReasonBadgeClass(row.reason)}`}>
                        {row.reason}
                      </span>
                    </td>

                    {/* Record ID */}
                    <td>
                      {row.record_id ? (
                        <code className="record-code">{row.record_id}</code>
                      ) : (
                        <span className="cell-empty" />
                      )}
                    </td>

                    {/* Entry ID */}
                    <td>
                      {row.entry_id ? (
                        <span className="entry-tag">{row.entry_id}</span>
                      ) : (
                        <span className="cell-empty" />
                      )}
                    </td>

                    {/* Location */}
                    <td>
                      {row.location?.includes('REDACTED') ? (
                        <span className="redacted-loc-pill" title="Cross-tenant location masked for privacy">
                          {row.location}
                        </span>
                      ) : (
                        <span className="loc-pill">{row.location}</span>
                      )}
                    </td>

                    {/* System A Value */}
                    <td className="text-right num-cell font-mono">
                      {row.a_value !== null ? formatCurrency(row.a_value) : <span className="cell-empty" />}
                    </td>

                    {/* System B Value */}
                    <td className="text-right num-cell font-mono">
                      {row.b_value !== null ? formatCurrency(row.b_value) : <span className="cell-empty" />}
                    </td>

                    {/* Difference */}
                    <td className="text-right num-cell font-mono font-bold">
                      {row.difference !== null ? (
                        <span className={parseFloat(row.difference) !== 0 ? 'diff-alert' : ''}>
                          {formatCurrency(row.difference)}
                        </span>
                      ) : (
                        <span className="cell-empty" />
                      )}
                    </td>

                    {/* Details */}
                    <td className="details-cell">
                      {row.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
