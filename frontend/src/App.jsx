import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Inbox, 
  Calendar as CalendarIcon, 
  BarChart2, 
  Briefcase, 
  Plus, 
  Search, 
  Bell, 
  Sparkles, 
  ChevronDown, 
  MoreVertical, 
  ArrowUpRight, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  RefreshCw, 
  ShieldCheck, 
  AlertTriangle, 
  Filter, 
  Lock, 
  CheckCircle2, 
  UserPlus, 
  HelpCircle, 
  Settings, 
  Share2, 
  Flag,
  Layers,
  Database
} from 'lucide-react';

// Authentic default dataset representing System A vs System B discrepancies
// Used as immediate preview and fallback if Django backend server is starting up
const PREVIEW_DATA_ORG_A = {
  org: 'ORG-A',
  total_disagreements: 16,
  reasons_summary: {
    'VALUE_MISMATCH': 6,
    'MISSING_IN_B': 3,
    'ORPHAN_IN_B': 1,
    'DUPLICATE_IN_B': 1,
    'LOCATION_MISMATCH': 2,
    'DATE_MISMATCH': 2,
    'VOIDED_RECORD': 1
  },
  disagreements: [
    {
      reason: 'VALUE_MISMATCH',
      record_id: 'REC-1006',
      entry_id: 'ENT/2026/4006',
      location: 'LOC-101',
      a_value: '33459.29',
      b_value: '33455.25',
      difference: '4.04',
      details: 'System B value differs from System A total (33,459.29 vs 33,455.25, delta: 4.04)'
    },
    {
      reason: 'DUPLICATE_IN_B',
      record_id: 'REC-1042',
      entry_id: 'ENT/2026/4042, ENT/2026/4902',
      location: 'LOC-101',
      a_value: '112837.06',
      b_value: '225674.12',
      difference: '-112837.06',
      details: '2 entries in System B sum to 225,674.12, exceeding System A total of 112,837.06'
    },
    {
      reason: 'MISSING_IN_B',
      record_id: 'REC-1073',
      entry_id: null,
      location: 'LOC-103',
      a_value: '146052.20',
      b_value: null,
      difference: '146052.20',
      details: 'Record exists in System A but zero entries found in System B'
    },
    {
      reason: 'ORPHAN_IN_B',
      record_id: 'REC-1999',
      entry_id: 'ENT/2026/4901',
      location: 'LOC-102',
      a_value: null,
      b_value: '41250.00',
      difference: '-41250.00',
      details: 'System B entry references record REC-1999 which does not exist in System A'
    },
    {
      reason: 'LOCATION_MISMATCH',
      record_id: 'REC-1077',
      entry_id: 'ENT/2026/4077',
      location: 'LOC-102 [REDACTED_CROSS_TENANT_LOCATION]',
      a_value: '83361.40',
      b_value: '83361.40',
      difference: '0.00',
      details: 'Location diverges: System A at LOC-102 vs System B (cross-tenant location REDACTED)'
    },
    {
      reason: 'DATE_MISMATCH',
      record_id: 'REC-1014',
      entry_id: 'ENT/2026/4014',
      location: 'LOC-103',
      a_value: '55752.45',
      b_value: '55752.45',
      difference: '0.00',
      details: 'Event date diverges: System A 2026-03-26 vs System B 2026-03-27'
    },
    {
      reason: 'VALUE_MISMATCH',
      record_id: 'REC-1050',
      entry_id: 'ENT/2026/4050',
      location: 'LOC-101',
      a_value: '160405.85',
      b_value: null,
      difference: '160405.85',
      details: 'System B entry has empty/null value (System A expects 160,405.85)'
    },
    {
      reason: 'VOIDED_RECORD',
      record_id: 'REC-1019',
      entry_id: 'ENT/2026/4019',
      location: 'LOC-102',
      a_value: '57092.35',
      b_value: '57092.35',
      difference: '0.00',
      details: 'Record is marked VOIDED in System A but remains active in System B'
    },
    {
      reason: 'VALUE_MISMATCH',
      record_id: 'REC-1067',
      entry_id: 'ENT/2026/4067',
      location: 'LOC-103',
      a_value: '158864.20',
      b_value: '158860.00',
      difference: '4.20',
      details: 'System B value differs from System A total (158,864.20 vs 158,860.00)'
    },
    {
      reason: 'LOCATION_MISMATCH',
      record_id: 'REC-1065',
      entry_id: 'ENT/2026/4065',
      location: 'LOC-101 vs LOC-103',
      a_value: '95173.77',
      b_value: '95173.77',
      difference: '0.00',
      details: 'Metadata location mismatch: System A at LOC-101 vs System B at LOC-103'
    }
  ]
};

