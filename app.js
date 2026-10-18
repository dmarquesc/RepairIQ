/* R.E.X. V5.15 | Hybrid-ready conversation + balanced performance tuning. */
/* R.E.X. V5.14 | Connected GPU Visualization + Local Conversation */
/* R.E.X. V5.13 | GPU Diagnostic Breakdown
   Built on the supplied V5.8. Strengthens LEFT-arm examination pointing
   while preserving RIGHT-arm GPU presentation, face, and application logic.
   Syntax-checked; 3D motion requires browser validation with rex.glb. */
/*

  ================================================================

  REPAIRIQ

  SXM REPAIR INTELLIGENCE COMMAND CENTER

  Version: 1.0 - Multi-Build Repair Intelligence Prototype

  Author: D'Marques Coleman
  Organization: DCENTRIC

  AUDIT PASS v1.0-CORRECTED
  ─────────────────────────
  FIXED:  setActiveView → switchView (3 occurrences, repair floor)
  FIXED:  showToast optional-chaining consistency (repair floor)
  IMPROVED: rex3DApplyLocalRotation — delta-time smoothing
  IMPROVED: rex3DAnimate — opposing hip/torso counter-rotation for
            natural weight shift; arm upper-bound clamp prevents
            backward swing; independent per-side speaking gestures
  IMPROVED: rexV15UpdateFace — micro-saccades, squint-on-blink,
            pupil dilation, cleaner iris fiber detail, no mouth
  IMPROVED: initializeRex3DV11 — cancelAnimationFrame on disposal,
            structured bone-not-found reporting
  IMPROVED: Virtual lab timer — clearInterval on switchView
  ================================================================

*/

"use strict";

/* ================================================================
   1. DEMONSTRATION DATA
   ================================================================ */

const DEMO_LOG = `
HGX TEST EXECUTION REPORT
Product: VULCAN (HGX)
Configuration: 8x SXM GPU / HMC / NVSwitch
Tester: SXM-TESTER-04
Test Date: 2026-09-18

[PASS] GPU0 detected.
[PASS] GPU1 detected.
[PASS] GPU3 detected.
[PASS] GPU4 detected.
[PASS] GPU5 detected.
[PASS] GPU6 detected.

[FAIL] GPU2 HMC_BIST_FAIL
Initialization timeout detected.
[FAIL] GPU2 did not receive heartbeat.
[WARN] HMC retry observed on GPU2.

[PASS] NVSwitch detected.
[PASS] BMC communication established.
[INFO] Firmware compatibility check completed.
[INFO] Test execution completed with failures.
`;

const DEFAULT_CASES = [
  {
    id: "CASE-2026-0918-001",
    travelerId: "TRAVELER-2026-0918-001",
    product: "VULCAN (HGX) / SXM 8-GPU Demo",
    issue: "GPU2 HMC BIST failure",
    component: "GPU2 / HMC",
    recommendation: "Inspect affected path and retest",
    status: "Pending",
    timestamp: "September 18, 2026, 09:42",
    dataSource: "demo",
    failureStage: "INIT / HMC BIST",
    errorCode: "HMC_BIST_FAIL",
    mpPartNumber: "DEMO-MP-PN-0001",
    mpSerialNumber: "DEMO-MP-SN-0001",
    pcbPartNumber: "DEMO-PCB-PN-0001",
    pcbSerialNumber: "DEMO-PCB-SN-0001",
    partsStatus: "Not requested",
    retestResult: "Not run"
  },
  {
    id: "CASE-2026-0917-014",
    travelerId: "TRAVELER-2026-0917-014",
    product: "HGX H100 8-GPU",
    issue: "PCIe link-width failure",
    component: "GPU3 / Slot B3",
    recommendation: "Verify seating and isolate slot",
    status: "Completed",
    timestamp: "September 17, 2026, 16:18",
    dataSource: "demo",
    failureStage: "FLT",
    errorCode: "PCIE_LINK_WIDTH",
    mpPartNumber: "DEMO-MP-PN-0002",
    mpSerialNumber: "DEMO-MP-SN-0002",
    pcbPartNumber: "DEMO-PCB-PN-0002",
    pcbSerialNumber: "DEMO-PCB-SN-0002",
    partsStatus: "Not required",
    retestResult: "Passed"
  },
  {
    id: "CASE-2026-0917-009",
    travelerId: "TRAVELER-2026-0917-009",
    product: "HGX H100 8-GPU",
    issue: "Tester timeout",
    component: "Tester-02",
    recommendation: "Validate tester state",
    status: "Escalated",
    timestamp: "September 17, 2026, 11:07",
    dataSource: "demo",
    failureStage: "Test execution",
    errorCode: "TESTER_TIMEOUT",
    mpPartNumber: "DEMO-MP-PN-0003",
    mpSerialNumber: "DEMO-MP-SN-0003",
    pcbPartNumber: "DEMO-PCB-PN-0003",
    pcbSerialNumber: "DEMO-PCB-SN-0003",
    partsStatus: "Not requested",
    retestResult: "Not run"
  }
];

/* ================================================================
   2. APPLICATION STATE
   ================================================================ */

const state = {
  currentLog: "",
  currentFileName: "",
  currentAnalysis: null,
  activeComponent: "GPU2",
  activeView: "dashboard",
  toastTimer: null,
  confidenceTimer: null,
  lastFocusedElement: null,
  modalOpen: false,
  topology: null,
  knowledgeOutput: null,
  rexMessages: [],
  retestWorkflow: null
};

/* ================================================================
   3. DOM HELPERS
   ================================================================ */

function $(selector, scope = document) {
  return scope.querySelector(selector);
}

function $$(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

function setText(selector, value, scope = document) {
  const element = $(selector, scope);
  if (element) element.textContent = value ?? "";
  return element;
}

function setInputValue(selector, value) {
  const element = $(selector);
  if (element) element.value = value ?? "";
  return element;
}

function getInputValue(selector) {
  return String($(selector)?.value || "").trim();
}

function setHidden(selector, hidden) {
  const element = $(selector);
  if (element) element.hidden = Boolean(hidden);
  return element;
}

function addListener(selector, eventName, handler) {
  const element = $(selector);
  if (element) element.addEventListener(eventName, handler);
  return element;
}

function addListeners(selector, eventName, handler) {
  $$(selector).forEach(element => element.addEventListener(eventName, handler));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function normalizeText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function titleCase(value) {
  return String(value || "").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

/* ================================================================
   4. APPLICATION INITIALIZATION
   ================================================================ */

document.addEventListener("DOMContentLoaded", () => {
  initializeNavigation();
  initializeVirtualTestLab();
  initializeAnalyzer();
  initializeAnalyzerWorkstation();
  initializeTopology();
  initializeCaseHistory();
  initializeButtons();
  initializeModal();
  initializeKeyboardShortcuts();
  initializeRetestWorkflow();
  initializePassportActions();
  initializeExtensionMount();

  renderCases();
  renderActivity();
  renderTopology();
  restoreRetestWorkflow();

  updateSelectedComponent("GPU2");
  updateActiveCaseContext(createInitialCaseContext());
});

/* ================================================================
   5. NAVIGATION
   ================================================================ */

function initializeNavigation() {
  addListeners(".nav-item", "click", event => {
    const viewName = event.currentTarget.dataset.view;
    if (viewName) switchView(viewName);
  });

  addListeners("[data-view-target]", "click", event => {
    const viewName = event.currentTarget.dataset.viewTarget;
    if (viewName) switchView(viewName);
  });
}

function switchView(viewName) {
  const targetView = $(`#${viewName}-view`);
  if (!targetView) {
    showToast(`The ${viewName} view is not available in this prototype.`);
    return;
  }

  /* IMPROVED v1.0-PHASE1: stop virtual lab monitoring timer when leaving */
  if (state.activeView === "tester-lab" && viewName !== "tester-lab") {
    if (virtualLabTimer) {
      clearInterval(virtualLabTimer);
      virtualLabTimer = null;
      const root = $("#tester-lab-view");
      if (root) root.dataset.monitoring = "off";
      const btn = $("#lab-monitor-toggle");
      if (btn) btn.textContent = "Start Demo Monitoring";
    }
  }

  state.activeView = viewName;

  $$(".nav-item").forEach(button => {
    const isActive = button.dataset.view === viewName;
    button.classList.toggle("active", isActive);
    if (isActive) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });

  $$(".view").forEach(view => {
    view.classList.toggle("active", view.id === `${viewName}-view`);
  });

  setText("#page-title", getViewTitle(viewName));

  if (viewName === "analyzer") {
    window.setTimeout(() => $("#diagnostic-search")?.focus(), 0);
  }
}

function getViewTitle(viewName) {
  const titles = {
    dashboard: "Repair Operations Dashboard",
    analyzer: "SXM Log Analyzer",
    "repair-floor": "Repair Floor Digital Twin",
    "tester-lab": "Virtual Test Lab",
    cases: "Case History",
    knowledge: "SXM Knowledge Base",
    rex: "R.E.X. Assistant",
    metrics: "Performance Metrics"
  };
  return titles[viewName] || "RepairIQ";
}

/* ================================================================
   6. KEYBOARD SHORTCUTS
   ================================================================ */

function initializeKeyboardShortcuts() {
  document.addEventListener("keydown", event => {
    const activeTag = document.activeElement?.tagName;
    const isTyping = activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT";

    if (event.key === "/" && !isTyping) {
      event.preventDefault();
      switchView("analyzer");
      $("#diagnostic-search")?.focus();
    }

    if (event.key === "Escape" && state.modalOpen) {
      closeDiagnosticModal();
    }
  });
}

/* ================================================================
   7. ANALYZER INITIALIZATION
   ================================================================ */

function initializeAnalyzer() {
  const dropZone = $("#drop-zone");
  const fileInput = $("#file-input");

  if (dropZone && fileInput) {
    dropZone.addEventListener("click", () => fileInput.click());
    dropZone.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        fileInput.click();
      }
    });
    fileInput.addEventListener("change", event => {
      const file = event.target.files?.[0];
      if (file) readFile(file);
    });
    ["dragenter", "dragover"].forEach(evtName => {
      dropZone.addEventListener(evtName, event => {
        event.preventDefault();
        dropZone.classList.add("dragging");
      });
    });
    ["dragleave", "drop"].forEach(evtName => {
      dropZone.addEventListener(evtName, event => {
        event.preventDefault();
        dropZone.classList.remove("dragging");
      });
    });
    dropZone.addEventListener("drop", event => {
      const file = event.dataTransfer?.files?.[0];
      if (file) readFile(file);
    });
  }

  addListener("#demo-log-button", "click", loadDemoCase);
  addListener("#analyze-button", "click", () => {
    if (!state.currentLog) {
      showToast("Load a test log first.");
      return;
    }
    runAnalysis();
  });

  addListeners(".quick-search-chip", "click", event => {
    const errorCode = event.currentTarget.dataset.errorCode || "";
    setInputValue("#diagnostic-search", errorCode);
    loadDemoCase();
    showToast(`Demonstration pattern loaded: ${errorCode}`);
  });

  addListener("#diagnostic-search-button", "click", () => {
    const searchValue = getInputValue("#diagnostic-search");
    if (!searchValue) {
      showToast("Enter an error code or symptom.");
      return;
    }
    switchView("analyzer");
    loadDemoCase();
    showToast(`Diagnostic pattern loaded: ${searchValue}`);
  });
}

/* ================================================================
   8. LOG FILE HANDLING
   ================================================================ */

function readFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = event => loadLog(String(event.target?.result || ""), file.name || "uploaded-log.txt");
  reader.onerror = () => showToast("Unable to read the selected log file.");
  reader.readAsText(file);
}

function loadLog(logText, fileName = "uploaded-log.txt") {
  state.currentLog = String(logText || "");
  state.currentFileName = fileName;

  const preview = $("#log-preview");
  if (preview) preview.textContent = state.currentLog || "No test log loaded.";

  setText("#log-status", `${fileName} loaded`);
  const status = $("#log-status");
  if (status) status.className = "status-pill ready";

  updateDataSourceLabels(
    fileName.toLowerCase().includes("demo") || fileName.toLowerCase().includes("vulcan")
      ? "Prototype / Demonstration Data"
      : "Uploaded local log"
  );

  showToast("Test log loaded successfully.");
}

/* ================================================================
   9. DEMO CASE LOADING
   ================================================================ */

function loadDemoCase() {
  setInputValue("#product-model", "VULCAN (HGX) / SXM 8-GPU Demo");
  setInputValue("#tester-name", "SXM-TESTER-04");
  setInputValue("#technician-name", "Tech1");
  setInputValue("#technician-notes", "Unit failed during HMC initialization. GPU2 symptoms observed.");
  setInputValue("#unit-serial-input", "DEMO-UNIT-0001");
  setInputValue("#system-serial-input", "DEMO-SYSTEM-0001");
  setInputValue("#part-number-input", "DEMO-PN-0001");
  setInputValue("#assembly-part-number-input", "DEMO-ASM-PN-0001");
  setInputValue("#board-revision-input", "DEMO-REV-A");
  setInputValue("#department-input", "SXM Diagnostics");
  loadLog(DEMO_LOG, "VULCAN_GPU2_demo.log");
  switchView("analyzer");
  showToast("Synthetic SXM demonstration case loaded.");
}

/* ================================================================
   10. ANALYSIS EXECUTION
   ================================================================ */

function runAnalysis() {
  const logStatus = $("#log-status");
  if (logStatus) {
    logStatus.textContent = "Analyzing log...";
    logStatus.className = "status-pill analyzing";
  }
  showAnalysisLoadingState();
  window.setTimeout(() => {
    const analysis = analyzeLog(state.currentLog);
    state.currentAnalysis = analysis;
    renderAnalysis(analysis);
    if (logStatus) {
      logStatus.textContent = "Analysis complete";
      logStatus.className = "status-pill ready";
    }
    showToast("Analysis complete. Technician review required.");
  }, 700);
}

function showAnalysisLoadingState() {
  const emptyResult = $("#empty-diagnostic-result");
  const structuredResult = $("#structured-diagnostic-result");
  if (emptyResult) {
    emptyResult.hidden = false;
    emptyResult.innerHTML = `
      <div class="empty-orb" aria-hidden="true">RI</div>
      <h3>RepairIQ is analyzing the failure</h3>
      <p>Parsing errors, grouping symptoms, calculating evidence, and applying transparent prototype rules.</p>`;
  }
  if (structuredResult) structuredResult.hidden = true;
  const resultPanel = $("#result-panel");
  if (resultPanel) resultPanel.dataset.resultState = "analyzing";
}

/* ================================================================
   11-25. LOG ANALYSIS ENGINE (unchanged from original — preserved)
   ================================================================ */

function analyzeLog(logText) {
  const rawLog = String(logText || "");
  const normalized = rawLog.toLowerCase();
  const lines = rawLog.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const metadata = parseLogMetadata(lines);
  const affectedComponent = detectAffectedComponent(lines);
  const errorCodes = detectErrorCodes(lines);
  const testStages = detectTestStages(lines);
  const testerAssessment = analyzeTesterEvidence(normalized);
  const firmwareAssessment = analyzeFirmwareEvidence(normalized);

  const hasHmcFault =
    normalized.includes("hmc_bist_fail") ||
    (normalized.includes("hmc") && (normalized.includes("initialization") || normalized.includes("heartbeat")));
  const hasPcieFault =
    normalized.includes("pcie") && (normalized.includes("link") || normalized.includes("width") || normalized.includes("lane"));
  const hasTesterFailure = testerAssessment.isFailure;
  const hasFirmwareFailure = firmwareAssessment.isFailure;

  let title = "SXM diagnostic review required";
  let category = "General SXM failure";
  let ruleId = "SXM-GENERAL-000";
  let recommendation = "Review the complete log and escalate for technical review.";
  let actionType = "Controlled diagnostic review";
  let confidence = 62;
  let severity = "REVIEW";

  if (hasHmcFault) {
    title = `${affectedComponent} HMC BIST failure`;
    category = "HMC initialization failure";
    ruleId = "SXM-GPU-001";
    recommendation = `Inspect ${affectedComponent} and the associated HMC path.`;
    actionType = "Component isolation / approved swap test";
    confidence = 94;
    severity = "CRITICAL";
  } else if (hasPcieFault) {
    title = "PCIe connectivity failure";
    category = "PCIe link-width failure";
    ruleId = "SXM-PCI-002";
    recommendation = `Verify configuration and isolate ${affectedComponent}.`;
    actionType = "Configuration verification / isolation";
    confidence = 87;
    severity = "WARNING";
  } else if (hasTesterFailure) {
    title = "Tester-related failure suspected";
    category = "Tester or execution failure";
    ruleId = "SXM-TST-004";
    recommendation = "Validate tester state, permissions, calibration, and repeatability.";
    actionType = "Tester validation";
    confidence = 81;
    severity = "WARNING";
  } else if (hasFirmwareFailure) {
    title = "Firmware compatibility issue suspected";
    category = "Firmware mismatch or compatibility issue";
    ruleId = "SXM-FW-003";
    recommendation = "Validate firmware versions against the approved compatibility matrix.";
    actionType = "Firmware validation";
    confidence = 78;
    severity = "WARNING";
  }

  const supportingEvidence = buildSupportingEvidence({ lines, normalized, affectedComponent, hasHmcFault, hasPcieFault, hasTesterFailure, hasFirmwareFailure, testerAssessment, firmwareAssessment, errorCodes });
  const contradictingEvidence = buildContradictingEvidence({ lines, normalized, hasHmcFault, hasPcieFault, hasTesterFailure, hasFirmwareFailure, testerAssessment, firmwareAssessment });
  const previousActions = inferPreviousActions({ normalized, hasHmcFault });
  const doNotRepeat = buildDoNotRepeatActions(previousActions);
  const rootCauseCandidates = buildRootCauseCandidates({ affectedComponent, hasHmcFault, hasPcieFault, hasTesterFailure, hasFirmwareFailure });
  const confidenceExplanation = buildConfidenceExplanation({ confidence, supportingEvidence, contradictingEvidence, affectedComponent, hasHmcFault, hasPcieFault, hasTesterFailure, hasFirmwareFailure });
  const partsRequest = buildPartsRequest({ affectedComponent, hasHmcFault, hasPcieFault });
  const retest = buildRetestRequirement({ hasHmcFault, hasPcieFault, hasTesterFailure, hasFirmwareFailure, failureStage: testStages.failureStage });
  const handoff = buildShiftHandoff({ affectedComponent, title, recommendation, previousActions, doNotRepeat, partsRequest, retest });
  const caseId = createCaseId();
  const travelerId = createTravelerId();

  return {
    caseId, travelerId,
    dataSource: isDemoLog(rawLog) ? "Prototype / Demonstration Data" : "Uploaded local log",
    caseState: "DIAGNOSIS READY",
    product: getInputValue("#product-model") || metadata.product || "Unknown product",
    title, category, ruleId, severity, recommendation, actionType, affectedComponent, confidence, confidenceExplanation,
    technician: getInputValue("#technician-name") || "Technician not identified",
    tester: getInputValue("#tester-name") || metadata.tester || "Tester not identified",
    notes: getInputValue("#technician-notes"),
    metadata,
    failure: { title, category, ruleId, severity, errorCode: errorCodes[0] || "UNSPECIFIED", failureStage: testStages.failureStage, affectedComponent },
    unit: {
      mpPartNumber: getInputValue("#part-number-input") || "DEMO-MP-PN-0001",
      mpSerialNumber: getInputValue("#unit-serial-input") || "DEMO-MP-SN-0001",
      pcbPartNumber: getInputValue("#part-number-input") || "DEMO-PCB-PN-0001",
      pcbSerialNumber: getInputValue("#system-serial-input") || "DEMO-PCB-SN-0001",
      systemSerialNumber: getInputValue("#system-serial-input") || "DEMO-SYSTEM-0001",
      unitSerialNumber: getInputValue("#unit-serial-input") || "DEMO-UNIT-0001",
      partNumber: getInputValue("#part-number-input") || "DEMO-PN-0001",
      assemblyPartNumber: getInputValue("#assembly-part-number-input") || "DEMO-ASM-PN-0001",
      platform: metadata.platform || "H200 / SXM",
      build: metadata.product?.includes("VULCAN") ? "Vulcan-inspired demo" : "Prototype platform",
      boardRevision: getInputValue("#board-revision-input") || "Not supplied",
      department: getInputValue("#department-input") || "SXM Diagnostics"
    },
    testSession: {
      tester: getInputValue("#tester-name") || metadata.tester || "Tester not identified",
      technician: getInputValue("#technician-name") || "Technician not identified",
      testName: metadata.testName || "HGX Test Execution Report",
      testDate: metadata.testDate || "Not supplied",
      failureStage: testStages.failureStage,
      stages: testStages.stages
    },
    evidence: { supporting: supportingEvidence, contradicting: contradictingEvidence, correlated: supportingEvidence, negative: contradictingEvidence },
    history: { previousActions, doNotRepeat },
    reasoning: { candidates: rootCauseCandidates, confidence, confidenceExplanation },
    recommendationDetails: { action: recommendation, actionType, explanation: "This is a controlled diagnostic recommendation. Physical repair decisions remain under technician control.", approvalStatus: "PENDING REVIEW" },
    partsRequest, retest, handoff
  };
}

function parseLogMetadata(lines) {
  const metadata = { product: "", platform: "", tester: "", testDate: "", testName: "" };
  for (const line of lines) {
    if (/^product:/i.test(line)) metadata.product = line.replace(/^product:/i, "").trim();
    if (/^configuration:/i.test(line)) metadata.platform = line.replace(/^configuration:/i, "").trim();
    if (/^tester:/i.test(line)) metadata.tester = line.replace(/^tester:/i, "").trim();
    if (/^test date:/i.test(line)) metadata.testDate = line.replace(/^test date:/i, "").trim();
    if (/test execution report/i.test(line)) metadata.testName = line.trim();
  }
  return metadata;
}

function detectAffectedComponent(lines) {
  const priorityTerms = ["fail","error","critical","threshold","heartbeat","power","timeout","link","fault","bist"];
  const priorityLines = lines.filter(line => {
    const n = line.toLowerCase();
    return priorityTerms.some(t => n.includes(t));
  });
  for (const line of [...priorityLines, ...lines]) {
    const m = line.match(/\bGPU\s?(\d+)\b/i);
    if (m) return `GPU${m[1]}`;
  }
  if (lines.some(l => /hmc/i.test(l))) return "HMC";
  if (lines.some(l => /tester/i.test(l))) return "Tester";
  return "Unresolved component";
}

function detectErrorCodes(lines) {
  const codes = [];
  for (const line of lines) {
    const matches = line.match(/\b[A-Z][A-Z0-9]+(?:_[A-Z0-9]+)+\b/g);
    if (matches) matches.forEach(code => { if (!codes.includes(code)) codes.push(code); });
  }
  return codes;
}

function detectTestStages(lines) {
  const joined = lines.join(" ").toLowerCase();
  const stages = { INIT:"NOT RUN", FLT:"NOT RUN", FLB:"NOT RUN", FCT:"NOT RUN", DCC:"NOT RUN", RIN:"NOT RUN" };
  let failureStage = "Awaiting analysis";
  const explicit = /\b(INIT|FLT|FLB|FCT|DCC|RIN)\b[\s:=-]*(PASS|FAIL|NOT RUN|SKIP|WARN)/gi;
  let m;
  while ((m = explicit.exec(lines.join("\n")))) {
    const stage = m[1].toUpperCase(), result = m[2].toUpperCase();
    stages[stage] = result;
    if (result === "FAIL" && failureStage === "Awaiting analysis") failureStage = stage;
  }
  if (failureStage === "Awaiting analysis" && (joined.includes("initialization") || joined.includes("hmc_bist"))) {
    stages.INIT = "FAIL"; failureStage = "INIT / HMC BIST";
  }
  if (failureStage === "Awaiting analysis" && (joined.includes("pcie") || joined.includes("link-width"))) {
    stages.FLT = "FAIL"; failureStage = "FLT";
  }
  if (failureStage === "Awaiting analysis" && joined.includes("tester")) failureStage = "Test execution";
  return { failureStage, stages };
}

function analyzeTesterEvidence(normalizedLog) {
  const patterns = ["tester timeout","tester failure","tester failed","tester instability","calibration failure","calibration expired","script execution failure","script failed","permission denied","execution aborted","test environment failure"];
  const matched = patterns.filter(p => normalizedLog.includes(p));
  return { isFailure: matched.length > 0, matchedPatterns: matched };
}

function analyzeFirmwareEvidence(normalizedLog) {
  const patterns = ["firmware mismatch","firmware incompatible","firmware incompatibility","invalid firmware","firmware update failed","firmware version conflict","firmware conflict","unsupported firmware"];
  const matched = patterns.filter(p => normalizedLog.includes(p));
  return { isFailure: matched.length > 0, matchedPatterns: matched };
}

function buildSupportingEvidence({ lines, normalized, affectedComponent, hasHmcFault, hasPcieFault, hasTesterFailure, hasFirmwareFailure, testerAssessment, firmwareAssessment, errorCodes }) {
  const evidence = [];
  if (hasHmcFault) {
    const failLine = lines.find(l => /hmc_bist_fail/i.test(l));
    if (failLine) evidence.push({ category:"PRIMARY FAILURE", text: normalizeText(failLine) });
    if (normalized.includes("initialization timeout")) evidence.push({ category:"CORRELATED SIGNAL", text:"Initialization timeout detected." });
    if (normalized.includes("did not receive heartbeat")) evidence.push({ category:"CORRELATED SIGNAL", text:`${affectedComponent} heartbeat activity failed.` });
    if (normalized.includes("hmc retry")) evidence.push({ category:"CORRELATED SIGNAL", text:"HMC retry activity detected." });
  }
  if (hasPcieFault) evidence.push({ category:"PRIMARY FAILURE", text:"PCIe link or width-related failure detected." });
  if (hasTesterFailure) evidence.push({ category:"TESTER SIGNAL", text:`Tester-related signals detected: ${testerAssessment.matchedPatterns.join(", ")}.` });
  if (hasFirmwareFailure) evidence.push({ category:"FIRMWARE SIGNAL", text:`Firmware-related signals detected: ${firmwareAssessment.matchedPatterns.join(", ")}.` });
  if (errorCodes.length > 0) evidence.push({ category:"ERROR CODE", text:`Detected code(s): ${errorCodes.join(", ")}.` });
  if (!evidence.length) evidence.push({ category:"REVIEW", text:"Additional technician review is required." });
  return evidence;
}

function buildContradictingEvidence({ lines, normalized, hasHmcFault, hasPcieFault, hasTesterFailure, hasFirmwareFailure, testerAssessment, firmwareAssessment }) {
  const evidence = [];
  const passedGpus = lines.filter(l => /\[PASS\]\s+GPU\d+\s+detected/i.test(l)).map(l => { const m = l.match(/\bGPU\d+\b/i); return m ? m[0].toUpperCase() : null; }).filter(Boolean);
  if (passedGpus.length > 0) evidence.push({ category:"NEGATIVE EVIDENCE", text:`${passedGpus.join(", ")} detection passed.` });
  if (normalized.includes("nvswitch detected")) evidence.push({ category:"NEGATIVE EVIDENCE", text:"NVSwitch detection passed." });
  if (normalized.includes("bmc communication established")) evidence.push({ category:"NEGATIVE EVIDENCE", text:"BMC communication established." });
  if (normalized.includes("firmware compatibility check completed") && !hasFirmwareFailure) evidence.push({ category:"NEGATIVE EVIDENCE", text:"Firmware compatibility check completed without a direct failure signal." });
  if (!hasTesterFailure) evidence.push({ category:"TESTER SIGNAL", text:"Tester identity was present, but no direct tester failure signal was identified." });
  if (!hasHmcFault && !hasPcieFault && !hasFirmwareFailure) evidence.push({ category:"REVIEW", text:"No dominant failure pattern was established." });
  return evidence;
}

function inferPreviousActions({ normalized, hasHmcFault }) {
  const actions = [];
  if (normalized.includes("reseat")) actions.push({ action:"Component reseat documented", details:"A reseat action was referenced in the available case information.", result:"Documented", timestamp:"Source log or technician notes" });
  if (normalized.includes("firmware compatibility check completed")) actions.push({ action:"Firmware compatibility check", details:"Firmware compatibility validation was documented.", result:"Completed", timestamp:"Source log" });
  if (normalized.includes("bmc communication established")) actions.push({ action:"BMC communication check", details:"BMC communication was established.", result:"Passed", timestamp:"Source log" });
  if (hasHmcFault) actions.push({ action:"Initial test execution", details:"The unit reached an HMC initialization-related failure.", result:"Failed", timestamp:"Source log" });
  return actions;
}

function buildDoNotRepeatActions(previousActions) {
  const guardrails = [];
  const hasReseat = previousActions.some(a => a.action.toLowerCase().includes("reseat"));
  if (hasReseat) guardrails.push({ action:"Do not repeat component reseat", reason:"A reseat was already documented.", exception:"A technician may repeat the action if new evidence or procedure requirements justify it." });
  if (!guardrails.length) guardrails.push({ action:"No automatic repeat-action guardrail", reason:"No repeated troubleshooting action has been documented.", exception:"Technician review remains required before any physical action." });
  return guardrails;
}

function buildRootCauseCandidates({ affectedComponent, hasHmcFault, hasPcieFault, hasTesterFailure, hasFirmwareFailure }) {
  if (hasHmcFault) return [
    { name:affectedComponent, score:94, reason:"Direct failure and correlated heartbeat / initialization signals." },
    { name:"HMC path", score:71, reason:"HMC retry and initialization behavior correlate with the failure." },
    { name:"Tester configuration", score:18, reason:"No direct tester failure signal was identified." },
    { name:"Firmware", score:9, reason:"No direct firmware mismatch or incompatibility signal was identified." }
  ];
  if (hasPcieFault) return [
    { name:affectedComponent, score:87, reason:"Direct PCIe link or width-related failure evidence." },
    { name:"Slot or physical path", score:69, reason:"The failure may involve seating, slot state, or path integrity." },
    { name:"Tester configuration", score:22, reason:"No direct tester execution failure was identified." },
    { name:"Firmware", score:12, reason:"No direct firmware conflict was identified." }
  ];
  if (hasTesterFailure) return [
    { name:"Tester environment", score:81, reason:"Direct tester or execution failure evidence was identified." },
    { name:"Configuration", score:46, reason:"Configuration may contribute to test execution behavior." },
    { name:affectedComponent, score:24, reason:"Hardware failure is not established by the current evidence." },
    { name:"Firmware", score:10, reason:"No direct firmware failure signal was identified." }
  ];
  if (hasFirmwareFailure) return [
    { name:"Firmware compatibility", score:78, reason:"Direct firmware mismatch or compatibility evidence was identified." },
    { name:"Configuration", score:41, reason:"Configuration conflicts may contribute to the observed behavior." },
    { name:affectedComponent, score:25, reason:"Component failure is not established by current evidence." },
    { name:"Tester environment", score:16, reason:"No direct tester failure evidence was identified." }
  ];
  return [
    { name:"Unresolved hardware or configuration issue", score:62, reason:"The available evidence does not establish a dominant cause." },
    { name:"Tester environment", score:24, reason:"Tester failure was not directly established." },
    { name:"Firmware", score:14, reason:"Firmware failure was not directly established." },
    { name:"Unknown", score:8, reason:"Additional evidence is required." }
  ];
}

function buildConfidenceExplanation({ confidence, supportingEvidence, contradictingEvidence, affectedComponent, hasHmcFault, hasPcieFault, hasTesterFailure, hasFirmwareFailure }) {
  const primaryReason = hasHmcFault
    ? `${affectedComponent} appears strongest because direct HMC failure, initialization, heartbeat, and retry signals correlate.`
    : hasPcieFault
      ? `${affectedComponent} appears strongest because direct PCIe link or width-related evidence was identified.`
      : hasTesterFailure
        ? "Tester-related confidence increased because direct execution or calibration evidence was identified."
        : hasFirmwareFailure
          ? "Firmware-related confidence increased because direct compatibility or version evidence was identified."
          : "Confidence remains limited because no dominant failure pattern was established.";
  return `${primaryReason} The prototype score is ${confidence}% based on ${supportingEvidence.length} supporting signal(s) and ${contradictingEvidence.length} contradicting or limiting signal(s). This is not production-validated probability.`;
}

