/* =========================================================
   NETWORK TOPOLOGY FAILURE DETECTION SYSTEM
   Frontend Controller
========================================================= */

const API_BASE = "http://localhost:8080";

let allDevices = [];
let healthData = [];
let topologyData = [];

let currentPage = 1;
const rowsPerPage = 20;

/* =========================================================
   UTILITY
========================================================= */

function animateNumber(element, target, duration = 1000) {
  if (!element) return;

  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const progress = Math.min((currentTime - startTime) / duration, 1);

    const eased = 1 - Math.pow(1 - progress, 3);

    const value = Math.floor(start + (target - start) * eased);

    element.textContent = value.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeDevice(device) {
  const rawFailure =
    device.failureType ??
    device.faultType ??
    device.failure_type ??
    device.Failure_Type ??
    0;

  let failureType;

  // Backend sends failure type as number
  if (typeof rawFailure === "number" || !isNaN(Number(rawFailure))) {
    failureType = Number(rawFailure);
  } else {
    // Backend sends failure type as text
    const text = String(rawFailure).trim().toLowerCase();

    if (text === "normal") {
      failureType = 0;
    } else if (text.includes("battery")) {
      failureType = 1;
    } else if (text.includes("cpu")) {
      failureType = 2;
    } else if (text.includes("network")) {
      failureType = 3;
    } else if (text.includes("overheat")) {
      failureType = 4;
    } else {
      failureType = 0;
    }
  }

  const id =
    device.deviceId ?? device.Device_ID ?? device.device_id ?? device.id;

  return {
    ...device,

    deviceId: Number(id),

    failureType: failureType,
  };
}
function failureName(type) {
  switch (Number(type)) {
    case 0:
      return "Normal";

    case 1:
      return "Battery Failure";

    case 2:
      return "CPU Failure";

    case 3:
      return "Network Failure";

    case 4:
      return "Overheat Failure";

    default:
      return "Unknown";
  }
}

function failureSeverity(type) {
  return Number(type) === 0 ? "Low" : "High";
}

function failureClass(type) {
  switch (Number(type)) {
    case 0:
      return "failure-normal";

    case 1:
      return "failure-battery";

    case 2:
      return "failure-cpu";

    case 3:
      return "failure-network";

    case 4:
      return "failure-overheat";

    default:
      return "failure-network";
  }
}

/* =========================================================
   LOAD DEVICE DATA
========================================================= */

async function loadDeviceData() {
  try {
    const response = await fetch(`${API_BASE}/api/devices`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (Array.isArray(data)) {
      allDevices = data.map(normalizeDevice);
    } else if (Array.isArray(data.devices)) {
      allDevices = data.devices.map(normalizeDevice);
    } else {
      console.error("Unexpected device API response:", data);

      allDevices = [];
    }

    calculateStatistics();

    renderFailureDistribution();

    renderFailureSummary();

    setupDeviceTable();

    updateHeroStatistics();
  } catch (error) {
    console.error("Device API error:", error);

    showDeviceApiError(error);
  }
}

/* =========================================================
   STATISTICS
========================================================= */

function calculateStatistics() {
  const total = allDevices.length;

  const normal = allDevices.filter((device) => device.failureType === 0).length;

  const failed = total - normal;

  const healthRate = total > 0 ? (normal / total) * 100 : 0;

  animateNumber(document.getElementById("totalDevices"), total);

  animateNumber(document.getElementById("normalDevices"), normal);

  animateNumber(document.getElementById("failedDevices"), failed);

  animateNumber(document.getElementById("healthRate"), Math.round(healthRate));

  const overallScore = document.getElementById("overallHealthScore");

  if (overallScore) {
    overallScore.textContent = `${Math.round(healthRate)}%`;
  }

  const healthBar = document.getElementById("overallHealthBar");

  if (healthBar) {
    setTimeout(() => {
      healthBar.style.width = `${healthRate}%`;
    }, 200);
  }
}

/* =========================================================
   HERO STATISTICS
========================================================= */

function updateHeroStatistics() {
  const total = allDevices.length;

  const failed = allDevices.filter((device) => device.failureType !== 0).length;

  const normal = total - failed;

  const health = total > 0 ? (normal / total) * 100 : 0;

  const heroDevices = document.getElementById("heroDevices");

  const heroFailures = document.getElementById("heroFailures");

  const heroHealth = document.getElementById("heroHealth");

  if (heroDevices) {
    heroDevices.textContent = `${total.toLocaleString()}+`;
  }

  if (heroFailures) {
    heroFailures.textContent = `${failed.toLocaleString()}+`;
  }

  if (heroHealth) {
    heroHealth.textContent = `${health.toFixed(1)}%`;
  }
}

/* =========================================================
   FAILURE COUNTS
========================================================= */

function getFailureCounts() {
  const counts = {
    Normal: 0,
    "Battery Failure": 0,
    "CPU Failure": 0,
    "Network Failure": 0,
    "Overheat Failure": 0,
  };

  allDevices.forEach((device) => {
    const name = failureName(device.failureType);

    if (counts[name] !== undefined) {
      counts[name]++;
    }
  });

  return counts;
}

/* =========================================================
   FAILURE DISTRIBUTION
========================================================= */

function renderFailureDistribution() {
  const container = document.getElementById("failureDistribution");

  if (!container) return;

  const counts = getFailureCounts();

  const max = Math.max(...Object.values(counts), 1);

  container.innerHTML = "";

  Object.entries(counts).forEach(([name, count], index) => {
    const row = document.createElement("div");

    row.className = "failure-row";

    const top = document.createElement("div");

    top.className = "failure-row-top";

    const label = document.createElement("span");

    label.textContent = name;

    const value = document.createElement("strong");

    value.textContent = count.toLocaleString();

    top.appendChild(label);
    top.appendChild(value);

    const track = document.createElement("div");

    track.className = "failure-track";

    const bar = document.createElement("div");

    bar.className = `failure-bar ${getFailureBarClass(name)}`;

    track.appendChild(bar);

    row.appendChild(top);
    row.appendChild(track);

    container.appendChild(row);

    setTimeout(
      () => {
        bar.style.width = `${(count / max) * 100}%`;
      },
      100 + index * 100,
    );
  });
}

function getFailureBarClass(name) {
  switch (name) {
    case "Normal":
      return "failure-normal";

    case "CPU Failure":
      return "failure-cpu";

    case "Network Failure":
      return "failure-network";

    case "Battery Failure":
      return "failure-battery";

    case "Overheat Failure":
      return "failure-overheat";

    default:
      return "failure-network";
  }
}

/* =========================================================
   FAILURE SUMMARY
========================================================= */

function renderFailureSummary() {
  const counts = getFailureCounts();

  const total = allDevices.length || 1;

  const map = {
    Normal: ["summaryNormal", "summaryNormalBar"],

    "CPU Failure": ["summaryCPU", "summaryCPUBar"],

    "Network Failure": ["summaryNetwork", "summaryNetworkBar"],

    "Battery Failure": ["summaryBattery", "summaryBatteryBar"],

    "Overheat Failure": ["summaryOverheat", "summaryOverheatBar"],
  };

  Object.entries(map).forEach(([name, ids]) => {
    const count = counts[name] || 0;

    const value = document.getElementById(ids[0]);

    const bar = document.getElementById(ids[1]);

    if (value) {
      animateNumber(value, count, 900);
    }

    if (bar) {
      setTimeout(() => {
        bar.style.width = `${(count / total) * 100}%`;
      }, 150);
    }
  });
}

/* =========================================================
   DEVICE TABLE
========================================================= */

function setupDeviceTable() {
  const search = document.getElementById("deviceSearch");

  const filter = document.getElementById("failureFilter");

  if (search) {
    search.addEventListener("input", () => {
      currentPage = 1;

      renderDeviceTable();
    });
  }

  if (filter) {
    filter.addEventListener("change", () => {
      currentPage = 1;

      renderDeviceTable();
    });
  }

  renderDeviceTable();
}

function getFilteredDevices() {
  const search =
    document.getElementById("deviceSearch")?.value.trim().toLowerCase() || "";

  const filter = document.getElementById("failureFilter")?.value || "all";

  return allDevices.filter((device) => {
    const idMatch = String(device.deviceId).includes(search);

    const failure = failureName(device.failureType);

    const filterMatch = filter === "all" || failure === filter;

    return idMatch && filterMatch;
  });
}

function renderDeviceTable() {
  const tbody = document.getElementById("deviceTableBody");

  if (!tbody) return;

  const filtered = getFilteredDevices();

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  const start = (currentPage - 1) * rowsPerPage;

  const visible = filtered.slice(start, start + rowsPerPage);

  tbody.innerHTML = "";

  if (visible.length === 0) {
    tbody.innerHTML = `
            <tr>
                <td colspan="5"
                    style="text-align:center;padding:40px;color:#94a3b8;">
                    No devices found.
                </td>
            </tr>
        `;

    renderPagination(0);

    return;
  }

  visible.forEach((device) => {
    const failure = failureName(device.failureType);

    const severity = failureSeverity(device.failureType);

    const row = document.createElement("tr");

    row.innerHTML = `

            <td>
                <strong>
                    ${device.deviceId}
                </strong>
            </td>

            <td>

                <span class="status-badge
                    ${device.failureType === 0 ? "normal" : "failed"}">

                    ${device.failureType === 0 ? "NORMAL" : "FAILED"}

                </span>

            </td>

            <td>
                ${failure}
            </td>

            <td>

                <span class="
                    ${severity === "High" ? "severity-high" : "severity-low"}">

                    ${severity}

                </span>

            </td>

            <td>

                <button
                    class="view-button"
                    onclick="showDeviceDetails(${device.deviceId})">

                    View Details

                </button>

            </td>
        `;

    tbody.appendChild(row);
  });

  renderPagination(totalPages);
}

/* =========================================================
   PAGINATION
========================================================= */

function renderPagination(totalPages) {
  const container = document.getElementById("pagination");

  if (!container) return;

  container.innerHTML = "";

  if (totalPages <= 1) {
    return;
  }

  for (let page = 1; page <= totalPages; page++) {
    const button = document.createElement("button");

    button.className = "page-button";

    if (page === currentPage) {
      button.classList.add("active");
    }

    button.textContent = page;

    button.onclick = () => {
      currentPage = page;

      renderDeviceTable();

      document.getElementById("devices")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    };

    container.appendChild(button);
  }
}

/* =========================================================
   DEVICE DETAILS MODAL
========================================================= */

function showDeviceDetails(deviceId) {
  const device = allDevices.find((item) => item.deviceId === Number(deviceId));

  if (!device) {
    console.error("Device not found:", deviceId);
    return;
  }

  const modal = document.getElementById("deviceModal");

  const modalId = document.getElementById("modalDeviceId");

  const content = document.getElementById("modalDeviceContent");

  if (!modal || !modalId || !content) {
    return;
  }

  const failure = failureName(device.failureType);

  const severity = failureSeverity(device.failureType);

  const failed = device.failureType !== 0;

  modalId.textContent = `Device ${device.deviceId}`;

  content.innerHTML = `

        <!-- STATUS -->

        <div class="device-detail-status">

            <div>

                <span class="detail-label">
                    CURRENT STATUS
                </span>

                <div class="
                    detail-status
                    ${failed ? "failed" : "normal"}
                ">

                    ${failed ? "● FAILURE DETECTED" : "● NORMAL"}

                </div>

            </div>


            <div class="failure-info">

                <span class="detail-label">
                    FAILURE TYPE
                </span>

                <strong>
                    ${failure}
                </strong>

                <small class="
                    ${failed ? "severity-high" : "severity-low"}
                ">

                    ${severity} Severity

                </small>

            </div>

        </div>


        <!-- PARAMETERS -->

        <div class="device-section-title">
            DEVICE PARAMETERS
        </div>


        <div class="modal-metric-grid">


            <!-- CPU -->

            <div class="modal-metric">

                <span>
                    CPU Usage
                </span>

                <strong>
                    ${getDeviceValue(
                      device,
                      ["cpuUsage", "CPU_Usage (%)", "CPU_Usage"],
                      "%",
                    )}
                </strong>

                <div class="metric-track">

                    <div
                        class="metric-progress cpu"
                        style="
                            width:${getPercentage(device, [
                              "cpuUsage",
                              "CPU_Usage (%)",
                              "CPU_Usage",
                            ])}%;
                        ">
                    </div>

                </div>

            </div>


            <!-- MEMORY -->

            <div class="modal-metric">

                <span>
                    Memory Usage
                </span>

                <strong>
                    ${getDeviceValue(
                      device,
                      ["memoryUsage", "Memory_Usage (%)", "Memory_Usage"],
                      "%",
                    )}
                </strong>

                <div class="metric-track">

                    <div
                        class="metric-progress memory"
                        style="
                            width:${getPercentage(device, [
                              "memoryUsage",
                              "Memory_Usage (%)",
                              "Memory_Usage",
                            ])}%;
                        ">
                    </div>

                </div>

            </div>


            <!-- BATTERY -->

            <div class="modal-metric">

                <span>
                    Battery Level
                </span>

                <strong>
                    ${getDeviceValue(
                      device,
                      ["batteryLevel", "Battery_Level (%)", "Battery_Level"],
                      "%",
                    )}
                </strong>

                <div class="metric-track">

                    <div
                        class="metric-progress battery"
                        style="
                            width:${getPercentage(device, [
                              "batteryLevel",
                              "Battery_Level (%)",
                              "Battery_Level",
                            ])}%;
                        ">
                    </div>

                </div>

            </div>


            <!-- LATENCY -->

            <div class="modal-metric">

                <span>
                    Network Latency
                </span>

                <strong>
                    ${getDeviceValue(
                      device,
                      [
                        "networkLatency",
                        "Network_Latency (ms)",
                        "Network_Latency",
                      ],
                      " ms",
                    )}
                </strong>

            </div>


            <!-- PACKET LOSS -->

            <div class="modal-metric">

                <span>
                    Packet Loss
                </span>

                <strong>
                    ${getDeviceValue(
                      device,
                      ["packetLoss", "Packet_Loss (%)", "Packet_Loss"],
                      "%",
                    )}
                </strong>

            </div>


            <!-- TEMPERATURE -->

            <div class="modal-metric">

                <span>
                    Temperature
                </span>

                <strong>
                    ${getDeviceValue(
                      device,
                      ["temperature", "Temperature (°C)", "Temperature"],
                      " °C",
                    )}
                </strong>

            </div>


            <!-- UPTIME -->

            <div class="modal-metric">

                <span>
                    Uptime
                </span>

                <strong>
                    ${getDeviceValue(
                      device,
                      ["uptime", "Uptime (hrs)", "Uptime"],
                      " hrs",
                    )}
                </strong>

            </div>


            <!-- WORKLOAD -->

            <div class="modal-metric">

                <span>
                    Workload Intensity
                </span>

                <strong>
                    ${getDeviceValue(
                      device,
                      ["workloadIntensity", "Workload_Intensity"],
                      "",
                    )}
                </strong>

            </div>


            <!-- ERROR COUNT -->

            <div class="modal-metric">

                <span>
                    Error Count
                </span>

                <strong>
                    ${getDeviceValue(device, ["errorCount", "Error_Count"], "")}
                </strong>

            </div>

        </div>


        <!-- FAILURE INFORMATION -->

        <div class="device-message">

            <div class="message-icon">
                ${failed ? "!" : "✓"}
            </div>

            <div>

                <strong>
                    ${
                      failed
                        ? "Failure Condition Detected"
                        : "Device Operating Normally"
                    }
                </strong>

                <p>

                    ${
                      failed
                        ? `The dataset identifies this device
                           with <strong>${failure}</strong>.
                           Severity level is
                           <strong>${severity}</strong>.`
                        : `No failure condition is recorded
                           for this device in the dataset.`
                    }

                </p>

            </div>

        </div>

    `;

  modal.classList.add("active");
}
function getDeviceValue(device, keys, suffix = "") {
  for (const key of keys) {
    if (
      device[key] !== undefined &&
      device[key] !== null &&
      device[key] !== ""
    ) {
      return `${device[key]}${suffix}`;
    }
  }

  return "N/A";
}

function getNumericDeviceValue(device, keys) {
  for (const key of keys) {
    const value = device[key];

    if (value !== undefined && value !== null && value !== "") {
      const number = parseFloat(value);

      if (!isNaN(number)) {
        return number;
      }
    }
  }

  return 0;
}

function getPercentage(device, keys) {
  const value = getNumericDeviceValue(device, keys);

  return Math.max(0, Math.min(100, value));
}

function getValue(device, key, suffix = "") {
  const value =
    device[key] ??
    device[key.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`)];

  if (value === undefined || value === null) {
    return "N/A";
  }

  return `${value}${suffix}`;
}

function closeDeviceModal() {
  document.getElementById("deviceModal")?.classList.remove("active");
}

document.addEventListener("click", (event) => {
  const modal = document.getElementById("deviceModal");

  if (event.target === modal) {
    closeDeviceModal();
  }
});

/* =========================================================
   TOPOLOGY
========================================================= */

async function loadTopology() {
  try {
    const response = await fetch(`${API_BASE}/api/topology`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    topologyData = Array.isArray(data) ? data : data.topology || [];

    displayTopology();
  } catch (error) {
    console.error("Topology API error:", error);

    displayTopologyFallback();
  }
}

/* =========================================================
   TOPOLOGY SVG
========================================================= */


/* =========================================================
   HIERARCHICAL LOGICAL TOPOLOGY
   Simulated router -> switches -> end devices
   ========================================================= */

function displayTopology() {
  const container = document.getElementById("topologyContainer");
  if (!container) return;

  // Prefer API topology; use device data if topology is unavailable.
  const source =
    Array.isArray(topologyData) && topologyData.length
      ? topologyData
      : allDevices;

  if (!source || !source.length) {
    container.innerHTML =
      '<div class="topology-loading">No topology data available.</div>';
    return;
  }

  const nodes = source.slice(0, 20);
  const width = 1000;
  const height = 650;

  const router = { x: 500, y: 65 };
  const switches = [
    { x: 190, y: 205, label: "Switch A" },
    { x: 500, y: 205, label: "Switch B" },
    { x: 810, y: 205, label: "Switch C" }
  ];

  // Assign devices into three illustrative groups.
  const groups = [[], [], []];

  nodes.forEach((node, index) => {
    const groupIndex = index % 3;
    groups[groupIndex].push({ node, index });
  });

  function getNodeId(node, index) {
    return Number(
      node.deviceId ??
      node.Device_ID ??
      node.device_id ??
      node.id ??
      index + 1
    );
  }

  function getDeviceStatus(node, index) {
    const id = getNodeId(node, index);
    const realDevice = allDevices.find(
      device => Number(device.deviceId) === id
    );

    if (realDevice) {
      return {
        failed: Number(realDevice.failureType) !== 0,
        failure: failureName(realDevice.failureType)
      };
    }

    const status = String(node.status ?? "").toLowerCase();
    const rawType =
      node.faultType ??
      node.failureType ??
      node.failure_type ??
      node.Failure_Type ??
      "";

    const typeText = String(rawType).toLowerCase();
    const failed =
      status.includes("fail") ||
      (typeof rawType === "number"
        ? rawType !== 0
        : typeText !== "" &&
          typeText !== "normal" &&
          typeText !== "0");

    return {
      failed,
      failure: failed ? String(rawType || "Failed") : "Normal"
    };
  }

  let svg = `
    <svg class="topology-svg"
         xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 ${width} ${height}"
         role="img"
         aria-label="Simulated hierarchical logical network topology">

      <defs>
        <filter id="topologyShadow" x="-30%" y="-30%"
                width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="3"
                        flood-color="#64748b" flood-opacity=".18"/>
        </filter>
      </defs>

      <text x="${width / 2}" y="25"
            text-anchor="middle"
            fill="#64748b" font-size="12"
            font-weight="600" letter-spacing="1.5">
        SIMULATED LOGICAL TOPOLOGY
      </text>

      <!-- Router to switches -->
  `;

  // Draw connections first so they appear behind nodes.
  switches.forEach(sw => {
    svg += `
      <line class="topology-connection"
            x1="${router.x}" y1="${router.y + 25}"
            x2="${sw.x}" y2="${sw.y - 24}"
            stroke="#94a3b8" stroke-width="2.5"
            stroke-dasharray="7 6"/>
    `;
  });

  // Draw switch-to-device links.
  groups.forEach((group, groupIndex) => {
    const sw = switches[groupIndex];
    const rowGap = group.length > 5 ? 70 : 82;
    const startY = 325;

    group.forEach((entry, localIndex) => {
      const row = Math.floor(localIndex / 4);
      const column = localIndex % 4;
      const columnsInRow = Math.min(4, group.length - row * 4);
      const spacing = 68;
      const rowWidth = (columnsInRow - 1) * spacing;
      const x = sw.x - rowWidth / 2 + column * spacing;
      const y = startY + row * rowGap;

      entry.x = x;
      entry.y = y;

      svg += `
        <line class="topology-connection"
              x1="${sw.x}" y1="${sw.y + 24}"
              x2="${x}" y2="${y - 19}"
              stroke="#b7c7db" stroke-width="2"
              stroke-dasharray="5 5"/>
      `;
    });
  });

  // Core router node.
  svg += `
    <g filter="url(#topologyShadow)">
      <rect x="${router.x - 76}" y="${router.y - 24}"
            width="152" height="49" rx="12"
            fill="#172554" stroke="#60a5fa" stroke-width="2"/>
      <text x="${router.x}" y="${router.y - 1}"
            text-anchor="middle" fill="#ffffff"
            font-size="13" font-weight="700">CORE ROUTER</text>
      <text x="${router.x}" y="${router.y + 14}"
            text-anchor="middle" fill="#bfdbfe"
            font-size="9">Logical root</text>
    </g>
  `;

  // Switch nodes.
  switches.forEach(sw => {
    svg += `
      <g filter="url(#topologyShadow)">
        <rect x="${sw.x - 62}" y="${sw.y - 24}"
              width="124" height="48" rx="10"
              fill="#e0e7ff" stroke="#6366f1" stroke-width="2"/>
        <text x="${sw.x}" y="${sw.y - 2}"
              text-anchor="middle" fill="#312e81"
              font-size="12" font-weight="700">${sw.label}</text>
        <text x="${sw.x}" y="${sw.y + 12}"
              text-anchor="middle" fill="#4338ca"
              font-size="9">Access layer</text>
      </g>
    `;
  });

  // End devices.
  groups.forEach(group => {
    group.forEach(entry => {
      const node = entry.node;
      const index = entry.index;
      const id = getNodeId(node, index);
      const state = getDeviceStatus(node, index);
      const fill = state.failed ? "#ef4444" : "#2563eb";
      const stroke = state.failed ? "#fecaca" : "#bfdbfe";

      svg += `
        <g class="topology-svg-node"
           role="button"
           tabindex="0"
           aria-label="Device ${id}, ${state.failed ? "Failed" : "Normal"}"
           data-device-id="${id}"
           onclick="showTopologyDeviceDetails(${id})"
           onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();showTopologyDeviceDetails(${id});}"
           style="cursor:pointer"
           filter="url(#topologyShadow)">

          <circle cx="${entry.x}" cy="${entry.y}"
                  r="20" fill="${fill}"
                  stroke="${stroke}" stroke-width="4"/>

          <text x="${entry.x}" y="${entry.y + 4}"
                text-anchor="middle" fill="#ffffff"
                font-size="10" font-weight="700"
                pointer-events="none">${id}</text>

          <text x="${entry.x}" y="${entry.y + 34}"
                text-anchor="middle" fill="#64748b"
                font-size="9" pointer-events="none">
            ${state.failed ? "FAILED" : "NORMAL"}
          </text>
        </g>
      `;
    });
  });

  svg += `
      <text x="${width / 2}" y="${height - 12}"
            text-anchor="middle" fill="#64748b"
            font-size="10">
        Connections are illustrative, not verified physical links.
      </text>
    </svg>
  `;

  container.innerHTML = svg;
}

/* Kept for compatibility with any other existing calls. */
function createTopologyPositions(count, width, height) {
  const positions = [];
  const columns = 5;
  const rows = Math.ceil(count / columns);
  const horizontalGap = width / (columns + 1);
  const verticalGap = height / (rows + 1);

  for (let i = 0; i < count; i++) {
    positions.push({
      x: horizontalGap * ((i % columns) + 1),
      y: verticalGap * (Math.floor(i / columns) + 1)
    });
  }

  return positions;
}

/* Fallback: build the same layout from loaded device records. */
function displayTopologyFallback() {
  if (!Array.isArray(allDevices) || allDevices.length === 0) {
    const container = document.getElementById("topologyContainer");
    if (container) {
      container.innerHTML =
        '<div class="topology-loading">No topology data available. Start the backend and try again.</div>';
    }
    return;
  }

  topologyData = allDevices.slice(0, 20).map(device => ({
    deviceId: device.deviceId,
    status: Number(device.failureType) === 0 ? "Normal" : "Failed",
    faultType: failureName(device.failureType)
  }));

  displayTopology();
}

/* =========================================================
   TOPOLOGY DEVICE DETAILS
========================================================= */

function showTopologyDeviceDetails(deviceId) {
  const panel = document.getElementById("topologyDetails");

  const device = allDevices.find((item) => item.deviceId === Number(deviceId));

  if (!panel) {
    return;
  }

  if (!device) {
    panel.innerHTML = `
            <div class="details-placeholder">

                <h3>
                    Device ${deviceId}
                </h3>

                <p>
                    Device information is not available.
                </p>

            </div>
        `;

    return;
  }

  const failure = failureName(device.failureType);

  const failed = device.failureType !== 0;

  panel.innerHTML = `

        <div class="topology-device-header">

            <span>
                SELECTED DEVICE
            </span>

            <h3>
                Device ${device.deviceId}
            </h3>

            <span class="detail-status
                ${failed ? "failed" : "normal"}">

                ${failed ? "FAILURE DETECTED" : "NORMAL"}

            </span>

        </div>


        <div class="detail-row">
            <span>Status</span>
            <strong>
                ${failed ? "Failed" : "Normal"}
            </strong>
        </div>


        <div class="detail-row">
            <span>Failure Type</span>
            <strong>
                ${failure}
            </strong>
        </div>


        <div class="detail-row">
            <span>Severity</span>
            <strong>
                ${failureSeverity(device.failureType)}
            </strong>
        </div>


        <div class="detail-row">
            <span>CPU Usage</span>
            <strong>
                ${getValue(device, "cpuUsage", "%")}
            </strong>
        </div>


        <div class="detail-row">
            <span>Memory Usage</span>
            <strong>
                ${getValue(device, "memoryUsage", "%")}
            </strong>
        </div>


        <div class="detail-row">
            <span>Temperature</span>
            <strong>
                ${getValue(device, "temperature", " °C")}
            </strong>
        </div>


        <div class="detail-row">
            <span>Network Latency</span>
            <strong>
                ${getValue(device, "networkLatency", " ms")}
            </strong>
        </div>

    `;
}

/* =========================================================
   API ERROR
========================================================= */

function showDeviceApiError(error) {
  const total = document.getElementById("totalDevices");

  if (total) {
    total.textContent = "—";
  }

  console.error("Backend connection failed.", error);
}

/* =========================================================
   INITIALIZATION
========================================================= */

async function initializeDashboard() {
  console.log("Initializing Network Failure Detection Dashboard...");

  await loadDeviceData();

  await loadTopology();

  console.log("Dashboard initialized.");
}

/* =========================================================
   START
========================================================= */

document.addEventListener("DOMContentLoaded", initializeDashboard);

/* =========================================================
   ADVANCED MODULES: SIMULATION, ROOT CAUSE, IMPACT ANALYSIS
   Simulation scoring is rule-based and intended for demonstration.
========================================================= */
(() => {
  const byId = (id) => document.getElementById(id);
  const metricControls = [
    ["simCpu", "simCpuValue", "%"],
    ["simMemory", "simMemoryValue", "%"],
    ["simBattery", "simBatteryValue", "%"],
    ["simLatency", "simLatencyValue", " ms"],
    ["simPacketLoss", "simPacketLossValue", "%"],
    ["simTemperature", "simTemperatureValue", "°C"],
    ["simErrors", "simErrorsValue", ""],
  ];
  const defaults = {
    simCpu: 45,
    simMemory: 50,
    simBattery: 80,
    simLatency: 30,
    simPacketLoss: 0,
    simTemperature: 40,
    simErrors: 0,
  };

  function valueOf(obj, keys, fallback = null) {
    for (const key of keys) {
      if (
        obj &&
        obj[key] !== undefined &&
        obj[key] !== null &&
        obj[key] !== ""
      ) {
        const n = Number(obj[key]);
        if (Number.isFinite(n)) return n;
      }
    }
    return fallback;
  }
  function metricSnapshot(source) {
    return {
      cpu: valueOf(
        source,
        ["cpuUsage", "CPU_Usage (%)", "CPU_Usage", "cpu", "cpu_usage"],
        null,
      ),
      memory: valueOf(
        source,
        [
          "memoryUsage",
          "Memory_Usage (%)",
          "Memory_Usage",
          "memory",
          "memory_usage",
        ],
        null,
      ),
      battery: valueOf(
        source,
        [
          "batteryLevel",
          "Battery_Level (%)",
          "Battery_Level",
          "battery",
          "battery_level",
        ],
        null,
      ),
      latency: valueOf(
        source,
        [
          "networkLatency",
          "Network_Latency (ms)",
          "Network_Latency",
          "latency",
          "network_latency",
        ],
        null,
      ),
      packetLoss: valueOf(
        source,
        ["packetLoss", "Packet_Loss (%)", "Packet_Loss", "packet_loss"],
        null,
      ),
      temperature: valueOf(
        source,
        ["temperature", "Temperature (°C)", "Temperature", "temp"],
        null,
      ),
      errors: valueOf(
        source,
        ["errorCount", "Error_Count", "errors", "error_count"],
        null,
      ),
    };
  }
  function calculateRisk(m) {
    let risk = 0;
    const evidence = [];
    if (m.cpu !== null && m.cpu >= 90) {
      risk += 25;
      evidence.push(`Critical CPU usage (${m.cpu}%)`);
    } else if (m.cpu !== null && m.cpu >= 75) {
      risk += 12;
      evidence.push(`High CPU usage (${m.cpu}%)`);
    }
    if (m.memory !== null && m.memory >= 90) {
      risk += 15;
      evidence.push(`Critical memory usage (${m.memory}%)`);
    }
    if (m.battery !== null && m.battery <= 15) {
      risk += 20;
      evidence.push(`Low battery (${m.battery}%)`);
    }
    if (m.latency !== null && m.latency >= 200) {
      risk += 20;
      evidence.push(`High latency (${m.latency} ms)`);
    }
    if (m.packetLoss !== null && m.packetLoss >= 5) {
      risk += 25;
      evidence.push(`High packet loss (${m.packetLoss}%)`);
    }
    if (m.temperature !== null && m.temperature >= 85) {
      risk += 25;
      evidence.push(`High temperature (${m.temperature}°C)`);
    }
    if (m.errors !== null && m.errors >= 10) {
      risk += 15;
      evidence.push(`Elevated error count (${m.errors})`);
    }
    risk = Math.min(100, risk);
    let diagnosis = "No major threshold exceeded",
      recommendation = "Continue monitoring the device.";
    if ((m.packetLoss ?? 0) >= 5 || (m.latency ?? 0) >= 200) {
      diagnosis = "Possible network degradation";
      recommendation =
        "Inspect network links, congestion, packet drops and routing configuration.";
    } else if ((m.temperature ?? 0) >= 85) {
      diagnosis = "Possible overheating";
      recommendation =
        "Check cooling, ventilation, sensor readings and device workload.";
    } else if ((m.cpu ?? 0) >= 90) {
      diagnosis = "Possible CPU overload";
      recommendation =
        "Inspect CPU-intensive processes and workload distribution.";
    } else if ((m.battery ?? 100) <= 15) {
      diagnosis = "Low battery condition";
      recommendation = "Check the device power source and battery health.";
    } else if ((m.memory ?? 0) >= 90) {
      diagnosis = "Possible memory pressure";
      recommendation = "Inspect memory consumption and running processes.";
    } else if ((m.errors ?? 0) >= 10) {
      diagnosis = "Elevated error count";
      recommendation = "Review device logs and investigate repeated errors.";
    }
    const severity =
      risk >= 60 ? "CRITICAL" : risk >= 30 ? "WARNING" : "HEALTHY";
    return { risk, evidence, diagnosis, recommendation, severity };
  }
  function renderSimulation() {
    const m = {
      cpu: Number(byId("simCpu").value),
      memory: Number(byId("simMemory").value),
      battery: Number(byId("simBattery").value),
      latency: Number(byId("simLatency").value),
      packetLoss: Number(byId("simPacketLoss").value),
      temperature: Number(byId("simTemperature").value),
      errors: Number(byId("simErrors").value),
    };
    metricControls.forEach(([input, output, suffix]) => {
      if (byId(output)) byId(output).textContent = byId(input).value + suffix;
    });
    const r = calculateRisk(m);
    byId("simRiskScore").textContent = `${r.risk}/100`;
    byId("simRiskBar").style.width = `${r.risk}%`;
    byId("simSeverity").textContent = r.severity;
    byId("simDiagnosis").textContent = r.diagnosis;
    byId("simEvidence").textContent = r.evidence.length
      ? r.evidence.join(" • ")
      : "No configured warning thresholds exceeded.";
    byId("simRecommendation").textContent = r.recommendation;
    const colors = {
      HEALTHY: ["#16a34a", "#dcfce7", "#166534"],
      WARNING: ["#d97706", "#fef3c7", "#92400e"],
      CRITICAL: ["#dc2626", "#fee2e2", "#991b1b"],
    };
    const [bar, bg, fg] = colors[r.severity];
    byId("simRiskBar").style.background = bar;
    byId("simSeverity").style.background = bg;
    byId("simSeverity").style.color = fg;
  }
  function deviceLabel(d, index) {
    const id = d.deviceId ?? d.Device_ID ?? d.device_id ?? d.id ?? index + 1;
    const failure =
      d.faultType ??
      d.failure_type ??
      d.Failure_Type ??
      d.failureType ??
      "Unknown";
    return {
      id: String(id),
      failure: String(
        typeof failure === "number"
          ? window.failureName
            ? window.failureName(failure)
            : failure
          : failure,
      ),
    };
  }
  function populateDeviceSelects() {
    if (!Array.isArray(window.allDevices) && typeof allDevices === "undefined")
      return;
    const devices =
      typeof allDevices !== "undefined" && Array.isArray(allDevices)
        ? allDevices
        : [];
    ["diagnosisDevice", "impactDevice"].forEach((id) => {
      const select = byId(id);
      if (!select) return;
      const previous = select.value;
      select.innerHTML = "";
      if (!devices.length) {
        select.add(new Option("No devices loaded", ""));
        return;
      }
      devices.forEach((d, i) => {
        const x = deviceLabel(d, i);
        const opt = new Option(`${x.id} — ${x.failure}`, String(i));
        select.add(opt);
      });
      if (previous && Number(previous) < devices.length)
        select.value = previous;
    });
  }
  function chosenDevice(selectId) {
    const select = byId(selectId);
    if (!select || select.value === "") return null;
    const i = Number(select.value);
    return (typeof allDevices !== "undefined" && allDevices[i]) || null;
  }
  function safeText(value) {
    return String(value ?? "N/A").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  }
  function tag(severity) {
    const cls =
      severity === "CRITICAL"
        ? "critical"
        : severity === "WARNING"
          ? "warning"
          : "healthy";
    return `<span class="diagnosis-tag ${cls}">${safeText(severity)}</span>`;
  }
  function renderDiagnosis() {
    const d = chosenDevice("diagnosisDevice"),
      out = byId("diagnosisOutput");
    if (!d) {
      out.innerHTML =
        "<p>No device selected. Check that the backend is running and device data has loaded.</p>";
      return;
    }
    const label = deviceLabel(d, 0),
      m = metricSnapshot(d),
      r = calculateRisk(m);
    const rawType =
      d.faultType ??
      d.failure_type ??
      d.Failure_Type ??
      d.failureType ??
      "Unknown";
    const metrics = [
      ["CPU", m.cpu, "%"],
      ["Memory", m.memory, "%"],
      ["Battery", m.battery, "%"],
      ["Latency", m.latency, " ms"],
      ["Packet loss", m.packetLoss, "%"],
      ["Temperature", m.temperature, "°C"],
      ["Errors", m.errors, ""],
    ];
    const available = metrics.filter((x) => x[1] !== null);
    const evidence = r.evidence.length
      ? r.evidence.map((x) => `<li>${safeText(x)}</li>`).join("")
      : "<li>No configured warning thresholds exceeded in the available metrics.</li>";
    out.innerHTML = `<h4>Device ${safeText(label.id)} — Diagnosis</h4>${tag(r.severity)}<span class="diagnosis-tag">Dataset label: ${safeText(typeof rawType === "number" && window.failureName ? window.failureName(rawType) : rawType)}</span><p><strong>Rule-based risk estimate:</strong> ${r.risk}/100</p><p><strong>Likely issue:</strong> ${safeText(r.diagnosis)}</p><p><strong>Evidence:</strong></p><ul>${evidence}</ul><p><strong>Suggested next step:</strong> ${safeText(r.recommendation)}</p><p><strong>Available metrics:</strong> ${available.length ? available.map((x) => `${safeText(x[0])}: ${safeText(x[1])}${x[2]}`).join(" · ") : "No matching numeric metrics found in this API record."}</p><p class="simulation-note">This is a transparent threshold-based explanation, not a trained ML prediction. Missing metrics are not treated as measured values.</p>`;
  }
  function renderImpact() {
    const d = chosenDevice("impactDevice"),
      out = byId("impactOutput");
    if (!d) {
      out.innerHTML =
        "<p>No device selected. Check that the backend is running and device data has loaded.</p>";
      return;
    }
    const devices = typeof allDevices !== "undefined" ? allDevices : [];
    const idx = devices.indexOf(d),
      label = deviceLabel(d, idx),
      type =
        d.faultType ??
        d.failure_type ??
        d.Failure_Type ??
        d.failureType ??
        "Unknown";
    // The dataset has no guaranteed physical links. Model a clearly-labelled logical ring for impact demonstration.
    const n = devices.length,
      neighborIndexes =
        n > 1
          ? [(idx - 1 + n) % n, (idx + 1) % n].filter(
              (v, i, a) => v !== idx && a.indexOf(v) === i,
            )
          : [];
    const neighbors = neighborIndexes.map((i) => ({
      device: devices[i],
      index: i,
      label: deviceLabel(devices[i], i),
    }));
    const failed =
      String(type).toLowerCase() !== "normal" && String(type) !== "0";
    out.innerHTML = `<h4>Impact estimate for device ${safeText(label.id)}</h4>${tag(failed ? "WARNING" : "HEALTHY")}<div class="impact-stats"><div class="impact-stat"><span>Selected device</span><strong>${safeText(label.id)}</strong></div><div class="impact-stat"><span>Illustrative logical neighbours</span><strong>${neighbors.length}</strong></div><div class="impact-stat"><span>Current dataset status</span><strong>${safeText(typeof type === "number" && window.failureName ? window.failureName(type) : type)}</strong></div></div><p><strong>Potentially affected logical neighbours:</strong></p>${neighbors.length ? `<ul>${neighbors.map((x) => `<li>${safeText(x.label.id)} — ${safeText(x.label.failure)}</li>`).join("")}</ul>` : "<p>No neighbours available in the loaded device list.</p>"}<p><strong>Interpretation:</strong> ${failed ? "If this device failure affects the logical path, adjacent nodes may experience degraded connectivity; verify actual link dependencies before taking action." : "No failure label is currently recorded for this device. This is a hypothetical blast-radius view, not proof of physical connectivity."}</p><p class="simulation-note">Important: these neighbours are illustrative (previous/next record), not discovered network links. Real impact analysis requires authoritative topology edges from the backend.</p>`;
  }
  function initAdvanced() {
    if (byId("simulationLab")) {
      metricControls.forEach(([input]) =>
        byId(input)?.addEventListener("input", renderSimulation),
      );
      byId("resetSimulation")?.addEventListener("click", () => {
        Object.entries(defaults).forEach(([id, v]) => (byId(id).value = v));
        renderSimulation();
      });
      renderSimulation();
    }
    byId("runDiagnosis")?.addEventListener("click", renderDiagnosis);
    byId("runImpact")?.addEventListener("click", renderImpact);
    populateDeviceSelects();
    // Existing dashboard loads data asynchronously; refresh selectors after its fetch has completed.
    let attempts = 0;
    const refresh = () => {
      populateDeviceSelects();
      attempts++;
      if (
        attempts < 20 &&
        typeof allDevices !== "undefined" &&
        !allDevices.length
      )
        setTimeout(refresh, 500);
    };
    refresh();
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", initAdvanced);
  else initAdvanced();
})();
