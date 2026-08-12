// Shared Chart.js helpers for GPA distribution histograms — used by both
// the single-school page (js/school.js) and the compare page (compare.html).

export const GPA_BUCKETS = [
  ['below_1_0',     'Below 1.0'],
  ['1_00_to_1_99',  '1.00–1.99'],
  ['2_00_to_2_49',  '2.00–2.49'],
  ['2_50_to_2_99',  '2.50–2.99'],
  ['3_00_to_3_24',  '3.00–3.24'],
  ['3_25_to_3_49',  '3.25–3.49'],
  ['3_50_to_3_74',  '3.50–3.74'],
  ['3_75_to_3_99',  '3.75–3.99'],
  ['4_0',           '4.0'],
];

// Mixes `hex` toward `target` by fraction `f` (0 = hex, 1 = target).
export function hexMix(hex, target, f) {
  const a = hex.replace('#', ''), b = target.replace('#', '');
  const parse = h => [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  const mix = (c1, c2) => Math.round(c1 + (c2 - c1) * f);
  return '#' + [mix(r1, r2), mix(g1, g2), mix(b1, b2)]
    .map(c => c.toString(16).padStart(2, '0')).join('');
}

// Single school — ordinal ramp (darkest at 4.0, the near-universal peak at
// selective schools, lightening toward the tail). Returns false if there
// wasn't enough data to draw anything.
export function renderGpaHistogram(canvas, distribution, brandColor) {
  if (!canvas || !distribution) return false;

  const points = GPA_BUCKETS
    .map(([key, label]) => ({ label, value: distribution[key] }))
    .filter(p => p.value != null);
  if (points.length < 2) return false;

  const n = points.length;
  const colors = points.map((_, i) => hexMix(brandColor, '#1a1a1a', (n - 1 - i) / (n - 1) * 0.55));

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: points.map(p => p.label),
      datasets: [{
        data: points.map(p => +(p.value * 100).toFixed(1)),
        backgroundColor: colors,
        maxBarThickness: 24,
        categoryPercentage: 0.8,
        barPercentage: 0.9,
        borderRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      font: { family: 'Oswald' },
      plugins: {
        legend: { display: false },
        tooltip: {
          displayColors: false,
          callbacks: {
            title: items => items[0].label + ' GPA',
            label: item => `${item.formattedValue}% of enrolled students`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Oswald' }, color: '#666' },
        },
        y: {
          beginAtZero: true,
          grid: { color: '#eee' },
          border: { display: false },
          ticks: {
            font: { family: 'Oswald' },
            color: '#999',
            callback: v => v + '%',
          },
        },
      },
    },
  });
  return true;
}

// Two schools — grouped bars, one flat brand color per school (a real
// categorical/identity comparison, not a magnitude ramp), with a legend
// since there are now two series sharing the same axis. `entries` is
// [{ distribution, color, name }, { distribution, color, name }].
export function renderGpaComparisonChart(canvas, entries) {
  if (!canvas) return false;

  const buckets = GPA_BUCKETS.filter(([key]) => entries.some(e => e.distribution?.[key] != null));
  if (buckets.length < 2) return false;

  const datasets = entries.map(e => ({
    label: e.name,
    data: buckets.map(([key]) => e.distribution?.[key] != null ? +(e.distribution[key] * 100).toFixed(1) : null),
    backgroundColor: e.color,
    maxBarThickness: 22,
    categoryPercentage: 0.7,
    barPercentage: 0.85,
    borderRadius: 4,
  }));

  new Chart(canvas, {
    type: 'bar',
    data: { labels: buckets.map(([, label]) => label), datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      font: { family: 'Oswald' },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { font: { family: 'Oswald', size: 12 }, boxWidth: 12, usePointStyle: true, pointStyle: 'circle' },
        },
        tooltip: {
          callbacks: {
            label: item => `${item.dataset.label}: ${item.formattedValue}%`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Oswald' }, color: '#666' },
        },
        y: {
          beginAtZero: true,
          grid: { color: '#eee' },
          border: { display: false },
          ticks: {
            font: { family: 'Oswald' },
            color: '#999',
            callback: v => v + '%',
          },
        },
      },
    },
  });
  return true;
}
