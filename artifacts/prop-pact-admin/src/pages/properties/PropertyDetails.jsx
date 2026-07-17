import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Pencil, Trash2, Phone, MapPin,
  Building2, FileText, Calendar, ExternalLink,
  User, Users, TrendingUp, Maximize2, X,
  Home, Layers, BedDouble, Bath, Wind,
  Star, ChevronLeft as Prev, ChevronRight as Next,
  Landmark, CheckCircle2, Clock,
} from 'lucide-react';
import { getPropertyById, deleteProperty } from '../../services/propertyService.js';
import PropertyStatusBadge from '../../components/properties/PropertyStatusBadge.jsx';
import PropertyDeleteDialog from '../../components/properties/PropertyDeleteDialog.jsx';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDateTime(ts) {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatRent(amount) {
  if (!amount && amount !== 0) return '—';
  const n = Number(amount);
  if (isNaN(n) || n === 0) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value, mono = false, href }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer"
            className={`mt-0.5 text-sm text-blue-600 hover:underline break-all ${mono ? 'font-mono' : ''}`}>
            {value}
          </a>
        ) : (
          <p className={`mt-0.5 text-sm text-gray-700 break-words ${mono ? 'font-mono' : ''}`}>{value}</p>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children, action }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
        <Icon className="h-4 w-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-800 flex-1">{title}</h3>
        {action}
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  );
}