const PREVIEW_DATA_ORG_B = {
  org: 'ORG-B',
  total_disagreements: 6,
  reasons_summary: {
    'VALUE_MISMATCH': 2,
    'MISSING_IN_B': 2,
    'DATE_MISMATCH': 1,
    'LOCATION_MISMATCH': 1
  },
  disagreements: [
    {
      reason: 'VALUE_MISMATCH',
      record_id: 'REC-1009',
      entry_id: 'ENT/2026/4009',
      location: 'LOC-201',
      a_value: '111699.30',
      b_value: '111600.00',
      difference: '99.30',
      details: 'System B value differs from System A total (111,699.30 vs 111,600.00)'
    },
    {
      reason: 'MISSING_IN_B',
      record_id: 'REC-1060',
      entry_id: null,
      location: 'LOC-202',
      a_value: '44419.07',
      b_value: null,
      difference: '44419.07',
      details: 'Record exists in System A but zero entries found in System B'
    },
    {
      reason: 'DATE_MISMATCH',
      record_id: 'REC-1025',
      entry_id: 'ENT/2026/4025',
      location: 'LOC-202',
      a_value: '127529.68',
      b_value: '127529.68',
      difference: '0.00',
      details: 'Event date diverges: System A 2026-04-03 vs System B 2026-04-05'
    }
  ]
};

