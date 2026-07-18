/**
 * WorkflowStepper
 *
 * Visualises the 7-stage complaint lifecycle:
 *   Filed → Under Review → Work Order → Vendor Assigned →
 *   In Progress → Completed → Resolved
 *
 * Props:
 *   complaint  – complaint Firestore document
 *   request    – linked maintenance request (or null)
 */

import { CheckCircle2, Circle } from 'lucide-react';

const STAGES = [
  { key: 'filed',          label: 'Filed',           sub: 'Tenant / admin' },
  { key: 'under_review',   label: 'Under Review',    sub: 'Owner notified' },
  { key: 'work_order',     label: 'Work Order',      sub: 'Maintenance raised' },
  { key: 'vendor_assigned',label: 'Vendor Assigned', sub: 'Contractor set' },
  { key: 'in_progress',    label: 'In Progress',     sub: 'Work underway' },
  { key: 'completed',      label: 'Completed',       sub: 'Work done' },
  { key: 'resolved',       label: 'Resolved',        sub: 'Complaint closed' },
];

function deriveStageIndex(complaint, request) {
  if (!complaint) return 0;

  const cs = complaint.status || 'Open';
  const rs = request?.status;

  // Resolved / Closed / Rejected → last stage
  if (['Resolved', 'Closed'].includes(cs)) return 6;
  if (cs === 'Rejected') return 6; // treat as terminal

  // Maintenance completed → stage 5 (Completed)
  if (rs === 'Completed') return 5;

  // Vendor assigned on maintenance → stage 3 (Vendor Assigned)
  if (request?.assignedVendorId) {
    if (['In Progress', 'Assigned'].includes(rs)) return 4; // In Progress
    return 3; // Vendor Assigned
  }

  // Work order exists → stage 2 (Work Order)
  if (complaint.maintenanceId) return 2;

  // Under Review
  if (cs === 'Under Review') return 1;

  // Open → Filed
  return 0;
}

export default function WorkflowStepper({ complaint, request = null }) {
  const activeIdx = deriveStageIndex(complaint, request);

  return (
    <div className="rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-sm overflow-x-auto">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
        Workflow Progress
      </p>
      <div className="flex items-start gap-0 min-w-max">
        {STAGES.map((stage, idx) => {
          const done    = idx < activeIdx;
          const current = idx === activeIdx;
          const future  = idx > activeIdx;

          return (
            <div key={stage.key} className="flex items-start">
              {/* Step */}
              <div className="flex flex-col items-center">
                <div className={[
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors flex-shrink-0',
                  done    ? 'border-green-400 bg-green-400 text-white'      : '',
                  current ? 'border-orange-500 bg-orange-500 text-white'   : '',
                  future  ? 'border-gray-200  bg-white      text-gray-300' : '',
                ].join(' ')}>
                  {done ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <span className="text-[11px] font-bold">{idx + 1}</span>
                  )}
                </div>
                <div className="mt-1.5 text-center w-20">
                  <p className={[
                    'text-[11px] font-semibold leading-tight',
                    done    ? 'text-green-600'  : '',
                    current ? 'text-orange-600' : '',
                    future  ? 'text-gray-400'   : '',
                  ].join(' ')}>
                    {stage.label}
                  </p>
                  <p className="text-[10px] text-gray-400 leading-tight mt-0.5">
                    {stage.sub}
                  </p>
                </div>
              </div>

              {/* Connector line (not after last item) */}
              {idx < STAGES.length - 1 && (
                <div className={[
                  'mt-4 h-0.5 w-10 flex-shrink-0 mx-1',
                  idx < activeIdx ? 'bg-green-300' : 'bg-gray-200',
                ].join(' ')} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
