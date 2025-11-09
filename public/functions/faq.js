/**
 * @file faq.js
 * Enhances keyboard accessibility for the <details>/<summary> FAQ widget.
 */
(function () {
  /** Run callback when DOM is ready */
  /** @param {() => void} fn */
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  ready(function () {
    // Select all summary elements within the new FAQ card widgets
    /** @type {NodeListOf<HTMLElement>} */
    const summaries = document.querySelectorAll('.faq-card-widget details summary'); //

    summaries.forEach(summary => { //
      // Add keydown listener for Enter and Space keys
      summary.addEventListener('keydown', (event) => { //
        const keyboardEvent = /** @type {KeyboardEvent} */ (event);
        // Check if the pressed key is Enter (key code 13 or key "Enter")
        // or Space (key code 32 or key " ")
        if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ' || keyboardEvent.keyCode === 13 || keyboardEvent.keyCode === 32) { //
          // Prevent the default action (e.g., scrolling on Space)
          keyboardEvent.preventDefault(); //

          // Find the parent <details> element
          const detailsElement = summary.closest('details'); //

          // Toggle the 'open' attribute
          if (detailsElement) { //
            if (detailsElement.hasAttribute('open')) { //
              detailsElement.removeAttribute('open'); //
            } else {
              detailsElement.setAttribute('open', ''); //
            }
          }
        }
      });
    });
  });
})();