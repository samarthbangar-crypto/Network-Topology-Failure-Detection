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

        const progress = Math.min(
            (currentTime - startTime) / duration,
            1
        );

        const eased =
            1 - Math.pow(1 - progress, 3);

        const value =
            Math.floor(start + (target - start) * eased);

        element.textContent =
            value.toLocaleString();

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
    if (
        typeof rawFailure === "number" ||
        !isNaN(Number(rawFailure))
    ) {

        failureType = Number(rawFailure);

    } else {

        // Backend sends failure type as text
        const text =
            String(rawFailure)
                .trim()
                .toLowerCase();

        if (text === "normal") {
            failureType = 0;
        }
        else if (text.includes("battery")) {
            failureType = 1;
        }
        else if (text.includes("cpu")) {
            failureType = 2;
        }
        else if (text.includes("network")) {
            failureType = 3;
        }
        else if (text.includes("overheat")) {
            failureType = 4;
        }
        else {
            failureType = 0;
        }
    }

    const id =
        device.deviceId ??
        device.Device_ID ??
        device.device_id ??
        device.id;

    return {
        ...device,

        deviceId: Number(id),

        failureType: failureType
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

    return Number(type) === 0
        ? "Low"
        : "High";
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

        const response =
            await fetch(`${API_BASE}/api/devices`);

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const data =
            await response.json();

        if (Array.isArray(data)) {

            allDevices =
                data.map(normalizeDevice);

        } else if (Array.isArray(data.devices)) {

            allDevices =
                data.devices.map(normalizeDevice);

        } else {

            console.error(
                "Unexpected device API response:",
                data
            );

            allDevices = [];
        }

        calculateStatistics();

        renderFailureDistribution();

        renderFailureSummary();

        setupDeviceTable();

        updateHeroStatistics();

    } catch (error) {

        console.error(
            "Device API error:",
            error
        );

        showDeviceApiError(error);
    }
}


/* =========================================================
   STATISTICS
========================================================= */

function calculateStatistics() {

    const total =
        allDevices.length;

    const normal =
        allDevices.filter(
            device => device.failureType === 0
        ).length;

    const failed =
        total - normal;

    const healthRate =
        total > 0
            ? (normal / total) * 100
            : 0;


    animateNumber(
        document.getElementById("totalDevices"),
        total
    );

    animateNumber(
        document.getElementById("normalDevices"),
        normal
    );

    animateNumber(
        document.getElementById("failedDevices"),
        failed
    );


    animateNumber(
        document.getElementById("healthRate"),
        Math.round(healthRate)
    );


    const overallScore =
        document.getElementById(
            "overallHealthScore"
        );

    if (overallScore) {

        overallScore.textContent =
            `${Math.round(healthRate)}%`;
    }


    const healthBar =
        document.getElementById(
            "overallHealthBar"
        );

    if (healthBar) {

        setTimeout(() => {

            healthBar.style.width =
                `${healthRate}%`;

        }, 200);
    }
}


/* =========================================================
   HERO STATISTICS
========================================================= */

