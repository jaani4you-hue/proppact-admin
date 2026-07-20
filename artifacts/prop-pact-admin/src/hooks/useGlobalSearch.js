/**
 * useGlobalSearch — searches across all major Firestore collections.
 *
 * Only activates live subscriptions when query.length >= 2.
 * Returns grouped results: [{ type, label, color, items }]
 */
import { useState, useEffect, useMemo } from 'react';
import { subscribeToProperties }           from '../services/propertyService.js';
import { subscribeToTenants }              from '../services/tenantService.js';
import { subscribeToOwners }               from '../services/ownerService.js';
import { subscribeToVendors }              from '../services/vendorService.js';
import { subscribeToComplaints }           from '../services/complaintService.js';
import { subscribeToMaintenanceRequests }  from '../services/maintenanceService.js';
import { subscribeToLegalCases }           from '../services/legalService.js';
import { subscribeToRents }                from '../services/rentService.js';
import { subscribeToDealers }              from '../services/dealerService.js';

const MIN_QUERY   = 2;
const MAX_PER_TYPE = 4;

function match(q, ...fields) {
  const low = q.toLowerCase();
  return fields.some((f) => f && String(f).toLowerCase().includes(low));
}

export function useGlobalSearch(query = '') {
  const active = query.trim().length >= MIN_QUERY;

  const [properties,  setProperties]  = useState(null);
  const [tenants,     setTenants]     = useState(null);
  const [owners,      setOwners]      = useState(null);
  const [vendors,     setVendors]     = useState(null);
  const [complaints,  setComplaints]  = useState(null);
  const [maintenance, setMaintenance] = useState(null);
  const [legalCases,  setLegalCases]  = useState(null);
  const [rents,       setRents]       = useState(null);
  const [dealers,     setDealers]     = useState(null);

  useEffect(() => {
    if (!active) {
      setProperties(null); setTenants(null);    setOwners(null);
      setVendors(null);    setComplaints(null); setMaintenance(null);
      setLegalCases(null); setRents(null);      setDealers(null);
      return;
    }

    const unsubs = [
      subscribeToProperties(
        ({ properties: p })  => setProperties(p ?? []),
        {},
      ),
      subscribeToTenants(
        ({ tenants: t })     => setTenants(t ?? []),
      ),
      subscribeToOwners(
        ({ owners: o })      => setOwners(o ?? []),
        {},
      ),
      subscribeToVendors(
        ({ vendors: v })     => setVendors(v ?? []),
        {},
      ),
      subscribeToComplaints(
        ({ complaints: c })  => setComplaints(c ?? []),
        {},
      ),
      subscribeToMaintenanceRequests(
        ({ requests: m })    => setMaintenance(m ?? []),
        {},
      ),
      subscribeToLegalCases(
        ({ cases: l })       => setLegalCases(l ?? []),
        {},
      ),
      subscribeToRents(
        ({ rents: r })       => setRents(r ?? []),
        {},
      ),
      subscribeToDealers(
        ({ dealers: d })     => setDealers(d ?? []),
        {},
      ),
    ];

    return () => unsubs.forEach((u) => u?.());
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  const loading = active && [
    properties, tenants, owners, vendors, complaints,
    maintenance, legalCases, rents, dealers,
  ].some((v) => v === null);

  const groups = useMemo(() => {
    if (!active) return [];
    const q = query.trim();

    const defs = [
      {
        type : 'property',
        label: 'Properties',
        color: 'bg-blue-100 text-blue-700',
        src  : properties,
        filter: (p) => match(q, p.title, p.name, p.address, p.city, p.type),
        map   : (p) => ({
          id   : p.id,
          title: p.title || p.name || p.id,
          sub  : [p.address, p.city].filter(Boolean).join(', ') || p.type || '',
          href : `/admin/properties/${p.id}`,
        }),
      },
      {
        type : 'tenant',
        label: 'Tenants',
        color: 'bg-green-100 text-green-700',
        src  : tenants,
        filter: (t) => match(q, t.fullName, t.mobile, t.email, t.assignedProperty),
        map   : (t) => ({
          id   : t.id,
          title: t.fullName || t.email || t.id,
          sub  : [t.mobile, t.assignedProperty].filter(Boolean).join(' · '),
          href : `/admin/tenants/${t.id}`,
        }),
      },
      {
        type : 'owner',
        label: 'Owners',
        color: 'bg-purple-100 text-purple-700',
        src  : owners,
        filter: (o) => match(q, o.fullName, o.mobile, o.email, o.panNumber),
        map   : (o) => ({
          id   : o.id,
          title: o.fullName || o.email || o.id,
          sub  : [o.mobile, o.city].filter(Boolean).join(' · '),
          href : `/admin/owners/${o.id}`,
        }),
      },
      {
        type : 'vendor',
        label: 'Vendors',
        color: 'bg-yellow-100 text-yellow-700',
        src  : vendors,
        filter: (v) => match(q, v.name, v.phone, v.category, v.email),
        map   : (v) => ({
          id   : v.id,
          title: v.name || v.id,
          sub  : [v.category, v.phone].filter(Boolean).join(' · '),
          href : `/admin/vendors/${v.id}`,
        }),
      },
      {
        type : 'complaint',
        label: 'Complaints',
        color: 'bg-red-100 text-red-700',
        src  : complaints,
        filter: (c) => match(q, c.title, c.complaintNumber, c.complainantName, c.propertyName),
        map   : (c) => ({
          id   : c.id,
          title: c.title || c.complaintNumber || c.id,
          sub  : [c.complainantName, c.propertyName].filter(Boolean).join(' · '),
          href : `/admin/complaints/${c.id}`,
        }),
      },
      {
        type : 'maintenance',
        label: 'Maintenance',
        color: 'bg-orange-100 text-orange-700',
        src  : maintenance,
        filter: (m) => match(q, m.title, m.maintenanceNumber, m.propertyName, m.category),
        map   : (m) => ({
          id   : m.id,
          title: m.title || m.maintenanceNumber || m.id,
          sub  : [m.category, m.propertyName].filter(Boolean).join(' · '),
          href : `/admin/maintenance/${m.id}`,
        }),
      },
      {
        type : 'legal',
        label: 'Legal',
        color: 'bg-indigo-100 text-indigo-700',
        src  : legalCases,
        filter: (l) => match(q, l.title, l.caseNumber, l.clientName, l.propertyName),
        map   : (l) => ({
          id   : l.id,
          title: l.title || l.caseNumber || l.id,
          sub  : [l.caseType, l.clientName].filter(Boolean).join(' · '),
          href : `/admin/legal/${l.id}`,
        }),
      },
      {
        type : 'rent',
        label: 'Rent',
        color: 'bg-teal-100 text-teal-700',
        src  : rents,
        filter: (r) => match(q, r.tenantName, r.propertyName, r.ownerName),
        map   : (r) => ({
          id   : r.id,
          title: r.tenantName || r.id,
          sub  : [r.propertyName, r.ownerName].filter(Boolean).join(' · '),
          href : `/admin/rent/${r.id}`,
        }),
      },
      {
        type : 'dealer',
        label: 'Dealers',
        color: 'bg-pink-100 text-pink-700',
        src  : dealers,
        filter: (d) => match(q, d.name, d.fullName, d.mobile, d.email),
        map   : (d) => ({
          id   : d.id,
          title: d.name || d.fullName || d.id,
          sub  : [d.mobile, d.email].filter(Boolean).join(' · '),
          href : `/admin/dealers/${d.id}`,
        }),
      },
    ];

    return defs
      .map(({ type, label, color, src, filter, map }) => ({
        type,
        label,
        color,
        items: (src || []).filter(filter).slice(0, MAX_PER_TYPE).map(map),
      }))
      .filter((g) => g.items.length > 0);
  }, [active, query, properties, tenants, owners, vendors, complaints, maintenance, legalCases, rents, dealers]);

  const totalCount = groups.reduce((n, g) => n + g.items.length, 0);

  return { groups, loading, totalCount, active };
}
