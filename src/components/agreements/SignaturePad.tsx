"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";

export type SignaturePadHandle = {
  getDataUrl: () => string | null;
  clear: () => void;
};

const SignaturePad = forwardRef<SignaturePadHandle, { className?: string }>(function SignaturePad(
  { className },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasDrawn = useRef(false);

  const getContext = () => canvasRef.current?.getContext("2d") ?? null;

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const ctx = getContext();
    if (!ctx) return;
    drawing.current = true;
    const { x, y } = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = getContext();
    if (!ctx) return;
    const { x, y } = getPoint(e);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1f2937";
    ctx.lineTo(x, y);
    ctx.stroke();
    hasDrawn.current = true;
  };

  const end = () => {
    drawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn.current = false;
  };

  useImperativeHandle(ref, () => ({
    getDataUrl: () => (hasDrawn.current && canvasRef.current ? canvasRef.current.toDataURL("image/png") : null),
    clear: clearCanvas,
  }));

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        width={600}
        height={200}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        className="w-full touch-none rounded-xl border border-border-subtle bg-white"
      />
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-foreground/50">Draw your signature above using mouse or touch.</p>
        <button type="button" onClick={clearCanvas} className="text-xs font-medium text-navy hover:underline">
          Clear
        </button>
      </div>
    </div>
  );
});

export default SignaturePad;
