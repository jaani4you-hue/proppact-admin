import { useState, useEffect, useRef } from 'react';
import {
  Building2, Settings2, Palette, Receipt, Database,
  Save, Loader2, Upload, X, Download, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { useSettings } from '../../hooks/useSettings.js';
import { updateSettings, uploadLogo, deleteLogo, exportBackup } from '../../services/settingsService.js';

// ── Shared UI ─────────────────────────────────────────────────────────────────

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100';

function Input(props) {
  return <input className={inputCls} {...props} />;
}

function Select({ children, ...props }) {
  return (
    <select className={inputCls} {...props}>{children}</select>
  );
}

function SectionCard({ icon: Icon, title, desc, children }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-start gap-3 pb-1 border-b border-gray-50">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 flex-shrink-0">
          <Icon className="h-4 w-4 text-orange-500" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          {desc && <p className="text-xs text-gray-500">{desc}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function SaveBtn({ saving, onClick, label = 'Save Changes' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-60"
    >
      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {saving ? 'Saving…' : label}
    </button>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'company',  label: 'Company Profile', icon: Building2 },
  { id: 'general',  label: 'General',         icon: Settings2 },
  { id: 'branding', label: 'Branding',        icon: Palette   },
  { id: 'tax',      label: 'GST / Tax',       icon: Receipt   },
  { id: 'backup',   label: 'Backup',          icon: Database  },
];

// ── Company Profile Tab ───────────────────────────────────────────────────────

function CompanyTab({ form, set, onSave, saving, toast }) {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast('Please upload an image file.', 'error');
    if (file.size > 2 * 1024 * 1024) return toast('Logo must be under 2 MB.', 'error');
    setUploading(true);
    try {
      const { url, path } = await uploadLogo(file);
      set('logoUrl',  url);
      set('logoPath', path);
      toast('Logo uploaded.', 'success');
    } catch (err) {
      toast(err.message || 'Upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  }

  async function handleLogoRemove() {
    if (form.logoPath) await deleteLogo(form.logoPath);
    set('logoUrl',  '');
    set('logoPath', '');
  }

  return (
    <div className="space-y-4">
      <SectionCard icon={Building2} title="Company Information" desc="Displayed on invoices, reports, and exports.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company Name">
            <Input value={form.companyName} onChange={(e) => set('companyName', e.target.value)} placeholder="PropPact Realty" />
          </Field>
          <Field label="Website">
            <Input value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://proppact.in" />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="admin@proppact.in" />
          </Field>
          <Field label="Address" >
            <textarea
              rows={2}
              value={form.companyAddress}
              onChange={(e) => set('companyAddress', e.target.value)}
              placeholder="Office address"
              className={`${inputCls} resize-none sm:col-span-2`}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard icon={Upload} title="Company Logo" desc="Shown in header and on printed documents. PNG or JPG, max 2 MB.">
        {form.logoUrl ? (
          <div className="flex items-center gap-4">
            <img src={form.logoUrl} alt="Logo" className="h-16 w-auto rounded-lg border border-gray-200 object-contain" />
            <div>
              <p className="text-sm font-medium text-gray-700">Logo uploaded</p>
              <button onClick={handleLogoRemove} className="mt-1 inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600">
                <X className="h-3 w-3" /> Remove logo
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 cursor-pointer hover:border-orange-300 hover:bg-orange-50/30 transition-colors"
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 text-orange-400 animate-spin mb-2" />
            ) : (
              <Upload className="h-8 w-8 text-gray-300 mb-2" />
            )}
            <p className="text-sm font-medium text-gray-500">{uploading ? 'Uploading…' : 'Click to upload logo'}</p>
            <p className="text-xs text-gray-400 mt-0.5">PNG, JPG · Max 2 MB</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </div>
        )}
      </SectionCard>

      <div className="flex justify-end">
        <SaveBtn saving={saving} onClick={onSave} />
      </div>
    </div>
  );
}

// ── General Tab ───────────────────────────────────────────────────────────────

function GeneralTab({ form, set, onSave, saving }) {
  return (
    <div className="space-y-4">
      <SectionCard icon={Settings2} title="Regional & Format Settings" desc="Controls date display, currency, and timezone across the app.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Timezone">
            <Select value={form.timezone} onChange={(e) => set('timezone', e.target.value)}>
              <option value="Asia/Kolkata">India Standard Time (IST)</option>
              <option value="Asia/Dubai">Gulf Standard Time (GST)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="Europe/London">GMT / BST</option>
            </Select>
          </Field>
          <Field label="Currency">
            <Select value={form.currency} onChange={(e) => set('currency', e.target.value)}>
              <option value="INR">INR — Indian Rupee (₹)</option>
              <option value="USD">USD — US Dollar ($)</option>
              <option value="AED">AED — UAE Dirham</option>
              <option value="GBP">GBP — British Pound</option>
            </Select>
          </Field>
          <Field label="Date Format">
            <Select value={form.dateFormat} onChange={(e) => set('dateFormat', e.target.value)}>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </Select>
          </Field>
          <Field label="Language">
            <Select value={form.language} onChange={(e) => set('language', e.target.value)}>
              <option value="en-IN">English (India)</option>
              <option value="en-US">English (US)</option>
              <option value="hi-IN">Hindi</option>
            </Select>
          </Field>
        </div>
      </SectionCard>
      <div className="flex justify-end">
        <SaveBtn saving={saving} onClick={onSave} />
      </div>
    </div>
  );
}

// ── Branding Tab ──────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  { label: 'Orange (default)', value: '#f97316' },
  { label: 'Indigo',           value: '#6366f1' },
  { label: 'Blue',             value: '#3b82f6' },
  { label: 'Green',            value: '#22c55e' },
  { label: 'Rose',             value: '#f43f5e' },
  { label: 'Teal',             value: '#14b8a6' },
];

function BrandingTab({ form, set, onSave, saving }) {
  return (
    <div className="space-y-4">
      <SectionCard icon={Palette} title="Primary Color" desc="Used for buttons, accents, and highlights throughout the admin panel.">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => set('primaryColor', c.value)}
                title={c.label}
                className={[
                  'h-8 w-8 rounded-full border-2 transition-all',
                  form.primaryColor === c.value ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-105',
                ].join(' ')}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full border border-gray-200" style={{ backgroundColor: form.primaryColor }} />
            <Field label="Custom HEX">
              <input
                type="color"
                value={form.primaryColor}
                onChange={(e) => set('primaryColor', e.target.value)}
                className="h-9 w-24 rounded-lg border border-gray-200 p-0.5 cursor-pointer"
              />
            </Field>
            <span className="text-sm font-mono text-gray-500">{form.primaryColor}</span>
          </div>
        </div>
      </SectionCard>
      <div className="flex justify-end">
        <SaveBtn saving={saving} onClick={onSave} />
      </div>
    </div>
  );
}

// ── GST / Tax Tab ─────────────────────────────────────────────────────────────

function TaxTab({ form, set, onSave, saving }) {
  return (
    <div className="space-y-4">
      <SectionCard icon={Receipt} title="GST & Tax Settings" desc="Used on invoices and billing statements.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="GSTIN" hint="15-character GST Identification Number">
            <Input
              value={form.gstin}
              onChange={(e) => set('gstin', e.target.value.toUpperCase())}
              placeholder="27AAACR5055K1ZY"
              maxLength={15}
            />
          </Field>
          <Field label="Tax Rate (%)" hint="Default GST rate applied to invoices">
            <Input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={form.taxRate}
              onChange={(e) => set('taxRate', Number(e.target.value))}
              placeholder="18"
            />
          </Field>
          <Field label="Invoice Prefix" hint="e.g. INV generates INV-00001">
            <Input
              value={form.invoicePrefix}
              onChange={(e) => set('invoicePrefix', e.target.value.toUpperCase())}
              placeholder="INV"
              maxLength={6}
            />
          </Field>
        </div>
      </SectionCard>
      <div className="flex justify-end">
        <SaveBtn saving={saving} onClick={onSave} />
      </div>
    </div>
  );
}

// ── Backup Tab ────────────────────────────────────────────────────────────────

function BackupTab() {
  const [exporting, setExporting] = useState(false);
  const [done,      setDone]      = useState(false);
  const [error,     setError]     = useState(null);

  async function handleExport() {
    setExporting(true);
    setDone(false);
    setError(null);
    try {
      const data = await exportBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `proppact-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (err) {
      setError(err.message || 'Export failed.');
    } finally {
      setExporting(false);
    }
  }

  const COLS = [
    'properties', 'projects', 'owners', 'tenants', 'dealers',
    'vendors', 'users', 'maintenanceRequests', 'complaints',
    'legal', 'rent', 'notifications', 'settings',
  ];

  return (
    <div className="space-y-4">
      <SectionCard icon={Database} title="Data Export / Backup" desc="Download a full JSON snapshot of all Firestore collections for safe-keeping.">
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Collections included</p>
            <div className="flex flex-wrap gap-1.5">
              {COLS.map((c) => (
                <span key={c} className="rounded-md bg-white border border-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {c}
                </span>
              ))}
            </div>
          </div>

          {done && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              Backup downloaded successfully.
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-60"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {exporting ? 'Exporting…' : 'Export Backup (JSON)'}
            </button>
            <p className="text-xs text-gray-400">This may take a moment for large datasets.</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Settings() {
  const { settings, loading } = useSettings();
  const [tab,    setTab]    = useState('company');
  const [form,   setForm]   = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast,  setToast]  = useState(null); // { msg, type }

  // Sync form when settings load
  useEffect(() => {
    if (settings) setForm({ ...settings });
  }, [settings]);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    try {
      await updateSettings(form);
      showToast('Settings saved.');
    } catch (err) {
      showToast(err.message || 'Failed to save.', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="mt-0.5 text-sm text-gray-500">Manage company profile, appearance, and data backup.</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={[
          'flex items-center gap-2 rounded-lg border px-4 py-3 text-sm',
          toast.type === 'error'
            ? 'border-red-200 bg-red-50 text-red-700'
            : 'border-green-200 bg-green-50 text-green-700',
        ].join(' ')}>
          {toast.type === 'error'
            ? <AlertCircle className="h-4 w-4 flex-shrink-0" />
            : <CheckCircle2 className="h-4 w-4 flex-shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Tabs */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-100">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={[
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
                tab === id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300',
              ].join(' ')}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
        <div className="p-5">
          {tab === 'company'  && <CompanyTab  form={form} set={set} onSave={handleSave} saving={saving} toast={showToast} />}
          {tab === 'general'  && <GeneralTab  form={form} set={set} onSave={handleSave} saving={saving} />}
          {tab === 'branding' && <BrandingTab form={form} set={set} onSave={handleSave} saving={saving} />}
          {tab === 'tax'      && <TaxTab      form={form} set={set} onSave={handleSave} saving={saving} />}
          {tab === 'backup'   && <BackupTab />}
        </div>
      </div>
    </div>
  );
}
