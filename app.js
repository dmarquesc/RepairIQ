











normalized.includes("firmware") &&
(normalized.includes("mismatch") ||
normalized.includes("incompat"));
const hasTester =
normalized.includes("timeout") ||
normalized.includes("tester");
let category = "General HGX failure";
let ruleId = "HGX-GENERAL-000";
let title = "HGX diagnostic review required";
let recommendation = "Review the complete log and escalate for technical review.";
let confidence = 62;
if (hasThreshold) {
category = "GPU thermal / performance threshold";
ruleId = RULESET.gpuThreshold.id;
title = `${affectedGpu} MLE threshold failure`;
if (difference !== null && difference < 1) {
recommendation = "Reseat the affected GPU and retest before replacement.";
confidence = 94;
} else {
recommendation = "Isolate the affected GPU and prepare for replacement review.";
confidence = 91;
}
} else if (hasPcie) {
category = "PCIe link-width failure";
ruleId = RULESET.pcie.id;
title = "PCIe connectivity failure";
recommendation = "Verify configuration, reseat the device, and isolate the slot.";
confidence = 87;
} else if (hasFirmware) {
category = "Firmware compatibility issue";
ruleId = RULESET.firmware.id;
title = "Firmware mismatch detected";
recommendation = "Validate the firmware matrix and obtain authorization before flashing.";
confidence = 89;
} else if (hasTester) {
category = "Tester or execution failure";
ruleId = RULESET.tester.id;
title = "Tester-related failure suspected";
recommendation = "Validate tester state, permissions, calibration, and repeatability.";
confidence = 81;
}
const evidence = [];
if (hasThreshold) {
evidence.push(
`MLE_GPU_AVG exceeds the specified threshold on ${affectedGpu}.`
);
}
if (adjustedValue !== null && failureLimit !== null) {
evidence.push(
`Adjusted value ${adjustedValue.toFixed(2)} exceeds failure limit ${failureLimit.toFixed(2)}.`
);
}
if (hasHeartbeat) {
evidence.push(`${affectedGpu} did not receive heartbeat.`);
}
if (hasPower) {
evidence.push(`${affectedGpu} power is below the specified limit.`);
}
if (hasPcie) {
evidence.push("PCIe link or width-related failure detected.");
}
if (hasFirmware) {
evidence.push("Firmware compatibility or version mismatch detected.");
}
if (hasTester) {
evidence.push("Tester timeout or execution instability detected.");
}
if (evidence.length === 0) {
evidence.push("Log requires additional technician review.");
}
const actions = buildRecommendedActions({
hasThreshold,
difference,
affectedGpu,
hasHeartbeat,
hasPower,
hasPcie,
hasFirmware,
hasTester
});
return {
caseId: createCaseId(),
product: $("#product-model").value,
category,
ruleId,
title,
affectedComponent: affectedGpu,
confidence,
adjustedValue,
failureLimit,
difference,
evidence,
actions,
technician: $("#technician-name").value,
tester: $("#tester-name").value,
notes: $("#technician-notes").value
};
}
function buildRecommendedActions(data) {
if (data.hasThreshold) {
const actions = [
`Reseat ${data.affectedGpu}.`,
"Run the approved HGX retest procedure."
];
if (data.difference !== null && data.difference < 1) {
actions.push(
`If the failure remains, swap ${data.affectedGpu} with another GPU to determine whether the
failure follows the component.`
);
} else {
actions.push(
`Isolate ${data.affectedGpu} and prepare a qualified replacement review.`
);
}
actions.push(
"If the failure remains in the original slot, evaluate the baseboard or slot."
);
return actions;
}
if (data.hasPcie) {
return [
"Verify product configuration and expected PCIe topology.",
"Reseat the affected device.",
"Retest the unit.",
"If the failure remains, isolate the card and slot.",
"Escalate before replacement if the failure does not follow the component."
];
}
if (data.hasFirmware) {
return [
"Confirm the exact product model and configuration.",
"Compare installed versions with the approved firmware matrix.",
"Obtain authorization before any firmware action.",
"Retest after the approved action.",
"Document the version and result."
];
}
if (data.hasTester) {
return [
"Verify tester identity and operating status.",
"Check permissions, calibration, and test-script version.",
"Repeat the test using an approved tester if available.",
"Do not replace hardware until tester-related causes are excluded.",
"Escalate if the failure is not repeatable."
];
}
return [
"Review the complete failure log.",
"Confirm product identity and configuration.",
"Use the approved repair guide.",
"Retest or isolate the suspected component.",
"Escalate if the root cause remains uncertain."
];
}
function renderAnalysis(analysis) {
const resultPanel = $("#result-panel");
const calculation =
analysis.adjustedValue !== null &&
analysis.failureLimit !== null
? `
<div class="calculation-box">
<div class="label">Decision calculation</div>
<code>
${analysis.adjustedValue.toFixed(2)}
−
${analysis.failureLimit.toFixed(2)}
=
${analysis.difference.toFixed(2)}
</code>
</div>
`
: "";
const evidenceHtml = analysis.evidence
.map(
(item) => `
<div class="evidence-item">
<span class="evidence-check">✓</span>
<span>${escapeHtml(item)}</span>
</div>
`
)
.join("");
const actionsHtml = analysis.actions
.map(
(item, index) => `
<div class="action-item">
<span class="action-number">${index + 1}</span>
<span>${escapeHtml(item)}</span>
</div>
`
)
.join("");
resultPanel.innerHTML = `
<div class="result-content">
<div class="result-header">
<div>
<div class="eyebrow">${analysis.ruleId}</div>
<h3>${escapeHtml(analysis.title)}</h3>
</div>
<div class="confidence-box">
<strong>${analysis.confidence}%</strong>
<span>Evidence score</span>
</div>
</div>
<div class="result-summary">
<div class="label">Primary suspected issue</div>
<p>
${escapeHtml(analysis.category)} involving
<strong>${escapeHtml(analysis.affectedComponent)}</strong>.
Recommended next step:
<strong>${escapeHtml(analysis.actions[0])}</strong>
</p>
</div>
${calculation}
<div class="subsection-title">Supporting evidence</div>
<div class="evidence-list">
${evidenceHtml}
</div>
<div class="subsection-title">Recommended repair path</div>
<div class="action-list">
${actionsHtml}
</div>
<div class="approval-banner">
<div>⚠</div>
<div>
<strong>Human approval required</strong>
<span>
RepairIQ provides a recommendation only. A qualified technician or
reviewer must approve replacement, firmware action, destructive
testing, escalation, and final disposition.
</span>
</div>
</div>
<div class="result-actions">
<button class="primary-button" id="accept-recommendation-button">
Accept Recommendation
</button>
<button class="secondary-button" id="modify-recommendation-button">
Modify / Escalate
</button>
<button class="secondary-button" id="export-summary-button">
Export Summary
</button>
</div>
</div>
`;
$("#accept-recommendation-button").addEventListener("click", () => {
saveAnalyzedCase("Completed");
showToast("Recommendation accepted and case saved.");
});
$("#modify-recommendation-button").addEventListener("click", () => {
saveAnalyzedCase("Escalated");
showToast("Case saved for technical review.");
});
$("#export-summary-button").addEventListener("click", () => {
exportSummary(analysis);
});
}
/* -----------------------------
Cases
----------------------------- */
function initializeCaseHistory() {
$("#case-search").addEventListener("input", renderCases);
$("#case-filter").addEventListener("change", renderCases);
$("#clear-cases-button").addEventListener("click", () => {
const confirmed = window.confirm(
"Clear locally stored prototype cases?"
);
if (!confirmed) return;
localStorage.removeItem("repairiq-cases");
renderCases();
renderActivity();
showToast("Local case history cleared.");
});
}
function getCases() {
const stored = localStorage.getItem("repairiq-cases");
if (stored) {
try {
return JSON.parse(stored);
} catch {
return DEFAULT_CASES;
}
}
return DEFAULT_CASES;
}
function saveAnalyzedCase(status) {
if (!currentAnalysis) return;
const cases = getCases();
const newCase = {
id: currentAnalysis.caseId,
product: currentAnalysis.product,
issue: currentAnalysis.title,
component: currentAnalysis.affectedComponent,
recommendation: currentAnalysis.actions[0],
status,
timestamp: "Just now"
};
cases.unshift(newCase);
localStorage.setItem(
"repairiq-cases",
JSON.stringify(cases.slice(0, 40))
);
renderCases();
renderActivity();
}
function renderCases() {
const body = $("#case-table-body");
if (!body) return;
const search =
($("#case-search")?.value || "").toLowerCase();
const filter =
$("#case-filter")?.value || "all";
const cases = getCases().filter((item) => {
const matchesSearch =
!search ||
Object.values(item)
.join(" ")
.toLowerCase()
.includes(search);
const matchesFilter =
filter === "all" ||
item.status === filter;
return matchesSearch && matchesFilter;
});
if (cases.length === 0) {
body.innerHTML = `
<tr>
<td colspan="6" style="text-align:center;color:#8998b2;padding:32px;">
No matching cases found.
</td>
</tr>
`;
return;
}
body.innerHTML = cases
.map(
(item) => `
<tr>
<td class="table-case-id">${escapeHtml(item.id)}</td>
<td>${escapeHtml(item.product)}</td>
<td>${escapeHtml(item.issue)}</td>
<td>${escapeHtml(item.component)}</td>
<td>${escapeHtml(item.recommendation)}</td>
<td>
<span class="table-status ${item.status.toLowerCase()}">
${escapeHtml(item.status)}
</span>
</td>
</tr>
`
)
.join("");
}
function renderActivity() {
const activityList = $("#activity-list");
if (!activityList) return;
const cases = getCases().slice(0, 4);
activityList.innerHTML = cases
.map(
(item) => `
<div class="activity-item">
<div class="activity-icon"> </div>
<div>
<strong>${escapeHtml(item.issue)}</strong>
<small>${escapeHtml(item.id)} · ${escapeHtml(item.component)}</small>
</div>
<span class="activity-time">${escapeHtml(item.timestamp)}</span>
</div>
`
)
.join("");
}
/* -----------------------------
Buttons
----------------------------- */
function initializeButtons() {
$("#start-analysis-button").addEventListener("click", () => {
switchView("analyzer");
});
$("#view-demo-button").addEventListener("click", () => {
switchView("analyzer");
loadDemoCase();
});
$("#load-demo-button").addEventListener("click", () => {
switchView("analyzer");
loadDemoCase();
});
}
/* -----------------------------
Export
----------------------------- */
function exportSummary(analysis) {
const summary = `
REPAIRIQ AI REPAIR INTELLIGENCE PLATFORM
HGX REPAIR ANALYSIS SUMMARY
----------------------------------------
Case ID: ${analysis.caseId}
Product: ${analysis.product}
Technician: ${analysis.technician}
Tester: ${analysis.tester}
PRIMARY SUSPECTED ISSUE
${analysis.title}
CATEGORY
${analysis.category}
AFFECTED COMPONENT
${analysis.affectedComponent}
EVIDENCE SCORE
${analysis.confidence}%
SUPPORTING EVIDENCE
${analysis.evidence.map((item, index) => `${index + 1}. ${item}`).join("\n")}
RECOMMENDED REPAIR PATH
${analysis.actions.map((item, index) => `${index + 1}. ${item}`).join("\n")}
CONTROL NOTICE
This is an AI-generated recommendation. Technician approval is required
before replacement, firmware action, destructive testing, escalation, or
final disposition.
Generated by RepairIQ prototype.
`.trim();
const blob = new Blob([summary], {
type: "text/plain;charset=utf-8"
});
const url = URL.createObjectURL(blob);
const link = document.createElement("a");
link.href = url;
link.download = `${analysis.caseId}-repair-summary.txt`;
link.click();
URL.revokeObjectURL(url);
showToast("Repair summary exported.");
}
/* -----------------------------
Utilities
----------------------------- */
function createCaseId() {
const date = new Date();
const stamp = [
date.getFullYear(),
String(date.getMonth() + 1).padStart(2, "0"),
String(date.getDate()).padStart(2, "0")
].join("");
const random = Math.floor(100 + Math.random() * 900);
return `CASE-${stamp}-${random}`;
}
function escapeHtml(value) {
return String(value)
.replaceAll("&", "&amp;")
.replaceAll("<", "&lt;")
.replaceAll(">", "&gt;")
.replaceAll('"', "&quot;")
.replaceAll("'", "&#039;");
}
let toastTimer;
function showToast(message) {
const toast = $("#toast");
const toastMessage = $("#toast-message");
toastMessage.textContent = message;
toast.classList.add("show");
clearTimeout(toastTimer);
toastTimer = setTimeout(() => {
toast.classList.remove("show");
}, 3000);
}
5. GitHub Pages Deployment Workflow
Create:
.github/workflows/deploy.yml
Paste:
name: Deploy RepairIQ to GitHub Pages
on:
push:
branches:
- main
workflow_dispatch:
permissions:
contents: read
pages: write
id-token: write
concurrency:
group: pages
cancel-in-progress: true
jobs:
deploy:
environment:
name: github-pages
url: ${{ steps.deployment.outputs.page_url }}
runs-on: ubuntu-latest
steps:
- name: Checkout
uses: actions/checkout@v4
- name: Configure GitHub Pages
uses: actions/configure-pages@v5
- name: Upload static files
uses: actions/upload-pages-artifact@v3
with:
path: .
- name: Deploy to GitHub Pages
id: deployment
uses: actions/deploy-pages@v4
GitHub’s documentation supports deploying static sites with a GitHub Actions workflow and the
Pages deployment actions. (
docs.github.com
)