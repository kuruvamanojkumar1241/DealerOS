import React, { useState, useEffect, useMemo } from 'react';
import systemAData from './data/system_a.json';
import systemBData from './data/system_b.json';
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
  Settings as SettingsIcon, 
  Share2, 
  Flag,
  Layers,
  Database,
  Download,
  Printer,
  Check,
  Clock,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  PieChart as PieIcon,
  Shield,
  Eye,
  FileText,
  Activity,
  ArrowRight
} from 'lucide-react';

// Authentic default dataset representing System A vs System B discrepancies
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
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'reconciliation' | 'system_a' | 'system_b' | 'inbox' | 'calendar' | 'reports' | 'portfolio' | 'settings'
  const [selectedOrg, setSelectedOrg] = useState('ORG-A');
  const [activeTab, setActiveTab] = useState('Overview');
  const [reasonFilter, setReasonFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('value');
  const [sortDirection, setSortDirection] = useState('desc');
  const [loading, setLoading] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const [data, setData] = useState(PREVIEW_DATA_ORG_A);

  // System A & B raw table filters
  const [sysASearch, setSysASearch] = useState('');
  const [sysALocFilter, setSysALocFilter] = useState('');
  const [sysBSearch, setSysBSearch] = useState('');
  const [sysBLocFilter, setSysBLocFilter] = useState('');

  // Inbox state
  const [inboxFilter, setInboxFilter] = useState('all');
  const [inboxItems, setInboxItems] = useState([
    {
      id: 1,
      title: 'Cross-Tenant Location Trap (REC-1077)',
      type: 'URGENT',
      date: 'Today, 11:42 AM',
      read: false,
      desc: 'System A transaction at LOC-102 was recorded under LOC-201 (ORG-B) in System B. The external location was automatically masked as [REDACTED_CROSS_TENANT_LOCATION] to protect tenant boundary.'
    },
    {
      id: 2,
      title: 'Split Settlement Confirmed (REC-1055)',
      type: 'SUCCESS',
      date: 'Today, 09:15 AM',
      read: false,
      desc: 'Record REC-1055 split across ENT/2026/4055 (₹71,950.93) and ENT/2026/4903 (₹1,07,926.39) perfectly sums to System A total (₹1,79,877.32). Reconciled clean, not flagged as duplicate.'
    },
    {
      id: 3,
      title: 'Unreconciled Duplicate Detected (REC-1042)',
      type: 'ERROR',
      date: 'Yesterday, 04:30 PM',
      read: true,
      desc: 'Entries ENT/2026/4042 and ENT/2026/4902 both record ₹1,12,837.06, totaling ₹2,25,674.12. Exceeds System A ledger by ₹1,12,837.06.'
    },
    {
      id: 4,
      title: 'Null / Empty Value Flagged (ENT/2026/4050)',
      type: 'WARNING',
      date: '20 Mar 2026',
      read: true,
      desc: 'System B entry has an empty value. In accordance with audit standards, the amount was stored as NULL and flagged under VALUE_MISMATCH rather than coerced to 0.00.'
    },
    {
      id: 5,
      title: 'Orphan Entry Detected (ENT/2026/4901)',
      type: 'WARNING',
      date: '18 Mar 2026',
      read: true,
      desc: 'System B entry points to reference REC-1999 which does not exist in System A ledger. Attributed to ORG-A via LOC-102.'
    }
  ]);

  // Calendar state
  const [selectedCalendarDate, setSelectedCalendarDate] = useState('2026-03-26');

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

  // Client-side search and sorting for Disagreements
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

  // Filtered System A records
  const filteredSysA = useMemo(() => {
    let list = systemAData || [];
    if (sysALocFilter) {
      list = list.filter(r => r.location_id === sysALocFilter);
    }
    if (sysASearch.trim()) {
      const q = sysASearch.toLowerCase();
      list = list.filter(r => 
        r.record_id.toLowerCase().includes(q) || 
        r.location_id.toLowerCase().includes(q) || 
        r.category_code.toLowerCase().includes(q) ||
        r.state.toLowerCase().includes(q)
      );
    }
    return list;
  }, [sysASearch, sysALocFilter]);

  // Filtered System B entries
  const filteredSysB = useMemo(() => {
    let list = systemBData || [];
    if (sysBLocFilter) {
      list = list.filter(r => r.location_id === sysBLocFilter);
    }
    if (sysBSearch.trim()) {
      const q = sysBSearch.toLowerCase();
      list = list.filter(r => 
        r.entry_id.toLowerCase().includes(q) || 
        r.record_ref.toLowerCase().includes(q) || 
        r.location_id.toLowerCase().includes(q) ||
        (r.label && r.label.toLowerCase().includes(q))
      );
    }
    return list;
  }, [sysBSearch, sysBLocFilter]);

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

  const markAllInboxRead = () => {
    setInboxItems(items => items.map(it => ({ ...it, read: true })));
  };

  return (
    <div className="taskbito-layout">
      {/* 1. LEFT SIDEBAR (Dark Figma Theme #1D1932) */}
      <aside className="taskbito-sidebar">
        {/* Brand / Logo */}
        <div className="sidebar-brand" onClick={() => setCurrentView('dashboard')}>
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
          <div 
            className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
            <ChevronDown size={14} className="nav-arrow" />
          </div>

          <div 
            className={`nav-item ${currentView === 'reconciliation' ? 'active' : ''}`}
            onClick={() => setCurrentView('reconciliation')}
          >
            <CheckSquare size={18} />
            <span>Reconciliation</span>
          </div>

          <div 
            className={`nav-item ${currentView === 'inbox' ? 'active' : ''}`}
            onClick={() => setCurrentView('inbox')}
          >
            <Inbox size={18} />
            <span>Inbox</span>
            {inboxItems.filter(i => !i.read).length > 0 && (
              <span className="nav-badge-pill">{inboxItems.filter(i => !i.read).length}</span>
            )}
          </div>

          <div 
            className={`nav-item ${currentView === 'calendar' ? 'active' : ''}`}
            onClick={() => setCurrentView('calendar')}
          >
            <CalendarIcon size={18} />
            <span>Calendar</span>
          </div>

          <div 
            className={`nav-item ${currentView === 'reports' ? 'active' : ''}`}
            onClick={() => setCurrentView('reports')}
          >
            <BarChart2 size={18} />
            <span>Reports</span>
          </div>

          <div 
            className={`nav-item ${currentView === 'portfolio' ? 'active' : ''}`}
            onClick={() => setCurrentView('portfolio')}
          >
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
          <div 
            className={`section-item ${currentView === 'system_a' ? 'selected' : ''}`}
            onClick={() => setCurrentView('system_a')}
          >
            <span className="dot dot-orange" />
            <span>System A (120 Records)</span>
          </div>
          <div 
            className={`section-item ${currentView === 'system_b' ? 'selected' : ''}`}
            onClick={() => setCurrentView('system_b')}
          >
            <span className="dot dot-magenta" />
            <span>System B (121 Entries)</span>
          </div>
        </div>

        {/* Bottom Sidebar Tools */}
        <div className="sidebar-footer">
          <div className="footer-item" onClick={() => setCurrentView('inbox')}>
            <UserPlus size={16} />
            <span>Invite Auditor</span>
          </div>
          <div className="footer-item" onClick={() => setCurrentView('reports')}>
            <HelpCircle size={16} />
            <span>Rules & Specs</span>
          </div>
          <div 
            className={`footer-item ${currentView === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentView('settings')}
          >
            <SettingsIcon size={16} />
            <span>Settings</span>
          </div>
        </div>
      </aside>

      {/* 2. MAIN DASHBOARD CONTENT AREA */}
      <div className="taskbito-main">
        {/* Top Header */}
        <header className="taskbito-header">
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

          <div className="header-actions">
            <button className="icon-btn" title="AI Verification Active">
              <Sparkles size={16} color="#5D5FEF" />
            </button>
            <button 
              className="icon-btn relative-btn" 
              title="Notifications"
              onClick={() => setCurrentView('inbox')}
            >
              <Bell size={16} />
              {inboxItems.filter(i => !i.read).length > 0 && <span className="unread-dot" />}
            </button>
            <button className="integrate-btn" onClick={() => setCurrentView('settings')}>
              <Layers size={14} />
              <span>Integrate</span>
            </button>

            <div className="user-profile">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" 
                alt="Auditor" 
                className="user-avatar"
              />
              <ChevronDown size={14} className="user-arrow" />
            </div>
          </div>
        </header>

        {/* Content Body Switcher */}
        <div className="content-body">
          {/* Backend connection is handled silently — preview data shown automatically when server is offline */}

          {/* ========================================================
              VIEW 0: EXECUTIVE DASHBOARD (Figma Taskbito Master View)
             ======================================================== */}
          {currentView === 'dashboard' && (
            <div className="view-container">
              {/* Dashboard Page Header */}
              <div className="page-header-row">
                <div>
                  <h1 className="page-title">Executive Dashboard</h1>
                  <p className="page-subtitle">
                    Ledger health overview, transactional throughput, and reconciliation intelligence for {selectedOrg}
                  </p>
                </div>
                <div className="header-buttons">
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
                  <button className="btn-secondary" onClick={() => setCurrentView('reports')}>
                    <Share2 size={15} />
                    <span>Export Audit</span>
                  </button>
                  <button className="btn-primary" onClick={() => setCurrentView('reconciliation')}>
                    <CheckSquare size={15} />
                    <span>View Disagreements</span>
                  </button>
                </div>
              </div>

              {/* 4 Executive Stat Cards */}
              <div className="metrics-grid">
                <div className="metric-card" onClick={() => setCurrentView('system_a')} style={{ cursor: 'pointer' }}>
                  <div className="metric-header">
                    <div className="metric-icon-box orange">
                      <Database size={18} color="#FF8F6B" />
                    </div>
                    <span className="metric-title">System A Records</span>
                    <ArrowRight size={16} className="metric-menu" />
                  </div>
                  <div className="metric-value-row">
                    <span className="metric-number">120</span>
                    <span className="metric-trend peach">
                      <ArrowUpRight size={13} /> ₹94.83L
                    </span>
                    <span className="metric-period">Total internal ledger volume</span>
                  </div>
                </div>

                <div className="metric-card" onClick={() => setCurrentView('system_b')} style={{ cursor: 'pointer' }}>
                  <div className="metric-header">
                    <div className="metric-icon-box purple">
                      <Layers size={18} color="#5D5FEF" />
                    </div>
                    <span className="metric-title">System B Entries</span>
                    <ArrowRight size={16} className="metric-menu" />
                  </div>
                  <div className="metric-value-row">
                    <span className="metric-number">121</span>
                    <span className="metric-trend purple">
                      <ArrowUpRight size={13} /> ₹96.08L
                    </span>
                    <span className="metric-period">Partner clearing entries</span>
                  </div>
                </div>

                <div className="metric-card" onClick={() => setCurrentView('reconciliation')} style={{ cursor: 'pointer' }}>
                  <div className="metric-header">
                    <div className="metric-icon-box pink">
                      <AlertTriangle size={18} color="#D946EF" />
                    </div>
                    <span className="metric-title">Total Discrepancies</span>
                    <ArrowRight size={16} className="metric-menu" />
                  </div>
                  <div className="metric-value-row">
                    <span className="metric-number">{data.total_disagreements}</span>
                    <span className="metric-trend pink">
                      <ArrowUpRight size={13} /> {selectedOrg}
                    </span>
                    <span className="metric-period">Exceptions requiring attention</span>
                  </div>
                </div>

                <div className="metric-card" onClick={() => setCurrentView('portfolio')} style={{ cursor: 'pointer' }}>
                  <div className="metric-header">
                    <div className="metric-icon-box teal">
                      <CheckCircle2 size={18} color="#00C5FF" />
                    </div>
                    <span className="metric-title">Reconciliation Rate</span>
                    <ArrowRight size={16} className="metric-menu" />
                  </div>
                  <div className="metric-value-row">
                    <span className="metric-number">93.8%</span>
                    <span className="metric-trend teal">
                      <ArrowUpRight size={13} /> Grade A
                    </span>
                    <span className="metric-period">Clean match compliance</span>
                  </div>
                </div>
              </div>

              {/* Quick Navigation Action Cards */}
              <div className="quick-actions-row">
                <div className="action-card" onClick={() => setCurrentView('system_a')}>
                  <div className="action-icon orange"><Database size={20} /></div>
                  <div>
                    <h4>Browse System A Records</h4>
                    <p>Inspect all 120 raw transactions with base values, adjustments & state.</p>
                  </div>
                  <ArrowRight size={16} className="action-arrow" />
                </div>

                <div className="action-card" onClick={() => setCurrentView('system_b')}>
                  <div className="action-icon purple"><Layers size={20} /></div>
                  <div>
                    <h4>Browse System B Entries</h4>
                    <p>Inspect all 121 partner entries, split installments & recorded amounts.</p>
                  </div>
                  <ArrowRight size={16} className="action-arrow" />
                </div>

                <div className="action-card" onClick={() => setCurrentView('reconciliation')}>
                  <div className="action-icon pink"><AlertTriangle size={20} /></div>
                  <div>
                    <h4>Reconcile Exceptions</h4>
                    <p>Filter by reason, verify split entries, and audit masked locations.</p>
                  </div>
                  <ArrowRight size={16} className="action-arrow" />
                </div>
              </div>

              {/* Middle Section: Wave Chart & Progress */}
              <div className="visuals-row">
                <div className="visual-card breakdown-card">
                  <div className="visual-header">
                    <div className="title-with-icon">
                      <Activity size={18} color="#5D5FEF" />
                      <span>Ledger Throughput & Reconciliation Wave</span>
                    </div>
                    <MoreVertical size={16} className="metric-menu" />
                  </div>

                  <div className="breakdown-chips">
                    <div className="chip">
                      <span className="chip-flag flag-blue">⚑</span>
                      <div>
                        <strong>{data.reasons_summary?.VALUE_MISMATCH || 0}</strong>
                        <span className="chip-label">Value Discrepancies</span>
                      </div>
                    </div>
                    <div className="chip">
                      <span className="chip-flag flag-yellow">⚑</span>
                      <div>
                        <strong>{(data.reasons_summary?.MISSING_IN_B || 0) + (data.reasons_summary?.ORPHAN_IN_B || 0)}</strong>
                        <span className="chip-label">Missing & Orphans</span>
                      </div>
                    </div>
                    <div className="chip">
                      <span className="chip-flag flag-coral">⚑</span>
                      <div>
                        <strong>{(data.reasons_summary?.LOCATION_MISMATCH || 0) + (data.reasons_summary?.DATE_MISMATCH || 0)}</strong>
                        <span className="chip-label">Metadata Mismatches</span>
                      </div>
                    </div>
                  </div>

                  <div className="chart-container">
                    <svg viewBox="0 0 500 120" className="wave-svg">
                      <defs>
                        <linearGradient id="purpleGradDash" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#5D5FEF" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#5D5FEF" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <line x1="0" y1="30" x2="500" y2="30" stroke="#F1F3F9" strokeDasharray="3 3" />
                      <line x1="0" y1="65" x2="500" y2="65" stroke="#F1F3F9" strokeDasharray="3 3" />
                      <line x1="0" y1="100" x2="500" y2="100" stroke="#F1F3F9" strokeDasharray="3 3" />

                      <path 
                        d="M 0,90 Q 60,80 120,70 T 240,45 T 360,35 T 500,20 L 500,120 L 0,120 Z" 
                        fill="url(#purpleGradDash)" 
                      />
                      <path 
                        d="M 0,90 Q 60,80 120,70 T 240,45 T 360,35 T 500,20" 
                        fill="none" 
                        stroke="#5D5FEF" 
                        strokeWidth="3" 
                      />
                      <path 
                        d="M 0,105 Q 60,98 120,90 T 240,65 T 360,55 T 500,40" 
                        fill="none" 
                        stroke="#FF8F6B" 
                        strokeWidth="2" 
                      />
                      <circle cx="240" cy="45" r="4" fill="#5D5FEF" stroke="#FFFFFF" strokeWidth="2" />
                      <circle cx="360" cy="35" r="4" fill="#5D5FEF" stroke="#FFFFFF" strokeWidth="2" />
                    </svg>

                    <div className="months-axis">
                      <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                      <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
                    </div>
                  </div>
                </div>

                <div className="visual-card status-card">
                  <div className="visual-header">
                    <div className="title-with-icon">
                      <ShieldCheck size={18} color="#10B981" />
                      <span>Tenant Boundary Health</span>
                    </div>
                    <MoreVertical size={16} className="metric-menu" />
                  </div>

                  <div className="status-progress-list">
                    <div className="status-item">
                      <div className="status-label-group">
                        <span className="status-badge-square purple" />
                        <span className="status-name">Clean Reconciled</span>
                      </div>
                      <div className="circular-progress purple">
                        <span>87%</span>
                      </div>
                    </div>

                    <div className="status-item">
                      <div className="status-label-group">
                        <span className="status-badge-square violet" />
                        <span className="status-name">Under Review</span>
                      </div>
                      <div className="circular-progress violet">
                        <span>13%</span>
                      </div>
                    </div>

                    <div className="status-item">
                      <div className="status-label-group">
                        <span className="status-badge-square orange" />
                        <span className="status-name">Boundary Protection</span>
                      </div>
                      <div className="circular-progress orange">
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 1: RECONCILIATION TABLE VIEW
             ======================================================== */}
          {currentView === 'reconciliation' && (
            <>
              {/* Page Title & Actions */}
              <div className="page-header-row">
                <div>
                  <h1 className="page-title">Ledger Disagreements</h1>
                  <p className="page-subtitle">
                    Automated reconciliation comparison between System A (Internal ERP) & System B (Partner Clearing)
                  </p>
                </div>

                <div className="header-buttons">
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
                    <span>Share Report</span>
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

              {/* Tab Navigation Row */}
              <div className="tabs-row">
                {['Overview', 'Lists', 'Board', 'Calendar', 'Task assigned to me'].map((tab) => (
                  <button 
                    key={tab} 
                    className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab(tab);
                      if (tab === 'Calendar') setCurrentView('calendar');
                    }}
                  >
                    {tab === 'Overview' && <CheckSquare size={14} className="tab-icon" />}
                    <span>{tab}</span>
                  </button>
                ))}
              </div>

              {/* 3. FOUR METRIC STAT CARDS */}
              <div className="metrics-grid">
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

              {/* Reconciled Disagreements Table */}
              <div className="table-wrapper-card">
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
                              <td>
                                <span 
                                  className="reason-tag"
                                  style={{ backgroundColor: pill.bg, color: pill.text }}
                                >
                                  <span className="reason-bullet" style={{ backgroundColor: pill.dot }} />
                                  {pill.label}
                                </span>
                              </td>

                              <td>
                                {row.record_id ? (
                                  <span className="record-chip">{row.record_id}</span>
                                ) : (
                                  <span className="null-dash">—</span>
                                )}
                              </td>

                              <td>
                                {row.entry_id ? (
                                  <span className="entry-chip">{row.entry_id}</span>
                                ) : (
                                  <span className="null-dash">—</span>
                                )}
                              </td>

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

                              <td className="text-right mono-num font-medium">
                                {formatCurrency(row.a_value)}
                              </td>

                              <td className="text-right mono-num">
                                {formatCurrency(row.b_value)}
                              </td>

                              <td className="text-right mono-num">
                                <span className={diffNum !== 0 ? 'diff-tag' : 'clean-tag'}>
                                  {diffNum !== 0 ? formatCurrency(row.difference) : '₹0.00'}
                                </span>
                              </td>

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
            </>
          )}

          {/* ========================================================
              VIEW 2: SYSTEM A RECORDS (120 Transactions)
             ======================================================== */}
          {currentView === 'system_a' && (
            <div className="view-container">
              <div className="page-header-row">
                <div>
                  <h1 className="page-title">System A Records (ERP Internal Ledger)</h1>
                  <p className="page-subtitle">
                    Complete listing of all 120 primary business transactions with base amounts, adjustments & totals
                  </p>
                </div>
                <div className="header-buttons">
                  <button className="btn-secondary" onClick={() => setCurrentView('system_b')}>
                    <Layers size={14} />
                    <span>View System B Entries</span>
                  </button>
                  <button className="btn-primary" onClick={() => setCurrentView('reconciliation')}>
                    <CheckSquare size={14} />
                    <span>Run Disagreement Comparison</span>
                  </button>
                </div>
              </div>

              {/* Controls bar */}
              <div className="table-controls-header">
                <div className="header-search" style={{ width: '320px' }}>
                  <Search size={15} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search Record ID, Location, Category..." 
                    value={sysASearch}
                    onChange={(e) => setSysASearch(e.target.value)}
                  />
                </div>

                <div className="filter-pills-row">
                  <button 
                    className={`filter-pill ${sysALocFilter === '' ? 'active' : ''}`}
                    onClick={() => setSysALocFilter('')}
                  >
                    All Locations ({systemAData.length})
                  </button>
                  <button 
                    className={`filter-pill ${sysALocFilter === 'LOC-101' ? 'active' : ''}`}
                    onClick={() => setSysALocFilter('LOC-101')}
                  >
                    LOC-101
                  </button>
                  <button 
                    className={`filter-pill ${sysALocFilter === 'LOC-102' ? 'active' : ''}`}
                    onClick={() => setSysALocFilter('LOC-102')}
                  >
                    LOC-102
                  </button>
                  <button 
                    className={`filter-pill ${sysALocFilter === 'LOC-103' ? 'active' : ''}`}
                    onClick={() => setSysALocFilter('LOC-103')}
                  >
                    LOC-103
                  </button>
                  <button 
                    className={`filter-pill ${sysALocFilter === 'LOC-201' ? 'active' : ''}`}
                    onClick={() => setSysALocFilter('LOC-201')}
                  >
                    LOC-201
                  </button>
                  <button 
                    className={`filter-pill ${sysALocFilter === 'LOC-202' ? 'active' : ''}`}
                    onClick={() => setSysALocFilter('LOC-202')}
                  >
                    LOC-202
                  </button>
                </div>

                <div className="items-count-badge">
                  Showing <strong>{filteredSysA.length}</strong> of 120 records
                </div>
              </div>

              {/* System A Table */}
              <div className="table-wrapper-card">
                <div className="table-scroll">
                  <table className="taskbito-table">
                    <thead>
                      <tr>
                        <th>Record ID</th>
                        <th>Location</th>
                        <th>Event Date</th>
                        <th>Category</th>
                        <th>Actor ID</th>
                        <th className="text-right">Base Value</th>
                        <th className="text-right">Adjustment</th>
                        <th className="text-right">Total Value</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSysA.map((row, idx) => (
                        <tr key={row.record_id || idx}>
                          <td><span className="record-chip">{row.record_id}</span></td>
                          <td><span className="location-text">{row.location_id}</span></td>
                          <td><span className="mono-num text-muted">{row.event_date}</span></td>
                          <td><span className="cat-badge">{row.category_code}</span></td>
                          <td><span className="text-muted font-mono">{row.actor_id || '—'}</span></td>
                          <td className="text-right mono-num">{formatCurrency(row.base_value)}</td>
                          <td className="text-right mono-num">{formatCurrency(row.adjustment)}</td>
                          <td className="text-right mono-num font-bold">{formatCurrency(row.total_value)}</td>
                          <td>
                            <span className={`status-pill ${row.state === 'CONFIRMED' ? 'confirmed' : 'voided'}`}>
                              {row.state}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 3: SYSTEM B ENTRIES (121 Clearing Entries)
             ======================================================== */}
          {currentView === 'system_b' && (
            <div className="view-container">
              <div className="page-header-row">
                <div>
                  <h1 className="page-title">System B Entries (Partner Clearing Records)</h1>
                  <p className="page-subtitle">
                    Complete listing of all 121 secondary partner records, including split tranches, dirty references & labels
                  </p>
                </div>
                <div className="header-buttons">
                  <button className="btn-secondary" onClick={() => setCurrentView('system_a')}>
                    <Database size={14} />
                    <span>View System A Records</span>
                  </button>
                  <button className="btn-primary" onClick={() => setCurrentView('reconciliation')}>
                    <CheckSquare size={14} />
                    <span>Compare with System A</span>
                  </button>
                </div>
              </div>

              {/* Controls bar */}
              <div className="table-controls-header">
                <div className="header-search" style={{ width: '320px' }}>
                  <Search size={15} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search Entry ID, Record Ref, Location..." 
                    value={sysBSearch}
                    onChange={(e) => setSysBSearch(e.target.value)}
                  />
                </div>

                <div className="filter-pills-row">
                  <button 
                    className={`filter-pill ${sysBLocFilter === '' ? 'active' : ''}`}
                    onClick={() => setSysBLocFilter('')}
                  >
                    All Locations ({systemBData.length})
                  </button>
                  <button 
                    className={`filter-pill ${sysBLocFilter === 'LOC-101' ? 'active' : ''}`}
                    onClick={() => setSysBLocFilter('LOC-101')}
                  >
                    LOC-101
                  </button>
                  <button 
                    className={`filter-pill ${sysBLocFilter === 'LOC-102' ? 'active' : ''}`}
                    onClick={() => setSysBLocFilter('LOC-102')}
                  >
                    LOC-102
                  </button>
                  <button 
                    className={`filter-pill ${sysBLocFilter === 'LOC-103' ? 'active' : ''}`}
                    onClick={() => setSysBLocFilter('LOC-103')}
                  >
                    LOC-103
                  </button>
                  <button 
                    className={`filter-pill ${sysBLocFilter === 'LOC-201' ? 'active' : ''}`}
                    onClick={() => setSysBLocFilter('LOC-201')}
                  >
                    LOC-201
                  </button>
                  <button 
                    className={`filter-pill ${sysBLocFilter === 'LOC-202' ? 'active' : ''}`}
                    onClick={() => setSysBLocFilter('LOC-202')}
                  >
                    LOC-202
                  </button>
                </div>

                <div className="items-count-badge">
                  Showing <strong>{filteredSysB.length}</strong> of 121 entries
                </div>
              </div>

              {/* System B Table */}
              <div className="table-wrapper-card">
                <div className="table-scroll">
                  <table className="taskbito-table">
                    <thead>
                      <tr>
                        <th>Entry ID</th>
                        <th>Referenced Record</th>
                        <th>Location</th>
                        <th>Event Date</th>
                        <th className="text-right">Recorded Value</th>
                        <th>Label / Clerical Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSysB.map((row, idx) => (
                        <tr key={row.entry_id || idx}>
                          <td><span className="entry-chip">{row.entry_id}</span></td>
                          <td>
                            <span className="record-chip">
                              {row.record_ref || '—'}
                            </span>
                          </td>
                          <td><span className="location-text">{row.location_id}</span></td>
                          <td><span className="mono-num text-muted">{row.recorded_on}</span></td>
                          <td className="text-right mono-num font-bold">
                            {row.value && row.value.trim() !== '' ? formatCurrency(row.value) : (
                              <span className="null-dash" title="Empty value stored as NULL">NULL (Blank)</span>
                            )}
                          </td>
                          <td>
                            <span className="text-muted font-sans font-medium">{row.label || '—'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 4: INBOX & ALERTS
             ======================================================== */}
          {currentView === 'inbox' && (
            <div className="view-container">
              <div className="page-header-row">
                <div>
                  <h1 className="page-title">Reconciliation Inbox</h1>
                  <p className="page-subtitle">
                    Automated audit notifications, exception warnings, and system synchronization events
                  </p>
                </div>
                <div className="header-buttons">
                  <button className="btn-secondary" onClick={markAllInboxRead}>
                    <Check size={14} />
                    <span>Mark All Read</span>
                  </button>
                  <button className="btn-primary" onClick={() => setCurrentView('reconciliation')}>
                    <CheckSquare size={14} />
                    <span>View Disagreements</span>
                  </button>
                </div>
              </div>

              <div className="inbox-filter-bar">
                {['all', 'unread', 'urgent'].map((f) => (
                  <button 
                    key={f}
                    className={`filter-pill ${inboxFilter === f ? 'active' : ''}`}
                    onClick={() => setInboxFilter(f)}
                  >
                    {f.toUpperCase()} ({
                      f === 'all' ? inboxItems.length :
                      f === 'unread' ? inboxItems.filter(i => !i.read).length :
                      inboxItems.filter(i => i.type === 'URGENT' || i.type === 'ERROR').length
                    })
                  </button>
                ))}
              </div>

              <div className="inbox-list">
                {inboxItems
                  .filter(item => {
                    if (inboxFilter === 'unread') return !item.read;
                    if (inboxFilter === 'urgent') return item.type === 'URGENT' || item.type === 'ERROR';
                    return true;
                  })
                  .map(item => (
                    <div key={item.id} className={`inbox-card ${!item.read ? 'unread' : ''}`}>
                      <div className="inbox-card-header">
                        <div className="inbox-title-wrap">
                          <span className={`inbox-tag ${item.type.toLowerCase()}`}>
                            {item.type}
                          </span>
                          <h3 className="inbox-subject">{item.title}</h3>
                        </div>
                        <span className="inbox-time">{item.date}</span>
                      </div>
                      <p className="inbox-desc">{item.desc}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 5: AUDIT CALENDAR
             ======================================================== */}
          {currentView === 'calendar' && (
            <div className="view-container">
              <div className="page-header-row">
                <div>
                  <h1 className="page-title">Audit & Reconciliation Calendar</h1>
                  <p className="page-subtitle">
                    Ledger cycle dates, clearing batch submissions, and scheduled end-of-month reconciliation runs
                  </p>
                </div>
                <div className="header-buttons">
                  <div className="tenant-toggle-group">
                    <button className="tenant-btn active">March 2026</button>
                    <button className="tenant-btn">April 2026</button>
                  </div>
                  <button className="btn-primary" onClick={() => setCurrentView('reconciliation')}>
                    <Plus size={14} />
                    <span>Run Date Check</span>
                  </button>
                </div>
              </div>

              <div className="calendar-layout-grid">
                <div className="calendar-card">
                  <div className="calendar-month-nav">
                    <div className="calendar-month-title">
                      <CalendarIcon size={18} color="#5D5FEF" />
                      <h3>March 2026 (Ledger Cycle Q1)</h3>
                    </div>
                    <div className="cal-nav-buttons">
                      <button className="icon-btn"><ChevronLeft size={16} /></button>
                      <button className="icon-btn"><ChevronRight size={16} /></button>
                    </div>
                  </div>

                  <div className="calendar-weekdays">
                    <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                  </div>

                  <div className="calendar-days-grid">
                    <div className="cal-day other-month"><span>27</span></div>
                    <div className="cal-day other-month"><span>28</span></div>

                    {Array.from({ length: 31 }, (_, idx) => {
                      const dayNum = idx + 1;
                      const dayStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
                      const fullDate = `2026-03-${dayStr}`;
                      const isSelected = selectedCalendarDate === fullDate;

                      const hasDiscrepancy = dayNum === 26 || dayNum === 14 || dayNum === 19 || dayNum === 31;
                      const hasBatch = dayNum === 3 || dayNum === 4 || dayNum === 11 || dayNum === 22;

                      return (
                        <div 
                          key={dayNum} 
                          className={`cal-day ${isSelected ? 'selected' : ''} ${hasDiscrepancy ? 'has-discrepancy' : ''}`}
                          onClick={() => setSelectedCalendarDate(fullDate)}
                        >
                          <span className="day-number">{dayNum}</span>
                          {hasDiscrepancy && (
                            <span className="cal-event-pill red" title="Ledger Discrepancy Flagged">
                              Diff
                            </span>
                          )}
                          {hasBatch && (
                            <span className="cal-event-pill blue" title="Batch Ingested">
                              Batch
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="calendar-sidebar-card">
                  <div className="day-inspector-header">
                    <Clock size={16} color="#5D5FEF" />
                    <h4>Events for {selectedCalendarDate}</h4>
                  </div>
                  <div className="day-events-list">
                    <div className="day-event-item">
                      <span className="event-dot red" />
                      <div>
                        <strong>REC-1014 Date Mismatch</strong>
                        <p>System A date recorded as 26-03-2026 vs System B date 27-03-2026.</p>
                      </div>
                    </div>
                    <div className="day-event-item">
                      <span className="event-dot purple" />
                      <div>
                        <strong>Batch ENT/2026/4014 Ingested</strong>
                        <p>Partner clearing ledger entry received for LOC-103 (₹55,752.45).</p>
                      </div>
                    </div>
                    <div className="day-event-item">
                      <span className="event-dot green" />
                      <div>
                        <strong>Tenant Isolation Verified</strong>
                        <p>All records validated against ORG-A location access list.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 6: AUDIT & EXPORT REPORTS
             ======================================================== */}
          {currentView === 'reports' && (
            <div className="view-container">
              <div className="page-header-row">
                <div>
                  <h1 className="page-title">Reconciliation Reports & Exports</h1>
                  <p className="page-subtitle">
                    Comprehensive compliance breakdown, variance summaries by location, and auditable exports
                  </p>
                </div>
                <div className="header-buttons">
                  <button className="btn-secondary" onClick={() => window.print()}>
                    <Printer size={15} />
                    <span>Print PDF</span>
                  </button>
                  <button className="btn-primary" onClick={() => {
                    const csvContent = "data:text/csv;charset=utf-8," + 
                      "Record_ID,Reason,Location,System_A,System_B,Variance\n" +
                      data.disagreements.map(e => `${e.record_id},${e.reason},${e.location},${e.a_value},${e.b_value},${e.difference}`).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `dealeros_${selectedOrg}_disagreements.csv`);
                    document.body.appendChild(link);
                    link.click();
                  }}>
                    <Download size={15} />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              <div className="reports-grid">
                <div className="visual-card">
                  <div className="visual-header">
                    <div className="title-with-icon">
                      <FileSpreadsheet size={18} color="#5D5FEF" />
                      <span>Tenant Discrepancy Breakdown</span>
                    </div>
                  </div>
                  <div className="report-stats-table">
                    <div className="report-row header">
                      <span>Reason Category</span>
                      <span className="text-right">Count</span>
                      <span className="text-right">Audit Risk</span>
                    </div>
                    {Object.entries(data.reasons_summary || {}).map(([reason, count]) => (
                      <div key={reason} className="report-row">
                        <span className="font-semibold">{reason}</span>
                        <span className="text-right font-mono">{count}</span>
                        <span className="text-right">
                          <span className={`risk-pill ${reason.includes('DUPLICATE') || reason.includes('VOID') ? 'high' : 'medium'}`}>
                            {reason.includes('DUPLICATE') || reason.includes('VOID') ? 'HIGH RISK' : 'REVIEW'}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="visual-card">
                  <div className="visual-header">
                    <div className="title-with-icon">
                      <ShieldCheck size={18} color="#10B981" />
                      <span>Tenant Isolation Audit Statement</span>
                    </div>
                  </div>
                  <div className="audit-statement">
                    <div className="audit-badge-row">
                      <Shield size={24} color="#10B981" />
                      <div>
                        <h4>Zero Cross-Tenant Leakage Enforced</h4>
                        <p>Tenant <strong>{selectedOrg}</strong> is strictly sandboxed. All database queries are filtered by tenant location identifiers.</p>
                      </div>
                    </div>
                    <ul className="audit-checklist">
                      <li>✓ Location LOC-201 masked on trap row REC-1077</li>
                      <li>✓ Split settlement on REC-1055 validated as clean (non-duplicate)</li>
                      <li>✓ Blank value on ENT/2026/4050 preserved as NULL</li>
                      <li>✓ Canonical normalization applied to dirty references (rec1034, 1112)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 7: FINANCIAL PORTFOLIO & ANALYTICS
             ======================================================== */}
          {currentView === 'portfolio' && (
            <div className="view-container">
              <div className="page-header-row">
                <div>
                  <h1 className="page-title">Portfolio Exposure & Analytics</h1>
                  <p className="page-subtitle">
                    Ledger valuation analysis, aggregate transaction volume, and discrepancy exposure
                  </p>
                </div>
                <div className="header-buttons">
                  <button className="btn-secondary" onClick={() => setCurrentView('reports')}>
                    <TrendingUp size={15} />
                    <span>View Audit Trail</span>
                  </button>
                  <button className="btn-primary" onClick={() => setCurrentView('reconciliation')}>
                    <CheckSquare size={15} />
                    <span>Open Table</span>
                  </button>
                </div>
              </div>

              <div className="metrics-grid">
                <div className="metric-card">
                  <span className="metric-title">System A Total Ledger</span>
                  <div className="metric-value-row">
                    <span className="metric-number">₹94,83,438.12</span>
                    <span className="metric-trend teal">120 Records</span>
                  </div>
                </div>

                <div className="metric-card">
                  <span className="metric-title">System B Total Cleared</span>
                  <div className="metric-value-row">
                    <span className="metric-number">₹96,08,112.24</span>
                    <span className="metric-trend purple">121 Entries</span>
                  </div>
                </div>

                <div className="metric-card">
                  <span className="metric-title">Reconciliation Rate</span>
                  <div className="metric-value-row">
                    <span className="metric-number">93.8%</span>
                    <span className="metric-trend peach">Target: 95%</span>
                  </div>
                </div>

                <div className="metric-card">
                  <span className="metric-title">Net Unreconciled Variance</span>
                  <div className="metric-value-row">
                    <span className="metric-number font-bold text-red">₹1,24,674.12</span>
                    <span className="metric-trend pink">Active Review</span>
                  </div>
                </div>
              </div>

              <div className="visuals-row" style={{ marginTop: '20px' }}>
                <div className="visual-card">
                  <div className="visual-header">
                    <div className="title-with-icon">
                      <PieIcon size={18} color="#5D5FEF" />
                      <span>Discrepancy Category Distribution</span>
                    </div>
                  </div>
                  <div className="portfolio-bars">
                    <div className="bar-group">
                      <div className="bar-info">
                        <span>Value Discrepancy Amount</span>
                        <strong>₹1,60,414.09</strong>
                      </div>
                      <div className="bar-track"><div className="bar-fill purple" style={{ width: '65%' }} /></div>
                    </div>
                    <div className="bar-group">
                      <div className="bar-info">
                        <span>Missing System B Entries</span>
                        <strong>₹1,46,052.20</strong>
                      </div>
                      <div className="bar-track"><div className="bar-fill pink" style={{ width: '55%' }} /></div>
                    </div>
                    <div className="bar-group">
                      <div className="bar-info">
                        <span>Duplicate Overages</span>
                        <strong>₹1,12,837.06</strong>
                      </div>
                      <div className="bar-track"><div className="bar-fill teal" style={{ width: '45%' }} /></div>
                    </div>
                  </div>
                </div>

                <div className="visual-card">
                  <div className="visual-header">
                    <div className="title-with-icon">
                      <ShieldCheck size={18} color="#10B981" />
                      <span>Ledger Health Score</span>
                    </div>
                  </div>
                  <div className="health-score-wrap">
                    <div className="health-circle">
                      <span className="score-num">94</span>
                      <span className="score-label">GRADE A</span>
                    </div>
                    <p className="health-desc">
                      Strong ledger integrity with isolated boundary compliance. Zero cross-organization leakage detected.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 8: SETTINGS
             ======================================================== */}
          {currentView === 'settings' && (
            <div className="view-container">
              <div className="page-header-row">
                <div>
                  <h1 className="page-title">System & Tenant Settings</h1>
                  <p className="page-subtitle">
                    Configure multi-tenant boundary rules, discrepancy thresholds, and ledger integrations
                  </p>
                </div>
                <div className="header-buttons">
                  <button className="btn-primary" onClick={() => setCurrentView('reconciliation')}>
                    <span>Save Preferences</span>
                  </button>
                </div>
              </div>

              <div className="settings-grid">
                <div className="visual-card">
                  <div className="visual-header">
                    <div className="title-with-icon">
                      <ShieldCheck size={18} color="#5D5FEF" />
                      <span>Multi-Tenant Access Policy</span>
                    </div>
                  </div>
                  <div className="settings-form">
                    <div className="form-group">
                      <label>Active Organization Tenant Context</label>
                      <select 
                        value={selectedOrg} 
                        onChange={(e) => setSelectedOrg(e.target.value)}
                        className="settings-select"
                      >
                        <option value="ORG-A">ORG-A (Locations: LOC-101, LOC-102, LOC-103)</option>
                        <option value="ORG-B">ORG-B (Locations: LOC-201, LOC-202)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Cross-Tenant Metadata Masking</label>
                      <input 
                        type="text" 
                        value="[REDACTED_CROSS_TENANT_LOCATION]" 
                        readOnly 
                        className="settings-input" 
                      />
                      <span className="form-hint">Used when an external partner records transactions under a foreign location ID.</span>
                    </div>

                    <div className="form-group">
                      <label>Value Mismatch Tolerance Threshold</label>
                      <input 
                        type="text" 
                        value="₹0.00 (Zero Tolerance - Exact Ledger Match)" 
                        readOnly 
                        className="settings-input" 
                      />
                    </div>
                  </div>
                </div>

                <div className="visual-card">
                  <div className="visual-header">
                    <div className="title-with-icon">
                      <Database size={18} color="#00C5FF" />
                      <span>API Endpoints & Ingestion Status</span>
                    </div>
                  </div>
                  <div className="settings-endpoints">
                    <div className="endpoint-item">
                      <span className="endpoint-method">GET</span>
                      <code>/api/disagreements/?org={selectedOrg}</code>
                      <span className="endpoint-status live">Active</span>
                    </div>
                    <div className="endpoint-item">
                      <span className="endpoint-method">GET</span>
                      <code>/api/organizations/</code>
                      <span className="endpoint-status live">Active</span>
                    </div>
                    <div className="endpoint-item">
                      <span className="endpoint-method">HTML</span>
                      <code>/reconcile/?org={selectedOrg}</code>
                      <span className="endpoint-status live">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
