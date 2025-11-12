export function initHeader() {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('primary-nav');
  if (!toggle || !nav) return;

  const openMenu = () => {
    nav.setAttribute('data-open', 'true');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.classList.add('active');
    setTimeout(() => document.addEventListener('click', onDocClick), 0);
  };

  const closeMenu = () => {
    nav.setAttribute('data-open', 'false');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.classList.remove('active');
    document.removeEventListener('click', onDocClick);
  };

  const onDocClick = (e) => {
    if (nav.contains(e.target) || toggle.contains(e.target)) return;
    closeMenu();
  };

  toggle.addEventListener('click', () => {
    const isOpen = nav.getAttribute('data-open') === 'true';
    isOpen ? closeMenu() : openMenu();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}

document.addEventListener('DOMContentLoaded', initHeader);