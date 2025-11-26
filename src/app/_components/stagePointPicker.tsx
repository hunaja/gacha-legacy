"use client";

import { useState, useRef } from "react";
import Image from "next/image";

export default function StagePointPicker({
  selectedMap,
  onClick,
}: {
  selectedMap: { bgUrl: string; name: string };
  onClick: (pointLocation: { xPercent: number; yPercent: number }) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [point, setPoint] = useState<{
    xPercent: number;
    yPercent: number;
  } | null>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left; // pixel offset from left
    const y = e.clientY - rect.top; // pixel offset from top

    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    setPoint({ xPercent, yPercent });
    onClick({ xPercent, yPercent });
  };

  return (
    <div
      className="relative mx-auto mb-2 w-full max-w-md"
      ref={containerRef}
      onClick={handleClick}
    >
      <Image
        src={selectedMap.bgUrl}
        alt={`Map of ${selectedMap.name}`}
        width={1024}
        height={1024}
        className="rounded-xl shadow-2xl"
      />

      {point && (
        <div
          className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-red-500 shadow-lg"
          style={{
            left: `${point.xPercent}%`,
            top: `${point.yPercent}%`,
          }}
        />
      )}

      {point && (
        <div className="mt-2 text-center font-mono text-sm">
          x: {point.xPercent.toFixed(2)}%, y: {point.yPercent.toFixed(2)}%
        </div>
      )}
    </div>
  );
}
