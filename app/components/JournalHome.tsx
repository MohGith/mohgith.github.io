"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type KeyboardEvent } from "react";
import { DeskScene, type ScreenBounds } from "./DeskScene";
import "../../public/journal.css";

type Publication = { title: string; journal: string; year: string; authors: string };
type View = "desk" | "research" | "gallery";
type ResearchTab = "overview" | "papers" | "about";
export type JournalHomeProps = {
  email: string;
  linkedInUrl: string;
  scholarUrl: string;
  publications: Publication[];
  galleryHref?: string;
  studioHref?: string;
};

function Arrow() { return <span aria-hidden="true" className="j-arrow">↗</span>; }

function PublicationRow({ paper }: { paper: Publication }) {
  return <li className="j-paper"><span className="j-paper-year">{paper.year}</span><div><h3><a href={`https://scholar.google.com/scholar?q=${encodeURIComponent(paper.title)}`} target="_blank" rel="noreferrer">{paper.title}<Arrow /></a></h3><p className="j-paper-authors">{paper.authors.split(/(J\. Guo)/).map((part, index) => part === "J. Guo" ? <strong key={index}>{part}</strong> : part)}</p><p className="j-paper-venue">{paper.journal}</p></div></li>;
}

export function JournalHome({ email, linkedInUrl, scholarUrl, publications, galleryHref = "/gallery", studioHref = "/dashboard" }: JournalHomeProps) {
  const [view, setView] = useState<View>("desk");
  const [tab, setTab] = useState<ResearchTab>("overview");
  const [screenBounds, setScreenBounds] = useState<ScreenBounds | null>(null);
  const [panelReady, setPanelReady] = useState(false);
  const viewRef = useRef<View>("desk");
  const sceneRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const lastControl = useRef<HTMLElement | null>(null);
  const safetyTimer = useRef<number | null>(null);

  function clearTimer() { if (safetyTimer.current !== null) window.clearTimeout(safetyTimer.current); safetyTimer.current = null; }

  function closeDesk() {
    clearTimer();
    viewRef.current = "desk";
    setView("desk");
    setPanelReady(false);
    setScreenBounds(null);
    if (window.location.hash === "#research") window.history.replaceState(null, "", window.location.pathname + window.location.search);
    window.requestAnimationFrame(() => lastControl.current?.focus({ preventScroll: true }));
  }

  function settled(target: "research" | "gallery") {
    if (viewRef.current !== target) return;
    clearTimer();
    if (target === "gallery") { window.location.assign(galleryHref); return; }
    setPanelReady(true);
  }

  function open(target: "research" | "gallery") {
    if (viewRef.current !== "desk") return;
    lastControl.current = document.activeElement as HTMLElement | null;
    viewRef.current = target;
    setView(target);
    setPanelReady(false);
    setScreenBounds(null);
    setTab("overview");
    if (target === "research" && window.location.hash !== "#research") window.history.pushState(null, "", "#research");
    // The readable screen remains available when WebGL cannot initialize.
    safetyTimer.current = window.setTimeout(() => settled(target), 2700);
  }

  function follow(event: MouseEvent<HTMLAnchorElement>, target: "research" | "gallery") {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    open(target);
  }

  function selectTab(next: ResearchTab) {
    setTab(next);
    screenRef.current?.querySelector(".j-screen-content")?.scrollTo({ top: 0 });
  }

  function moveTab(event: KeyboardEvent<HTMLButtonElement>, current: ResearchTab) {
    const choices: ResearchTab[] = ["overview", "papers", "about"];
    const direction = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!direction) return;
    event.preventDefault();
    const next = choices[(choices.indexOf(current) + direction + choices.length) % choices.length];
    selectTab(next);
    document.getElementById(`j-${next}-tab`)?.focus();
  }

  useEffect(() => {
    if (view === "desk") return;
    backRef.current?.focus({ preventScroll: true });
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") { closeDesk(); return; }
      if (event.key !== "Tab") return;
      const focusable = [backRef.current, ...Array.from(screenRef.current?.querySelectorAll<HTMLElement>("a[href],button,[tabindex='0']") ?? [])].filter((node): node is HTMLElement => Boolean(node && node.offsetWidth && node.offsetHeight));
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view]);

  useEffect(() => {
    if (view === "research" && panelReady) document.getElementById(`j-${tab}-tab`)?.focus({ preventScroll: true });
  }, [view, panelReady]);

  useEffect(() => {
    const restore = (event: PageTransitionEvent) => { if (event.persisted) closeDesk(); };
    const historyChanged = () => {
      if (window.location.hash === "#research") { if (viewRef.current === "desk") open("research"); }
      else if (viewRef.current !== "desk") closeDesk();
    };
    if (window.location.hash === "#research") open("research");
    window.addEventListener("pageshow", restore);
    window.addEventListener("popstate", historyChanged);
    return () => { clearTimer(); window.removeEventListener("pageshow", restore); window.removeEventListener("popstate", historyChanged); };
  }, []);

  const screenStyle: CSSProperties | undefined = screenBounds ? { left: screenBounds.left, top: screenBounds.top, width: screenBounds.width, height: screenBounds.height } : undefined;

  return <main className="journal-home j-single" id="top" data-view={view}>
    <header className="j-header" inert={view !== "desk"} aria-hidden={view !== "desk"}>
      <a className="j-name" href="#top" onClick={(event) => { event.preventDefault(); closeDesk(); }} aria-label="Jiawei Guo, home">Jiawei Guo<span lang="zh-CN">郭家威</span></a>
      <nav aria-label="Primary navigation"><a href="#research" onClick={(event) => follow(event, "research")}>Research</a><a href={galleryHref} onClick={(event) => follow(event, "gallery")}>Gallery<Arrow /></a><a href={`mailto:${email}`}>Say hello<Arrow /></a></nav>
    </header>

    <section className="j-scene-composition" aria-labelledby="j-title">
      <div className="j-composition-type" aria-hidden={view !== "desk"}>
        <p className="j-hello">Hello, I’m</p>
        <h1 id="j-title"><span className="j-title-first">Jiawei</span><em className="j-title-second">Guo.</em></h1>
      </div>
      <div className="j-scene-canvas" ref={sceneRef}>
        <DeskScene immersive focus={view} onSelect={open} onFocusSettled={settled} onScreenBounds={setScreenBounds} />
        <section id="research" ref={screenRef} className={`j-research-screen${screenBounds ? "" : " j-screen-fallback"}`} style={screenStyle} hidden={view !== "research" || !panelReady} aria-label="Research on Jiawei’s computer screen">
          <div className="j-screen-topbar"><span>J. GUO / RESEARCH</span><span>LEHIGH UNIVERSITY</span></div>
          <nav className="j-screen-tabs" role="tablist" aria-label="Research pages">
            {(["overview", "papers", "about"] as const).map((item) => <button type="button" role="tab" id={`j-${item}-tab`} key={item} aria-controls={`j-${item}-panel`} aria-selected={tab === item} tabIndex={tab === item ? 0 : -1} onKeyDown={(event) => moveTab(event, item)} onClick={() => selectTab(item)}>{item === "overview" ? "Research" : item === "papers" ? `Papers (${publications.length})` : "About"}</button>)}
          </nav>
          <div className="j-screen-content" tabIndex={0}>
            <section role="tabpanel" id="j-overview-panel" aria-labelledby="j-overview-tab" hidden={tab !== "overview"}>
              <p className="j-screen-eyebrow">COMPUTER VISION & APPLIED AI</p>
              <h2>Research,<br /><em>in practice.</em></h2>
              <p className="j-screen-bio">I’m a Postdoctoral Research Associate at Lehigh University, working on deep learning for real-world data and applications.</p>
              <div className="j-screen-projects">
                <article><span>01</span><div><h3>Anomaly detection</h3><p>Memory, retrieval, and adversarial transformers for finding unusual patterns in images and Lamb-wave signals.</p><small>U.S. Department of Energy / Savannah River National Laboratory</small></div></article>
                <article><span>02</span><div><h3>Vision in the field</h3><p>Real-time railway inspection, lightweight detection and crack segmentation on NVIDIA Jetson AGX Orin.</p><small>Federal Railroad Administration · Edge AI</small></div></article>
                <article><span>03</span><div><h3>Planning & autonomy</h3><p>Transformer-based reinforcement learning and GPU-enabled planning for multiple robots.</p><small>Reinforcement learning · Multi-robot systems</small></div></article>
              </div>
              <div className="j-screen-links"><a href={scholarUrl} target="_blank" rel="noreferrer">Google Scholar<Arrow /></a><a href="/Jiawei_Guo_CV.pdf" target="_blank" rel="noreferrer">Curriculum vitae<Arrow /></a></div>
            </section>
            <section role="tabpanel" id="j-papers-panel" aria-labelledby="j-papers-tab" hidden={tab !== "papers"}>
              <div className="j-screen-heading"><h2>Published <em>work.</em></h2><a href={scholarUrl} target="_blank" rel="noreferrer">Scholar<Arrow /></a></div>
              <p className="j-screen-bio">Journal and conference papers, 2021–2026.</p>
              <ol className="j-paper-list">{publications.map((paper) => <PublicationRow key={paper.title} paper={paper} />)}</ol>
            </section>
            <section role="tabpanel" id="j-about-panel" aria-labelledby="j-about-tab" hidden={tab !== "about"}>
              <p className="j-screen-eyebrow" lang="zh-CN">关于我 / A SHORT INTRODUCTION</p>
              <h2>A little<br />about <em>Jiawei.</em></h2>
              <p className="j-screen-bio">I work on computer vision, unsupervised anomaly detection, and practical AI systems. I’m currently a Postdoctoral Research Associate in Industrial and Systems Engineering at Lehigh University.</p>
              <p className="j-screen-bio">I received my Ph.D. in Mechanical Engineering from the University of South Carolina and my M.S. in Electrical Engineering from the University of Southern California. Away from research, I’m usually out with a camera.</p>
              <p className="j-screen-bio">Co-inventor on a U.S. provisional patent application for a configurable computer vision module for infrastructure inspection, filed July 2025.</p>
              <div className="j-screen-links"><a href={`mailto:${email}`}>Email<Arrow /></a><a href={linkedInUrl} target="_blank" rel="noreferrer">LinkedIn<Arrow /></a><a href="https://github.com/Van-lord" target="_blank" rel="noreferrer">GitHub<Arrow /></a><a href="/Jiawei_Guo_CV.pdf" target="_blank" rel="noreferrer">CV<Arrow /></a></div>
            </section>
          </div>
        </section>
      </div>
      <p className="j-identity-note" aria-hidden={view !== "desk"}>Computer vision researcher.<br /><em>Photographer, after hours.</em></p>
      <p className="j-desk-direction" lang="zh-CN" aria-hidden={view !== "desk"}>电脑里是研究，<br />镜头外是日常。</p>
      <div className="j-object-labels" aria-label="Explore my desk" inert={view !== "desk"} aria-hidden={view !== "desk"}>
        <button type="button" className="j-label-research" onClick={() => open("research")}>Research<Arrow /></button>
        <button type="button" className="j-label-gallery" onClick={() => open("gallery")}>Gallery<Arrow /></button>
      </div>
    </section>

    {view !== "desk" && <button type="button" ref={backRef} className="j-back-to-desk" onClick={closeDesk}>Back to desk <span aria-hidden="true">×</span></button>}
    <footer className="j-home-footer" inert={view !== "desk"} aria-hidden={view !== "desk"}>
      <p lang="zh-CN">整点 Research，整点照片，整点薯条。</p>
      <div><a href="/Jiawei_Guo_CV.pdf" target="_blank" rel="noreferrer">CV<Arrow /></a><a href={`mailto:${email}`}>Email<Arrow /></a><a href={studioHref}>Studio<Arrow /></a><span>© 2026</span></div>
    </footer>
  </main>;
}
