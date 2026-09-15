// Open the targeted <details> group when arriving via an anchor link,
// and close the nav dropdown on outside click or Escape.

function openHashTarget() {
  var hash = window.location.hash;
  if (!hash || hash.length < 2) return;
  var el;
  try { el = document.querySelector(hash); } catch (e) { return; }
  if (!el) return;
  if (el.tagName === 'DETAILS') el.open = true;
  var parent = el.closest ? el.closest('details') : null;
  while (parent) {
    parent.open = true;
    parent = parent.parentElement && parent.parentElement.closest
      ? parent.parentElement.closest('details')
      : null;
  }
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

window.addEventListener('hashchange', openHashTarget);
document.addEventListener('DOMContentLoaded', openHashTarget);

document.addEventListener('click', function (e) {
  document.querySelectorAll('details.navdrop[open]').forEach(function (d) {
    if (!d.contains(e.target)) d.open = false;
  });
});

document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  document.querySelectorAll('details.navdrop[open]').forEach(function (d) {
    d.open = false;
  });
});

// Clicking a dropdown item closes the menu.
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.navmenu a').forEach(function (a) {
    a.addEventListener('click', function () {
      var d = a.closest('details.navdrop');
      if (d) d.open = false;
    });
  });
});

// Fade project figures up as they scroll into view.
//
// Deliberately a rect check on scroll rather than IntersectionObserver: the
// visible-state logic runs synchronously, so it can be tested, and check() is
// called once directly at load. There is no path where JS runs and a figure
// stays hidden. (site.js failing to load is covered by the failsafe in the
// page <head>, which strips html.js and un-hides everything.)
(function () {
  var els = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  window.__revealArmed = true;
  if (!els.length) return;

  function showAll() {
    els.forEach(function (el) { el.classList.add('in'); });
    els.length = 0;
  }

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    showAll();
    return;
  }

  var ticking = false;

  function check() {
    ticking = false;
    var h = window.innerHeight || document.documentElement.clientHeight;
    for (var i = els.length - 1; i >= 0; i--) {
      var r = els[i].getBoundingClientRect();
      // height 0 means it is inside a collapsed <details>; leave it queued.
      // Note there is no lower bound: anything at or ABOVE the trigger line
      // counts, so a figure skipped by a fast scroll or an anchor jump still
      // reveals instead of being stranded hidden forever.
      if (r.height > 0 && r.top < h * 0.92) {
        els[i].classList.add('in');
        els.splice(i, 1);
      }
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    // rAF keeps the common case on a frame boundary; the timer is a backstop
    // for when frames are starved (background tab, reduced-power modes).
    // check() is idempotent, so running twice is harmless.
    if (window.requestAnimationFrame) requestAnimationFrame(check);
    setTimeout(check, 120);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  document.addEventListener('toggle', onScroll, true);   // a group was expanded
  check();
})();