function buildPartsRequest({ affectedComponent, hasHmcFault, hasPcieFault }) {
  if (hasHmcFault) return { required:true, actionType:"GPU swap or approved isolation test", partNumber:"Pending technician selection", description:`Replacement candidate associated with ${affectedComponent}`, quantity:1, requestedBy:"", approvalStatus:"Not approved", warehouseStatus:"Not requested", replacementSerialNumber:"Not assigned" };
  if (hasPcieFault) return { required:"Conditional", actionType:"Slot or component isolation", partNumber:"Pending diagnostic outcome", description:"Part requirement depends on isolation result.", quantity:0, requestedBy:"", approvalStatus:"Not approved", warehouseStatus:"Not requested", replacementSerialNumber:"Not assigned" };
  return { required:false, actionType:"No part recommendation yet", partNumber:"Not applicable", description:"No replacement part should be requested from current evidence.", quantity:0, requestedBy:"", approvalStatus:"Not applicable", warehouseStatus:"Not applicable", replacementSerialNumber:"Not applicable" };
}

function buildRetestRequirement({ hasHmcFault, hasPcieFault, hasTesterFailure, hasFirmwareFailure, failureStage }) {
  let stage = failureStage, expectedResult = "Required stage passes without recurrence.";
  if (hasHmcFault) { stage = "INIT / HMC BIST"; expectedResult = "HMC initialization and affected GPU heartbeat pass."; }
  else if (hasPcieFault) { stage = "FLT"; expectedResult = "PCIe link and width checks pass."; }
  else if (hasTesterFailure) { stage = "Approved test execution"; expectedResult = "Test completes on a validated tester."; }
  else if (hasFirmwareFailure) { stage = "Firmware validation and affected test stage"; expectedResult = "Approved firmware compatibility is confirmed."; }
  return { required:true, stage, expectedResult, result:"NOT RUN", status:"NOT READY", message:"A diagnostic recommendation cannot be considered verified until the required retest is documented." };
}

function buildShiftHandoff({ affectedComponent, title, recommendation, previousActions, doNotRepeat, partsRequest, retest }) {
  return {
    currentStatus: "Diagnosis ready - technician review required",
    whatHasBeenDone: previousActions.map(a => `${a.action}: ${a.result}`),
    doNotRepeat: doNotRepeat.map(i => i.action),
    nextRequiredAction: recommendation,
    partsStatus: partsRequest.warehouseStatus,
    retestRequirement: `${retest.stage}: ${retest.expectedResult}`,
    notes: `${title} involving ${affectedComponent}. This handoff is generated from prototype evidence and must be reviewed by the next technician.`
  };
}

/* ================================================================
   26. STRUCTURED DIAGNOSTIC RENDERER
   ================================================================ */

function renderAnalysis(analysis) {
  if (!analysis) return;
  state.currentAnalysis = analysis;

  const resultPanel = $("#result-panel");
  const emptyResult = $("#empty-diagnostic-result");
  const structuredResult = $("#structured-diagnostic-result");

  if (resultPanel) { resultPanel.dataset.resultState = "ready"; resultPanel.dataset.dataSource = "demo"; }
  if (emptyResult) emptyResult.hidden = true;
  if (structuredResult) { structuredResult.hidden = false; structuredResult.dataset.resultState = "ready"; structuredResult.dataset.dataSource = "demo"; }

  setText("#case-id-label", analysis.caseId);
  updateActiveCaseContext(analysis);
  renderResultHeader(analysis);
  renderActiveCaseSection(analysis);
  renderUnitIdentity(analysis);
  renderTestStages(analysis);
  renderPrimaryFinding(analysis);
  renderAffectedComponent(analysis);
  renderRootCauseCandidates(analysis);
  renderSupportingEvidence(analysis);
  renderContradictingEvidence(analysis);
  renderPreviousActions(analysis);
  renderDoNotRepeat(analysis);
  renderConfidence(analysis);
  renderNextAction(analysis);
  renderTechnicianApproval(analysis);
  renderRetestRequirement(analysis);
  renderDataDisclosure(analysis);
  runKnowledgeEngine(analysis);
  renderREX({ reset: true });
  renderResultActions(analysis);
  updateSelectedComponent(analysis.affectedComponent);
  updateTopologyFromAnalysis(analysis);
  updatePassportFromAnalysis(analysis);
  resetRetestWorkflowForAnalysis(analysis);
  animateConfidence(analysis.confidence);
}

/* ================================================================
   27. ACTIVE CASE CONTEXT RENDERING
   ================================================================ */

function createInitialCaseContext() {
  return { caseId:"CASE-NEW", caseState:"NEW", travelerId:"TRAVELER-NEW", technician:getInputValue("#technician-name")||"Repair Technician", tester:getInputValue("#tester-name")||"SXM-TESTER-04", product:getInputValue("#product-model")||"H200 / SXM", failure:{ failureStage:"Awaiting analysis" }, unit:{ unitSerialNumber:"DEMO-UNIT-0001", systemSerialNumber:"DEMO-SYSTEM-0001", platform:"H200 / SXM" }, dataSource:"Prototype / Demonstration Data" };
}

function updateActiveCaseContext(analysis) {
  if (!analysis) return;
  setText("#active-case-id", analysis.caseId || "CASE-NEW");
  setText("#active-case-state", analysis.caseState || "NEW");
  setText("#active-unit-serial", analysis.unit?.unitSerialNumber || "Not supplied");
  setText("#active-system-serial", analysis.unit?.systemSerialNumber || "Not supplied");
  setText("#active-platform", analysis.unit?.platform || analysis.product || "Not supplied");
  setText("#active-failure-stage", analysis.failure?.failureStage || "Awaiting analysis");
  setText("#active-tester", analysis.tester || "Not identified");
  setText("#active-technician", analysis.technician || "Not identified");
  const context = $("#active-case-context");
  if (context) { context.dataset.caseState = analysis.caseState || "NEW"; context.dataset.dataSource = "demo"; }
  updateDataSourceLabels(analysis.dataSource);
}

function updateDataSourceLabels(label) {
  const safeLabel = label || "Prototype / Demonstration Data";
  setText("#active-case-data-status strong", safeLabel);
  setText("#diagnostic-result-data-label", safeLabel);
  setText("#diagnostic-data-source", safeLabel);
}

/* ================================================================
   28-43. RESULT RENDERERS (unchanged logic, preserved from original)
   ================================================================ */

function renderResultHeader(analysis) {
  setText("#root-cause-command-heading", analysis.title);
  setText("#diagnostic-result-summary", `${analysis.category} involving ${analysis.affectedComponent}.`);
  setText("#diagnostic-result-status", "DIAGNOSIS READY");
  setText("#diagnostic-result-data-label", "PROTOTYPE / DEMONSTRATION DATA");
}

function renderActiveCaseSection(analysis) {
  setText("#diagnostic-case-id", analysis.caseId);
  setText("#diagnostic-case-state", analysis.caseState);
  setText("#diagnostic-department", analysis.unit.department);
  setText("#diagnostic-technician", analysis.technician);
  setText("#diagnostic-tester", analysis.tester);
}

function renderUnitIdentity(analysis) {
  const unit = analysis.unit;
  setText("#diagnostic-unit-serial", unit.unitSerialNumber);
  setText("#diagnostic-system-serial", unit.systemSerialNumber);
  setText("#diagnostic-part-number", unit.partNumber);
  setText("#diagnostic-platform", unit.platform);
  setText("#diagnostic-build", unit.build);
  setText("#diagnostic-board-revision", unit.boardRevision);
  setText("#unit-identity-data-state", "DEMO RECORD");
}

function renderTestStages(analysis) {
  const stages = analysis.testSession?.stages || {};
  setText("#diagnostic-failure-stage", analysis.failure?.failureStage || "Awaiting analysis");
  Object.entries(stages).forEach(([stage, result]) => {
    const stageId = stage.toLowerCase();
    setText(`#test-stage-${stageId}`, result);
    const el = $(`.test-stage-item[data-stage="${stage}"]`);
    if (el) {
      el.dataset.result = result.toLowerCase();
      el.classList.remove("pass","fail","warning","not-run","unknown");
      el.classList.add(result === "PASS" ? "pass" : result === "FAIL" ? "fail" : result === "WARN" ? "warning" : result === "NOT RUN" ? "not-run" : "unknown");
    }
  });
}

function renderPrimaryFinding(analysis) {
  setText("#primary-finding-title", analysis.title);
  setText("#primary-finding-explanation", `${analysis.category}. ${analysis.confidenceExplanation}`);
  setText("#primary-finding-severity", analysis.severity || "REVIEW");
  const el = $("#primary-finding-severity");
  if (el) {
    el.className = "status-pill";
    el.classList.add(analysis.severity === "CRITICAL" ? "critical" : analysis.severity === "WARNING" ? "warning" : "neutral");
  }
}

function renderAffectedComponent(analysis) {
  setText("#affected-component-name", analysis.affectedComponent);
  setText("#affected-component-part-number", `Part number: ${analysis.unit.partNumber}`);
  setText("#affected-component-serial", `Serial number: ${analysis.unit.unitSerialNumber}`);
  setText("#affected-component-status", "HIGHEST-CORRELATED CANDIDATE");
  const btn = $("#view-component-history-button");
  if (btn) { btn.disabled = false; btn.dataset.component = analysis.affectedComponent; }
}

function renderRootCauseCandidates(analysis) {
  const list = $("#root-cause-candidate-list");
  if (!list) return;
  const candidates = safeArray(analysis.reasoning?.candidates);
  list.innerHTML = candidates.map((c, i) => `<li class="root-cause-candidate" data-candidate-rank="${i+1}"><span class="candidate-rank">${i+1}</span><div class="candidate-copy"><strong>${escapeHtml(c.name)}</strong><span>${escapeHtml(c.reason)}</span></div><strong class="candidate-score">${escapeHtml(c.score)}%</strong></li>`).join("");
  setText("#root-cause-score-label", "PROTOTYPE SCORES");
}

function renderSupportingEvidence(analysis) {
  const list = $("#supporting-evidence-list"), count = $("#supporting-evidence-count");
  const evidence = safeArray(analysis.evidence?.supporting);
  if (count) count.textContent = `${evidence.length} signal${evidence.length === 1 ? "" : "s"}`;
  if (!list) return;
  list.innerHTML = evidence.length
    ? evidence.map(item => `<li class="evidence-item"><span class="evidence-icon" aria-hidden="true">✓</span><span><strong>${escapeHtml(item.category)}</strong> ${escapeHtml(item.text)}</span></li>`).join("")
    : `<li class="evidence-item empty-evidence"><span class="evidence-icon" aria-hidden="true">—</span><span>No supporting evidence has been extracted.</span></li>`;
}

function renderContradictingEvidence(analysis) {
  const list = $("#contradicting-evidence-list"), count = $("#contradicting-evidence-count");
  const evidence = safeArray(analysis.evidence?.contradicting);
  if (count) count.textContent = `${evidence.length} signal${evidence.length === 1 ? "" : "s"}`;
  if (!list) return;
  list.innerHTML = evidence.length
    ? evidence.map(item => `<li class="evidence-item"><span class="evidence-icon" aria-hidden="true">−</span><span><strong>${escapeHtml(item.category)}</strong> ${escapeHtml(item.text)}</span></li>`).join("")
    : `<li class="evidence-item empty-evidence"><span class="evidence-icon" aria-hidden="true">—</span><span>No contradicting signals have been identified.</span></li>`;
}

function renderPreviousActions(analysis) {
  const list = $("#previous-actions-list"), count = $("#previous-actions-count");
  const actions = safeArray(analysis.history?.previousActions);
  if (count) count.textContent = `${actions.length} action${actions.length === 1 ? "" : "s"}`;
  if (!list) return;
  list.innerHTML = actions.length
    ? actions.map(a => `<li class="action-history-item"><span class="action-marker" aria-hidden="true">✓</span><div><strong>${escapeHtml(a.action)}</strong><span>${escapeHtml(a.details)}</span><small>${escapeHtml(a.result)} · ${escapeHtml(a.timestamp)}</small></div></li>`).join("")
    : `<li class="action-history-item empty-history"><span class="action-marker" aria-hidden="true">—</span><div><strong>No documented actions</strong><span>Repair history has not been supplied.</span></div></li>`;
}

function renderDoNotRepeat(analysis) {
  const list = $("#do-not-repeat-list"), count = $("#do-not-repeat-count");
  const guardrails = safeArray(analysis.history?.doNotRepeat);
  if (count) count.textContent = `${guardrails.length} action${guardrails.length === 1 ? "" : "s"}`;
  if (!list) return;
  list.innerHTML = guardrails.map(item => `<li class="guardrail-item"><span class="guardrail-icon" aria-hidden="true">!</span><span><strong>${escapeHtml(item.action)}</strong> ${escapeHtml(item.reason)}</span></li>`).join("");
}

function renderConfidence(analysis) {
  const confidence = clamp(Number(analysis.confidence) || 0, 0, 100);
  setText("#diagnostic-confidence-value", `${confidence}%`);
  setText("#diagnostic-confidence-explanation", analysis.confidenceExplanation);
  const progress = $("#diagnostic-confidence-progress");
  if (progress) { progress.style.width = `${confidence}%`; progress.setAttribute("aria-valuenow", String(confidence)); }
}

function animateConfidence(target) {
  const progress = $("#diagnostic-confidence-progress");
  const value = $("#diagnostic-confidence-value");
  if (!progress || !value) return;
  window.clearInterval(state.confidenceTimer);
  const safeTarget = clamp(Number(target) || 0, 0, 100);
  let current = 0;
  progress.style.width = "0%";
  value.textContent = "0%";
  state.confidenceTimer = window.setInterval(() => {
    current += 2;
    if (current >= safeTarget) { current = safeTarget; window.clearInterval(state.confidenceTimer); }
    progress.style.width = `${current}%`;
    progress.setAttribute("aria-valuenow", String(current));
    value.textContent = `${current}%`;
  }, 14);
}

function renderNextAction(analysis) {
  setText("#next-action-title", analysis.recommendation);
  setText("#next-action-explanation", `${analysis.actionType}. ${analysis.confidenceExplanation}`);
  setText("#next-action-status", "TECHNICIAN REVIEW REQUIRED");
}

function renderTechnicianApproval(analysis) {
  setText("#technician-approval-status", "PENDING REVIEW");
  setText("#technician-approval-message", "RepairIQ recommends a controlled diagnostic action. A qualified technician must review and approve the action before physical work or parts movement.");
  const approve = $("#approve-diagnostic-recommendation-button");
  const reject = $("#reject-diagnostic-recommendation-button");
  if (approve) approve.disabled = false;
  if (reject) reject.disabled = false;
}

function renderRetestRequirement(analysis) {
  const retest = analysis.retest || {};
  setText("#retest-status", retest.status || "NOT READY");
  setText("#retest-stage", retest.stage || "Not defined");
  setText("#retest-condition", retest.expectedResult || "Not defined");
  setText("#retest-result", retest.result || "NOT RUN");
  setText("#retest-requirement-message", retest.message);
}

function renderDataDisclosure(analysis) {
  setText("#diagnostic-data-source", analysis.dataSource || "Offline demo");
  setText("#diagnostic-intelligence-state", "Simulated prototype logic");
  setText("#diagnostic-data-disclosure-message", "This diagnostic result is illustrative unless connected to verified logs, test-session records, component history, firmware records, and approved production data sources.");
}

function renderResultActions(analysis) {
  const mount = $("#diagnostic-extension-mount");
  if (!mount) return;
  mount.querySelector(".result-actions")?.remove();
  mount.insertAdjacentHTML("beforeend", `
    <div class="result-actions">
      <button class="primary-button" id="export-summary-button" type="button">Export Repair Summary</button>
      <button class="secondary-button" id="export-json-button" type="button">Export Case JSON</button>
      <button class="secondary-button" id="open-diagnostic-details-button" type="button">Review Diagnostic Details</button>
    </div>`);
  addListener("#export-summary-button", "click", () => exportSummary(analysis));
  addListener("#export-json-button", "click", () => exportJson(analysis));
  addListener("#open-diagnostic-details-button", "click", () => openDiagnosticModal(analysis));
}

/* ================================================================
   45. GPU TOPOLOGY
   ================================================================ */

function initializeTopology() {
  const topology = $("#gpu-topology");
  if (topology && topology.dataset.eventsBound !== "true") {
    topology.dataset.eventsBound = "true";
    topology.addEventListener("click", event => {
      const node = event.target.closest(".gpu-node");
      const component = node?.dataset.gpuId;
      if (component) updateSelectedComponent(component);
    });
  }
  addListener("#view-component-history-button", "click", event => {
    const component = event.currentTarget.dataset.component || state.activeComponent;
    openComponentHistoryModal(component);
  });
}

function updateSelectedComponent(component) {
  if (!component) return;
  state.activeComponent = component;
  $$("#gpu-topology .gpu-node").forEach(node => {
    const isSelected = node.dataset.gpuId === component;
    node.classList.toggle("selected", isSelected);
    node.setAttribute("aria-pressed", String(isSelected));
  });
  const analysis = state.currentAnalysis;
  const isAffected = analysis && analysis.affectedComponent === component;
  setText("#topology-selection", isAffected
    ? `${component} selected · Highest-correlated candidate · Technician review required.`
    : `${component} selected · Review current case evidence before action.`);
  updateTopologyNodeLabels(component);
}

function updateTopologyNodeLabels(selectedComponent) {
  $$("#gpu-topology .gpu-node").forEach(node => {
    const component = node.dataset.gpuId;
    const health = node.querySelector(".gpu-health");
    const load = node.querySelector(".gpu-load");
    if (!health || !load) return;
    const sourceComponent = safeArray(state.topology?.components).find(item => item.componentId === component);
    const isAffected = Boolean(state.currentAnalysis && state.currentAnalysis.affectedComponent === component);
    const healthState = isAffected ? "critical" : (sourceComponent?.healthState || "unknown");
    node.classList.remove("critical","warning","healthy","unknown");
    node.classList.add(healthState);
    node.dataset.healthState = healthState;
    health.textContent = `● ${healthState.toUpperCase()}${healthState === "critical" ? " · REVIEW" : ""}`;
    load.textContent = selectedComponent === component ? "SELECTED · DEMO DATA" : healthState === "critical" ? "REVIEW REQUIRED" : "DEMO / NOT VERIFIED";
  });
  updateTopologyCounts();
}

function updateTopologyFromAnalysis(analysis) {
  if (!analysis) return;
  updateSelectedComponent(analysis.affectedComponent);
  const m = analysis.affectedComponent.match(/GPU(\d+)/i);
  if (m) setText("#topology-selection", `GPU${m[1]} selected · ${analysis.title} · Technician review required.`);
  updateTopologyCounts();
}

function updateTopologyCounts() {
  const nodes = $$("#gpu-topology .gpu-node");
  setText("#topology-healthy-count", String(nodes.filter(n => n.classList.contains("healthy")).length));
  setText("#topology-attention-count", String(nodes.filter(n => n.classList.contains("critical") || n.classList.contains("warning")).length));
  setText("#critical-gpu-count", String(nodes.filter(n => n.classList.contains("critical")).length));
}

/* ================================================================
   46. CASE HISTORY
   ================================================================ */

function initializeCaseHistory() {
  addListener("#case-search", "input", renderCases);
  addListener("#case-filter", "change", renderCases);
  addListener("#clear-cases-button", "click", () => {
    if (!window.confirm("Clear locally stored prototype cases?")) return;
    localStorage.removeItem("repairiq-cases");
    renderCases(); renderActivity();
    showToast("Local case history cleared.");
  });
}

function getCases() {
  const stored = localStorage.getItem("repairiq-cases");
  if (!stored) return [...DEFAULT_CASES];
  try { const p = JSON.parse(stored); return Array.isArray(p) ? p : [...DEFAULT_CASES]; }
  catch { return [...DEFAULT_CASES]; }
}

function saveAnalyzedCase(status, decisionNotes = "") {
  if (!state.currentAnalysis) return;
  const analysis = state.currentAnalysis;
  const cases = getCases();
  const record = { id:analysis.caseId, travelerId:analysis.travelerId, product:analysis.product, issue:analysis.title, component:analysis.affectedComponent, recommendation:analysis.recommendation, status, decisionNotes, timestamp:"Just now", dataSource:analysis.dataSource, failureStage:analysis.failure.failureStage, errorCode:analysis.failure.errorCode, mpPartNumber:analysis.unit.mpPartNumber, mpSerialNumber:analysis.unit.mpSerialNumber, pcbPartNumber:analysis.unit.pcbPartNumber, pcbSerialNumber:analysis.unit.pcbSerialNumber, partsStatus:analysis.partsRequest.warehouseStatus, retestResult:analysis.retest.result };
  const withoutDuplicate = cases.filter(i => i.id !== record.id);
  withoutDuplicate.unshift(record);
  localStorage.setItem("repairiq-cases", JSON.stringify(withoutDuplicate.slice(0, 40)));
  renderCases(); renderActivity();
}

function renderCases() {
  const body = $("#case-table-body"), emptyState = $("#case-table-empty-state");
  if (!body) return;
  const search = getInputValue("#case-search").toLowerCase();
  const filter = getInputValue("#case-filter") || "all";
  const cases = getCases().filter(item => {
    const text = Object.values(item).join(" ").toLowerCase();
    return (!search || text.includes(search)) && (filter === "all" || item.status === filter);
  });
  if (!cases.length) { body.innerHTML = ""; if (emptyState) emptyState.hidden = false; return; }
  if (emptyState) emptyState.hidden = true;
  body.innerHTML = cases.map(item => `<tr><td class="table-case-id">${escapeHtml(item.id)}</td><td>${escapeHtml(item.product)}</td><td>${escapeHtml(item.issue)}</td><td>${escapeHtml(item.component)}</td><td>${escapeHtml(item.recommendation)}</td><td><span class="table-status ${escapeHtml(String(item.status||"").toLowerCase())}">${escapeHtml(item.status)}</span></td></tr>`).join("");
}

function renderActivity() {
  const list = $("#activity-list");
  if (!list) return;
  const cases = getCases().slice(0, 4);
  list.innerHTML = cases.length
    ? cases.map(item => `<div class="activity-item"><div class="activity-icon">◇</div><div><strong>${escapeHtml(item.issue)}</strong><small>${escapeHtml(item.id)} · ${escapeHtml(item.component)}</small></div><span class="activity-time">${escapeHtml(item.timestamp)}</span></div>`).join("")
    : `<div class="activity-item"><div class="activity-icon">◇</div><div><strong>No recent activity</strong><small>No local prototype cases are available.</small></div></div>`;
}

/* ================================================================
   47. BUTTONS
   ================================================================ */

function initializeButtons() {
  addListener("#load-demo-button", "click", () => { loadDemoCase(); runAnalysis(); });
  addListener("#view-demo-button", "click", () => { loadDemoCase(); runAnalysis(); });
  addListener("#start-analysis-button", "click", () => { switchView("analyzer"); window.setTimeout(() => $("#diagnostic-search")?.focus(), 0); });
  addListener("#approve-diagnostic-recommendation-button", "click", approveRecommendation);
  addListener("#reject-diagnostic-recommendation-button", "click", rejectRecommendation);
}

/* ================================================================
   48. TECHNICIAN APPROVAL WORKFLOW
   ================================================================ */

function approveRecommendation() {
  const analysis = state.currentAnalysis;
  if (!analysis) { showToast("Analyze a case before approving a recommendation."); return; }
  if (!window.confirm("Approve this diagnostic action for technician-controlled execution?")) return;
  analysis.caseState = "REPAIR IN PROGRESS";
  analysis.recommendationDetails.approvalStatus = "APPROVED BY TECHNICIAN";
  analysis.partsRequest.approvalStatus = analysis.partsRequest.required ? "Pending warehouse request" : "Not applicable";
  setText("#technician-approval-status", "APPROVED BY TECHNICIAN");
  setText("#technician-approval-message", "The technician approved the recommended diagnostic action. Physical execution remains outside RepairIQ and must be documented by the responsible repair team.");
  setText("#active-case-state", "REPAIR IN PROGRESS");
  saveAnalyzedCase("Pending", "Technician approved the recommended diagnostic action.");
  showToast("Technician approval recorded.");
}

function rejectRecommendation() {
  const analysis = state.currentAnalysis;
  if (!analysis) { showToast("Analyze a case before rejecting a recommendation."); return; }
  const notes = window.prompt("Enter the reason for rejecting or escalating this recommendation:");
  if (!notes?.trim()) { showToast("A reason is required for rejection or escalation."); return; }
  analysis.caseState = "ESCALATED";
  analysis.recommendationDetails.approvalStatus = "REJECTED / ESCALATED";
  setText("#technician-approval-status", "REJECTED / ESCALATED");
  setText("#technician-approval-message", `Technician decision recorded: ${notes.trim()}`);
  setText("#active-case-state", "ESCALATED");
  saveAnalyzedCase("Escalated", notes.trim());
  showToast("Recommendation escalated for further review.");
}

/* ================================================================
   49. DIAGNOSTIC MODAL
   ================================================================ */

function initializeModal() {
  addListener("#modal-close-button", "click", closeDiagnosticModal);
  const overlay = $("#diagnostic-modal");
  if (overlay) overlay.addEventListener("click", event => { if (event.target === overlay) closeDiagnosticModal(); });
}

function openDiagnosticModal(analysis) {
  const modal = $("#diagnostic-modal"), content = $("#modal-content");
  if (!modal || !content || !analysis) return;
  state.lastFocusedElement = document.activeElement;
  state.modalOpen = true;
  content.innerHTML = `
    <div class="modal-detail-grid">
      <div><span>Case</span><strong>${escapeHtml(analysis.caseId)}</strong></div>
      <div><span>Traveler</span><strong>${escapeHtml(analysis.travelerId)}</strong></div>
      <div><span>Primary finding</span><strong>${escapeHtml(analysis.title)}</strong></div>
      <div><span>Affected component</span><strong>${escapeHtml(analysis.affectedComponent)}</strong></div>
      <div><span>Failure stage</span><strong>${escapeHtml(analysis.failure.failureStage)}</strong></div>
      <div><span>Error code</span><strong>${escapeHtml(analysis.failure.errorCode)}</strong></div>
    </div>
    <div class="modal-section"><div class="eyebrow">REASONING</div><p>${escapeHtml(analysis.confidenceExplanation)}</p></div>
    <div class="modal-section"><div class="eyebrow">RECOMMENDED ACTION</div><p>${escapeHtml(analysis.recommendation)}</p></div>
    <div class="modal-section"><div class="eyebrow">CONTROL NOTICE</div><p>RepairIQ provides technician decision support only. Physical actions require qualified human review.</p></div>`;
  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  window.setTimeout(() => $(".modal", modal)?.focus(), 0);
}

function openComponentHistoryModal(component) {
  const analysis = state.currentAnalysis;
  if (!analysis) { showToast("Analyze a case before viewing component history."); return; }
  openDiagnosticModal({ ...analysis, title:`${component} component detail`, affectedComponent:component, confidenceExplanation:"This prototype component detail is linked to the active case. Verified installation, genealogy, repair history, and firmware records are not connected." });
}

function closeDiagnosticModal() {
  const modal = $("#diagnostic-modal");
  if (!modal) return;
  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  state.modalOpen = false;
  if (state.lastFocusedElement && typeof state.lastFocusedElement.focus === "function") state.lastFocusedElement.focus();
}

/* ================================================================
   50. EXPORTS
   ================================================================ */

function exportSummary(analysis) {
  if (!analysis) { showToast("Analyze a case before exporting."); return; }
  const se = safeArray(analysis.evidence?.supporting).map((item, i) => `${i+1}. [${item.category}] ${item.text}`).join("\n");
  const ce = safeArray(analysis.evidence?.contradicting).map((item, i) => `${i+1}. [${item.category}] ${item.text}`).join("\n");
  const pa = safeArray(analysis.history?.previousActions).map((item, i) => `${i+1}. ${item.action} - ${item.result}`).join("\n");
  const dr = safeArray(analysis.history?.doNotRepeat).map((item, i) => `${i+1}. ${item.action} - ${item.reason}`).join("\n");
  const content = `REPAIRIQ\nSXM REPAIR INTELLIGENCE COMMAND CENTER\nPROTOTYPE / DEMONSTRATION DATA\n\nCASE\n${analysis.caseId}\n\nTRAVELER\n${analysis.travelerId}\n\nPRODUCT\n${analysis.product}\n\nPRIMARY FINDING\n${analysis.title}\n\nAFFECTED COMPONENT\n${analysis.affectedComponent}\n\nFAILURE STAGE\n${analysis.failure.failureStage}\n\nERROR CODE\n${analysis.failure.errorCode}\n\nPROTOTYPE EVIDENCE SCORE\n${analysis.confidence}%\n\nWHY THIS SCORE EXISTS\n${analysis.confidenceExplanation}\n\nSUPPORTING EVIDENCE\n${se}\n\nCONTRADICTING SIGNALS\n${ce}\n\nWHAT HAS ALREADY BEEN DONE\n${pa || "No documented actions"}\n\nDO NOT REPEAT\n${dr || "No guardrails generated"}\n\nRECOMMENDED ACTION\n${analysis.recommendation}\n\nTECHNICIAN APPROVAL\n${analysis.recommendationDetails.approvalStatus}\n\nPARTS STATUS\n${analysis.partsRequest.warehouseStatus}\n\nRETEST STAGE\n${analysis.retest.stage}\n\nRETEST RESULT\n${analysis.retest.result}\n\nCONTROL NOTICE\nRepairIQ provides technician decision support only.\nThis prototype does not control hardware or warehouse systems.`.trim();
  downloadFile(content, `${analysis.caseId}-repair-report.txt`, "text/plain;charset=utf-8");
  showToast("Repair report exported.");
}

function exportJson(analysis) {
  if (!analysis) { showToast("Analyze a case before exporting."); return; }
  downloadFile(JSON.stringify({ platform:"RepairIQ", generatedAt:new Date().toISOString(), dataSource:analysis.dataSource, case:analysis, control:"Technician approval required", hardwareControl:"Not connected", disclaimer:"Prototype uses deterministic rules and synthetic demonstration data." }, null, 2), `${analysis.caseId}.json`, "application/json;charset=utf-8");
  showToast("Case JSON exported.");
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = filename;
  document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 100);
}

/* ================================================================
   51. CASE AND TRAVELER IDENTIFIERS
   ================================================================ */

function createCaseId() {
  const d = new Date();
  const stamp = [d.getFullYear(), String(d.getMonth()+1).padStart(2,"0"), String(d.getDate()).padStart(2,"0")].join("");
  return `CASE-${stamp}-${Math.floor(100+Math.random()*900)}`;
}
function createTravelerId() {
  const d = new Date();
  const stamp = [d.getFullYear(), String(d.getMonth()+1).padStart(2,"0"), String(d.getDate()).padStart(2,"0")].join("");
  return `TRAVELER-${stamp}-${Math.floor(100+Math.random()*900)}`;
}
function isDemoLog(logText) {
  const n = String(logText || "").toLowerCase();
  return n.includes("vulcan") || n.includes("hmc_bist_fail") || n.includes("sxm-tester-04");
}

/* ================================================================
   52. TOAST NOTIFICATIONS
   ================================================================ */

function showToast(message) {
  const toast = $("#toast"), toastMessage = $("#toast-message");
  if (!toast || !toastMessage) return;
  toastMessage.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(state.toastTimer);
  state.toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3000);
}

/* ================================================================
   53. V0.6 TOPOLOGY, KNOWLEDGE ENGINE, REX + VERIFICATION
   ================================================================ */

const RETEST_STORAGE_KEY = "repairiq-retest-workflows-v1";
const RETEST_STEPS = ["action","ready","result","verify","close"];

function initializeExtensionMount() {
  const mount = $("#diagnostic-extension-mount");
  if (!mount || mount.dataset.rexEventsBound === "true") return;
  mount.dataset.rexEventsBound = "true";
  mount.addEventListener("click", event => {
    const chip = event.target.closest("[data-rex-query]");
    if (chip) sendREXQuery(chip.dataset.rexQuery || chip.textContent.trim());
  });
  mount.addEventListener("submit", event => {
    if (event.target.id === "rex-query-form") { event.preventDefault(); sendREXQuery(); }
  });
  mount.addEventListener("keydown", event => {
    if (event.target.id === "rex-query-input" && event.key === "Enter") { event.preventDefault(); sendREXQuery(); }
  });
}

