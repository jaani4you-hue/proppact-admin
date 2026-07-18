import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Plus, X, Building2, MapPin, Users2,
  CheckCircle2, Home, ShoppingBag, FileText, Image as ImgIcon,
  ExternalLink, Phone, Mail, Loader2, LayoutGrid, IndianRupee,
  Calendar, ClipboardList, Layers,
} from 'lucide-react';
import {
  subscribeToProjectById,
  subscribeToUnits,
  addUnit, updateUnit, deleteUnit, updateUnitStatus,
} from '../../services/projectService.js';
import ProjectStatusBadge from '../../components/projects/ProjectStatusBadge.jsx';
import ProjectTypeBadge from '../../components/projects/ProjectTypeBadge.jsx';
import UnitStatusBadge from '../../components/projects/UnitStatusBadge.jsx';

function fmt(n) {
  if (!n) return '—';
  if (n >= 10000000) return `₹${(n/10000000).toFixed(2)}Cr`;
  if (n >= 100000)   return `₹${(n/100000).toFixed(2)}L`;
  return `₹${Number(n).toLocaleString('en-IN')}`;
}
function fmtDate(v) {
  if (!v) return '—';
  if (v?.toDate) return v.toDate().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
  return new Date(v).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-2 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-800 text-right">{value || '—'}</span>
    </div>
  );
}

function StatPill({ label, value, color = 'gray' }) {
  const cols = {
    orange:'bg-orange-50 text-orange-700 border-orange-100',
    green :'bg-green-50  text-green-700  border-green-100',
    red   :'bg-red-50    text-red-700    border-red-100',
    blue  :'bg-blue-50   text-blue-700   border-blue-100',
    amber :'bg-amber-50  text-amber-700  border-amber-100',
    gray  :'bg-gray-50   text-gray-700   border-gray-100',
  };
  return (
    <div className={`flex flex-col items-center rounded-xl border px-3 py-3 ${cols[color]}`}>
      <span className="text-[10px] uppercase font-medium opacity-70 mb-0.5">{label}</span>
      <span className="text-lg font-bold">{value}</span>
    </div>
  );
}

// ── Unit Modal (Add / Edit) ───────────────────────────────────────────────────
const UNIT_TYPES  = ['Flat','Villa','Shop','Plot','Penthouse','Studio','Office'];
const UNIT_STATUS = ['Available','Sold','Reserved','Booked'];
const FURNISHING  = ['Unfurnished','Semi-Furnished','Furnished'];

const UNIT_EMPTY = {
  unitNumber:'', unitType:'Flat', tower:'', floor:'', bhk:'',
  area:'', facing:'', status:'Available', price:'',
  bookedBy:'', bookedById:'', bookingDate:'',
  parkingIncluded: false, furnishing:'Unfurnished', notes:'',
};

