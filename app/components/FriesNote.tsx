"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "../../public/fries-note.css";

type Fry = {
  id: number;
  x: number;
  y: number;
  dx: number;
  rise: number;
  fall: number;
  rotation: number;
  spin: number;
  length: number;
  duration: number;
  delay: number;
  shade: number;
};

function FlyingFry({ fry, onDone }: { fry: Fry; onDone: (id: number) => void }) {
  const element = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = element.current;
    if (!node || !node.animate) { onDone(fry.id); return; }
    const transform = (x: number, y: number, rotation: number) => `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg)`;
    // More samples at the top of the arc make the fries feel tossed, then pulled down.
    const offsets = [0, .12, .25, .4, .55, .7, .85, 1];
    const frames = offsets.map((progress) => ({
      offset: progress,
      transform: transform(fry.dx * progress, -fry.rise * 4 * progress * (1 - progress) + fry.fall * progress * progress, fry.rotation + fry.spin * progress),
      opacity: progress < .7 ? 1 : 1 - (progress - .7) / .3,
    }));
    const animation = node.animate(frames, { duration: fry.duration, delay: fry.delay, easing: "linear", fill: "both" });
    animation.onfinish = () => onDone(fry.id);
    return () => { animation.onfinish = null; animation.cancel(); };
  }, [fry, onDone]);

  return <span ref={element} className={`j-flying-fry j-flying-fry-${fry.shade}`} style={{ left: fry.x, top: fry.y, height: fry.length }} />;
}

export function FriesNote() {
  const [fries, setFries] = useState<Fry[]>([]);
  const nextId = useRef(0);
  const remove = useCallback((id: number) => setFries((current) => current.filter((fry) => fry.id !== id)), []);

  function toss(event: React.MouseEvent<HTMLButtonElement>) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = event.currentTarget.getBoundingClientRect();
    const startX = box.left + box.width * .5;
    const startY = box.top + box.height * .32;
    const availableHeight = Math.min(270, Math.max(105, startY * .46));
    const batch: Fry[] = Array.from({ length: 14 }, (_, index) => ({
      id: nextId.current++,
      x: startX + (Math.random() - .5) * 19,
      y: startY + (Math.random() - .5) * 9,
      dx: (index / 13 - .5) * Math.min(window.innerWidth * .85, 520) + (Math.random() - .5) * 45,
      rise: availableHeight * (.58 + Math.random() * .65),
      fall: 90 + Math.random() * 110,
      rotation: (Math.random() - .5) * 45,
      spin: (Math.random() - .5) * 680,
      length: 30 + Math.random() * 20,
      duration: 1050 + Math.random() * 400,
      delay: Math.random() * 75,
      shade: index % 3,
    }));
    // A rapid handful of clicks stays responsive without building up an unbounded shower.
    setFries((current) => [...current.slice(-42), ...batch]);
  }

  return <>
    <p className="j-fries-note" lang="zh-CN">
      <span className="j-fries-thought">整点 <em>Research</em>，</span>{" "}
      <span className="j-fries-thought j-fries-photo">整点照片，</span>{" "}
      <span className="j-fries-thought">整点 <button type="button" className="j-fries-trigger" onClick={toss} aria-label="撒点薯条" title="点一下，撒点薯条"><span aria-hidden="true">🍟</span></button><span className="j-fries-period">。</span></span>
    </p>
    {fries.length > 0 && createPortal(<div className="j-fries-shower" aria-hidden="true">{fries.map((fry) => <FlyingFry key={fry.id} fry={fry} onDone={remove} />)}</div>, document.body)}
  </>;
}
