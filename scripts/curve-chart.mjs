const USD_TO_CNY = 7;
const NETWORK_FEE_CNY = 29;

export async function initPriceCurveApp(root = document) {
  const [channelPresets, planBaselines] = await Promise.all([
    fetchJson("./data/channel-presets.json"),
    fetchJson("./data/plan-baselines.json")
  ]);

  const state = {
    usageUsd: 500,
    maxUsageUsd: 9000,
    maxCostCny: 2200,
    lowPriceChannels: buildLowPriceChannels(channelPresets),
    plans: buildOfficialPlans(planBaselines)
  };

  const els = {
    canvas: root.getElementById("curveCanvas"),
    svg: root.getElementById("curveSvg"),
    slider: root.getElementById("usageSlider"),
    usageLabel: root.getElementById("usageLabel"),
    usageHint: root.getElementById("usageHint"),
    ticketTitle: root.getElementById("ticketTitle"),
    ticketCost: root.getElementById("ticketCost"),
    ticketRate: root.getElementById("ticketRate"),
    ticketRisk: root.getElementById("ticketRisk"),
    chips: root.querySelectorAll("[data-usage-usd]")
  };

  els.slider.addEventListener("input", () => {
    state.usageUsd = sliderToUsage(Number(els.slider.value), state.maxUsageUsd);
    render(state, els);
  });

  els.chips.forEach(chip => {
    chip.addEventListener("click", () => {
      state.usageUsd = Number(chip.dataset.usageUsd);
      els.slider.value = usageToSlider(state.usageUsd, state.maxUsageUsd);
      render(state, els);
    });
  });

  window.addEventListener("resize", () => render(state, els));
  els.slider.value = usageToSlider(state.usageUsd, state.maxUsageUsd);
  render(state, els);
}

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.json();
}

function buildLowPriceChannels(channelPresets) {
  return (channelPresets.channels || [])
    .filter(channel => channel.type === "linear" && channel.id !== "official_api")
    .map(channel => ({
      id: channel.id,
      name: channel.name,
      cnyPerUsd: Number(channel.cny_per_usd || 0),
      riskFactor: Number(channel.risk_factor || 0),
      status: channel.status || "风险渠道"
    }));
}

function buildOfficialPlans(planBaselines) {
  const claude = planBaselines.claude?.plans || {};
  return [
    plan("official_pro", "官方 Pro", claude.pro, "#10b981"),
    plan("official_max_5x", "官方 Max 5x", claude.max_5x, "#0f766e"),
    plan("official_max_20x", "官方 Max 20x", claude.max_20x, "#0f766e")
  ].filter(Boolean);
}

function plan(id, name, raw, color) {
  if (!raw) return null;
  const capacityUsd = Number(Object.values(raw.api_equivalent_value_usd || {})[0] || 0);
  const monthlyCostCny = Number(raw.monthly_fee_usd || 0) * USD_TO_CNY + NETWORK_FEE_CNY;
  return { id, name, capacityUsd, monthlyCostCny, color, riskFactor: 1 };
}

function render(state, els) {
  const rect = els.canvas.parentElement.getBoundingClientRect();
  const width = Math.max(520, Math.floor(rect.width));
  const height = Math.max(360, Math.floor(rect.height));
  const chart = box(width, height);

  setupCanvas(els.canvas, width, height);
  setupSvg(els.svg, width, height);
  drawCanvas(els.canvas, chart, state);
  drawSvg(els.svg, chart, state);
  renderTicket(els, state);
}

function setupCanvas(canvas, width, height) {
  const scale = window.devicePixelRatio || 1;
  canvas.width = width * scale;
  canvas.height = height * scale;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.getContext("2d").setTransform(scale, 0, 0, scale, 0, 0);
}

function setupSvg(svg, width, height) {
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
}

function box(width, height) {
  return {
    left: 54,
    top: 38,
    right: width - 28,
    bottom: height - 42,
    width: width - 82,
    height: height - 80
  };
}

function drawCanvas(canvas, chart, state) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  ctx.fillStyle = "#fffdf8";
  ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  drawRiskBands(ctx, chart);
  drawGrid(ctx, chart, state);
  drawAxisLabels(ctx, chart, state);
}

