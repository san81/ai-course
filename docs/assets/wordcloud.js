/**
 * Tiny word cloud for the course decks.  No dependencies, no backend, no accounts.
 *
 * WHY THIS EXISTS
 * We wanted a Mentimeter-style word cloud without Mentimeter's voter limits. The
 * cheap version: the class types into Zoom chat, you copy the chat, paste it into
 * the slide, and the cloud draws itself. Nothing is sent anywhere.
 *
 * USAGE IN A DECK
 *   <section data-stage="..." >
 *     <div class="wordcloud" data-seed="curiosity giraffe turing farmer weights">
 *       <svg viewBox="0 0 900 380"></svg>
 *       <textarea placeholder="Paste the Zoom chat here…"></textarea>
 *       <button>Build the cloud</button>
 *     </div>
 *   </section>
 *
 * and once, near the end of the page:
 *   <script src="../../assets/wordcloud.js"></script>
 *
 * The textarea and button carry class "instructor-only" styling in course.css, so
 * they are hidden in presentation; the drawn cloud is what the room sees.
 */
(function (global) {
  'use strict';

  var STOP = ('a an the and or but if then than so as of to in on at for with from by about ' +
    'is are was were be been being am do does did have has had can could will would should ' +
    'may might must i me my mine you your yours he him his she her hers it its we us our ours ' +
    'they them their theirs this that these those there here what which who whom when where ' +
    'why how all any both each few more most other some such no nor not only own same too very ' +
    'just dont cant wont im ive id ill youre thats really quite also get got go going goes went ' +
    'like want need think know see look make made say said one two three thing things lot lots ' +
    'ok okay yes yeah yep nope thanks thank hi hello hey everyone all sir maam ma')
    .split(/\s+/);

  var STOPSET = Object.create(null);
  STOP.forEach(function (w) { STOPSET[w] = true; });

  var COLOURS = ['#7ee0a3', '#4da3ff', '#ffb454', '#e8edf5', '#9aa4b8'];

  /* Zoom chat arrives with timestamps and "From X to Everyone:" prefixes.
     Strip those so speaker names do not dominate the cloud. */
  function stripChatFurniture(text) {
    return text
      .replace(/^\s*\d{1,2}:\d{2}(:\d{2})?\s*/gm, '')          // 12:34:56
      .replace(/^\s*From\s+.+?\s+to\s+.+?:\s*/gim, '')          // From A to Everyone:
      .replace(/^\s*[A-Z][\w.'-]*(\s+[A-Z][\w.'-]*){0,3}\s*:\s*/gm, '') // Name:
      .replace(/^\s*(Reacted to|Replying to).*$/gim, '');
  }

  function count(text, opts) {
    var min = (opts && opts.minLength) || 3;
    var words = stripChatFurniture(text)
      .toLowerCase()
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/[^\p{L}\p{N}'-]+/gu, ' ')
      .split(/\s+/);

    var freq = Object.create(null);
    words.forEach(function (w) {
      w = w.replace(/^['-]+|['-]+$/g, '');
      if (w.length < min) return;
      if (STOPSET[w]) return;
      if (/^\d+$/.test(w)) return;
      freq[w] = (freq[w] || 0) + 1;
    });

    return Object.keys(freq)
      .map(function (w) { return { word: w, n: freq[w] }; })
      .sort(function (a, b) { return b.n - a.n || a.word.localeCompare(b.word); });
  }

  function overlaps(box, placed) {
    for (var i = 0; i < placed.length; i++) {
      var p = placed[i];
      if (box.x < p.x + p.w && box.x + box.w > p.x &&
          box.y < p.y + p.h && box.y + box.h > p.y) return true;
    }
    return false;
  }

  /** Lay words out on an Archimedean spiral, biggest first. */
  function draw(svg, items, opts) {
    var NS = 'http://www.w3.org/2000/svg';
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    if (!items.length) return 0;

    var vb = (svg.getAttribute('viewBox') || '0 0 900 380').split(/\s+/).map(Number);
    var W = vb[2], H = vb[3], cx = W / 2, cy = H / 2;

    var maxN = items[0].n;
    var minN = items[items.length - 1].n;
    var top = (opts && opts.max) || 45;
    items = items.slice(0, top);

    var MIN_F = (opts && opts.minFont) || 15;
    var MAX_F = (opts && opts.maxFont) || 62;

    var placed = [], drawn = 0;

    items.forEach(function (item, idx) {
      // area-proportional sizing: sqrt keeps a 10x count from being 10x tall
      var t = maxN === minN ? 1 : (Math.sqrt(item.n) - Math.sqrt(minN)) /
                                  (Math.sqrt(maxN) - Math.sqrt(minN));
      var size = Math.round(MIN_F + t * (MAX_F - MIN_F));

      var el = document.createElementNS(NS, 'text');
      el.setAttribute('font-size', size);
      el.setAttribute('font-weight', idx < 3 ? '700' : '500');
      el.setAttribute('fill', COLOURS[idx % COLOURS.length]);
      el.setAttribute('text-anchor', 'middle');
      el.setAttribute('dominant-baseline', 'middle');
      el.textContent = item.word;
      svg.appendChild(el);

      // getBBox only reports real numbers for a RENDERED element. reveal.js keeps
      // off-screen slides at display:none, where it returns zeros (or throws), so
      // fall back to an estimate rather than piling every word on the centre point.
      var bb = null;
      try { bb = el.getBBox(); } catch (e) { bb = null; }
      var w, h;
      if (bb && bb.width > 0) {
        w = bb.width + 10;
        h = bb.height + 6;
      } else {
        w = item.word.length * size * 0.56 + 10;
        h = size * 1.25 + 6;
      }

      // spiral outwards until it fits
      var placedOk = false;
      for (var step = 0; step < 4000; step++) {
        var angle = step * 0.25;
        var r = 2.2 * angle;
        var x = cx + r * Math.cos(angle) * 1.7;   // wider than tall, like the slide
        var y = cy + r * Math.sin(angle);
        var box = { x: x - w / 2, y: y - h / 2, w: w, h: h };
        if (box.x < 2 || box.y < 2 || box.x + box.w > W - 2 || box.y + box.h > H - 2) continue;
        if (overlaps(box, placed)) continue;
        el.setAttribute('x', x);
        el.setAttribute('y', y);
        placed.push(box);
        placedOk = true;
        drawn++;
        break;
      }
      if (!placedOk) svg.removeChild(el);   // no room left — drop it silently
    });

    return drawn;
  }

  function render(root, text, opts) {
    var svg = root.querySelector('svg');
    if (!svg) return 0;
    return draw(svg, count(text, opts), opts);
  }

  /**
   * Render a tally you already have, instead of counting prose.
   * Labels keep their spaces, so "Transformers 2017" stays one item.
   * Format:  "Transformers 2017:3|AlexNet 2012:3|AlphaGo 2016:1"
   */
  function renderCounts(root, spec, opts) {
    var svg = root.querySelector('svg');
    if (!svg) return 0;
    var items = spec.split('|').map(function (pair) {
      var bits = pair.split(':');
      return { word: bits[0].trim(), n: parseFloat(bits[1]) || 1 };
    }).filter(function (i) { return i.word; })
      .sort(function (a, b) { return b.n - a.n || a.word.localeCompare(b.word); });
    return draw(svg, items, opts);
  }

  function wire(root) {
    var ta = root.querySelector('textarea');
    var btn = root.querySelector('button');
    var status = root.querySelector('.wc-status');

    function build() {
      var n = render(root, (ta && ta.value) || '');
      if (status) status.textContent = n ? n + ' words' : 'Paste some text first';
    }

    if (btn) btn.addEventListener('click', build);
    if (ta) ta.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) build();
    });

    // Static clouds (data-counts / data-seed) are drawn IMMEDIATELY, using estimated
    // text widths. Do not gate this on visibility: inside reveal.js the slide is
    // hidden at load, and waiting for it to appear means it may never be drawn at all.
    // An estimated layout looks fine; a blank slide does not.
    var counts = root.getAttribute('data-counts');
    var seed = root.getAttribute('data-seed');
    if (!counts && !seed) return;

    function paint() {
      if (counts) renderCounts(root, counts); else render(root, seed);
    }
    paint();

    // Once the slide is genuinely on screen, redraw once so getBBox can measure the
    // real text and tighten the spacing. Purely cosmetic — the first draw already works.
    REFINE.push(function () {
      if (root.dataset.wcRefined === '1') return true;
      var r = root.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) return false;
      paint();
      root.dataset.wcRefined = '1';
      return true;
    });
  }

  var REFINE = [];

  function refineVisible() {
    REFINE = REFINE.filter(function (fn) { return !fn(); });
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('.wordcloud'), wire);

    // reveal.js: redraw attempt every time a slide comes into view.
    if (global.Reveal && typeof global.Reveal.on === 'function') {
      global.Reveal.on('ready', refineVisible);
      global.Reveal.on('slidechanged', refineVisible);
      global.Reveal.on('fragmentshown', refineVisible);
    }
    // belt and braces for any other context
    global.addEventListener('resize', refineVisible);
    setTimeout(refineVisible, 80);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.CourseWordCloud = { render: render, renderCounts: renderCounts, count: count };
})(window);
