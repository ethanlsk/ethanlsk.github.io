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
