(function(){
  const raw = [
    { author: 'Mary Barnhill', rating: 5.0, body: 'Dependable Painting did a great job of transforming my house!! Outstanding paint job!!' },
    { author: 'Adam Lineberry', rating: 5.0, body: 'Contacted several painters for quotes and Dependable Painting LLC gave me the most reasonable one... They showed great attention to detail and their lines were razor sharp all throughout the house. They even went above and beyond and painted some spots my children left on the roof. On time, efficient, professional—highly recommend Alex and Megan!' },
    { author: 'Jeannie Bernardo', rating: 5.0, body: 'Very meticulous. My house has big dormers—no problem for them. It looks great and I am very pleased. Will use them again.' },
    { author: 'Gary Dunn', rating: 5.0, body: 'Professional and a pleasure to work with. Excellent work, on time each day and completed the job as promised.' },
    { author: 'Joseph Guarino', rating: 5.0, body: "Great working with Alex and his crew. Accommodating with scheduling and did a great job. We highly recommend and will use again." },
    { author: 'Sam Clunan', rating: 5.0, body: 'Very responsive. VERY trustworthy!' },
    { author: 'Bonnie Therrell', rating: 5.0, body: 'Very well pleased with the job they did.' },
    { author: 'Jeri Harrison', rating: 5.0, body: 'Excellent customer service, very professional staff, high quality of work. And DEPENDABLE like the name.' },
    { author: 'Kari Cramblitt', rating: 5.0, body: 'Wonderful experience! Very respectful and hardworking people. Will definitely be using them again.' },
    { author: 'Susan Turner', rating: 4.5, body: "They arrived when they said they would and the finished product was perfect. Highly recommend for any painting needs." },
    { author: 'Jena Cramblitt', rating: 4.5, body: 'Fantastic people! Went above and beyond—interior and exterior both look great. Will hire again.' },
    { author: 'Lisa Brunies', rating: 4.5, body: 'The name says it all—very dependable. Helped fix a mess left by another painter. Professional, polite, and skilled.' },
    { author: 'Loren Barraza', rating: 4.5, body: 'Absolutely fantastic and great communicators. Exterior looks amazing—fair pricing and quick turnaround.' },
    { author: 'Mary Godwin', rating: 4.4, body: 'Interior plus doors and porch—excellent work ethic, professional, punctual and personable.' },
    { author: 'kristmas1000', authorDisplay: 'Kristmas1000', rating: 4.0, body: 'Highly recommend. Fast, efficient, and walls look great.' },
    { author: 'Valery Smith', rating: 4.0, body: 'Incredible job. Extensive patch work + popcorn removal done perfectly. Prep, mud work, and finish all excellent.' },
    { author: 'Jane Penton', rating: 4.0, body: 'Used them twice—interior and exterior. Dependable, respectful, very pleased. Will use again.' },
    { author: 'Gina Lanaux', rating: 4.0, body: 'Easy to work with, highly professional, communicate well, fast and reasonable.' },
    { author: 'Patty Rowland', rating: 4.0, body: 'Whole interior repaint. Fast yet very good. Professional, respectful, neat—thrilled with the results.' }
  ];
  // Expose globally for reviews.js consumption. Merge if existing.
  const w = /** @type {any} */(window);
  if(Array.isArray(w.REVIEWS) && w.REVIEWS.length){
    // Keep existing, optionally push new unique authors not present.
  /** @param {{author:string, body:string}} r */
  function authorOf(r){ return r.author; }
  const existingAuthors = new Set(w.REVIEWS.map(authorOf));
    raw.forEach(r=>{ if(!existingAuthors.has(r.author)) w.REVIEWS.push(r); });
  } else {
    w.REVIEWS = raw;
  }
})();
