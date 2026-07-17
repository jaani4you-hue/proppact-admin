import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Upload, X, Loader2, ImagePlus,
  FileText, Trash2, AlertCircle, MapPin, Check,
} from 'lucide-react';
import { createProperty, updateProperty, getPropertyById } from '../../services/propertyService.js';

// ── Constants ──────────────────────────────────────────────────────────────────

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands',
  'Chandigarh','Dadra & Nagar Haveli and Daman & Diu','Delhi',
  'Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
];

const PROPERTY_TYPES = [
  'Apartment','Villa','Independent House','Studio Apartment',
  'Penthouse','Row House','Commercial Office','Shop/Showroom','Plot/Land',
];

const FACING_OPTIONS = ['North','South','East','West','North-East','North-West','South-East','South-West'];

const AMENITIES_LIST = [
  'Power Backup','Lift/Elevator','Security Guard','CCTV Surveillance',
  'Covered Parking','Visitor Parking','Garden/Park','Swimming Pool',
  'Gym/Fitness Center','Club House','24x7 Water Supply','Bore Well',
  'Rain Water Harvesting','Intercom','Fire Safety','Gas Pipeline',
  'Internet/Wi-Fi Ready','Children Play Area','Air Conditioning',
  'Furnished','Semi-Furnished','Gated Community',
];

const EMPTY_FORM = {
  title: '',
  type: 'Apartment',
  description: '',
  status: 'Available',
  // Location
  address: '',
  city: '',
  state: '',
  pincode: '',
  mapLat: '',
  mapLng: '',
  // Details
  area: '',
  floor: '',
  totalFloors: '',
  bedrooms: '',
  bathrooms: '',
  balconies: '',
  facing: '',
  // Financial
  rentAmount: '',
  securityDeposit: '',
  maintenanceCharges: '',
  // Assignments
  ownerIds: '',
  tenantIds: '',
  // Arrays managed separately
  amenities: [],
  images: [],
  documents: [],
};

// ── UI helpers ─────────────────────────────────────────────────────────────────

function Section({ title, description, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />{error}
        </p>
      )}
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors';
const errorInputCls =
  'w-full rounded-lg border border-red-300 bg-red-50/30 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100 transition-colors';

// ── Main Component ─────────────────────────────────────────────────────────────

