 (function(){
	 const FAVICON_URL = 'https://imagedelivery.net/VwxTcpKX2CusqbCCDB94Nw/ac674276-21f0-4ffc-3b1f-cede4d50db00/favicon64';
	 const TOUCH_ICON_URL = 'https://imagedelivery.net/VwxTcpKX2CusqbCCDB94Nw/5c4a8637-d6b7-4688-5e2f-651392e3c200/icon180';

	 function ensureLink(rel, attr) {
		 let link = document.querySelector(`link[rel="${rel}"]`);
		 if (!link) {
			 link = document.createElement('link');
			 link.rel = rel;
			 document.head.appendChild(link);
		 }
		 Object.keys(attr).forEach(key => link.setAttribute(key, attrs[key]));
	 }

	 function updateIcons() {
		 ensureLink('icon', { href: FAVICON_URL });
		 ensureLink('apple-touch-icon', { sizes: '180x180', href: TOUCH_ICON_URL });
	 }

	 updateIcons();
 })();
// Navigation & hours popup logic (robust re-write to fix truncated original)
(function(){
  function sel(q,root=document){ return root.querySelector(q); }
  function selAll(q,root=document){ return Array.from(root.querySelectorAll(q)); }
  function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn(); }
  ready(function(){
    const body = document.body;
    const burger = sel('#hamburger');
    const menu = sel('#mobileMenu');
    const closeBtn = sel('#closeMenu');
    const hoursToggle = sel('.hours-toggle');
    const hours = sel('#hoursPopup');
    const yearSpan = sel('#current-year');
    if(yearSpan) yearSpan.textContent = String(new Date().getFullYear());
    if(hoursToggle && !hoursToggle.hasAttribute('aria-expanded')) hoursToggle.setAttribute('aria-expanded','false');
    const curPath = (location.pathname.replace(/\/+$/,'')||'/');
    selAll('nav.primary-nav a, nav.menu a').forEach(a=>{
      const href = a.getAttribute('href');
      if(!href) return;
      const norm = href.replace(/\/+$/,'');
      if(norm === curPath){
        a.setAttribute('aria-current','page');
        a.classList.add('active-link');
        const parentSubmenu = a.closest('.has-submenu');
        if(parentSubmenu){
          parentSubmenu.classList.add('open');
          const btn = parentSubmenu.querySelector('button');
          if(btn) btn.setAttribute('aria-expanded','true');
          const submenu = parentSubmenu.querySelector('.mobile-submenu');
          if(submenu) submenu.setAttribute('aria-hidden','false');
        }
      }
    });
    let lastFocus = null;
    function focusableNodes(){ if(!menu) return []; return selAll('a, button, [tabindex]:not([tabindex="-1"])', menu).filter(el=>!el.hasAttribute('disabled') && el.offsetParent!==null); }
    function trapKey(e){ if(e.key!=='Tab' || !menu?.classList.contains('open')) return; const nodes=focusableNodes(); if(!nodes.length) return; const first=nodes[0]; const last=nodes[nodes.length-1]; if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); } else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); } }
    function setMenu(open){ if(!menu) return; menu.classList.toggle('open',open); menu.setAttribute('aria-hidden', String(!open)); body.style.overflow = open ? 'hidden' : ''; if(burger){ burger.setAttribute('aria-expanded', String(open)); burger.classList.toggle('active', open); } if(open){ lastFocus = document.activeElement; document.addEventListener('keydown', trapKey); const first=focusableNodes()[0]; if(first) setTimeout(()=>first.focus(),50); } else { document.removeEventListener('keydown', trapKey); if(lastFocus) setTimeout(()=> lastFocus && lastFocus.focus(),50); } }
    if(burger) burger.addEventListener('click', ()=> setMenu(true));
    if(closeBtn) closeBtn.addEventListener('click', ()=> setMenu(false));
    if(menu) selAll('a', menu).forEach(a=> a.addEventListener('click', ()=>{ if(!a.closest('.has-submenu')) setMenu(false); }));
    document.addEventListener('keydown', e=>{ if(e.key==='Escape' && menu?.classList.contains('open')) setMenu(false); });
    document.addEventListener('click', e=>{ if(!menu?.classList.contains('open')) return; const tgt = e.target; if(tgt?.closest('#mobileMenu') || tgt?.closest('#hamburger')) return; setMenu(false); });
    if(hoursToggle && hours){
      hoursToggle.addEventListener('click', e=>{ e.preventDefault(); const isOpen = hours.classList.toggle('visible'); hoursToggle.setAttribute('aria-expanded', String(isOpen)); });
      document.addEventListener('click', e=>{ if(!hours.classList.contains('visible')) return; const tgt = e.target; if(tgt?.closest('.hours-toggle') || tgt?.closest('#hoursPopup')) return; hours.classList.remove('visible'); hoursToggle.setAttribute('aria-expanded','false'); });
      document.addEventListener('keydown', e=>{ if(e.key==='Escape' && hours.classList.contains('visible')){ hours.classList.remove('visible'); hoursToggle.setAttribute('aria-expanded','false'); } });
    }
    selAll('nav.menu .has-submenu > button').forEach(btn=>{ btn.addEventListener('click', ()=>{ const li = btn.closest('.has-submenu'); if(!li) return; const submenu = li.querySelector('.mobile-submenu'); if(!submenu) return; const expanded = li.classList.toggle('open'); btn.setAttribute('aria-expanded', String(expanded)); submenu.setAttribute('aria-hidden', String(!expanded)); }); });

    // === Dynamic Footer Rating Injection ===
    try {
      let footerRatings = selAll('.footer-rating');
      // Auto-create if missing: inject into footer.
      if(!footerRatings.length){
        const footer = sel('footer.site-footer');
        if(footer){
          // Ensure footer-top + footer-brand containers exist for consistent styling.
          let top = sel('.footer-top', footer);
          if(!top){ top = document.createElement('div'); top.className='footer-top'; footer.insertBefore(top, footer.firstChild); }
          let brand = sel('.footer-brand', top);
          if(!brand){ brand = document.createElement('div'); brand.className='footer-brand'; top.insertBefore(brand, top.firstChild); }
          // Insert SVG logo if not present.
          if(!brand.querySelector('svg')){
            brand.innerHTML = '<svg width="40" height="40" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Dependable Painting logo"><title>Dependable Painting Logo</title><rect width="64" height="64" rx="8" fill="#161616"/><path d="M14 46l18-28 10 15 8-6 0 19H14z" fill="#ff3b3b"/><path d="M24 46h16v-8l-6-9-10 17z" fill="#fff" opacity="0.9"/><circle cx="22" cy="18" r="4" fill="#ff3b3b" stroke="#fff" stroke-width="2"/></svg>' + brand.innerHTML;
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
        const w =  @type {any} */(window);
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

    // === Normalize Header & Primary Nav Across Pages ===
    try {
      const existingHeader = sel('header.site-header');
      const STANDARD_HEADER_ID = 'dp-standard-header';
      // Build standard header markup (kept lightweight – uses existing CSS)
      function buildHeader(){
        const header = document.createElement('header');
        header.className='site-header';
        header.id = STANDARD_HEADER_ID;
        header.setAttribute('role','banner');
        header.innerHTML = `
          <div class="brand">
            <a href="/" aria-label="Dependable Painting">
              <svg width="40" height="40" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Dependable Painting logo"><title>Dependable Painting Logo</title><rect width="64" height="64" rx="8" fill="#161616"/><path d="M14 46l18-28 10 15 8-6 0 19H14z" fill="#ff3b3b"/><path d="M24 46h16v-8l-6-9-10 17z" fill="#fff" opacity="0.9"/><circle cx="22" cy="18" r="4" fill="#ff3b3b" stroke="#fff" stroke-width="2"/></svg>
            </a>
            <span>Dependable Painting</span>
          </div>
          <nav class="primary-nav nav-desktop" aria-label="Primary">
            <div class="nav-item-has-children">
              <a href="/services.html" aria-haspopup="true" aria-expanded="false">Services</a>
              <div class="submenu" role="menu" aria-label="Services submenu">
                <div class="submenu-group" aria-label="Core Services">
                  <a href="/exterior-painting.html" role="menuitem">Exterior Painting</a>
                  <a href="/interior-painting.html" role="menuitem">Interior Painting</a>
                  <a href="/commercial-painting.html" role="menuitem">Commercial Painting</a>
                  <a href="/cabinet-painting.html" role="menuitem">Cabinet Painting</a>
                  <a href="/sheetrock-repair.html" role="menuitem">Drywall Repair</a>
                </div>
                <hr style="border-top:1px solid #333;margin:6px 0;">
                <div class="submenu-group" aria-label="Exterior Sub-services">
                  <a href="/stucco-brick-painting.html" role="menuitem">Stucco & Brick</a>
                  <a href="/wood-siding.html" role="menuitem">Wood Siding</a>
                  <a href="/deck-fence-painting.html" role="menuitem">Decks & Fences</a>
                  <a href="/metal-painting.html" role="menuitem">Metal Surfaces</a>
                  <a href="/exterior-repair.html" role="menuitem">Exterior Repair</a>
                  <a href="/furniture-painting.html" role="menuitem">Outdoor Furniture</a>
                </div>
                <hr style="border-top:1px solid #333;margin:6px 0;">
                <a href="/services.html" role="menuitem" style="font-style:italic;">View All Services</a>
              </div>
            </div>
            <a href="/about.html">About</a>
            <a href="/reviews.html">Reviews</a>
            <a id="call" class="call-link" href="tel:+12514235855" aria-label="Call (251) 423-5855">Call</a>
            <a id="text" class="text-link" href="sms:+12514235855" aria-label="Text (251) 423-5855">Text</a>
            <a href="/privacy.html">Privacy</a>
          </nav>
          <div class="nav-icons">
            <button class="hours-toggle" type="button" title="Hours" aria-label="View business hours" aria-expanded="false" aria-controls="hoursPopup"><i class="fas fa-clock" aria-hidden="true"></i></button>
            <a href="tel:+12514235855" title="Call" aria-label="Call (251) 423-5855"><i class="fas fa-phone" aria-hidden="true"></i></a>
            <a href="sms:+12514235855" title="Text For Estimate" aria-label="Text us for estimate"><i class="fas fa-comment" aria-hidden="true"></i></a>
            <button class="hamburger" id="hamburger" type="button" aria-label="Open Menu" aria-controls="mobileMenu" aria-expanded="false"><span></span><span></span><span></span></button>
          </div>
          <div id="hoursPopup" role="dialog" aria-label="Business Hours" aria-hidden="true"><strong>Hours</strong><br>Mon–Fri: 8:00a–5:30p<br>Sat: by appt • Sun: closed</div>`;
        return header;
      }
      if(!existingHeader || !existingHeader.querySelector('.call-link')){
        // Replace only if header is missing call/text for consistency.
        const newHeader = buildHeader();
        if(existingHeader){ existingHeader.replaceWith(newHeader); }
        else document.body.insertBefore(newHeader, document.body.firstChild);
      }
      // Ensure mobile menu exists
      if(!sel('#mobileMenu')){
        const mobile = document.createElement('nav');
        mobile.className='menu';
        mobile.id='mobileMenu';
        mobile.setAttribute('aria-label','Mobile Navigation');
        mobile.setAttribute('aria-hidden','true');
        mobile.innerHTML = `
          <button class="close-btn" id="closeMenu" type="button" aria-label="Close Menu">&times;</button>
          <a href="/">Home</a>
          <div class="has-submenu"><button type="button" aria-expanded="false" aria-controls="mobileSubMenu">Services <span aria-hidden="true">▾</span></button>
            <ul class="mobile-submenu" id="mobileSubMenu" aria-hidden="true">
              <li><a href="/exterior-painting.html">Exterior Painting</a></li>
              <li><a href="/interior-painting.html">Interior Painting</a></li>
              <li><a href="/commercial-painting.html">Commercial Painting</a></li>
              <li><a href="/cabinet-painting.html">Cabinet Painting</a></li>
              <li><a href="/sheetrock-repair.html">Drywall Repair</a></li>
              <li><a href="/stucco-brick-painting.html">Stucco & Brick</a></li>
              <li><a href="/wood-siding.html">Wood Siding</a></li>
              <li><a href="/deck-fence-painting.html">Decks & Fences</a></li>
              <li><a href="/metal-painting.html">Metal Surfaces</a></li>
              <li><a href="/exterior-repair.html">Exterior Repair</a></li>
              <li><a href="/furniture-painting.html">Outdoor Furniture</a></li>
              <li><a href="/services.html" style="font-style:italic;">View All Services</a></li>
            </ul>
          </div>
          <a href="/about.html">About</a>
          <a href="/reviews.html">Reviews</a>
          <a id="call-m" href="tel:+12514235855" class="call-link">Call</a>
          <a id="text-m" href="sms:+12514235855" class="text-link">Text</a>
          <a href="/privacy.html">Privacy</a>`;
        document.body.insertBefore(mobile, sel('main')||null);
      }
    } catch(e){ console.warn('Header normalization failed', e); }

    // === Minimal Structured Data Injection (if absent) ===
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
})();

// === CTA Injection & Cleanup (Contact/Booking Removal + Universal CTAs) ===
(function(){
  function onReady(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn(); }
  onReady(function(){
    try {
      // 1. Remove legacy Contact / Booking links (nav + footer) by href pattern
      document.querySelectorAll('a[href*="contact"], a[href*="booking"], a[href*="book"], a[href*="contact-us"]').forEach(a=>{
        const href=(a.getAttribute('href')||'').toLowerCase();
        if(/[\/]contact|booking|contact-us|book(ing)?/i.test(href)){
          // Skip if it's a tel: or sms:
          if(href.startsWith('tel:')||href.startsWith('sms:')) return;
          a.remove();
        }
      });

      // Helper to build inline CTA block
      function buildInlineCTA(){
        const wrap=document.createElement('section');
        wrap.className='cta-inline';
        wrap.setAttribute('aria-label','Contact Dependable Painting');
        wrap.innerHTML='<a href="tel:+12514235855" class="cta-btn primary" data-cta="inline-call" aria-label="Call Dependable Painting">📞 Call Now</a>\n<a href="sms:+12514235855" class="cta-btn secondary" data-cta="inline-text" aria-label="Text Dependable Painting">💬 Text Us</a>';
        return wrap;
      }

      // 2. After hero section
      const hero = document.querySelector('.hero-section');
      if(hero && !document.querySelector('.hero-section + .cta-inline')){
        hero.insertAdjacentElement('afterend', buildInlineCTA());
      }

      // 3. Mid-page: after first major services/about section (#services-overview or first .section-dark after hero)
      let midRef = document.getElementById('services-overview') || document.querySelector('.hero-section ~ .section-dark');
      if(midRef && !midRef.nextElementSibling?.classList.contains('cta-inline')){
        midRef.insertAdjacentElement('afterend', buildInlineCTA());
      }

      // 4. Above footer (only once)
      const footer = document.querySelector('footer.site-footer');
      if(footer && !footer.previousElementSibling?.classList.contains('cta-inline')){
        footer.parentElement?.insertBefore(buildInlineCTA(), footer);
      }

      // 5. Sticky mobile bar (append once)
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

      // 6. Analytics listeners (gtag fallback to dataLayer push if loaded through GTM)
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