function updateHeroStatistics() {

    const total =
        allDevices.length;

    const failed =
        allDevices.filter(
            device => device.failureType !== 0
        ).length;

    const normal =
        total - failed;

    const health =
        total > 0
            ? (normal / total) * 100
            : 0;


    const heroDevices =
        document.getElementById(
            "heroDevices"
        );

    const heroFailures =
        document.getElementById(
            "heroFailures"
        );

    const heroHealth =
        document.getElementById(
            "heroHealth"
        );


    if (heroDevices) {

        heroDevices.textContent =
            `${total.toLocaleString()}+`;
    }


    if (heroFailures) {

        heroFailures.textContent =
            `${failed.toLocaleString()}+`;
    }


    if (heroHealth) {

        heroHealth.textContent =
            `${health.toFixed(1)}%`;
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
        "Overheat Failure": 0
    };


    allDevices.forEach(device => {

        const name =
            failureName(
                device.failureType
            );

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

    const container =
        document.getElementById(
            "failureDistribution"
        );

    if (!container) return;

    const counts =
        getFailureCounts();

    const max =
        Math.max(
            ...Object.values(counts),
            1
        );


    container.innerHTML = "";


    Object.entries(counts).forEach(
        ([name, count], index) => {

            const row =
                document.createElement("div");

            row.className =
                "failure-row";


            const top =
                document.createElement("div");

            top.className =
                "failure-row-top";


            const label =
                document.createElement("span");

            label.textContent =
                name;


            const value =
                document.createElement("strong");

            value.textContent =
                count.toLocaleString();


            top.appendChild(label);
            top.appendChild(value);


            const track =
                document.createElement("div");

            track.className =
                "failure-track";


            const bar =
                document.createElement("div");

            bar.className =
                `failure-bar ${getFailureBarClass(name)}`;


            track.appendChild(bar);

            row.appendChild(top);
            row.appendChild(track);

            container.appendChild(row);


            setTimeout(() => {

                bar.style.width =
                    `${(count / max) * 100}%`;

            }, 100 + index * 100);
        }
    );
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

    const counts =
        getFailureCounts();

    const total =
        allDevices.length || 1;


    const map = {

        Normal: [
            "summaryNormal",
            "summaryNormalBar"
        ],

        "CPU Failure": [
            "summaryCPU",
            "summaryCPUBar"
        ],

        "Network Failure": [
            "summaryNetwork",
            "summaryNetworkBar"
        ],

        "Battery Failure": [
            "summaryBattery",
            "summaryBatteryBar"
        ],

        "Overheat Failure": [
            "summaryOverheat",
            "summaryOverheatBar"
        ]
    };


    Object.entries(map).forEach(
        ([name, ids]) => {

            const count =
                counts[name] || 0;

            const value =
                document.getElementById(
                    ids[0]
                );

            const bar =
                document.getElementById(
                    ids[1]
                );


            if (value) {

                animateNumber(
                    value,
                    count,
                    900
                );
            }


            if (bar) {

                setTimeout(() => {

                    bar.style.width =
                        `${(count / total) * 100}%`;

                }, 150);
            }

        }
    );
}


/* =========================================================
   DEVICE TABLE
========================================================= */

function setupDeviceTable() {

    const search =
        document.getElementById(
            "deviceSearch"
        );

    const filter =
        document.getElementById(
            "failureFilter"
        );


    if (search) {

        search.addEventListener(
            "input",
            () => {

                currentPage = 1;

                renderDeviceTable();
            }
        );
    }


    if (filter) {

        filter.addEventListener(
            "change",
            () => {

                currentPage = 1;

                renderDeviceTable();
            }
        );
    }


    renderDeviceTable();
}


function getFilteredDevices() {

    const search =
        document.getElementById(
            "deviceSearch"
        )?.value
        .trim()
        .toLowerCase() || "";


    const filter =
        document.getElementById(
            "failureFilter"
        )?.value || "all";


    return allDevices.filter(
        device => {

            const idMatch =
                String(
                    device.deviceId
                ).includes(search);


            const failure =
                failureName(
                    device.failureType
                );


            const filterMatch =
                filter === "all"
                || failure === filter;


            return idMatch && filterMatch;
        }
    );
}


function renderDeviceTable() {

    const tbody =
        document.getElementById(
            "deviceTableBody"
        );

    if (!tbody) return;


    const filtered =
        getFilteredDevices();


    const totalPages =
        Math.max(
            1,
            Math.ceil(
                filtered.length /
                rowsPerPage
            )
        );


    if (currentPage > totalPages) {
        currentPage = totalPages;
    }


    const start =
        (currentPage - 1) *
        rowsPerPage;


    const visible =
        filtered.slice(
            start,
            start + rowsPerPage
        );


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


    visible.forEach(device => {

        const failure =
            failureName(
                device.failureType
            );

        const severity =
            failureSeverity(
                device.failureType
            );


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                <strong>
                    ${device.deviceId}
                </strong>
            </td>

            <td>

                <span class="status-badge
                    ${device.failureType === 0
                        ? "normal"
                        : "failed"}">

                    ${device.failureType === 0
                        ? "NORMAL"
                        : "FAILED"}

                </span>

            </td>

            <td>
                ${failure}
            </td>

            <td>

                <span class="
                    ${severity === "High"
                        ? "severity-high"
                        : "severity-low"}">

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

    const container =
        document.getElementById(
            "pagination"
        );

    if (!container) return;

    container.innerHTML = "";


    if (totalPages <= 1) {
        return;
    }


    for (
        let page = 1;
        page <= totalPages;
        page++
    ) {

        const button =
            document.createElement(
                "button"
            );

        button.className =
            "page-button";


        if (page === currentPage) {
            button.classList.add(
                "active"
            );
        }


        button.textContent =
            page;


        button.onclick = () => {

            currentPage =
                page;

            renderDeviceTable();

            document
                .getElementById(
                    "devices"
                )
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
        };


        container.appendChild(button);

    }
}


/* =========================================================
   DEVICE DETAILS MODAL
========================================================= */

function showDeviceDetails(deviceId) {

    const device =
        allDevices.find(
            item =>
                item.deviceId === Number(deviceId)
        );

    if (!device) {
        console.error(
            "Device not found:",
            deviceId
        );
        return;
    }

    const modal =
        document.getElementById("deviceModal");

    const modalId =
        document.getElementById("modalDeviceId");

    const content =
        document.getElementById(
            "modalDeviceContent"
        );

    if (!modal || !modalId || !content) {
        return;
    }

    const failure =
        failureName(device.failureType);

    const severity =
        failureSeverity(device.failureType);

    const failed =
        device.failureType !== 0;


    modalId.textContent =
        `Device ${device.deviceId}`;


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

                    ${failed
                        ? "● FAILURE DETECTED"
                        : "● NORMAL"}

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
                    ${failed
                        ? "severity-high"
                        : "severity-low"}
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
                        [
                            "cpuUsage",
                            "CPU_Usage (%)",
                            "CPU_Usage"
                        ],
                        "%"
                    )}
                </strong>

                <div class="metric-track">

                    <div
                        class="metric-progress cpu"
                        style="
                            width:${getPercentage(
                                device,
                                [
                                    "cpuUsage",
                                    "CPU_Usage (%)",
                                    "CPU_Usage"
                                ]
                            )}%;
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
                        [
                            "memoryUsage",
                            "Memory_Usage (%)",
                            "Memory_Usage"
                        ],
                        "%"
                    )}
                </strong>

                <div class="metric-track">

                    <div
                        class="metric-progress memory"
                        style="
                            width:${getPercentage(
                                device,
                                [
                                    "memoryUsage",
                                    "Memory_Usage (%)",
                                    "Memory_Usage"
                                ]
                            )}%;
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
                        [
                            "batteryLevel",
                            "Battery_Level (%)",
                            "Battery_Level"
                        ],
                        "%"
                    )}
                </strong>

                <div class="metric-track">

                    <div
                        class="metric-progress battery"
                        style="
                            width:${getPercentage(
                                device,
                                [
                                    "batteryLevel",
                                    "Battery_Level (%)",
                                    "Battery_Level"
                                ]
                            )}%;
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
                            "Network_Latency"
                        ],
                        " ms"
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
                        [
                            "packetLoss",
                            "Packet_Loss (%)",
                            "Packet_Loss"
                        ],
                        "%"
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
                        [
                            "temperature",
                            "Temperature (°C)",
                            "Temperature"
                        ],
                        " °C"
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
                        [
                            "uptime",
                            "Uptime (hrs)",
                            "Uptime"
                        ],
                        " hrs"
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
                        [
                            "workloadIntensity",
                            "Workload_Intensity"
                        ],
                        ""
                    )}
                </strong>

            </div>


            <!-- ERROR COUNT -->

            <div class="modal-metric">

                <span>
                    Error Count
                </span>

                <strong>
                    ${getDeviceValue(
                        device,
                        [
                            "errorCount",
                            "Error_Count"
                        ],
                        ""
                    )}
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
                    ${failed
                        ? "Failure Condition Detected"
                        : "Device Operating Normally"}
                </strong>

                <p>

                    ${failed
                        ? `The dataset identifies this device
                           with <strong>${failure}</strong>.
                           Severity level is
                           <strong>${severity}</strong>.`
                        : `No failure condition is recorded
                           for this device in the dataset.`}

                </p>

            </div>

        </div>

    `;


    modal.classList.add("active");
}
function getDeviceValue(
    device,
    keys,
    suffix = ""
) {

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


function getNumericDeviceValue(
    device,
    keys
) {

    for (const key of keys) {

        const value =
            device[key];

        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {

            const number =
                parseFloat(value);

            if (!isNaN(number)) {
                return number;
            }
        }
    }

    return 0;
}


function getPercentage(
    device,
    keys
) {

    const value =
        getNumericDeviceValue(
            device,
            keys
        );

    return Math.max(
        0,
        Math.min(
            100,
            value
        )
    );
}

function getValue(device, key, suffix = "") {

    const value =
        device[key] ??
        device[
            key.replace(
                /[A-Z]/g,
                match =>
                    `_${match.toLowerCase()}`
            )
        ];


    if (
        value === undefined ||
        value === null
    ) {

        return "N/A";
    }


    return `${value}${suffix}`;
}


function closeDeviceModal() {

    document
        .getElementById(
            "deviceModal"
        )
        ?.classList.remove(
            "active"
        );
}


document.addEventListener(
    "click",
    event => {

        const modal =
            document.getElementById(
                "deviceModal"
            );


        if (
            event.target === modal
        ) {

            closeDeviceModal();
        }
    }
);


/* =========================================================
   TOPOLOGY
========================================================= */

async function loadTopology() {

    try {

        const response =
            await fetch(
                `${API_BASE}/api/topology`
            );


        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }


        const data =
            await response.json();


        topologyData =
            Array.isArray(data)
                ? data
                : data.topology || [];


        displayTopology();

    } catch (error) {

        console.error(
            "Topology API error:",
            error
        );


        displayTopologyFallback();
    }
}


/* =========================================================
   TOPOLOGY SVG
========================================================= */

function displayTopology() {

    const container =
        document.getElementById(
            "topologyContainer"
        );


    if (!container) {
        return;
    }


    if (
        !topologyData ||
        topologyData.length === 0
    ) {

        displayTopologyFallback();

        return;
    }


    const nodes =
        topologyData.slice(
            0,
            20
        );


    const width = 800;
    const height = 440;


    const positions =
        createTopologyPositions(
            nodes.length,
            width,
            height
        );


    let svg = `

        <svg
            class="topology-svg"
            viewBox="0 0 ${width} ${height}"
            preserveAspectRatio="xMidYMid meet">

    `;


    /* connections */

    for (
        let i = 0;
        i < nodes.length - 1;
        i++
    ) {

        const a =
            positions[i];

        const b =
            positions[i + 1];


        svg += `

            <line
                class="topology-connection"
                x1="${a.x}"
                y1="${a.y}"
                x2="${b.x}"
                y2="${b.y}">
            </line>

        `;
    }


    /* nodes */

    nodes.forEach(
        (node, index) => {

            const position =
                positions[index];


            const deviceId =
                Number(
                    node.deviceId ??
                    node.Device_ID ??
                    node.id ??
                    index + 1
                );


            const status =
                String(
                    node.status ??
                    ""
                ).toLowerCase();


            const faultType =
                node.faultType ??
                node.failureType ??
                "";


            const failed =
                status.includes(
                    "fail"
                )
                ||
                (
                    faultType &&
                    faultType !== "Normal"
                );


            svg += `

                <g
                    class="topology-svg-node"
                    onclick="showTopologyDeviceDetails(${deviceId})">

                    <circle
                        cx="${position.x}"
                        cy="${position.y}"
                        r="25"
                        class="${
                            failed
                                ? "topology-node-failed"
                                : "topology-node-normal"
                        }">
                    </circle>

                    <text
                        x="${position.x}"
                        y="${position.y}"
                        class="topology-node-text">

                        ${deviceId}

                    </text>

                </g>

            `;
        }
    );


    svg += `</svg>`;


    container.innerHTML =
        svg;
}


function createTopologyPositions(
    count,
    width,
    height
) {

    const positions = [];


    const columns = 5;
    const rows =
        Math.ceil(
            count / columns
        );


    const horizontalGap =
        width / (columns + 1);


    const verticalGap =
        height / (rows + 1);


    for (
        let i = 0;
        i < count;
        i++
    ) {

        const row =
            Math.floor(
                i / columns
            );

        const column =
            i % columns;


        positions.push({

            x:
                horizontalGap *
                (column + 1),

            y:
                verticalGap *
                (row + 1)

        });
    }


    return positions;
}


/* =========================================================
   TOPOLOGY FALLBACK
========================================================= */

function displayTopologyFallback() {

    const container =
        document.getElementById(
            "topologyContainer"
        );


    if (!container) {
        return;
    }


    const devices =
        allDevices.slice(
            0,
            20
        );


    if (devices.length === 0) {

        container.innerHTML = `
            <div class="topology-loading">
                No topology data available.
            </div>
        `;

        return;
    }


    topologyData =
        devices.map(
            device => ({

                deviceId:
                    device.deviceId,

                status:
                    device.failureType === 0
                        ? "Normal"
                        : "Failed",

                faultType:
                    failureName(
                        device.failureType
                    )

            })
        );


    displayTopology();
}


/* =========================================================
   TOPOLOGY DEVICE DETAILS
========================================================= */

function showTopologyDeviceDetails(
    deviceId
) {

    const panel =
        document.getElementById(
            "topologyDetails"
        );


    const device =
        allDevices.find(
            item =>
                item.deviceId ===
                Number(deviceId)
        );


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


    const failure =
        failureName(
            device.failureType
        );


    const failed =
        device.failureType !== 0;


    panel.innerHTML = `

        <div class="topology-device-header">

            <span>
                SELECTED DEVICE
            </span>

            <h3>
                Device ${device.deviceId}
            </h3>

            <span class="detail-status
                ${failed
                    ? "failed"
                    : "normal"}">

                ${failed
                    ? "FAILURE DETECTED"
                    : "NORMAL"}

            </span>

        </div>


        <div class="detail-row">
            <span>Status</span>
            <strong>
                ${failed
                    ? "Failed"
                    : "Normal"}
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
                ${failureSeverity(
                    device.failureType
                )}
            </strong>
        </div>


        <div class="detail-row">
            <span>CPU Usage</span>
            <strong>
                ${getValue(
                    device,
                    "cpuUsage",
                    "%"
                )}
            </strong>
        </div>


        <div class="detail-row">
            <span>Memory Usage</span>
            <strong>
                ${getValue(
                    device,
                    "memoryUsage",
                    "%"
                )}
            </strong>
        </div>


        <div class="detail-row">
            <span>Temperature</span>
            <strong>
                ${getValue(
                    device,
                    "temperature",
                    " °C"
                )}
            </strong>
        </div>


        <div class="detail-row">
            <span>Network Latency</span>
            <strong>
                ${getValue(
                    device,
                    "networkLatency",
                    " ms"
                )}
            </strong>
        </div>

    `;
}


/* =========================================================
   API ERROR
========================================================= */

function showDeviceApiError(error) {

    const total =
        document.getElementById(
            "totalDevices"
        );


    if (total) {
        total.textContent = "—";
    }


    console.error(
        "Backend connection failed.",
        error
    );
}


/* =========================================================
   INITIALIZATION
========================================================= */

async function initializeDashboard() {

    console.log(
        "Initializing Network Failure Detection Dashboard..."
    );


    await loadDeviceData();

    await loadTopology();


    console.log(
        "Dashboard initialized."
    );
}


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeDashboard
);