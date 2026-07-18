import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Upload, X, FileText, Image as ImgIcon } from 'lucide-react';
import {
  createProject, updateProject, getProjectById, generateProjectCode,
} from '../../services/projectService.js';

const PROJECT_TYPES = ['Residential', 'Commercial', 'Mixed Use', 'Society', 'Township', 'Plotted Development'];
const STATUSES      = ['Upcoming', 'Under Construction', 'Ready to Move', 'Completed', 'On Hold'];
const AMENITIES     = [
  'Swimming Pool', 'Gym / Fitness Centre', 'Clubhouse', 'Children\'s Play Area',
  'Jogging Track', 'Garden / Landscaping', '24/7 Security', 'CCTV Surveillance',
  'Power Backup', 'Lift / Elevator', 'Covered Parking', 'Visitor Parking',
  'Tennis Court', 'Basketball Court', 'Badminton Court', 'Cricket Net',
  'Indoor Games Room', 'Community Hall', 'Amphitheatre', 'Yoga / Meditation Area',
  'Spa', 'Library', 'Co-working Space', 'EV Charging', 'Solar Power',
  'Rainwater Harvesting', 'STP Plant', 'Fire Safety System', 'Intercom',
  'Gated Community', 'ATM', 'Supermarket', 'Restaurant / Cafeteria', 'School / Daycare',
];

const EMPTY = {
  projectName: '', projectCode: '', projectType: 'Residential', status: 'Upcoming',
  rera: '', societyName: '',
  builderName: '', builderId: '', builderPhone: '', builderEmail: '',
  address: '', city: '', state: '', pincode: '', latitude: '', longitude: '',
  totalTowers: '', totalFloors: '', totalUnits: '',
  totalFlats: '', totalVillas: '', totalShops: '', totalPlots: '',
  availableUnits: '', soldUnits: '', reservedUnits: '',
  minPrice: '', maxPrice: '', pricePerSqft: '',
  launchDate: '', completionDate: '', possessionDate: '',
  amenities: [],
  images: [], documents: [],
  notes: '',
};

function SectionTitle({ n, title, desc }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">{n}</div>
      <div>
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        {desc && <p className="text-xs text-gray-500">{desc}</p>}
      </div>
    </div>
  );
}
function Field({ label, required, children, hint }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}
function Input({ className = '', ...p }) {
  return <input className={`w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 ${className}`} {...p} />;
}
function Select({ children, ...p }) {
  return (
    <select className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" {...p}>
      {children}
    </select>
  );
}

