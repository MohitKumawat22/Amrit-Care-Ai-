import React from 'react';
import { IReminder } from '@/models/Reminder';
import { frequencyLabel, daysOfSupplyLeft, needsRefillAlert, adherencePercent } from '@/lib/reminderUtils';

interface MedicineCardProps {
  reminder: IReminder;
  onMarkTaken: (reminderId: string) => void;
  onDelete: (reminderId: string) => void;
}

export default function MedicineCard({ reminder, onMarkTaken, onDelete }: MedicineCardProps) {
  const adherence = adherencePercent(reminder.takenLog);
  const supplyDays = daysOfSupplyLeft(reminder);
  const isRefillAlert = needsRefillAlert(reminder);
  const progressPercent = Math.min(100, Math.max(0, (reminder.remainingQuantity / reminder.totalQuantity) * 100));
  let progressColor = "bg-teal-500";
  if (progressPercent <= 30 && progressPercent >= 10) {
    progressColor = "bg-amber-500";
  } else if (progressPercent < 10) {
    progressColor = "bg-rose-500";
  }

  const reminderId = String(reminder._id || (reminder as any).id);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{reminder.medicineName}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {reminder.dosage} • {reminder.medicineType}
          </p>
        </div>
        <div className="bg-teal-50 border border-teal-200 text-teal-700 px-3 py-1 rounded-full text-xs font-semibold">
          {adherence}% Adherence
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold text-gray-700">{frequencyLabel(reminder.frequency)}</p>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {reminder.times.map((time, idx) => (
            <span key={idx} className="bg-gray-50 text-gray-700 text-xs px-2.5 py-1 rounded-lg border border-gray-200 font-medium">
              {time}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="flex justify-between text-xs font-medium text-gray-500 mb-1">
          <span>{reminder.remainingQuantity} units left ({supplyDays} days)</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div className={`${progressColor} h-2 rounded-full transition-all duration-300`} style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      {isRefillAlert && (
        <div className="mt-4 bg-rose-50 border border-rose-200 p-3 rounded-xl">
          <p className="text-xs text-rose-700 font-semibold">
            ⚠️ Refill recommended — only {supplyDays} days supply left
          </p>
        </div>
      )}

      <div className="mt-5 flex gap-2.5">
        <button
          onClick={() => onMarkTaken(reminderId)}
          className="btn-primary flex-1 py-2 text-xs"
        >
          Mark Taken
        </button>
        <button
          onClick={() => onDelete(reminderId)}
          className="bg-gray-50 hover:bg-rose-50 text-gray-600 hover:text-rose-600 font-semibold py-2 px-4 rounded-xl text-xs transition-colors border border-gray-200 hover:border-rose-200"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