function drawRiskBands(ctx, chart) {
  const bands = [
    [0, 2, "rgba(254, 226, 226, 0.58)"],
    [2, 4, "rgba(254, 243, 199, 0.5)"],
    [4, 6, "rgba(254, 249, 195, 0.44)"],
    [6, 7, "rgba(209, 250, 229, 0.42)"],
    [7, 10, "rgba(219, 234, 254, 0.36)"]
  ];

  for (const [min, max, color] of bands) {
    const top = yForBand(max, chart);
    const bottom = yForBand(min, chart);
    ctx.fillStyle = color;
    ctx.fillRect(chart.left, top, chart.width, bottom - top);
  }
}

function drawGrid(ctx, chart, state) {
  ctx.strokeStyle = "rgba(52, 64, 84, 0.12)";
  ctx.lineWidth = 1;

  for (const value of [0, 500, 1000, 1500, 2000]) {
    const y = yScale(value, chart, state);
    ctx.beginPath();
    ctx.moveTo(chart.left, y);
    ctx.lineTo(chart.right, y);
    ctx.stroke();
  }

  for (const usage of [50, 200, 500, 2124, 8495]) {
    const x = xScale(usage, chart, state);
    ctx.beginPath();
    ctx.moveTo(x, chart.top);
    ctx.lineTo(x, chart.bottom);
    ctx.stroke();
  }
}

function drawAxisLabels(ctx, chart, state) {
  ctx.fillStyle = "#344054";
  ctx.font = "700 12px Inter, Aptos, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  for (const value of [0, 500, 1000, 1500, 2000]) {
    ctx.fillText(value, chart.left - 10, yScale(value, chart, state));
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const labels = [
    [50, "轻度"],
    [200, "中度"],
    [500, "重度"],
    [2124, "极重"],
    [8495, "API"]
  ];

  for (const [usage, label] of labels) {
    ctx.fillText(label, xScale(usage, chart, state), chart.bottom + 12);
  }
}

function drawSvg(svg, chart, state) {
  const officialApi = officialApiPath(chart, state);
  const lowBand = lowPriceBandPath(chart, state);
  const subscriptions = state.plans.map(plan => subscriptionPath(plan, chart, state)).join("");
  const cursorX = xScale(state.usageUsd, chart, state);
  const chosen = chooseBest(state);
  const cursorY = yScale(Math.min(state.maxCostCny, chosen.costCny), chart, state);

  svg.innerHTML = `
    <path d="${lowBand}" fill="rgba(249, 115, 22, 0.12)" stroke="rgba(249, 115, 22, 0.55)" stroke-width="2" />
    <path d="${officialApi}" fill="none" stroke="#2563eb" stroke-width="3.5" stroke-linecap="round" />
    ${subscriptions}
    <line x1="${cursorX}" y1="${chart.top}" x2="${cursorX}" y2="${chart.bottom}" stroke="#101828" stroke-width="1.4" stroke-dasharray="5 6" opacity="0.72" />
    <circle cx="${cursorX}" cy="${cursorY}" r="7" fill="#101828" stroke="#fff" stroke-width="3" />
    <text x="${chart.left + 12}" y="${chart.top + 20}" fill="#f97316" font-size="12" font-weight="800">低价渠道区</text>
    <text x="${chart.right - 98}" y="${yScale(Math.min(state.maxCostCny, 7 * state.maxUsageUsd), chart, state) + 18}" fill="#2563eb" font-size="12" font-weight="800">官方 API</text>
  `;
}

function officialApiPath(chart, state) {
  const points = [];
  for (let usage = 10; usage <= state.maxUsageUsd; usage *= 1.13) {
    points.push([xScale(usage, chart, state), yScale(Math.min(state.maxCostCny, usage * USD_TO_CNY), chart, state)]);
  }
  points.push([xScale(state.maxUsageUsd, chart, state), yScale(state.maxCostCny, chart, state)]);
  return path(points);
}

function lowPriceBandPath(chart, state) {
  const low = 1.5;
  const high = 5;
  const top = [];
  const bottom = [];
  for (let usage = 10; usage <= state.maxUsageUsd; usage *= 1.13) {
    top.push([xScale(usage, chart, state), yScale(Math.min(state.maxCostCny, usage * high), chart, state)]);
    bottom.push([xScale(usage, chart, state), yScale(Math.min(state.maxCostCny, usage * low), chart, state)]);
  }
  return `${path(top)} ${bottom.reverse().map(([x, y]) => `L ${x.toFixed(2)} ${y.toFixed(2)}`).join(" ")} Z`;
}

