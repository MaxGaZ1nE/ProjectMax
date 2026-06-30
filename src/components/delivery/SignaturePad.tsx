import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
  onSave: (base64: string) => void;
  onClear?: () => void;
}

export default function SignaturePad({ onSave, onClear }: SignaturePadProps) {
  const sigRef = useRef<any>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleClear = () => {
    if (sigRef.current) {
      sigRef.current.clear();
      setIsEmpty(true);
      onClear?.();
    }
  };

  const handleEnd = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      setIsEmpty(false);
    }
  };

  const handleSave = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      const dataURL = sigRef.current.getTrimmedCanvas().toDataURL('image/png');
      onSave(dataURL);
    }
  };

  return (
    <div className="w-full">
      <div className="border-2 border-dashed border-neutral-400 rounded-lg bg-neutral-50 p-4 mb-4">
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          ✍️ ลายเซ็นผู้รับ
        </label>
        <div className="bg-white rounded border border-neutral-300 overflow-hidden">
          <SignatureCanvas
            ref={sigRef}
            penColor="#000"
            canvasProps={{
              width: 400,
              height: 180,
              className: 'w-full touch-none',
            }}
            onEnd={handleEnd}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleClear}
          disabled={isEmpty}
          className="flex-1 px-4 py-2 bg-neutral-200 hover:bg-neutral-300 disabled:bg-neutral-100 disabled:text-neutral-400 text-neutral-700 rounded-lg font-medium transition-colors"
        >
          🗑️ ล้างลายเซ็น
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isEmpty}
          className="flex-1 px-4 py-2 bg-[#1a6e40] hover:bg-[#166534] disabled:bg-neutral-300 disabled:text-neutral-500 text-white rounded-lg font-medium transition-colors"
        >
          ✅ บันทึกลายเซ็น
        </button>
      </div>
    </div>
  );
}
