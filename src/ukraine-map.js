/**
 * <ukraine-map> — an animated SVG map of Ukraine with pulsing markers for
 * six cities, used in the Geography section.
 *
 * Ported from the design source's own ukraine-map.js, which loaded the
 * full d3 + topojson-client UMD bundles from unpkg <script> tags and
 * used d3-selection to build the SVG. This version imports only the two
 * sub-packages actually used — d3-geo for the projection/path math,
 * topojson-client to turn the topology into GeoJSON — via npm, bundled
 * by Vite like the rest of the site's JS, and builds the SVG with plain
 * DOM calls instead of pulling in d3-selection just for that. Matches
 * this project's established "self-hosted, no third-party runtime
 * request" convention (see README on self-hosted fonts) — for the same
 * reason, the ~105KB world-atlas topology itself is a local file
 * (public/data/countries-110m.json) instead of the design's CDN fetch.
 */
import { geoMercator, geoPath } from 'd3-geo';
import { feature, merge } from 'topojson-client';

const TOPOLOGY_URL = '/data/countries-110m.json';

const CITIES = [
  { name: 'Київ', lon: 30.5234, lat: 50.4501 },
  { name: 'Полтава', lon: 34.5514, lat: 49.5883 },
  { name: 'Одеса', lon: 30.7233, lat: 46.4825 },
  { name: 'Львів', lon: 24.0297, lat: 49.8397 },
  { name: 'Харків', lon: 36.2304, lat: 49.9935 },
  { name: 'Дніпро', lon: 35.0456, lat: 48.4647 },
];

const SVG_NS = 'http://www.w3.org/2000/svg';

// Natural Earth (world-atlas) assigns Crimea to Russia. Merge it into
// Ukraine at the topology level so the shared arc dissolves and no
// internal border gets stroked.
function isCrimea(coords) {
  const ring = coords[0];
  let lon = 0;
  let lat = 0;
  for (const point of ring) {
    lon += point[0];
    lat += point[1];
  }
  lon /= ring.length;
  lat /= ring.length;
  return lon > 32 && lon < 37 && lat > 44 && lat < 46.5;
}

function wholeUkraine(topo) {
  const geoms = topo.objects.countries.geometries;
  const ua = geoms.find((g) => g.properties?.name === 'Ukraine');
  const ru = geoms.find((g) => g.properties?.name === 'Russia');
  if (!ua) return null;
  const parts = [ua];
  if (ru?.type === 'MultiPolygon') {
    ru.arcs.forEach((poly) => {
      const probe = { type: 'Polygon', arcs: poly };
      const feat = feature(topo, probe);
      if (isCrimea(feat.geometry.coordinates)) parts.push(probe);
    });
  }
  return { type: 'Feature', properties: {}, geometry: merge(topo, parts) };
}

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  return el;
}

class UkraineMap extends HTMLElement {
  connectedCallback() {
    if (this._done) return;
    this._done = true;
    this.style.display = 'block';
    this.style.width = '100%';
    this.render();
  }

  async render() {
    const w = 560;
    const h = 380;

    let topo;
    try {
      topo = await fetch(TOPOLOGY_URL).then((response) => response.json());
    } catch {
      return; // Offline/blocked — the section still reads fine without it.
    }
    const ua = wholeUkraine(topo);
    if (!ua) return;

    const projection = geoMercator().fitExtent(
      [
        [46, 30],
        [w - 46, h - 30],
      ],
      ua
    );
    const path = geoPath(projection);

    const svg = svgEl('svg', { viewBox: `0 0 ${w} ${h}`, width: '100%' });
    svg.style.display = 'block';
    svg.style.overflow = 'hidden';

    const defs = svgEl('defs');
    const grad = svgEl('linearGradient', { id: 'uaFill', x1: '0', y1: '0', x2: '0.4', y2: '1' });
    grad.append(
      svgEl('stop', { offset: '0%', 'stop-color': '#3A2E22' }),
      svgEl('stop', { offset: '100%', 'stop-color': '#221A14' })
    );
    const glow = svgEl('filter', { id: 'uaGlow', x: '-30%', y: '-30%', width: '160%', height: '160%' });
    const mergeNode = svgEl('feMerge');
    mergeNode.append(svgEl('feMergeNode', { in: 'b' }), svgEl('feMergeNode', { in: 'SourceGraphic' }));
    glow.append(svgEl('feGaussianBlur', { stdDeviation: '4', result: 'b' }), mergeNode);
    defs.append(grad, glow);
    svg.append(defs);

    svg.append(
      svgEl('path', {
        d: path(ua),
        fill: 'url(#uaFill)',
        stroke: '#C2A15C',
        'stroke-width': '1.2',
        filter: 'url(#uaGlow)',
      })
    );

    const g = svgEl('g');
    const labels = [];
    CITIES.forEach((city, i) => {
      const p = projection([city.lon, city.lat]);
      if (!p) return;
      const flip = city.name === 'Харків' || city.name === 'Дніпро';
      const item = svgEl('g', { transform: `translate(${p[0]},${p[1]})` });

      item.append(svgEl('circle', { r: '2.6', fill: '#E4CE9E' }));

      const ring = svgEl('circle', { r: '2.6', fill: 'none', stroke: '#C2A15C', 'stroke-width': '0.8', opacity: '0.8' });
      ring.append(
        svgEl('animate', {
          attributeName: 'r',
          values: '2.6;11',
          dur: '2.8s',
          begin: `${i * 0.45}s`,
          repeatCount: 'indefinite',
        }),
        svgEl('animate', {
          attributeName: 'opacity',
          values: '0.75;0',
          dur: '2.8s',
          begin: `${i * 0.45}s`,
          repeatCount: 'indefinite',
        })
      );
      item.append(ring);

      const label = svgEl('text', {
        x: flip ? '-8' : '8',
        y: '3.5',
        'text-anchor': flip ? 'end' : 'start',
        fill: 'rgba(246,241,233,.85)',
        'font-family': "'Jost', system-ui, sans-serif",
        'font-size': '11',
        'letter-spacing': '0.08em',
      });
      label.textContent = city.name;
      item.append(label);

      g.append(item);
      labels.push(label);
    });
    svg.append(g);

    this.replaceChildren(svg);

    const fit = () => {
      const rendered = this.getBoundingClientRect().width || w;
      const scale = rendered / w;
      const size = Math.min(22, Math.max(11, 13 / scale));
      labels.forEach((label) => label.setAttribute('font-size', String(size)));
    };
    fit();
    if (window.ResizeObserver) new ResizeObserver(fit).observe(this);
  }
}

if (!customElements.get('ukraine-map')) customElements.define('ukraine-map', UkraineMap);