function StatPill({ icon: Icon, label, value, color = 'orange' }) {
  const colorMap = {
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    blue:   'bg-blue-50 text-blue-700 border-blue-200',
    teal:   'bg-teal-50 text-teal-700 border-teal-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
    gray:   'bg-gray-50 text-gray-700 border-gray-200',
  };
  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 ${colorMap[color] ?? colorMap.gray}`}>
      <Icon className="h-4 w-4 flex-shrink-0" />
      <div>
        <p className="text-[10px] uppercase tracking-wide opacity-60">{label}</p>
        <p className="text-sm font-semibold leading-none mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ── Image Gallery ─────────────────────────────────────────────────────────────

function ImageGallery({ images }) {
  const [current, setCurrent]     = useState(0);
  const [lightbox, setLightbox]   = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="h-48 rounded-xl border border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2">
        <Building2 className="h-8 w-8 text-gray-300" />
        <p className="text-xs text-gray-400">No images uploaded</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Main image */}
        <div className="relative group rounded-xl overflow-hidden bg-gray-100 aspect-video">
          <img
            src={images[current].url}
            alt={images[current].name || `Image ${current + 1}`}
            className="h-full w-full object-cover"
          />
          {/* Nav arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <Prev className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrent((c) => (c + 1) % images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <Next className="h-4 w-4" />
              </button>
            </>
          )}
          {/* Fullscreen */}
          <button
            onClick={() => setLightbox(true)}
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          {/* Counter */}
          <div className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-[11px] text-white font-medium">
            {current + 1} / {images.length}
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={[
                  'flex-shrink-0 h-14 w-20 rounded-lg overflow-hidden border-2 transition-all',
                  idx === current ? 'border-orange-500' : 'border-transparent hover:border-gray-300',
                ].join(' ')}
              >
                <img src={img.url} alt={img.name || `Thumb ${idx + 1}`}
                  className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          {images.length > 1 && (
            <>
              <button
                onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <Prev className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrent((c) => (c + 1) % images.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <Next className="h-5 w-5" />
              </button>
            </>
          )}
          <img
            src={images[current].url}
            alt={images[current].name || `Image ${current + 1}`}
            className="max-h-[85vh] max-w-full rounded-xl object-contain"
          />
          <p className="absolute bottom-5 text-center text-sm text-white/60">
            {images[current].name || `Image ${current + 1}`} — {current + 1}/{images.length}
          </p>
        </div>
      )}
    </>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonDetails() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-7 w-40 rounded bg-gray-200" />
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden p-5 space-y-4">
        <div className="aspect-video rounded-xl bg-gray-200" />
        <div className="grid grid-cols-4 gap-3">
          {[1,2,3,4].map((n) => <div key={n} className="h-12 rounded-lg bg-gray-100" />)}
        </div>
      </div>
      {[1,2,3].map((n) => (
        <div key={n} className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-3">
          <div className="h-4 w-28 rounded bg-gray-200" />
          {[1,2].map((m) => <div key={m} className="h-3 w-full rounded bg-gray-100" />)}
        </div>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [property,      setProperty]      = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [notFound,      setNotFound]      = useState(false);
  const [showDelete,    setShowDelete]    = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError,   setDeleteError]   = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getPropertyById(id);
        if (cancelled) return;
        if (!data) setNotFound(true);
        else setProperty(data);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  async function handleDelete() {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await deleteProperty(id);
      navigate('/admin/properties');
    } catch (err) {
      setDeleteError(err.message ?? 'Failed to delete property.');
      setDeleteLoading(false);
    }
  }

  if (loading) return <SkeletonDetails />;

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 mb-4">
          <Building2 className="h-7 w-7 text-gray-400" />
        </div>
        <p className="text-sm font-semibold text-gray-700">Property not found</p>
        <p className="mt-1 text-xs text-gray-400">This property may have been deleted.</p>
        <button onClick={() => navigate('/admin/properties')}
          className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-600 transition-colors">
          Back to Properties
        </button>
      </div>
    );
  }

  const p = property;
  const ownerIds  = Array.isArray(p.ownerIds)  ? p.ownerIds  : p.ownerIds  ? String(p.ownerIds).split(',').map((s) => s.trim()).filter(Boolean)  : [];
  const tenantIds = Array.isArray(p.tenantIds) ? p.tenantIds : p.tenantIds ? String(p.tenantIds).split(',').map((s) => s.trim()).filter(Boolean) : [];
  const hasMapLocation = p.mapLat && p.mapLng;
  const googleMapsUrl = hasMapLocation
    ? `https://maps.google.com/?q=${p.mapLat},${p.mapLng}`
    : p.address && p.city
      ? `https://maps.google.com/?q=${encodeURIComponent([p.address, p.city, p.state].filter(Boolean).join(', '))}`
      : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admin/properties')}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-800 truncate">{p.title || 'Property Details'}</h1>
          <p className="text-xs text-gray-500 mt-0.5">Complete property information</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => navigate(`/admin/properties/${id}/edit`)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors">
            <Pencil className="h-3.5 w-3.5" />Edit
          </button>
          <button onClick={() => setShowDelete(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />Delete
          </button>
        </div>
      </div>

      {/* Hero: Image Gallery + Quick Stats */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="p-5">
          <ImageGallery images={p.images ?? []} />
        </div>

        {/* Header info bar */}
        <div className="px-5 pb-5 space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {p.type || '—'}
                </span>
                <PropertyStatusBadge status={p.status} />
              </div>
              <h2 className="mt-2 text-xl font-bold text-gray-800">{p.title}</h2>
              {(p.city || p.state) && (
                <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  {[p.city, p.state].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-orange-600">{formatRent(p.rentAmount)}</p>
              <p className="text-xs text-gray-400">per month</p>
            </div>
          </div>

          {/* Quick stat pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {p.area && (
              <StatPill icon={Home} label="Area" value={`${p.area} sq.ft`} color="orange" />
            )}
            {p.bedrooms != null && (
              <StatPill icon={BedDouble} label="Bedrooms" value={`${p.bedrooms} BHK`} color="blue" />
            )}
            {p.bathrooms != null && (
              <StatPill icon={Bath} label="Bathrooms" value={p.bathrooms} color="teal" />
            )}
            {(p.floor != null || p.totalFloors != null) && (
              <StatPill icon={Layers}
                label="Floor"
                value={[p.floor != null ? `${p.floor}` : null, p.totalFloors != null ? `of ${p.totalFloors}` : null].filter(Boolean).join(' ')}
                color="violet"
              />
            )}
            {p.facing && (
              <StatPill icon={Wind} label="Facing" value={p.facing} color="gray" />
            )}
            {p.balconies != null && (
              <StatPill icon={Home} label="Balconies" value={p.balconies} color="gray" />
            )}
          </div>

          {/* Description */}
          {p.description && (
            <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
              {p.description}
            </p>
          )}
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Rent & Financial */}
        <Section title="Rent & Financial" icon={TrendingUp}>
          <InfoRow icon={TrendingUp} label="Monthly Rent"          value={formatRent(p.rentAmount)} />
          <InfoRow icon={Landmark}   label="Security Deposit"      value={formatRent(p.securityDeposit)} />
          <InfoRow icon={TrendingUp} label="Maintenance Charges"   value={p.maintenanceCharges ? `${formatRent(p.maintenanceCharges)}/mo` : null} />
        </Section>

        {/* Location */}
        <Section
          title="Location"
          icon={MapPin}
          action={
            googleMapsUrl && (
              <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                <ExternalLink className="h-3 w-3" />Open in Maps
              </a>
            )
          }
        >
          <InfoRow icon={MapPin} label="Address" value={p.address} />
          <InfoRow icon={MapPin} label="City"    value={p.city} />
          <InfoRow icon={MapPin} label="State"   value={p.state} />
          <InfoRow icon={MapPin} label="Pincode" value={p.pincode} mono />
          {hasMapLocation && (
            <InfoRow icon={MapPin} label="Coordinates"
              value={`${p.mapLat}, ${p.mapLng}`}
              href={googleMapsUrl}
              mono />
          )}
        </Section>

        {/* Owners */}
        <Section title="Owner Assignment" icon={User}>
          <div className="py-3">
            {ownerIds.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {ownerIds.map((oid, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700">
                    <User className="h-3 w-3" />{oid}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-2">No owners assigned</p>
            )}
          </div>
        </Section>

        {/* Tenants */}
        <Section title="Tenant Assignment" icon={Users}>
          <div className="py-3">
            {tenantIds.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tenantIds.map((tid, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                    <Users className="h-3 w-3" />{tid}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-2">No tenants assigned</p>
            )}
          </div>
        </Section>
      </div>

      {/* Amenities */}
      {p.amenities && p.amenities.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
            <Star className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-800">Amenities</h3>
            <span className="ml-auto inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-600">
              {p.amenities.length}
            </span>
          </div>
          <div className="p-5 flex flex-wrap gap-2">
            {p.amenities.map((amenity, idx) => (
              <span key={idx} className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700">
                <CheckCircle2 className="h-3 w-3" />{amenity}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Map embed */}
      {hasMapLocation && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
            <MapPin className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-800">Map Location</h3>
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
              <ExternalLink className="h-3 w-3" />View larger
            </a>
          </div>
          <div className="h-56 overflow-hidden">
            <iframe
              title="Property Location"
              width="100%"
              height="100%"
              loading="lazy"
              src={`https://maps.google.com/maps?q=${p.mapLat},${p.mapLng}&z=15&output=embed`}
              className="border-0"
            />
          </div>
        </div>
      )}

      {/* Documents */}
      {p.documents && p.documents.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
            <FileText className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-800">Documents</h3>
            <span className="ml-auto inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-600">
              {p.documents.length}
            </span>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {p.documents.map((doc, idx) => (
              <a key={idx} href={doc.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 hover:border-orange-200 hover:bg-orange-50/40 transition-colors group">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white border border-gray-200 group-hover:border-orange-200 group-hover:bg-orange-50 transition-colors">
                  <FileText className="h-4 w-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate group-hover:text-orange-700 transition-colors">
                    {doc.name || `Document ${idx + 1}`}
                  </p>
                  {doc.uploadedAt && (
                    <p className="text-[11px] text-gray-400">
                      {new Date(doc.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-gray-300 group-hover:text-orange-400 flex-shrink-0 transition-colors" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Activity Timeline — based on adminLogs or static timestamps */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
          <Clock className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-800">Activity Timeline</h3>
        </div>
        <div className="px-5 py-4">
          <div className="space-y-0">
            {[
              p.updatedAt && p.updatedAt !== p.createdAt
                ? { label: 'Last updated', ts: p.updatedAt, color: 'bg-blue-500', textColor: 'text-blue-700', bg: 'bg-blue-50' }
                : null,
              p.createdAt
                ? { label: 'Property created', ts: p.createdAt, color: 'bg-emerald-500', textColor: 'text-emerald-700', bg: 'bg-emerald-50' }
                : null,
            ].filter(Boolean).map((item, idx, arr) => (
              <div key={idx} className="flex gap-3 relative">
                {/* Line */}
                {idx < arr.length - 1 && (
                  <div className="absolute left-[13px] top-7 bottom-0 w-0.5 bg-gray-100" />
                )}
                <div className={`mt-1 h-6 w-6 flex-shrink-0 flex items-center justify-center rounded-full ${item.color}`}>
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </div>
                <div className={`flex-1 mb-4 rounded-lg border px-3 py-2.5 ${item.bg} border-gray-100`}>
                  <p className={`text-xs font-semibold ${item.textColor}`}>{item.label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{formatDateTime(item.ts)}</p>
                </div>
              </div>
            ))}
            {!p.createdAt && (
              <p className="text-sm text-gray-400 py-2">No activity recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Record Details */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
          <Calendar className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-800">Record Details</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          <div className="px-5 py-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Created At</p>
            <p className="mt-1 text-sm text-gray-700">{formatDateTime(p.createdAt)}</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Last Updated</p>
            <p className="mt-1 text-sm text-gray-700">{formatDateTime(p.updatedAt)}</p>
          </div>
        </div>
      </div>

      {/* Delete dialog */}
      <PropertyDeleteDialog
        property={showDelete ? p : null}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => { setShowDelete(false); setDeleteError(''); }}
      />
      {deleteError && (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl border border-red-200 bg-white px-4 py-3 shadow-lg text-sm text-red-600">
          {deleteError}
        </div>
      )}
    </div>
  );
}
