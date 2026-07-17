import React, { useRef, useEffect } from 'react';
import { Ruler } from 'lucide-react';

// Photoshop/Photopea-style rulers drawn with <canvas> for crisp, DPR-aware
// ticks. Rendered as an OVERLAY over the top + left edges of the viewport — it
// does NOT shift the pan/zoom coordinate math. Labels are in CANVAS-SPACE
// coordinates (0 = canvas origin); the tick scale adapts continuously to zoom.

interface CanvasRulersProps {
  width: number;   // viewport (containerRef) width in CSS px
  height: number;  // viewport height in CSS px
  zoom: number;
  panX: number;
  panY: number;
  rulerSize?: number;
  onToggleRulers: () => void;
  // Mousedown on a ruler band starts pulling a guide OUT of it.
  onStartGuide: (ruler: 'top' | 'left', e: React.MouseEvent) => void;
}

// "Nice" tick steps. The major step is the smallest whose on-screen spacing is
// at least MIN_MAJOR_PX; minors sit at step/5.
const NICE_STEPS = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 2500];
const MIN_MAJOR_PX = 55;
const MIN_MINOR_PX = 4;

function chooseStep(zoom: number): number {
  for (const s of NICE_STEPS) {
    if (s * zoom >= MIN_MAJOR_PX) return s;
  }
  return NICE_STEPS[NICE_STEPS.length - 1];
}

const BG = '#171717';        // neutral-900
const BORDER = '#404040';    // neutral-700
const MINOR = '#525252';     // neutral-600
const MAJOR = '#737373';     // neutral-500
const LABEL = '#a3a3a3';     // neutral-400

const CanvasRulers: React.FC<CanvasRulersProps> = ({
  width, height, zoom, panX, panY, rulerSize = 24, onToggleRulers, onStartGuide,
}) => {
  const topRef = useRef<HTMLCanvasElement>(null);
  const leftRef = useRef<HTMLCanvasElement>(null);

  // Redraw whenever the viewport size or the pan/zoom transform changes.
  useEffect(() => {
    const dpr = window.devicePixelRatio || 1;
    const step = chooseStep(zoom);
    const minor = step / 5;
    const minorPx = minor * zoom;

    // ── Top (horizontal) ruler ──────────────────────────────────────────
    const top = topRef.current;
    if (top && width > 0) {
      top.width = Math.max(1, Math.round(width * dpr));
      top.height = Math.round(rulerSize * dpr);
      top.style.width = `${width}px`;
      top.style.height = `${rulerSize}px`;
      const ctx = top.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, rulerSize);
        ctx.fillStyle = BG;
        ctx.fillRect(0, 0, width, rulerSize);
        ctx.strokeStyle = BORDER;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, rulerSize - 0.5);
        ctx.lineTo(width, rulerSize - 0.5);
        ctx.stroke();

        const xStart = (0 - panX) / zoom;
        const xEnd = (width - panX) / zoom;

        if (minorPx >= MIN_MINOR_PX) {
          ctx.strokeStyle = MINOR;
          ctx.beginPath();
          for (let m = Math.ceil(xStart / minor) * minor; m <= xEnd; m += minor) {
            const sx = Math.round(m * zoom + panX) + 0.5;
            ctx.moveTo(sx, rulerSize - 4);
            ctx.lineTo(sx, rulerSize);
          }
          ctx.stroke();
        }

        ctx.strokeStyle = MAJOR;
        ctx.beginPath();
        for (let g = Math.ceil(xStart / step) * step; g <= xEnd; g += step) {
          const sx = Math.round(g * zoom + panX) + 0.5;
          ctx.moveTo(sx, rulerSize - 9);
          ctx.lineTo(sx, rulerSize);
        }
        ctx.stroke();

        ctx.fillStyle = LABEL;
        ctx.font = '9px ui-sans-serif, system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        for (let g = Math.ceil(xStart / step) * step; g <= xEnd; g += step) {
          const sx = g * zoom + panX;
          ctx.fillText(String(Math.round(g)), Math.round(sx) + 2, 2);
        }
      }
    }

    // ── Left (vertical) ruler ───────────────────────────────────────────
    const left = leftRef.current;
    if (left && height > 0) {
      left.width = Math.round(rulerSize * dpr);
      left.height = Math.max(1, Math.round(height * dpr));
      left.style.width = `${rulerSize}px`;
      left.style.height = `${height}px`;
      const ctx = left.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, rulerSize, height);
        ctx.fillStyle = BG;
        ctx.fillRect(0, 0, rulerSize, height);
        ctx.strokeStyle = BORDER;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rulerSize - 0.5, 0);
        ctx.lineTo(rulerSize - 0.5, height);
        ctx.stroke();

        const yStart = (0 - panY) / zoom;
        const yEnd = (height - panY) / zoom;

        if (minorPx >= MIN_MINOR_PX) {
          ctx.strokeStyle = MINOR;
          ctx.beginPath();
          for (let m = Math.ceil(yStart / minor) * minor; m <= yEnd; m += minor) {
            const sy = Math.round(m * zoom + panY) + 0.5;
            ctx.moveTo(rulerSize - 4, sy);
            ctx.lineTo(rulerSize, sy);
          }
          ctx.stroke();
        }

        ctx.strokeStyle = MAJOR;
        ctx.beginPath();
        for (let g = Math.ceil(yStart / step) * step; g <= yEnd; g += step) {
          const sy = Math.round(g * zoom + panY) + 0.5;
          ctx.moveTo(rulerSize - 9, sy);
          ctx.lineTo(rulerSize, sy);
        }
        ctx.stroke();

        // Rotated labels so multi-digit numbers fit the 24px band.
        ctx.fillStyle = LABEL;
        ctx.font = '9px ui-sans-serif, system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        for (let g = Math.ceil(yStart / step) * step; g <= yEnd; g += step) {
          const sy = g * zoom + panY;
          ctx.save();
          ctx.translate(11, Math.round(sy));
          ctx.rotate(-Math.PI / 2);
          ctx.fillText(String(Math.round(g)), 3, 0);
          ctx.restore();
        }
      }
    }
  }, [width, height, zoom, panX, panY, rulerSize]);

  return (
    <>
      <canvas
        ref={topRef}
        onMouseDown={(e) => onStartGuide('top', e)}
        style={{
          position: 'absolute', top: 0, left: 0,
          width, height: rulerSize,
          cursor: 'ns-resize', zIndex: 300,
        }}
      />
      <canvas
        ref={leftRef}
        onMouseDown={(e) => onStartGuide('left', e)}
        style={{
          position: 'absolute', top: 0, left: 0,
          width: rulerSize, height,
          cursor: 'ew-resize', zIndex: 301,
        }}
      />
      <div
        onClick={onToggleRulers}
        title="Toggle rulers"
        style={{
          position: 'absolute', top: 0, left: 0,
          width: rulerSize, height: rulerSize,
          background: BG,
          borderRight: `1px solid ${BORDER}`,
          borderBottom: `1px solid ${BORDER}`,
          zIndex: 302, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Ruler style={{ width: 12, height: 12, color: LABEL }} />
      </div>
    </>
  );
};

export default CanvasRulers;
