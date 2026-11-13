"use client";
import { useState } from "react";

export default function Gallery({ images }) {
  const [i, setI] = useState(0);
  if (!images.length) return null;
  return (
    <div>
      <img src={images[i]} alt="" className="aspect-[4/3] w-full rounded-xl object-cover" />
      {images.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {images.map((src, n) => (
            <button key={src} type="button" onClick={() => setI(n)}>
              <img src={src} alt="" className={`h-16 w-16 rounded-lg object-cover ${n === i ? "ring-2 ring-zinc-900" : ""}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