function renderTopology() {
  const mount = $("#gpu-topology"), source = $("#gpu-topology-data");
  if (!mount || !source) return;
  try {
    const platform = JSON.parse(source.textContent || "{}");
    const components = Array.isArray(platform.components) ? platform.components : [];
    state.topology = platform;
    if (!components.length) throw new Error("Topology data contains no components.");
    mount.innerHTML = components.map(component => {
      const id = String(component.componentId || "Unknown");
      const health = ["healthy","critical","warning","unknown"].includes(component.healthState) ? component.healthState : "unknown";
      const verified = platform.verified === true && component.verificationState === "verified";
      const label = String(component.displayName || id);
      const slot = String(component.slot || "Slot not supplied");
      const stage = Array.isArray(component.relatedStageCodes) && component.relatedStageCodes.length ? component.relatedStageCodes.join(" · ") : "Stage not supplied";
      return `<button class="gpu-node ${health}" type="button" data-gpu-id="${escapeHtml(id)}" data-health-state="${health}" data-verification-state="${verified?"verified":"unverified"}" aria-pressed="false" aria-label="${escapeHtml(label)}, ${health.toUpperCase()}, ${escapeHtml(slot)}, demonstration data"><span class="gpu-node-title">${escapeHtml(label)}</span><span class="gpu-node-label">${escapeHtml(slot)}</span><span class="gpu-health">● ${health.toUpperCase()}</span><span class="gpu-load">${component.load == null ? "REVIEW REQUIRED" : `${escapeHtml(String(component.load))}% LOAD`}</span><span class="gpu-node-footer"><span class="gpu-node-status">DEMO DATA</span><span class="gpu-node-stage">${escapeHtml(stage)}</span></span><span class="gpu-node-verified">${verified?"VERIFIED SOURCE":"NOT VERIFIED"}</span></button>`;
    }).join("");
    mount.setAttribute("aria-busy","false");
    const platformTitle = $(".topology-platform");
    if (platformTitle) platformTitle.textContent = `${platform.platformName||"HGX demo"} · DEMONSTRATION DATA`;
    updateTopologyCounts();
  } catch (error) {
    mount.innerHTML = `<p role="alert">Topology could not be loaded: ${escapeHtml(error.message)}</p>`;
    mount.setAttribute("aria-busy","false");
    showToast("GPU topology data could not be loaded.");
  }
}

function buildKnowledgeOutput(analysis) {
  const evidence = safeArray(analysis.evidence?.supporting || analysis.supportingEvidence).map(item => typeof item === "string" ? item : item.text || item.description || "Evidence recorded.");
  const negative = safeArray(analysis.evidence?.contradicting || analysis.contradictingEvidence).map(item => typeof item === "string" ? item : item.text || item.description || "Limiting evidence recorded.");
  const stage = analysis.failure?.failureStage || analysis.testSession?.failureStage || "Not established";
  const component = analysis.failure?.affectedComponent || analysis.affectedComponent || "component not isolated";
  const pattern = { title:analysis.failure?.title||analysis.title||"SXM diagnostic review required", category:analysis.failure?.category||analysis.category||"General SXM failure", ruleId:analysis.failure?.ruleId||analysis.ruleId||"SXM-GENERAL-000", component, stage, summary:`${analysis.failure?.title||analysis.title||"Review required"}. Current evidence points to ${component}; this is a candidate for technician review, not a confirmed physical defect.` };
  const path = [
    { title:"Confirm unit and test-session identity", detail:`Review the unit passport, tester (${analysis.testSession?.tester||analysis.tester||"not identified"}), and available test date before acting.` },
    { title:"Review the primary evidence", detail:evidence[0]||"Review the complete source log and confirm the failure signature." },
    { title:"Perform the approved isolation step", detail:analysis.recommendation||"Use the site-approved diagnostic procedure and document the technician decision." },
    { title:"Run and document the required retest", detail:`${analysis.retest?.stage||stage}: ${analysis.retest?.expectedResult||"required stage passes without recurrence."}` }
  ];
  const checkFirst = [ `Confirm ${component} identity and physical slot against the unit record.`, evidence[0]||"Review the exact failing test line and surrounding log context.", "Check connector, seating, and approved configuration evidence before component substitution." ];
  const ruleOut = negative.length ? negative : ["No explicit contradictory evidence was identified in the uploaded log; absence of evidence does not rule out a cause."];
  const escalation = [];
  if (String(analysis.severity).toUpperCase() === "CRITICAL") escalation.push({ level:"critical", urgency:"CRITICAL", text:"Pause component replacement decisions until the failure signature and affected path are confirmed by a qualified technician." });
  if (negative.length) escalation.push({ level:"high", urgency:"HIGH", text:"Escalate if the observed evidence conflicts with the leading candidate or if the required stage cannot be reproduced." });
  escalation.push({ level:"medium", urgency:"MEDIUM", text:"Escalate for engineering review if the required retest fails, is inconclusive, or exposes a new fault." });
  return { pattern, path, checkFirst, ruleOut, retest:{ stage:analysis.retest?.stage||stage, expected:analysis.retest?.expectedResult||"Required stage passes without recurrence." }, escalation, provenance:{ ruleId:pattern.ruleId, source:analysis.dataSource||"Prototype / Demonstration Data", confidence:Number.isFinite(Number(analysis.confidence))?`${analysis.confidence}% prototype score`:"Not scored", evidence:evidence.length?evidence:["No supporting evidence item was produced."], generatedAt:new Date().toISOString() }, parts:analysis.partsRequest||{}, handoff:analysis.handoff||{} };
}

function renderKEShell(key, eyebrow, heading, body) {
  return `<section class="diagnostic-section" data-ke-section="${escapeHtml(key)}"><div class="diagnostic-section-heading"><div><div class="eyebrow">${escapeHtml(eyebrow)}</div><h4>${escapeHtml(heading)}</h4></div></div>${body}</section>`;
}

function renderKnowledgeEngine(analysis) {
  const mount = $("#diagnostic-extension-mount");
  if (!mount || !state.knowledgeOutput) return;
  const k = state.knowledgeOutput;
  const escList = items => `<ul class="evidence-list">${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  const pattern = renderKEShell("failure-pattern","KE · FAILURE PATTERN",k.pattern.title,`<div class="ke-finding-summary"><p>${escapeHtml(k.pattern.summary)}</p></div><div class="ke-subsystem-row"><span>Pattern</span><span class="ke-chip">${escapeHtml(k.pattern.category)}</span><span class="ke-chip">${escapeHtml(k.pattern.component)}</span><span class="ke-chip">${escapeHtml(k.pattern.stage)}</span></div><div class="ke-provenance-banner"><span>RULE</span><span>${escapeHtml(k.pattern.ruleId)} · deterministic demo rule · technician review required</span></div>`);
  const path = renderKEShell("repair-path","KE · STAGE-AWARE PATH","Recommended review sequence",`<div>${k.path.map((step,i)=>`<div class="ke-step-item"><div class="ke-step-header"><span class="ke-priority-marker">${i+1}</span><div class="ke-step-copy"><strong>${escapeHtml(step.title)}</strong><span>${escapeHtml(step.detail)}</span></div></div><div class="ke-step-tags"><span class="ke-tag approval">TECHNICIAN APPROVAL</span>${i===3?'<span class="ke-tag retest">RETEST REQUIRED</span>':""}</div></div>`).join("")}</div>`);
  const check = renderKEShell("check-first","KE · FIRST CHECKS","What to check first",`<div class="ke-evidence-basis">Based on the current structured analysis output.</div>${escList(k.checkFirst)}`);
  const ruleOut = renderKEShell("rule-out","KE · LIMITING EVIDENCE","What to rule out or verify",`<div class="ke-two-col"><div><strong>Contradicting or limiting signals</strong>${escList(k.ruleOut)}</div><div><strong>Review guardrail</strong><p>Do not treat an absent log signal as proof that a component or path is healthy.</p></div></div>`);
  const retest = renderKEShell("retest-spec","KE · VERIFICATION","Required retest specification",`<div class="ke-finding-summary"><p><strong>Stage:</strong> ${escapeHtml(k.retest.stage)}<br><strong>Expected:</strong> ${escapeHtml(k.retest.expected)}</p></div><span class="ke-tag retest">RETEST REQUIRED · NOT YET VERIFIED</span>`);
  const escalation = renderKEShell("escalation","KE · ESCALATION","Escalation criteria",`<div>${k.escalation.map(item=>`<div class="ke-escalation-item ${item.level}"><span class="ke-escalation-marker">!</span><div><strong class="ke-escalation-urgency">${escapeHtml(item.urgency)}</strong><span class="ke-escalation-action">${escapeHtml(item.text)}</span></div></div>`).join("")}</div>`);
  const provenance = renderKEShell("ke-provenance","KE · PROVENANCE","Rule and evidence provenance",`<div class="ke-two-col"><div><strong>Rule and source</strong><p>${escapeHtml(k.provenance.ruleId)}<br>${escapeHtml(k.provenance.source)}</p><strong>Confidence</strong><p>${escapeHtml(k.provenance.confidence)} — not a validated probability.</p></div><div><strong>Evidence used</strong>${escList(k.provenance.evidence)}</div></div><div class="ke-provenance-banner"><span>PROTOTYPE</span><span>Deterministic rules · no production repair database, live hardware, or AI inference connected.</span></div>`);
  const parts = renderKEShell("parts-request","PLANNING · PARTS","Parts planning",`<div class="ke-two-col"><div><strong>${escapeHtml(k.parts.actionType||"No part recommendation yet")}</strong><p>${escapeHtml(k.parts.description||"No replacement part should be requested from current evidence.")}</p></div><div><strong>Request state</strong><p>${escapeHtml(k.parts.approvalStatus||"Not approved")} · ${escapeHtml(k.parts.warehouseStatus||"Not requested")}</p></div></div><div class="ke-provenance-banner"><span>NO ORDER</span><span>RepairIQ does not order, reserve, or authorize parts.</span></div>`);
  const handoff = renderKEShell("shift-handoff","HANDOFF · NEXT SHIFT","Structured shift handoff",`<div class="ke-two-col"><div><strong>Current status</strong><p>${escapeHtml(k.handoff.currentStatus||analysis.caseState||"Diagnosis ready")}</p><strong>Next required action</strong><p>${escapeHtml(k.handoff.nextRequiredAction||analysis.recommendation||"Technician review required.")}</p></div><div><strong>Retest requirement</strong><p>${escapeHtml(k.handoff.retestRequirement||k.retest.expected)}</p><strong>Notes</strong><p>${escapeHtml(k.handoff.notes||"Prototype handoff; verify against source records.")}</p></div></div>`);
  mount.querySelectorAll("[data-ke-section]").forEach(node => node.remove());
  mount.insertAdjacentHTML("afterbegin", pattern+path+check+ruleOut+retest+escalation+provenance+parts+handoff);
}

function runKnowledgeEngine(analysis) {
  if (!analysis) return;
  state.knowledgeOutput = buildKnowledgeOutput(analysis);
  renderKnowledgeEngine(analysis);
}

/* ================================================================
   REX CONVERSATION SYSTEM — v0.8 authoritative implementation
   ================================================================ */

const REX_MEMORY_KEY_V08 = "repairiq-rex-memory-v08";
const rexMemoryV08 = { personal:[], conversations:{ general:[], cases:{} } };
let rexScopeV08 = "general";
let rexMotionTimerV09 = null;
let rexReplyTimerV09 = null;
let rexInteractionV09 = 0;

function rexLoadV08() {
  try {
    const saved = JSON.parse(localStorage.getItem(REX_MEMORY_KEY_V08) || "{}");
    if (Array.isArray(saved.personal)) rexMemoryV08.personal = saved.personal.filter(x => x && typeof x.value === "string").slice(-20);
    if (Array.isArray(saved.conversations?.general)) rexMemoryV08.conversations.general = saved.conversations.general.slice(-60);
    if (saved.conversations?.cases && typeof saved.conversations.cases === "object") rexMemoryV08.conversations.cases = saved.conversations.cases;
  } catch (_) { /* storage unavailable */ }
}
function rexSaveV08() { try { localStorage.setItem(REX_MEMORY_KEY_V08, JSON.stringify(rexMemoryV08)); } catch (_) {} }
function rexCaseIdV08() { return state.currentAnalysis?.caseId || null; }
function rexConversationV08() {
  const id = rexScopeV08 === "case" ? rexCaseIdV08() : null;
  if (!id) return rexMemoryV08.conversations.general;
  const cases = rexMemoryV08.conversations.cases;
  if (!Array.isArray(cases[id])) cases[id] = [];
  return cases[id];
}
function rexWelcomeV08() { return { role:"rex", text:"Hey, I'm R.E.X. I'm here whenever you want to talk or think something through. Repairs are my specialty, but we don't need a diagnostic to start a conversation. What's on your mind?", source:"Prototype introduction" }; }
function rexMessageMarkupV08(message) {
  const user = message.role === "user";
  return `<div class="rex-message ${user?"user":"rex"}"><span class="rex-avatar ${user?"technician":""}">${user?"YOU":"RX"}</span><div class="rex-bubble ${user?"user":"rex"}"><div class="rex-bubble-content">${escapeHtml(String(message.text||""))}</div>${message.source?`<div class="rex-citation">${escapeHtml(message.source)}</div>`:""}</div></div>`;
}
function rexRenderV08() {
  const id = rexCaseIdV08();
  if (!id) rexScopeV08 = "general";
  const conversation = rexConversationV08();
  const messages = conversation.length ? conversation : [rexWelcomeV08()];
  const html = messages.slice(-60).map(rexMessageMarkupV08).join("");
  for (const target of [$("#rex-chat-messages"),$("#rex-conversation")]) {
    if (target) { target.innerHTML = html; target.scrollTop = target.scrollHeight; }
  }
  setText("#rexChatScope", rexScopeV08==="case"&&id?`CASE MODE · ${id}`:"GENERAL MODE");
  setText("#rexModeLabel", rexScopeV08==="case"&&id?"CASE":"GENERAL");
  setText("#rexStatusText", rexScopeV08==="case"&&id?"Case context available · ready to talk":"Online · ready to talk");
  const stage = $("#rexAvatarStage");
  if (stage && !["listening","analyzing","remembering","speaking"].includes(stage.dataset.rexState)) stage.dataset.rexState = "ready";
  setText("#rexMemorySummary",`MEMORY · ${rexMemoryV08.personal.length} PERSONAL · ${rexConversationV08().length} MESSAGES · LOCAL`);
  const details = $("#rex-memory-details");
  if (details && !details.hidden) rexMemoryDetailsV08();
}
function rexMemoryDetailsV08() {
  const box = $("#rex-memory-details");
  if (!box) return;
  const personal = rexMemoryV08.personal.map(x=>`• ${x.value} (you asked R.E.X. to remember)`).join("\n") || "No saved personal notes.";
  const id = rexCaseIdV08();
  box.textContent = `PERSONAL NOTES\n${personal}\n\nCONVERSATION\n${rexConversationV08().length} messages in this scope.\n\nCASE EVIDENCE\n${id&&state.knowledgeOutput?`${id}: structured prototype Knowledge Engine output available.`:"No active analysis."}\n\nStorage: this browser only.`;
}
function rexRememberV08(question) {
  const match = question.match(/^(?:remember that|remember:|please remember that)\s+(.+)/i);
  if (!match) return null;
  const value = match[1].trim().slice(0, 180);
  if (!value) return null;
  rexMemoryV08.personal.push({ value, source:"User request", at:new Date().toISOString() });
  rexMemoryV08.personal = rexMemoryV08.personal.slice(-20);
  return { text:`Got it. I'll keep this as a personal note in this browser: "${value}"`, source:"User supplied · local personal memory" };
}
/* V5.14: one evidence-aware narrative for the 3D inspection and chat. */
const REX_GPU_NARRATIVE_V514={
  breakdown:[
    ["Preparing GPU breakdown","I'm separating an illustrative GPU assembly into functional regions. This is a visualization, not a physical disassembly instruction."],
    ["Connector interface","These interfaces connect the GPU assembly to its host system. A connection-related symptom requires logs and appropriate inspection before drawing conclusions."],
    ["GPU package","The GPU package performs accelerated computation. A highlighted region here does not mean a fault has been confirmed."],
    ["Memory region","GPU memory supports high-bandwidth data access. We would correlate memory-related symptoms with actual test evidence before recommending action."],
    ["Thermal assembly","Cooling and thermal interfaces influence operating conditions. Any hands-on procedure requires the site's approved process and technician authorization."],
    ["Reassembling visualization","The layers are returning to their presentation position. To connect this illustration to a real unit, analyze a case and review its cited findings."]
  ],
  examination:[
    ["Rotating GPU","I'm rotating the illustrative GPU to make its functional regions easier to inspect."],
    ["Processor region","Here's the processor region. This highlight is educational, not evidence of a defect."],
    ["Memory region","Now examining the memory region. Actual diagnostic findings require a case log."],
    ["Connector region","I'm highlighting the connector area. A repair decision needs case evidence and technician review."],
    ["Connection review","Reviewing relationships between GPU components and system connectivity."],
    ["Examination complete","The illustrative examination is complete. Ask me about a region or load a case for evidence-led guidance."]
  ]
};
function rexGpuNarrateV514(kind,stage){
  const item=REX_GPU_NARRATIVE_V514[kind]?.[stage];
  if(!item)return;
  const g=rex3D?.gpuDemo;
  if(!g||!g.active)return;
  // Only the current sequence is allowed to publish a stage message.
  const token=`${kind}:${g.start}:${stage}`;
  if(g.lastNarrativeToken===token)return;
  g.lastNarrativeToken=token;
  const caseContext=!!state.knowledgeOutput;
  const source=caseContext
    ? "Illustrative 3D visualization · separate from case evidence"
    : "Illustrative GPU anatomy · no diagnostic case loaded";
  const conversation=rexConversationV08();
  conversation.push({role:"rex",text:`${item[0]}. ${item[1]}`,source});
  if(conversation.length>60)conversation.splice(0,conversation.length-60);
  rexSaveV08();rexRenderV08();
}
/* V5.15: Hybrid-ready provider boundary. Disabled by default, so the offline
   prototype remains fully functional. A future trusted same-origin backend can
   implement POST /api/rex/chat and call local/cloud models server-side.
   NEVER place model-provider API keys in this browser file. */
const REX_HYBRID_V515={
  enabled:false,
  endpoint:"/api/rex/chat",
  timeoutMs:6500,
  speed:1.18,
  maxContextMessages:8
};
function rexHybridSafeContextV515(){
  const c=rexConversationV08();
  return {
    mode:rexScopeV08,
    inspection:rex3D?.gpuDemo?.breakingDown?"gpu-breakdown":rex3D?.gpuDemo?.examining?"gpu-examination":rex3D?.gpuDemo?.active?"gpu-presentation":"general",
    hasAnalyzedCase:!!state.knowledgeOutput,
    // Deliberately exclude raw diagnostic logs, serial numbers and private notes.
    messages:c.slice(-REX_HYBRID_V515.maxContextMessages).map(m=>({role:m.role==="user"?"user":"assistant",content:String(m.text||"").slice(0,800)}))
  };
}
async function rexHybridReplyV515(question){
  if(!REX_HYBRID_V515.enabled)return null;
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),REX_HYBRID_V515.timeoutMs);
  try{
    const response=await fetch(REX_HYBRID_V515.endpoint,{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({message:question,context:rexHybridSafeContextV515()}),
      signal:controller.signal
    });
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const data=await response.json();
    if(typeof data.reply!=="string"||!data.reply.trim())throw new Error("Invalid provider reply");
    return {text:data.reply.trim().slice(0,3000),source:"Hybrid language model · unverified conversational output"};
  }catch(error){
    console.warn("R.E.X. provider unavailable; using local fallback:",error?.message||error);
    return null;
  }finally{clearTimeout(timeout);}
}
function rexHybridUseProviderV515(question){
  if(!REX_HYBRID_V515.enabled)return false;
  // All safety, repair, case-evidence, memory and animation instructions stay
  // with the deterministic local controller. Only general conversation is routed.
  return !/(gpu|hmc|bist|retest|verif|escalat|repair|fail|evidence|diagnos|component|server|log|replace|breakdown|scan|present|remember|recall|forget|danger|shock|smoke|fire|burn|injur)/i.test(question);
}
function rexReplyV08(question) {
  const q = question.toLowerCase();
  const remembered = rexRememberV08(question);
  if (remembered) return remembered;
  if (/forget (everything|all|my (personal )?notes)/.test(q)) { rexMemoryV08.personal = []; return { text:"I cleared the personal notes saved in this browser.", source:"Local personal memory" }; }
  if (/what do you remember|what (do you|have you) know about me|recall/.test(q)) return { text:rexMemoryV08.personal.length?`Here's what you explicitly asked me to remember:\n${rexMemoryV08.personal.map(x=>`• ${x.value}`).join("\n")}\nThese are your notes, not verified repair evidence.`:"I don't have any personal notes yet. Say 'Remember that…' and I'll save it in this browser.", source:"Local personal memory" };
  // Conversation and animation share the same commands and state.
  if (/\b(?:start|show|run|demonstrate|begin)\b.*\b(?:gpu )?(?:breakdown|exploded view)\b|\b(?:gpu breakdown|exploded view)\b/.test(q)) {
    rexGpuBreakdownStart();
    return {text:"Starting the illustrative GPU breakdown. I'll explain each functional layer as it separates. No hardware fault is implied.",source:"R.E.X. 3D action · illustrative demonstration"};
  }
  if (/\b(?:start|show|run|begin)\b.*\b(?:gpu )?(?:examination|inspection|scan)\b/.test(q)) {
    rexGpuExamineStart();
    return {text:"Starting GPU examination. I'll identify the highlighted regions as the hologram rotates; case evidence remains separate.",source:"R.E.X. 3D action · illustrative demonstration"};
  }
  if (/\b(?:show|present|display)\b.*\bgpu\b/.test(q)) {
    rexGpuStart();
    return {text:"Presenting the illustrative GPU hologram above my palm.",source:"R.E.X. 3D action · illustrative demonstration"};
  }
  if (/\b(?:what|explain|tell me about)\b.*\b(?:breakdown|exploded view|gpu layers)\b/.test(q)) {
    return {text:"The breakdown separates connector interfaces, the GPU package, memory regions, and thermal structures to explain their roles. It is a simplified teaching model, not a verified hardware diagram or a diagnosis.",source:"Illustrative GPU anatomy · local knowledge"};
  }
  if (/danger|shock|smoke|fire|electrical hazard|burn|injur/.test(q)) return { text:"Stop work and follow your site's safety and power isolation procedure. If there's immediate danger, leave the area and contact the appropriate safety team. I can't assess physical conditions from this chat.", source:"Safety guidance · no remote assessment" };
  const technical = /gpu|hmc|bist|retest|verify|escalat|repair|failure|pattern|evidence|check first|diagnos|component|server|log|replace/.test(q);
  if (technical && state.knowledgeOutput && rexScopeV08 === "case") { const result = answerREX(question); return { text:result.text, source:`Structured prototype case output · ${result.citation||"case context"}` }; }
  if (technical && /leading pattern|check first|retest|escalat|case evidence/.test(q) && !state.knowledgeOutput) return { text:"I can discuss the approach now, but there isn't an analyzed case to cite yet. Tell me what you've observed, or run a diagnostic for structured case evidence.", source:"General guidance · no case evidence" };
  if (/morning|hello|hey|hi rex|good evening|good afternoon/.test(q)) return { text:"Hey! I'm online. We can talk, brainstorm, or work through a repair. What are we tackling today?", source:"Scripted prototype response" };
  if (/who are you|your personality|what can you do/.test(q)) return { text:"I'm R.E.X., the Repair Engineer Xpert. Intelligent, direct, occasionally funny, and strictly evidence-led. This prototype uses scripted responses; future versions will use a connected language model.", source:"R.E.X. personality · scripted prototype" };
  if (/brainstorm|idea|feature|build|create/.test(q)) return { text:"I'm in. Give me the goal, the person using it, and what feels broken today. We'll shape an idea around those three things.", source:"Scripted brainstorming prompt" };
  if (/frustrat|stressed|rough day|tired/.test(q)) return { text:"That sounds like a lot. Want to vent for a minute, or should we break the problem into one manageable next step?", source:"Scripted supportive response" };
  if (technical) return { text:"Let's separate what we know from what we're assuming. What symptom, test result, and component are you looking at?", source:"General repair guidance · no case citation" };
  return { text:"I'm with you. Tell me a little more about what you want to accomplish, and I'll help organize the next step.", source:"Scripted prototype response" };
}
function rexSetMotionV09(mode, status, duration = 0) {
  const stage = $("#rexAvatarStage");
  if (rexMotionTimerV09) clearTimeout(rexMotionTimerV09);
  if (stage) stage.dataset.rexState = mode;
  setText("#rex-live-status", status);
  if (duration) rexMotionTimerV09 = setTimeout(() => { if (stage?.dataset.rexState === mode) stage.dataset.rexState = "ready"; setText("#rex-live-status","R.E.X. is ready"); }, duration);
}
function rexSendV08(value, input) {
  const question = String(value || "").trim().slice(0, 500);
  if (!question) { input?.focus(); return; }
  const conversation = rexConversationV08();
  const interaction = ++rexInteractionV09;
  if (rexReplyTimerV09) clearTimeout(rexReplyTimerV09);
  conversation.push({ role:"user", text:question });
  if (conversation.length > 60) conversation.splice(0, conversation.length - 60);
  rexSaveV08(); rexRenderV08();
  if (input) input.value = "";
  const recalling = /remember|recall|forget/i.test(question);
  rexSetMotionV09(recalling?"remembering":"analyzing", recalling?"R.E.X. is checking local memory":"R.E.X. is thinking");
  rexReplyTimerV09 = setTimeout(async () => {
    if (interaction !== rexInteractionV09) return;
    rexReplyTimerV09 = null;
    const reply = (rexHybridUseProviderV515(question) ? await rexHybridReplyV515(question) : null) || rexReplyV08(question);
    if (interaction !== rexInteractionV09) return;
    conversation.push({ role:"rex", ...reply });
    if (conversation.length > 60) conversation.splice(0, conversation.length - 60);
    rexSaveV08(); rexRenderV08();
    rexSetMotionV09("speaking","R.E.X. is responding", Math.min(3500, Math.max(1300, reply.text.length * 18)));
  }, 520);
}

function answerREX(query) {
  const k = state.knowledgeOutput;
  if (!k) return { text:"Run an analysis first. REX only uses the structured Knowledge Engine output.", citation:"No active Knowledge Engine output" };
  const q = String(query || "").toLowerCase();
  if (/retest|verify|pass|stage/.test(q)) return { text:`${k.retest.stage}: ${k.retest.expected} The retest has not passed until a technician records its result in the verification workflow.`, citation:`${k.pattern.ruleId} · retest specification` };
  if (/first|check|inspect|start/.test(q)) return { text:k.checkFirst.map((item,i)=>`${i+1}. ${item}`).join("\n"), citation:`${k.pattern.ruleId} · check-first output` };
  if (/escalat|stop|risk|when/.test(q)) return { text:k.escalation.map(item=>`${item.urgency}: ${item.text}`).join("\n"), citation:`${k.pattern.ruleId} · escalation criteria` };
  if (/rule out|contradict|negative|exclude/.test(q)) return { text:k.ruleOut.join("\n"), citation:`${k.pattern.ruleId} · limiting evidence` };
  if (/path|steps|repair|next|action/.test(q)) return { text:k.path.map((step,i)=>`${i+1}. ${step.title}: ${step.detail}`).join("\n"), citation:`${k.pattern.ruleId} · stage-aware repair path` };
  if (/evidence|source|confidence|rule|why/.test(q)) return { text:`${k.pattern.summary}\nEvidence: ${k.provenance.evidence.join("; ")}\nConfidence: ${k.provenance.confidence}.`, citation:`${k.provenance.ruleId} · provenance` };
  return { text:`The current pattern is ${k.pattern.title} (${k.pattern.category}) for ${k.pattern.component}. I can summarize the checks, repair path, limiting evidence, required retest, or escalation criteria.`, citation:`${k.pattern.ruleId} · failure-pattern output` };
}

function sendREXQuery(query = "") {
  const input = $("#rex-query-input");
  rexSendV08(query || input?.value, input);
}

function renderREX({ reset = false } = {}) {
  const mount = $("#diagnostic-extension-mount");
  if (!mount || !state.knowledgeOutput) { rexRenderV08(); return; }
  rexScopeV08 = "case";
  const id = rexCaseIdV08();
  const conversation = rexConversationV08();
  if (!conversation.length) conversation.push({ role:"rex", text:`I have the structured analysis for ${id}. Ask me about the pattern, checks, evidence, retest, or escalation. The repair decision stays with the technician.`, source:`Structured prototype output · ${state.knowledgeOutput.provenance.ruleId}` });
  mount.querySelector('[data-ke-section="rex"]')?.remove();
  const section = `<section class="diagnostic-section" data-ke-section="rex"><div class="rex-panel"><div class="diagnostic-section-heading"><div><div class="eyebrow">R.E.X. · CASE MODE</div><h4>Ask about this case</h4></div><span class="rex-active-badge">PROTOTYPE CASE OUTPUT</span></div><div class="rex-conversation" id="rex-conversation" aria-live="polite"></div><div class="rex-quick-queries"><span>QUICK ASK</span><button class="rex-query-chip" type="button" data-rex-query="What is the leading pattern?">Leading pattern</button><button class="rex-query-chip" type="button" data-rex-query="What should I check first?">Check first</button><button class="rex-query-chip" type="button" data-rex-query="What retest is required?">Retest</button></div><form class="rex-input-row" id="rex-query-form"><label class="rex-input-field"><input id="rex-query-input" type="text" maxlength="500" placeholder="Ask R.E.X. about this case" aria-label="Ask R.E.X. about this case"></label><button class="primary-button" id="rex-send-button" type="submit">Ask R.E.X.</button></form><div class="rex-footer-notice">Prototype case reasoning. A technician verifies evidence and approves repairs.</div></div></section>`;
  const provenance = mount.querySelector('[data-ke-section="ke-provenance"]');
  if (provenance) provenance.insertAdjacentHTML("afterend", section); else mount.insertAdjacentHTML("beforeend", section);
  rexSaveV08(); rexRenderV08();
}

function rexInitializeV08() {
  rexLoadV08(); rexRenderV08();
  const panel = $("#rex-view");
  panel?.addEventListener("submit", event => { if (event.target.id !== "rex-dedicated-form") return; event.preventDefault(); const input = $("#rex-dedicated-input"); rexSendV08(input?.value, input); });
  panel?.addEventListener("click", event => {
    const chip = event.target.closest("[data-rex-query]");
    if (chip) rexSendV08(chip.dataset.rexQuery || chip.textContent, $("#rex-dedicated-input"));
    if (event.target.closest("#rex-memory-inspect")) { const details = $("#rex-memory-details"); details.hidden = !details.hidden; if (!details.hidden) rexMemoryDetailsV08(); }
    if (event.target.closest("#rex-memory-clear")) { ++rexInteractionV09; if (rexReplyTimerV09) clearTimeout(rexReplyTimerV09); rexConversationV08().length = 0; rexSaveV08(); rexSetMotionV09("ready","R.E.X. is ready"); rexRenderV08(); }
  });
  const dedicatedInput = $("#rex-dedicated-input");
  dedicatedInput?.addEventListener("focus", () => { if (!rexReplyTimerV09) rexSetMotionV09("listening","R.E.X. is listening"); });
  dedicatedInput?.addEventListener("blur", () => { if ($("#rexAvatarStage")?.dataset.rexState === "listening") rexSetMotionV09("ready","R.E.X. is ready"); });
  const image = $("#rex-avatar-image");
  if (image) {
    const fallback = $("#rex-avatar-fallback");
    const failed = () => { image.hidden = true; if (fallback) fallback.hidden = false; };
    image.addEventListener("error", failed);
    if (image.complete && !image.naturalWidth) failed();
  }
}
document.addEventListener("DOMContentLoaded", rexInitializeV08);

/* ================================================================
   RETEST WORKFLOW
   ================================================================ */

function initializeRetestWorkflow() {
  addListener("#open-retest-workflow-button","click",()=>{ const s=$("#retest-verification"); s?.scrollIntoView({behavior:"smooth",block:"start"}); });
  addListener("#record-technician-action-button","click",recordTechnicianAction);
  addListener("#prepare-retest-button","click",prepareRequiredRetest);
  addListener("#record-retest-result-button","click",recordRequiredRetestResult);
  addListener("#verify-repair-button","click",verifyRepairOutcome);
  addListener("#reject-verification-button","click",rejectRepairVerification);
  addListener("#close-case-button","click",closeVerifiedCase);
  const upload=$("#retest-file-input"),zone=$("#retest-upload-zone");
  if(upload&&zone){
    zone.addEventListener("click",()=>upload.click());
    zone.addEventListener("keydown",event=>{ if(event.key==="Enter"||event.key===" "){event.preventDefault();upload.click();} });
    upload.addEventListener("change",async event=>{
      const file=event.target.files?.[0];
      if(!file)return;
      if(file.size>2*1024*1024){showToast("Retest evidence must be 2 MB or smaller.");return;}
      try{ const text=await file.text();$("#verification-retest-evidence").value=text.slice(0,100000);zone.setAttribute("aria-pressed","true");zone.querySelector("strong").textContent=file.name;showToast("Retest evidence loaded locally.");}
      catch{showToast("The selected retest evidence file could not be read.");}
    });
  }
  ["#technician-action-description","#verification-technician","#verification-rationale-input"].forEach(selector=>addListener(selector,"input",updateRetestWorkflowUI));
  addListener("#verification-retest-result","change",updateRetestWorkflowUI);
}

