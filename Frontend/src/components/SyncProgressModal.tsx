'use client';

import { X, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface SyncAction {
  id: string;
  type: string;
  studentCode?: string;
  status: 'pending' | 'success' | 'failed';
  error?: string;
}

interface SyncProgressModalProps {
  isOpen: boolean;
  totalActions: number;
  actions: SyncAction[];
  onClose: () => void;
}

export default function SyncProgressModal({
  isOpen,
  totalActions,
  actions,
  onClose,
}: SyncProgressModalProps) {
  const [completedCount, setCompletedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const completed = actions.filter(a => a.status === 'success').length;
      const failed = actions.filter(a => a.status === 'failed').length;
      setCompletedCount(completed);
      setFailedCount(failed);
    }
  }, [actions, isOpen]);

  if (!isOpen) return null;

  const progress = totalActions > 0 ? ((completedCount + failedCount) / totalActions) * 100 : 0;
  const allCompleted = completedCount + failedCount === totalActions && totalActions > 0;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 font-cairo">
            مزامنة البيانات
          </h2>
          {!allCompleted && (
            <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
          )}
        </div>

        {/* Progress Bar */}
        <div className="p-6 pb-4">
          {!allCompleted ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 font-cairo">
                  جارٍ رفع البيانات...
                </span>
                <span className="text-sm font-bold text-purple-600 font-cairo">
                  {completedCount + failedCount} / {totalActions}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-purple-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                {completedCount > 0 && (
                  <span className="text-lg font-bold text-green-600 font-cairo">
                    ✓ {completedCount} من {totalActions} نجح
                  </span>
                )}
                {completedCount === 0 && failedCount > 0 && (
                  <span className="text-lg font-bold text-red-600 font-cairo">
                    ✗ {failedCount} من {totalActions} فشل
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Failed Actions Details */}
        {allCompleted && failedCount > 0 && (
          <div className="flex-1 overflow-y-auto px-6 pb-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <p className="text-sm font-bold text-red-800 mb-3 font-cairo">
                الطلاب الذين لم يتم تسجيلهم:
              </p>
              <div className="space-y-2">
                {actions
                  .filter(a => a.status === 'failed' && a.studentCode)
                  .map((action) => (
                    <div
                      key={action.id}
                      className="bg-white rounded-lg p-3 border border-red-200"
                    >
                      <p className="text-sm font-medium text-gray-900 font-cairo">
                        الطالب بالكود: <span className="font-bold">{action.studentCode}</span>
                      </p>
                      {action.error && (
                        <p className="text-xs text-red-600 mt-1 font-cairo">
                          {action.error}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* OK Button - Always visible when completed */}
        {allCompleted && (
          <div className="p-6 border-t border-gray-100 bg-gray-50">
            <button
              onClick={onClose}
              className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors font-cairo"
            >
              موافق
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

