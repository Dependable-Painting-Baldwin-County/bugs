// === CONSOLIDATED GLOBAL.JS ===
// Icons, Navigation, Hours, Mobile Menu, Footer, Header, CTAs, Hero Fallback, Carousel, Lightbox, FAQ

(function(){
  const FAVICON_URL = 'https://imagedelivery.net/VwxTcpKX2CusqbCCDB94Nw/415808af-bbe7-4016-b250-5614339a4000/favicon64';
  const TOUCH_ICON_URL = 'https://imagedelivery.net/VwxTcpKX2CusqbCCDB94Nw/415808af-bbe7-4016-b250-5614339a4000/icon180';

  function ensureLink(rel, attrs) {
    let link = document.querySelector(`link[rel="${rel}"]`);
    if (!link) {
      link = document.createElement('link');
      link.rel = rel;
      document.head.appendChild(link);
    }
    Object.keys(attrs).forEach(key => link.setAttribute(key, attrs[key]));
  }

  function updateIcons() {
    ensureLink('icon', { href: FAVICON_URL });
    ensureLink('apple-touch-icon', { sizes: '180x180', href: TOUCH_ICON_URL });
  }

  updateIcons();
})();

// Navigation & hours popup logic
(function(){
  function sel(q,root=document){ return root.querySelector(q); }
  function selAll(q,root=document){ return Array.from(root.querySelectorAll(q)); }
  function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn(); }
  ready(()=>{
    const hoursToggle = sel('.hours-toggle');
    const hours = sel('#hoursPopup');
    const yearSpan = sel('#current-year');
    
    if(yearSpan) yearSpan.textContent = String(new Date().getFullYear());
    if(hoursToggle && !hoursToggle.hasAttribute('aria-expanded')) hoursToggle.setAttribute('aria-expanded','false');
    

    if(hoursToggle && hours){
      hoursToggle.addEventListener('click', e=>{ e.preventDefault(); const isOpen = hours.classList.toggle('visible'); hoursToggle.setAttribute('aria-expanded', String(isOpen)); });
      document.addEventListener('click', e=>{ if(!hours.classList.contains('visible')) return; const tgt = e.target; if(tgt?.closest('.hours-toggle') || tgt?.closest('#hoursPopup')) return; hours.classList.remove('visible'); hoursToggle.setAttribute('aria-expanded','false'); });
      document.addEventListener('keydown', e=>{ if(e.key==='Escape' && hours.classList.contains('visible')){ hours.classList.remove('visible'); hoursToggle.setAttribute('aria-expanded','false'); } });
    }
    
    // OLD SUBMENU CODE - DISABLED
    // selAll('nav.menu .has-submenu > button').forEach(btn=>{ btn.addEventListener('click', ()=>{ const li = btn.closest('.has-submenu'); if(!li) return; const submenu = li.querySelector('.mobile-submenu'); if(!submenu) return; const expanded = li.classList.toggle('open'); btn.setAttribute('aria-expanded', String(expanded)); submenu.setAttribute('aria-hidden', String(!expanded)); }); });

    // === Hero Image Fallback ===
    const heroImg = sel('#heroImg');
    if(heroImg){
      heroImg.addEventListener('error', () => {
        heroImg.src = 'https://imagedelivery.net/VwxTcpKX2CusqbCCDB94Nw/6172765c-f379-42bd-0118-2423a368f600/gallery960x720';
      }, { once: true });
    }

    const galleryImages = selAll('#gallery .gallery-fig img');
    if (galleryImages.length) {
      let lightbox, lbImg, lbCaption;
      let zoom = 1, originX = 0, originY = 0;
      let isPanning = false, startX = 0, startY = 0;
      let lastFocusedElement = null;

      function buildLightbox() {
        lightbox = document.createElement('div');
        lightbox.className = 'dp-lightbox';
        lightbox.setAttribute('role', 'dialog');
        lightbox.setAttribute('aria-modal', 'true');
        lightbox.tabIndex = -1;
        lightbox.innerHTML = `
          <button class="lb-close" type="button" aria-label="Close lightbox">×</button>
          <figure>
            <img alt="">
            <figcaption></figcaption>
          </figure>
          <div class="lb-ctrls">
            <button type="button" class="zo-in" aria-label="Zoom in">+</button>
            <button type="button" class="zo-out" aria-label="Zoom out">−</button>
            <button type="button" class="zo-reset" aria-label="Reset zoom">Reset</button>
          </div>
        `;
        document.body.appendChild(lightbox);
        lbImg = lightbox.querySelector('img');
        lbCaption = lightbox.querySelector('figcaption');
        
        lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
        lightbox.querySelector('.lb-close').addEventListener('click', closeLightbox);
        lightbox.querySelector('.zo-in').addEventListener('click', () => setZoom(zoom + 0.25));
        lightbox.querySelector('.zo-out').addEventListener('click', () => setZoom(Math.max(1, zoom - 0.25)));
        lightbox.querySelector('.zo-reset').addEventListener('click', () => setZoom(1));
        lbImg.addEventListener('mousedown', startPan);
        window.addEventListener('mouseup', endPan);
        window.addEventListener('mousemove', pan);
        lightbox.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
      }

      function setZoom(newZoom) {
        zoom = Math.max(1, newZoom);
        originX = originY = 0;
        applyTransform();
      }

      function applyTransform() {
        lbImg.style.transform = `translate(${originX}px, ${originY}px) scale(${zoom})`;
        lbImg.style.cursor = zoom > 1 ? 'grab' : 'default';
      }

      function startPan(e) {
        if (zoom === 1) return;
        isPanning = true;
        startX = e.clientX - originX;
        startY = e.clientY - originY;
        lbImg.style.cursor = 'grabbing';
        e.preventDefault();
      }

      function pan(e) {
        if (!isPanning) return;
        originX = e.clientX - startX;
        originY = e.clientY - startY;
        applyTransform();
      }

      function endPan() {
        if (!isPanning) return;
        isPanning = false;
        lbImg.style.cursor = zoom > 1 ? 'grab' : 'default';
      }

      function openLightbox(src, caption, fullSrc) {
        if (!lightbox) buildLightbox();
        lastFocusedElement = document.activeElement;
        const imageUrl = fullSrc || src;
        lbImg.src = imageUrl;
        lbImg.alt = caption || 'Gallery image';
        lbCaption.textContent = caption || '';
        setZoom(1);
        lightbox.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        lightbox.focus();
      }

      function closeLightbox() {
        lightbox.style.display = 'none';
        document.body.style.overflow = '';
        if (lastFocusedElement?.focus) lastFocusedElement.focus();
      }

      galleryImages.forEach(img => {
        img.tabIndex = 0;
        img.style.cursor = 'zoom-in';
        const figure = img.closest('.gallery-fig');
        const caption = figure?.querySelector('figcaption')?.textContent || '';
        const fullSrc = img.getAttribute('data-full') || img.src;
        img.addEventListener('click', () => openLightbox(img.src, caption, fullSrc));
        img.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openLightbox(img.src, caption, fullSrc);
          }
        });
      });
    }

    // === FAQ Accordion: one-open-at-a-time ===
    function initFAQAccordion() {
      const questions = selAll('.faq-q[aria-controls]');
      if (!questions.length) return;

      questions.forEach(btn => {
        btn.addEventListener('click', () => toggleFAQ(btn));
        btn.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleFAQ(btn);
          }
        });
      });

      function toggleFAQ(activeBtn) {
        const targetId = activeBtn.getAttribute('aria-controls');
        const activeAnswer = document.getElementById(targetId);
        const isOpen = activeBtn.getAttribute('aria-expanded') === 'true';

        // close all
        questions.forEach(btn => {
          const ans = document.getElementById(btn.getAttribute('aria-controls'));
          if (ans) ans.hidden = true;
          btn.setAttribute('aria-expanded', 'false');
        });

        // open the clicked one if it was previously closed
        if (!isOpen && activeAnswer) {
          activeAnswer.hidden = false;
          activeBtn.setAttribute('aria-expanded', 'true');
        }
      }
    }

    initFAQAccordion();

    // === Dynamic Footer Rating Injection ===
    try {
      let footerRatings = selAll('.footer-rating');
      if(!footerRatings.length){
        const footer = sel('footer.site-footer');
        if(footer){
          let top = sel('.footer-top', footer);
          if(!top){ top = document.createElement('div'); top.className='footer-top'; footer.insertBefore(top, footer.firstChild); }
          let brand = sel('.footer-brand', top);
          if(!brand){ brand = document.createElement('div'); brand.className='footer-brand'; top.insertBefore(brand, top.firstChild); }
          if(!brand.querySelector('img')){
            const logoImg = document.createElement('img');
            logoImg.src = 'https://imagedelivery.net/VwxTcpKX2CusqbCCDB94Nw/415808af-bbe7-4016-b250-5614339a4000/favicon64';
            logoImg.alt = 'Dependable Painting logo';
            logoImg.width = 40; logoImg.height = 40;
            brand.insertBefore(logoImg, brand.firstChild);
          }
          const span = document.createElement('span');
          span.className='footer-rating';
          span.setAttribute('data-rating','4.6');
          span.setAttribute('data-count','31');
          brand.appendChild(span);
          footerRatings = [span];
        }
      }
      if(footerRatings.length){
        const w = window;
        let avg = 0; let count = 0;
        if(Array.isArray(w.REVIEWS) && w.REVIEWS.length){
          const nums = w.REVIEWS.map(r => typeof r.rating === 'number' ? r.rating : 0).filter(n => n>0);
          if(nums.length){ count = nums.length; avg = nums.reduce((a,b)=>a+b,0)/nums.length; }
        }
        footerRatings.forEach(fr => {
          const dataAvg = parseFloat(fr.getAttribute('data-rating')||'');
          const dataCount = parseInt(fr.getAttribute('data-count')||'');
          const finalAvg = avg || dataAvg || 0;
          const finalCount = count || dataCount || 0;
          fr.innerHTML = `${finalAvg.toFixed(1)} ★ <small>(${finalCount} reviews)</small>`;
          fr.setAttribute('aria-label', `Average rating ${finalAvg.toFixed(1)} out of 5 stars based on ${finalCount} reviews`);
        });
      }
    } catch(e){ console.warn('Footer rating injection failed', e); }

    // === Minimal Structured Data Injection ===
    try {
      const hasOrg = !!Array.from(document.querySelectorAll('script[type="application/ld+json"]')).some(s => /#organization/i.test(s.textContent||''));
      if(!hasOrg){
        const sd = document.createElement('script');
        sd.type='application/ld+json';
        sd.textContent = JSON.stringify({
          '@context':'https://schema.org',
          '@graph':[
            {
              '@type':['WebPage'],
              '@id':location.href + '#webpage',
              'url':location.href.split('#')[0],
              'name':document.title||'Dependable Painting'
            },
            {
              '@type':'LocalBusiness',
              '@id':'https://dependablepainting.work/#organization',
              'name':'Dependable Painting',
              'url':'https://dependablepainting.work/',
              'telephone':'+1-251-423-5855',
              'address':{ '@type':'PostalAddress','addressLocality':'Bay Minette','addressRegion':'AL','postalCode':'36507','addressCountry':'US' },
              'aggregateRating':{ '@type':'AggregateRating', 'ratingValue':'4.6','reviewCount':'31' }
            }
          ]
        });
        document.head.appendChild(sd);
      }
    } catch(e){ console.warn('Structured data injection failed', e); }
  });

  ready(()=>{
    try {
      document.querySelectorAll('a[href*="contact"], a[href*="booking"], a[href*="book"], a[href*="contact-us"]').forEach(a=>{
        const href=(a.getAttribute('href')||'').toLowerCase();
        if(/[\/]contact|booking|contact-us|book(ing)?/i.test(href)){
          if(href.startsWith('tel:')||href.startsWith('sms:')) return;
          a.remove();
        }
      });

      function buildInlineCTA(){
        const wrap=document.createElement('section');
        wrap.className='cta-inline';
        wrap.setAttribute('aria-label','Contact Dependable Painting');
        wrap.innerHTML='<a href="tel:+12514235855" class="cta-btn primary" data-cta="inline-call" aria-label="Call Dependable Painting">📞 Call Now</a>\n<a href="sms:+12514235855" class="cta-btn secondary" data-cta="inline-text" aria-label="Text Dependable Painting">💬 Text Us</a>';
        return wrap;
      }

      const hero = document.querySelector('.hero-section');
      if(hero && !document.querySelector('.hero-section + .cta-inline')){
        hero.insertAdjacentElement('afterend', buildInlineCTA());
      }

      let midRef = document.getElementById('services-overview') || document.querySelector('.hero-section ~ .section-dark');
      if(midRef && !midRef.nextElementSibling?.classList.contains('cta-inline')){
        midRef.insertAdjacentElement('afterend', buildInlineCTA());
      }

      const footer = document.querySelector('footer.site-footer');
      if(footer && !footer.previousElementSibling?.classList.contains('cta-inline')){
        footer.parentElement?.insertBefore(buildInlineCTA(), footer);
      }

      if(!document.querySelector('.sticky-cta-bar')){
        const bar=document.createElement('div');
        bar.className='sticky-cta-bar';
        bar.setAttribute('role','navigation');
        bar.setAttribute('aria-label','Mobile quick contact');
        bar.innerHTML='<a href="tel:+12514235855" class="cta-call" data-cta="sticky-call" aria-label="Call Dependable Painting">📞 Call Now</a><a href="sms:+12514235855" class="cta-text" data-cta="sticky-text" aria-label="Text Dependable Painting">💬 Text Us</a>';
        document.body.appendChild(bar);
        const params=new URLSearchParams(location.search);
        if(params.get('cta')==='open') bar.classList.add('expanded');
      }

      const anchors = document.querySelectorAll('.sticky-cta-bar a, .cta-inline a');
      anchors.forEach(a=>{
        a.addEventListener('click',()=>{
          const method = a.getAttribute('href')?.startsWith('tel') ? 'call' : 'text';
          try {
            if(typeof gtag==='function') {
              gtag('event','cta_click',{event_category:'engagement',method,location:window.location.pathname,placement:a.dataset.cta});
            } else if (window.dataLayer) {
              window.dataLayer.push({
                event:'cta_click',
                event_category:'engagement',
                method,
                location:window.location.pathname,
                placement:a.dataset.cta
              });
            }
          } catch(e){ console.warn('CTA analytics error', e); }
        });
      });
    } catch (e) {
      console.warn('CTA injection failure', e);
    }
  });
})();