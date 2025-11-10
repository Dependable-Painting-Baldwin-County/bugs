(function() {
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  (() => {
    const toggle = document.querySelector('.hours-toggle');
    const popup = document.getElementById('hoursPopup');
    if (!toggle || !popup) return;
    const openPopup = () => {
      popup.classList.add('open');
      popup.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
    };
    const closePopup = () => {
      popup.classList.remove('open');
      popup.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
    };
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      popup.classList.contains('open') ? closePopup() : openPopup();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && popup.classList.contains('open')) closePopup();
    });

    document.addEventListener('click', (e) => {
      if (!popup.contains(e.target) && !toggle.contains(e.target)) closePopup();
    }, true);
  })();

  (() => {
    const menu = document.getElementById('mobileMenu');
    const openBtn = document.getElementById('hamburger');
    const closeBtn = document.getElementById('closeMenu');
    if (!menu || !openBtn || !closeBtn) return;

    const openMenu = () => {
      menu.setAttribute('aria-expanded', 'true');
      openBtn.setAttribute('aria-expanded', 'true');
    };

    const closeMenu = () => {
      menu.setAttribute('aria-hidden', 'true');
      openBtn.setAttribute('aria-expanded', 'false');
    };

    openBtn.addEventListener('click', openMenu);
    closeBtn.addEventListener('click', closeMenu);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.getAttribute('aria-hidden') === 'false') {
        closeMenu();
      }
    });

    menu.querySelectorAll('.has-submenu > button').forEach(btn => {
      const submenu = btn.nextElementSibling;
      if (!submenu) return;
      btn.addEventListener('click', () => {
        const isExpanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!isExpanded));
        submenu.setAttribute('aria-hidden', String(isExpanded));
      });
    });
  })();

  (() => {
    const heroImg = document.getElementById('heroImg');
    if (!heroImg) return;
    heroImg.addEventListener('error', () => {
      heroImg.src = 'https://imagedelivery.net/VwxTcpKX2CusqbCCDB94Nw/6172765c-f379-42bd-0118-2423a368f600/gallery960x720';
    }, { once: true });
  })();
  (() => {
    document.querySelectorAll('.carousel').forEach(carousel => {
      const track = carousel.querySelector('.track');
      const slides = track ? Array.from(track.children) : [];
      const prevBtn = carousel.querySelector('.prev');
      const nextBtn = carousel.querySelector('.next');
      if (!track || !prevBtn || !nextBtn || !slides.length) return;
      track.style.display = 'flex';
      track.style.transition = 'transform .6s ease';
      slides.forEach(s => { s.style.flex = '0 0 100%'; });
      let index = 0;
      const autoMs = 5000;
      let timer = null;
      function go(i) {
        index = (i + slides.length) % slides.length;
        track.style.transform = 'translateX(-' + (index * 100) + '%)';
      }
      function next() { go(index + 1); }
      function prev() { go(index - 1); }
      function start() { stop(); timer = setInterval(next, autoMs); }
      function stop() { if (timer) clearInterval(timer); timer = null; }
      nextBtn.addEventListener('click', () => { next(); start(); });
      prevBtn.addEventListener('click', () => { prev(); start(); });
      ['mouseenter', 'focusin'].forEach(ev => carousel.addEventListener(ev, stop));
      ['mouseleave', 'focusout'].forEach(ev => carousel.addEventListener(ev, start));
      prevBtn.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          prevBtn.click();
        }
      });
      nextBtn.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          nextBtn.click();
        }
      });
      go(0);
      start();
    });
    const galleryImages = document.querySelectorAll('#gallery .gallery-fig img');
    if (!galleryImages.length) return;
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
      lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
      });
      lightbox.querySelector('.lb-close').addEventListener('click', closeLightbox);
      lightbox.querySelector('.zo-in').addEventListener('click', () => setZoom(zoom + 0.25));
      lightbox.querySelector('.zo-out').addEventListener('click', () => setZoom(Math.max(1, zoom - 0.25)));
      lightbox.querySelector('.zo-reset').addEventListener('click', () => setZoom(1));

      lbImg.addEventListener('mousedown', startPan);
      window.addEventListener('mouseup', endPan);
      window.addEventListener('mousemove', pan);

      lightbox.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
      });
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
  })();
  (() => {
    const faqButtons = document.querySelectorAll('.faq-q');
    faqButtons.forEach(button => {
      button.addEventListener('click', () => {
        const isExpanded = button.getAttribute('aria-expanded') === 'true';
        const answerId = button.getAttribute('aria-controls');
        const answer = document.getElementById(answerId);
        if (!answer) return;
        button.setAttribute('aria-expanded', String(!isExpanded));
        answer.hidden = isExpanded;
      });
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          button.click();
        }
      });
    });
  })();
})();