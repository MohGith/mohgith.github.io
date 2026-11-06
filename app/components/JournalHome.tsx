"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { DeskScene } from "./DeskScene";
import "../../public/journal.css";

type Publication = { title: string; journal: string; year: string; authors: string };

export type JournalHomeProps = {
  email: string;
  linkedInUrl: string;
  scholarUrl: string;
  publications: Publication[];
  galleryHref?: string;
  studioHref?: string;
};

const cityPhoto = "/photos/76fefc7c-7c0d-454d-8a6c-a3fb683cbf15.jpg";
const birdsPhoto = "/photos/0cd9ca70-1ea6-41f1-b301-9c0f15c629ce.jpg";

function Arrow({ down = false }: { down?: boolean }) {
  return <span aria-hidden="true" className="j-arrow">{down ? "↓" : "↗"}</span>;
}

function PublicationRow({ paper }: { paper: Publication }) {
  return (
    <li className="j-paper">
      <span className="j-paper-year">{paper.year}</span>
      <div>
        <h3><a href={`https://scholar.google.com/scholar?q=${encodeURIComponent(paper.title)}`} target="_blank" rel="noreferrer">{paper.title}<Arrow /></a></h3>
        <p className="j-paper-authors">{paper.authors.split(/(J\. Guo)/).map((part, index) => part === "J. Guo" ? <strong key={index}>{part}</strong> : part)}</p>
        <p className="j-paper-venue">{paper.journal}</p>
      </div>
    </li>
  );
}