function subscriptionPath(plan, chart, state) {
  const y = yScale(plan.monthlyCostCny, chart, state);
  const x0 = xScale(10, chart, state);
  const x1 = xScale(plan.capacityUsd, chart, state);
  const labelX = Math.max(x0 + 18, x1 - 110);
  return `
    <path d="M ${x0} ${y} L ${x1} ${y}" fill="none" stroke="${plan.color}" stroke-width="5" stroke-linecap="round" />
    <circle cx="${x1}" cy="${y}" r="4.5" fill="${plan.color}" />
    <text x="${labelX}" y="${y - 12}" fill="${plan.color}" font-size="12" font-weight="850">${escapeSvg(plan.name)}</text>
  `;
}

function renderTicket(els, state) {
  const chosen = chooseBest(state);
  els.usageLabel.textContent = `$${format(state.usageUsd, 0)} API 等值 / 月`;
  els.usageHint.textContent = hintForUsage(state.usageUsd);
  els.ticketTitle.textContent = chosen.name;
  els.ticketCost.textContent = `¥${format(chosen.costCny, 0)} / 月`;
  els.ticketRate.textContent = `${format(chosen.effectiveCnyPerUsd, 2)} 元 / $1`;
  els.ticketRisk.textContent = chosen.status;
  els.ticketRisk.className = `tag ${chosen.riskFactor < 0.5 ? "warn" : "good"}`;
}

function chooseBest(state) {
  const options = [
    ...state.lowPriceChannels.map(channel => ({
      name: channel.name,
      costCny: channel.cnyPerUsd * state.usageUsd,
      effectiveCnyPerUsd: channel.cnyPerUsd,
      riskFactor: channel.riskFactor,
      status: channel.status
    })),
    {
      name: "官方 API",
      costCny: USD_TO_CNY * state.usageUsd,
      effectiveCnyPerUsd: USD_TO_CNY,
      riskFactor: 1,
      status: "官方基准"
    },
    ...state.plans.map(plan => ({
      name: plan.name,
      costCny: plan.monthlyCostCny,
      effectiveCnyPerUsd: plan.monthlyCostCny / state.usageUsd,
      riskFactor: 1,
      status: state.usageUsd > plan.capacityUsd ? "已超容量" : "容量内",
      exceeded: state.usageUsd > plan.capacityUsd
    }))
  ];

  return options
    .filter(option => !option.exceeded)
    .filter(option => option.riskFactor >= 0.7)
    .sort((a, b) => a.costCny - b.costCny)[0]
    || options.filter(option => !option.exceeded).sort((a, b) => a.costCny - b.costCny)[0]
    || options.sort((a, b) => a.costCny - b.costCny)[0];
}

function hintForUsage(usage) {
  if (usage < 120) return "轻度：学习、问答、偶尔办公";
  if (usage < 425) return "中度：每天使用，订阅通常更省心";
  if (usage < 2124) return "重度：研究、写作、代码任务";
  if (usage < 8495) return "极重：代理编程或多人共享";
  return "API 集成：大规模容量规划";
}

function xScale(value, chart, state) {
  const min = Math.log10(10);
  const max = Math.log10(state.maxUsageUsd);
  const current = Math.log10(Math.max(10, value));
  return chart.left + ((current - min) / (max - min)) * chart.width;
}

function yScale(value, chart, state) {
  const clamped = Math.min(state.maxCostCny, Math.max(0, value));
  return chart.bottom - (clamped / state.maxCostCny) * chart.height;
}

function yForBand(cnyPerUsd, chart) {
  const maxBand = 10;
  const normalized = Math.min(maxBand, Math.max(0, cnyPerUsd)) / maxBand;
  return chart.bottom - normalized * chart.height;
}

function sliderToUsage(value, maxUsage) {
  const min = Math.log10(10);
  const max = Math.log10(maxUsage);
  return Math.round(10 ** (min + (value / 1000) * (max - min)));
}

function usageToSlider(usage, maxUsage) {
  const min = Math.log10(10);
  const max = Math.log10(maxUsage);
  return Math.round(((Math.log10(Math.max(10, usage)) - min) / (max - min)) * 1000);
}

function path(points) {
  return points.map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
}

function format(value, digits) {
  return Number(value).toLocaleString("en-US", { maximumFractionDigits: digits });
}

function escapeSvg(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