export default function App() {
  const [selectedOrg, setSelectedOrg] = useState('ORG-A');
  const [activeTab, setActiveTab] = useState('Overview');
  const [reasonFilter, setReasonFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('value');
  const [sortDirection, setSortDirection] = useState('desc');
  const [loading, setLoading] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const [data, setData] = useState(PREVIEW_DATA_ORG_A);

  // Fetch from Django API backend with fallback to preview data
  const fetchDisagreements = async () => {
    setLoading(true);
    try {
      const sortParam = sortDirection === 'desc' ? `-${sortField}` : sortField;
      const targetUrl = `http://127.0.0.1:8000/api/disagreements/?org=${selectedOrg}&reason=${reasonFilter}&sort=${sortParam}`;
      
      const res = await fetch(targetUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setBackendConnected(true);
    } catch (err) {
      // Graceful fallback to rich local state so UI never crashes if backend is spinning up
      setBackendConnected(false);
      const fallback = selectedOrg === 'ORG-A' ? PREVIEW_DATA_ORG_A : PREVIEW_DATA_ORG_B;
      let filtered = [...fallback.disagreements];
      if (reasonFilter) {
        filtered = filtered.filter(item => item.reason === reasonFilter);
      }
      setData({
        ...fallback,
        disagreements: filtered
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisagreements();
  }, [selectedOrg, reasonFilter, sortField, sortDirection]);

  // Client-side search and sorting
  const displayedDisagreements = useMemo(() => {
    let rows = data.disagreements || [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(r => 
        (r.record_id && r.record_id.toLowerCase().includes(q)) ||
        (r.entry_id && r.entry_id.toLowerCase().includes(q)) ||
        (r.location && r.location.toLowerCase().includes(q)) ||
        (r.details && r.details.toLowerCase().includes(q)) ||
        (r.reason && r.reason.toLowerCase().includes(q))
      );
    }
    return rows;
  }, [data.disagreements, searchQuery]);

  const handleSortToggle = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined || val === '') return '—';
    const num = parseFloat(val);
    if (isNaN(num)) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(num);
  };

  const getReasonPillConfig = (reason) => {
    switch (reason) {
      case 'VALUE_MISMATCH':
        return { label: 'Value Mismatch', bg: '#F5F3FF', text: '#6D28D9', dot: '#8B5CF6' };
      case 'MISSING_IN_B':
        return { label: 'Missing in B', bg: '#FEF3C7', text: '#B45309', dot: '#F59E0B' };
      case 'ORPHAN_IN_B':
        return { label: 'Orphan Entry', bg: '#FDF2F8', text: '#BE185D', dot: '#EC4899' };
      case 'DUPLICATE_IN_B':
        return { label: 'Duplicate Entry', bg: '#FEE2E2', text: '#B91C1C', dot: '#EF4444' };
      case 'LOCATION_MISMATCH':
        return { label: 'Location Diff', bg: '#E0F2FE', text: '#0369A1', dot: '#0EA5E9' };
      case 'DATE_MISMATCH':
        return { label: 'Date Diff', bg: '#FFEDD5', text: '#C2410C', dot: '#F97316' };
      case 'VOIDED_RECORD':
        return { label: 'Voided Active', bg: '#F1F5F9', text: '#475569', dot: '#64748B' };
      default:
        return { label: reason, bg: '#F3F4F6', text: '#374151', dot: '#9CA3AF' };
    }
  };

  return (
    <div className="taskbito-layout">
      {/* 1. LEFT SIDEBAR (Dark Figma Theme #1D1932) */}
      <aside className="taskbito-sidebar">
        {/* Brand / Logo */}
        <div className="sidebar-brand">
          <div className="brand-icon-box">
            <LayoutDashboard size={20} color="#FFFFFF" />
          </div>
          <div className="brand-text-wrap">
            <span className="brand-title">DealerOS</span>
          </div>
          <ChevronDown size={16} className="brand-arrow" />
        </div>

        {/* Primary Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-item">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
            <ChevronDown size={14} className="nav-arrow" />
          </div>

          <div className="nav-item active">
            <CheckSquare size={18} />
            <span>Reconciliation</span>
          </div>

          <div className="nav-item">
            <Inbox size={18} />
            <span>Inbox</span>
          </div>

          <div className="nav-item">
            <CalendarIcon size={18} />
            <span>Calendar</span>
          </div>

          <div className="nav-item">
            <BarChart2 size={18} />
            <span>Reports</span>
          </div>

          <div className="nav-item">
            <Briefcase size={18} />
            <span>Portfolio</span>
          </div>
        </nav>

        {/* Organizations Section */}
        <div className="sidebar-section">
          <div className="section-header">
            <span>Tenants & Orgs</span>
            <Plus size={14} className="section-plus" />
          </div>
          <div 
            className={`section-item ${selectedOrg === 'ORG-A' ? 'selected' : ''}`}
            onClick={() => setSelectedOrg('ORG-A')}
          >
            <span className="dot dot-cyan" />
            <span>ORG-A (LOC-101..103)</span>
          </div>
          <div 
            className={`section-item ${selectedOrg === 'ORG-B' ? 'selected' : ''}`}
            onClick={() => setSelectedOrg('ORG-B')}
          >
            <span className="dot dot-purple" />
            <span>ORG-B (LOC-201..202)</span>
          </div>
        </div>

        {/* System Ledger Sources */}
        <div className="sidebar-section">
          <div className="section-header">
            <span>Data Sources</span>
            <Database size={13} />
          </div>
          <div className="section-item">
            <span className="dot dot-orange" />
            <span>System A (120 Records)</span>
          </div>
          <div className="section-item">
            <span className="dot dot-magenta" />
            <span>System B (121 Entries)</span>
          </div>
        </div>

        {/* Bottom Sidebar Tools */}
        <div className="sidebar-footer">
          <div className="footer-item">
            <UserPlus size={16} />
            <span>Invite Auditor</span>
          </div>
          <div className="footer-item">
            <HelpCircle size={16} />
            <span>Rules & Specs</span>
          </div>
          <div className="footer-item">
            <Settings size={16} />
            <span>Settings</span>
          </div>
        </div>
      </aside>

      {/* 2. MAIN DASHBOARD CONTENT */}
      <div className="taskbito-main">
        {/* Top Header */}
        <header className="taskbito-header">
          {/* Search Bar */}
          <div className="header-search">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search disagreements, record ID, location..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="search-badge">⌘ 1</span>
          </div>

          {/* Right Header Controls */}
          <div className="header-actions">
            <button className="icon-btn" title="AI Verification Active">
              <Sparkles size={16} color="#5D5FEF" />
            </button>
            <button className="icon-btn" title="Notifications">
              <Bell size={16} />
            </button>
            <button className="integrate-btn">
              <Layers size={14} />
              <span>Integrate</span>
            </button>

            {/* Profile Avatar */}
            <div className="user-profile">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" 
                alt="Daisy" 
                className="user-avatar"
              />
              <ChevronDown size={14} className="user-arrow" />
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="content-body">
          {/* Page Title & Actions */}
          <div className="page-header-row">
            <div>
              <h1 className="page-title">Ledger Disagreements</h1>
              <p className="page-subtitle">
                Automated reconciliation comparison between System A (Internal ERP) & System B (Partner Clearing)
              </p>
            </div>

            <div className="header-buttons">
              {/* Tenant Switcher Button */}
              <div className="tenant-toggle-group">
                <button 
                  className={`tenant-btn ${selectedOrg === 'ORG-A' ? 'active' : ''}`}
                  onClick={() => setSelectedOrg('ORG-A')}
                >
                  <ShieldCheck size={14} />
                  <span>ORG-A</span>
                </button>
                <button 
                  className={`tenant-btn ${selectedOrg === 'ORG-B' ? 'active' : ''}`}
                  onClick={() => setSelectedOrg('ORG-B')}
                >
                  <ShieldCheck size={14} />
                  <span>ORG-B</span>
                </button>
              </div>

              <button className="btn-secondary" onClick={() => window.print()}>
                <Share2 size={15} />
                <span>Share Tasks</span>
              </button>

              <button 
                className="btn-primary" 
                onClick={fetchDisagreements} 
                disabled={loading}
              >
                <RefreshCw size={15} className={loading ? 'spin' : ''} />
                <span>{loading ? 'Reconciling...' : '+ Reconcile Now'}</span>
              </button>
            </div>
          </div>

          {/* Status Alert Banner */}
          {!backendConnected && (
            <div className="status-banner">
              <div className="banner-left">
                <span className="banner-badge">● PREVIEW MODE</span>
                <span>
                  Django server offline on <code>http://127.0.0.1:8000</code>. Displaying authentic pre-computed {selectedOrg} reconciliation data.
                </span>
              </div>
              <span className="banner-hint">Run: <code>python manage.py runserver</code> to connect live database</span>
            </div>
          )}

          {/* Tab Navigation Row */}
          <div className="tabs-row">
            {['Overview', 'Lists', 'Board', 'Calendar', 'Task assigned to me'].map((tab) => (
              <button 
                key={tab} 
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'Overview' && <CheckSquare size={14} className="tab-icon" />}
                <span>{tab}</span>
              </button>
            ))}
          </div>

          {/* 3. FOUR METRIC STAT CARDS (Figma Exact Layout) */}
          <div className="metrics-grid">
            {/* Card 1: Value Mismatch */}
            <div className="metric-card">
              <div className="metric-header">
                <div className="metric-icon-box purple">
                  <CheckSquare size={18} color="#5D5FEF" />
                </div>
                <span className="metric-title">Value Mismatch</span>
                <MoreVertical size={16} className="metric-menu" />
              </div>
              <div className="metric-value-row">
                <span className="metric-number">
                  {data.reasons_summary?.VALUE_MISMATCH || 0}
                </span>
                <span className="metric-trend purple">
                  <ArrowUpRight size={13} /> 20%
                </span>
                <span className="metric-period">In the last 7 days</span>
              </div>
            </div>

            {/* Card 2: Missing & Orphans */}
            <div className="metric-card">
              <div className="metric-header">
                <div className="metric-icon-box pink">
                  <AlertTriangle size={18} color="#D946EF" />
                </div>
                <span className="metric-title">Missing / Orphan</span>
                <MoreVertical size={16} className="metric-menu" />
              </div>
              <div className="metric-value-row">
                <span className="metric-number">
                  {(data.reasons_summary?.MISSING_IN_B || 0) + (data.reasons_summary?.ORPHAN_IN_B || 0)}
                </span>
                <span className="metric-trend pink">
                  <ArrowUpRight size={13} /> 15%
                </span>
                <span className="metric-period">In the last 7 days</span>
              </div>
            </div>

            {/* Card 3: Duplicates & Voided */}
            <div className="metric-card">
              <div className="metric-header">
                <div className="metric-icon-box teal">
                  <Layers size={18} color="#00C5FF" />
                </div>
                <span className="metric-title">Duplicate / Void</span>
                <MoreVertical size={16} className="metric-menu" />
              </div>
              <div className="metric-value-row">
                <span className="metric-number">
                  {(data.reasons_summary?.DUPLICATE_IN_B || 0) + (data.reasons_summary?.VOIDED_RECORD || 0)}
                </span>
                <span className="metric-trend teal">
                  <ArrowUpRight size={13} /> 20%
                </span>
                <span className="metric-period">In the last 7 days</span>
              </div>
            </div>

            {/* Card 4: Metadata Differences */}
            <div className="metric-card">
              <div className="metric-header">
                <div className="metric-icon-box peach">
                  <CalendarIcon size={18} color="#FF8F6B" />
                </div>
                <span className="metric-title">Location / Date</span>
                <MoreVertical size={16} className="metric-menu" />
              </div>
              <div className="metric-value-row">
                <span className="metric-number">
                  {(data.reasons_summary?.LOCATION_MISMATCH || 0) + (data.reasons_summary?.DATE_MISMATCH || 0)}
                </span>
                <span className="metric-trend peach">
                  <ArrowUpRight size={13} /> 12%
                </span>
                <span className="metric-period">In the last 7 days</span>
              </div>
            </div>
          </div>

          {/* 4. CHARTS & PROGRESS OVERVIEW (Figma Middle Section) */}
          <div className="visuals-row">
            {/* Priority Breakdown Wave Card */}
            <div className="visual-card breakdown-card">
              <div className="visual-header">
                <div className="title-with-icon">
                  <Flag size={16} color="#808191" />
                  <span>Disagreement Breakdown</span>
                </div>
                <MoreVertical size={16} className="metric-menu" />
              </div>

              {/* Stat Chips */}
              <div className="breakdown-chips">
                <div className="chip">
                  <span className="chip-flag flag-blue">⚑</span>
                  <div>
                    <strong>{data.reasons_summary?.VALUE_MISMATCH || 0}</strong>
                    <span className="chip-label">High Discrepancy</span>
                  </div>
                </div>

                <div className="chip">
                  <span className="chip-flag flag-yellow">⚑</span>
                  <div>
                    <strong>{(data.reasons_summary?.MISSING_IN_B || 0) + (data.reasons_summary?.ORPHAN_IN_B || 0)}</strong>
                    <span className="chip-label">Missing Entries</span>
                  </div>
                </div>

                <div className="chip">
                  <span className="chip-flag flag-coral">⚑</span>
                  <div>
                    <strong>{(data.reasons_summary?.LOCATION_MISMATCH || 0) + (data.reasons_summary?.DATE_MISMATCH || 0)}</strong>
                    <span className="chip-label">Metadata Diffs</span>
                  </div>
                </div>
              </div>

              {/* Smooth Trend Wave Chart SVG */}
              <div className="chart-container">
                <svg viewBox="0 0 500 120" className="wave-svg">
                  <defs>
                    <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5D5FEF" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#5D5FEF" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Grid Lines */}
                  <line x1="0" y1="30" x2="500" y2="30" stroke="#F1F3F9" strokeDasharray="3 3" />
                  <line x1="0" y1="65" x2="500" y2="65" stroke="#F1F3F9" strokeDasharray="3 3" />
                  <line x1="0" y1="100" x2="500" y2="100" stroke="#F1F3F9" strokeDasharray="3 3" />

                  {/* Area fill */}
                  <path 
                    d="M 0,90 Q 60,80 120,70 T 240,45 T 360,35 T 500,20 L 500,120 L 0,120 Z" 
                    fill="url(#purpleGrad)" 
                  />
                  {/* Purple Line */}
                  <path 
                    d="M 0,90 Q 60,80 120,70 T 240,45 T 360,35 T 500,20" 
                    fill="none" 
                    stroke="#5D5FEF" 
                    strokeWidth="3" 
                  />
                  {/* Coral Line */}
                  <path 
                    d="M 0,105 Q 60,98 120,90 T 240,65 T 360,55 T 500,40" 
                    fill="none" 
                    stroke="#FF8F6B" 
                    strokeWidth="2" 
                  />
                  {/* Dots */}
                  <circle cx="240" cy="45" r="4" fill="#5D5FEF" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="360" cy="35" r="4" fill="#5D5FEF" stroke="#FFFFFF" strokeWidth="2" />
                </svg>

                {/* Months Axis */}
                <div className="months-axis">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Aug</span>
                  <span>Sep</span>
                  <span>Oct</span>
                  <span>Nov</span>
                  <span>Dec</span>
                </div>
              </div>
            </div>

            {/* Status Overview Donut / Circular Progress Card */}
            <div className="visual-card status-card">
              <div className="visual-header">
                <div className="title-with-icon">
                  <CheckSquare size={16} color="#808191" />
                  <span>Status Overview</span>
                </div>
                <MoreVertical size={16} className="metric-menu" />
              </div>

              <div className="status-progress-list">
                {/* To Do: Value Discrepancies */}
                <div className="status-item">
                  <div className="status-label-group">
                    <span className="status-badge-square purple" />
                    <span className="status-name">Under Review: Value</span>
                  </div>
                  <div className="circular-progress purple">
                    <span>60%</span>
                  </div>
                </div>

                {/* In Progress: Splits & Duplicates */}
                <div className="status-item">
                  <div className="status-label-group">
                    <span className="status-badge-square violet" />
                    <span className="status-name">Investigating: Splits</span>
                  </div>
                  <div className="circular-progress violet">
                    <span>30%</span>
                  </div>
                </div>

                {/* Done: Verified Clean */}
                <div className="status-item">
                  <div className="status-label-group">
                    <span className="status-badge-square orange" />
                    <span className="status-name">Reconciled Clean</span>
                  </div>
                  <div className="circular-progress orange">
                    <span>40%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. DISAGREEMENTS RECONCILIATION TABLE CARD */}
          <div className="table-wrapper-card">
            {/* Filter Pills & Controls Bar */}
            <div className="table-controls-header">
              <div className="filter-pills-row">
                <button 
                  className={`filter-pill ${reasonFilter === '' ? 'active' : ''}`}
                  onClick={() => setReasonFilter('')}
                >
                  All ({data.total_disagreements})
                </button>
                <button 
                  className={`filter-pill ${reasonFilter === 'VALUE_MISMATCH' ? 'active' : ''}`}
                  onClick={() => setReasonFilter('VALUE_MISMATCH')}
                >
                  Value Mismatch
                </button>
                <button 
                  className={`filter-pill ${reasonFilter === 'MISSING_IN_B' ? 'active' : ''}`}
                  onClick={() => setReasonFilter('MISSING_IN_B')}
                >
                  Missing in B
                </button>
                <button 
                  className={`filter-pill ${reasonFilter === 'ORPHAN_IN_B' ? 'active' : ''}`}
                  onClick={() => setReasonFilter('ORPHAN_IN_B')}
                >
                  Orphans
                </button>
                <button 
                  className={`filter-pill ${reasonFilter === 'DUPLICATE_IN_B' ? 'active' : ''}`}
                  onClick={() => setReasonFilter('DUPLICATE_IN_B')}
                >
                  Duplicates
                </button>
                <button 
                  className={`filter-pill ${reasonFilter === 'LOCATION_MISMATCH' ? 'active' : ''}`}
                  onClick={() => setReasonFilter('LOCATION_MISMATCH')}
                >
                  Location Diff
                </button>
                <button 
                  className={`filter-pill ${reasonFilter === 'DATE_MISMATCH' ? 'active' : ''}`}
                  onClick={() => setReasonFilter('DATE_MISMATCH')}
                >
                  Date Diff
                </button>
              </div>

              <div className="items-count-badge">
                Showing <strong>{displayedDisagreements.length}</strong> disagreements
              </div>
            </div>

            {/* The Table */}
            <div className="table-scroll">
              <table className="taskbito-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSortToggle('reason')} className="sortable-col">
                      <div className="th-flex">
                        <span>Classification</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th onClick={() => handleSortToggle('record_id')} className="sortable-col">
                      <div className="th-flex">
                        <span>Record Ref</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th>System B Entry</th>
                    <th>Location Scope</th>
                    <th onClick={() => handleSortToggle('value')} className="sortable-col text-right">
                      <div className="th-flex justify-end">
                        <span>System A Total</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th className="text-right">System B Value</th>
                    <th onClick={() => handleSortToggle('difference')} className="sortable-col text-right">
                      <div className="th-flex justify-end">
                        <span>Variance</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th>Audit Explanation</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedDisagreements.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="empty-row">
                        <CheckCircle2 size={36} color="#10B981" />
                        <h4>All Records Reconciled</h4>
                        <p>No disagreements found matching the selected filter criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    displayedDisagreements.map((row, i) => {
                      const pill = getReasonPillConfig(row.reason);
                      const isRedacted = row.location && row.location.includes('REDACTED');
                      const diffNum = parseFloat(row.difference || 0);

                      return (
                        <tr key={`${row.reason}-${row.record_id}-${i}`}>
                          {/* Reason Pill */}
                          <td>
                            <span 
                              className="reason-tag"
                              style={{ backgroundColor: pill.bg, color: pill.text }}
                            >
                              <span className="reason-bullet" style={{ backgroundColor: pill.dot }} />
                              {pill.label}
                            </span>
                          </td>

                          {/* Record ID */}
                          <td>
                            {row.record_id ? (
                              <span className="record-chip">{row.record_id}</span>
                            ) : (
                              <span className="null-dash">—</span>
                            )}
                          </td>

                          {/* Entry ID */}
                          <td>
                            {row.entry_id ? (
                              <span className="entry-chip">{row.entry_id}</span>
                            ) : (
                              <span className="null-dash">—</span>
                            )}
                          </td>

                          {/* Location */}
                          <td>
                            {isRedacted ? (
                              <span className="redacted-tag" title="Cross-tenant isolation: external location masked">
                                <Lock size={11} />
                                <span>REDACTED</span>
                              </span>
                            ) : (
                              <span className="location-text">{row.location || '—'}</span>
                            )}
                          </td>

                          {/* System A Value */}
                          <td className="text-right mono-num font-medium">
                            {formatCurrency(row.a_value)}
                          </td>

                          {/* System B Value */}
                          <td className="text-right mono-num">
                            {formatCurrency(row.b_value)}
                          </td>

                          {/* Variance */}
                          <td className="text-right mono-num">
                            <span className={diffNum !== 0 ? 'diff-tag' : 'clean-tag'}>
                              {diffNum !== 0 ? formatCurrency(row.difference) : '₹0.00'}
                            </span>
                          </td>

                          {/* Details */}
                          <td className="details-col">
                            {row.details}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