function workflowStoreRead(){try{return JSON.parse(localStorage.getItem(RETEST_STORAGE_KEY)||"{}");}catch{return {};}}
function workflowStoreWrite(workflow){try{const store=workflowStoreRead();store[workflow.caseId||"unassigned"]=workflow;localStorage.setItem(RETEST_STORAGE_KEY,JSON.stringify(store));}catch{showToast("Browser storage unavailable.");}}
function newRetestWorkflow(caseId="unassigned"){return{caseId,actionRecorded:false,action:null,retestReady:false,retest:null,resultRecorded:false,verification:"PENDING",rationale:"",verified:false,escalated:false,closed:false,updatedAt:new Date().toISOString()};}
function restoreRetestWorkflow(){const records=workflowStoreRead();const latest=Object.values(records).sort((a,b)=>String(b.updatedAt||"").localeCompare(String(a.updatedAt||""))).at(0);state.retestWorkflow=latest||newRetestWorkflow();populateRetestInputs(state.retestWorkflow);updateRetestWorkflowUI();}
function resetRetestWorkflowForAnalysis(analysis){if(!analysis)return;const records=workflowStoreRead();state.retestWorkflow=records[analysis.caseId]||newRetestWorkflow(analysis.caseId);const workflow=state.retestWorkflow;if(!workflow.retest)workflow.retest={};const stage=String(analysis.retest?.stage||"INIT").match(/\b(INIT|FLT|FLB|FCT|DCC|RIN)\b/i)?.[1]?.toUpperCase()||"INIT";if(!workflow.retest.stage)workflow.retest.stage=stage;if(!workflow.retest.tester)workflow.retest.tester=analysis.tester==="Tester not identified"?"":analysis.tester;if(!workflow.retest.startedAt)workflow.retest.startedAt=toLocalDateTimeValue(new Date());populateRetestInputs(workflow);updateRetestWorkflowUI();}
function toLocalDateTimeValue(date){const d=date instanceof Date?date:new Date(date);if(Number.isNaN(d.getTime()))return"";const offset=d.getTimezoneOffset()*60000;return new Date(d.getTime()-offset).toISOString().slice(0,16);}
function populateRetestInputs(workflow){const put=(id,value)=>{const el=$(id);if(el&&value!=null)el.value=value;};put("#technician-action-description",workflow.action?.description||"");put("#verification-technician",workflow.action?.technician||state.currentAnalysis?.technician||"");put("#technician-action-timestamp",workflow.action?.timestamp||"");put("#verification-retest-stage",workflow.retest?.stage||"INIT");put("#verification-retest-tester",workflow.retest?.tester||"");put("#verification-retest-session-id",workflow.retest?.sessionId||"");put("#verification-retest-started-at",workflow.retest?.startedAt||"");put("#verification-retest-result",workflow.retest?.result||"NOT RUN");put("#verification-retest-completed-at",workflow.retest?.completedAt||"");put("#verification-retest-evidence",workflow.retest?.evidence||"");put("#verification-rationale-input",workflow.rationale||"");}
function persistRetestWorkflow(){if(!state.retestWorkflow)return;state.retestWorkflow.updatedAt=new Date().toISOString();workflowStoreWrite(state.retestWorkflow);}
function recordTechnicianAction(){if(!state.currentAnalysis){showToast("Analyze a case before recording a repair action.");return;}const description=getInputValue("#technician-action-description"),technician=getInputValue("#verification-technician");if(!description||!technician){showToast("Enter the action performed and technician name.");return;}const timestamp=$("#technician-action-timestamp");if(timestamp&&!timestamp.value)timestamp.value=toLocalDateTimeValue(new Date());const workflow=state.retestWorkflow||newRetestWorkflow(state.currentAnalysis.caseId);workflow.action={description,technician,timestamp:timestamp?.value||""};workflow.actionRecorded=true;workflow.retestReady=false;workflow.resultRecorded=false;workflow.verified=false;workflow.closed=false;workflow.escalated=false;state.retestWorkflow=workflow;persistRetestWorkflow();updateRetestWorkflowUI();saveAnalyzedCase("In Progress",`Technician action recorded: ${description}`);showToast("Technician action recorded. Prepare the required retest.");}
function prepareRequiredRetest(){const workflow=state.retestWorkflow;if(!workflow?.actionRecorded){showToast("Record the technician action before preparing a retest.");return;}const tester=getInputValue("#verification-retest-tester");if(!tester){showToast("Enter the tester ID before preparing the retest.");return;}const session=$("#verification-retest-session-id"),started=$("#verification-retest-started-at");if(session&&!session.value)session.value=`RETEST-${Date.now().toString(36).toUpperCase()}`;if(started&&!started.value)started.value=toLocalDateTimeValue(new Date());workflow.retest={...(workflow.retest||{}),stage:getInputValue("#verification-retest-stage")||"INIT",tester,sessionId:session?.value||"",startedAt:started?.value||"",result:"NOT RUN",completedAt:"",evidence:""};workflow.retestReady=true;workflow.resultRecorded=false;workflow.verified=false;workflow.closed=false;state.retestWorkflow=workflow;persistRetestWorkflow();updateRetestWorkflowUI();showToast("Retest prepared. Run it on the approved tester and record the observed result.");}
function recordRequiredRetestResult(){const workflow=state.retestWorkflow;if(!workflow?.retestReady){showToast("Prepare the retest before recording a result.");return;}const result=getInputValue("#verification-retest-result");if(!["PASSED","FAILED","INCONCLUSIVE"].includes(result)){showToast("Select Passed, Failed, or Inconclusive.");return;}const completed=$("#verification-retest-completed-at");if(completed&&!completed.value)completed.value=toLocalDateTimeValue(new Date());workflow.retest={...workflow.retest,result,completedAt:completed?.value||"",evidence:getInputValue("#verification-retest-evidence")};workflow.resultRecorded=true;workflow.verified=false;workflow.closed=false;workflow.verification=result==="PASSED"?"READY FOR TECHNICIAN VERIFICATION":"FAILED / ESCALATION REQUIRED";state.retestWorkflow=workflow;persistRetestWorkflow();updateRetestWorkflowUI();saveAnalyzedCase(result==="PASSED"?"Retest Passed":"Escalated",`Retest ${result.toLowerCase()} at ${workflow.retest.stage}.`);showToast(result==="PASSED"?"Passing retest recorded. Technician verification is still required.":"Retest result recorded. Case cannot be closed.");}
function verifyRepairOutcome(){const workflow=state.retestWorkflow;const rationale=getInputValue("#verification-rationale-input");if(!workflow?.resultRecorded||workflow.retest?.result!=="PASSED"){showToast("A passing required-stage retest is needed before verification.");return;}if(rationale.length<8){showToast("Enter a verification rationale of at least 8 characters.");return;}workflow.rationale=rationale;workflow.verified=true;workflow.escalated=false;workflow.verification="VERIFIED BY TECHNICIAN";state.retestWorkflow=workflow;persistRetestWorkflow();updateRetestWorkflowUI();saveAnalyzedCase("Verified",`Technician verified the repair: ${rationale}`);showToast("Technician verification recorded. The closure gate is ready.");}
function rejectRepairVerification(){const workflow=state.retestWorkflow;const rationale=getInputValue("#verification-rationale-input");if(!workflow?.resultRecorded){showToast("Record a retest result before rejecting verification.");return;}if(rationale.length<8){showToast("Enter a reason of at least 8 characters to escalate.");return;}workflow.rationale=rationale;workflow.verified=false;workflow.escalated=true;workflow.closed=false;workflow.verification="REJECTED / ESCALATED";state.retestWorkflow=workflow;persistRetestWorkflow();updateRetestWorkflowUI();saveAnalyzedCase("Escalated",rationale);showToast("Verification rejected and escalated for review.");}
function closeVerifiedCase(){const workflow=state.retestWorkflow;if(!workflow?.verified||workflow.retest?.result!=="PASSED"){showToast("Case closure is blocked until a passing retest and technician verification are recorded.");return;}workflow.closed=true;state.retestWorkflow=workflow;persistRetestWorkflow();updateRetestWorkflowUI();saveAnalyzedCase("Closed","Case closed after passing retest and technician verification.");if(state.currentAnalysis)state.currentAnalysis.caseState="CLOSED";setText("#active-case-state","CLOSED");showToast("Case closed after verification.");}

function updateRetestWorkflowUI(){
  const w=state.retestWorkflow||newRetestWorkflow();
  const action=Boolean(w.actionRecorded),ready=Boolean(w.retestReady),result=Boolean(w.resultRecorded),verified=Boolean(w.verified),closed=Boolean(w.closed);
  const current=closed?"close":!action?"action":!ready?"ready":!result?"result":!verified?"verify":"close";
  const stepIndex=RETEST_STEPS.indexOf(current);
  $$("[data-retest-step]").forEach(el=>{const index=RETEST_STEPS.indexOf(el.dataset.retestStep);el.classList.toggle("complete",closed||index<stepIndex||(verified&&el.dataset.retestStep==="verify"));el.classList.toggle("active",el.dataset.retestStep===current&&!closed);if(el.dataset.retestStep===current&&!closed)el.setAttribute("aria-current","step");else el.removeAttribute("aria-current");});
  $$(".retest-progress-line").forEach((el,i)=>el.classList.toggle("complete",closed||i<stepIndex));
  const cardStates={action:action?"COMPLETE":"READY",ready:ready?"READY":action?"READY":"LOCKED",result:result?"COMPLETE":ready?"READY":"LOCKED",verify:verified?"COMPLETE":result?"READY":"LOCKED"};
  Object.entries(cardStates).forEach(([step,label])=>{const el=$(`[data-retest-card="${step}"] .workflow-card-state`);if(el){el.textContent=label;el.className=`workflow-card-state ${label==="COMPLETE"?"complete":label==="READY"?"ready":"locked"}`;}});
  const setDisabled=(id,disabled)=>{const el=$(id);if(el)el.disabled=disabled;};
  setDisabled("#prepare-retest-button",!action||ready||closed);setDisabled("#record-retest-result-button",!ready||result||closed);
  const passed=result&&w.retest?.result==="PASSED";const rationale=getInputValue("#verification-rationale-input");
  setDisabled("#verify-repair-button",!passed||verified||rationale.length<8||closed);setDisabled("#reject-verification-button",!result||verified||closed||rationale.length<8);setDisabled("#close-case-button",!verified||w.retest?.result!=="PASSED"||closed);
  setText("#technician-action-state",action?"COMPLETE":"READY");setText("#retest-ready-state",ready?"READY":action?"READY":"LOCKED");setText("#retest-result-state",result?w.retest?.result||"RECORDED":ready?"READY":"LOCKED");setText("#repair-verification-state",verified?"VERIFIED":result?"REVIEW":"LOCKED");
  setText("#verification-retest-status",closed?"CLOSED":ready?"RETEST READY":action?"ACTION RECORDED":"NOT READY");setText("#verification-retest-status-display",w.retest?.result||"NOT RUN");setText("#verification-status",w.verification||"PENDING");setText("#verification-decision",w.verification||"PENDING");setText("#verification-rationale",w.rationale||(passed?"Passing retest recorded; technician rationale is required.":"A passing required-stage retest is needed before verification."));setText("#verification-closure-status",verified&&passed?"TRUE":"FALSE");setText("#diagnostic-verification-status",w.verification||"PENDING");setText("#diagnostic-closure-status",verified&&passed?"TRUE":"FALSE");setText("#closure-eligibility-status",verified&&passed?"ELIGIBLE":"BLOCKED");setText("#closure-gate-title",closed?"Case closed":verified&&passed?"Closure eligible":"Closure blocked");setText("#closure-gate-message",closed?"This prototype case was closed after a documented passing retest and technician verification.":verified&&passed?"Required retest passed and technician verification is recorded. The technician may close this case.":"Record the technician action, prepare the required retest, capture a passing result, and verify the repair before closure.");
  const gate=$("#closure-gate");if(gate){gate.dataset.closureEligible=String(verified&&passed);gate.dataset.closureState=closed?"closed":verified&&passed?"eligible":"open";}
  setText("#retest-status",ready?"RETEST READY":"NOT READY");setText("#retest-result",w.retest?.result||"NOT RUN");setText("#retest-stage",w.retest?.stage||state.currentAnalysis?.retest?.stage||"Not defined");setText("#retest-condition",state.currentAnalysis?.retest?.expectedResult||"Required stage passes without recurrence.");setText("#retest-requirement-message",passed?"Passing retest recorded. Technician verification and case closure remain separate steps.":"A diagnostic recommendation cannot be considered verified until the required retest is documented.");
}

/* ================================================================
   PASSPORT ACTIONS
   ================================================================ */

function initializePassportActions(){
  addListener("#passport-view-history-button","click",()=>openComponentHistoryModal(state.currentAnalysis?.affectedComponent||state.activeComponent));
  addListener("#passport-export-button","click",()=>exportPassport());
  addListener("#genealogy-export-button","click",()=>exportGenealogy());
  addListener("#stage-export-button","click",()=>exportTestStages());
  addListener("#topology-export-button","click",()=>exportTopology());
}

function updatePassportFromAnalysis(analysis){
  if(!analysis)return;
  setText("#diagnostic-unit-serial-passport",analysis.unit?.unitSerialNumber||"Not supplied");
  setText("#diagnostic-system-serial-passport",analysis.unit?.systemSerialNumber||"Not supplied");
  const stages=analysis.testSession?.stages||{};
  ["init","flt","flb","fct","dcc","rin"].forEach(code=>{
    const stage=code.toUpperCase(),value=stages[stage]||"NOT RUN";
    setText(`#passport-stage-result-${code}`,value);setText(`#passport-stage-status-${code}`,value==="PASS"?"PASSED":value==="FAIL"?"FAILED":value);
    const card=$(`#passport-stage-card-${code}`);
    if(card){card.dataset.stageState=value==="PASS"?"passed":value==="FAIL"?"failed":"not-run";card.classList.remove("passed","failed","not-reached","retest-required");card.classList.add(value==="PASS"?"passed":value==="FAIL"?"failed":"not-reached");}
  });
  const cards=$$(".genealogy-component-card");
  cards.forEach(card=>{const label=card.querySelector(".genealogy-node-copy span")?.textContent||"";const match=label.match(/GPU\s*(\d)/i);if(!match)return;const id=`GPU${match[1]}`,isAffected=id===analysis.affectedComponent;const stateLabel=isAffected?String(analysis.severity||"REVIEW").toUpperCase():"DEMO / NOT VERIFIED";const health=card.querySelector(".genealogy-health");if(health){health.textContent=stateLabel;health.classList.toggle("critical",isAffected&&String(analysis.severity).toUpperCase()==="CRITICAL");}card.classList.toggle("critical",isAffected&&String(analysis.severity).toUpperCase()==="CRITICAL");});
}

function passportRecord(){const a=state.currentAnalysis;return{recordType:"RepairIQ Unit Digital Passport — Prototype",verified:false,caseId:a?.caseId||null,travelerId:a?.travelerId||null,unit:a?.unit||null,product:a?.product||null,affectedComponent:a?.affectedComponent||null,testSession:a?.testSession||null,dataSource:a?.dataSource||"Prototype / Demonstration Data",generatedAt:new Date().toISOString()};}
function exportPassport(){downloadFile(JSON.stringify(passportRecord(),null,2),`repairiq-passport-${state.currentAnalysis?.caseId||"demo"}.json`,"application/json");}
function exportGenealogy(){const record=passportRecord();record.genealogy={verified:false,platformId:state.topology?.platformId||"DEMO",components:safeArray(state.topology?.components).map(x=>({componentId:x.componentId,displayName:x.displayName,slot:x.slot,healthState:x.healthState,verificationState:"unverified"}))};downloadFile(JSON.stringify(record,null,2),`repairiq-genealogy-${state.currentAnalysis?.caseId||"demo"}.json`,"application/json");}
function exportTestStages(){const a=state.currentAnalysis;downloadFile(JSON.stringify({caseId:a?.caseId||null,failureStage:a?.testSession?.failureStage||"Not established",stages:a?.testSession?.stages||{},dataSource:a?.dataSource||"Prototype / Demonstration Data",verified:false},null,2),`repairiq-test-stages-${a?.caseId||"demo"}.json`,"application/json");}
function exportTopology(){const t=state.topology||{};downloadFile(JSON.stringify({...t,verified:false,components:safeArray(t.components).map(x=>({...x,verificationState:"unverified"}))},null,2),`repairiq-topology-${t.platformId||"demo"}.json`,"application/json");}

/* ================================================================
   VIRTUAL TEST LAB — OFFLINE DEMONSTRATION
   ================================================================ */

const REPAIRIQ_BUILD_LIBRARY = Object.freeze({
  vulcan:{ key:"vulcan", build:"VULCAN", platform:"H200", label:"VULCAN · H200", image:"assets/vulcan-hgx-demo.png", module:"VULCAN-H200" },
  b200:{ key:"b200", build:"UMBRIEL", platform:"B200", label:"UMBRIEL · B200", image:"assets/Umbriel-B200-demo.png", module:"UMBRIEL-B200" },
  b300:{ key:"b300", build:"UMBRIEL", platform:"B300", label:"UMBRIEL · B300", image:"assets/Umbriel-B300-demo.png", module:"UMBRIEL-B300" }
});

const REPAIRIQ_FLOOR_STATUS = Object.freeze({
  ready:{ cone:"orange", icon:"🟠", label:"ORANGE CONE · READY FOR TEST / RETEST", next:"Build or repair complete — waiting for SWAP testing." },
  passed:{ cone:"green", icon:"🟢", label:"GREEN CONE · PASS / READY FOR LABEL", next:"Verification passed — send unit to Label Station." },
  failed:{ cone:"red", icon:"🔴", label:"RED CONE · SWAP TROUBLESHOOTING", next:"Test failed — SWAP troubleshooting required." },
  partSwap:{ cone:"blue", icon:"🔵", label:"BLUE CONE · COMPONENT SWAP / REPLACEMENT", next:"Technician-confirmed component action required; retest after repair." },
  baseboard:{ cone:"baseboard", icon:"🔴🔵", label:"RED CONE + BLUE DISK · BASEBOARD SWAP", next:"Technician-confirmed baseboard workflow required; retest after repair." },
  testing:{ cone:"none", icon:"⚙", label:"TEST IN PROGRESS", next:"No disposition cone while the simulated test session is running." }
});

const VIRTUAL_LAB_STATIONS = [
  { id:"01", build:"vulcan", unit:"VULCAN-H200-001", status:"testing", floor:"testing", stage:"FCT", progress:61, duration:"00:37:42", temp:68, fan:64, power:5.2, board:43, script:"v3.8.14 · Running", firmware:"v2.17 · Active", health:"Online", environment:"Normal", identity:"MATCHED · DEMO", alerts:[], result:"RUNNING" },
  { id:"02", build:"b200", unit:"UMBRIEL-B200-002", status:"testing", floor:"testing", stage:"FLB", progress:84, duration:"01:12:05", temp:64, fan:59, power:4.9, board:42, script:"v3.8.14 · Running", firmware:"B200 demo · Active", health:"Online", environment:"Normal", identity:"MATCHED · DEMO", alerts:[], result:"RUNNING" },
  { id:"03", build:"vulcan", unit:"VULCAN-H200-003", status:"attention", floor:"failed", stage:"INIT — HMC BIST", progress:47, duration:"00:28:17", temp:82, fan:78, power:5.6, board:46, script:"v3.8.14 · Running", firmware:"v2.17 · Active", health:"Online", environment:"Normal", identity:"MATCHED · DEMO", alerts:[{level:"warning",text:"GPU2 temperature threshold exceeded",time:"10:26:14"},{level:"error",text:"HMC BIST failure detected",time:"10:25:03"}], result:"REVIEW" },
  { id:"04", build:"b300", unit:"UMBRIEL-B300-004", status:"failed", floor:"baseboard", stage:"INIT — IDENTITY / BASEBOARD", progress:100, duration:"01:04:33", temp:71, fan:72, power:5.1, board:45, script:"v3.8.14 · Stopped", firmware:"B300 demo · Active", health:"Online", environment:"Normal", identity:"MISMATCH · DEMO", alerts:[{level:"error",text:"Demonstration baseboard identity mismatch requires technician review",time:"10:20:18"}], result:"FAILED" },
  { id:"05", build:"b200", unit:"UMBRIEL-B200-005", status:"testing", floor:"testing", stage:"MEM", progress:29, duration:"00:19:21", temp:66, fan:62, power:4.8, board:43, script:"v3.8.14 · Running", firmware:"B200 demo · Active", health:"Online", environment:"Normal", identity:"MATCHED · DEMO", alerts:[], result:"RUNNING" },
  { id:"06", build:"b300", unit:"UMBRIEL-B300-006", status:"available", floor:"ready", stage:"Ready for test", progress:0, duration:"—", temp:0, fan:0, power:0, board:0, script:"Idle", firmware:"B300 demo · Ready", health:"Online", environment:"Normal", identity:"MATCHED · DEMO", alerts:[], result:"READY" },
  { id:"07", build:"vulcan", unit:"VULCAN-H200-007", status:"attention", floor:"partSwap", stage:"FLT — GPU ISOLATION", progress:100, duration:"00:42:08", temp:67, fan:66, power:5.0, board:44, script:"v3.8.14 · Paused", firmware:"v2.17 · Active", health:"Online", environment:"Normal", identity:"MATCHED · DEMO", alerts:[{level:"warning",text:"Demonstration case awaiting technician-confirmed component swap",time:"10:18:02"}], result:"REPAIR" },
  { id:"08", build:"b200", unit:"UMBRIEL-B200-008", status:"available", floor:"passed", stage:"Verification complete", progress:100, duration:"01:08:41", temp:0, fan:0, power:0, board:0, script:"Complete", firmware:"B200 demo · Active", health:"Online", environment:"Normal", identity:"MATCHED · DEMO", alerts:[], result:"PASSED" },
  { id:"09", build:"b300", unit:"UMBRIEL-B300-009", status:"testing", floor:"testing", stage:"DCC", progress:91, duration:"01:31:06", temp:65, fan:61, power:4.7, board:42, script:"v3.8.14 · Running", firmware:"B300 demo · Active", health:"Online", environment:"Normal", identity:"MATCHED · DEMO", alerts:[], result:"RUNNING" },
  { id:"10", build:"vulcan", unit:"VULCAN-H200-010", status:"testing", floor:"testing", stage:"INIT", progress:18, duration:"00:08:54", temp:61, fan:54, power:4.4, board:40, script:"v3.8.14 · Running", firmware:"v2.17 · Active", health:"Online", environment:"Normal", identity:"MATCHED · DEMO", alerts:[], result:"RUNNING" },
  { id:"11", build:"b200", unit:"UMBRIEL-B200-011", status:"available", floor:"ready", stage:"Ready for retest", progress:0, duration:"—", temp:0, fan:0, power:0, board:0, script:"Idle", firmware:"B200 demo · Ready", health:"Online", environment:"Normal", identity:"MATCHED · DEMO", alerts:[], result:"RETEST READY" },
  { id:"12", build:"b300", unit:"UMBRIEL-B300-012", status:"testing", floor:"testing", stage:"RIN", progress:38, duration:"00:22:49", temp:63, fan:58, power:4.6, board:41, script:"v3.8.14 · Running", firmware:"B300 demo · Active", health:"Online", environment:"Normal", identity:"MATCHED · DEMO", alerts:[], result:"RUNNING" }
];

let virtualLabSelectedId = "03";
let virtualLabMode = "room";
let virtualLabTimer = null;
let virtualLabTick = 0;
const labStatusLabels = { testing:"TESTING", available:"AVAILABLE", attention:"ATTENTION", failed:"FAILED" };

function getRepairIQBuild(station){ return REPAIRIQ_BUILD_LIBRARY[station?.build]||REPAIRIQ_BUILD_LIBRARY.vulcan; }
function getRepairIQFloorStatus(station){ return REPAIRIQ_FLOOR_STATUS[station?.floor]||REPAIRIQ_FLOOR_STATUS.testing; }

function initializeVirtualTestLab(){
  const root=$("#tester-lab-view");if(!root)return;
  root.addEventListener("click",event=>{
    const station=event.target.closest("[data-lab-station]");if(station){selectVirtualLabStation(station.dataset.labStation);return;}
    const mode=event.target.closest("[data-lab-view]");if(mode){setVirtualLabMode(mode.dataset.labView);return;}
    const tab=event.target.closest("[data-lab-tab]");if(tab){setVirtualLabTab(tab.dataset.labTab);return;}
  });
  root.addEventListener("keydown",event=>{ if((event.key==="Enter"||event.key===" ")&&event.target.matches("tr[data-lab-station]")){event.preventDefault();selectVirtualLabStation(event.target.dataset.labStation);} });
  addListener("#lab-monitor-toggle","click",toggleVirtualLabMonitoring);
  addListener("#lab-open-analyzer","click",()=>{loadDemoCase();runAnalysis();});
  addListener("#lab-view-report","click",()=>setVirtualLabTab("logs"));
  renderVirtualLab();
}

function renderVirtualLab(){
  const room=$("#lab-room-scene"),grid=$("#lab-tester-grid"),list=$("#lab-tester-list");
  if(!room||!grid||!list)return;
  room.innerHTML=VIRTUAL_LAB_STATIONS.map(station=>{
    const build=getRepairIQBuild(station),floor=getRepairIQFloorStatus(station);
    const v={selected:station.id===virtualLabSelectedId,stateLabel:labStatusLabels[station.status]||"UNKNOWN",temp:station.temp?`${station.temp}°C`:"—",progress:station.progress||0,unit:station.unit==="—"?"NO UNIT":station.unit};
    return `<button class="lab-rack ${v.selected?"selected":""}" type="button" data-lab-station="${station.id}" data-status="${station.status}" aria-pressed="${v.selected}" aria-label="Tester ${station.id}, ${build.label}, ${v.stateLabel}, ${escapeHtml(station.unit)}"><span class="lab-rack-name">TESTER ${station.id}</span><span class="lab-rack-build">${escapeHtml(build.label)}</span><span class="lab-rack-state">${v.stateLabel}</span><span class="lab-rack-unit">${station.unit==="—"?"":` <img src="${build.image}" alt="" loading="lazy">`}<span>${escapeHtml(v.unit)}</span></span><span class="lab-rack-progress"><i style="width:${v.progress}%"></i></span><span class="lab-rack-meta"><span>${escapeHtml(station.stage)}</span><b>${v.temp}</b></span></button>`;
  }).join("");
  grid.innerHTML=VIRTUAL_LAB_STATIONS.map(station=>{const build=getRepairIQBuild(station),v={selected:station.id===virtualLabSelectedId,stateLabel:labStatusLabels[station.status]||"UNKNOWN",temp:station.temp?`${station.temp}°C`:"—",progress:station.progress||0};return `<button class="lab-grid-card ${v.selected?"selected":""}" type="button" data-lab-station="${station.id}" data-status="${station.status}" aria-pressed="${v.selected}"><strong>TESTER ${station.id} · ${escapeHtml(build.label)}</strong><span>${escapeHtml(station.unit)} · ${escapeHtml(station.stage)}</span><b>${v.stateLabel} · ${v.progress}% · ${v.temp}</b></button>`;}).join("");
  list.innerHTML=VIRTUAL_LAB_STATIONS.map(station=>{const build=getRepairIQBuild(station);return `<tr data-lab-station="${station.id}" tabindex="0" role="button" aria-label="View tester ${station.id}"><td>TESTER ${station.id}</td><td>${escapeHtml(station.unit)} · ${escapeHtml(build.label)}</td><td><span class="lab-state-pill ${station.status}">${labStatusLabels[station.status]}</span></td><td>${escapeHtml(station.stage)}</td><td>${station.progress}%</td><td>${station.temp?`${station.temp}°C`:"—"}</td></tr>`;}).join("");
  const totals=VIRTUAL_LAB_STATIONS.reduce((acc,s)=>{acc[s.status]=(acc[s.status]||0)+1;return acc;},{});
  setText("#lab-total-testers",String(VIRTUAL_LAB_STATIONS.length));setText("#lab-testing-count",String(totals.testing||0));setText("#lab-available-count",String(totals.available||0));setText("#lab-attention-count",String(totals.attention||0));setText("#lab-failed-count",String(totals.failed||0));
  const selected=VIRTUAL_LAB_STATIONS.find(s=>s.id===virtualLabSelectedId)||VIRTUAL_LAB_STATIONS[0];
  renderVirtualLabDetail(selected);renderVirtualLabEvents();
  const now=new Date();setText("#lab-last-update",`DEMO DATA · LOCAL REFRESH ${now.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"})}`);
  const insight=state.knowledgeOutput?.pattern?.summary||"Select a station or run a case analysis. R.E.X. remains evidence-led and technician-controlled.";
  setText("#lab-rex-insight-text",insight);
  setVirtualLabMode(virtualLabMode);
}

function renderVirtualLabEvents(){
  const list=$("#lab-event-list");if(!list)return;
  const events=[{time:"10:26:14",kind:"warning",station:"TESTER 03",text:"Vulcan H200 GPU2 review signal recorded; post-test disposition remains pending evidence review."},{time:"10:20:18",kind:"error",station:"TESTER 04",text:"Umbriel B300 identity/baseboard mismatch demo moved to baseboard-review state."},{time:"10:18:02",kind:"warning",station:"TESTER 07",text:"Vulcan H200 component isolation demo awaiting technician-confirmed swap."},{time:"10:16:47",kind:"good",station:"TESTER 08",text:"Umbriel B200 verification completed; post-test PASS disposition available for technician confirmation."},{time:"10:14:32",kind:"good",station:"TESTER 11",text:"Umbriel B200 repair cycle returned to retest-ready state."},{time:"10:03:00",kind:"good",station:"TESTER 09",text:"Umbriel B300 demo session started; pre-test environment marked normal."}];
  list.innerHTML=events.map(event=>`<div class="lab-event-item ${event.kind}"><time class="lab-event-time">${event.time}</time><i class="lab-event-marker" aria-hidden="true"></i><span><strong>${event.station}</strong> · ${escapeHtml(event.text)}</span><span class="lab-event-source">SYNTHETIC</span></div>`).join("");
}

function getVirtualLabDispositionRecommendation(station){
  if(!station)return{state:"pending",title:"Awaiting station evidence",confidence:"PENDING",reason:"Select a tester to review its current evidence.",cone:null};
  if(station.status==="testing"||(station.progress<100&&station.status==="attention"))return{state:"pending",title:"No cone recommendation during active testing",confidence:"PENDING",reason:"Testing or evidence review is still in progress. RepairIQ will not predict a physical floor status early.",cone:null};
  if(station.status==="available"&&station.result==="READY")return{state:"pending",title:"Unit is waiting for a test session",confidence:"N/A",reason:"This unit has no completed post-test result requiring a new cone recommendation.",cone:null};
  if(station.status==="available"&&station.result==="RETEST READY")return{state:"ready",title:"Repair complete · retest required",confidence:"CONFIRMED WORKFLOW",reason:"The repair cycle is complete and the unit is ready to return to testing.",cone:{icon:"🟠",label:"ORANGE CONE · READY FOR RETEST"}};
  if(station.status==="available"&&station.result==="PASSED")return{state:"passed",title:"Verification passed",confidence:"HIGH",reason:"The completed demonstration result supports release from testing to the Label workflow.",cone:{icon:"🟢",label:"GREEN CONE · PASS / READY FOR LABEL"}};
  if(station.result==="REPAIR"&&station.floor==="partSwap")return{state:"swap",title:"Component isolation supports a swap action",confidence:"HIGH",reason:"The demonstration isolation path identifies a component-level repair action. Technician confirmation is required before the physical disposition changes.",cone:{icon:"🔵",label:"BLUE CONE · COMPONENT SWAP REQUIRED"}};
  if(station.status==="failed"&&station.floor==="baseboard")return{state:"review",title:"Identity/configuration evidence requires review",confidence:"REVIEW",reason:"The tester failed, but the demonstrated identity mismatch does not by itself prove a defective baseboard.",cone:{icon:"🔴",label:"RED CONE · SWAP TROUBLESHOOTING"}};
  if(station.status==="failed")return{state:"failed",title:"Test failed · SWAP troubleshooting required",confidence:"HIGH",reason:"The completed test result supports returning the unit to the Repair Floor for technician troubleshooting.",cone:{icon:"🔴",label:"RED CONE · SWAP TROUBLESHOOTING"}};
  return{state:"pending",title:"Cone disposition not yet determined",confidence:"PENDING",reason:"Additional evidence or technician isolation is required.",cone:null};
}

