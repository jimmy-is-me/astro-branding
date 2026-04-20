export async function loadGsap() {
  if (typeof window === 'undefined') return null;
  const { gsap } = await import('gsap');
  return gsap;
}

export async function loadGsapWithScrollTrigger() {
  if (typeof window === 'undefined') return null;
  const { gsap } = await import('gsap');
  const { ScrollTrigger } = await import('gsap/ScrollTrigger');
  gsap.registerPlugin(ScrollTrigger);
  return { gsap, ScrollTrigger };
}

function splitTextNodes(nodes: HTMLElement[]) {
  const cleanups: Array<() => void> = [];
  nodes.forEach((node) => {
    if (node.dataset.splitReady === 'true') return;
    const text = node.textContent?.trim();
    if (!text) return;
    node.dataset.splitReady = 'true';
    node.dataset.originalText = text;
    const words = text.split(/\s+/);
    node.innerHTML = words
      .map((word) => `<span class="split-word"><span class="split-word__inner">${word}</span></span>`)
      .join(' ');
    cleanups.push(() => {
      const original = node.dataset.originalText;
      if (!original) return;
      node.textContent = original;
      delete node.dataset.splitReady;
      delete node.dataset.originalText;
    });
  });
  return cleanups;
}

function revealDelay(index: number): number {
  return (index % 4) * 0.07;
}

export async function initFormaMotion(root: ParentNode = document) {
  const loaded = await loadGsapWithScrollTrigger();
  if (!loaded || typeof window === 'undefined') return () => {};

  const { gsap, ScrollTrigger } = loaded;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const reveals = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
  const splitNodes = Array.from(root.querySelectorAll<HTMLElement>('[data-split]'));
  const parallaxNodes = Array.from(root.querySelectorAll<HTMLElement>('[data-parallax]'));
  const scaleRevealNodes = Array.from(root.querySelectorAll<HTMLElement>('[data-scale-reveal]'));
  const magnetNodes = Array.from(root.querySelectorAll<HTMLElement>('[data-magnet]'));
  const faqRoots = Array.from(root.querySelectorAll<HTMLElement>('[data-faq-root]'));

  const contexts: Array<{ revert?: () => void }> = [];
  const splitCleanups = splitTextNodes(splitNodes);

  if (reduceMotion) {
    [...reveals, ...splitNodes].forEach((node) => {
      node.style.opacity = '1';
      node.style.transform = 'none';
    });
    parallaxNodes.forEach((node) => { node.style.transform = 'none'; });
    return () => { splitCleanups.forEach((c) => c()); };
  }

  if (reveals.length > 0) {
    const ctx = gsap.context(() => {
      reveals.forEach((node, index) => {
        const yOffset = node.dataset.revealY ? Number(node.dataset.revealY) : 36;
        gsap.fromTo(node, { autoAlpha: 0, y: yOffset }, {
          autoAlpha: 1, y: 0, duration: 1.05,
          delay: revealDelay(index), ease: 'power4.out',
          scrollTrigger: { trigger: node, start: 'top 84%', once: true },
        });
      });
    }, root as Element);
    contexts.push(ctx);
  }

  if (splitNodes.length > 0) {
    const ctx = gsap.context(() => {
      splitNodes.forEach((node) => {
        const letters = node.querySelectorAll<HTMLElement>('.split-word__inner');
        gsap.set(node, { autoAlpha: 1 });
        gsap.fromTo(letters,
          { autoAlpha: 0, yPercent: 110, rotate: 1.8, skewX: 2 },
          { autoAlpha: 1, yPercent: 0, rotate: 0, skewX: 0, duration: 1.15,
            stagger: 0.055, ease: 'power4.out',
            scrollTrigger: { trigger: node, start: 'top 87%', once: true } });
      });
    }, root as Element);
    contexts.push(ctx);
  }

  if (parallaxNodes.length > 0) {
    const ctx = gsap.context(() => {
      parallaxNodes.forEach((node) => {
        const depth = Number(node.dataset.parallax ?? '50');
        gsap.fromTo(node, { y: -depth }, { y: depth, ease: 'none',
          scrollTrigger: { trigger: node, start: 'top bottom', end: 'bottom top', scrub: 0.9 } });
      });
    }, root as Element);
    contexts.push(ctx);
  }

  if (scaleRevealNodes.length > 0) {
    const ctx = gsap.context(() => {
      scaleRevealNodes.forEach((node, index) => {
        gsap.fromTo(node,
          { clipPath: 'inset(6% 6% 6% 6%)', autoAlpha: 0, scale: 1.06 },
          { clipPath: 'inset(0% 0% 0% 0%)', autoAlpha: 1, scale: 1,
            duration: 1.2, delay: index * 0.08, ease: 'power3.out',
            scrollTrigger: { trigger: node, start: 'top 82%', once: true } });
      });
    }, root as Element);
    contexts.push(ctx);
  }

  if (magnetNodes.length > 0) {
    magnetNodes.forEach((el) => {
      const onMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const xRel = (e.clientX - (rect.left + rect.width / 2)) * 0.3;
        const yRel = (e.clientY - (rect.top + rect.height / 2)) * 0.3;
        gsap.to(el, { x: xRel, y: yRel, duration: 0.4, ease: 'power2.out' });
      };
      const onLeave = () => { gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)' }); };
      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
      contexts.push({ revert: () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); } });
    });
  }

  faqRoots.forEach((rootNode) => {
    rootNode.querySelectorAll<HTMLElement>('[data-faq-panel]').forEach((panel) => {
      panel.hidden = true;
      gsap.set(panel, { height: 0, autoAlpha: 0 });
    });
    rootNode.querySelectorAll<HTMLButtonElement>('[data-faq-trigger]').forEach((button) => {
      if (button.dataset.motionReady === 'true') return;
      button.dataset.motionReady = 'true';
      button.addEventListener('click', () => {
        const panel = button.parentElement?.querySelector<HTMLElement>('[data-faq-panel]');
        if (!panel) return;
        const expanded = button.getAttribute('aria-expanded') === 'true';
        button.setAttribute('aria-expanded', String(!expanded));
        gsap.killTweensOf(panel);
        if (!expanded) {
          panel.hidden = false;
          gsap.fromTo(panel, { height: 0, autoAlpha: 0 }, { height: 'auto', autoAlpha: 1, duration: 0.5, ease: 'power3.out' });
        } else {
          gsap.to(panel, { height: 0, autoAlpha: 0, duration: 0.35, ease: 'power2.inOut', onComplete: () => { panel.hidden = true; } });
        }
      });
    });
  });

  ScrollTrigger.refresh();

  return () => {
    contexts.forEach((ctx) => ctx.revert?.());
    splitCleanups.forEach((c) => c());
  };
}
