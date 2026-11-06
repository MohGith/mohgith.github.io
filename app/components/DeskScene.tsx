"use client";

import { useEffect, useRef, useState } from "react";

/** A small, quiet workspace. It only renders when the view actually changes. */
export function DeskScene({ className = "", focus = "desk" }: { className?: string; focus?: "desk" | "research" | "camera" }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef(focus);
  const renderRequestRef = useRef<(() => void) | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    focusRef.current = focus;
    renderRequestRef.current?.();
  }, [focus]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let teardown: (() => void) | undefined;

    async function mount() {
      const THREE = await import("three");
      if (cancelled || !host) return;
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.32;
      renderer.domElement.setAttribute("aria-hidden", "true");
      Object.assign(renderer.domElement.style, { position: "absolute", inset: "0", width: "100%", height: "100%", touchAction: "pan-y" });
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-4, 4, 3.5, -3.5, 0.1, 60);
      camera.position.set(8.2, 6.8, 9.2);
      const viewCenter = new THREE.Vector3(0, 0.88, 0);
      const targetCenter = new THREE.Vector3();
      camera.lookAt(viewCenter);
      const objects = new THREE.Group();
      objects.rotation.y = -0.16;
      scene.add(objects);

      scene.add(new THREE.HemisphereLight(0xfffcf2, 0xbcb8aa, 2.25));
      const key = new THREE.DirectionalLight(0xfff6e8, 3.4);
      key.position.set(-3, 12, 4);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.left = -5;
      key.shadow.camera.right = 5;
      key.shadow.camera.top = 5;
      key.shadow.camera.bottom = -5;
      key.shadow.normalBias = 0.035;
      key.shadow.bias = -0.0002;
      key.shadow.radius = 5;
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xf0f2f0, 1.3);
      fill.position.set(4, 3, -4);
      scene.add(fill);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.07 }));
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = 0.035;
      floor.receiveShadow = true;
      scene.add(floor);

      const ivory = new THREE.MeshStandardMaterial({ color: 0xe4e0d5, roughness: 0.73, metalness: 0.08 });
      const edge = new THREE.MeshStandardMaterial({ color: 0xaaa99f, roughness: 0.49, metalness: 0.55 });
      const silver = new THREE.MeshStandardMaterial({ color: 0xc7c8c0, roughness: 0.38, metalness: 0.75 });
      const charcoal = new THREE.MeshStandardMaterial({ color: 0x252827, roughness: 0.78 });
      const dark = new THREE.MeshStandardMaterial({ color: 0x111615, roughness: 0.63 });
      const red = new THREE.MeshStandardMaterial({ color: 0xb4513a, roughness: 0.94 });
      const paper = new THREE.MeshStandardMaterial({ color: 0xf8f3e5, roughness: 1 });
      const glass = new THREE.MeshStandardMaterial({ color: 0x263d3b, roughness: 0.12, metalness: 0.8 });
      const textures = new Set<InstanceType<typeof THREE.Texture>>();

      function box(w: number, h: number, d: number, material: InstanceType<typeof THREE.Material>, x = 0, y = 0, z = 0, parent: InstanceType<typeof THREE.Object3D> = objects) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        parent.add(mesh);
        return mesh;
      }
      function cylinder(radius: number, depth: number, material: InstanceType<typeof THREE.Material>, x: number, y: number, z: number, parent: InstanceType<typeof THREE.Object3D> = objects) {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, 48), material);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        parent.add(mesh);
        return mesh;
      }
      function canvasTexture(width: number, height: number, paint: (context: CanvasRenderingContext2D) => void) {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) return null;
        paint(context);
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        textures.add(texture);
        return texture;
      }

      // A modest laptop, with an editorial research notebook on its screen.
      const laptop = new THREE.Group();
      laptop.position.set(-0.6, 0.04, -0.6);
      laptop.rotation.y = -0.08;
      objects.add(laptop);
      box(3.6, 0.16, 2.35, ivory, 0, 0.08, 0.15, laptop);
      box(3.45, 0.025, 2.2, silver, 0, 0.171, 0.15, laptop);
      box(1.03, 0.009, 0.58, edge, 0, 0.19, 0.8, laptop);
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 11; col++) {
          box(0.231, 0.022, 0.17, charcoal, -1.35 + col * 0.27, 0.198, -0.54 + row * 0.25, laptop);
        }
      }
      box(1.45, 0.02, 0.13, charcoal, 0, 0.198, 0.34, laptop);
      const lid = new THREE.Group();
      lid.position.set(0, 0.2, -0.98);
      lid.rotation.x = -0.14;
      laptop.add(lid);
      box(3.6, 2.36, 0.115, ivory, 0, 1.18, 0, lid);
      box(3.35, 2.12, 0.017, charcoal, 0, 1.21, 0.068, lid);
      const screenTexture = canvasTexture(1200, 760, (ctx) => {
        ctx.fillStyle = "#282e2b";
        ctx.fillRect(0, 0, 1200, 760);
        ctx.fillStyle = "#c8cbbd";
        ctx.font = "20px monospace";
        ctx.fillText("J. GUO  /  RESEARCH NOTES", 72, 77);
        ctx.strokeStyle = "#626a5f";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(72, 111); ctx.lineTo(1128, 111); ctx.stroke();
        ctx.fillStyle = "#f2eee0";
        ctx.font = "italic 108px Georgia, serif";
        ctx.fillText("Look a little", 70, 270);
        ctx.fillText("closer.", 70, 384);
        ctx.font = "23px monospace";
        ctx.fillStyle = "#b5c0ad";
        ctx.fillText("COMPUTER VISION", 76, 585);
        ctx.fillStyle = "#bd6b51";
        ctx.fillRect(76, 625, 10, 10);
        ctx.fillStyle = "#b5c0ad";
        ctx.font = "18px monospace";
        ctx.fillText("LEHIGH UNIVERSITY", 104, 636);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#798678";
        ctx.beginPath(); ctx.arc(960, 526, 98, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(960, 526, 68, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(839, 526); ctx.lineTo(1081, 526); ctx.moveTo(960, 405); ctx.lineTo(960, 647); ctx.stroke();
      });
      if (screenTexture) {
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.22, 2.02), new THREE.MeshBasicMaterial({ map: screenTexture }));
        screen.position.set(0, 1.21, 0.080);
        lid.add(screen);
      }
      const webcam = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 12), dark);
      webcam.position.set(0, 2.31, 0.065);
      lid.add(webcam);

      // A little rangefinder camera. Its lens faces forward, not up.
      const cameraObject = new THREE.Group();
      cameraObject.position.set(1.63, 0.04, 1.05);
      cameraObject.rotation.y = -0.27;
      objects.add(cameraObject);
      box(1.75, 1.05, 0.72, charcoal, 0, 0.57, 0, cameraObject);
      box(1.77, 0.2, 0.75, silver, 0, 1.02, 0, cameraObject);
      box(1.77, 0.11, 0.75, silver, 0, 0.1, 0, cameraObject);
      box(0.28, 0.83, 0.075, dark, 0.66, 0.56, 0.4, cameraObject);
      box(0.29, 0.17, 0.02, glass, -0.55, 0.87, 0.39, cameraObject);
      box(0.2, 0.12, 0.025, dark, -0.53, 0.87, 0.405, cameraObject);
      const badge = cylinder(0.06, 0.015, red, -0.58, 0.63, 0.385, cameraObject);
      badge.rotation.x = Math.PI / 2;
      const lensBack = cylinder(0.49, 0.13, silver, 0.1, 0.57, 0.4, cameraObject);
      lensBack.rotation.x = Math.PI / 2;
      const lens = cylinder(0.425, 0.53, dark, 0.1, 0.57, 0.66, cameraObject);
      lens.rotation.x = Math.PI / 2;
      for (let i = 0; i < 6; i++) {
        const ring = cylinder(0.434, 0.024, i === 3 ? silver : charcoal, 0.1, 0.57, 0.47 + i * 0.071, cameraObject);
        ring.rotation.x = Math.PI / 2;
      }
      const lensFace = cylinder(0.345, 0.015, glass, 0.1, 0.57, 0.94, cameraObject);
      lensFace.rotation.x = Math.PI / 2;
      const lensCore = cylinder(0.18, 0.018, dark, 0.1, 0.57, 0.952, cameraObject);
      lensCore.rotation.x = Math.PI / 2;
      cylinder(0.13, 0.08, dark, 0.5, 1.16, 0.01, cameraObject);
      cylinder(0.09, 0.07, silver, 0.69, 1.16, 0.16, cameraObject);
      cylinder(0.18, 0.08, silver, -0.5, 1.16, -0.03, cameraObject);

      // Cloth-bound notebook and its exposed paper edges.
      const book = new THREE.Group();
      book.position.set(-1.7, 0.03, 1.55);
      book.rotation.y = -0.29;
      objects.add(book);
      box(1.7, 0.06, 1.15, red, 0, 0.04, 0, book);
      box(1.61, 0.17, 1.05, paper, 0.025, 0.14, 0, book);
      box(1.7, 0.065, 1.15, red, 0, 0.26, 0, book);
      box(0.065, 0.26, 1.15, red, -0.82, 0.14, 0, book);
      const bookTexture = canvasTexture(800, 540, (ctx) => {
        ctx.fillStyle = "#b4513a";
        ctx.fillRect(0, 0, 800, 540);
        ctx.fillStyle = "#f4e7d3";
        ctx.font = "44px Georgia, serif";
        ctx.fillText("Field notes", 82, 190);
        ctx.font = "19px monospace";
        ctx.fillText("JIAWEI GUO", 85, 408);
        ctx.strokeStyle = "#d39478";
        ctx.beginPath(); ctx.moveTo(85, 235); ctx.lineTo(710, 235); ctx.stroke();
      });
      if (bookTexture) {
        const cover = new THREE.Mesh(new THREE.PlaneGeometry(1.61, 1.06), new THREE.MeshBasicMaterial({ map: bookTexture }));
        cover.rotation.x = -Math.PI / 2;
        cover.position.set(0, 0.297, 0);
        book.add(cover);
      }
      for (let i = 0; i < 4; i++) box(1.58, 0.005, 0.003, ivory, 0.025, 0.085 + i * 0.035, 0.529, book);

      // A small cup at the back of the desk.
      const cup = new THREE.Group();
      cup.position.set(1.95, 0.02, -1.15);
      objects.add(cup);
      const cupBody = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.28, 0.64, 48), ivory);
      cupBody.position.y = 0.34;
      cupBody.castShadow = true;
      cup.add(cupBody);
      const coffee = cylinder(0.295, 0.018, new THREE.MeshStandardMaterial({ color: 0x44372b, roughness: 0.35 }), 0, 0.665, 0, cup);
      coffee.castShadow = false;
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.028, 12, 48), ivory);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.674;
      cup.add(rim);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.048, 12, 32), ivory);
      handle.position.set(0.39, 0.39, 0);
      handle.castShadow = true;
      cup.add(handle);

      let visible = true;
      let frame = 0;
      let pointerX = 0;
      let pointerY = 0;
      let scrollProgress = 0;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
      const loader = new THREE.TextureLoader();
      function print(url: string, x: number, z: number, angle: number, elevation: number) {
        const group = new THREE.Group();
        group.position.set(x, elevation, z);
        group.rotation.y = angle;
        objects.add(group);
        box(1.32, 0.024, 1.08, paper, 0, 0.013, 0, group);
        const texture = loader.load(url, () => { if (!cancelled) requestRender(); }, undefined, () => undefined);
        textures.add(texture);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        const image = new THREE.Mesh(new THREE.PlaneGeometry(1.16, 0.77), new THREE.MeshBasicMaterial({ map: texture }));
        image.rotation.x = -Math.PI / 2;
        image.position.set(0, 0.027, -0.055);
        group.add(image);
      }
      print("/photos/thumbs/76fefc7c-7c0d-454d-8a6c-a3fb683cbf15.jpg", -0.03, 1.47, -0.08, 0.01);
      print("/photos/thumbs/0cd9ca70-1ea6-41f1-b301-9c0f15c629ce.jpg", 0.04, 1.67, 0.13, 0.046);

      function render() {
        frame = 0;
        if (cancelled || !visible || document.hidden) return;
        const focusView = focusRef.current;
        const laptopFocus = focusView === "research";
        const cameraFocus = focusView === "camera";
        targetCenter.set(laptopFocus ? -0.4 : cameraFocus ? 0.7 : 0, laptopFocus ? 1.08 : cameraFocus ? 0.75 : 0.88, laptopFocus ? -0.4 : cameraFocus ? 0.65 : 0);
        const targetZoom = laptopFocus ? 1.1 : cameraFocus ? 1.14 : 1;
        const focusYaw = laptopFocus ? 0.14 : cameraFocus ? 0.26 : 0;
        const nextY = -0.16 + focusYaw + (reducedMotion.matches ? 0 : pointerX * 0.08 + scrollProgress * 0.23);
        const nextX = reducedMotion.matches ? 0 : pointerY * 0.025;
        const easing = reducedMotion.matches ? 1 : 0.1;
        objects.rotation.y += (nextY - objects.rotation.y) * easing;
        objects.rotation.x += (nextX - objects.rotation.x) * easing;
        viewCenter.lerp(targetCenter, easing);
        camera.lookAt(viewCenter);
        camera.zoom += (targetZoom - camera.zoom) * easing;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
        const unsettled = Math.abs(nextY - objects.rotation.y) + Math.abs(nextX - objects.rotation.x) + Math.abs(targetZoom - camera.zoom) + viewCenter.distanceTo(targetCenter);
        if (unsettled > 0.0003) requestRender();
      }
      function requestRender() {
        if (!frame && visible && !document.hidden && !cancelled) frame = window.requestAnimationFrame(render);
      }
      function resize() {
        if (!host) return;
        const width = host.clientWidth;
        const height = host.clientHeight;
        if (!width || !height) return;
        const aspect = width / height;
        const viewHeight = aspect < 0.9 ? 7.5 : 6.45;
        camera.left = -viewHeight * aspect / 2;
        camera.right = viewHeight * aspect / 2;
        camera.top = viewHeight / 2;
        camera.bottom = -viewHeight / 2;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
        requestRender();
      }
      function move(event: PointerEvent) {
        if (reducedMotion.matches || event.pointerType === "touch" || !host) return;
        const rect = host.getBoundingClientRect();
        pointerX = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
        pointerY = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
        requestRender();
      }
      function leave() { pointerX = 0; pointerY = 0; requestRender(); }
      function scroll() {
        if (!host || reducedMotion.matches) return;
        const top = host.getBoundingClientRect().top + window.scrollY;
        scrollProgress = Math.max(0, Math.min(1, (window.scrollY - top + window.innerHeight * 0.1) / window.innerHeight));
        requestRender();
      }
      function visibility() {
        if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0; }
        else requestRender();
      }
      function motionChanged() { scroll(); requestRender(); }
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
      const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (!visible && frame) { cancelAnimationFrame(frame); frame = 0; }
        else requestRender();
      }, { rootMargin: "80px" });
      observer.observe(host);
      host.addEventListener("pointermove", move, { passive: true });
      host.addEventListener("pointerleave", leave, { passive: true });
      window.addEventListener("scroll", scroll, { passive: true });
      document.addEventListener("visibilitychange", visibility);
      reducedMotion.addEventListener("change", motionChanged);
      renderRequestRef.current = requestRender;
      resize();
      scroll();
      renderer.render(scene, camera);
      setReady(true);

      teardown = () => {
        if (renderRequestRef.current === requestRender) renderRequestRef.current = null;
        if (frame) cancelAnimationFrame(frame);
        resizeObserver.disconnect();
        observer.disconnect();
        host.removeEventListener("pointermove", move);
        host.removeEventListener("pointerleave", leave);
        window.removeEventListener("scroll", scroll);
        document.removeEventListener("visibilitychange", visibility);
        reducedMotion.removeEventListener("change", motionChanged);
        const materials = new Set<InstanceType<typeof THREE.Material>>();
        const geometries = new Set<InstanceType<typeof THREE.BufferGeometry>>();
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            geometries.add(object.geometry);
            const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
            meshMaterials.forEach((material) => materials.add(material));
          }
        });
        textures.forEach((texture) => texture.dispose());
        geometries.forEach((geometry) => geometry.dispose());
        materials.forEach((material) => material.dispose());
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
      };
    }

    mount().catch(() => {
      // The illustrated fallback is the complete non-WebGL experience.
      if (!cancelled) setReady(false);
      teardown?.();
    });
    return () => { cancelled = true; teardown?.(); };
  }, []);

  return (
    <div className={`paper-desk ${className}`.trim()} ref={hostRef} role="img" aria-label="A small workspace with a laptop, camera, field notebook and photographs" style={{ position: "relative", width: "100%", aspectRatio: "1.2" }}>
      <img src="/desk-scene-fallback.svg" alt="" aria-hidden="true" width="720" height="600" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", visibility: ready ? "hidden" : "visible" }} />
    </div>
  );
}