function renderVirtualLabDisposition(station){
  const panel=$("#lab-disposition-panel");if(!panel)return;
  const rec=getVirtualLabDispositionRecommendation(station);
  panel.dataset.state=rec.state;setText("#lab-disposition-title",rec.title);setText("#lab-disposition-confidence",rec.confidence);setText("#lab-disposition-reason",rec.reason);
  const cone=$("#lab-disposition-cone");if(cone)cone.hidden=!rec.cone;
  if(rec.cone){setText("#lab-disposition-cone-icon",rec.cone.icon);setText("#lab-disposition-cone-label",rec.cone.label);}
}

function renderVirtualLabDetail(station){
  if(!station)return;
  const statusLabel=labStatusLabels[station.status]||"UNKNOWN";
  const build=getRepairIQBuild(station);
  renderVirtualLabDisposition(station);
  setText("#lab-detail-title",`TESTER ${station.id}`);
  const pill=$("#lab-detail-state");if(pill){pill.textContent=statusLabel;pill.className=`lab-state-pill ${station.status}`;}
  const unitImage=$("#lab-unit-image");if(unitImage){unitImage.src=build.image;unitImage.alt=`${build.label} demonstration unit visual; illustrative image, not a CAD model`;}
  setText("#lab-unit-build-label",`${build.label} · DEMO VISUAL`);setText("#lab-build-name",build.label);setText("#lab-identity-state",station.identity||"UNVERIFIED · DEMO");
  setText("#lab-unit-id",station.unit);setText("#lab-tester-id",`SXM-TEST-${station.id}`);setText("#lab-current-stage",station.stage);setText("#lab-session-duration",station.duration);setText("#lab-progress-label",`${station.progress}%`);
  const progress=$("#lab-progress-bar");if(progress)progress.style.width=`${station.progress}%`;
  setText("#lab-gpu-temp",station.temp?`${station.temp}°C`:"—");setText("#lab-fan-speed",station.fan?`${station.fan}%`:"—");setText("#lab-power-draw",station.power?`${station.power.toFixed(1)} kW`:"—");setText("#lab-board-temp",station.board?`${station.board}°C`:"—");
  setText("#lab-telemetry-temp",station.temp?`${station.temp}°C`:"—");setText("#lab-telemetry-power",station.power?`${station.power.toFixed(1)} kW`:"—");setText("#lab-telemetry-fan",station.fan?`${station.fan}%`:"—");
  setText("#lab-script-version",station.script);setText("#lab-firmware-version",station.firmware);setText("#lab-tester-health",station.health);setText("#lab-tester-environment",station.environment);setText("#lab-alert-count",String(station.alerts.length));
  const alerts=$("#lab-selected-alerts");
  if(alerts)alerts.innerHTML=station.alerts.length?station.alerts.map(a=>`<div class="lab-alert-item ${a.level==="warning"?"warning":""}"><i aria-hidden="true"></i><span>${escapeHtml(a.text)}</span><time>${escapeHtml(a.time)}</time></div>`).join(""):`<div class="lab-alert-item warning"><i aria-hidden="true"></i><span>No active alerts in this demo session.</span></div>`;
  const logs=$("#lab-selected-log");
  if(logs){const entries=station.alerts.length?station.alerts:[{level:"good",time:"10:12:08",text:`${build.label} tester heartbeat nominal · demo event`},{level:"good",time:"10:12:11",text:`${station.stage} test stage ${station.result.toLowerCase()} · demo event`},{level:"warning",time:"10:12:15",text:"Script, firmware, identity and telemetry values are synthetic interface data."}];logs.innerHTML=entries.map(item=>`<div class="lab-log-line ${item.level==="warning"?"warning":item.level==="error"?"error":""}"><time>${escapeHtml(item.time)} · DEMO SOURCE</time>${escapeHtml(item.text)}</div>`).join("");}
  const environment=$("#lab-environment-detail");
  if(environment)environment.innerHTML=[["Build",build.label],["Knowledge module",build.module],["Identity state",station.identity||"UNVERIFIED · DEMO"],["Tester health",station.health],["Room condition",station.environment],["Script",station.script],["Firmware",station.firmware],["Data source","Synthetic demonstration values"]].map(([n,v])=>`<div><span>${escapeHtml(n)}</span><strong>${escapeHtml(v)}</strong></div>`).join("");
}

function selectVirtualLabStation(id){
  if(!VIRTUAL_LAB_STATIONS.some(s=>s.id===id))return;
  virtualLabSelectedId=id; renderVirtualLab();
}

function setVirtualLabMode(mode){
  if(!["room","grid","list"].includes(mode))return;
  virtualLabMode=mode;
  const stage=$("#lab-main-stage");if(stage)stage.dataset.view=mode;
  const room=$("#lab-room-scene");if(room)room.hidden=mode!=="room";
  const grid=$("#lab-tester-grid");if(grid)grid.hidden=mode!=="grid";
  const list=$("#lab-tester-list-wrap");if(list)list.hidden=mode!=="list";
  $$("[data-lab-view]").forEach(button=>{const active=button.dataset.labView===mode;button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active));});
}

function setVirtualLabTab(tabName){
  $$("[data-lab-tab]").forEach(button=>{const active=button.dataset.labTab===tabName;button.classList.toggle("active",active);button.setAttribute("aria-selected",String(active));});
  $$("[data-lab-panel]").forEach(panel=>{const active=panel.dataset.labPanel===tabName;panel.hidden=!active;panel.classList.toggle("active",active);});
}

function toggleVirtualLabMonitoring(){
  const root=$("#tester-lab-view"),button=$("#lab-monitor-toggle");
  if(!root||!button)return;
  if(virtualLabTimer){
    clearInterval(virtualLabTimer);virtualLabTimer=null;
    root.dataset.monitoring="off";button.textContent="Start Demo Monitoring";
    showToast("Demo monitoring paused. No hardware connection was active.");return;
  }
  root.dataset.monitoring="on";button.textContent="Pause Demo Monitoring";
  showToast("Local multi-build demo monitoring started. All values remain simulated.");
  virtualLabTimer=window.setInterval(()=>{
    virtualLabTick+=1;
    for(const station of VIRTUAL_LAB_STATIONS){
      if(station.status!=="testing"&&station.status!=="attention")continue;
      const delta=virtualLabTick%2?1:-1;
      station.temp=clamp(station.temp+delta,58,station.status==="attention"?84:73);
      station.fan=clamp(station.fan+(virtualLabTick%3===0?1:-1),48,85);
      if(station.status==="testing")station.progress=Math.min(99,station.progress+(virtualLabTick%3===0?1:0));
    }
    renderVirtualLab();
  },2200);
}

/* ================================================================
   ANALYZER TECHNICIAN WORKSTATION CONTROLLER
   ================================================================ */

function initializeAnalyzerWorkstation(){
  const analyzerView=document.querySelector("#analyzer-view"),nav=document.querySelector("#analyzer-workstation-nav");
  if(!analyzerView||!nav)return;
  const tabs=Array.from(nav.querySelectorAll("[data-analyzer-tab]")),statusText=document.querySelector("#analyzer-workstation-status-text");
  const stageLabels={case:"Case context",log:"Log ingestion",evidence:"Evidence review",diagnosis:"Diagnostic review",repair:"Repair decision",verify:"Retest + verification",close:"Closure review"};
  function activateAnalyzerWorkspace(stage,options={}){
    const target=tabs.find(tab=>tab.dataset.analyzerTab===stage);if(!target)return;
    analyzerView.dataset.analyzerWorkspace=stage;
    tabs.forEach(tab=>{const isActive=tab===target;tab.classList.toggle("active",isActive);tab.setAttribute("aria-selected",isActive?"true":"false");tab.tabIndex=isActive?0:-1;});
    if(statusText)statusText.textContent=stageLabels[stage]||"Diagnostic workstation";
    if(options.focus===true)target.focus();
    if(options.scroll!==false)analyzerView.querySelector(".analyzer-workstation-shell")?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener("click",()=>activateAnalyzerWorkspace(tab.dataset.analyzerTab,{scroll:false}));
    tab.addEventListener("keydown",event=>{
      if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;
      event.preventDefault();
      let nextIndex=index;
      if(event.key==="ArrowRight")nextIndex=(index+1)%tabs.length;
      if(event.key==="ArrowLeft")nextIndex=(index-1+tabs.length)%tabs.length;
      if(event.key==="Home")nextIndex=0;
      if(event.key==="End")nextIndex=tabs.length-1;
      activateAnalyzerWorkspace(tabs[nextIndex].dataset.analyzerTab,{focus:true,scroll:false});
    });
  });
  document.querySelector("#analyze-button")?.addEventListener("click",()=>window.setTimeout(()=>activateAnalyzerWorkspace("evidence"),80));
  document.querySelector("#approve-diagnostic-recommendation-button")?.addEventListener("click",()=>window.setTimeout(()=>activateAnalyzerWorkspace("verify"),80));
  activateAnalyzerWorkspace(analyzerView.dataset.analyzerWorkspace||"case",{scroll:false});
}

/* ================================================================
   REPAIR FLOOR DIGITAL TWIN
   FIXED v1.0-AUDIT: All setActiveView() calls replaced with switchView()
   ================================================================ */

const REPAIR_FLOOR_SEED_UNITS = [
  {id:"RF-01",bay:"A01",build:"vulcan",unit:"VULCAN-H200-021",traveler:"TRV-2026-0927-001",system:"SYS-H200-021",board:"BB-H200-021",status:"ready",tester:"—",caseId:"—",history:[["07:42","Build complete"],["07:48","Orange cone · ready for test"]]},
  {id:"RF-02",bay:"A05",build:"b300",unit:"UMBRIEL-B300-012",traveler:"TRV-2026-0927-002",system:"SYS-B300-012",board:"BB-B300-012",status:"failed",tester:"TESTER 03",caseId:"CASE-0927-012",history:[["08:11","Returned from TESTER 03"],["08:13","Red cone · SWAP troubleshooting"]]},
  {id:"RF-03",bay:"A11",build:"b200",unit:"UMBRIEL-B200-008",traveler:"TRV-2026-0927-003",system:"SYS-B200-008",board:"BB-B200-008",status:"swap",tester:"TESTER 07",caseId:"CASE-0927-008",history:[["08:22","Failure isolated"],["08:31","Blue cone · component swap required"]]},
  {id:"RF-04",bay:"A16",build:"vulcan",unit:"VULCAN-H200-017",traveler:"TRV-2026-0927-004",system:"SYS-H200-017",board:"BB-H200-017",status:"baseboard",tester:"TESTER 10",caseId:"CASE-0927-017",history:[["08:36","SWAP isolation completed"],["08:44","Baseboard swap disposition confirmed"]]},
  {id:"RF-05",bay:"A21",build:"b300",unit:"UMBRIEL-B300-006",traveler:"TRV-2026-0927-005",system:"SYS-B300-006",board:"BB-B300-006",status:"passed",tester:"TESTER 02",caseId:"CASE-0927-006",history:[["09:04","Retest passed"],["09:07","Green cone · ready for Label"]]},
  {id:"RF-06",bay:"A26",build:"b200",unit:"UMBRIEL-B200-014",traveler:"TRV-2026-0927-006",system:"SYS-B200-014",board:"BB-B200-014",status:"ready",tester:"TESTER 06",caseId:"CASE-0927-014",history:[["09:16","GPU swap completed"],["09:20","Orange cone · ready for retest"]]},
  {id:"RF-07",bay:"A31",build:"vulcan",unit:"VULCAN-H200-025",traveler:"TRV-2026-0927-007",system:"SYS-H200-025",board:"BB-H200-025",status:"failed",tester:"TESTER 11",caseId:"CASE-0927-025",history:[["09:27","Test failed"],["09:29","Red cone · awaiting SWAP"]]},
  {id:"RF-08",bay:"A35",build:"b300",unit:"UMBRIEL-B300-019",traveler:"TRV-2026-0927-008",system:"SYS-B300-019",board:"BB-B300-019",status:"passed",tester:"TESTER 05",caseId:"CASE-0927-019",history:[["09:42","Verification passed"],["09:44","Green cone · ready for Label"]]}
];

let REPAIR_FLOOR_UNITS = REPAIR_FLOOR_SEED_UNITS.map(u=>({...u,history:u.history.map(e=>[...e])}));
const REPAIR_FLOOR_STATUS = Object.freeze({
  ready:{cone:"orange",label:"ORANGE · READY FOR TEST / RETEST",next:"Move the unit to the Test Room when the tester is ready."},
  failed:{cone:"red",label:"RED · SWAP TROUBLESHOOTING",next:"SWAP troubleshooting is required before a replacement disposition."},
  swap:{cone:"blue",label:"BLUE · COMPONENT SWAP REQUIRED",next:"Technician-confirmed component replacement is required; return to orange after repair."},
  baseboard:{cone:"baseboard",label:"RED + BLUE DISK · BASEBOARD SWAP",next:"Baseboard replacement disposition is recorded; return to orange after repair."},
  passed:{cone:"green",label:"GREEN · PASS / READY FOR LABEL",next:"Final floor stage: send the verified unit to Label."}
});
const REPAIR_FLOOR_CAPACITY = 36;
let repairFloorSelectedId = "RF-02";
let repairFloorScannedId = null;
let repairFloorPendingRecord = null;

function repairFloorUnit(id){return REPAIR_FLOOR_UNITS.find(u=>u.id===id)||REPAIR_FLOOR_UNITS[0]||null;}
function repairFloorBuild(unit){return REPAIRIQ_BUILD_LIBRARY[unit?.build]||REPAIRIQ_BUILD_LIBRARY.vulcan;}
function repairFloorStatus(unit){return REPAIR_FLOOR_STATUS[unit?.status]||REPAIR_FLOOR_STATUS.ready;}
function repairFloorSlotLabel(n){return `A${String(n).padStart(2,"0")}`;}
function repairFloorRackMeta(n){const rack=Math.floor((n-1)/9)+1,row=Math.floor(((n-1)%9)/3),position=((n-1)%3)+1;return{rack,row:["TOP","MIDDLE","BOTTOM"][row],position};}

function renderRepairFloorSlot(n){
  const bay=repairFloorSlotLabel(n),unit=REPAIR_FLOOR_UNITS.find(i=>i.bay===bay),meta=repairFloorRackMeta(n);
  if(!unit)return `<button class="floor-slot empty" type="button" data-floor-empty="${bay}" aria-label="${bay}, empty rack position"><span class="floor-slot-id">${bay}</span><span class="floor-slot-empty">OPEN</span></button>`;
  const build=repairFloorBuild(unit),status=repairFloorStatus(unit);
  return `<button class="floor-slot occupied ${unit.id===repairFloorSelectedId?"selected":""}" type="button" data-floor-unit="${unit.id}" data-cone="${status.cone}" aria-label="${bay}, ${build.label}, ${status.label}"><span class="floor-slot-id">${bay}</span><span class="floor-slot-hardware"><img src="${build.image}" alt="" aria-hidden="true"><i class="floor-mini-cone"></i><i class="floor-mini-disk"></i></span><span class="floor-slot-unit">${escapeHtml(unit.unit)}</span><span class="floor-slot-build">${build.platform}</span></button>`;
}

function renderRepairFloor(){
  const layer=$("#floor-unit-layer");if(!layer)return;
  let html="";
  for(let rack=1;rack<=4;rack++){
    const start=(rack-1)*9+1,end=start+8,side=rack<=2?"FRONT":"BACK";
    html+=`<section class="floor-rack-block" data-rack="${rack}"><header><span>${side}</span><strong>RACK A${rack}</strong><small>${repairFloorSlotLabel(start)}–${repairFloorSlotLabel(end)} · 9 UNITS</small></header><div class="floor-rack-slots">`;
    for(let n=start;n<=end;n++)html+=renderRepairFloorSlot(n);
    html+=`</div></section>`;
  }
  layer.innerHTML=html;
  const counts={ready:0,failed:0,swap:0,baseboard:0,passed:0};
  REPAIR_FLOOR_UNITS.forEach(u=>counts[u.status]++);
  setText("#floor-total-count",REPAIR_FLOOR_UNITS.length);setText("#floor-capacity-count",`${REPAIR_FLOOR_UNITS.length} / ${REPAIR_FLOOR_CAPACITY}`);setText("#floor-orange-count",counts.ready);setText("#floor-red-count",counts.failed);setText("#floor-blue-count",counts.swap);setText("#floor-baseboard-count",counts.baseboard);setText("#floor-green-count",counts.passed);
  renderRepairFloorDetail();
}

function renderRepairFloorDetail(){
  const unit=repairFloorUnit(repairFloorSelectedId);if(!unit)return;
  const build=repairFloorBuild(unit),status=repairFloorStatus(unit);
  setText("#floor-detail-title",`${unit.bay} · ${unit.unit}`);setText("#floor-detail-status",status.label);setText("#floor-detail-bay",unit.bay);setText("#floor-detail-build",build.label);setText("#floor-detail-unit",unit.unit);setText("#floor-detail-traveler",unit.traveler);setText("#floor-detail-tester",unit.tester);setText("#floor-detail-case",unit.caseId);setText("#floor-detail-status-label",status.label);setText("#floor-detail-next",status.next);
  const img=$("#floor-detail-image");if(img){img.src=build.image;img.alt=`${build.label} demonstration unit`;}
  const cone=$("#floor-selected-cone");if(cone)cone.dataset.cone=status.cone;
  const history=$("#floor-history-list");if(history)history.innerHTML=unit.history.map(([time,event])=>`<div class="floor-history-item"><time>${time}</time><span>${escapeHtml(event)}</span></div>`).join("");
  setText("#floor-history-count",`${unit.history.length} events`);
}

function selectRepairFloorUnit(id,scroll=false){
  repairFloorSelectedId=id;renderRepairFloor();
  if(scroll)$("#repair-floor-view")?.scrollIntoView({behavior:"smooth",block:"start"});
}

function openRepairFloorScan(){const modal=$("#floor-scan-modal");if(!modal)return;modal.hidden=false;$("#floor-traveler-input")?.focus();}
function closeRepairFloorScan(){const modal=$("#floor-scan-modal");if(modal)modal.hidden=true;}

function loadRepairFloorTraveler(value){
  const key=String(value||$("#floor-traveler-input")?.value||"").trim().toUpperCase();
  let unit=REPAIR_FLOOR_UNITS.find(u=>u.traveler.toUpperCase()===key||u.unit.toUpperCase()===key);
  if(!unit){const demo=REPAIR_FLOOR_SEED_UNITS.find(u=>u.traveler.toUpperCase()===key||u.unit.toUpperCase()===key);if(demo)unit=demo;}
  const result=$("#floor-scan-result");
  if(!unit){if(result)result.hidden=true;showToast("Demo traveler not found.");return;}
  repairFloorScannedId=REPAIR_FLOOR_UNITS.find(u=>u.id===unit.id)?.id||null;
  repairFloorPendingRecord={...unit,history:(unit.history||[]).map(e=>[...e])};
  const build=repairFloorBuild(unit),status=repairFloorStatus(unit);
  if(result)result.hidden=false;
  setText("#floor-scan-result-unit",unit.unit);setText("#floor-scan-result-build",build.label);setText("#floor-scan-result-bay",repairFloorScannedId?unit.bay:"NOT STAGED");setText("#floor-scan-result-system",unit.system);setText("#floor-scan-result-board",unit.board);setText("#floor-scan-result-status",repairFloorScannedId?status.label:"INTAKE READY");setText("#floor-scan-result-identity","DEMO RECORD · MATCHED");
}

function stageScannedUnit(){
  if(!repairFloorPendingRecord)return showToast("Load a traveler first.");
  let existing=REPAIR_FLOOR_UNITS.find(u=>u.id===repairFloorPendingRecord.id||u.traveler===repairFloorPendingRecord.traveler);
  if(existing){repairFloorScannedId=existing.id;closeRepairFloorScan();selectRepairFloorUnit(existing.id,true);return;}
  const open=Array.from({length:REPAIR_FLOOR_CAPACITY},(_,i)=>repairFloorSlotLabel(i+1)).find(bay=>!REPAIR_FLOOR_UNITS.some(u=>u.bay===bay));
  if(!open)return showToast("Section A is full. No open rack positions.");
  const now=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
  const record={...repairFloorPendingRecord,bay:open,status:"ready",tester:"—",caseId:"—",history:[...(repairFloorPendingRecord.history||[]),[now,`Traveler scanned · staged at ${open}`],[now,"Orange cone · ready for test"]]};
  REPAIR_FLOOR_UNITS.push(record);repairFloorScannedId=record.id;repairFloorSelectedId=record.id;
  renderRepairFloor();closeRepairFloorScan();showToast(`${record.unit} staged at ${open}.`);
}

/* FIXED v1.0-AUDIT: setActiveView → switchView */
function sendScannedUnitToTester(){
  if(!repairFloorPendingRecord)return showToast("Load a traveler first.");
  const existingIndex=REPAIR_FLOOR_UNITS.findIndex(u=>u.id===repairFloorPendingRecord.id||u.traveler===repairFloorPendingRecord.traveler);
  if(existingIndex>=0)REPAIR_FLOOR_UNITS.splice(existingIndex,1);
  renderRepairFloor();closeRepairFloorScan();
  switchView("tester-lab"); /* FIXED: was setActiveView("tester-lab") */
  showToast(`${repairFloorPendingRecord.unit} routed to Virtual Test Lab intake.`);
}

function initializeRepairFloor(){
  const root=$("#repair-floor-view");if(!root)return;
  root.addEventListener("click",event=>{
    const unit=event.target.closest("[data-floor-unit]");if(unit){selectRepairFloorUnit(unit.dataset.floorUnit);return;}
    const empty=event.target.closest("[data-floor-empty]");if(empty)showToast(`${empty.dataset.floorEmpty} is available for staging.`);
  });
  addListener("#floor-scan-traveler","click",openRepairFloorScan);
  addListener("#floor-reset-demo","click",()=>{
    REPAIR_FLOOR_UNITS=REPAIR_FLOOR_SEED_UNITS.map(u=>({...u,history:u.history.map(e=>[...e])}));
    repairFloorSelectedId="RF-02";renderRepairFloor();
  });
  document.querySelectorAll("[data-floor-scan-close]").forEach(el=>el.addEventListener("click",closeRepairFloorScan));
  addListener("#floor-load-traveler","click",()=>loadRepairFloorTraveler());
  $("#floor-traveler-input")?.addEventListener("keydown",event=>{if(event.key==="Enter")loadRepairFloorTraveler();});
  addListener("#floor-stage-unit","click",stageScannedUnit);
  addListener("#floor-send-tester","click",sendScannedUnitToTester);
  addListener("#floor-go-to-unit","click",()=>{
    if(repairFloorScannedId){closeRepairFloorScan();selectRepairFloorUnit(repairFloorScannedId,true);}
    else showToast("This traveler is not currently staged on the floor.");
  });

  /* FIXED v1.0-AUDIT: setActiveView → switchView */
  addListener("#floor-open-passport","click",()=>{
    switchView("analyzer"); /* FIXED: was setActiveView("analyzer") */
    window.setTimeout(()=>document.querySelector('[data-analyzer-tab="case"]')?.click(),50);
  });
  addListener("#floor-open-analyzer","click",()=>switchView("analyzer")); /* FIXED: was setActiveView */

  const demos=$("#floor-demo-traveler-buttons");
  if(demos){
    demos.innerHTML=REPAIR_FLOOR_SEED_UNITS.slice(0,5).map(u=>`<button type="button" data-demo-traveler="${u.traveler}">${u.traveler}</button>`).join("");
    demos.addEventListener("click",e=>{const b=e.target.closest("[data-demo-traveler]");if(!b)return;const input=$("#floor-traveler-input");if(input)input.value=b.dataset.demoTraveler;loadRepairFloorTraveler(b.dataset.demoTraveler);});
  }
  renderRepairFloor();
}
document.addEventListener("DOMContentLoaded",initializeRepairFloor);

/* ================================================================
   LIVE SIMULATION / WORKFLOW DEMO
   ================================================================ */

const repairIQSimulation = { active:false, index:0, auto:false, timer:null, previousView:"dashboard", floorSnapshot:null, labSnapshot:null, floorSelectedSnapshot:null, labSelectedSnapshot:null };

const SIM_UNIT = { id:"SIM-RF-001", bay:"A01", build:"vulcan", unit:"VULCAN-H200-SIM-001", traveler:"TRV-SIM-2026-001", system:"SYS-H200-SIM-001", board:"BB-H200-SIM-001", status:"ready", tester:"—", caseId:"SIM-CASE-001", history:[] };

const REPAIRIQ_SIMULATION_STEPS = [
  { label:"Empty Floor", view:"repair-floor", kicker:"01 · WORKFLOW RESET", title:"Repair Floor starts empty", copy:"The workflow demo begins with no units staged. This gives management a clean view of the process from the moment a builder presents a completed unit.", evidence:"Section A · 0 staged units", decision:"Await builder and traveler scan.", callout:"Watch the actual Repair Floor screen behind this panel. The racks are now empty.", apply:"empty" },
  { label:"Traveler Scan", view:"repair-floor", kicker:"02 · BUILDER INTAKE", title:"Builder brings the unit · traveler scanned", copy:"RepairIQ creates the working unit identity from the traveler and Digital Passport context.", evidence:"TRV-SIM-2026-001 · VULCAN H200 · identity matched", decision:"Route selected: Virtual Test Lab.", callout:"The floor remains empty because this unit is being sent directly to a tester.", apply:"scan" },
  { label:"Empty Test Lab", view:"tester-lab", kicker:"03 · ROUTE TO TESTER", title:"Virtual Test Lab starts empty", copy:"The screen transitions into the Test Lab before the unit arrives. All twelve tester positions are available.", evidence:"12 testers · 0 units · Tester 03 selected for intake", decision:"Assign the scanned unit to Tester 03.", callout:"This is the visual handoff from traveler intake to test operations.", apply:"lab-empty" },
  { label:"Unit Loaded", view:"tester-lab", kicker:"04 · TESTER 03", title:"The unit appears in Tester 03", copy:"The selected Vulcan H200 is now physically represented in the tester room.", evidence:"Tester 03 · VULCAN-H200-SIM-001 · INIT · test running", decision:"Monitor the test. No physical cone is assigned while testing.", callout:"The tester is now loaded and the unit is visible in the existing Test Lab interface.", apply:"testing" },
  { label:"Test Failure", view:"tester-lab", kicker:"05 · TEST RESULT", title:"Tester 03 reports a failure", copy:"The unit fails during HMC initialization. RepairIQ captures the failure state.", evidence:"HMC_BIST_FAIL · GPU2 heartbeat missing · initialization timeout · HMC retry", decision:"Return failed unit for controlled troubleshooting after evidence review.", callout:"The failure is visible at the tester before the workflow moves into diagnostic intelligence.", apply:"failed" },
  { label:"RepairIQ + R.E.X.", view:"analyzer", kicker:"06 · DIAGNOSTIC INTELLIGENCE", title:"RepairIQ analyzes the evidence", copy:"The Analyzer loads the failure case. RepairIQ structures the evidence and the Knowledge Engine produces the controlled repair path.", evidence:"GPU2 / HMC path identified · NVSwitch PASS · BMC PASS · evidence retained", decision:"Initial floor disposition: Red cone for SWAP troubleshooting.", callout:"This is where raw test failure becomes evidence-based repair intelligence.", apply:"diagnose" },
  { label:"Red → Blue", view:"repair-floor", kicker:"07 · SWAP TROUBLESHOOTING", title:"Unit returns to the Repair Floor", copy:"The failed unit first returns Red for SWAP troubleshooting. After isolation, disposition changes to Blue.", evidence:"Red · failed / SWAP troubleshooting → GPU2 isolated → Blue · component swap required", decision:"Technician-confirmed GPU2 replacement required.", callout:"The same unit now appears on the Repair Floor with its post-test disposition.", apply:"blue" },
  { label:"GPU Replaced", view:"repair-floor", kicker:"08 · TECHNICIAN ACTION", title:"Technician replaces GPU2", copy:"The physical repair is performed by the technician, not RepairIQ. Once the action is recorded, the unit changes to Orange.", evidence:"GPU2 replacement recorded · technician action captured", decision:"Orange cone · ready for retest.", callout:"Repair complete does not close the case. Verification still requires a retest.", apply:"orange" },
  { label:"Retest", view:"tester-lab", kicker:"09 · VERIFICATION RETEST", title:"Unit returns to Tester 03", copy:"The repaired unit leaves the Repair Floor and reappears in Tester 03 for verification.", evidence:"Tester 03 · RETEST · VULCAN-H200-SIM-001 · verification running", decision:"Await verified retest result.", callout:"The Repair Floor is empty again while the unit is physically in the tester room.", apply:"retest" },
  { label:"Pass → Label", view:"repair-floor", kicker:"10 · VERIFIED PASS", title:"PASS · Green cone · send to Label", copy:"The retest passes. The unit returns with Green disposition — verified pass and ready for the Label station.", evidence:"Retest PASS · verification complete · case eligible for closure", decision:"Green cone · PASS / READY FOR LABEL.", callout:"The full loop is now visible: intake, test, failure, evidence, repair, retest, pass, Label.", apply:"green" },
  { label:"Case Closed", view:"cases", kicker:"11 · CLOSED LOOP", title:"Verified repair becomes reusable knowledge", copy:"The workflow finishes in Case History. RepairIQ retains the evidence, technician action, retest result, and verified outcome.", evidence:"Traveler → Tester → Failure → Diagnosis → GPU2 replacement → Retest PASS → Label", decision:"Demonstration case closed.", callout:"Workflow Demo complete.", apply:"closed" }
];