export function JournalHome({ email, linkedInUrl, scholarUrl, publications, galleryHref = "/gallery", studioHref = "/dashboard" }: JournalHomeProps) {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const zoomCancel = useRef<HTMLButtonElement>(null);
  const zoomTargetRef = useRef<"research" | "gallery" | null>(null);
  const finishing = useRef(false);
  const zoomTimers = useRef<number[]>([]);
  const lastControl = useRef<HTMLElement | null>(null);
  const [zoomTarget, setZoomTarget] = useState<"research" | "gallery" | null>(null);
  const [zoomOrigin, setZoomOrigin] = useState<CSSProperties>({});
  const note = "整点 Research，整点照片，整点薯条。";
  const selectedTitles = ["A memory and retrieval", "An adversarial transformer", "A transfer-learning TNet", "A hybrid transformer"];
  const selected = selectedTitles.map((prefix) => publications.find((paper) => paper.title.startsWith(prefix))).filter((paper): paper is Publication => Boolean(paper));
  const otherPapers = publications.filter((paper) => !selected.includes(paper));

  function clearZoomTimers() {
    zoomTimers.current.forEach((timer) => window.clearTimeout(timer));
    zoomTimers.current = [];
  }

  function cancelZoom() {
    clearZoomTimers();
    zoomTargetRef.current = null;
    finishing.current = false;
    setZoomTarget(null);
    lastControl.current?.focus({ preventScroll: true });
  }

  function arrive(target: "research" | "gallery") {
    if (target === "gallery") { window.location.assign(galleryHref); return; }
    clearZoomTimers();
    zoomTargetRef.current = null;
    finishing.current = false;
    setZoomTarget(null);
    window.requestAnimationFrame(() => {
      if (window.location.hash !== "#research") window.history.pushState(null, "", "#research");
      document.getElementById("research")?.scrollIntoView({ behavior: "instant" });
      document.getElementById("j-research-title")?.focus({ preventScroll: true });
    });
  }

  function finishZoom(target: "research" | "gallery") {
    if (zoomTargetRef.current !== target || finishing.current) return;
    finishing.current = true;
    clearZoomTimers();
    zoomTimers.current.push(window.setTimeout(() => arrive(target), 180));
  }

  function openFromDesk(target: "research" | "gallery") {
    if (zoomTargetRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { arrive(target); return; }
    const bounds = stage.current?.getBoundingClientRect();
    if (!bounds || !bounds.width || !bounds.height) { arrive(target); return; }
    lastControl.current = document.activeElement as HTMLElement | null;
    setZoomOrigin({
      "--j-zoom-x": `${bounds.left}px`, "--j-zoom-y": `${bounds.top}px`,
      "--j-zoom-scale-x": `${bounds.width / window.innerWidth}`,
      "--j-zoom-scale-y": `${bounds.height / window.innerHeight}`,
    } as CSSProperties);
    zoomTargetRef.current = target;
    finishing.current = false;
    setZoomTarget(target);
    // The illustration keeps navigation usable when WebGL cannot start.
    zoomTimers.current.push(window.setTimeout(() => finishZoom(target), 2600));
  }

  function followDeskLink(event: MouseEvent<HTMLAnchorElement>, target: "research" | "gallery") {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    openFromDesk(target);
  }

  useEffect(() => {
    if (!zoomTarget) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    zoomCancel.current?.focus({ preventScroll: true });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") cancelZoom();
      if (event.key === "Tab") { event.preventDefault(); zoomCancel.current?.focus({ preventScroll: true }); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onKeyDown); };
  }, [zoomTarget]);

  useEffect(() => () => { clearZoomTimers(); }, []);

  useEffect(() => {
    const restoreDesk = (event: PageTransitionEvent) => { if (event.persisted) cancelZoom(); };
    window.addEventListener("pageshow", restoreDesk);
    return () => window.removeEventListener("pageshow", restoreDesk);
  }, []);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("j-in-view"); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.08 });
    element.querySelectorAll("[data-j-reveal]").forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="journal-home" id="top" ref={root}>
      <a className="j-skip" href="#about">Skip to content</a>
      <header className="j-header">
        <a className="j-name" href="#top" aria-label="Jiawei Guo, home">Jiawei Guo<span lang="zh-CN">郭家威</span></a>
        <span className="j-header-note" lang="zh-CN">研究与日常</span>
        <nav aria-label="Primary navigation"><a href="#research" onClick={(event) => followDeskLink(event, "research")}>Research</a><a href={galleryHref} onClick={(event) => followDeskLink(event, "gallery")}>Gallery<Arrow /></a><a href={`mailto:${email}`}>Say hello<Arrow /></a></nav>
      </header>

      <section className="j-hero" id="about" aria-labelledby="j-title">
        <div className="j-hero-top"><span>A PERSONAL NOTEBOOK</span><span>VOL. 01 — ONGOING</span></div>
        <div className="j-hero-layout">
          <div className="j-hero-copy">
            <p className="j-small-label"><span className="j-red-dot" /> Hello, I’m Jiawei.</p>
            <h1 id="j-title">A little<br />about <em>Jiawei.</em></h1>
            <p className="j-hero-description">I work on computer vision.<br />I also take photographs.</p>
            <div className="j-hero-links"><a href="#research" onClick={(event) => followDeskLink(event, "research")}>My research<Arrow down /></a><a href="/Jiawei_Guo_CV.pdf" target="_blank" rel="noreferrer">Curriculum vitae<Arrow /></a></div>
          </div>
          <div className="j-hero-object">
            <div className="j-scene-label"><span>ON MY DESK</span><span lang="zh-CN">机 器 与 日 常</span></div>
            <div ref={stage} className={`j-scene-stage${zoomTarget ? " j-scene-stage-zoom" : ""}`} style={zoomTarget ? zoomOrigin : undefined} data-navigation={zoomTarget ?? "desk"} role={zoomTarget ? "dialog" : undefined} aria-modal={zoomTarget ? true : undefined} aria-label={zoomTarget ? `Opening ${zoomTarget}` : undefined}>
              <DeskScene focus={zoomTarget ?? "desk"} immersive={Boolean(zoomTarget)} onSelect={openFromDesk} onFocusSettled={finishZoom} />
              {zoomTarget && <div className="j-zoom-caption"><span>{zoomTarget === "research" ? "Research / 研究" : "Gallery / 摄影"}</span><button ref={zoomCancel} type="button" onClick={cancelZoom}>Back to desk <span aria-hidden="true">×</span></button></div>}
            </div>
            <div className="j-desk-tabs" aria-label="A few things on my desk">
              <button type="button" onClick={() => openFromDesk("research")}><span aria-hidden="true">⌘</span> Research</button>
              <button type="button" onClick={() => openFromDesk("gallery")}><span aria-hidden="true">◎</span> Gallery</button>
            </div>
          </div>
        </div>
        <div className="j-hero-bottom"><p className="j-handwritten" lang="zh-CN" aria-live="polite">{note}</p><a href="#research" className="j-scroll-note">A FEW THINGS BELOW <Arrow down /></a></div>
      </section>

      <section className="j-introduction j-section" aria-label="A short introduction" data-j-reveal>
        <div className="j-section-marker"><span>01</span><span>INTRODUCTION<br /><b lang="zh-CN">关于我</b></span></div>
        <div className="j-intro-body">
          <p className="j-intro-lead">Research is my day job.<br /><em>Looking closely</em> is a habit.</p>
          <div className="j-intro-columns">
            <p>I’m a Postdoctoral Research Associate in Industrial and Systems Engineering at <a href="https://www.lehigh.edu/" target="_blank" rel="noreferrer">Lehigh University</a>. My work focuses on deep learning for real-world data, from anomaly detection to computer vision on edge devices.</p>
            <p>I received my Ph.D. in Mechanical Engineering from the University of South Carolina and my M.S. in Electrical Engineering from the University of Southern California. Away from research, I’m usually out with a camera.</p>
          </div>
          <div className="j-inline-links"><a href={scholarUrl} target="_blank" rel="noreferrer">Google Scholar<Arrow /></a><a href={linkedInUrl} target="_blank" rel="noreferrer">LinkedIn<Arrow /></a><a href="https://github.com/Van-lord" target="_blank" rel="noreferrer">GitHub<Arrow /></a></div>
        </div>
      </section>

      <section className="j-research j-section" id="research" aria-labelledby="j-research-title" data-j-reveal>
        <div className="j-section-marker"><span>02</span><span>RESEARCH<br /><b lang="zh-CN">做些研究</b></span></div>
        <div className="j-section-body">
          <div className="j-section-heading"><h2 id="j-research-title" tabIndex={-1}>Ideas, <em>put to work.</em></h2><span>PERCEPTION → APPLICATION</span></div>
          <div className="j-projects">
            <article className="j-project"><span className="j-project-number">i.</span><div><h3>Anomaly detection</h3><p>Learning to find unusual patterns in images and Lamb-wave signals, using memory, retrieval, and adversarial transformers.</p><span className="j-project-note">Unsupervised learning · U.S. Department of Energy / SRNL</span></div><span className="j-project-symbol" aria-hidden="true">∿</span></article>
            <article className="j-project"><span className="j-project-number">ii.</span><div><h3>Computer vision in the field</h3><p>Real-time railway component detection and crack segmentation, with lightweight models deployed on NVIDIA Jetson AGX Orin.</p><span className="j-project-note">Edge AI · Federal Railroad Administration</span></div><span className="j-project-symbol j-symbol-square" aria-hidden="true">⌑</span></article>
            <article className="j-project"><span className="j-project-number">iii.</span><div><h3>Planning & autonomy</h3><p>Transformer-based reinforcement learning for path planning, alongside GPU-enabled decentralized planning for multiple robots.</p><span className="j-project-note">Reinforcement learning · Multi-robot systems</span></div><span className="j-project-symbol" aria-hidden="true">↗</span></article>
          </div>
          <p className="j-research-footnote">Also: co-inventor on a U.S. provisional patent application for a configurable computer vision module for infrastructure inspection. Filed July 2025.</p>
        </div>
      </section>

      <section className="j-publications j-section" id="publications" aria-labelledby="j-publications-title" data-j-reveal>
        <div className="j-section-marker"><span>03</span><span>PUBLICATIONS<br /><b lang="zh-CN">写下来的</b></span></div>
        <div className="j-section-body">
          <div className="j-section-heading"><h2 id="j-publications-title">Selected <em>papers.</em></h2><a href={scholarUrl} target="_blank" rel="noreferrer">Scholar<Arrow /></a></div>
          <ol className="j-paper-list">{selected.map((paper) => <PublicationRow key={paper.title} paper={paper} />)}</ol>
          {otherPapers.length > 0 && <details className="j-more-papers"><summary>More publications <span>+ {otherPapers.length}</span></summary><ol className="j-paper-list">{otherPapers.map((paper) => <PublicationRow key={paper.title} paper={paper} />)}</ol></details>}
        </div>
      </section>

      <section className="j-photography j-section" id="gallery" aria-labelledby="j-photography-title" data-j-reveal>
        <div className="j-section-marker"><span>04</span><span>AFTER HOURS<br /><b lang="zh-CN">出去走走</b></span></div>
        <div className="j-section-body">
          <div className="j-section-heading"><h2 id="j-photography-title">And then, <em>outside.</em></h2><span>A CAMERA, MOST DAYS.</span></div>
          <a className="j-photo-spread" href={galleryHref} aria-label="Open Jiawei’s existing photography gallery">
            <figure className="j-print j-print-city"><img src={cityPhoto} width="2200" height="1467" alt="A quiet blue evening in the city, photographed by Jiawei Guo" loading="lazy" /><figcaption><span>City 城市</span><span>J. GUO</span></figcaption></figure>
            <figure className="j-print j-print-birds"><img src={birdsPhoto} width="2200" height="1467" alt="Birds over coastal grasses, photographed by Jiawei Guo" loading="lazy" /><figcaption><span>鸟群是种实体</span><span>02</span></figcaption></figure>
            <span className="j-photo-note" lang="zh-CN">一些路过，<br />一些停留。</span>
          </a>
          <div className="j-gallery-link-row"><p lang="zh-CN">人群、鸟群、群山、城市，和其他。</p><a className="j-underlined-link" href={galleryHref}>Visit the gallery<Arrow /></a></div>
        </div>
      </section>

      <footer className="j-footer" id="contact">
        <div className="j-footer-top"><p className="j-small-label">A NOTE, A QUESTION, AN IDEA?</p><a className="j-footer-title" href={`mailto:${email}`}>Let’s <em>talk.</em><Arrow /></a><a className="j-email" href={`mailto:${email}`}>{email}</a><span className="j-seal" lang="zh-CN" aria-hidden="true">郭<br />家威</span></div>
        <div className="j-footer-bottom"><span>© 2026 Jiawei Guo</span><span lang="zh-CN">慢慢来，比较快。</span><div><a href={studioHref}>Studio<Arrow /></a><a href="#top">Back to top ↑</a></div></div>
      </footer>
    </main>
  );
}
