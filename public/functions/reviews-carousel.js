(function(){
  function ready(f){ 
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',f); 
    else f(); 
  }
  
  ready(function(){
    var track = document.getElementById('reviewsTrack');
    var deck = document.getElementById('reviewsDeck');
    var dotsWrap = document.getElementById('reviewsDots');
    var prevBtn = document.querySelector('.reviews-prev');
    var nextBtn = document.querySelector('.reviews-next');
    
    if(!track || !deck){ return; }
    
    function safeReviews(){
      if(Array.isArray(window.REVIEWS) && window.REVIEWS.length) return window.REVIEWS;
      // Fallback minimal sample if data script failed to load
      return [
        {author:'Homeowner', rating:5, body:'Amazing workmanship and very professional.'},
        {author:'Client', rating:5, body:'They transformed our space beautifully.'}
      ];
    }
    
    var reviews = safeReviews().slice();
    if(!reviews.length){ return; }
    
    // Build cards
    reviews.forEach(function(r,i){
      var card = document.createElement('article');
      card.className = 'review-card';
      card.setAttribute('role','group');
      card.setAttribute('aria-label','Review ' + (i+1) + ' of ' + reviews.length);
      var safeBody = String(r.body||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
      card.innerHTML = '<blockquote>&ldquo;'+ safeBody +'&rdquo;</blockquote>' +
        '<div class="meta"><strong>'+ (r.author||'Homeowner') +'</strong><span class="dot" aria-hidden="true">•</span><span class="rating" aria-label="Rated '+ (r.rating||5) +' out of 5">('+ (r.rating||5) +'★)</span></div>' +
        '<div class="source"><span class="badge" aria-label="Source: Google">Google</span></div>';
      track.appendChild(card);
    });
    
    // Setup state
    var index = 0;
    var autoMs = 6000;
    var timer = null;
    
    function focusIndex(i){
      index = (i + reviews.length) % reviews.length;
      track.style.transform = 'translateX(-'+ (index*100) +'%)';
      updateDots();
    }
    
    function next(){ focusIndex(index+1); }
    function prev(){ focusIndex(index-1); }
    function startAuto(){ stopAuto(); timer = setInterval(next, autoMs); }
    function stopAuto(){ if(timer) clearInterval(timer); timer=null; }
    
    prevBtn.addEventListener('click', function(){ prev(); startAuto(); });
    nextBtn.addEventListener('click', function(){ next(); startAuto(); });
    deck.addEventListener('mouseenter', stopAuto);
    deck.addEventListener('mouseleave', startAuto);
    deck.addEventListener('focusin', stopAuto);
    deck.addEventListener('focusout', startAuto);
    
    // Dots
    function updateDots(){
      if(!dotsWrap) return;
      dotsWrap.innerHTML = '';
      reviews.forEach(function(_,i){
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label','Go to review '+ (i+1));
        if(i===index) b.setAttribute('aria-current','true');
        b.addEventListener('click', function(){ focusIndex(i); startAuto(); });
        dotsWrap.appendChild(b);
      });
    }
    
    // Ensure track base styles for transform slider
    track.style.display = 'flex';
    track.style.transition = 'transform .6s ease';
    track.querySelectorAll('.review-card').forEach(function(card){ card.style.flex = '0 0 100%'; });
    
    // Resize observer to ensure height adjusts smoothly
    var ro; 
    if('ResizeObserver' in window){
      ro = new ResizeObserver(function(){ deck.style.minHeight = track.offsetHeight + 'px'; });
      ro.observe(track);
    }
    
    focusIndex(0);
    startAuto();
  });
})();