function simulationElement(id){return document.getElementById(id);}
function simulationClone(value){return JSON.parse(JSON.stringify(value));}
function simulationSwitchView(viewName){if(typeof switchView==="function"){switchView(viewName);return;}const target=document.getElementById(`${viewName}-view`);if(!target)return;document.querySelectorAll(".view").forEach(view=>view.classList.toggle("active",view===target));}
function simulationEmptyStation(id){return{id,build:"vulcan",unit:"—",status:"available",floor:"testing",stage:"Ready",progress:0,duration:"—",temp:0,fan:0,power:0,board:0,script:"Idle",firmware:"Demo · Ready",health:"Online",environment:"Normal",identity:"NO UNIT ASSIGNED",alerts:[],result:"READY"};}
function simulationStation03(overrides={}){return Object.assign(simulationEmptyStation("03"),{build:"vulcan",unit:SIM_UNIT.unit,status:"testing",floor:"testing",stage:"INIT",progress:24,duration:"00:04:12",temp:58,fan:51,power:4.2,board:39,script:"v3.8.14 · Running",firmware:"v2.17 · Active",health:"Online",environment:"Normal",identity:"MATCHED · DEMO",alerts:[],result:"RUNNING"},overrides);}
function simulationSetLabEmpty(){if(!Array.isArray(VIRTUAL_LAB_STATIONS))return;VIRTUAL_LAB_STATIONS.splice(0,VIRTUAL_LAB_STATIONS.length,...Array.from({length:12},(_,index)=>simulationEmptyStation(String(index+1).padStart(2,"0"))));virtualLabSelectedId="03";if(typeof renderVirtualLab==="function")renderVirtualLab();}
function simulationSetLabStation03(overrides={}){simulationSetLabEmpty();const index=VIRTUAL_LAB_STATIONS.findIndex(s=>s.id==="03");if(index>=0)VIRTUAL_LAB_STATIONS[index]=simulationStation03(overrides);virtualLabSelectedId="03";if(typeof renderVirtualLab==="function")renderVirtualLab();}
function simulationFloorRecord(status,history){return Object.assign({},SIM_UNIT,{status,tester:"TESTER 03",history:history.map(item=>[...item])});}
function simulationSetFloorEmpty(){if(!Array.isArray(REPAIR_FLOOR_UNITS))return;REPAIR_FLOOR_UNITS.splice(0,REPAIR_FLOOR_UNITS.length);repairFloorSelectedId=null;repairFloorScannedId=null;repairFloorPendingRecord=null;if(typeof renderRepairFloor==="function")renderRepairFloor();if(typeof updateProductionOperationsSnapshot==="function")updateProductionOperationsSnapshot();}
function simulationSetFloorUnit(status,history){simulationSetFloorEmpty();const record=simulationFloorRecord(status,history);REPAIR_FLOOR_UNITS.push(record);repairFloorSelectedId=record.id;repairFloorScannedId=record.id;repairFloorPendingRecord=simulationClone(record);if(typeof renderRepairFloor==="function")renderRepairFloor();}
function simulationApplyVisualState(step){
  switch(step.apply){
    case"empty":simulationSetFloorEmpty();simulationSetLabEmpty();break;
    case"scan":simulationSetFloorEmpty();repairFloorPendingRecord=simulationClone(SIM_UNIT);break;
    case"lab-empty":simulationSetFloorEmpty();simulationSetLabEmpty();break;
    case"testing":simulationSetFloorEmpty();simulationSetLabStation03({stage:"INIT · HMC BIST",progress:38,duration:"00:08:42"});break;
    case"failed":simulationSetFloorEmpty();simulationSetLabStation03({status:"failed",stage:"INIT · HMC BIST",progress:62,duration:"00:14:18",temp:61,fan:56,power:4.1,script:"v3.8.14 · Failed",alerts:[{level:"critical",text:"GPU2 HMC_BIST_FAIL",time:"10:14:18"},{level:"warning",text:"GPU2 heartbeat missing · HMC retry observed",time:"10:14:19"}],result:"FAILED"});break;
    case"diagnose":simulationSetFloorEmpty();simulationSetLabStation03({status:"failed",stage:"INIT · HMC BIST",progress:62,script:"v3.8.14 · Failed",alerts:[{level:"critical",text:"GPU2 HMC_BIST_FAIL",time:"10:14:18"}],result:"FAILED"});try{if(typeof loadDemoCase==="function")loadDemoCase();if(typeof runAnalysis==="function")window.setTimeout(()=>runAnalysis(),120);}catch(error){console.warn("Workflow Demo analysis step:",error);}break;
    case"blue":simulationSetLabEmpty();simulationSetFloorUnit("swap",[["10:14","Test failed · HMC_BIST_FAIL"],["10:16","Red cone · SWAP troubleshooting"],["10:21","GPU2 isolated from evidence path"],["10:24","Blue cone · component swap required"]]);break;
    case"orange":simulationSetLabEmpty();simulationSetFloorUnit("ready",[["10:14","Test failed · HMC_BIST_FAIL"],["10:16","Red cone · SWAP troubleshooting"],["10:24","Blue cone · GPU2 replacement required"],["10:41","Technician replaced GPU2"],["10:44","Orange cone · ready for retest"]]);break;
    case"retest":simulationSetFloorEmpty();simulationSetLabStation03({stage:"RETEST · INIT / HMC",progress:71,duration:"00:18:06",temp:60,fan:54,power:4.4,script:"v3.8.14 · Retest Running",alerts:[],result:"RETEST RUNNING"});break;
    case"green":simulationSetLabEmpty();simulationSetFloorUnit("passed",[["10:14","Initial test failed"],["10:24","GPU2 replacement disposition confirmed"],["10:41","Technician replaced GPU2"],["10:44","Orange cone · ready for retest"],["11:07","Retest passed"],["11:09","Green cone · ready for Label"]]);break;
    case"closed":simulationSetFloorUnit("passed",[["10:14","Initial test failed"],["10:24","GPU2 replacement disposition confirmed"],["10:41","Technician replaced GPU2"],["11:07","Retest passed"],["11:09","Green cone · ready for Label"],["11:12","Verified demonstration case closed"]]);break;
  }
}
function simulationRenderTimeline(){const timeline=simulationElement("simulation-timeline");if(!timeline)return;timeline.innerHTML=REPAIRIQ_SIMULATION_STEPS.map((step,index)=>{const stateClass=index<repairIQSimulation.index?"complete":index===repairIQSimulation.index?"active":"";const number=index<repairIQSimulation.index?"✓":String(index+1).padStart(2,"0");return `<div class="simulation-timeline-item ${stateClass}"><span class="simulation-timeline-index">${number}</span><span>${escapeHtml(step.label)}</span></div>`;}).join("");}
function simulationRender(){
  const step=REPAIRIQ_SIMULATION_STEPS[repairIQSimulation.index];if(!step)return;
  simulationApplyVisualState(step);
  const flowMap={empty:"build",scan:"build","lab-empty":"test",testing:"test",failed:"troubleshoot",diagnose:"troubleshoot",blue:"swap",orange:"floor",retest:"retest",green:"pass",closed:"label"};
  updateProductionOperationsSnapshot(flowMap[step.apply]||null);
  simulationSwitchView(step.view);simulationRenderTimeline();
  const total=REPAIRIQ_SIMULATION_STEPS.length;
  const progressBar=simulationElement("simulation-progress-bar");if(progressBar)progressBar.style.width=`${((repairIQSimulation.index+1)/total)*100}%`;
  setText("#simulation-step-counter",`STEP ${repairIQSimulation.index+1} OF ${total}`);setText("#simulation-mode-label",repairIQSimulation.auto?"AUTO PLAY":"GUIDED MODE");setText("#simulation-stage-kicker",step.kicker);setText("#simulation-stage-title",step.title);setText("#simulation-stage-copy",step.copy);setText("#simulation-evidence",step.evidence);setText("#simulation-decision",step.decision);setText("#simulation-callout",step.callout);
  const prev=simulationElement("simulation-prev"),next=simulationElement("simulation-next"),auto=simulationElement("simulation-auto");
  if(prev)prev.disabled=repairIQSimulation.index===0;if(next)next.textContent=repairIQSimulation.index===total-1?"Finish Workflow Demo":"Next Step →";if(auto)auto.textContent=`Auto Play: ${repairIQSimulation.auto?"On":"Off"}`;
  simulationScheduleAuto();
}
function simulationTakeSnapshot(){repairIQSimulation.floorSnapshot=typeof REPAIR_FLOOR_UNITS!=="undefined"?simulationClone(REPAIR_FLOOR_UNITS):null;repairIQSimulation.labSnapshot=typeof VIRTUAL_LAB_STATIONS!=="undefined"?simulationClone(VIRTUAL_LAB_STATIONS):null;repairIQSimulation.floorSelectedSnapshot=typeof repairFloorSelectedId!=="undefined"?repairFloorSelectedId:null;repairIQSimulation.labSelectedSnapshot=typeof virtualLabSelectedId!=="undefined"?virtualLabSelectedId:null;}
function simulationRestoreSnapshot(){if(repairIQSimulation.floorSnapshot&&Array.isArray(REPAIR_FLOOR_UNITS)){REPAIR_FLOOR_UNITS.splice(0,REPAIR_FLOOR_UNITS.length,...simulationClone(repairIQSimulation.floorSnapshot));repairFloorSelectedId=repairIQSimulation.floorSelectedSnapshot;if(typeof renderRepairFloor==="function")renderRepairFloor();}if(repairIQSimulation.labSnapshot&&Array.isArray(VIRTUAL_LAB_STATIONS)){VIRTUAL_LAB_STATIONS.splice(0,VIRTUAL_LAB_STATIONS.length,...simulationClone(repairIQSimulation.labSnapshot));virtualLabSelectedId=repairIQSimulation.labSelectedSnapshot||"03";if(typeof renderVirtualLab==="function")renderVirtualLab();}}
function startRepairIQSimulation(){const shell=simulationElement("repairiq-simulation");if(!shell)return;repairIQSimulation.previousView=typeof state==="object"&&state?.activeView?state.activeView:"dashboard";simulationTakeSnapshot();repairIQSimulation.active=true;repairIQSimulation.index=0;repairIQSimulation.auto=false;shell.hidden=false;shell.setAttribute("aria-hidden","false");document.body.classList.add("simulation-active");simulationRender();showToast("RepairIQ Workflow Demo started.");}
function exitRepairIQSimulation(restoreData=true){const shell=simulationElement("repairiq-simulation");if(!shell)return;window.clearTimeout(repairIQSimulation.timer);repairIQSimulation.timer=null;repairIQSimulation.active=false;repairIQSimulation.auto=false;shell.hidden=true;shell.setAttribute("aria-hidden","true");document.body.classList.remove("simulation-active");if(restoreData)simulationRestoreSnapshot();simulationSwitchView(repairIQSimulation.previousView||"dashboard");}
function simulationNext(){if(repairIQSimulation.index>=REPAIRIQ_SIMULATION_STEPS.length-1){exitRepairIQSimulation(true);showToast("RepairIQ Workflow Demo complete.");return;}repairIQSimulation.index+=1;simulationRender();}
function simulationPrevious(){if(repairIQSimulation.index<=0)return;repairIQSimulation.index-=1;simulationRender();}
function simulationRestart(){repairIQSimulation.index=0;simulationRender();}
function simulationScheduleAuto(){window.clearTimeout(repairIQSimulation.timer);repairIQSimulation.timer=null;if(!repairIQSimulation.active||!repairIQSimulation.auto)return;repairIQSimulation.timer=window.setTimeout(()=>{if(!repairIQSimulation.active||!repairIQSimulation.auto)return;if(repairIQSimulation.index>=REPAIRIQ_SIMULATION_STEPS.length-1){repairIQSimulation.auto=false;simulationRender();return;}repairIQSimulation.index+=1;simulationRender();},5200);}
function initializeRepairIQSimulation(){
  addListener("#start-live-simulation-button","click",startRepairIQSimulation);addListener("#simulation-close","click",()=>exitRepairIQSimulation(true));addListener("#simulation-prev","click",simulationPrevious);addListener("#simulation-next","click",simulationNext);addListener("#simulation-restart","click",simulationRestart);
  addListener("#simulation-auto","click",()=>{repairIQSimulation.auto=!repairIQSimulation.auto;simulationRender();});
  document.addEventListener("keydown",event=>{if(!repairIQSimulation.active)return;if(event.key==="Escape"){event.preventDefault();exitRepairIQSimulation(true);}else if(event.key==="ArrowRight"){event.preventDefault();simulationNext();}else if(event.key==="ArrowLeft"){event.preventDefault();simulationPrevious();}});
}
document.addEventListener("DOMContentLoaded",initializeRepairIQSimulation);

/* ================================================================
   DASHBOARD PRODUCTION OPERATIONS SNAPSHOT
   ================================================================ */

function repairIQProductionCounts(){
  const floor=Array.isArray(REPAIR_FLOOR_UNITS)?REPAIR_FLOOR_UNITS:[],lab=Array.isArray(VIRTUAL_LAB_STATIONS)?VIRTUAL_LAB_STATIONS:[];
  const occupied=lab.filter(s=>s.unit&&s.unit!=="—");
  return{floorCount:floor.length,ready:floor.filter(u=>u.status==="ready").length,troubleshoot:floor.filter(u=>u.status==="failed").length,swap:floor.filter(u=>u.status==="swap").length,baseboard:floor.filter(u=>u.status==="baseboard").length,label:floor.filter(u=>u.status==="passed").length,testing:occupied.filter(s=>["testing","attention"].includes(String(s.status).toLowerCase())||/running|retest/i.test(String(s.result||""))).length,available:lab.filter(s=>!s.unit||s.unit==="—"||s.status==="available").length,totalTesters:lab.length};
}

function updateProductionOperationsSnapshot(activeFlow=null){
  if(!document.querySelector("#production-snapshot-title"))return;
  const c=repairIQProductionCounts();
  setText("#ops-floor-count",String(c.floorCount));setText("#ops-testing-count",String(c.testing));setText("#ops-ready-count",String(c.ready));setText("#ops-troubleshoot-count",String(c.troubleshoot));setText("#ops-swap-count",String(c.swap));setText("#ops-baseboard-count",String(c.baseboard));setText("#ops-label-count",String(c.label));setText("#ops-tester-availability",`${c.available} / ${c.totalTesters||12}`);setText("#ops-tester-detail",`${(c.totalTesters||12)-c.available} occupied · ${c.available} available`);
  setText("#flow-build-count",activeFlow==="build"?"1":"0");setText("#flow-floor-count",String(c.floorCount));setText("#flow-test-count",String(c.testing));setText("#flow-troubleshoot-count",String(c.troubleshoot));setText("#flow-swap-count",String(c.swap+c.baseboard));setText("#flow-retest-count",activeFlow==="retest"?String(Math.max(1,c.testing)):"0");setText("#flow-pass-count",String(c.label));setText("#flow-label-count",activeFlow==="label"?"1":"0");
  document.querySelectorAll(".production-flow-stage").forEach(x=>x.classList.toggle("active",!!activeFlow&&x.dataset.flow===activeFlow));
  const labels={build:"Build complete · awaiting traveler",floor:"Unit staged on Repair Floor",test:"Unit actively testing",troubleshoot:"Failed unit in SWAP troubleshooting",swap:"Validated component replacement",retest:"Verification retest in progress",pass:"Verified pass",label:"Ready for Label"};
  setText("#ops-flow-status",labels[activeFlow]||"Monitoring prototype workflow");
}
document.addEventListener("DOMContentLoaded",()=>updateProductionOperationsSnapshot());

/* ================================================================
   R.E.X. INTERACTIVE 2.5D AVATAR CONTROLLER
   ================================================================ */

let rexInteractiveTimerV10 = null;
function rexInteractiveReactionV10(kind,status){
  const stage=$("#rexAvatarStage");if(!stage)return;
  ["rex-react-head","rex-react-hand","rex-react-core","rex-react-easter"].forEach(c=>stage.classList.remove(c));
  void stage.offsetWidth;
  stage.classList.add(`rex-react-${kind}`);
  if(rexInteractiveTimerV10)clearTimeout(rexInteractiveTimerV10);
  if(status)setText("#rex-live-status",status);
  rexInteractiveTimerV10=setTimeout(()=>{stage.classList.remove(`rex-react-${kind}`);if(!rexReplyTimerV09)setText("#rex-live-status","R.E.X. is ready");},kind==="easter"?1150:760);
}
function initializeRexInteractiveV10(){
  const stage=$("#rexAvatarStage");if(!stage||stage.dataset.interactiveBound==="true")return;
  stage.dataset.interactiveBound="true";
  const reduced=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const reset=()=>{stage.classList.remove("rex-pointer-active");stage.style.setProperty("--rex-rx","0deg");stage.style.setProperty("--rex-ry","0deg");stage.style.setProperty("--rex-tx","0px");stage.style.setProperty("--rex-ty","0px");stage.style.setProperty("--rex-light-x","50%");stage.style.setProperty("--rex-light-y","42%");};
  stage.addEventListener("pointermove",event=>{if(reduced||event.pointerType==="touch")return;const r=stage.getBoundingClientRect();const nx=Math.max(-1,Math.min(1,((event.clientX-r.left)/r.width-.5)*2));const ny=Math.max(-1,Math.min(1,((event.clientY-r.top)/r.height-.5)*2));stage.classList.add("rex-pointer-active");stage.style.setProperty("--rex-ry",`${(nx*7.5).toFixed(2)}deg`);stage.style.setProperty("--rex-rx",`${(-ny*5).toFixed(2)}deg`);stage.style.setProperty("--rex-tx",`${(nx*4).toFixed(1)}px`);stage.style.setProperty("--rex-ty",`${(ny*2).toFixed(1)}px`);stage.style.setProperty("--rex-light-x",`${((nx+1)*50).toFixed(1)}%`);stage.style.setProperty("--rex-light-y",`${((ny+1)*50).toFixed(1)}%`);});
  stage.addEventListener("pointerleave",reset);
  stage.addEventListener("click",event=>{const r=stage.getBoundingClientRect(),x=(event.clientX-r.left)/r.width,y=(event.clientY-r.top)/r.height;if(y<.43)rexInteractiveReactionV10("head","R.E.X. acknowledges you");else if(y>.46&&y<.72&&x>.38&&x<.62)rexInteractiveReactionV10("core","Core interaction acknowledged");else rexInteractiveReactionV10("hand","R.E.X. is standing by");});
  stage.addEventListener("dblclick",event=>{event.preventDefault();rexInteractiveReactionV10("easter","R.E.X. says: still online. Still watching the evidence.");});
}
document.addEventListener("DOMContentLoaded",initializeRexInteractiveV10);

/* ================================================================
   R.E.X. 3D WEBGL / THREE.JS CONTROLLER — v2.1
   IMPROVED v1.0-PHASE2:
   - Delta-time smoothing in rex3DApplyLocalRotation
   - Better arm upper-bound clamp prevents backward swing
   - Counter-rotating hip/torso for natural weight shift
   - Micro-saccades in eye rendering
   - Squint-on-blink
   - Pupil dilation per mode
   - IMPROVED: structured bone-not-found reporting
   - IMPROVED: cancelAnimationFrame on disposal
   ================================================================ */

const REX_3D_CONFIG = Object.freeze({
  modelUrl: "assets/models/rex.glb",
  modelYaw: 0,
  modelScale: 1,
  cameraPadding: 1.18
});

const rex3D = {
  ready:false, failed:false,
  pointerX:0, pointerY:0, targetPointerX:0, targetPointerY:0,
  bones:Object.create(null), base:Object.create(null),
  THREE:null, renderer:null, scene:null, camera:null,
  model:null, clock:null, frame:0,
  gestureSeed:0, lastMode:"ready", modeChangedAt:0,
  face:null, faceMode:0, portalStart:-1, portalDuration:8.5,
  portalStep:"full", droplets:[],
  originalModelPosition:null,
  gpuDemo:null,
  /* IMPROVED v1.0-PHASE2: per-frame delta for slerp damping */
  lastFrameTime:0,
  /* IMPROVED v1.0-PHASE2: micro-saccade state */
  saccadeTargetX:0, saccadeTargetY:0, saccadeX:0, saccadeY:0, saccadeTimer:0
};

function rex3DClamp(value,min,max){return Math.max(min,Math.min(max,value));}

function rex3DFindBone(model,names){
  for(const name of names){
    const object=model.getObjectByName(name);
    if(object?.isBone)return object;
  }
  return null;
}

function rex3DRegisterBones(model){
  const map={
    root:["root"],hips:["DEF-spine","hips"],torso:["DEF-spine002","torso"],chest:["DEF-spine003","chest"],neck:["DEF-spine005","neck"],head:["DEF-spine006","head"],jaw:["DEF-jaw","jaw_master","jaw"],
    shoulderL:["DEF-shoulderL","shoulderL"],shoulderR:["DEF-shoulderR","shoulderR"],
    upperArmL:["DEF-upper_armL","upper_arm_fkL"],upperArmR:["DEF-upper_armR","upper_arm_fkR"],
    forearmL:["DEF-forearmL","forearm_fkL"],forearmR:["DEF-forearmR","forearm_fkR"],
    handL:["DEF-handL","hand_fkL"],handR:["DEF-handR","hand_fkR"],
    thumb1L:["DEF-thumb01L"],thumb2L:["DEF-thumb02L"],thumb3L:["DEF-thumb03L"],
    index1L:["DEF-f_index01L"],index2L:["DEF-f_index02L"],index3L:["DEF-f_index03L"],
    middle1L:["DEF-f_middle01L"],middle2L:["DEF-f_middle02L"],middle3L:["DEF-f_middle03L"],
    ring1L:["DEF-f_ring01L"],ring2L:["DEF-f_ring02L"],ring3L:["DEF-f_ring03L"],
    pinky1L:["DEF-f_pinky01L"],pinky2L:["DEF-f_pinky02L"],pinky3L:["DEF-f_pinky03L"],
    thumb1R:["DEF-thumb01R"],thumb2R:["DEF-thumb02R"],thumb3R:["DEF-thumb03R"],
    index1R:["DEF-f_index01R"],index2R:["DEF-f_index02R"],index3R:["DEF-f_index03R"],
    middle1R:["DEF-f_middle01R"],middle2R:["DEF-f_middle02R"],middle3R:["DEF-f_middle03R"],
    ring1R:["DEF-f_ring01R"],ring2R:["DEF-f_ring02R"],ring3R:["DEF-f_ring03R"],
    pinky1R:["DEF-f_pinky01R"],pinky2R:["DEF-f_pinky02R"],pinky3R:["DEF-f_pinky03R"],
    thighL:["DEF-thighL"],thighR:["DEF-thighR"],shinL:["DEF-shinL"],shinR:["DEF-shinR"],footL:["DEF-footL"],footR:["DEF-footR"]
  };
  const missing=[];
  Object.entries(map).forEach(([key,names])=>{
    const bone=rex3DFindBone(model,names);
    if(!bone){missing.push(key);return;}
    rex3D.bones[key]=bone;rex3D.base[key]=bone.quaternion.clone();
  });
  /* IMPROVED v1.0-PHASE2: structured reporting instead of silent failure */
  if(missing.length>0)console.warn(`R.E.X. 3D: ${missing.length} bones not found in GLB (${missing.join(", ")}). Animation will still run on available bones.`);
  console.info(`R.E.X. 3D: ${Object.keys(rex3D.bones).length} bones connected.`);
}

/* IMPROVED v1.0-PHASE2:
   delta-time aware slerp so animation is frame-rate independent.
   smoothFactor is in units of "per second". */
function rex3DApplyLocalRotation(key,x=0,y=0,z=0,smoothFactor=8){
  const bone=rex3D.bones[key],base=rex3D.base[key],THREE=rex3D.THREE;
  if(!bone||!base||!THREE)return;
  const dt=rex3D.lastFrameTime>0?Math.min(rex3D.lastFrameTime,0.05):0.016;
  const alpha=1-Math.exp(-smoothFactor*dt);
  const offset=new THREE.Quaternion().setFromEuler(new THREE.Euler(x,y,z,"XYZ"));
  const target=base.clone().multiply(offset);
  bone.quaternion.slerp(target,alpha);
}

/* V4.0 GPU PRESENTATION — self-contained procedural demonstration object.
   Does not connect to hardware or authorize repairs. */
function rexGpuSmooth(v){v=rex3DClamp(v,0,1);return v*v*(3-2*v);}
function rexGpuBuild(){
  const T=rex3D.THREE;
  if(!T||!rex3D.scene||rex3D.gpuDemo?.object)return;
  // V5.5: refined, palm-centered GPU hologram. Existing arm and palm animations remain untouched.
  const root=new T.Group();root.name="REX_V55_FLOATING_GPU_HOLOGRAM";
  const cyan=0x20d9e8,bright=0xa7fbff,blue=0x2f81f7;
  const pcbMat=new T.MeshStandardMaterial({color:0x0b2637,emissive:0x09506d,emissiveIntensity:.70,transparent:true,opacity:.92,metalness:.32,roughness:.27,depthWrite:false,side:T.DoubleSide});
  const chipMat=new T.MeshStandardMaterial({color:0x061727,emissive:0x1185a6,emissiveIntensity:1.0,transparent:true,opacity:.97,depthWrite:false});
  const traceMat=new T.MeshBasicMaterial({color:cyan,transparent:true,opacity:.72,depthWrite:false});
  const edgeMat=new T.LineBasicMaterial({color:bright,transparent:true,opacity:.94,depthWrite:false});
  // Model units match the existing R.E.X. rig scale. Hologram is intentionally illustrative.
  const board=new T.Mesh(new T.BoxGeometry(.122,.005,.085),pcbMat);root.add(board);
  const outline=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(.124,.009,.087)),edgeMat);root.add(outline);
  const chip=new T.Mesh(new T.BoxGeometry(.039,.010,.039),chipMat);chip.position.y=.009;root.add(chip);
  const chipBorder=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(.042,.012,.042)),edgeMat);chipBorder.position.y=.009;root.add(chipBorder);
  const chipCore=new T.Mesh(new T.BoxGeometry(.018,.0018,.018),new T.MeshBasicMaterial({color:0x9af7ff,transparent:true,opacity:.80,depthWrite:false}));
  chipCore.position.y=.015;root.add(chipCore);
  for(const x of [-.045,-.029,.029,.045])for(const z of[-.029,.029]){
    const memory=new T.Mesh(new T.BoxGeometry(.011,.004,.012),pcbMat);
    memory.position.set(x,.005,z);root.add(memory);
  }
  const traces=new T.Group();root.add(traces);
  for(const z of[-.035,-.025,.025,.035]){
    const line=new T.Mesh(new T.BoxGeometry(.108,.001,.0015),traceMat);
    line.position.set(0,.005,z);traces.add(line);
  }
  for(const x of[-.052,-.038,.038,.052]){
    const line=new T.Mesh(new T.BoxGeometry(.0015,.001,.072),traceMat);
    line.position.set(x,.005,0);traces.add(line);
  }
  // Energy field reaches down toward the hand while GPU itself stays above it.
  const beamMat=new T.MeshBasicMaterial({color:cyan,transparent:true,opacity:.17,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending});
  const beam=new T.Mesh(new T.CylinderGeometry(.019,.033,.057,32,1,true),beamMat);
  beam.position.y=-.034;root.add(beam);
  const ringMat=new T.MeshBasicMaterial({color:bright,transparent:true,opacity:.88,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending});
  const ring=new T.Mesh(new T.TorusGeometry(.050,.0013,8,64),ringMat);
  ring.rotation.x=Math.PI/2;ring.position.y=-.063;root.add(ring);
  const upperRing=new T.Mesh(new T.TorusGeometry(.071,.0009,6,64),ringMat.clone());
  upperRing.rotation.x=Math.PI/2;upperRing.position.y=-.012;root.add(upperRing);
  const halo=new T.PointLight(blue,.43,.28);halo.position.set(0,.020,0);root.add(halo);
  root.visible=false;rex3D.scene.add(root);
  // V5.6: inspection scan plane and evidence-safe highlighting.
  const scanMat=new T.MeshBasicMaterial({color:0x55efff,transparent:true,opacity:.0,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending});
  const scan=new T.Mesh(new T.PlaneGeometry(.18,.14),scanMat);
  scan.rotation.x=-Math.PI/2;scan.visible=false;root.add(scan);
  const scanEdge=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(.126,.012,.089)),new T.LineBasicMaterial({color:0x68f7ff,transparent:true,opacity:.0,depthWrite:false}));
  scanEdge.visible=false;root.add(scanEdge);
  // V5.7: named, illustrative inspection targets. These are visual regions,
  // not evidence of a real hardware defect.
  const targets=new T.Group();targets.name="REX_V57_INSPECTION_TARGETS";root.add(targets);
  const targetDefs=[
    {name:"PROCESSOR",x:0,z:0,color:0x8dfaff},
    {name:"MEMORY",x:-.039,z:.028,color:0x82bbff},
    {name:"CONNECTORS",x:.052,z:0,color:0xffca80}
  ];
  const markers=[];
  for(const d of targetDefs){
    const marker=new T.Mesh(new T.TorusGeometry(.014,.0016,6,36),
      new T.MeshBasicMaterial({color:d.color,transparent:true,opacity:.9,depthWrite:false,blending:T.AdditiveBlending}));
    marker.rotation.x=Math.PI/2;marker.position.set(d.x,.021,d.z);
    targets.add(marker);markers.push(marker);
  }
  targets.visible=false;
  // V5.13: separate illustrative layers, independent of the proven palm rig.
  const breakdown=new T.Group();breakdown.name="REX_GPU_EXPLODED_VIEW";root.add(breakdown);
  const layerDefs=[
    {name:"CONNECTOR INTERFACE",color:0xffca80,y:-.012,w:.115,d:.078},
    {name:"GPU PACKAGE",color:0x8dfaff,y:.010,w:.070,d:.059},
    {name:"MEMORY REGION",color:0x82bbff,y:.027,w:.105,d:.071},
    {name:"THERMAL ASSEMBLY",color:0x9de6ff,y:.043,w:.113,d:.077}
  ];
  const layers=layerDefs.map((def,i)=>{
    const group=new T.Group();group.position.y=def.y;breakdown.add(group);
    const mat=new T.MeshBasicMaterial({color:def.color,transparent:true,opacity:.17,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending});
    const plate=new T.Mesh(new T.BoxGeometry(def.w,.003,def.d),mat);group.add(plate);
    const edge=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(def.w,.004,def.d)),new T.LineBasicMaterial({color:def.color,transparent:true,opacity:.9,depthWrite:false}));group.add(edge);
    if(i===1){const core=new T.Mesh(new T.BoxGeometry(.035,.009,.035),new T.MeshBasicMaterial({color:def.color,transparent:true,opacity:.55,depthWrite:false}));core.position.y=.007;group.add(core);}
    if(i===2){for(const x of[-.037,.037])for(const z of[-.025,.025]){const memory=new T.Mesh(new T.BoxGeometry(.014,.004,.013),new T.MeshBasicMaterial({color:def.color,transparent:true,opacity:.6,depthWrite:false}));memory.position.set(x,.004,z);group.add(memory);}}
    return {group,base:def.y,name:def.name};
  });
  breakdown.visible=false;
  rex3D.gpuDemo={object:root,board,chip,beam,ring,upperRing,traces,scan,scanEdge,targets,markers,targetDefs,breakdown,layers,start:-1,duration:12,active:false,examining:false,breakingDown:false,inspectionStage:-1};
}
function rexGpuStart(){
  if(!rex3D.ready||!rex3D.clock)return;
  if(!rex3D.gpuDemo?.object)rexGpuBuild();
  if(!rex3D.gpuDemo)return;
  rex3D.portalStart=-1;
  rex3D.gpuDemo.start=rex3D.clock.getElapsedTime();rex3D.gpuDemo.active=true;rex3D.gpuDemo.examining=false;rex3D.gpuDemo.breakingDown=false;rex3D.gpuDemo.duration=12/REX_HYBRID_V515.speed;
  if(rex3D.gpuDemo.breakdown)rex3D.gpuDemo.breakdown.visible=false;
  if(rex3D.gpuDemo.board)rex3D.gpuDemo.board.visible=true;
  if(rex3D.gpuDemo.chip)rex3D.gpuDemo.chip.visible=true;
  if(rex3D.gpuDemo.targets)rex3D.gpuDemo.targets.visible=false;
  const status=document.getElementById("rex-gpu-inspection-status");if(status)status.style.display="none";
  const b=document.getElementById("rex-gpu-demo-button");if(b)b.textContent="GPU PRESENTATION ACTIVE";
}
/* V5.6: Examination reuses the VERIFIED GPU presentation pose and hand anchor.
   No new arm/hand bone rotations are introduced. */
function rexGpuExamineStart(){
  if(!rex3D.ready||!rex3D.clock)return;
  rexGpuStart();
  const g=rex3D.gpuDemo;if(!g)return;
  g.examining=true;g.breakingDown=false;
  g.duration=22/REX_HYBRID_V515.speed;
  g.inspectionStage=-1;
  const b=document.getElementById("rex-gpu-examine-button");
  if(b)b.textContent="EXAMINING GPU";
}
/* V5.13: illustrative exploded GPU demonstration; never represents a
   verified mechanical drawing or a diagnosed hardware failure. */
function rexGpuBreakdownStart(){
  rexGpuExamineStart();
  const g=rex3D.gpuDemo;if(!g)return;
  g.breakingDown=true;g.duration=26/REX_HYBRID_V515.speed;g.inspectionStage=-1;
  const b=document.getElementById("rex-gpu-breakdown-button");
  if(b)b.textContent="GPU BREAKDOWN ACTIVE";
}
function rexGpuInstallBreakdownButton(){
  if(document.getElementById("rex-gpu-breakdown-button"))return;
  const exam=document.getElementById("rex-gpu-examine-button");
  if(!exam)return;
  const button=document.createElement("button");
  button.id="rex-gpu-breakdown-button";button.type="button";
  button.textContent="GPU BREAKDOWN";
  button.className=exam.className;
  button.setAttribute("aria-label","Show an illustrative exploded-view GPU component breakdown");
  exam.insertAdjacentElement("afterend",button);
  button.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();rexGpuBreakdownStart();});
}
function rexGpuInstallExamineButton(){
  if(document.getElementById("rex-gpu-examine-button")){rexGpuInstallBreakdownButton();return;}
  const present=document.getElementById("rex-gpu-demo-button");
  if(!present?.parentElement)return;
  const button=document.createElement("button");
  button.id="rex-gpu-examine-button";button.type="button";
  button.textContent="GPU EXAMINATION";
  button.setAttribute("aria-label","Examine the holographic GPU with a diagnostic scan");
  button.className=present.className;
  present.insertAdjacentElement("afterend",button);
  if(!document.getElementById("rex-gpu-inspection-status")){
    const status=document.createElement("span");
    status.id="rex-gpu-inspection-status";
    status.setAttribute("role","status");
    status.setAttribute("aria-live","polite");
    status.style.cssText="font:600 10px/1.4 monospace;color:#7defff;white-space:nowrap;padding:5px 8px;display:none";
    button.insertAdjacentElement("afterend",status);
  }
  button.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();rexGpuExamineStart();});
  rexGpuInstallBreakdownButton();
}
/* V4.6: Locate the palm from the actual skinned hand bones, not a guessed
   fixed offset behind the wrist. The GPU remains horizontal in world space. */