export default function PropertyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form,           setForm]           = useState(EMPTY_FORM);
  const [newImageFiles,  setNewImageFiles]  = useState([]);
  const [imagePreviews,  setImagePreviews]  = useState([]);
  const [newDocFiles,    setNewDocFiles]    = useState([]);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [saving,         setSaving]         = useState(false);
  const [errors,         setErrors]         = useState({});
  const [globalError,    setGlobalError]    = useState('');

  const imageInputRef = useRef(null);
  const docInputRef   = useRef(null);

  // Load existing property for edit
  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    (async () => {
      try {
        const prop = await getPropertyById(id);
        if (cancelled) return;
        if (!prop) { navigate('/admin/properties', { replace: true }); return; }
        setForm({
          title:              prop.title ?? '',
          type:               prop.type ?? 'Apartment',
          description:        prop.description ?? '',
          status:             prop.status ?? 'Available',
          address:            prop.address ?? '',
          city:               prop.city ?? '',
          state:              prop.state ?? '',
          pincode:            prop.pincode ?? '',
          mapLat:             prop.mapLat ?? '',
          mapLng:             prop.mapLng ?? '',
          area:               prop.area != null ? String(prop.area) : '',
          floor:              prop.floor != null ? String(prop.floor) : '',
          totalFloors:        prop.totalFloors != null ? String(prop.totalFloors) : '',
          bedrooms:           prop.bedrooms != null ? String(prop.bedrooms) : '',
          bathrooms:          prop.bathrooms != null ? String(prop.bathrooms) : '',
          balconies:          prop.balconies != null ? String(prop.balconies) : '',
          facing:             prop.facing ?? '',
          rentAmount:         prop.rentAmount != null ? String(prop.rentAmount) : '',
          securityDeposit:    prop.securityDeposit != null ? String(prop.securityDeposit) : '',
          maintenanceCharges: prop.maintenanceCharges != null ? String(prop.maintenanceCharges) : '',
          ownerIds:           Array.isArray(prop.ownerIds) ? prop.ownerIds.join(', ') : (prop.ownerIds ?? ''),
          tenantIds:          Array.isArray(prop.tenantIds) ? prop.tenantIds.join(', ') : (prop.tenantIds ?? ''),
          amenities:          prop.amenities ?? [],
          images:             prop.images ?? [],
          documents:          prop.documents ?? [],
        });
      } catch {
        if (!cancelled) setGlobalError('Failed to load property data.');
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, isEdit, navigate]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function toggleAmenity(amenity) {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  }

  function handleImageFiles(e) {
    const files = Array.from(e.target.files ?? []);
    const valid = files.filter((f) => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024);
    if (valid.length < files.length)
      setErrors((p) => ({ ...p, images: 'Some files exceed 10 MB or are not images and were skipped.' }));
    setNewImageFiles((prev) => [...prev, ...valid]);
    setImagePreviews((prev) => [...prev, ...valid.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  }

  function removeNewImage(idx) {
    setNewImageFiles((p) => p.filter((_, i) => i !== idx));
    setImagePreviews((p) => p.filter((_, i) => i !== idx));
  }

  function removeExistingImage(idx) {
    setForm((p) => ({ ...p, images: p.images.filter((_, i) => i !== idx) }));
  }

  function handleDocFiles(e) {
    const files = Array.from(e.target.files ?? []);
    const valid = files.filter((f) => f.size <= 15 * 1024 * 1024);
    if (valid.length < files.length)
      setErrors((p) => ({ ...p, documents: 'Some files exceed 15 MB and were skipped.' }));
    setNewDocFiles((prev) => [...prev, ...valid]);
    e.target.value = '';
  }

  function removeNewDoc(idx) { setNewDocFiles((p) => p.filter((_, i) => i !== idx)); }
  function removeExistingDoc(idx) {
    setForm((p) => ({ ...p, documents: p.documents.filter((_, i) => i !== idx) }));
  }

  function validate() {
    const errs = {};
    if (!form.title.trim())  errs.title  = 'Property title is required.';
    if (!form.type.trim())   errs.type   = 'Property type is required.';
    if (!form.address.trim()) errs.address = 'Address is required.';
    if (!form.city.trim())   errs.city   = 'City is required.';
    if (!form.state.trim())  errs.state  = 'State is required.';
    if (form.pincode.trim() && !/^\d{6}$/.test(form.pincode.trim()))
      errs.pincode = 'Pincode must be 6 digits.';
    if (form.rentAmount && isNaN(Number(form.rentAmount)))
      errs.rentAmount = 'Must be a valid number.';
    if (form.securityDeposit && isNaN(Number(form.securityDeposit)))
      errs.securityDeposit = 'Must be a valid number.';
    if (form.maintenanceCharges && isNaN(Number(form.maintenanceCharges)))
      errs.maintenanceCharges = 'Must be a valid number.';
    if (form.area && isNaN(Number(form.area)))
      errs.area = 'Must be a valid number.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSaving(true);
    setGlobalError('');

    const data = {
      ...form,
      ownerIds:           form.ownerIds ? form.ownerIds.split(',').map((s) => s.trim()).filter(Boolean) : [],
      tenantIds:          form.tenantIds ? form.tenantIds.split(',').map((s) => s.trim()).filter(Boolean) : [],
      rentAmount:         form.rentAmount ? Number(form.rentAmount) : 0,
      securityDeposit:    form.securityDeposit ? Number(form.securityDeposit) : 0,
      maintenanceCharges: form.maintenanceCharges ? Number(form.maintenanceCharges) : 0,
      area:               form.area ? Number(form.area) : null,
      floor:              form.floor ? Number(form.floor) : null,
      totalFloors:        form.totalFloors ? Number(form.totalFloors) : null,
      bedrooms:           form.bedrooms ? Number(form.bedrooms) : null,
      bathrooms:          form.bathrooms ? Number(form.bathrooms) : null,
      balconies:          form.balconies ? Number(form.balconies) : null,
      mapLat:             form.mapLat ? Number(form.mapLat) : null,
      mapLng:             form.mapLng ? Number(form.mapLng) : null,
    };

    try {
      if (isEdit) await updateProperty(id, data, newImageFiles, newDocFiles);
      else         await createProperty(data, newImageFiles, newDocFiles);
      navigate('/admin/properties');
    } catch (err) {
      setGlobalError(err.message ?? 'Failed to save property. Please try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  }

  // ── Skeleton ─────────────────────────────────────────────────────────────────

  if (initialLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-7 w-48 rounded-lg bg-gray-200" />
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-4">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((m) => (
                <div key={m} className="space-y-1.5">
                  <div className="h-3 w-20 rounded bg-gray-200" />
                  <div className="h-10 rounded-lg bg-gray-100" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/admin/properties')}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-800">{isEdit ? 'Edit Property' : 'Add Property'}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isEdit ? 'Update property information and media' : 'Fill in the details to list a new property'}
          </p>
        </div>
      </div>

      {/* Global error */}
      {globalError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-2.5 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          {globalError}
        </div>
      )}
      {Object.keys(errors).length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Please fix the errors below before saving.
        </div>
      )}

      {/* ── Section 1: Basic Information ──────────────────────────────────── */}
      <Section title="Basic Information" description="Property name, type, description and status">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Property Title" required error={errors.title}>
              <input name="title" value={form.title} onChange={handleChange}
                placeholder="e.g. Sunrise Residency — 3BHK Flat"
                className={errors.title ? errorInputCls : inputCls} />
            </Field>
          </div>
          <Field label="Property Type" required error={errors.type}>
            <select name="type" value={form.type} onChange={handleChange}
              className={`${errors.type ? errorInputCls : inputCls} appearance-none cursor-pointer`}>
              {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Facing">
            <select name="facing" value={form.facing} onChange={handleChange}
              className={`${inputCls} appearance-none cursor-pointer`}>
              <option value="">Select facing</option>
              {FACING_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description">
              <textarea name="description" value={form.description} onChange={handleChange}
                rows={3} placeholder="Describe the property — highlights, nearby landmarks, special features…"
                className={`${inputCls} resize-none`} />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Section 2: Location ───────────────────────────────────────────── */}
      <Section title="Location" description="Property address and map coordinates">
        <div className="grid grid-cols-1 gap-4">
          <Field label="Street Address" required error={errors.address}>
            <textarea name="address" value={form.address} onChange={handleChange}
              rows={2} placeholder="Street, Area, Landmark…"
              className={`${errors.address ? errorInputCls : inputCls} resize-none`} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="City" required error={errors.city}>
              <input name="city" value={form.city} onChange={handleChange}
                placeholder="e.g. Pune"
                className={errors.city ? errorInputCls : inputCls} />
            </Field>
            <Field label="State" required error={errors.state}>
              <select name="state" value={form.state} onChange={handleChange}
                className={`${errors.state ? errorInputCls : inputCls} appearance-none cursor-pointer`}>
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Pincode" error={errors.pincode}>
              <input name="pincode" value={form.pincode} onChange={handleChange}
                placeholder="6-digit PIN" maxLength={6}
                className={errors.pincode ? errorInputCls : inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Latitude (optional)">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <input name="mapLat" value={form.mapLat} onChange={handleChange}
                  placeholder="e.g. 18.5204" type="number" step="any"
                  className={`${inputCls} pl-8`} />
              </div>
            </Field>
            <Field label="Longitude (optional)">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <input name="mapLng" value={form.mapLng} onChange={handleChange}
                  placeholder="e.g. 73.8567" type="number" step="any"
                  className={`${inputCls} pl-8`} />
              </div>
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Section 3: Property Details ───────────────────────────────────── */}
      <Section title="Property Details" description="Size, floor, rooms and configuration">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Area (sq.ft)" error={errors.area}>
            <input name="area" value={form.area} onChange={handleChange}
              placeholder="e.g. 1200" type="number" min="0"
              className={errors.area ? errorInputCls : inputCls} />
          </Field>
          <Field label="Bedrooms">
            <input name="bedrooms" value={form.bedrooms} onChange={handleChange}
              placeholder="e.g. 3" type="number" min="0"
              className={inputCls} />
          </Field>
          <Field label="Bathrooms">
            <input name="bathrooms" value={form.bathrooms} onChange={handleChange}
              placeholder="e.g. 2" type="number" min="0"
              className={inputCls} />
          </Field>
          <Field label="Balconies">
            <input name="balconies" value={form.balconies} onChange={handleChange}
              placeholder="e.g. 1" type="number" min="0"
              className={inputCls} />
          </Field>
          <Field label="Floor No.">
            <input name="floor" value={form.floor} onChange={handleChange}
              placeholder="e.g. 4" type="number" min="0"
              className={inputCls} />
          </Field>
          <Field label="Total Floors">
            <input name="totalFloors" value={form.totalFloors} onChange={handleChange}
              placeholder="e.g. 12" type="number" min="0"
              className={inputCls} />
          </Field>
        </div>
      </Section>

      {/* ── Section 4: Rent & Financial ───────────────────────────────────── */}
      <Section title="Rent & Financial Details" description="Monthly rent, security deposit and maintenance">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Monthly Rent (₹)" error={errors.rentAmount}>
            <input name="rentAmount" value={form.rentAmount} onChange={handleChange}
              placeholder="e.g. 25000" type="number" min="0"
              className={errors.rentAmount ? errorInputCls : inputCls} />
          </Field>
          <Field label="Security Deposit (₹)" error={errors.securityDeposit}>
            <input name="securityDeposit" value={form.securityDeposit} onChange={handleChange}
              placeholder="e.g. 75000" type="number" min="0"
              className={errors.securityDeposit ? errorInputCls : inputCls} />
          </Field>
          <Field label="Maintenance Charges (₹/mo)" error={errors.maintenanceCharges}>
            <input name="maintenanceCharges" value={form.maintenanceCharges} onChange={handleChange}
              placeholder="e.g. 2500" type="number" min="0"
              className={errors.maintenanceCharges ? errorInputCls : inputCls} />
          </Field>
        </div>
      </Section>

      {/* ── Section 5: Amenities ──────────────────────────────────────────── */}
      <Section title="Amenities" description="Select all amenities available at this property">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {AMENITIES_LIST.map((amenity) => {
            const selected = form.amenities.includes(amenity);
            return (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleAmenity(amenity)}
                className={[
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all text-left',
                  selected
                    ? 'border-orange-400 bg-orange-50 text-orange-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-orange-200 hover:bg-orange-50/30',
                ].join(' ')}
              >
                <span className={[
                  'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors',
                  selected ? 'border-orange-500 bg-orange-500' : 'border-gray-300',
                ].join(' ')}>
                  {selected && <Check className="h-2.5 w-2.5 text-white" />}
                </span>
                {amenity}
              </button>
            );
          })}
        </div>
        {form.amenities.length > 0 && (
          <p className="mt-3 text-xs text-gray-500">{form.amenities.length} amenit{form.amenities.length === 1 ? 'y' : 'ies'} selected</p>
        )}
      </Section>

      {/* ── Section 6: Owner & Tenant Assignment ─────────────────────────── */}
      <Section title="Owner & Tenant Assignment" description="Assign owner IDs and tenant IDs (comma-separated)">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Owner IDs">
            <input name="ownerIds" value={form.ownerIds} onChange={handleChange}
              placeholder="e.g. owner-001, owner-002"
              className={inputCls} />
          </Field>
          <Field label="Tenant IDs">
            <input name="tenantIds" value={form.tenantIds} onChange={handleChange}
              placeholder="e.g. tenant-001"
              className={inputCls} />
          </Field>
        </div>
      </Section>

      {/* ── Section 7: Images ─────────────────────────────────────────────── */}
      <Section title="Property Images" description="Upload photos of the property (max 10 MB each)">
        <div className="space-y-4">
          {/* Existing images grid */}
          {form.images.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Existing images</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {form.images.map((img, idx) => (
                  <div key={idx} className="relative group aspect-square">
                    <img src={img.url} alt={img.name || `Image ${idx + 1}`}
                      className="h-full w-full rounded-lg object-cover border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(idx)}
                      className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New image previews */}
          {imagePreviews.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">New images to upload</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="relative group aspect-square">
                    <img src={src} alt={`Preview ${idx + 1}`}
                      className="h-full w-full rounded-lg object-cover border border-orange-200" />
                    <button
                      type="button"
                      onClick={() => removeNewImage(idx)}
                      className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errors.images && <p className="text-xs text-amber-600">{errors.images}</p>}

          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="flex items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-sm text-gray-500 hover:border-orange-300 hover:bg-orange-50/30 hover:text-orange-600 transition-colors w-full justify-center"
          >
            <ImagePlus className="h-4 w-4" />
            Click to add property images
          </button>
          <input ref={imageInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImageFiles} />
        </div>
      </Section>

      {/* ── Section 8: Documents ──────────────────────────────────────────── */}
      <Section title="Documents" description="Upload agreements, NOCs or supporting files (max 15 MB each)">
        <div className="space-y-4">
          {form.documents.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">Existing documents</p>
              {form.documents.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <a href={doc.url} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline truncate">
                      {doc.name || 'Document'}
                    </a>
                  </div>
                  <button type="button" onClick={() => removeExistingDoc(idx)}
                    className="ml-2 flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {newDocFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">Files to upload</p>
              {newDocFiles.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50/40 px-3 py-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="h-4 w-4 text-orange-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700 truncate">{f.name}</span>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">
                      {(f.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                  <button type="button" onClick={() => removeNewDoc(idx)}
                    className="ml-2 flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {errors.documents && <p className="text-xs text-amber-600">{errors.documents}</p>}

          <button
            type="button"
            onClick={() => docInputRef.current?.click()}
            className="flex items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3.5 text-sm text-gray-500 hover:border-orange-300 hover:bg-orange-50/30 hover:text-orange-600 transition-colors w-full justify-center"
          >
            <Upload className="h-4 w-4" />
            Click to add documents
          </button>
          <input ref={docInputRef} type="file" multiple className="hidden" onChange={handleDocFiles} />
        </div>
      </Section>

      {/* ── Section 9: Status ─────────────────────────────────────────────── */}
      <Section title="Status" description="Set the current listing status of this property">
        <div className="flex flex-wrap gap-3">
          {[
            { value: 'Available', color: 'emerald' },
            { value: 'Occupied', color: 'blue' },
            { value: 'Under Maintenance', color: 'amber' },
            { value: 'Reserved', color: 'violet' },
            { value: 'Listed', color: 'orange' },
          ].map(({ value, color }) => (
            <label key={value} className={[
              'flex items-center gap-2.5 rounded-xl border px-4 py-3 cursor-pointer transition-all',
              form.status === value
                ? `border-${color}-400 bg-${color}-50 text-${color}-700`
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300',
            ].join(' ')}>
              <input type="radio" name="status" value={value}
                checked={form.status === value} onChange={handleChange} className="hidden" />
              <span className={[
                'h-2 w-2 rounded-full flex-shrink-0',
                form.status === value ? `bg-${color}-500` : 'bg-gray-300',
              ].join(' ')} />
              <span className="text-sm font-medium">{value}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* ── Action buttons ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pb-4">
        <button type="button" onClick={() => navigate('/admin/properties')} disabled={saving}
          className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-200 hover:bg-orange-600 active:scale-[0.98] transition-all disabled:opacity-60">
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" />{isEdit ? 'Saving…' : 'Creating…'}</>
          ) : (
            isEdit ? 'Save Changes' : 'Create Property'
          )}
        </button>
      </div>
    </form>
  );
}
