"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, QrCode, X } from "lucide-react";
import { guestOrderUrl } from "@/lib/publicApi";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function TableQrModal({
  tenantSlug,
  tableNumber,
  restaurantName,
  onClose,
}: {
  tenantSlug: string;
  tableNumber: string;
  restaurantName: string;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    const orderUrl = guestOrderUrl(tenantSlug, tableNumber);
    setUrl(orderUrl);
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, orderUrl, { width: 220, margin: 2 });
    }
  }, [tenantSlug, tableNumber]);

  function downloadQr() {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `table-${tableNumber}-qr.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4">
      <Card className="w-full max-w-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-stone-900">
              <QrCode className="h-5 w-5 text-brand" />
              Table {tableNumber} QR
            </h2>
            <p className="text-sm text-muted">{restaurantName}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-stone-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex justify-center rounded-xl bg-white p-4">
          <canvas ref={canvasRef} />
        </div>

        <p className="mt-4 break-all text-center text-xs text-muted">{url}</p>
        <p className="mt-2 text-center text-xs text-muted">
          Guests scan to browse the menu, pay, and place orders from their phone.
        </p>

        <Button className="mt-4" fullWidth onClick={downloadQr}>
          <Download className="h-4 w-4" />
          Download PNG
        </Button>
      </Card>
    </div>
  );
}