function rexGpuPalmFrame(){
  const T=rex3D.THREE,b=rex3D.bones;
  if(!T||!b.handR)return null;
  b.handR.updateWorldMatrix(true,true);
  const wrist=new T.Vector3();b.handR.getWorldPosition(wrist);
  const middle=new T.Vector3(),index=new T.Vector3(),pinky=new T.Vector3();
  const hasMiddle=!!b.middle1R,hasIndex=!!b.index1R,hasPinky=!!b.pinky1R;
  if(hasMiddle)b.middle1R.getWorldPosition(middle);
  if(hasIndex)b.index1R.getWorldPosition(index);
  if(hasPinky)b.pinky1R.getWorldPosition(pinky);
  const toward=hasMiddle?middle.clone().sub(wrist):new T.Vector3(0,0,.027);
  const span=hasIndex&&hasPinky?index.clone().sub(pinky):new T.Vector3(.02,0,0);
  // Actual palm center lies between wrist and knuckle line.
  const center=wrist.clone().addScaledVector(toward,.57);
  return {wrist,center,toward,span};
}
function rexGpuOrientPalm(progress){
  const T=rex3D.THREE,hand=rex3D.bones.handR;
  if(!T||!hand||!hand.parent)return;
  const f=rexGpuPalmFrame();if(!f||f.toward.lengthSq()<1e-9||f.span.lengthSq()<1e-9)return;
  // Twist ONLY around the hand's long axis, preserving elbow and reach pose.
  const axis=f.toward.clone().normalize();
  const normal=f.span.clone().cross(axis).normalize();
  const up=new T.Vector3(0,1,0);
  const projected=up.clone().addScaledVector(axis,-up.dot(axis)).normalize();
  if(projected.lengthSq()<1e-8)return;
  const signed=Math.atan2(axis.dot(normal.clone().cross(projected)),normal.dot(projected));
  // Rig orientation may be mirrored: choose the smallest correction to face up.
  const angle=rex3DClamp(signed,-1.35,1.35)*rexGpuSmooth(progress);
  const twist=new T.Quaternion().setFromAxisAngle(axis,angle);
  const worldQ=new T.Quaternion();hand.getWorldQuaternion(worldQ);
  const parentQ=new T.Quaternion();hand.parent.getWorldQuaternion(parentQ);
  const desired=parentQ.clone().invert().multiply(twist.multiply(worldQ));
  const dt=Math.min(rex3D.lastFrameTime||.016,.05);
  hand.quaternion.slerp(desired,1-Math.exp(-15*dt));
  hand.updateWorldMatrix(true,true);
}
function rexGpuUpdate(t){
  const g=rex3D.gpuDemo,T=rex3D.THREE;
  if(!g?.object||!T)return;
  if(!g.active||!rex3D.bones.handR){g.object.visible=false;return;}
  const p=rex3DClamp((t-g.start)/g.duration,0,1);
  const reveal=rexGpuSmooth((p-.19)/.12)*(1-rexGpuSmooth((p-.90)/.10));
  g.object.visible=reveal>.005;
  if(g.object.visible){
    const frame=rexGpuPalmFrame();
    if(frame){
      // Hover above palm, with a tiny vertical oscillation. No skeletal rotation changes.
      const hover=.067+Math.sin(t*2.1)*.0022;
      // Offset toward R.E.X. from the knuckles to keep the projection centered over the palm.
      // Do not modify the working shoulder, elbow, wrist, or finger rotations.
      const palmBack=frame.toward.clone().normalize().multiplyScalar(-.011);
      g.object.position.copy(frame.center).add(palmBack).add(new T.Vector3(0,hover,0));
      // Examination rotates the hologram only; the supporting hand stays locked.
      // V5.7 inspection choreography: rotate -> pause at processor -> memory
      // -> connectors -> return. Never changes the verified supporting-arm pose.
      let inspectionStage=-1;
      let angle=Math.sin(t*.42)*.17;
      if(g.examining){
        if(p<.29){inspectionStage=0;angle=rexGpuSmooth((p-.19)/.10)*.52;}
        else if(p<.45){inspectionStage=1;angle=.52;}
        else if(p<.59){inspectionStage=2;angle=.52+rexGpuSmooth((p-.45)/.14)*.75;}
        else if(p<.74){inspectionStage=3;angle=1.27;}
        else if(p<.88){inspectionStage=4;angle=1.27+rexGpuSmooth((p-.74)/.14)*.65;}
        else {inspectionStage=5;angle=1.92*(1-rexGpuSmooth((p-.88)/.10));}
      }
      if(g.breakingDown){
        const expand=rexGpuSmooth((p-.23)/.16)*(1-rexGpuSmooth((p-.81)/.14));
        angle=.15+rexGpuSmooth((p-.15)/.14)*.22;
        if(g.breakdown){
          g.breakdown.visible=expand>.005;
          g.layers.forEach((layer,i)=>{
            layer.group.position.y=layer.base+expand*(i-.7)*.041;
            layer.group.rotation.y=Math.sin(t*.5+i*.6)*.06*expand;
            layer.group.scale.setScalar(1+expand*.13);
            layer.group.visible=true;
          });
        }
        if(g.board)g.board.visible=expand<.01;
        if(g.chip)g.chip.visible=expand<.01;
        inspectionStage=p<.23?0:p<.39?1:p<.52?2:p<.65?3:p<.79?4:5;
      }
      g.object.rotation.set(0,angle,0);
      if(g.targets){
        g.targets.visible=g.examining&&!g.breakingDown&&inspectionStage>=1&&inspectionStage<=4;
        g.markers.forEach((marker,i)=>{
          const active=(inspectionStage===1&&i===0)||(inspectionStage===2&&i===1)||(inspectionStage>=3&&i===2);
          marker.visible=active;
          marker.scale.setScalar(active?1+.12*Math.sin(t*5):1);
        });
      }
      if(g.examining&&inspectionStage!==g.inspectionStage){
        g.inspectionStage=inspectionStage;
        const status=document.getElementById("rex-gpu-inspection-status");
        const messages=["ROTATING GPU","INSPECTING PROCESSOR","INSPECTING MEMORY","INSPECTING CONNECTORS","REVIEWING CONNECTIONS","RETURNING TO PRESENTATION"];
        const breakdownMessages=["PREPARING GPU","CONNECTOR INTERFACE","GPU PACKAGE","MEMORY REGION","THERMAL ASSEMBLY","REASSEMBLING GPU"];
        if(status){status.style.display="inline-block";status.textContent=(g.breakingDown?breakdownMessages:messages)[inspectionStage]||"GPU EXAMINATION";}
        rexGpuNarrateV514(g.breakingDown?"breakdown":"examination",inspectionStage);
      }
      if(g.scan){
        g.scan.visible=g.examining&&p>.24&&p<.87;
        g.scan.position.y=.010;
        g.scan.position.z=-.056+.112*((t-g.start)*.45%1);
        g.scan.material.opacity=g.scan.visible?.12:0;
      }
      if(g.scanEdge){
        g.scanEdge.visible=g.examining&&p>.24&&p<.87;
        g.scanEdge.material.opacity=g.scanEdge.visible?.55+.30*Math.sin(t*5):0;
      }
      g.object.scale.setScalar(Math.max(.001,reveal*1.38));
      if(g.beam?.material)g.beam.material.opacity=.14+.06*(.5+.5*Math.sin(t*3.8));
      if(g.ring)g.ring.rotation.z=t*.62;
      if(g.upperRing)g.upperRing.rotation.z=-t*.36;
      if(g.chip?.material)g.chip.material.emissiveIntensity=.95+.18*Math.sin(t*4);
      if(g.traces)g.traces.visible=true;
    }
  }
  if(p>=1){g.active=false;g.examining=false;g.breakingDown=false;g.object.visible=false;
    if(g.breakdown)g.breakdown.visible=false;
    if(g.board)g.board.visible=true;
    if(g.chip)g.chip.visible=true;
    if(g.targets)g.targets.visible=false;
    const status=document.getElementById("rex-gpu-inspection-status");
    if(status){status.style.display="none";status.textContent="";}
    const b=document.getElementById("rex-gpu-demo-button");if(b)b.textContent="PRESENT GPU";
    const e=document.getElementById("rex-gpu-examine-button");if(e)e.textContent="GPU EXAMINATION";
    const bd=document.getElementById("rex-gpu-breakdown-button");if(bd)bd.textContent="GPU BREAKDOWN";
  }
}
function rexGpuInstallButton(){
  if(document.getElementById("rex-gpu-demo-button")){
    const existing=document.getElementById("rex-gpu-demo-button");
    if(existing.parentElement&&existing.parentElement.firstElementChild!==existing)existing.parentElement.insertBefore(existing,existing.parentElement.firstElementChild);
    rexGpuInstallExamineButton();
    return;
  }
  const portal=document.getElementById("rex-v15-portal-trigger");
  const stage=document.getElementById("rexAvatarStage");
  if(!stage)return;
  const button=document.createElement("button");button.id="rex-gpu-demo-button";button.type="button";
  button.textContent="PRESENT GPU";button.setAttribute("aria-label","Play R.E.X. GPU presentation demonstration");
  if(portal?.parentElement){portal.parentElement.insertBefore(button,portal.parentElement.firstElementChild);button.className=portal.className;}
  else {stage.appendChild(button);button.style.cssText="position:absolute;z-index:30;top:12px;right:12px;padding:8px;background:#07263a;color:#65eaff;border:1px solid #20d9e8;border-radius:8px;cursor:pointer";}
  button.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();rexGpuStart();});
  rexGpuInstallExamineButton();
}
document.addEventListener("DOMContentLoaded",()=>{
  rexGpuInstallButton();rexGpuInstallExamineButton();
});

function rex3DAnimate(){
  if(!rex3D.ready)return;
  const now=rex3D.clock.getElapsedTime();
  rex3D.lastFrameTime=now-(rex3D.clock.previousTime||0);
  rex3D.clock.previousTime=now;
  const t=now;

  const stage=document.getElementById("rexAvatarStage");
  const mode=stage?.dataset.rexState||"ready";

  if(mode!==rex3D.lastMode){rex3D.lastMode=mode;rex3D.modeChangedAt=t;rex3D.gestureSeed+=1;}
  const stateAge=t-rex3D.modeChangedAt;
  const enter=rex3DClamp(stateAge/0.45,0,1);
  const ease=enter*enter*(3-2*enter);

  rex3D.pointerX+=(rex3D.targetPointerX-rex3D.pointerX)*0.055;
  rex3D.pointerY+=(rex3D.targetPointerY-rex3D.pointerY)*0.055;

  /* IMPROVED v1.0-PHASE2: micro-saccade system */
  rex3D.saccadeTimer-=rex3D.lastFrameTime;
  if(rex3D.saccadeTimer<=0){
    rex3D.saccadeTargetX=(Math.random()-0.5)*0.022;
    rex3D.saccadeTargetY=(Math.random()-0.5)*0.015;
    rex3D.saccadeTimer=1.8+Math.random()*4.2;
  }
  rex3D.saccadeX+=(rex3D.saccadeTargetX-rex3D.saccadeX)*0.08;
  rex3D.saccadeY+=(rex3D.saccadeTargetY-rex3D.saccadeY)*0.08;

  const px=rex3D.pointerX, py=rex3D.pointerY;
  const breathe=Math.sin(t*1.45);
  const breathe2=Math.sin(t*1.45-0.8);
  const sway=Math.sin(t*0.62);
  const slow=Math.sin(t*0.31);
  const micro=Math.sin(t*2.2)*0.5+Math.sin(t*1.13)*0.5;
  const scan=Math.sin(t*1.18);
  const talk=Math.sin(t*7.3)*0.5+Math.sin(t*4.7)*0.5;
  const phrase=Math.sin(t*1.72);
  const phrase2=Math.sin(t*1.07+1.2);
  const emphasis=Math.max(0,Math.sin(t*0.86+rex3D.gestureSeed));

  let headX=-py*0.10+breathe*0.010+rex3D.saccadeY*0.3;
  let headY=px*0.30+sway*0.025+rex3D.saccadeX*0.5;
  let headZ=sway*0.012;
  let neckX=-py*0.035, neckY=px*0.105+sway*0.010, neckZ=0;
  let chestX=breathe*0.030-py*0.012, chestY=px*0.055+sway*0.014, chestZ=sway*0.014;
  let torsoX=breathe2*0.008, torsoY=px*0.025;
  /* IMPROVED v1.0-PHASE2: hips counter-rotate relative to torso for natural weight shift */
  let hipsX=0, hipsY=px*0.008;
  let hipsZ=-slow*0.010; /* Opposes torsoZ for counter-rotation */
  let torsoZ=slow*0.012;
  let jawX=0;

  let shoulderLX=breathe*0.006, shoulderLY=0, shoulderLZ=0.012+slow*0.008;
  let shoulderRX=breathe*0.006, shoulderRY=0, shoulderRZ=-0.012-slow*0.008;

  /* IMPROVED v1.0-PHASE2: arm base values are conservative to prevent backward swing.
     Upper arms stay within ±0.30 rad on X. Forearms stay within ±0.40 rad. */
  let upperLX=0, upperLY=0, upperLZ=0.012+slow*0.012;
  let upperRX=0, upperRY=0, upperRZ=-0.012-slow*0.012;
  let foreLX=Math.sin(t*0.52)*0.008, foreLY=0, foreLZ=0;
  let foreRX=Math.sin(t*0.52+1.7)*0.008, foreRY=0, foreRZ=0;
  let handLX=0, handLY=slow*0.010, handLZ=sway*0.012;
  let handRX=0, handRY=-slow*0.010, handRZ=-sway*0.012;
  let fingerCurlL=0.045+(breathe+1)*0.010, fingerCurlR=0.045+(breathe2+1)*0.010;
  let thighLX=0, thighLY=0, thighLZ=slow*0.008;
  let thighRX=0, thighRY=0, thighRZ=-slow*0.008;
  let shinLX=0, shinRX=0, footLX=0, footRX=0;

  if(mode==="listening"){
    headX+=-0.055*ease; headY+=0.045*ease; headZ+=0.025*ease; neckX+=-0.020*ease; chestX+=-0.035*ease; torsoX+=-0.018*ease;
    shoulderLZ+=0.018*ease; shoulderRZ-=0.018*ease;
    upperLX-=0.025*ease; upperRX-=0.025*ease;
    fingerCurlL+=0.025*ease; fingerCurlR+=0.025*ease;
  } else if(mode==="analyzing"||mode==="remembering"){
    headY+=scan*0.20*ease; headX+=(-0.035+Math.sin(t*0.74)*0.025)*ease; neckY+=scan*0.075*ease;
    chestY+=scan*0.045*ease; torsoY+=scan*0.020*ease; chestX-=0.020*ease;
    shoulderRX-=0.055*ease; shoulderRZ-=0.055*ease;
    /* IMPROVED: clamp forearm to prevent backward swing */
    upperRX=rex3DClamp(upperRX+0.045*ease,-0.30,0.30);
    upperRY+=0.05*ease; upperRZ-=0.025*ease;
    foreRX=rex3DClamp(foreRX+0.075*ease,-0.40,0.40);
    foreRY+=0.08*ease; foreRZ+=0.018*ease;
    handRX+=0.08*ease; handRY+=(0.12+scan*0.06)*ease; handRZ+=0.06*ease;
    fingerCurlR=0.16+(scan+1)*0.035;
    upperLZ+=0.045*ease; foreLX-=0.045*ease; handLY-=0.035*ease; fingerCurlL=0.07;
  } else if(mode==="speaking"){
    headY+=Math.sin(t*1.95)*0.065*ease; headX+=Math.sin(t*2.55)*0.025*ease; headZ+=Math.sin(t*1.35)*0.018*ease;
    neckY+=Math.sin(t*1.95)*0.028*ease; chestY+=Math.sin(t*1.42)*0.032*ease; chestZ+=Math.sin(t*1.66)*0.024*ease;
    torsoY+=Math.sin(t*1.12)*0.018*ease; hipsZ+=Math.sin(t*0.70)*0.010*ease;
    jawX=Math.max(0,talk)*0.085*ease;
    const leftLead=(Math.sin(t*0.54+rex3D.gestureSeed)+1)*0.5, rightLead=1-leftLead;
    /* IMPROVED: use rex3DClamp on arm X to keep gestures forward-facing */
    shoulderLX+=(0.010+emphasis*0.012)*leftLead*ease;
    upperLX=rex3DClamp(upperLX+(0.10+Math.max(0,phrase)*0.08+emphasis*0.035)*leftLead*ease,-0.30,0.30);
    upperLY+=phrase2*0.045*leftLead*ease; upperLZ+=(0.045+phrase*0.025)*leftLead*ease;
    foreLX=rex3DClamp(foreLX+(0.20+Math.max(0,phrase)*0.12)*leftLead*ease,-0.40,0.40);
    foreLY+=phrase2*0.06*leftLead*ease; foreLZ-=0.025*leftLead*ease;
    handLX+=phrase2*0.035*leftLead*ease; handLY-=phrase*0.12*leftLead*ease; handLZ+=emphasis*0.05*leftLead*ease;
    shoulderRX+=(0.010+emphasis*0.012)*rightLead*ease;
    upperRX=rex3DClamp(upperRX+(0.055+Math.max(0,-phrase)*0.025)*rightLead*ease,-0.30,0.30);
    upperRY-=phrase2*0.012*rightLead*ease; upperRZ-=0.018*rightLead*ease;
    foreRX=rex3DClamp(foreRX+(0.085+Math.max(0,-phrase)*0.04)*rightLead*ease,-0.40,0.40);
    foreRY-=phrase2*0.015*rightLead*ease; foreRZ+=0.025*rightLead*ease;
    handRX-=phrase2*0.035*rightLead*ease; handRY+=phrase*0.12*rightLead*ease; handRZ-=emphasis*0.05*rightLead*ease;
    fingerCurlL=0.055+(1-emphasis)*0.065+Math.max(0,-phrase)*0.035;
    fingerCurlR=0.055+(1-emphasis)*0.065+Math.max(0,phrase)*0.035;
  } else {
    headX+=Math.sin(t*0.37)*0.012; headZ+=Math.sin(t*0.29+0.8)*0.010;
    chestX+=breathe*0.014; torsoX+=breathe2*0.006;
    /* IMPROVED: hips and torso counter-rotate naturally */
    hipsZ-=slow*0.006; /* Counter to torsoZ */
    thighLZ+=slow*0.004; thighRZ-=slow*0.004;
    handLY+=micro*0.006; handRY-=micro*0.006;
  }

  /* Portal performance */
  if(rex3D.portalStart>=0){
    const p=rex3DClamp((t-rex3D.portalStart)/rex3D.portalDuration,0,1);
    const sequence=rex3D.portalStep||"full";
    const smooth=v=>{v=rex3DClamp(v,0,1);return v*v*(3-2*v);};
    const grab=sequence==="grab"?smooth(p/.23)*(1-smooth((p-.80)/.18)):sequence==="reach"?0:smooth(p/.22)*(1-smooth((p-.48)/.18));
    const walk=sequence==="step"?smooth(p/.25)*(1-smooth((p-.78)/.20)):sequence==="reach"||sequence==="grab"?0:smooth((p-.33)/.18)*(1-smooth((p-.79)/.13));
    const release=smooth((p-.80)/.20);
    const outreach=sequence==="reach"?smooth(p/.2)*(1-smooth((p-.80)/.17)):sequence==="grab"?grab*.48:sequence==="step"?walk*.30:smooth((p-.15)/.18)*(1-smooth((p-.64)/.17));
    chestX-=grab*.09; torsoX-=grab*.07;
    shoulderLZ+=grab*.20; shoulderRZ-=grab*.20;
    /* IMPROVED: portal arms clamped */
    upperLX=rex3DClamp(upperLX+grab*.16+outreach*.40,-0.45,0.45);
    upperRX=rex3DClamp(upperRX+grab*.16+outreach*.40,-0.45,0.45);
    foreLX=rex3DClamp(foreLX+grab*.26+outreach*.43,-0.55,0.55);
    foreRX=rex3DClamp(foreRX+grab*.26+outreach*.43,-0.55,0.55);
    upperLZ+=outreach*.10; upperRZ-=outreach*.10;
    handLX+=outreach*.11; handRX+=outreach*.11; handLZ+=grab*.08; handRZ-=grab*.08;
    fingerCurlL+=grab*.24-outreach*.06; fingerCurlR+=grab*.24-outreach*.06;
    thighLX+=Math.sin((p-.35)*22)*walk*.23; thighRX-=Math.sin((p-.35)*22)*walk*.23;
    shinLX+=Math.max(0,Math.sin((p-.35)*22))*walk*.17; shinRX+=Math.max(0,-Math.sin((p-.35)*22))*walk*.17;
    if(rex3D.model&&rex3D.originalModelPosition){
      rex3D.model.position.copy(rex3D.originalModelPosition);
      rex3D.model.position.z+=(sequence==="reach"?.13*outreach:sequence==="grab"?.08*grab:.24*smooth((p-.30)/.45)*(1-release));
      rex3D.model.position.y+=.025*Math.abs(Math.sin((p-.35)*22))*walk;
    }
    if(p>=1){rex3D.portalStart=-1;rex3D.portalStep="full";rex3D.portalDuration=8.5;document.getElementById("rexAvatarStage")?.classList.remove("rex-v15-portal-active");const label=document.getElementById("rex-v15-portal-label");if(label)label.textContent="PORTAL · STANDBY";}
  } else if(rex3D.model&&rex3D.originalModelPosition){
    rex3D.model.position.lerp(rex3D.originalModelPosition,.10);
  }

  /* V4.0: coordinated GPU demonstration; existing portal and face remain intact. */
  if(rex3D.gpuDemo?.active){
    const p=rex3DClamp((t-rex3D.gpuDemo.start)/rex3D.gpuDemo.duration,0,1);
    const lift=rexGpuSmooth(p/.25)*(1-rexGpuSmooth((p-.83)/.17));
    const flip=rexGpuSmooth((p-.16)/.23)*(1-rexGpuSmooth((p-.83)/.17));
    /* This rig's forward bend is POSITIVE X (as in the working portal reach).
       Negative X was sending the presenting arm behind the torso. */
    upperRX+=0.43*lift;upperRZ-=0.13*lift;
    foreRX+=0.62*lift;foreRY+=0.12*flip;
    handRX+=0.15*flip;handRZ-=0.05*flip;
    fingerCurlR=0.06+0.07*flip;
    /* V5.8: Left-hand diagnostic pointing during component inspection.
       Preserve all proven right-arm and palm values. Small, reversible FK
       offsets are intentionally conservative pending visual rig calibration. */
    if(rex3D.gpuDemo.examining){
      const look=rexGpuSmooth((p-.16)/.20)*(1-rexGpuSmooth((p-.83)/.14));
      headX+=0.045*look;
      const point=rexGpuSmooth((p-.27)/.10)*(1-rexGpuSmooth((p-.76)/.12));
      /* V5.9: readable, staged examination pose. All values are local
         offsets from the imported rig's bind pose. Tune only these values
         if the left arm needs calibration for a different rex.glb. */
      const REX_POINT_POSE={
        upperForward:0.58, upperAcross:-0.24, upperOut:0.12,
        elbowBend:0.70, elbowAcross:-0.20,
        wristPitch:-0.10, wristYaw:0.04, wristRoll:-0.04
      };
      shoulderLX+=0.035*point;
      shoulderLZ+=0.025*point;
      upperLX+=REX_POINT_POSE.upperForward*point;
      upperLY+=REX_POINT_POSE.upperAcross*point;
      upperLZ+=REX_POINT_POSE.upperOut*point;
      foreLX+=REX_POINT_POSE.elbowBend*point;
      foreLY+=REX_POINT_POSE.elbowAcross*point;
      handLX+=REX_POINT_POSE.wristPitch*point;
      handLY+=REX_POINT_POSE.wristYaw*point;
      handLZ+=REX_POINT_POSE.wristRoll*point;
      /* Curl the non-pointing fingers; index remains extended below. */
      fingerCurlL=0.06+0.31*point;
    }
  }

  rex3DApplyLocalRotation("hips",hipsX,hipsY,hipsZ);
  rex3DApplyLocalRotation("torso",torsoX,torsoY,torsoZ);
  rex3DApplyLocalRotation("chest",chestX,chestY,chestZ);
  rex3DApplyLocalRotation("neck",neckX,neckY,neckZ);
  rex3DApplyLocalRotation("head",headX,headY,headZ);
  rex3DApplyLocalRotation("jaw",jawX,0,0);
  rex3DApplyLocalRotation("shoulderL",shoulderLX,shoulderLY,shoulderLZ);
  rex3DApplyLocalRotation("shoulderR",shoulderRX,shoulderRY,shoulderRZ);
  rex3DApplyLocalRotation("upperArmL",upperLX,upperLY,upperLZ);
  rex3DApplyLocalRotation("upperArmR",upperRX,upperRY,upperRZ);
  rex3DApplyLocalRotation("forearmL",foreLX,foreLY,foreLZ);
  rex3DApplyLocalRotation("forearmR",foreRX,foreRY,foreRZ);
  rex3DApplyLocalRotation("handL",handLX,handLY,handLZ);
  rex3DApplyLocalRotation("handR",handRX,handRY,handRZ);
  rex3DApplyLocalRotation("thighL",thighLX,thighLY,thighLZ);
  rex3DApplyLocalRotation("thighR",thighRX,thighRY,thighRZ);
  rex3DApplyLocalRotation("shinL",shinLX,0,0);
  rex3DApplyLocalRotation("shinR",shinRX,0,0);
  rex3DApplyLocalRotation("footL",footLX,0,0);
  rex3DApplyLocalRotation("footR",footRX,0,0);

  const fingerFactors={index:[0.48,0.76,0.60],middle:[0.56,0.84,0.68],ring:[0.61,0.88,0.72],pinky:[0.66,0.92,0.76]};
  for(const side of["L","R"]){
    const curl=side==="L"?fingerCurlL:fingerCurlR;
    const flutter=mode==="speaking"?Math.sin(t*3.1+(side==="L"?0:1.1))*0.012:0;
    for(const [finger,factors] of Object.entries(fingerFactors)){
      // During GPU inspection, straighten the left index finger while the
      // other three fingers curl to create a readable pointing gesture.
      const inspectionPoint=side==="L"&&rex3D.gpuDemo?.active&&rex3D.gpuDemo.examining
        ?rexGpuSmooth((rex3DClamp((t-rex3D.gpuDemo.start)/rex3D.gpuDemo.duration,0,1)-.27)/.10)
          *(1-rexGpuSmooth((rex3DClamp((t-rex3D.gpuDemo.start)/rex3D.gpuDemo.duration,0,1)-.76)/.12)):0;
      // V5.12: preserve the proven index pose; relax the other fingers individually.
      const inspectionCurls={middle:0.15,ring:0.19,pinky:0.16};
      const fingerCurl=finger==="index"?curl*(1-inspectionPoint):curl+inspectionPoint*(inspectionCurls[finger]||0);
      const relaxedFactors={middle:[0.49,0.75,0.57],ring:[0.54,0.80,0.62],pinky:[0.48,0.73,0.55]};
      const shaped=side==="L"&&inspectionPoint>0&&finger!=="index"?relaxedFactors[finger]:factors;
      rex3DApplyLocalRotation(`${finger}1${side}`,fingerCurl*shaped[0]+flutter,0,0,12);
      rex3DApplyLocalRotation(`${finger}2${side}`,fingerCurl*shaped[1]+flutter,0,0,12);
      rex3DApplyLocalRotation(`${finger}3${side}`,fingerCurl*shaped[2],0,0,12);
    }
    const sign=side==="L"?1:-1;
    rex3DApplyLocalRotation(`thumb1${side}`,curl*(side==="L"?0.20:0.28),sign*curl*(side==="L"?0.04:0.06),sign*curl*(side==="L"?0.12:0.20),12);
    rex3DApplyLocalRotation(`thumb2${side}`,curl*(side==="L"?0.25:0.44),0,sign*curl*(side==="L"?0.03:0.05),12);
    rex3DApplyLocalRotation(`thumb3${side}`,curl*(side==="L"?0.20:0.34),0,0,12);
  }

  if(rex3D.gpuDemo?.active){
    const progress=rex3DClamp((t-rex3D.gpuDemo.start)/rex3D.gpuDemo.duration,0,1);
    const flip=rexGpuSmooth((progress-.16)/.23)*(1-rexGpuSmooth((progress-.83)/.17));
    rexGpuOrientPalm(flip);
  }
  rexGpuUpdate(t);
  rexV15UpdateFace(t,mode);
  rex3D.renderer.render(rex3D.scene,rex3D.camera);
  rex3D.frame=requestAnimationFrame(rex3DAnimate);
}

function rex3DFitCamera(){
  const THREE=rex3D.THREE;
  if(!THREE||!rex3D.model||!rex3D.camera)return;
  const box=new THREE.Box3().setFromObject(rex3D.model);
  const size=box.getSize(new THREE.Vector3());
  const center=box.getCenter(new THREE.Vector3());
  rex3D.model.position.x-=center.x;rex3D.model.position.y-=center.y;rex3D.model.position.z-=center.z;
  const maxDim=Math.max(size.x,size.y,size.z)||1;
  const fov=rex3D.camera.fov*Math.PI/180;
  const distance=(maxDim/(2*Math.tan(fov/2)))*REX_3D_CONFIG.cameraPadding;
  rex3D.camera.position.set(0,size.y*0.02,distance);
  rex3D.camera.near=Math.max(distance/100,0.01);rex3D.camera.far=distance*100;
  rex3D.camera.lookAt(0,0,0);rex3D.camera.updateProjectionMatrix();
}

function rex3DResize(){
  if(!rex3D.ready)return;
  const canvas=document.getElementById("rex-3d-canvas"),shell=document.getElementById("rex-3d-shell");
  if(!canvas||!shell)return;
  const width=Math.max(1,shell.clientWidth),height=Math.max(1,shell.clientHeight);
  rex3D.camera.aspect=width/height;rex3D.camera.updateProjectionMatrix();
  rex3D.renderer.setSize(width,height,false);rex3D.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
}

/* IMPROVED v1.0-PHASE2: dispose on error, cancelAnimationFrame on cleanup */
function rex3DDispose(){
  if(rex3D.frame){cancelAnimationFrame(rex3D.frame);rex3D.frame=0;}
  if(rex3D.gpuDemo?.object){rex3D.scene?.remove(rex3D.gpuDemo.object);rex3D.gpuDemo.object.traverse(o=>{o.geometry?.dispose();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});rex3D.gpuDemo=null;}
  if(rex3D.renderer){rex3D.renderer.dispose();rex3D.renderer=null;}
  rex3D.ready=false;
}

async function initializeRex3DV11(){
  const stage=document.getElementById("rexAvatarStage"),shell=document.getElementById("rex-3d-shell"),canvas=document.getElementById("rex-3d-canvas"),loading=document.getElementById("rex-3d-loading");
  if(!stage||!shell||!canvas||shell.dataset.initialized==="true")return;
  shell.dataset.initialized="true";
  try{
    const THREE=await import("https://cdn.jsdelivr.net/npm/three@0.180.0/+esm");
    const{GLTFLoader}=await import("https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js/+esm");
    rex3D.THREE=THREE;
    rex3D.scene=new THREE.Scene();
    rex3D.camera=new THREE.PerspectiveCamera(32,1,0.01,1000);
    rex3D.renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"high-performance"});
    rex3D.renderer.setClearColor(0x000000,0);rex3D.renderer.outputColorSpace=THREE.SRGBColorSpace;
    rex3D.renderer.toneMapping=THREE.ACESFilmicToneMapping;rex3D.renderer.toneMappingExposure=1.08;
    rex3D.scene.add(new THREE.HemisphereLight(0xbfefff,0x071018,2.0));
    const key=new THREE.DirectionalLight(0xffffff,2.7);key.position.set(3,5,5);rex3D.scene.add(key);
    const rim=new THREE.DirectionalLight(0x63e8ff,2.0);rim.position.set(-4,2,-3);rex3D.scene.add(rim);
    const loader=new GLTFLoader();
    const gltf=await loader.loadAsync(REX_3D_CONFIG.modelUrl);
    rex3D.model=gltf.scene;rex3D.model.rotation.y=REX_3D_CONFIG.modelYaw;rex3D.model.scale.setScalar(REX_3D_CONFIG.modelScale);rex3D.scene.add(rex3D.model);
    rex3DRegisterBones(rex3D.model);
    rex3DFitCamera();
    rex3D.originalModelPosition=rex3D.model.position.clone();
    rexV15InitializeFace();
    rexGpuBuild();
    rex3D.clock=new THREE.Clock();
    rex3D.clock.previousTime=0;
    rex3D.ready=true;
    shell.classList.add("is-ready");
    if(loading)loading.textContent="R.E.X. 3D ONLINE";
    rex3DResize();rex3DAnimate();
    stage.addEventListener("pointermove",event=>{const r=stage.getBoundingClientRect();rex3D.targetPointerX=rex3DClamp(((event.clientX-r.left)/r.width-0.5)*2,-1,1);rex3D.targetPointerY=rex3DClamp(((event.clientY-r.top)/r.height-0.5)*2,-1,1);});
    stage.addEventListener("pointerleave",()=>{rex3D.targetPointerX=0;rex3D.targetPointerY=0;});
    const resizeObserver=new ResizeObserver(rex3DResize);resizeObserver.observe(shell);
    window.addEventListener("resize",rex3DResize,{passive:true});
    console.info("R.E.X. 3D core online",REX_3D_CONFIG.modelUrl);
  }catch(error){
    rex3D.failed=true;shell.classList.add("is-error");
    const fallback=document.getElementById("rex-avatar-fallback");
    if(fallback){fallback.hidden=false;fallback.textContent="R.E.X. 3D unavailable";}
    console.error("R.E.X. 3D failed to initialize:",error);
    rex3DDispose();
  }
}
document.addEventListener("DOMContentLoaded",initializeRex3DV11);