function FileDropZone({ label, accept, files, onChange, existingFiles = [], onRemoveExisting }) {
  const ref2 = useRef();
  function handleDrop(e) {
    e.preventDefault();
    onChange([...files, ...Array.from(e.dataTransfer.files)]);
  }
  function handleChange(e) {
    onChange([...files, ...Array.from(e.target.files)]);
    e.target.value = '';
  }
  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => ref2.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 px-4 py-5 text-center hover:border-orange-300 hover:bg-orange-50/30 transition-colors"
      >
        <Upload className="mb-1.5 h-5 w-5 text-gray-400" />
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="text-xs text-gray-400">Drag & drop or click</p>
        <input ref={ref2} type="file" accept={accept} multiple className="hidden" onChange={handleChange} />
      </div>
      {existingFiles.length > 0 && (
        <div className="space-y-1.5">
          {existingFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2">
              <FileText className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <a href={f.url} target="_blank" rel="noopener noreferrer"
                className="flex-1 text-xs text-blue-600 hover:underline truncate" onClick={(e) => e.stopPropagation()}>
                {f.name}
              </a>
              <span className="text-[10px] text-gray-400">Saved</span>
              {onRemoveExisting && (
                <button type="button" onClick={(e) => { e.stopPropagation(); onRemoveExisting(i); }}
                  className="text-gray-300 hover:text-red-500 transition-colors"><X className="h-3.5 w-3.5" /></button>
              )}
            </div>
          ))}
        </div>
      )}
      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-orange-100 bg-orange-50 px-3 py-2">
              {f.type?.startsWith('image/') ? <ImgIcon className="h-3.5 w-3.5 text-blue-500" /> : <FileText className="h-3.5 w-3.5 text-orange-500" />}
              <span className="flex-1 text-xs text-gray-700 truncate">{f.name}</span>
              <span className="text-[10px] text-gray-400">{f.size > 1048576 ? `${(f.size/1048576).toFixed(1)}MB` : `${Math.round(f.size/1024)}KB`}</span>
              <button type="button" onClick={() => onChange(files.filter((_, j) => j !== i))}
                className="text-gray-400 hover:text-red-500 transition-colors"><X className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectForm() {
  const navigate = useNavigate();
  const { id }   = useParams();
  const isEdit   = Boolean(id);

  const [form,      setForm]      = useState({ ...EMPTY, projectCode: generateProjectCode() });
  const [imgFiles,  setImgFiles]  = useState([]);
  const [docFiles,  setDocFiles]  = useState([]);
  const [loading,   setLoading]   = useState(isEdit);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    getProjectById(id).then((p) => {
      if (p) {
        setForm({
          ...EMPTY, ...p,
          minPrice: String(p.minPrice ?? ''), maxPrice: String(p.maxPrice ?? ''),
          pricePerSqft: String(p.pricePerSqft ?? ''),
          totalTowers: String(p.totalTowers ?? ''), totalFloors: String(p.totalFloors ?? ''),
          totalUnits: String(p.totalUnits ?? ''), totalFlats: String(p.totalFlats ?? ''),
          totalVillas: String(p.totalVillas ?? ''), totalShops: String(p.totalShops ?? ''),
          totalPlots: String(p.totalPlots ?? ''),
          availableUnits: String(p.availableUnits ?? ''), soldUnits: String(p.soldUnits ?? ''),
          reservedUnits: String(p.reservedUnits ?? ''),
          latitude: String(p.latitude ?? ''), longitude: String(p.longitude ?? ''),
        });
      }
      setLoading(false);
    });
  }, [id, isEdit]);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function toggleAmenity(a) {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a],
    }));
  }

  function removeImg(i) { setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) })); }
  function removeDoc(i) { setForm((f) => ({ ...f, documents: f.documents.filter((_, j) => j !== i) })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!form.projectName.trim()) return setError('Project name is required.');
    if (!form.projectType)        return setError('Project type is required.');

    const data = {
      ...form,
      minPrice: Number(form.minPrice) || 0, maxPrice: Number(form.maxPrice) || 0,
      pricePerSqft: Number(form.pricePerSqft) || 0,
      totalTowers: Number(form.totalTowers) || 0, totalFloors: Number(form.totalFloors) || 0,
      totalUnits: Number(form.totalUnits) || 0, totalFlats: Number(form.totalFlats) || 0,
      totalVillas: Number(form.totalVillas) || 0, totalShops: Number(form.totalShops) || 0,
      totalPlots: Number(form.totalPlots) || 0,
      availableUnits: Number(form.availableUnits) || 0, soldUnits: Number(form.soldUnits) || 0,
      reservedUnits: Number(form.reservedUnits) || 0,
      latitude: Number(form.latitude) || null, longitude: Number(form.longitude) || null,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateProject(id, data, imgFiles, docFiles);
        navigate(`/admin/projects/${id}`);
      } else {
        const newId = await createProject(data, imgFiles, docFiles);
        navigate(`/admin/projects/${newId}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to save.');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-12">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-500 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Project' : 'New Project'}</h1>
          <p className="text-sm text-gray-500">{isEdit ? 'Update project details.' : 'Create a new project or society.'}</p>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── 1. Project Identity ── */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={1} title="Project Identity" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Project Name" required>
              <Input value={form.projectName} onChange={(e) => set('projectName', e.target.value)} placeholder="e.g. Sunrise Residency Phase 2" />
            </Field>
            <Field label="Project Code" hint="Auto-generated — edit if needed">
              <Input value={form.projectCode} onChange={(e) => set('projectCode', e.target.value)} />
            </Field>
            <Field label="Project Type" required>
              <Select value={form.projectType} onChange={(e) => set('projectType', e.target.value)}>
                {PROJECT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="Society / Complex Name">
              <Input value={form.societyName} onChange={(e) => set('societyName', e.target.value)} placeholder="e.g. Green Valley Society" />
            </Field>
            <Field label="RERA Registration No." hint="Optional">
              <Input value={form.rera} onChange={(e) => set('rera', e.target.value)} placeholder="e.g. P52100012345" />
            </Field>
          </div>
        </div>

        {/* ── 2. Builder ── */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={2} title="Builder Assignment" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Builder / Developer Name">
              <Input value={form.builderName} onChange={(e) => set('builderName', e.target.value)} placeholder="Company or person name" />
            </Field>
            <Field label="Builder ID (Firestore)" hint="Optional">
              <Input value={form.builderId} onChange={(e) => set('builderId', e.target.value)} placeholder="Firestore document ID" />
            </Field>
            <Field label="Builder Phone">
              <Input type="tel" value={form.builderPhone} onChange={(e) => set('builderPhone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
            </Field>
            <Field label="Builder Email">
              <Input type="email" value={form.builderEmail} onChange={(e) => set('builderEmail', e.target.value)} placeholder="builder@company.com" />
            </Field>
          </div>
        </div>

        {/* ── 3. Location ── */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={3} title="Location" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Address" className="sm:col-span-2">
              <Input value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Plot no, street, area" />
            </Field>
            <Field label="City">
              <Input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="e.g. Mumbai" />
            </Field>
            <Field label="State">
              <Input value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="e.g. Maharashtra" />
            </Field>
            <Field label="Pincode">
              <Input value={form.pincode} onChange={(e) => set('pincode', e.target.value)} placeholder="6-digit pincode" />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Latitude" hint="For map embed">
                <Input type="number" step="any" value={form.latitude} onChange={(e) => set('latitude', e.target.value)} placeholder="19.0760" />
              </Field>
              <Field label="Longitude">
                <Input type="number" step="any" value={form.longitude} onChange={(e) => set('longitude', e.target.value)} placeholder="72.8777" />
              </Field>
            </div>
          </div>
        </div>

        {/* ── 4. Structure ── */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={4} title="Project Structure" desc="Towers, floors, and total unit count" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Total Towers">
              <Input type="number" min="0" value={form.totalTowers} onChange={(e) => set('totalTowers', e.target.value)} placeholder="0" />
            </Field>
            <Field label="Floors per Tower">
              <Input type="number" min="0" value={form.totalFloors} onChange={(e) => set('totalFloors', e.target.value)} placeholder="0" />
            </Field>
            <Field label="Total Units">
              <Input type="number" min="0" value={form.totalUnits} onChange={(e) => set('totalUnits', e.target.value)} placeholder="0" />
            </Field>
          </div>
        </div>

        {/* ── 5. Unit Types ── */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={5} title="Unit Types & Availability" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Flats">
              <Input type="number" min="0" value={form.totalFlats} onChange={(e) => set('totalFlats', e.target.value)} placeholder="0" />
            </Field>
            <Field label="Villas">
              <Input type="number" min="0" value={form.totalVillas} onChange={(e) => set('totalVillas', e.target.value)} placeholder="0" />
            </Field>
            <Field label="Shops">
              <Input type="number" min="0" value={form.totalShops} onChange={(e) => set('totalShops', e.target.value)} placeholder="0" />
            </Field>
            <Field label="Plots">
              <Input type="number" min="0" value={form.totalPlots} onChange={(e) => set('totalPlots', e.target.value)} placeholder="0" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Available Units">
              <Input type="number" min="0" value={form.availableUnits} onChange={(e) => set('availableUnits', e.target.value)} placeholder="0" />
            </Field>
            <Field label="Sold Units">
              <Input type="number" min="0" value={form.soldUnits} onChange={(e) => set('soldUnits', e.target.value)} placeholder="0" />
            </Field>
            <Field label="Reserved / Booked">
              <Input type="number" min="0" value={form.reservedUnits} onChange={(e) => set('reservedUnits', e.target.value)} placeholder="0" />
            </Field>
          </div>
        </div>

        {/* ── 6. Pricing ── */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={6} title="Pricing" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Min Price (₹)">
              <Input type="number" min="0" value={form.minPrice} onChange={(e) => set('minPrice', e.target.value)} placeholder="0" />
            </Field>
            <Field label="Max Price (₹)">
              <Input type="number" min="0" value={form.maxPrice} onChange={(e) => set('maxPrice', e.target.value)} placeholder="0" />
            </Field>
            <Field label="Price per sq.ft (₹)">
              <Input type="number" min="0" value={form.pricePerSqft} onChange={(e) => set('pricePerSqft', e.target.value)} placeholder="0" />
            </Field>
          </div>
        </div>

        {/* ── 7. Key Dates ── */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={7} title="Key Dates" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Launch Date">
              <Input type="date" value={form.launchDate} onChange={(e) => set('launchDate', e.target.value)} />
            </Field>
            <Field label="Expected Completion">
              <Input type="date" value={form.completionDate} onChange={(e) => set('completionDate', e.target.value)} />
            </Field>
            <Field label="Possession Date">
              <Input type="date" value={form.possessionDate} onChange={(e) => set('possessionDate', e.target.value)} />
            </Field>
          </div>
        </div>

        {/* ── 8. Amenities ── */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={8} title="Amenities" desc={`${form.amenities.length} selected`} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {AMENITIES.map((a) => (
              <label key={a} className={[
                'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                form.amenities.includes(a)
                  ? 'border-orange-300 bg-orange-50 text-orange-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-orange-200',
              ].join(' ')}>
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-orange-500"
                  checked={form.amenities.includes(a)}
                  onChange={() => toggleAmenity(a)}
                />
                {a}
              </label>
            ))}
          </div>
        </div>

        {/* ── 9. Project Gallery ── */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={9} title="Project Gallery" desc="Images, renders, master layout previews" />
          <FileDropZone
            label="Drop images here"
            accept=".jpg,.jpeg,.png,.webp"
            files={imgFiles}
            onChange={setImgFiles}
            existingFiles={form.images}
            onRemoveExisting={removeImg}
          />
        </div>

        {/* ── 10. Documents ── */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={10} title="Documents" desc="Brochure, master layout PDF, approval letters, floor plans" />
          <FileDropZone
            label="Drop documents here"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            files={docFiles}
            onChange={setDocFiles}
            existingFiles={form.documents}
            onRemoveExisting={removeDoc}
          />
        </div>

        {/* ── 11. Notes ── */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <SectionTitle n={11} title="Notes" />
          <textarea
            rows={3}
            placeholder="Internal notes, remarks or instructions…"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)}
            className="flex-1 rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : isEdit ? 'Update Project' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  );
}