function UnitModal({ projectId, unit, onClose }) {
  const [form,  setForm]  = useState(unit ? { ...UNIT_EMPTY, ...unit, area:String(unit.area||''), price:String(unit.price||''), floor:String(unit.floor||''), bhk:String(unit.bhk||'') } : UNIT_EMPTY);
  const [saving,setSaving]= useState(false);
  const [error, setError] = useState(null);
  const isEdit = Boolean(unit?.id);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.unitNumber.trim()) return setError('Unit number is required.');
    setSaving(true);
    try {
      if (isEdit) await updateUnit(unit.id, { ...form, projectId });
      else        await addUnit(projectId, form);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save unit.');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl my-4">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-orange-500" />
            <h3 className="font-semibold text-gray-900">{isEdit ? 'Edit Unit' : 'Add Unit'}</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Unit No. <span className="text-red-500">*</span></label>
              <input value={form.unitNumber} onChange={(e) => set('unitNumber', e.target.value)} placeholder="e.g. A-401"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Unit Type</label>
              <select value={form.unitType} onChange={(e) => set('unitType', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100">
                {UNIT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Tower</label>
              <input value={form.tower} onChange={(e) => set('tower', e.target.value)} placeholder="e.g. Tower A"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Floor</label>
              <input type="number" min="0" value={form.floor} onChange={(e) => set('floor', e.target.value)} placeholder="4"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">BHK</label>
              <input type="number" min="1" max="10" value={form.bhk} onChange={(e) => set('bhk', e.target.value)} placeholder="2"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Area (sq.ft)</label>
              <input type="number" min="0" value={form.area} onChange={(e) => set('area', e.target.value)} placeholder="1200"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Facing</label>
              <input value={form.facing} onChange={(e) => set('facing', e.target.value)} placeholder="East / Garden"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Price (₹)</label>
              <input type="number" min="0" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="0"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100">
                {UNIT_STATUS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Furnishing</label>
              <select value={form.furnishing} onChange={(e) => set('furnishing', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100">
                {FURNISHING.map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {/* Booking info (show when not Available) */}
          {form.status !== 'Available' && (
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 space-y-2">
              <p className="text-xs font-semibold text-amber-700 uppercase">Booking Details</p>
              <div className="grid grid-cols-2 gap-2">
                <input value={form.bookedBy} onChange={(e) => set('bookedBy', e.target.value)} placeholder="Booked by (name)"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                <input type="date" value={form.bookingDate} onChange={(e) => set('bookingDate', e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
              </div>
            </div>
          )}

          {/* Parking */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.parkingIncluded} onChange={(e) => set('parkingIncluded', e.target.checked)} className="h-4 w-4 accent-orange-500 rounded" />
            <span className="text-sm text-gray-700">Parking included</span>
          </label>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Notes</label>
            <textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Remarks…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none" />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-orange-500 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? 'Saving…' : isEdit ? 'Update Unit' : 'Add Unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ images, idx, onClose }) {
  const [cur, setCur] = useState(idx);
  if (!images[cur]) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"><X className="h-5 w-5" /></button>
      {cur > 0 && (
        <button onClick={(e) => { e.stopPropagation(); setCur(cur-1); }}
          className="absolute left-4 rounded-full bg-white/10 px-3 py-2 text-white hover:bg-white/20 transition-colors text-lg">‹</button>
      )}
      <img src={images[cur].url} alt="" className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
      {cur < images.length - 1 && (
        <button onClick={(e) => { e.stopPropagation(); setCur(cur+1); }}
          className="absolute right-4 rounded-full bg-white/10 px-3 py-2 text-white hover:bg-white/20 transition-colors text-lg">›</button>
      )}
      <p className="absolute bottom-4 text-white/50 text-sm">{cur+1} / {images.length}</p>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ProjectDetails() {
  const navigate    = useNavigate();
  const { id }      = useParams();
  const [project,   setProject]   = useState(null);
  const [units,     setUnits]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showUnit,  setShowUnit]  = useState(null); // null | 'new' | unitObj
  const [lightbox,  setLightbox]  = useState(null);
  const [unitFilter,setUnitFilter]= useState('all');

  useEffect(() => {
    const u1 = subscribeToProjectById(id, ({ project: p }) => {
      setProject(p);
      setLoading(false);
    });
    const u2 = subscribeToUnits(id, ({ units: u }) => setUnits(u));
    return () => { u1(); u2(); };
  }, [id]);

  async function handleDeleteUnit(unitId) {
    if (!confirm('Delete this unit?')) return;
    await deleteUnit(unitId, id);
  }

  async function handleStatusChange(unitId, status) {
    await updateUnitStatus(unitId, status);
  }

  const filteredUnits = unitFilter === 'all'
    ? units
    : units.filter((u) => u.status === unitFilter);

  const unitCounts = {
    Available: units.filter((u) => u.status === 'Available').length,
    Sold      : units.filter((u) => u.status === 'Sold').length,
    Reserved  : units.filter((u) => u.status === 'Reserved').length,
    Booked    : units.filter((u) => u.status === 'Booked').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-400 border-t-transparent" />
      </div>
    );
  }
  if (!project) {
    return (
      <div className="py-20 text-center text-gray-400">
        <p className="text-lg font-semibold">Project not found.</p>
        <button onClick={() => navigate('/admin/projects')} className="mt-3 text-sm text-orange-500 hover:underline">← Back</button>
      </div>
    );
  }

  const TABS = ['overview','units','gallery','documents'];

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <button onClick={() => navigate('/admin/projects')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-500 transition-colors flex-shrink-0 mt-0.5">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900">{project.projectName}</h1>
              <ProjectStatusBadge status={project.status} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-orange-500 font-semibold">{project.projectCode}</span>
              <span className="text-gray-300">·</span>
              <ProjectTypeBadge type={project.projectType} showIcon />
              {project.city && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" />{project.city}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => setShowUnit('new')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors">
            <Plus className="h-4 w-4" /> Add Unit
          </button>
          <button onClick={() => navigate(`/admin/projects/${id}/edit`)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-orange-300 hover:text-orange-600 transition-colors">
            <Pencil className="h-4 w-4" /> Edit
          </button>
        </div>
      </div>

      {/* Hero image */}
      {project.images?.[0]?.url && (
        <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden cursor-pointer group" onClick={() => setLightbox(0)}>
          <img src={project.images[0].url} alt={project.projectName} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          {project.images.length > 1 && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5">
              <ImgIcon className="h-3.5 w-3.5 text-white" />
              <span className="text-xs text-white font-medium">{project.images.length} photos</span>
            </div>
          )}
        </div>
      )}

      {/* Stat pills */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        <StatPill label="Total Units"  value={project.totalUnits || 0}    color="orange" />
        <StatPill label="Available"    value={project.availableUnits || 0} color="green"  />
        <StatPill label="Sold"         value={project.soldUnits || 0}      color="red"    />
        <StatPill label="Reserved"     value={project.reservedUnits || 0}  color="amber"  />
        <StatPill label="Towers"       value={project.totalTowers || 0}    color="blue"   />
        <StatPill label="Floors"       value={project.totalFloors || 0}    color="gray"   />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={['px-4 py-2.5 text-sm font-medium capitalize whitespace-nowrap transition-colors border-b-2 -mb-px',
              activeTab === t ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-800'].join(' ')}>
            {t}
            {t === 'units'     && units.length > 0             && <span className="ml-1.5 rounded-full bg-orange-100 text-orange-600 px-1.5 py-0.5 text-[10px] font-bold">{units.length}</span>}
            {t === 'gallery'   && project.images?.length > 0   && <span className="ml-1.5 rounded-full bg-gray-100 text-gray-600 px-1.5 py-0.5 text-[10px] font-bold">{project.images.length}</span>}
            {t === 'documents' && project.documents?.length > 0 && <span className="ml-1.5 rounded-full bg-gray-100 text-gray-600 px-1.5 py-0.5 text-[10px] font-bold">{project.documents.length}</span>}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {activeTab === 'overview' && (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Project info */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-orange-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Project</h3>
            </div>
            <InfoRow label="Code"        value={project.projectCode} />
            <InfoRow label="Type"        value={project.projectType} />
            <InfoRow label="Status"      value={project.status} />
            <InfoRow label="Society"     value={project.societyName} />
            <InfoRow label="RERA"        value={project.rera} />
            <InfoRow label="Launch"      value={fmtDate(project.launchDate)} />
            <InfoRow label="Completion"  value={fmtDate(project.completionDate)} />
            <InfoRow label="Possession"  value={fmtDate(project.possessionDate)} />
          </div>

          {/* Builder */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Users2 className="h-4 w-4 text-blue-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Builder / Developer</h3>
            </div>
            {project.builderName ? (
              <>
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 font-bold text-sm flex-shrink-0">
                    {project.builderName[0].toUpperCase()}
                  </div>
                  <p className="font-semibold text-gray-800">{project.builderName}</p>
                </div>
                {project.builderPhone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1.5">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />{project.builderPhone}
                  </div>
                )}
                {project.builderEmail && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />{project.builderEmail}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400">No builder assigned.</p>
            )}
          </div>

          {/* Location */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-green-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Location</h3>
            </div>
            <InfoRow label="Address"  value={project.address} />
            <InfoRow label="City"     value={project.city} />
            <InfoRow label="State"    value={project.state} />
            <InfoRow label="Pincode"  value={project.pincode} />
            {project.latitude && project.longitude && (
              <div className="mt-3">
                <iframe
                  title="map"
                  className="w-full h-36 rounded-lg border border-gray-100"
                  loading="lazy"
                  src={`https://maps.google.com/maps?q=${project.latitude},${project.longitude}&z=15&output=embed`}
                />
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <IndianRupee className="h-4 w-4 text-orange-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Pricing</h3>
            </div>
            <InfoRow label="Min Price"      value={fmt(project.minPrice)} />
            <InfoRow label="Max Price"      value={fmt(project.maxPrice)} />
            <InfoRow label="Price / sq.ft"  value={project.pricePerSqft ? `₹${Number(project.pricePerSqft).toLocaleString('en-IN')}` : '—'} />
            <div className="mt-4 pt-3 border-t border-gray-50">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Unit Mix</h3>
              <div className="grid grid-cols-2 gap-2">
                {[['Flats','totalFlats'],['Villas','totalVillas'],['Shops','totalShops'],['Plots','totalPlots']].map(([lbl,key]) => (
                  <div key={key} className="rounded-lg bg-gray-50 px-3 py-2 text-center">
                    <p className="text-xs text-gray-400">{lbl}</p>
                    <p className="font-bold text-gray-800">{project[key] || 0}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Amenities */}
          {project.amenities?.length > 0 && (
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Amenities ({project.amenities.length})</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {project.amenities.map((a) => (
                  <span key={a} className="inline-flex items-center gap-1 rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    <CheckCircle2 className="h-3 w-3" />{a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {project.notes && (
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-5 shadow-sm lg:col-span-2">
              <p className="text-xs font-semibold uppercase text-amber-600 mb-1">Notes</p>
              <p className="text-sm text-gray-700 leading-relaxed">{project.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Units ── */}
      {activeTab === 'units' && (
        <div className="space-y-4">
          {/* Summary pills */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-2 flex-wrap">
              {['all','Available','Sold','Reserved','Booked'].map((s) => (
                <button key={s} onClick={() => setUnitFilter(s)}
                  className={['rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                    unitFilter === s
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600',
                  ].join(' ')}>
                  {s === 'all' ? `All (${units.length})` : `${s} (${unitCounts[s] || 0})`}
                </button>
              ))}
            </div>
            <button onClick={() => setShowUnit('new')}
              className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition-colors">
              <Plus className="h-3.5 w-3.5" /> Add Unit
            </button>
          </div>

          {filteredUnits.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-14 text-center text-sm text-gray-400">
              {units.length === 0 ? 'No units added yet. Click "Add Unit" to get started.' : 'No units match this filter.'}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {['Unit','Type','Tower / Floor','BHK / Area','Facing','Price','Status',''].map((h) => (
                      <th key={h} className="py-3 px-4 text-left text-xs font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUnits.map((u) => (
                    <tr key={u.id} className="group border-b border-gray-50 hover:bg-orange-50/20 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-800">{u.unitNumber}</p>
                        {u.bookedBy && <p className="text-[10px] text-gray-400">→ {u.bookedBy}</p>}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{u.unitType}</td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-600">{u.tower || '—'}</p>
                        {u.floor !== '' && <p className="text-[11px] text-gray-400">Floor {u.floor}</p>}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-700">{u.bhk ? `${u.bhk} BHK` : '—'}</p>
                        {u.area ? <p className="text-[11px] text-gray-400">{u.area} sq.ft</p> : null}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{u.facing || '—'}</td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-800">{fmt(u.price)}</td>
                      <td className="py-3 px-4">
                        <select
                          value={u.status}
                          onChange={(e) => handleStatusChange(u.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-full border text-[11px] font-semibold py-0.5 px-2 outline-none cursor-pointer bg-transparent
                            border-gray-200 text-gray-700 focus:border-orange-400">
                          {UNIT_STATUS.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setShowUnit(u)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDeleteUnit(u.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Gallery ── */}
      {activeTab === 'gallery' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Project Gallery ({project.images?.length ?? 0})</h3>
            <button onClick={() => navigate(`/admin/projects/${id}/edit`)} className="text-xs text-orange-500 hover:underline">Upload more →</button>
          </div>
          {!project.images?.length ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-14 text-center text-sm text-gray-400">No images uploaded.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {project.images.map((img, i) => (
                <button key={i} onClick={() => setLightbox(i)} className="group relative aspect-video overflow-hidden rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <ImgIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Documents ── */}
      {activeTab === 'documents' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Documents ({project.documents?.length ?? 0})</h3>
            <button onClick={() => navigate(`/admin/projects/${id}/edit`)} className="text-xs text-orange-500 hover:underline">Upload more →</button>
          </div>
          {!project.documents?.length ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-14 text-center text-sm text-gray-400">No documents uploaded.</div>
          ) : (
            <div className="space-y-2">
              {project.documents.map((f, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 flex-shrink-0">
                    {f.type?.startsWith('image/') ? <ImgIcon className="h-4 w-4 text-blue-500" /> : <FileText className="h-4 w-4 text-orange-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{f.name}</p>
                    {f.uploadedAt && <p className="text-[11px] text-gray-400">{fmtDate(f.uploadedAt)}</p>}
                  </div>
                  <a href={f.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-orange-300 hover:text-orange-600 transition-colors flex-shrink-0">
                    Open <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Unit modal */}
      {showUnit !== null && (
        <UnitModal
          projectId={id}
          unit={showUnit === 'new' ? null : showUnit}
          onClose={() => setShowUnit(null)}
        />
      )}

      {/* Lightbox */}
      {lightbox !== null && (
        <Lightbox images={project.images} idx={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}