/* ================================================================
   R.E.X. V15+ FACE INITIALIZATION
   ================================================================ */

/* ================================================================
   R.E.X. FACE SYSTEM v3.0 — REFERENCE-MATCHED VISOR + EYES
   Based on canonical R.E.X. design sheet.

   VISOR: wide landscape panel (~75% helmet width)
   EYES:  almond/teardrop with 4 expression states
          FOCUSED · CURIOUS · ANALYTICAL · ALERT
   IRIS:  concentric ring architecture + 140 radial fibers
   NO MOUTH: never
   ================================================================ */

function rexV15InitializeFace() {
  const THREE = rex3D.THREE;
  const head = rex3D.bones.head;
  if (!THREE || !head || !rex3D.model) return;

  /* Remove previous face if reinitializing */
  if (rex3D.face?.group) rex3D.face.group.parent?.remove(rex3D.face.group);

  /* Canvas: 1920×1080 — landscape visor */
  const canvas = document.createElement("canvas");
  canvas.width  = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, rex3D.renderer.capabilities.getMaxAnisotropy());

  /*
    VISOR DIMENSIONS — matched to reference:
    Width ≈ 75-80% of helmet face area → 0.26 world units
    Aspect ratio: ~16:9 landscape (reference visor is landscape)
    The visor sits slightly below center-top of the head.
  */
  const vW = 0.172;                 // V3.3: 77% of measured 0.22-unit helmet width
  const vH = vW * (9 / 16);         // 0.1463 — landscape panel

  const group = new THREE.Group();
  group.name = "REX_V35_SurfaceFittedVisor";

  /* ── Build a curved rounded-rect panel ──────────────────── */
  function curvedVisorPanel(w, h, zOffset, curvature) {
    const r = Math.min(w, h) * 0.14; /* corner radius */
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2 + r, -h / 2);
    shape.lineTo( w / 2 - r, -h / 2);
    shape.quadraticCurveTo( w / 2, -h / 2,  w / 2, -h / 2 + r);
    shape.lineTo( w / 2,  h / 2 - r);
    shape.quadraticCurveTo( w / 2,  h / 2,  w / 2 - r,  h / 2);
    shape.lineTo(-w / 2 + r,  h / 2);
    shape.quadraticCurveTo(-w / 2,  h / 2, -w / 2,  h / 2 - r);
    shape.lineTo(-w / 2, -h / 2 + r);
    shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);

    const geo = new THREE.ShapeGeometry(shape, 16);
    const pos = geo.attributes.position;
    const uv  = geo.attributes.uv;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      /* Horizontal curve — convex toward viewer */
      const nx = x / (w / 2);
      pos.setZ(i, zOffset - curvature * nx * nx);
      uv.setXY(i, x / w + 0.5, y / h + 0.5);
    }
    geo.computeVertexNormals();
    return geo;
  }

  /* Metal outer rim */
  const rimMesh = new THREE.Mesh(
    curvedVisorPanel(vW * 1.055, vH * 1.065, -0.003, 0.006),
    new THREE.MeshPhysicalMaterial({
      color: 0x7a8e98, metalness: 0.96, roughness: 0.17,
      clearcoat: 1.0, clearcoatRoughness: 0.10, side: THREE.DoubleSide
    })
  );
  rimMesh.name = "REX_V30_MetalRim";
  group.add(rimMesh);

  /* Dark glass bezel */
  const bezelMesh = new THREE.Mesh(
    curvedVisorPanel(vW * 1.025, vH * 1.030, -0.001, 0.005),
    new THREE.MeshPhysicalMaterial({
      color: 0x050f18, metalness: 0.72, roughness: 0.20,
      clearcoat: 1.0, side: THREE.DoubleSide
    })
  );
  bezelMesh.name = "REX_V30_DarkGlassBezel";
  group.add(bezelMesh);

  /* Canvas display surface */
  const displayMesh = new THREE.Mesh(
    curvedVisorPanel(vW, vH, 0.001, 0.004),
    new THREE.MeshBasicMaterial({
      map: tex, toneMapped: false,
      side: THREE.DoubleSide, depthTest: false, depthWrite: false
    })
  );
  displayMesh.name = "REX_V30_1920x1080_Display";
  displayMesh.renderOrder = 10000;
  group.add(displayMesh);

  /* Depth-sort: always on top */
  rimMesh.material.depthTest  = false; rimMesh.material.depthWrite  = false; rimMesh.renderOrder = 9997;
  bezelMesh.material.depthTest = false; bezelMesh.material.depthWrite = false; bezelMesh.renderOrder = 9998;

  /* ── V3.5: fit the visor against the ACTUAL head surface ──
     Keep V3.4's working visor dimensions and digital eye artwork.
     Raycast from the front of the helmet to locate its visible surface.
     This is a surface-fitted visual insert, not a physical hole in GLB.
  */
  rex3D.model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(rex3D.model);
  const dims = bounds.getSize(new THREE.Vector3());
  const centerX = (bounds.min.x + bounds.max.x) * 0.5;
  // V3.4 was at the forehead; shift the display toward the face center.
  const faceCenterY = bounds.max.y - dims.y * 0.103 - 0.027;
  const raycaster = new THREE.Raycaster();
  const forward = new THREE.Vector3(0, 0, -1);
  const rayStartZ = bounds.max.z + 0.25;
  const candidates = [];
  rex3D.model.traverse(obj => {
    if (obj.isMesh || obj.isSkinnedMesh) candidates.push(obj);
  });

  function headSurfaceZ(x, y) {
    raycaster.set(new THREE.Vector3(x, y, rayStartZ), forward);
    const hits = raycaster.intersectObjects(candidates, false);
    // Intersections must be near the intended facial plane, not the torso.
    const hit = hits.find(h => h.point.y > faceCenterY - vH * 0.85 &&
                                h.point.y < faceCenterY + vH * 0.85);
    return hit ? hit.point.z : null;
  }

  // Probe multiple points, retaining a stable front-facing surface.
  const zSamples = [
    headSurfaceZ(centerX, faceCenterY),
    headSurfaceZ(centerX - vW * 0.20, faceCenterY),
    headSurfaceZ(centerX + vW * 0.20, faceCenterY)
  ].filter(Number.isFinite);
  const frontZ = zSamples.length ? Math.max(...zSamples) : bounds.max.z;
  // Small offset prevents z-fighting. The curved panel hugs the helmet.
  const faceWorldPoint = new THREE.Vector3(centerX, faceCenterY, frontZ + 0.0025);

  // V3.4's correct world-to-bone transform, without double transforms.
  head.updateWorldMatrix(true, false);
  group.position.copy(head.worldToLocal(faceWorldPoint.clone()));
  const headWorldRotation = new THREE.Quaternion();
  head.getWorldQuaternion(headWorldRotation);
  group.quaternion.copy(headWorldRotation.invert());
  head.add(group);
  group.updateMatrixWorld(true);

  // Diagnostic details make it possible to tune without blind guessing.
  console.info('R.E.X. V3.5 face surface fit', {
    visorWidth: vW, visorHeight: vH,
    worldCenter: faceWorldPoint.toArray(),
    surfaceRayHits: zSamples.length,
    note: 'Surface overlay; physical inset requires edited head mesh.'
  });

  rex3D.face = {
    canvas, ctx, tex, group,
    display: displayMesh, shell: rimMesh, bezel: bezelMesh,
    baseWidth: vW, baseHeight: vH,
    lastDrawAt: -1, sourceVideo: null
  };

  rexV15UpdateFace(0, "ready");
  tex.needsUpdate = true;
  console.info(`R.E.X. V35 surface-fitted visor attached — ${(vW * 1000).toFixed(0)}mm × ${(vH * 1000).toFixed(0)}mm canvas 1920×1080`);
}


/* ================================================================
   rexV15UpdateFace — V3.0
   Reference-matched rendering:
   - Almond/teardrop eye shape with bezier eyelids
   - 4 expression states (focused / curious / analytical / alert)
   - 140-fiber layered iris with concentric ring architecture
   - Limbal glow ring
   - Mode-driven pupil dilation
   - Micro-saccades via rex3D.saccadeX/Y
   - Squint phase before blink closes
   - Bold specular highlights
   - NO mouth ever
   ================================================================ */

function rexV15UpdateFace(t, mode) {
  const f = rex3D.face;
  if (!f) return;
  if (t - f.lastDrawAt < 1 / 30) return;
  f.lastDrawAt = t;

  const { ctx, canvas, tex } = f;
  const W = canvas.width;   // 1920
  const H = canvas.height;  // 1080
  const fm = rex3D.faceMode || 0;

  ctx.clearRect(0, 0, W, H);

  /* ── Dark glass background ─────────────────────────────── */
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0,    "#000810");
  bg.addColorStop(0.40, "#030e1c");
  bg.addColorStop(0.75, "#020b15");
  bg.addColorStop(1,    "#000610");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  /* Subtle glass glint — top-left highlight */
  const glint = ctx.createLinearGradient(0, 0, W * 0.55, H * 0.4);
  glint.addColorStop(0,   "rgba(140,220,255,.065)");
  glint.addColorStop(0.5, "rgba(255,255,255,.008)");
  glint.addColorStop(1,   "rgba(0,0,0,0)");
  ctx.fillStyle = glint;
  ctx.fillRect(0, 0, W, H);

  /* ── FACE MODE 0: AI FACE ─────────────────────────────── */
  if (fm === 0) {

    /* ── Map diagnostic mode → expression ─────────────────── */
    let expression = "focused";
    if (mode === "analyzing" || mode === "remembering") expression = "analytical";
    else if (mode === "listening")                        expression = "curious";
    else if (mode === "attention" || mode === "alert")    expression = "alert";
    else if (mode === "speaking")                         expression = "focused";
    else if (mode === "success"  || mode === "verified")  expression = "curious";

    /* ── Blink system ──────────────────────────────────────── */
    /*
      Three phases:
      1. Squint approach  (sin^10) — lids narrow slightly before closure
      2. Full blink       (sin^50) — lids slam shut
      3. Recovery         — handled by value returning to 0
    */
    const blinkRaw   = Math.pow(Math.max(0, Math.sin(t * 1.09 + 0.3)), 50);
    const squintRaw  = Math.pow(Math.max(0, Math.sin(t * 1.09 + 0.3)), 10);
    const blinkAmt   = blinkRaw;                  // 0=open 1=closed
    const squintAmt  = squintRaw * 0.22;          // pre-blink lid approach

    /* ── Gaze ──────────────────────────────────────────────── */
    const baseGX = (rex3D.pointerX || 0) * 52;
    const baseGY = (rex3D.pointerY || 0) * 34;
    /* Per-eye micro-saccade: opposite side gets a slightly larger offset */
    const sacX = (rex3D.saccadeX || 0) * 400;
    const sacY = (rex3D.saccadeY || 0) * 280;

    /* ── Eye geometry ──────────────────────────────────────── */
    /*
      Reference: eyes are large, centered in lower-middle of visor.
      Each eye occupies about 38% of visor width.
      Gap between eyes ≈ 18% of visor width.
      Eyes are at about 52% down from the top of the visor.
    */
    const eW = W * 0.36;    // width of one eye opening
    const eH = H * 0.52;    // height of one eye opening (before expression)
    const eyeY = H * 0.52;  // vertical center — just below mid-visor

    /* Expression-specific overrides */
    const expressionParams = {
      focused:    { lidClose: 0.06, narrow: 0.00, widen: 0.00, lidTiltL: 0.00, lidTiltR:  0.00 },
      curious:    { lidClose: 0.02, narrow: 0.00, widen: 0.22, lidTiltL: 0.08, lidTiltR: -0.08 },
      analytical: { lidClose: 0.34, narrow: 0.46, widen: 0.00, lidTiltL:-0.14, lidTiltR:  0.14 },
      alert:      { lidClose: 0.52, narrow: 0.70, widen: 0.00, lidTiltL:-0.24, lidTiltR:  0.24 }
    };
    const ep = expressionParams[expression] || expressionParams.focused;

    /* Pupil radius factor per mode — larger = more open/relaxed */
    const pupilFactors = {
      ready:0.38, listening:0.35, analyzing:0.30, remembering:0.32,
      speaking:0.40, attention:0.33, alert:0.29, success:0.44, verified:0.44
    };
    const pupilFactor = pupilFactors[mode] || 0.38;

    /* ── Draw both eyes ──────────────────────────────────────── */
    const eyeCX = [W * 0.5 - W * 0.20, W * 0.5 + W * 0.20]; // centers

    for (let side = 0; side < 2; side++) {
      const cx = eyeCX[side];
      const cy = eyeY;

      /* Per-eye gaze target */
      const gx = baseGX + sacX * (side === 0 ? 0.82 : 1.18);
      const gy = baseGY + sacY;

      /* Effective eye height after expression */
      const narrowFactor = ep.narrow + (side === 0 ? 0 : 0); // symmetric
      const widenFactor  = ep.widen;
      const effH = eH * (1 - narrowFactor * 0.52 + widenFactor * 0.18);
      const halfW = eW * 0.5;
      const halfH = effH * 0.5;

      /* Lid tilt — analytical/alert tilt inward */
      const lidTilt = side === 0 ? ep.lidTiltL : ep.lidTiltR;

      /* Combined lid close: base expression + blink + squint approach */
      const lidClose = ep.lidClose + squintAmt * (1 - ep.lidClose) + blinkAmt * (1 - ep.lidClose - squintAmt * (1 - ep.lidClose));

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(lidTilt);

      /* ── 1. Eye socket ambient glow ──────────────────────── */
      const socketGlow = ctx.createRadialGradient(gx, gy, 0, 0, 0, halfW * 1.3);
      socketGlow.addColorStop(0,   "rgba(0,85,195,.55)");
      socketGlow.addColorStop(0.5, "rgba(0,50,130,.35)");
      socketGlow.addColorStop(1,   "rgba(0,8,22,.0)");
      ctx.fillStyle = socketGlow;
      ctx.beginPath();
      ctx.ellipse(0, 0, halfW * 1.3, halfH * 1.4, 0, 0, Math.PI * 2);
      ctx.fill();

      /* ── 2. Almond eye shape clip path ───────────────────── */
      /*
        Reference eye shape:
        - Upper lid: dramatic arc — high in center, dipping at corners
        - Lower lid: subtle arc — gentler curve
        - Corners taper to a point (almond/teardrop)
      */
      const upperDip  = halfH * 0.18; // upper arc — how much it rises at center
      const lowerDip  = halfH * 0.10; // lower arc

      ctx.beginPath();
      ctx.moveTo(-halfW, 0);                                        // left corner
      ctx.bezierCurveTo(                                            // upper curve
        -halfW * 0.68, -(halfH - upperDip),
         halfW * 0.68, -(halfH - upperDip),
         halfW, 0                                                   // right corner
      );
      ctx.bezierCurveTo(                                            // lower curve
         halfW * 0.68,  halfH - lowerDip,
        -halfW * 0.68,  halfH - lowerDip,
        -halfW, 0
      );
      ctx.closePath();

      /* Fill eye with deep dark base */
      ctx.fillStyle = "#00070f";
      ctx.fill();

      /* ── 3. Iris & pupil inside clip ─────────────────────── */
      ctx.save();
      ctx.clip();

      const irisR = halfH * 0.88;
      /* Iris slowly rotates only in analytical/remembering modes */
      const irisRot = (mode === "analyzing" || mode === "remembering")
        ? t * (mode === "analyzing" ? 0.55 : 0.28) : 0;

      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(irisRot);

      /* ── Iris base gradient ────────────────────────────── */
      const irisBG = ctx.createRadialGradient(
        -irisR * 0.16, -irisR * 0.20, irisR * 0.06,
         0, 0, irisR
      );
      irisBG.addColorStop(0,    "#000c1e");
      irisBG.addColorStop(0.15, "#01284f");
      irisBG.addColorStop(0.38, "#0072be");
      irisBG.addColorStop(0.58, "#26ccff");
      irisBG.addColorStop(0.76, "#0460a4");
      irisBG.addColorStop(1,    "#010c1c");
      ctx.fillStyle = irisBG;
      ctx.beginPath();
      ctx.arc(0, 0, irisR, 0, Math.PI * 2);
      ctx.fill();

      /* ── Iris architecture: 3 concentric bands ─────────── */
      /* Band 1 — outer ring */
      ctx.strokeStyle = "rgba(28,190,255,.62)";
      ctx.lineWidth = 9;
      ctx.shadowColor = "#00b8ff";
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(0, 0, irisR * 0.960, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      /* Band 2 — mid ring */
      ctx.strokeStyle = "rgba(55,195,255,.46)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, irisR * 0.720, 0, Math.PI * 2);
      ctx.stroke();

      /* Band 3 — inner ring */
      ctx.strokeStyle = "rgba(80,210,255,.38)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, irisR * 0.530, 0, Math.PI * 2);
      ctx.stroke();

      /* ── 140 radial iris fibers ─────────────────────────── */
      for (let i = 0; i < 140; i++) {
        const a = (i / 140) * Math.PI * 2;
        /* Organic variation in fiber start/end radii */
        const innerR = irisR * (0.35 + 0.06 * Math.sin(i * 6.18));
        const outerR = irisR * (0.94 - 0.04 * Math.sin(i * 3.07));
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * innerR, Math.sin(a) * innerR);
        ctx.lineTo(Math.cos(a) * outerR, Math.sin(a) * outerR);
        if      (i % 7 === 0) { ctx.strokeStyle = "rgba(165,250,255,.80)"; ctx.lineWidth = 2.4; }
        else if (i % 3 === 0) { ctx.strokeStyle = "rgba(60,180,255,.52)";  ctx.lineWidth = 1.6; }
        else                   { ctx.strokeStyle = "rgba(0,52,115,.44)";   ctx.lineWidth = 1.1; }
        ctx.stroke();
      }

      ctx.restore(); // iris translate + rotate

      /* ── Pupil ──────────────────────────────────────────── */
      const pupilR = irisR * pupilFactor;
      ctx.fillStyle = "#000208";
      ctx.beginPath();
      ctx.arc(gx, gy, pupilR, 0, Math.PI * 2);
      ctx.fill();

      /* Pupil rim glow */
      ctx.strokeStyle = "rgba(100,235,255,.88)";
      ctx.lineWidth = 4.5;
      ctx.shadowColor = "#50e8ff";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(gx, gy, pupilR + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      /* ── Specular highlights ────────────────────────────── */
      /* Primary — upper left reflection */
      ctx.fillStyle = "rgba(242,254,255,.92)";
      ctx.beginPath();
      ctx.ellipse(gx - halfW * 0.28, gy - halfH * 0.38, halfW * 0.13, halfH * 0.08, -0.42, 0, Math.PI * 2);
      ctx.fill();

      /* Secondary — small lower-right */
      ctx.fillStyle = "rgba(180,242,255,.52)";
      ctx.beginPath();
      ctx.ellipse(gx + halfW * 0.22, gy + halfH * 0.25, halfW * 0.06, halfH * 0.04, 0.28, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore(); // clip

      /* ── 4. Eyelid overlay system ────────────────────────── */
      if (lidClose > 0.005) {

        /* Upper eyelid — slides down from the top of the eye opening */
        ctx.save();

        /*
          The lid covers from the top of the almond outward.
          lidClose=1.0 means fully covered.
          We redraw the upper portion of the almond with the background color.
        */
        const lidEdgeY = -halfH * (1 - lidClose * 2.05);

        /* Lid fill — matches visor background */
        ctx.beginPath();
        ctx.rect(-halfW * 1.05, -halfH * 1.1, halfW * 2.1, Math.max(0, halfH * 1.1 + lidEdgeY + halfH * 0.12));
        ctx.fillStyle = "#00070f";
        ctx.fill();
        ctx.restore();
      }

      /* ── 5. Eyelid EDGE LINE (the expressive curve) ──────── */
      /*
        This is what gives each expression its character:
        Focused   → clean, open arc
        Curious   → lifted arch
        Analytical → flat/angled brow line
        Alert     → sharp downward inner corner
      */
      ctx.save();
      const openFrac = Math.max(0, 1 - lidClose);
      const lidCY = -halfH * openFrac + halfH * 0.06;

      /* Inner corner lift/drop for analytical/alert */
      const innerLift = (expression === "analytical" || expression === "alert")
        ? halfH * 0.22 * (expression === "alert" ? 1.4 : 1.0) : 0;
      const outerDrop = (expression === "analytical" || expression === "alert")
        ? halfH * 0.08 : 0;

      ctx.beginPath();
      if (expression === "analytical" || expression === "alert") {
        /* Angled / aggressive lid — inner corner higher for side === 0 (left eye) */
        const innerY  = lidCY + (side === 0 ?  innerLift : -innerLift);
        const outerY  = lidCY + (side === 0 ? -outerDrop :  outerDrop);
        ctx.moveTo(-halfW, outerY + halfH * 0.06);
        ctx.quadraticCurveTo(0, lidCY - halfH * 0.10, halfW, outerY + halfH * 0.06);
        /* Extra inner-corner kink */
        ctx.moveTo(-halfW * 0.65, innerY - halfH * 0.05);
        ctx.lineTo(-halfW, outerY + halfH * 0.06);
      } else {
        /* Focused / curious — clean upward arch */
        const archHeight = expression === "curious"
          ? halfH * 0.42 * (1 - lidClose)
          : halfH * 0.28 * (1 - lidClose);
        ctx.moveTo(-halfW, lidCY + halfH * 0.08);
        ctx.quadraticCurveTo(0, lidCY - archHeight, halfW, lidCY + halfH * 0.08);
      }

      ctx.strokeStyle = expression === "analytical"
        ? "rgba(55,215,255,.95)"
        : expression === "alert"
          ? "rgba(40,200,255,.90)"
          : "rgba(85,218,255,.82)";
      ctx.lineWidth = 11;
      ctx.shadowColor = "#40d8ff";
      ctx.shadowBlur = 16;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      /* ── 6. Outer almond outline glow ────────────────────── */
      ctx.save();
      ctx.strokeStyle = "rgba(45,190,255,.30)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-halfW, 0);
      ctx.bezierCurveTo(-halfW * 0.68, -(halfH + 14),  halfW * 0.68, -(halfH + 14),  halfW, 0);
      ctx.bezierCurveTo( halfW * 0.68,  halfH + 9,    -halfW * 0.68,  halfH + 9,    -halfW, 0);
      ctx.stroke();
      ctx.restore();

      ctx.restore(); // translate + lidTilt rotate
    } /* end for each eye */

    /* ── Subtle CRT scan-line overlay ─────────────────────── */
    for (let y = 0; y < H; y += 4) {
      ctx.fillStyle = "rgba(0,180,220,.014)";
      ctx.fillRect(0, y, W, 1);
    }

    /* ── Corner HUD brackets ───────────────────────────────── */
    const bSz = 44, bT = 5;
    ctx.strokeStyle = "rgba(38,175,255,.36)";
    ctx.lineWidth = bT;
    ctx.lineCap = "square";
    /* TL */ ctx.beginPath(); ctx.moveTo(bSz,24); ctx.lineTo(24,24); ctx.lineTo(24,24+bSz); ctx.stroke();
    /* TR */ ctx.beginPath(); ctx.moveTo(W-bSz,24); ctx.lineTo(W-24,24); ctx.lineTo(W-24,24+bSz); ctx.stroke();
    /* BL */ ctx.beginPath(); ctx.moveTo(bSz,H-24); ctx.lineTo(24,H-24); ctx.lineTo(24,H-24-bSz); ctx.stroke();
    /* BR */ ctx.beginPath(); ctx.moveTo(W-bSz,H-24); ctx.lineTo(W-24,H-24); ctx.lineTo(W-24,H-24-bSz); ctx.stroke();

    /* ── Mode telemetry labels ─────────────────────────────── */
    ctx.fillStyle = "rgba(55,195,238,.48)";
    ctx.font = "bold 22px monospace";
    ctx.textAlign = "left";
    ctx.fillText("REX // AI FACE", 66, H - 58);
    ctx.textAlign = "right";
    ctx.fillText(mode.toUpperCase(), W - 66, H - 58);
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(55,195,238,.28)";
    ctx.fillText(expression.toUpperCase(), W / 2, H - 58);
    ctx.textAlign = "left";

  /* ── FACE MODE 1: CINEMA ───────────────────────────────── */
  } else if (fm === 1) {
    ctx.fillStyle = "#9eefff";
    ctx.font = "bold 72px sans-serif";
    ctx.fillText("CINEMA // 16:9", 100, 160);
    ctx.strokeStyle = "rgba(70,210,250,.52)"; ctx.lineWidth = 8;
    ctx.strokeRect(100, 210, 1720, 670);

    const cinBg = ctx.createLinearGradient(0, 210, 0, 880);
    cinBg.addColorStop(0, "#011529"); cinBg.addColorStop(0.5, "#07567f"); cinBg.addColorStop(1, "#060c1c");
    ctx.fillStyle = cinBg; ctx.fillRect(105, 215, 1710, 660);

    /* Simplified cinematic placeholder */
    ctx.fillStyle = "#b7f4ff"; ctx.beginPath(); ctx.arc(1420, 460, 145, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#021523"; ctx.beginPath(); ctx.arc(1378, 418, 145, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#d8faff";
    ctx.beginPath(); ctx.moveTo(855,420); ctx.lineTo(855,690); ctx.lineTo(1125,555); ctx.closePath(); ctx.fill();

    ctx.fillStyle = "rgba(174,226,242,.80)"; ctx.font = "32px monospace";
    ctx.fillText("DEMO DISPLAY · 1920×1080 · NO LIVE MEDIA CONNECTION", 115, 1020);

  /* ── FACE MODES 2–3: SOCIAL / NEWS / DATA ──────────────── */
  } else {
    const modeLabels = { 2:"SOCIAL // LIVE", 3:"NEWS // DATA" };
    ctx.fillStyle = "#9eefff"; ctx.font = "bold 72px sans-serif";
    ctx.fillText(modeLabels[fm] || "DISPLAY MODE", 100, 160);
    ctx.strokeStyle = "rgba(70,210,250,.52)"; ctx.lineWidth = 8;
    ctx.strokeRect(100, 210, 1720, 670);

    for (let i = 0; i < 4; i++) {
      const ry = 290 + i * 138;
      ctx.fillStyle = "rgba(60,190,240,.16)"; ctx.fillRect(160, ry, 1600, 110);
      ctx.fillStyle = "rgba(78,220,255,.72)"; ctx.fillRect(185, ry + 24, 380 + i * 115, 15);
      ctx.fillStyle = "rgba(90,162,196,.48)"; ctx.fillRect(185, ry + 58, 1250 - i * 145, 10);
    }

    ctx.fillStyle = "rgba(174,226,242,.80)"; ctx.font = "32px monospace";
    ctx.fillText("DEMO DISPLAY · NO LIVE MEDIA CONNECTION", 115, 1020);
  }

  tex.needsUpdate = true;
}

/* V15 face-cycle / portal controls */
document.addEventListener("DOMContentLoaded",()=>{
  const face=document.getElementById("rex-v15-face-cycle"),portal=document.getElementById("rex-v15-portal-trigger");
  face?.addEventListener("click",event=>{event.stopPropagation();rex3D.faceMode=(rex3D.faceMode+1)%4;face.textContent=["FACE: EYES","FACE: VIDEO","FACE: SOCIAL","FACE: NEWS"][rex3D.faceMode];});
  portal?.addEventListener("click",event=>{event.stopPropagation();if(!rex3D.ready)return;rex3D.portalStep="full";rex3D.portalDuration=8.5;rex3D.portalStart=rex3D.clock.getElapsedTime();document.getElementById("rexAvatarStage")?.classList.add("rex-v15-portal-active");const label=document.getElementById("rex-v15-portal-label");if(label)label.textContent="PORTAL · EXIT PREVIEW";});
});

/* V21 individual portal steps */
document.addEventListener("DOMContentLoaded",()=>{
  document.querySelectorAll("[data-rex-portal-step]").forEach(button=>{
    button.addEventListener("click",event=>{
      event.stopPropagation();if(!rex3D.ready||!rex3D.clock)return;
      rex3D.portalStep=button.dataset.rexPortalStep;
      rex3D.portalDuration=rex3D.portalStep==="step"?6.2:4.4;
      rex3D.portalStart=rex3D.clock.getElapsedTime();
      document.getElementById("rexAvatarStage")?.classList.add("rex-v15-portal-active");
      const label=document.getElementById("rex-v15-portal-label");if(label)label.textContent="PORTAL · "+rex3D.portalStep.toUpperCase();
    });
  });
  document.getElementById("rex-v15-portal-trigger")?.addEventListener("click",()=>{rex3D.portalStep="full";rex3D.portalDuration=8.5;},{capture:true});
});


/* ================================================================
   R.E.X. V4.5: ACCESSIBLE ACTION CONTROLS
   Keep all portal / GPU buttons reachable without changing HTML/CSS.
   The action strip scrolls horizontally when there is insufficient width.
   ================================================================ */
(function rexInstallActionStripFix(){
  function apply(){
    const portal=document.getElementById("rex-v15-portal-trigger");
    const gpu=document.getElementById("rex-gpu-demo-button");
    if(!portal)return;
    const parent=portal.parentElement;
    if(!parent)return;
    if(gpu && gpu.parentElement!==parent){parent.appendChild(gpu);gpu.className=portal.className;}
    const style=document.getElementById("rex-v45-actions-style")||document.createElement("style");
    style.id="rex-v45-actions-style";
    style.textContent=`
      .rex-v45-actions {display:flex!important;flex-wrap:nowrap!important;gap:6px!important;
        max-width:100%!important;width:100%!important;min-width:0!important;
        overflow-x:auto!important;overflow-y:hidden!important;
        scrollbar-width:thin!important;scrollbar-color:#20d9e8 #071426!important;
        padding:4px 4px 11px!important;box-sizing:border-box!important;
        -webkit-overflow-scrolling:touch!important;overscroll-behavior-x:contain!important;}
      .rex-v45-actions > button {flex:0 0 auto!important;white-space:nowrap!important;
        max-width:none!important;min-width:max-content!important;}
      .rex-v45-actions::-webkit-scrollbar {height:7px!important;}
      .rex-v45-actions::-webkit-scrollbar-thumb {background:#20d9e8;border-radius:8px;}
      .rex-v45-actions::-webkit-scrollbar-track {background:#071426;}
    `;
    if(!style.isConnected)document.head.appendChild(style);
    parent.classList.add("rex-v45-actions");
    parent.setAttribute("role","group");
    parent.setAttribute("aria-label","R.E.X. animation actions. Scroll sideways to reach all controls.");
    parent.tabIndex=0;
    // Shift+wheel over the control strip scrolls horizontally.
    if(parent.dataset.rexWheelBound!=="yes"){
      parent.dataset.rexWheelBound="yes";
      parent.addEventListener("wheel",event=>{
        if(event.shiftKey && parent.scrollWidth>parent.clientWidth){
          event.preventDefault();parent.scrollLeft+=event.deltaY||event.deltaX;
        }
      },{passive:false});
    }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{
    apply();requestAnimationFrame(apply);
  });
  else {apply();requestAnimationFrame(apply);}
})();