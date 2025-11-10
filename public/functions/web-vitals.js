(function() {
 const webVitals = {
   lcp: null,
   fid: null,
   cls: null,
   inp: null,
   fcp: null,
   ttfb: null
 };


 function sendMetric(name, value, rating) {
   const metric = {
     name: name,
     value: Math.round(value),
     rating: rating,
     url: window.location.href,
     timestamp: Date.now()
   };

   if (navigator.sendBeacon) {
     const payload = JSON.stringify({
       type: 'web_vital',
       metric: metric.name,
       value: metric.value,
       rating: metric.rating,
       page_url: window.location.href,
       session_id: localStorage.getItem('dp_sid') || 'unknown'
     });
     navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }));
   }

   if (window.location.hostname === 'localhost' || window.location.hostname.includes('dev')) {
     console.log('Web Vital:', metric);
   }
 }

 function measureLCP() {
   if (!('PerformanceObserver' in window)) return;

   const observer = new PerformanceObserver((list) => {
     const entries = list.getEntries();
     const lastEntry = entries[entries.length - 1];

     if (lastEntry) {
       webVitals.lcp = lastEntry.startTime;
       const rating = lastEntry.startTime <= 2500 ? 'good' :
                     lastEntry.startTime <= 4000 ? 'needs-improvement' :
                     'poor';
       sendMetric('LCP', lastEntry.startTime, rating);
     }
   });

   observer.observe({ type: 'largest-contentful-paint', buffered: true });
 }

 function measureFID() {
   if (!('PerformanceObserver' in window)) return;

   const observer = new PerformanceObserver((list) => {
     const entries = list.getEntries();
     entries.forEach((entry) => {
       if (entry.processingStart && entry.startTime) {
         const fid = entry.processingStart - entry.startTime;
         webVitals.fid = fid;
         const rating = fid <= 100 ? 'good' :
                       fid <= 300 ? 'needs-improvement' :
                       'poor';
         sendMetric('FID', fid, rating);
       }
     });
   });

   observer.observe({ type: 'first-input', buffered: true });
 }

 function measureINP() {
   if (!('PerformanceObserver' in window)) return;

   let maxINP = 0;
   const observer = new PerformanceObserver((list) => {
     const entries = list.getEntries();
     entries.forEach((entry) => {
       if (entry.processingEnd && entry.startTime) {
         const inp = entry.processingEnd - entry.startTime;
         if (inp > maxINP) {
           maxINP = inp;
           webVitals.inp = inp;
           const rating = inp <= 200 ? 'good' :
                         inp <= 500 ? 'needs-improvement' :
                         'poor';
           sendMetric('INP', inp, rating);
         }
       }
     });
   });

   observer.observe({ type: 'event', buffered: true });
 }

 function measureCLS() {
   if (!('PerformanceObserver' in window)) return;

   let clsScore = 0;
   const observer = new PerformanceObserver((list) => {
     const entries = list.getEntries();
     entries.forEach((entry) => {
       if (!entry.hadRecentInput && typeof entry.value === 'number') {
         clsScore += entry.value;
       }
     });

     if (clsScore > 0) {
       webVitals.cls = clsScore;
       const rating = clsScore <= 0.1 ? 'good' :
                     clsScore <= 0.25 ? 'needs-improvement' :
                     'poor';
       sendMetric('CLS', clsScore, rating);
     }
   });

   observer.observe({ type: 'layout-shift', buffered: true });
 }

 function measureFCP() {
   if (!('PerformanceObserver' in window)) return;

   const observer = new PerformanceObserver((list) => {
     const entries = list.getEntries();
     entries.forEach((entry) => {
       if (entry.name === 'first-contentful-paint') {
         webVitals.fcp = entry.startTime;
         const rating = entry.startTime <= 1800 ? 'good' :
                       entry.startTime <= 3000 ? 'needs-improvement' :
                       'poor';
         sendMetric('FCP', entry.startTime, rating);
       }
     });
   });

   observer.observe({ type: 'paint', buffered: true });
 }

 function measureTTFB() {
   if (!('performance' in window) || !performance.timing) return;
   const navTiming = performance.timing;
   if (navTiming.responseStart && navTiming.fetchStart) {
     const ttfb = navTiming.responseStart - navTiming.fetchStart;
     webVitals.ttfb = ttfb;
     const rating = ttfb <= 800 ? 'good' :
                   ttfb <= 1800 ? 'needs-improvement' :
                   'poor';
     sendMetric('TTFB', ttfb, rating);
   }
 }
 function initWebVitals() {
   measureLCP();
   measureFID();
   measureINP();
   measureCLS();
   measureFCP();
   measureTTFB();
   window.addEventListener('beforeunload', function() {
     if (webVitals.cls !== null) {
       const rating = webVitals.cls <= 0.1 ? 'good' :
                     webVitals.cls <= 0.25 ? 'needs-improvement' :
                     'poor';
       sendMetric('CLS_FINAL', webVitals.cls, rating);
     }
   });
 }
 if (document.readyState === 'loading') {
   document.addEventListener('DOMContentLoaded', initWebVitals);
 } else {
   initWebVitals();
 }
 window.webVitals = webVitals;
})();
