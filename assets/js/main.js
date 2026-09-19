/* Academic homepage: progressive navigation, source-preserving search, native dialogs.
   No tracking, network requests, framework, or build step. */
(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const body = document.body;
  const nav = document.querySelector('.primary-nav');
  const menu = document.querySelector('.nav-toggle');
  const mobileWidth = window.matchMedia('(max-width: 1050px)');
  const closeMenu = (restoreFocus = false) => {
    if (!nav || !menu) return;
    const wasOpen = nav.classList.contains('open');
    nav.classList.remove('open'); menu.classList.remove('is-open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Open navigation');
    if (wasOpen && restoreFocus) menu.focus({preventScroll: true});
  };
  if (nav && menu) {
    menu.addEventListener('click', () => {
      const open = !nav.classList.contains('open');
      nav.classList.toggle('open', open); menu.classList.toggle('is-open', open);
      menu.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
    document.addEventListener('click', event => {
      if (!event.target.closest('.site-header')) closeMenu();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !document.querySelector('dialog[open]') && nav.classList.contains('open')) {
        event.preventDefault(); closeMenu(true);
      }
    });
    document.addEventListener('focusin', event => {
      if (!event.target.closest('.site-header')) closeMenu();
    });
    const resizeMenu = () => { if (!mobileWidth.matches) closeMenu(); };
    mobileWidth.addEventListener('change', resizeMenu);
  }
  // Only enable script-dependent controls after their implementation is present.
  document.documentElement.classList.add('has-js');
  window.addEventListener('pageshow', () => closeMenu());

  // Home-only logo ribbon: native horizontal scrolling keeps focused links reachable.
  // The second set is visual-only; assistive technology and Tab see each outlet once.
  const ribbon = document.querySelector('.home-media-ribbon');
  if (ribbon) {
    const viewport = ribbon.querySelector('.home-media-logo-marquee');
    const track = ribbon.querySelector('.media-logo-track');
    const primarySet = track?.querySelector('.media-logo-set');
    const control = ribbon.querySelector('.media-motion-toggle');
    if (viewport && track && primarySet && control) {
      const duplicate = primarySet.cloneNode(true);
      duplicate.setAttribute('aria-hidden', 'true');
      duplicate.hidden = true;
      duplicate.querySelectorAll('a').forEach(link => link.tabIndex = -1);
      duplicate.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
      track.append(duplicate);
      let frame = null, previousTime = null, position = 0, cycleWidth = 0;
      let userPaused = false, hovered = false, focused = false, visible = true, printing = false;
      const canRun = () => !reducedMotion.matches && !userPaused && !hovered && !focused && visible && !document.hidden && !printing && cycleWidth > 0;
      const tick = time => {
        frame = null;
        if (!canRun()) { previousTime = null; return; }
        // Keep the position fractional for smooth 26px/second travel at any refresh rate.
        // Cap elapsed time to prevent jumps after a suspended browser frame.
        if (previousTime !== null) position = (position + Math.min(time - previousTime, 80) * 0.026) % cycleWidth;
        previousTime = time;
        viewport.scrollLeft = position;
        frame = requestAnimationFrame(tick);
      };
      const updatePlayback = () => {
        if (canRun()) {
          if (frame === null) {
            position = viewport.scrollLeft % cycleWidth;
            previousTime = null;
            frame = requestAnimationFrame(tick);
          }
        } else {
          if (frame !== null) cancelAnimationFrame(frame);
          frame = null; previousTime = null;
        }
      };
      const updateControl = () => {
        const label = userPaused ? 'Play media logo animation' : 'Pause media logo animation';
        control.setAttribute('aria-label', label);
        control.title = userPaused ? 'Play animation' : 'Pause animation';
        control.querySelector('.media-pause-icon').toggleAttribute('hidden', userPaused);
        control.querySelector('.media-play-icon').toggleAttribute('hidden', !userPaused);
      };
      const measure = () => {
        cycleWidth = reducedMotion.matches ? 0 : primarySet.getBoundingClientRect().width;
        updatePlayback();
      };
      const applyMotionPreference = () => {
        const enabled = !reducedMotion.matches;
        ribbon.classList.toggle('is-media-animated', enabled);
        duplicate.hidden = !enabled;
        control.hidden = !enabled;
        viewport.scrollLeft = 0; position = 0;
        measure();
      };
      control.addEventListener('click', () => {
        userPaused = !userPaused; updateControl(); updatePlayback();
      });
      // Hover and keyboard focus pause temporarily. The button remains outside the
      // scrolling viewport, so Play also works while the button itself has focus.
      viewport.addEventListener('mouseenter', () => { hovered = true; updatePlayback(); });
      viewport.addEventListener('mouseleave', () => { hovered = false; updatePlayback(); });
      viewport.addEventListener('focusin', event => {
        focused = true; updatePlayback();
        const link = event.target.closest('.media-logo-link');
        if (!link || reducedMotion.matches) return;
        // Browsers may leave a partly visible focused link clipped. After native focus
        // scrolling, reveal the whole link without moving the surrounding page.
        requestAnimationFrame(() => {
          if (document.activeElement !== link || reducedMotion.matches) return;
          const bounds = viewport.getBoundingClientRect();
          const item = link.getBoundingClientRect();
          if (item.left < bounds.left) viewport.scrollLeft -= bounds.left - item.left;
          else if (item.right > bounds.right) viewport.scrollLeft += item.right - bounds.right;
        });
      });
      viewport.addEventListener('focusout', () => {
        queueMicrotask(() => { focused = viewport.contains(document.activeElement); updatePlayback(); });
      });
      // Touch/pen dragging is an intentional request to inspect the strip. Stay paused
      // until Play is selected instead of fighting the user's swipe with autoplay.
      viewport.addEventListener('pointerdown', event => {
        if (event.pointerType === 'touch' || event.pointerType === 'pen') {
          userPaused = true; updateControl(); updatePlayback();
        }
      }, {passive:true});
      document.addEventListener('visibilitychange', updatePlayback);
      window.addEventListener('beforeprint', () => { printing = true; viewport.scrollLeft = 0; updatePlayback(); });
      window.addEventListener('afterprint', () => { printing = false; measure(); });
      reducedMotion.addEventListener('change', applyMotionPreference);
      if ('ResizeObserver' in window) new ResizeObserver(measure).observe(primarySet);
      else window.addEventListener('resize', measure, {passive:true});
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => {
          visible = entries[0].isIntersecting; updatePlayback();
        }).observe(ribbon);
      }
      applyMotionPreference(); updateControl();
    }
  }

  // Portfolio cards use the existing, cross-listed records. Without JS they link to publications.
  const portfolio = window.RESEARCH_PORTFOLIO;
  const triggers = [...document.querySelectorAll('[data-research-area]')];
  if (portfolio && portfolio.areas && triggers.length && 'HTMLDialogElement' in window) {
    const dialog = document.createElement('dialog');
    dialog.id = 'research-portfolio-dialog'; dialog.className = 'research-dialog';
    dialog.setAttribute('aria-labelledby', 'research-dialog-title');
    dialog.innerHTML = `<div class="research-dialog-shell">
      <header class="research-dialog-header"><div><p class="eyebrow">Research Portfolio</p>
        <h2 id="research-dialog-title"></h2><p id="research-dialog-description"></p></div>
        <button class="research-dialog-close" type="button" aria-label="Close research portfolio">×</button></header>
      <div class="research-dialog-summary"><span id="research-dialog-count"></span>
        <span>2019 onward</span><span>Cross-listing is intentional</span></div>
      <div id="research-dialog-content" class="research-dialog-content"></div></div>`;
    body.append(dialog);
    const content = dialog.querySelector('#research-dialog-content');
    const close = dialog.querySelector('.research-dialog-close');
    let returnTarget = null;
    // Match names in one pass: never nest substitutions inside already-generated HTML.
    const names = [...new Set([...(portfolio.studentNames || []), 'Mohammadhadi Amini', 'Amini, M. Hadi', 'M. Hadi Amini'])].sort((a,b) => b.length-a.length);
    const escaped = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const namePattern = new RegExp(names.map(escaped).join('|'), 'g');
    const citationFragment = text => {
      const fragment = document.createDocumentFragment(); let previous = 0;
      for (const match of text.matchAll(namePattern)) {
        fragment.append(document.createTextNode(text.slice(previous, match.index)));
        const isAmini = ['Mohammadhadi Amini', 'Amini, M. Hadi', 'M. Hadi Amini'].includes(match[0]);
        const el = document.createElement(isAmini ? 'strong' : 'span');
        if (!isAmini) el.className = 'student-author';
        el.textContent = match[0] === 'Mohammadhadi Amini' ? 'M. Hadi Amini' : match[0];
        fragment.append(el); previous = match.index + match[0].length;
      }
      fragment.append(document.createTextNode(text.slice(previous))); return fragment;
    };
    const countRecords = area => area.groups.reduce((sum, group) => sum + group.records.length, 0);
    for (const trigger of triggers) {
      const area = portfolio.areas[trigger.dataset.researchArea]; if (!area) continue;
      const badge = trigger.querySelector('.research-area-card-meta > span');
      if (badge) badge.textContent = `${countRecords(area)} related works`;
      trigger.addEventListener('click', event => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (typeof dialog.showModal !== 'function') return;
        event.preventDefault(); closeMenu(); returnTarget = trigger;
        dialog.querySelector('#research-dialog-title').textContent = area.title;
        dialog.querySelector('#research-dialog-description').textContent = area.description;
        dialog.querySelector('#research-dialog-count').textContent = `${countRecords(area)} related works`;
        content.replaceChildren();
        area.groups.forEach((group, index) => {
          const details = document.createElement('details'); details.className = 'research-record-group'; details.open = index === 0;
          const summary = document.createElement('summary');
          const title = document.createElement('span'); title.textContent = group.title;
          const count = document.createElement('span'); count.className = 'research-record-group-count';count.textContent = group.records.length;
          summary.append(title, count); details.append(summary);
          const list = document.createElement('ol'); list.className = 'research-record-list';
          for (const record of group.records) {
            const item = document.createElement('li');item.className = 'research-record';
            const year = document.createElement('span'); year.className = 'research-record-year';year.textContent = record.year;
            const citation = document.createElement('span');citation.className = 'research-record-citation';citation.append(citationFragment(record.citation));
            // Only verified DOI destinations belong on paper links. A preprint DOI
            // is visibly distinguished from a publisher DOI.
            const doiUrl = record.doi || '';
            const isPaper = ['Journal article', 'Conference/workshop paper', 'Book chapter'].includes(record.kind);
            if (isPaper && Number(record.year) >= 2019 && /^https:\/\/doi\.org\/10\.\d{4,9}\/\S+$/i.test(doiUrl)) {
              const paperLink = document.createElement('a');
              paperLink.className = 'paper-link'; paperLink.href = doiUrl;
              paperLink.target = '_blank'; paperLink.rel = 'noopener noreferrer';
              paperLink.textContent = record.doiType === 'preprint' ? '(Preprint DOI)' : '(DOI)';
              paperLink.dataset.doiType = record.doiType || 'publisher';
              paperLink.title = `${record.linkType || 'Digital Object Identifier (DOI)'}: ${record.linkTitle || record.citation}`;
              paperLink.setAttribute('aria-label', `${paperLink.title} (opens in a new tab)`);
              citation.append(document.createTextNode(' '), paperLink);
            }
            if (record.paperId) item.dataset.paperId = record.paperId;
            item.append(year,citation);list.append(item);
          }
          details.append(list);content.append(details);
        });
        dialog.showModal(); body.classList.add('dialog-open');dialog.scrollTop = 0;close.focus();
      });
    }
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      body.classList.remove('dialog-open'); content.replaceChildren();
      if (returnTarget) returnTarget.focus({preventScroll:true});
    });
  }

  // Search all original bibliography entries, including initially closed categories.
  const search = document.querySelector('#publication-search');
  if (search) {
    const normalize = text => text.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/\bUS[\s-]*([\d,]+)[\s-]*(B[12])\b/gi,(_,n,k)=>'US'+n.replaceAll(',','')+k).toLowerCase().replace(/[’‘]/g,"'").replace(/[–—]/g,'-').replace(/\s+/g,' ').trim();
    const records = [...document.querySelectorAll('.pub-item')];
    const recordText = new Map(records.map(item => [item,normalize(item.textContent)]));
    const sections = [...document.querySelectorAll('.publication-section')];
    const live = document.querySelector('#publication-count');
    let previousQuery = ''; let previousOpen = new Map();
    const update = () => {
      const query = normalize(search.value);const tokens = query.split(' ').filter(Boolean);
      if (query && !previousQuery) previousOpen = new Map(sections.map(section => [section,section.querySelector('details').open]));
      let visible = 0;
      records.forEach(item => { const match = tokens.every(token => recordText.get(item).includes(token)); item.hidden = !match;if(match) visible++; });
      sections.forEach(section => {
        const n = section.querySelectorAll('.pub-item:not([hidden])').length;
        section.hidden = n === 0;
        const details = section.querySelector('.publication-disclosure');
        if (query) details.open = n > 0;
        else if (previousQuery) details.open = previousOpen.get(section) || false;
        const count = section.querySelector('.record-count');
        count.textContent = String(n);count.setAttribute('aria-label', `${n} records`);
      });
      if (live) live.textContent = visible === 0 ? `No matching records. Try a different title, author, venue, or year.` : `${visible} of ${records.length} records`;
      previousQuery = query;
    };
    search.addEventListener('input', update);search.addEventListener('search', update);update();
  }

  // Accessible image viewer; original full-size links still work without JavaScript.
  const photos = [...document.querySelectorAll('[data-lightbox="photo-highlights"]')];
  const lightbox = document.querySelector('#media-lightbox');
  if (photos.length && lightbox && typeof lightbox.showModal === 'function') {
    const image = lightbox.querySelector('#lightbox-image');
    const caption = lightbox.querySelector('.lightbox-caption-text');
    const count = lightbox.querySelector('.lightbox-counter');
    const close = lightbox.querySelector('.lightbox-close');
    let active = 0;let returnTarget = null;
    const show = index => {
      active = (index + photos.length) % photos.length;
      const link = photos[active];image.src = link.href;
      image.alt = link.querySelector('img')?.alt || '';
      caption.textContent = link.dataset.caption || image.alt;
      count.textContent = `${active + 1} / ${photos.length}`;
    };
    photos.forEach((link,index) => link.addEventListener('click',event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();closeMenu();returnTarget=link;show(index);lightbox.showModal();body.classList.add('dialog-open');close.focus();
    }));
    close.addEventListener('click', () => lightbox.close());
    lightbox.querySelector('.lightbox-prev').addEventListener('click', () => show(active-1));
    lightbox.querySelector('.lightbox-next').addEventListener('click', () => show(active+1));
    lightbox.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();show(active + (event.key === 'ArrowLeft' ? -1 : 1));
      }
    });
    lightbox.addEventListener('click', event => {
      if (event.target !== lightbox) return;
      const r = lightbox.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) lightbox.close();
    });
    lightbox.addEventListener('close', () => {
      body.classList.remove('dialog-open'); image.removeAttribute('src');
      if (returnTarget) returnTarget.focus({preventScroll:true});
    });
  }

  // Scroll-based active links do not depend on a huge section's intersection ratio.
  const sectionLinks = [...document.querySelectorAll('[data-section-link]')];
  const sections = sectionLinks.map(link => ({link,section:document.getElementById(link.getAttribute('href').slice(1))})).filter(item=>item.section);
  let scheduled = false;
  const updateActive = () => {
    scheduled=false;if (!sections.length) return;
    const threshold = (document.querySelector('.site-header')?.getBoundingClientRect().height || 66)+64;
    let active=sections[0];
    for (const item of sections) if (item.section.getBoundingClientRect().top <= threshold) active=item;
    sections.forEach(({link})=>{
      const selected=link===active.link;link.classList.toggle('active',selected);
      if (selected) link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');
    });
  };
  const scheduleActive = () => { if(!scheduled){scheduled=true;requestAnimationFrame(updateActive);} };
  if (sections.length) {
    window.addEventListener('scroll',scheduleActive,{passive:true});window.addEventListener('resize',scheduleActive,{passive:true});
    document.addEventListener('toggle',scheduleActive,true);updateActive();
  }
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href^="#"]'); if (!link) return;
    const href = link.getAttribute('href');if (href.length < 2) return;
    const target = document.getElementById(decodeURIComponent(href.slice(1)));if(!target) return;
    event.preventDefault();closeMenu();
    target.scrollIntoView({behavior:reducedMotion.matches?'auto':'smooth',block:'start'});
    if(!target.hasAttribute('tabindex')) target.setAttribute('tabindex','-1');
    target.focus({preventScroll:true});
    // A local embedded preview may disallow URL history changes; navigation still works.
    try {history.pushState(null,'',href);} catch (_) { /* no origin in offline preview */ }
    scheduleActive();
  });
  // Native history navigation remains useful after enhanced anchor navigation.
  window.addEventListener('popstate', () => {
    const id=decodeURIComponent(location.hash.slice(1));
    if(id) document.getElementById(id)?.scrollIntoView({behavior:'auto',block:'start'});
    scheduleActive();
  });
  // Print the complete academic record, then restore the user's disclosure state.
  let printState=[]; let printHidden=[];
  window.addEventListener('beforeprint',()=>{printState=[...document.querySelectorAll('details')].map(el=>[el,el.open]);printState.forEach(([el])=>{el.open=true;});printHidden=[...document.querySelectorAll('.pub-item,.publication-section')].map(el=>[el,el.hidden]);printHidden.forEach(([el])=>{el.hidden=false;});});
  window.addEventListener('afterprint',()=>{printState.forEach(([el,open])=>{el.open=open;});printState=[];printHidden.forEach(([el,hidden])=>{el.hidden=hidden;});printHidden=[];});
})();
