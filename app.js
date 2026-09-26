/*

  ================================================================

  REPAIRIQ

  SXM REPAIR INTELLIGENCE COMMAND CENTER

 

  Version: 0.7 - Knowledge Engine, R.E.X. Case Memory + Verification

 

  Author:

  D'Marques Coleman

 

  Organization:

  DCENTRIC

 

  PURPOSE

  ---------------------------------------------------------------

  This file controls the frontend-only RepairIQ prototype.

 

  It supports:

 

  - Application navigation

  - Demo case loading

  - Log upload and preview

  - Evidence-oriented log parsing

  - GPU topology interaction

  - Structured diagnostic rendering

  - Active traveler context

  - Previous-action tracking

  - Do-not-repeat guardrails

  - Technician approval workflow

  - Retest requirements

  - Case history

  - LocalStorage persistence

  - Shift handoff data

  - Parts-request data

  - Report export

  - Diagnostic modal

  - Toast notifications

 

  CONTROL MODEL

  ---------------------------------------------------------------

  RepairIQ recommends.

 

  The technician decides.

 

  RepairIQ does not control hardware, issue autonomous repair

  commands, remove components, install components, order parts,

  or authorize physical work.

 

  DATA MODEL

  ---------------------------------------------------------------

  This prototype uses deterministic demonstration logic.

 

  It does not connect to:

 

  - Live hardware

  - BMC

  - HMC

  - Telemetry

  - Production test systems

  - Warehouse systems

  - Backend APIs

  - Verified repair databases

  - Production AI inference

 

  All prototype analysis must remain clearly labeled as:

 

  - Prototype data

  - Demonstration data

  - Simulated intelligence

  - Technician decision support

 

  ARCHITECTURE PRINCIPLE

  ---------------------------------------------------------------

  This controller does not replace #result-panel.

 

  Instead, it updates the stable diagnostic contract already

  defined in the HTML.

 

  Main diagnostic flow:

 

  Traveler

  → Unit identity

  → Test session

  → Failure evidence

  → Diagnostic reasoning

  → Previous actions

  → Recommendation

  → Technician approval

  → Parts planning

  → Retest

  → Case history

  → Shift handoff

  ================================================================

*/

 

"use strict";

 

/* ================================================================

   1. DEMONSTRATION DATA

   ---------------------------------------------------------------

   These values are intentionally synthetic.

 

   They are used to make the prototype functional while preserving

   a clear distinction between demonstration intelligence and

   verified production data.

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

   ---------------------------------------------------------------

   This object is the temporary frontend state store.

 

   A future backend can replace this with API-backed state without

   requiring the HTML contract to be redesigned.

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

  rexCaseId: "unassigned",

  rexMemory: null,

  rexVisualTimer: null,

  retestWorkflow: null

};

 

/* ================================================================

   3. DOM HELPERS

   ---------------------------------------------------------------

   These helpers intentionally fail safely when an optional

   element does not exist.

 

   This is important during phased development because some

   future sections may be added later.

   ================================================================ */

 

function $(selector, scope = document) {

  return scope.querySelector(selector);

}

 

function $$(selector, scope = document) {

  return Array.from(scope.querySelectorAll(selector));

}

 

function setText(selector, value, scope = document) {

  const element = $(selector, scope);

 

  if (element) {

    element.textContent = value ?? "";

  }

 

  return element;

}

 

function setInputValue(selector, value) {

  const element = $(selector);

 

  if (element) {

    element.value = value ?? "";

  }

 

  return element;

}

 

function getInputValue(selector) {

  return String($(selector)?.value || "").trim();

}

 

function setHidden(selector, hidden) {

  const element = $(selector);

 

  if (element) {

    element.hidden = Boolean(hidden);

  }

 

  return element;

}

 

function addListener(selector, eventName, handler) {

  const element = $(selector);

 

  if (element) {

    element.addEventListener(eventName, handler);

  }

 

  return element;

}

 

function addListeners(selector, eventName, handler) {

  $$(selector).forEach(element => {

    element.addEventListener(eventName, handler);

  });

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

  return String(value ?? "")

    .replace(/\s+/g, " ")

    .trim();

}

 

function titleCase(value) {

  return String(value || "")

    .toLowerCase()

    .replace(/\b\w/g, character => character.toUpperCase());

}

 

/* ================================================================

   4. APPLICATION INITIALIZATION

   ---------------------------------------------------------------

   All initialization begins after the DOM is ready.

 

   Each subsystem is initialized separately so future teams can

   test or replace one area without rewriting the entire file.

   ================================================================ */

 

document.addEventListener("DOMContentLoaded", () => {

  initializeNavigation();

  initializeAnalyzer();

  initializeTopology();

  initializeCaseHistory();

  initializeButtons();

  initializeModal();

  initializeKeyboardShortcuts();

  initializeRetestWorkflow();

  initializePassportActions();

  initializeExtensionMount();

  initializeDedicatedREX();

 

  renderCases();

  renderActivity();

  renderTopology();

  restoreRetestWorkflow();

 

  updateSelectedComponent("GPU2");

  updateActiveCaseContext(createInitialCaseContext());

  restoreREXForActiveCase();

  renderDedicatedREX();

});

 

/* ================================================================

   5. NAVIGATION

   ---------------------------------------------------------------

   The HTML uses:

 

   data-view="dashboard"

   data-view="analyzer"

   data-view="cases"

   data-view="knowledge"

   data-view="metrics"

 

   and matching sections:

 

   #dashboard-view

   #analyzer-view

   #cases-view

   #knowledge-view

   #metrics-view

   ================================================================ */

 

function initializeNavigation() {

  addListeners(".nav-item", "click", event => {

    const viewName = event.currentTarget.dataset.view;

 

    if (viewName) {

      switchView(viewName);

    }

  });

 

  addListeners("[data-view-target]", "click", event => {

    const viewName = event.currentTarget.dataset.viewTarget;

 

    if (viewName) {

      switchView(viewName);

    }

  });

}

 

function switchView(viewName) {

  const targetView = $(`#${viewName}-view`);

 

  if (!targetView) {

    showToast(`The ${viewName} view is not available in this prototype.`);

    return;

  }

 

  state.activeView = viewName;

  if (viewName === "rex") {
    renderDedicatedREX();
  }

 

  $$(".nav-item").forEach(button => {

    const isActive = button.dataset.view === viewName;

 

    button.classList.toggle("active", isActive);

 

    if (isActive) {

      button.setAttribute("aria-current", "page");

    } else {

      button.removeAttribute("aria-current");

    }

  });

 

  $$(".view").forEach(view => {

    view.classList.toggle("active", view.id === `${viewName}-view`);

  });

 

  setText("#page-title", getViewTitle(viewName));

 

  if (viewName === "analyzer") {

    window.setTimeout(() => {

      $("#diagnostic-search")?.focus();

    }, 0);

  }

}

 

function getViewTitle(viewName) {

  const titles = {

    dashboard: "Repair Operations Dashboard",

    analyzer: "SXM Log Analyzer",

    cases: "Case History",

    knowledge: "SXM Knowledge Base",

    metrics: "Performance Metrics"

  };

 

  return titles[viewName] || "RepairIQ";

}

 

/* ================================================================

   6. KEYBOARD SHORTCUTS

   ---------------------------------------------------------------

   The previous JavaScript referenced a missing global search input.

 

   This version routes "/" to the existing diagnostic search field.

   ================================================================ */

 

function initializeKeyboardShortcuts() {

  document.addEventListener("keydown", event => {

    const activeTag = document.activeElement?.tagName;

 

    const isTyping =

      activeTag === "INPUT" ||

      activeTag === "TEXTAREA" ||

      activeTag === "SELECT";

 

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

   ---------------------------------------------------------------

   This binds the existing HTML controls:

 

   #drop-zone

   #file-input

   #demo-log-button

   #analyze-button

   .quick-search-chip

   #diagnostic-search-button

   ================================================================ */

 

function initializeAnalyzer() {

  const dropZone = $("#drop-zone");

  const fileInput = $("#file-input");

 

  if (dropZone && fileInput) {

    dropZone.addEventListener("click", () => {

      fileInput.click();

    });

 

    dropZone.addEventListener("keydown", event => {

      if (event.key === "Enter" || event.key === " ") {

        event.preventDefault();

        fileInput.click();

      }

    });

 

    fileInput.addEventListener("change", event => {

      const file = event.target.files?.[0];

 

      if (file) {

        readFile(file);

      }

    });

 

    ["dragenter", "dragover"].forEach(eventName => {

      dropZone.addEventListener(eventName, event => {

        event.preventDefault();

        dropZone.classList.add("dragging");

      });

    });

 

    ["dragleave", "drop"].forEach(eventName => {

      dropZone.addEventListener(eventName, event => {

        event.preventDefault();

        dropZone.classList.remove("dragging");

      });

    });

 

    dropZone.addEventListener("drop", event => {

      const file = event.dataTransfer?.files?.[0];

 

      if (file) {

        readFile(file);

      }

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

   ---------------------------------------------------------------

   The prototype accepts:

 

   - .txt

   - .log

   - .json

 

   JSON files are currently previewed as text. Structured JSON

   ingestion can be added later without changing the upload UI.

   ================================================================ */

 

function readFile(file) {

  if (!file) {

    return;

  }

 

  const reader = new FileReader();

 

  reader.onload = event => {

    loadLog(

      String(event.target?.result || ""),

      file.name || "uploaded-log.txt"

    );

  };

 

  reader.onerror = () => {

    showToast("Unable to read the selected log file.");

  };

 

  reader.readAsText(file);

}

 

function loadLog(logText, fileName = "uploaded-log.txt") {

  state.currentLog = String(logText || "");

  state.currentFileName = fileName;

 

  const preview = $("#log-preview");

 

  if (preview) {

    preview.textContent = state.currentLog || "No test log loaded.";

  }

 

  setText("#log-status", `${fileName} loaded`);

 

  const status = $("#log-status");

 

  if (status) {

    status.className = "status-pill ready";

  }

 

  updateDataSourceLabels(

    fileName.toLowerCase().includes("demo") ||

      fileName.toLowerCase().includes("vulcan")

      ? "Prototype / Demonstration Data"

      : "Uploaded local log"

  );

 

  showToast("Test log loaded successfully.");

}

 

/* ================================================================

   9. DEMO CASE LOADING

   ---------------------------------------------------------------

   The demo case is deterministic and synthetic.

 

   It intentionally represents:

 

   - GPU2 HMC BIST failure

   - Initialization timeout

   - GPU2 heartbeat failure

   - HMC retry activity

   - Passing NVSwitch

   - Passing BMC communication

   - Completed firmware compatibility check

 

   It does not prove that a physical GPU must be replaced.

   ================================================================ */

 

function loadDemoCase() {

  setInputValue(

    "#product-model",

    "VULCAN (HGX) / SXM 8-GPU Demo"

  );

 

  setInputValue("#tester-name", "SXM-TESTER-04");

  setInputValue("#technician-name", "Tech1");

 

  setInputValue(

    "#technician-notes",

    "Unit failed during HMC initialization. GPU2 symptoms observed."

  );

 

  /*

    These hidden fields are part of the future unit identity contract.

    They make the traveler identifiers available to the frontend

    without requiring CSS changes.

  */

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

   ---------------------------------------------------------------

   The important compatibility rule is:

 

   Do not replace #result-panel.innerHTML.

 

   The HTML already contains the structured result contract.

   This function only changes its state and then renders into the

   existing fields.

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

      <p>

        Parsing errors, grouping symptoms, calculating evidence,

        and applying transparent prototype rules.

      </p>

    `;

  }

 

  if (structuredResult) {

    structuredResult.hidden = true;

  }

 

  const resultPanel = $("#result-panel");

 

  if (resultPanel) {

    resultPanel.dataset.resultState = "analyzing";

  }

}

 

/* ================================================================

   11. LOG ANALYSIS ENGINE

   ---------------------------------------------------------------

   This is deterministic prototype logic, not production AI.

 

   Critical parser protections:

 

   1. Generic detection lines do not determine the failed GPU.

   2. Failure-associated GPU references receive priority.

   3. Tester identity alone does not mean tester failure.

   4. Firmware metadata alone does not mean firmware failure.

   5. Positive evidence is separated from contradicting evidence.

   ================================================================ */

 

function analyzeLog(logText) {

  const rawLog = String(logText || "");

  const normalized = rawLog.toLowerCase();

  const lines = rawLog

    .split(/\r?\n/)

    .map(line => line.trim())

    .filter(Boolean);

 

  const metadata = parseLogMetadata(lines);

  const affectedComponent = detectAffectedComponent(lines);

  const errorCodes = detectErrorCodes(lines);

  const testStages = detectTestStages(lines);

  const testerAssessment = analyzeTesterEvidence(normalized);

  const firmwareAssessment = analyzeFirmwareEvidence(normalized);

 

  const hasHmcFault =

    normalized.includes("hmc_bist_fail") ||

    (

      normalized.includes("hmc") &&

      (

        normalized.includes("initialization") ||

        normalized.includes("heartbeat")

      )

    );

 

  const hasPcieFault =

    normalized.includes("pcie") &&

    (

      normalized.includes("link") ||

      normalized.includes("width") ||

      normalized.includes("lane")

    );

 

  const hasTesterFailure = testerAssessment.isFailure;

 

  const hasFirmwareFailure = firmwareAssessment.isFailure;

 

  let title = "SXM diagnostic review required";

  let category = "General SXM failure";

  let ruleId = "SXM-GENERAL-000";

  let recommendation =

    "Review the complete log and escalate for technical review.";

  let actionType = "Controlled diagnostic review";

  let confidence = 62;

  let severity = "REVIEW";

 

  if (hasHmcFault) {

    title = `${affectedComponent} HMC BIST failure`;

    category = "HMC initialization failure";

    ruleId = "SXM-GPU-001";

    recommendation =

      `Inspect ${affectedComponent} and the associated HMC path.`;

    actionType = "Component isolation / approved swap test";

    confidence = 94;

    severity = "CRITICAL";

  } else if (hasPcieFault) {

    title = "PCIe connectivity failure";

    category = "PCIe link-width failure";

    ruleId = "SXM-PCI-002";

    recommendation =

      `Verify configuration and isolate ${affectedComponent}.`;

    actionType = "Configuration verification / isolation";

    confidence = 87;

    severity = "WARNING";

  } else if (hasTesterFailure) {

    title = "Tester-related failure suspected";

    category = "Tester or execution failure";

    ruleId = "SXM-TST-004";

    recommendation =

      "Validate tester state, permissions, calibration, and repeatability.";

    actionType = "Tester validation";

    confidence = 81;

    severity = "WARNING";

  } else if (hasFirmwareFailure) {

    title = "Firmware compatibility issue suspected";

    category = "Firmware mismatch or compatibility issue";

    ruleId = "SXM-FW-003";

    recommendation =

      "Validate firmware versions against the approved compatibility matrix.";

    actionType = "Firmware validation";

    confidence = 78;

    severity = "WARNING";

  }

 

  const supportingEvidence = buildSupportingEvidence({

    lines,

    normalized,

    affectedComponent,

    hasHmcFault,

    hasPcieFault,

    hasTesterFailure,

    hasFirmwareFailure,

    testerAssessment,

    firmwareAssessment,

    errorCodes

  });

 

  const contradictingEvidence = buildContradictingEvidence({

    lines,

    normalized,

    hasHmcFault,

    hasPcieFault,

    hasTesterFailure,

    hasFirmwareFailure,

    testerAssessment,

    firmwareAssessment

  });

 

  const previousActions = inferPreviousActions({

    normalized,

    hasHmcFault

  });

 

  const doNotRepeat = buildDoNotRepeatActions(previousActions);

 

  const rootCauseCandidates = buildRootCauseCandidates({

    affectedComponent,

    hasHmcFault,

    hasPcieFault,

    hasTesterFailure,

    hasFirmwareFailure

  });

 

  const confidenceExplanation = buildConfidenceExplanation({

    confidence,

    supportingEvidence,

    contradictingEvidence,

    affectedComponent,

    hasHmcFault,

    hasPcieFault,

    hasTesterFailure,

    hasFirmwareFailure

  });

 

  const partsRequest = buildPartsRequest({

    affectedComponent,

    hasHmcFault,

    hasPcieFault

  });

 

  const retest = buildRetestRequirement({

    hasHmcFault,

    hasPcieFault,

    hasTesterFailure,

    hasFirmwareFailure,

    failureStage: testStages.failureStage

  });

 

  const handoff = buildShiftHandoff({

    affectedComponent,

    title,

    recommendation,

    previousActions,

    doNotRepeat,

    partsRequest,

    retest

  });

 

  const caseId = createCaseId();

  const travelerId = createTravelerId();

 

  return {

    caseId,

    travelerId,

    dataSource: isDemoLog(rawLog)

      ? "Prototype / Demonstration Data"

      : "Uploaded local log",

 

    caseState: "DIAGNOSIS READY",

 

    product:

      getInputValue("#product-model") ||

      metadata.product ||

      "Unknown product",

 

    title,

    category,

    ruleId,

    severity,

    recommendation,

    actionType,

    affectedComponent,

    confidence,

    confidenceExplanation,

 

    technician:

      getInputValue("#technician-name") ||

      "Technician not identified",

 

    tester:

      getInputValue("#tester-name") ||

      metadata.tester ||

      "Tester not identified",

 

    notes: getInputValue("#technician-notes"),

 

    metadata,

 

    failure: {

      title,

      category,

      ruleId,

      severity,

      errorCode: errorCodes[0] || "UNSPECIFIED",

      failureStage: testStages.failureStage,

      affectedComponent

    },

 

    unit: {

      mpPartNumber:

        getInputValue("#part-number-input") ||

        "DEMO-MP-PN-0001",

 

      mpSerialNumber:

        getInputValue("#unit-serial-input") ||

        "DEMO-MP-SN-0001",

 

      pcbPartNumber:

        getInputValue("#part-number-input") ||

        "DEMO-PCB-PN-0001",

 

      pcbSerialNumber:

        getInputValue("#system-serial-input") ||

        "DEMO-PCB-SN-0001",

 

      systemSerialNumber:

        getInputValue("#system-serial-input") ||

        "DEMO-SYSTEM-0001",

 

      unitSerialNumber:

        getInputValue("#unit-serial-input") ||

        "DEMO-UNIT-0001",

 

      partNumber:

        getInputValue("#part-number-input") ||

        "DEMO-PN-0001",

 

      assemblyPartNumber:

        getInputValue("#assembly-part-number-input") ||

        "DEMO-ASM-PN-0001",

 

      platform:

        metadata.platform ||

        "H200 / SXM",

 

      build:

        metadata.product?.includes("VULCAN")

          ? "Vulcan-inspired demo"

          : "Prototype platform",

 

      boardRevision:

        getInputValue("#board-revision-input") ||

        "Not supplied",

 

      department:

        getInputValue("#department-input") ||

        "SXM Diagnostics"

    },

 

    testSession: {

      tester:

        getInputValue("#tester-name") ||

        metadata.tester ||

        "Tester not identified",

 

      technician:

        getInputValue("#technician-name") ||

        "Technician not identified",

 

      testName:

        metadata.testName ||

        "HGX Test Execution Report",

 

      testDate:

        metadata.testDate ||

        "Not supplied",

 

      failureStage: testStages.failureStage,

 

      stages: testStages.stages

    },

 

    evidence: {

      supporting: supportingEvidence,

      contradicting: contradictingEvidence,

      correlated: supportingEvidence,

      negative: contradictingEvidence

    },

 

    history: {

      previousActions,

      doNotRepeat

    },

 

    reasoning: {

      candidates: rootCauseCandidates,

      confidence,

      confidenceExplanation

    },

 

    recommendationDetails: {

      action: recommendation,

      actionType,

      explanation:

        "This is a controlled diagnostic recommendation. Physical repair decisions remain under technician control.",

      approvalStatus: "PENDING REVIEW"

    },

 

    partsRequest,

 

    retest,

 

    handoff

  };

}

 

/* ================================================================

   12. LOG METADATA PARSING

   --------------------------------------------------------------- */

 

function parseLogMetadata(lines) {

  const metadata = {

    product: "",

    platform: "",

    tester: "",

    testDate: "",

    testName: ""

  };

 

  for (const line of lines) {

    if (/^product:/i.test(line)) {

      metadata.product = line.replace(/^product:/i, "").trim();

    }

 

    if (/^configuration:/i.test(line)) {

      metadata.platform = line

        .replace(/^configuration:/i, "")

        .trim();

    }

 

    if (/^tester:/i.test(line)) {

      metadata.tester = line

        .replace(/^tester:/i, "")

        .trim();

    }

 

    if (/^test date:/i.test(line)) {

      metadata.testDate = line

        .replace(/^test date:/i, "")

        .trim();

    }

 

    if (/test execution report/i.test(line)) {

      metadata.testName = line.trim();

    }

  }

 

  return metadata;

}

 

/* ================================================================

   13. COMPONENT DETECTION

   ---------------------------------------------------------------

   This function intentionally avoids using the first GPU reference

   in the file.

 

   Incorrect approach:

 

   String(logText).match(/GPU\s?(\d+)/i)

 

   That would identify GPU0 from:

 

   [PASS] GPU0 detected.

 

   Correct approach:

 

   Search failure-associated lines first.

   ================================================================ */

 

function detectAffectedComponent(lines) {

  const priorityTerms = [

    "fail",

    "error",

    "critical",

    "threshold",

    "heartbeat",

    "power",

    "timeout",

    "link",

    "fault",

    "bist"

  ];

 

  const priorityLines = lines.filter(line => {

    const normalized = line.toLowerCase();

 

    return priorityTerms.some(term => normalized.includes(term));

  });

 

  const searchLines = [

    ...priorityLines,

    ...lines

  ];

 

  for (const line of searchLines) {

    const gpuMatch = line.match(/\bGPU\s?(\d+)\b/i);

 

    if (gpuMatch) {

      return `GPU${gpuMatch[1]}`;

    }

  }

 

  if (lines.some(line => /hmc/i.test(line))) {

    return "HMC";

  }

 

  if (lines.some(line => /tester/i.test(line))) {

    return "Tester";

  }

 

  return "Unresolved component";

}

 

/* ================================================================

   14. ERROR CODE DETECTION

   ================================================================ */

 

function detectErrorCodes(lines) {

  const codes = [];

 

  for (const line of lines) {

    const matches = line.match(

      /\b[A-Z][A-Z0-9]+(?:_[A-Z0-9]+)+\b/g

    );

 

    if (matches) {

      matches.forEach(code => {

        if (!codes.includes(code)) {

          codes.push(code);

        }

      });

    }

  }

 

  return codes;

}

 

/* ================================================================

   15. TEST-STAGE DETECTION

   ---------------------------------------------------------------

   If the log does not explicitly contain test-stage markers,

   the parser uses limited contextual inference and labels the

   result as prototype-derived.

 

   It does not claim that unobserved stages passed.

   ================================================================ */

 

function detectTestStages(lines) {

  const joined = lines.join(" ").toLowerCase();

 

  const stages = {

    INIT: "NOT RUN",

    FLT: "NOT RUN",

    FLB: "NOT RUN",

    FCT: "NOT RUN",

    DCC: "NOT RUN",

    RIN: "NOT RUN"

  };

 

  let failureStage = "Awaiting analysis";

 

  const explicitStagePattern =

    /\b(INIT|FLT|FLB|FCT|DCC|RIN)\b[\s:=-]*(PASS|FAIL|NOT RUN|SKIP|WARN)/gi;

 

  let match;

 

  while ((match = explicitStagePattern.exec(lines.join("\n")))) {

    const stage = match[1].toUpperCase();

    const result = match[2].toUpperCase();

 

    stages[stage] = result;

 

    if (result === "FAIL" && failureStage === "Awaiting analysis") {

      failureStage = stage;

    }

  }

 

  if (

    failureStage === "Awaiting analysis" &&

    (

      joined.includes("initialization") ||

      joined.includes("hmc_bist")

    )

  ) {

    stages.INIT = "FAIL";

    failureStage = "INIT / HMC BIST";

  }

 

  if (

    failureStage === "Awaiting analysis" &&

    (

      joined.includes("pcie") ||

      joined.includes("link-width")

    )

  ) {

    stages.FLT = "FAIL";

    failureStage = "FLT";

  }

 

  if (

    failureStage === "Awaiting analysis" &&

    joined.includes("tester")

  ) {

    failureStage = "Test execution";

  }

 

  return {

    failureStage,

    stages

  };

}

 

/* ================================================================

   16. TESTER ANALYSIS

   ---------------------------------------------------------------

   A tester ID is metadata.

 

   It is not a failure.

 

   Tester failure requires an actual execution, calibration,

   permission, script, instability, or tester timeout signal.

   ================================================================ */

 

function analyzeTesterEvidence(normalizedLog) {

  const failurePatterns = [

    "tester timeout",

    "tester failure",

    "tester failed",

    "tester instability",

    "calibration failure",

    "calibration expired",

    "script execution failure",

    "script failed",

    "permission denied",

    "execution aborted",

    "test environment failure"

  ];

 

  const matchedPatterns = failurePatterns.filter(pattern =>

    normalizedLog.includes(pattern)

  );

 

  return {

    isFailure: matchedPatterns.length > 0,

    matchedPatterns

  };

}

 

/* ================================================================

   17. FIRMWARE ANALYSIS

   ---------------------------------------------------------------

   Firmware information alone is neutral.

 

   A firmware issue requires direct evidence of mismatch,

   incompatibility, invalid version, failed update, or conflict.

   ================================================================ */

 

function analyzeFirmwareEvidence(normalizedLog) {

  const failurePatterns = [

    "firmware mismatch",

    "firmware incompatible",

    "firmware incompatibility",

    "invalid firmware",

    "firmware update failed",

    "firmware version conflict",

    "firmware conflict",

    "unsupported firmware"

  ];

 

  const matchedPatterns = failurePatterns.filter(pattern =>

    normalizedLog.includes(pattern)

  );

 

  return {

    isFailure: matchedPatterns.length > 0,

    matchedPatterns

  };

}

 

/* ================================================================

   18. SUPPORTING EVIDENCE

   ================================================================ */

 

function buildSupportingEvidence({

  lines,

  normalized,

  affectedComponent,

  hasHmcFault,

  hasPcieFault,

  hasTesterFailure,

  hasFirmwareFailure,

  testerAssessment,

  firmwareAssessment,

  errorCodes

}) {

  const evidence = [];

 

  if (hasHmcFault) {

    const hmcFailureLine = lines.find(line =>

      /hmc_bist_fail/i.test(line)

    );

 

    if (hmcFailureLine) {

      evidence.push({

        category: "PRIMARY FAILURE",

        text: normalizeText(hmcFailureLine)

      });

    }

 

    if (normalized.includes("initialization timeout")) {

      evidence.push({

        category: "CORRELATED SIGNAL",

        text: "Initialization timeout detected."

      });

    }

 

    if (normalized.includes("did not receive heartbeat")) {

      evidence.push({

        category: "CORRELATED SIGNAL",

        text: `${affectedComponent} heartbeat activity failed.`

      });

    }

 

    if (normalized.includes("hmc retry")) {

      evidence.push({

        category: "CORRELATED SIGNAL",

        text: "HMC retry activity detected."

      });

    }

  }

 

  if (hasPcieFault) {

    evidence.push({

      category: "PRIMARY FAILURE",

      text: "PCIe link or width-related failure detected."

    });

  }

 

  if (hasTesterFailure) {

    evidence.push({

      category: "TESTER SIGNAL",

      text: `Tester-related signals detected: ${testerAssessment.matchedPatterns.join(", ")}.`

    });

  }

 

  if (hasFirmwareFailure) {

    evidence.push({

      category: "FIRMWARE SIGNAL",

      text: `Firmware-related signals detected: ${firmwareAssessment.matchedPatterns.join(", ")}.`

    });

  }

 

  if (errorCodes.length > 0) {

    evidence.push({

      category: "ERROR CODE",

      text: `Detected code(s): ${errorCodes.join(", ")}.`

    });

  }

 

  if (evidence.length === 0) {

    evidence.push({

      category: "REVIEW",

      text: "Additional technician review is required."

    });

  }

 

  return evidence;

}

 

/* ================================================================

   19. CONTRADICTING / NEGATIVE EVIDENCE

   ================================================================ */

 

function buildContradictingEvidence({

  lines,

  normalized,

  hasHmcFault,

  hasPcieFault,

  hasTesterFailure,

  hasFirmwareFailure,

  testerAssessment,

  firmwareAssessment

}) {

  const evidence = [];

 

  const passedGpus = lines

    .filter(line => /\[PASS\]\s+GPU\d+\s+detected/i.test(line))

    .map(line => {

      const match = line.match(/\bGPU\d+\b/i);

      return match ? match[0].toUpperCase() : null;

    })

    .filter(Boolean);

 

  if (passedGpus.length > 0) {

    evidence.push({

      category: "NEGATIVE EVIDENCE",

      text: `${passedGpus.join(", ")} detection passed.`

    });

  }

 

  if (normalized.includes("nvswitch detected")) {

    evidence.push({

      category: "NEGATIVE EVIDENCE",

      text: "NVSwitch detection passed."

    });

  }

 

  if (normalized.includes("bmc communication established")) {

    evidence.push({

      category: "NEGATIVE EVIDENCE",

      text: "BMC communication established."

    });

  }

 

  if (

    normalized.includes("firmware compatibility check completed") &&

    !hasFirmwareFailure

  ) {

    evidence.push({

      category: "NEGATIVE EVIDENCE",

      text: "Firmware compatibility check completed without a direct failure signal."

    });

  }

 

  if (!hasTesterFailure) {

    evidence.push({

      category: "TESTER SIGNAL",

      text: "Tester identity was present, but no direct tester failure signal was identified."

    });

  }

 

  if (!hasHmcFault && !hasPcieFault && !hasFirmwareFailure) {

    evidence.push({

      category: "REVIEW",

      text: "No dominant failure pattern was established."

    });

  }

 

  return evidence;

}

 

/* ================================================================

   20. PREVIOUS ACTIONS

   ---------------------------------------------------------------

   The prototype can only report actions documented in the log or

   technician notes.

 

   It must not fabricate a repair history.

   ================================================================ */

 

function inferPreviousActions({ normalized, hasHmcFault }) {

  const actions = [];

 

  if (normalized.includes("reseat")) {

    actions.push({

      action: "Component reseat documented",

      details: "A reseat action was referenced in the available case information.",

      result: "Documented",

      timestamp: "Source log or technician notes"

    });

  }

 

  if (normalized.includes("firmware compatibility check completed")) {

    actions.push({

      action: "Firmware compatibility check",

      details: "Firmware compatibility validation was documented.",

      result: "Completed",

      timestamp: "Source log"

    });

  }

 

  if (normalized.includes("bmc communication established")) {

    actions.push({

      action: "BMC communication check",

      details: "BMC communication was established.",

      result: "Passed",

      timestamp: "Source log"

    });

  }

 

  if (hasHmcFault) {

    actions.push({

      action: "Initial test execution",

      details: "The unit reached an HMC initialization-related failure.",

      result: "Failed",

      timestamp: "Source log"

    });

  }

 

  return actions;

}

 

function buildDoNotRepeatActions(previousActions) {

  const guardrails = [];

 

  const hasReseat = previousActions.some(action =>

    action.action.toLowerCase().includes("reseat")

  );

 

  if (hasReseat) {

    guardrails.push({

      action: "Do not repeat component reseat",

      reason: "A reseat was already documented.",

      exception:

        "A technician may repeat the action if new evidence or procedure requirements justify it."

    });

  }

 

  if (guardrails.length === 0) {

    guardrails.push({

      action: "No automatic repeat-action guardrail",

      reason: "No repeated troubleshooting action has been documented.",

      exception:

        "Technician review remains required before any physical action."

    });

  }

 

  return guardrails;

}

 

/* ================================================================

   21. ROOT-CAUSE CANDIDATES

   ---------------------------------------------------------------

   These are prototype evidence scores.

 

   They are not validated probabilities, production confidence,

   or autonomous repair decisions.

   ================================================================ */

 

function buildRootCauseCandidates({

  affectedComponent,

  hasHmcFault,

  hasPcieFault,

  hasTesterFailure,

  hasFirmwareFailure

}) {

  if (hasHmcFault) {

    return [

      {

        name: affectedComponent,

        score: 94,

        reason: "Direct failure and correlated heartbeat / initialization signals."

      },

      {

        name: "HMC path",

        score: 71,

        reason: "HMC retry and initialization behavior correlate with the failure."

      },

      {

        name: "Tester configuration",

        score: 18,

        reason: "No direct tester failure signal was identified."

      },

      {

        name: "Firmware",

        score: 9,

        reason: "No direct firmware mismatch or incompatibility signal was identified."

      }

    ];

  }

 

  if (hasPcieFault) {

    return [

      {

        name: affectedComponent,

        score: 87,

        reason: "Direct PCIe link or width-related failure evidence."

      },

      {

        name: "Slot or physical path",

        score: 69,

        reason: "The failure may involve seating, slot state, or path integrity."

      },

      {

        name: "Tester configuration",

        score: 22,

        reason: "No direct tester execution failure was identified."

      },

      {

        name: "Firmware",

        score: 12,

        reason: "No direct firmware conflict was identified."

      }

    ];

  }

 

  if (hasTesterFailure) {

    return [

      {

        name: "Tester environment",

        score: 81,

        reason: "Direct tester or execution failure evidence was identified."

      },

      {

        name: "Configuration",

        score: 46,

        reason: "Configuration may contribute to test execution behavior."

      },

      {

        name: affectedComponent,

        score: 24,

        reason: "Hardware failure is not established by the current evidence."

      },

      {

        name: "Firmware",

        score: 10,

        reason: "No direct firmware failure signal was identified."

      }

    ];

  }

 

  if (hasFirmwareFailure) {

    return [

      {

        name: "Firmware compatibility",

        score: 78,

        reason: "Direct firmware mismatch or compatibility evidence was identified."

      },

      {

        name: "Configuration",

        score: 41,

        reason: "Configuration conflicts may contribute to the observed behavior."

      },

      {

        name: affectedComponent,

        score: 25,

        reason: "Component failure is not established by current evidence."

      },

      {

        name: "Tester environment",

        score: 16,

        reason: "No direct tester failure evidence was identified."

      }

    ];

  }

 

  return [

    {

      name: "Unresolved hardware or configuration issue",

      score: 62,

      reason: "The available evidence does not establish a dominant cause."

    },

    {

      name: "Tester environment",

      score: 24,

      reason: "Tester failure was not directly established."

    },

    {

      name: "Firmware",

      score: 14,

      reason: "Firmware failure was not directly established."

    },

    {

      name: "Unknown",

      score: 8,

      reason: "Additional evidence is required."

    }

  ];

}

 

/* ================================================================

   22. CONFIDENCE EXPLANATION

   ================================================================ */

 

function buildConfidenceExplanation({

  confidence,

  supportingEvidence,

  contradictingEvidence,

  affectedComponent,

  hasHmcFault,

  hasPcieFault,

  hasTesterFailure,

  hasFirmwareFailure

}) {

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

 

/* ================================================================

   23. PARTS REQUEST MODEL

   ---------------------------------------------------------------

   This does not order or reserve inventory.

 

   It prepares a structured planning record for future technician

   approval and warehouse integration.

   ================================================================ */

 

function buildPartsRequest({

  affectedComponent,

  hasHmcFault,

  hasPcieFault

}) {

  if (hasHmcFault) {

    return {

      required: true,

      actionType: "GPU swap or approved isolation test",

      partNumber: "Pending technician selection",

      description: `Replacement candidate associated with ${affectedComponent}`,

      quantity: 1,

      requestedBy: "",

      approvalStatus: "Not approved",

      warehouseStatus: "Not requested",

      replacementSerialNumber: "Not assigned"

    };

  }

 

  if (hasPcieFault) {

    return {

      required: "Conditional",

      actionType: "Slot or component isolation",

      partNumber: "Pending diagnostic outcome",

      description: "Part requirement depends on isolation result.",

      quantity: 0,

      requestedBy: "",

      approvalStatus: "Not approved",

      warehouseStatus: "Not requested",

      replacementSerialNumber: "Not assigned"

    };

  }

 

  return {

    required: false,

    actionType: "No part recommendation yet",

    partNumber: "Not applicable",

    description: "No replacement part should be requested from current evidence.",

    quantity: 0,

    requestedBy: "",

    approvalStatus: "Not applicable",

    warehouseStatus: "Not applicable",

    replacementSerialNumber: "Not applicable"

  };

}

 

/* ================================================================

   24. RETEST REQUIREMENT

   ================================================================ */

 

function buildRetestRequirement({

  hasHmcFault,

  hasPcieFault,

  hasTesterFailure,

  hasFirmwareFailure,

  failureStage

}) {

  let stage = failureStage;

  let expectedResult = "Required stage passes without recurrence.";

 

  if (hasHmcFault) {

    stage = "INIT / HMC BIST";

    expectedResult = "HMC initialization and affected GPU heartbeat pass.";

  } else if (hasPcieFault) {

    stage = "FLT";

    expectedResult = "PCIe link and width checks pass.";

  } else if (hasTesterFailure) {

    stage = "Approved test execution";

    expectedResult = "Test completes on a validated tester.";

  } else if (hasFirmwareFailure) {

    stage = "Firmware validation and affected test stage";

    expectedResult = "Approved firmware compatibility is confirmed.";

  }

 

  return {

    required: true,

    stage,

    expectedResult,

    result: "NOT RUN",

    status: "NOT READY",

    message:

      "A diagnostic recommendation cannot be considered verified until the required retest is documented."

  };

}

 

/* ================================================================

   25. SHIFT HANDOFF

   ---------------------------------------------------------------

   This replaces ambiguous handwritten handoff notes with a

   structured summary that future shifts can review.

   ================================================================ */

 

function buildShiftHandoff({

  affectedComponent,

  title,

  recommendation,

  previousActions,

  doNotRepeat,

  partsRequest,

  retest

}) {

  return {

    currentStatus: "Diagnosis ready - technician review required",

 

    whatHasBeenDone: previousActions.map(action =>

      `${action.action}: ${action.result}`

    ),

 

    doNotRepeat: doNotRepeat.map(item =>

      item.action

    ),

 

    nextRequiredAction: recommendation,

 

    partsStatus: partsRequest.warehouseStatus,

 

    retestRequirement:

      `${retest.stage}: ${retest.expectedResult}`,

 

    notes:

      `${title} involving ${affectedComponent}. ` +

      "This handoff is generated from prototype evidence and must be reviewed by the next technician."

  };

}

 

/* ================================================================

   26. STRUCTURED DIAGNOSTIC RENDERER

   ---------------------------------------------------------------

   This function reveals the existing structured result contract

   and populates its stable fields.

 

   It does not replace #result-panel.innerHTML.

   ================================================================ */

 

function renderAnalysis(analysis) {

  if (!analysis) {

    return;

  }

 

  state.currentAnalysis = analysis;

 

  const resultPanel = $("#result-panel");

  const emptyResult = $("#empty-diagnostic-result");

  const structuredResult = $("#structured-diagnostic-result");

 

  if (resultPanel) {

    resultPanel.dataset.resultState = "ready";

    resultPanel.dataset.dataSource = "demo";

  }

 

  if (emptyResult) {

    emptyResult.hidden = true;

  }

 

  if (structuredResult) {

    structuredResult.hidden = false;

    structuredResult.dataset.resultState = "ready";

    structuredResult.dataset.dataSource = "demo";

  }

 

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
  renderDedicatedREX();

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

  return {

    caseId: "CASE-NEW",

    caseState: "NEW",

    travelerId: "TRAVELER-NEW",

    technician: getInputValue("#technician-name") || "Repair Technician",

    tester: getInputValue("#tester-name") || "SXM-TESTER-04",

    product: getInputValue("#product-model") || "H200 / SXM",

    failure: {

      failureStage: "Awaiting analysis"

    },

    unit: {

      unitSerialNumber: "DEMO-UNIT-0001",

      systemSerialNumber: "DEMO-SYSTEM-0001",

      platform: "H200 / SXM"

    },

    dataSource: "Prototype / Demonstration Data"

  };

}

 

function updateActiveCaseContext(analysis) {

  if (!analysis) {

    return;

  }

 

  setText("#active-case-id", analysis.caseId || "CASE-NEW");

  setText(

    "#active-case-state",

    analysis.caseState || "NEW"

  );

 

  setText(

    "#active-unit-serial",

    analysis.unit?.unitSerialNumber || "Not supplied"

  );

 

  setText(

    "#active-system-serial",

    analysis.unit?.systemSerialNumber || "Not supplied"

  );

 

  setText(

    "#active-platform",

    analysis.unit?.platform || analysis.product || "Not supplied"

  );

 

  setText(

    "#active-failure-stage",

    analysis.failure?.failureStage || "Awaiting analysis"

  );

 

  setText(

    "#active-tester",

    analysis.tester || "Not identified"

  );

 

  setText(

    "#active-technician",

    analysis.technician || "Not identified"

  );

 

  const context = $("#active-case-context");

 

  if (context) {

    context.dataset.caseState = analysis.caseState || "NEW";

    context.dataset.dataSource = "demo";

  }

 

  updateDataSourceLabels(analysis.dataSource);

}

 

function updateDataSourceLabels(label) {

  const safeLabel = label || "Prototype / Demonstration Data";

 

  setText("#active-case-data-status strong", safeLabel);

  setText("#diagnostic-result-data-label", safeLabel);

  setText("#diagnostic-data-source", safeLabel);

}

 

/* ================================================================

   28. RESULT HEADER

   ================================================================ */

 

function renderResultHeader(analysis) {

  setText("#root-cause-command-heading", analysis.title);

  setText(

    "#diagnostic-result-summary",

    `${analysis.category} involving ${analysis.affectedComponent}.`

  );

 

  setText("#diagnostic-result-status", "DIAGNOSIS READY");

  setText("#diagnostic-result-data-label", "PROTOTYPE / DEMONSTRATION DATA");

}

 

/* ================================================================

   29. ACTIVE CASE RESULT SECTION

   ================================================================ */

 

function renderActiveCaseSection(analysis) {

  setText("#diagnostic-case-id", analysis.caseId);

  setText("#diagnostic-case-state", analysis.caseState);

  setText("#diagnostic-department", analysis.unit.department);

  setText("#diagnostic-technician", analysis.technician);

  setText("#diagnostic-tester", analysis.tester);

}

 

/* ================================================================

   30. UNIT IDENTITY RENDERING

   ================================================================ */

 

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

 

/* ================================================================

   31. TEST-STAGE RENDERING

   ================================================================ */

 

function renderTestStages(analysis) {

  const stages = analysis.testSession?.stages || {};

 

  setText(

    "#diagnostic-failure-stage",

    analysis.failure?.failureStage || "Awaiting analysis"

  );

 

  Object.entries(stages).forEach(([stage, result]) => {

    const stageId = stage.toLowerCase();

 

    setText(`#test-stage-${stageId}`, result);

 

    const stageElement = $(

      `.test-stage-item[data-stage="${stage}"]`

    );

 

    if (stageElement) {

      stageElement.dataset.result = result.toLowerCase();

 

      stageElement.classList.remove(

        "pass",

        "fail",

        "warning",

        "not-run",

        "unknown"

      );

 

      if (result === "PASS") {

        stageElement.classList.add("pass");

      } else if (result === "FAIL") {

        stageElement.classList.add("fail");

      } else if (result === "WARN") {

        stageElement.classList.add("warning");

      } else if (result === "NOT RUN") {

        stageElement.classList.add("not-run");

      } else {

        stageElement.classList.add("unknown");

      }

    }

  });

}

 

/* ================================================================

   32. PRIMARY FINDING

   ================================================================ */

 

function renderPrimaryFinding(analysis) {

  setText("#primary-finding-title", analysis.title);

  setText(

    "#primary-finding-explanation",

    `${analysis.category}. ${analysis.confidenceExplanation}`

  );

 

  setText(

    "#primary-finding-severity",

    analysis.severity || "REVIEW"

  );

 

  const severityElement = $("#primary-finding-severity");

 

  if (severityElement) {

    severityElement.className = "status-pill";

    severityElement.classList.add(

      analysis.severity === "CRITICAL"

        ? "critical"

        : analysis.severity === "WARNING"

          ? "warning"

          : "neutral"

    );

  }

}

 

/* ================================================================

   33. AFFECTED COMPONENT

   ================================================================ */

 

function renderAffectedComponent(analysis) {

  setText(

    "#affected-component-name",

    analysis.affectedComponent

  );

 

  setText(

    "#affected-component-part-number",

    `Part number: ${analysis.unit.partNumber}`

  );

 

  setText(

    "#affected-component-serial",

    `Serial number: ${analysis.unit.unitSerialNumber}`

  );

 

  setText("#affected-component-status", "HIGHEST-CORRELATED CANDIDATE");

 

  const historyButton = $("#view-component-history-button");

 

  if (historyButton) {

    historyButton.disabled = false;

    historyButton.dataset.component = analysis.affectedComponent;

  }

}

 

/* ================================================================

   34. ROOT-CAUSE CANDIDATES

   ================================================================ */

 

function renderRootCauseCandidates(analysis) {

  const list = $("#root-cause-candidate-list");

 

  if (!list) {

    return;

  }

 

  const candidates = safeArray(

    analysis.reasoning?.candidates

  );

 

  list.innerHTML = candidates

    .map((candidate, index) => `

      <li

        class="root-cause-candidate"

        data-candidate-rank="${index + 1}"

        data-candidate-id="candidate-${index + 1}"

      >

        <span class="candidate-rank">

          ${index + 1}

        </span>

 

        <div class="candidate-copy">

          <strong data-field="candidateName">

            ${escapeHtml(candidate.name)}

          </strong>

 

          <span data-field="candidateReason">

            ${escapeHtml(candidate.reason)}

          </span>

        </div>

 

        <strong

          class="candidate-score"

          data-field="candidateScore"

        >

          ${escapeHtml(candidate.score)}%

        </strong>

      </li>

    `)

    .join("");

 

  setText("#root-cause-score-label", "PROTOTYPE SCORES");

}

 

/* ================================================================

   35. SUPPORTING EVIDENCE

   ================================================================ */

 

function renderSupportingEvidence(analysis) {

  const list = $("#supporting-evidence-list");

  const count = $("#supporting-evidence-count");

 

  const evidence = safeArray(

    analysis.evidence?.supporting

  );

 

  if (count) {

    count.textContent = `${evidence.length} signal${evidence.length === 1 ? "" : "s"}`;

  }

 

  if (!list) {

    return;

  }

 

  if (!evidence.length) {

    list.innerHTML = `

      <li class="evidence-item empty-evidence">

        <span class="evidence-icon" aria-hidden="true">—</span>

        <span>No supporting evidence has been extracted.</span>

      </li>

    `;

 

    return;

  }

 

  list.innerHTML = evidence

    .map(item => `

      <li class="evidence-item">

        <span class="evidence-icon" aria-hidden="true">✓</span>

        <span>

          <strong>${escapeHtml(item.category)}</strong>

          ${escapeHtml(item.text)}

        </span>

      </li>

    `)

    .join("");

}

 

/* ================================================================

   36. CONTRADICTING EVIDENCE

   ================================================================ */

 

function renderContradictingEvidence(analysis) {

  const list = $("#contradicting-evidence-list");

  const count = $("#contradicting-evidence-count");

 

  const evidence = safeArray(

    analysis.evidence?.contradicting

  );

 

  if (count) {

    count.textContent = `${evidence.length} signal${evidence.length === 1 ? "" : "s"}`;

  }

 

  if (!list) {

    return;

  }

 

  if (!evidence.length) {

    list.innerHTML = `

      <li class="evidence-item empty-evidence">

        <span class="evidence-icon" aria-hidden="true">—</span>

        <span>No contradicting signals have been identified.</span>

      </li>

    `;

 

    return;

  }

 

  list.innerHTML = evidence

    .map(item => `

      <li class="evidence-item">

        <span class="evidence-icon" aria-hidden="true">−</span>

        <span>

          <strong>${escapeHtml(item.category)}</strong>

          ${escapeHtml(item.text)}

        </span>

      </li>

    `)

    .join("");

}

 

/* ================================================================

   37. PREVIOUS ACTIONS

   ================================================================ */

 

function renderPreviousActions(analysis) {

  const list = $("#previous-actions-list");

  const count = $("#previous-actions-count");

 

  const actions = safeArray(

    analysis.history?.previousActions

  );

 

  if (count) {

    count.textContent = `${actions.length} action${actions.length === 1 ? "" : "s"}`;

  }

 

  if (!list) {

    return;

  }

 

  if (!actions.length) {

    list.innerHTML = `

      <li class="action-history-item empty-history">

        <span class="action-marker" aria-hidden="true">—</span>

        <div>

          <strong>No documented actions</strong>

          <span>Repair history has not been supplied.</span>

        </div>

      </li>

    `;

 

    return;

  }

 

  list.innerHTML = actions

    .map(action => `

      <li class="action-history-item">

        <span class="action-marker" aria-hidden="true">✓</span>

        <div>

          <strong>${escapeHtml(action.action)}</strong>

          <span>${escapeHtml(action.details)}</span>

          <small>

            ${escapeHtml(action.result)} · ${escapeHtml(action.timestamp)}

          </small>

        </div>

      </li>

    `)

    .join("");

}

 

/* ================================================================

   38. DO-NOT-REPEAT GUARDRAILS

   ================================================================ */

 

function renderDoNotRepeat(analysis) {

  const list = $("#do-not-repeat-list");

  const count = $("#do-not-repeat-count");

 

  const guardrails = safeArray(

    analysis.history?.doNotRepeat

  );

 

  if (count) {

    count.textContent = `${guardrails.length} action${guardrails.length === 1 ? "" : "s"}`;

  }

 

  if (!list) {

    return;

  }

 

  list.innerHTML = guardrails

    .map(item => `

      <li class="guardrail-item">

        <span class="guardrail-icon" aria-hidden="true">!</span>

        <span>

          <strong>${escapeHtml(item.action)}</strong>

          ${escapeHtml(item.reason)}

        </span>

      </li>

    `)

    .join("");

}

 

/* ================================================================

   39. CONFIDENCE RENDERING

   ================================================================ */

 

function renderConfidence(analysis) {

  const confidence = clamp(

    Number(analysis.confidence) || 0,

    0,

    100

  );

 

  setText("#diagnostic-confidence-value", `${confidence}%`);

 

  setText(

    "#diagnostic-confidence-explanation",

    analysis.confidenceExplanation

  );

 

  const progress = $("#diagnostic-confidence-progress");

 

  if (progress) {

    progress.style.width = `${confidence}%`;

    progress.setAttribute("aria-valuenow", String(confidence));

    progress.setAttribute(

      "aria-label",

      `Diagnostic confidence ${confidence} percent`

    );

  }

}

 

function animateConfidence(target) {

  const progress = $("#diagnostic-confidence-progress");

  const value = $("#diagnostic-confidence-value");

 

  if (!progress || !value) {

    return;

  }

 

  window.clearInterval(state.confidenceTimer);

 

  const safeTarget = clamp(Number(target) || 0, 0, 100);

  let current = 0;

 

  progress.style.width = "0%";

  progress.setAttribute("aria-valuenow", "0");

  value.textContent = "0%";

 

  state.confidenceTimer = window.setInterval(() => {

    current += 2;

 

    if (current >= safeTarget) {

      current = safeTarget;

      window.clearInterval(state.confidenceTimer);

    }

 

    progress.style.width = `${current}%`;

    progress.setAttribute("aria-valuenow", String(current));

    value.textContent = `${current}%`;

  }, 14);

}

 

/* ================================================================

   40. NEXT ACTION

   ================================================================ */

 

function renderNextAction(analysis) {

  setText(

    "#next-action-title",

    analysis.recommendation

  );

 

  setText(

    "#next-action-explanation",

    `${analysis.actionType}. ${analysis.confidenceExplanation}`

  );

 

  setText(

    "#next-action-status",

    "TECHNICIAN REVIEW REQUIRED"

  );

}

 

/* ================================================================

   41. TECHNICIAN APPROVAL

   ---------------------------------------------------------------

   The buttons are enabled only after a diagnostic result exists.

 

   Approval does not execute hardware work.

 

   It records the technician's decision in local prototype history.

   ================================================================ */

 

function renderTechnicianApproval(analysis) {

  setText(

    "#technician-approval-status",

    "PENDING REVIEW"

  );

 

  setText(

    "#technician-approval-message",

    "RepairIQ recommends a controlled diagnostic action. A qualified technician must review and approve the action before physical work or parts movement."

  );

 

  const approveButton = $("#approve-diagnostic-recommendation-button");

  const rejectButton = $("#reject-diagnostic-recommendation-button");

 

  if (approveButton) {

    approveButton.disabled = false;

  }

 

  if (rejectButton) {

    rejectButton.disabled = false;

  }

}

 

/* ================================================================

   42. RETEST REQUIREMENT

   ================================================================ */

 

function renderRetestRequirement(analysis) {

  const retest = analysis.retest || {};

 

  setText("#retest-status", retest.status || "NOT READY");

  setText("#retest-stage", retest.stage || "Not defined");

  setText(

    "#retest-condition",

    retest.expectedResult || "Not defined"

  );

  setText("#retest-result", retest.result || "NOT RUN");

  setText("#retest-requirement-message", retest.message);

}

 

/* ================================================================

   43. DATA DISCLOSURE

   ================================================================ */

 

function renderDataDisclosure(analysis) {

  setText(

    "#diagnostic-data-source",

    analysis.dataSource || "Offline demo"

  );

 

  setText(

    "#diagnostic-intelligence-state",

    "Simulated prototype logic"

  );

 

  setText(

    "#diagnostic-data-disclosure-message",

    "This diagnostic result is illustrative unless connected to verified logs, test-session records, component history, firmware records, and approved production data sources."

  );

}

 

/* ================================================================

   44. RESULT ACTIONS

   ---------------------------------------------------------------

   The upgraded HTML does not contain the old dynamic result

   buttons. They are mounted safely into the provided extension

   point #diagnostic-extension-mount.

   ================================================================ */

 

function renderResultActions(analysis) {

  const mount = $("#diagnostic-extension-mount");

 

  if (!mount) {

    return;

  }

 

  mount.querySelector(".result-actions")?.remove();

  mount.insertAdjacentHTML("beforeend", `

    <div class="result-actions">

      <button

        class="primary-button"

        id="export-summary-button"

        type="button"

      >

        Export Repair Summary

      </button>

 

      <button

        class="secondary-button"

        id="export-json-button"

        type="button"

      >

        Export Case JSON

      </button>

 

      <button

        class="secondary-button"

        id="open-diagnostic-details-button"

        type="button"

      >

        Review Diagnostic Details

      </button>

    </div>

  `);

 

  addListener("#export-summary-button", "click", () => {

    exportSummary(analysis);

  });

 

  addListener("#export-json-button", "click", () => {

    exportJson(analysis);

  });

 

  addListener(

    "#open-diagnostic-details-button",

    "click",

    () => {

      openDiagnosticModal(analysis);

    }

  );

}

 

/* ================================================================

   45. GPU TOPOLOGY

   ---------------------------------------------------------------

   This implementation matches the current HTML topology:

 

   #gpu-topology

   .gpu-node

   data-gpu-id

   #topology-selection

 

   It no longer depends on obsolete:

 

   .hardware-svg

   .visualizer-tab

   .browser-component

   data-svg-component

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

  addListener(

    "#view-component-history-button",

    "click",

    event => {

      const component =

        event.currentTarget.dataset.component ||

        state.activeComponent;

 

      openComponentHistoryModal(component);

    }

  );

}

 

function updateSelectedComponent(component) {

  if (!component) {

    return;

  }

 

  state.activeComponent = component;

 

  $$("#gpu-topology .gpu-node").forEach(node => {

    const isSelected = node.dataset.gpuId === component;

 

    node.classList.toggle("selected", isSelected);

    node.setAttribute("aria-pressed", String(isSelected));

  });

 

  const analysis = state.currentAnalysis;

 

  const isAffected =

    analysis &&

    analysis.affectedComponent === component;

 

  const statusText = isAffected

    ? `${component} selected · Highest-correlated candidate · Technician review required.`

    : `${component} selected · Review current case evidence before action.`;

 

  setText("#topology-selection", statusText);

 

  updateTopologyNodeLabels(component);

}

 

function updateTopologyNodeLabels(selectedComponent) {

  $$("#gpu-topology .gpu-node").forEach(node => {

    const component = node.dataset.gpuId;
    const health = node.querySelector(".gpu-health");
    const load = node.querySelector(".gpu-load");
    if (!health || !load) return;

    const sourceComponent = safeArray(state.topology?.components)
      .find(item => item.componentId === component);
    const isAffected = Boolean(state.currentAnalysis && state.currentAnalysis.affectedComponent === component);
    const isSelected = selectedComponent === component;
    const healthState = isAffected ? "critical" : (sourceComponent?.healthState || "unknown");

    node.classList.remove("critical", "warning", "healthy", "unknown");
    node.classList.add(healthState);
    node.dataset.healthState = healthState;
    health.textContent = `● ${healthState.toUpperCase()}${healthState === "critical" ? " · REVIEW" : ""}`;
    load.textContent = isSelected ? "SELECTED · DEMO DATA" : healthState === "critical" ? "REVIEW REQUIRED" : "DEMO / NOT VERIFIED";
  });

  updateTopologyCounts();
}

function updateTopologyFromAnalysis(analysis) {

  if (!analysis) {

    return;

  }

 

  const affectedComponent = analysis.affectedComponent;

 

  updateSelectedComponent(affectedComponent);

 

  const affectedMatch = affectedComponent.match(/GPU(\d+)/i);

 

  if (affectedMatch) {

    const affectedGpu = `GPU${affectedMatch[1]}`;

 

    setText(

      "#topology-selection",

      `${affectedGpu} selected · ${analysis.title} · Technician review required.`

    );

  }

 

  updateTopologyCounts();

}

 

function updateTopologyCounts() {

  const nodes = $$("#gpu-topology .gpu-node");

 

  const criticalCount = nodes.filter(node =>

    node.classList.contains("critical")

  ).length;

 

  const attentionCount = nodes.filter(node =>

    node.classList.contains("critical") ||

    node.classList.contains("warning")

  ).length;

 

  const healthyCount = nodes.filter(node =>

    node.classList.contains("healthy")

  ).length;

 

  setText("#topology-healthy-count", String(healthyCount));

  setText(

    "#topology-attention-count",

    String(attentionCount)

  );

 

  setText("#critical-gpu-count", String(criticalCount));

}

 

/* ================================================================

   46. CASE HISTORY

   --------------------------------------------------------------- */

 

function initializeCaseHistory() {

  addListener("#case-search", "input", renderCases);

  addListener("#case-filter", "change", renderCases);

 

  addListener("#clear-cases-button", () => {

    const confirmed = window.confirm(

      "Clear locally stored prototype cases?"

    );

 

    if (!confirmed) {

      return;

    }

 

    localStorage.removeItem("repairiq-cases");

 

    renderCases();

    renderActivity();

 

    showToast("Local case history cleared.");

  });

}

 

function getCases() {

  const stored = localStorage.getItem("repairiq-cases");

 

  if (!stored) {

    return [...DEFAULT_CASES];

  }

 

  try {

    const parsed = JSON.parse(stored);

 

    return Array.isArray(parsed)

      ? parsed

      : [...DEFAULT_CASES];

  } catch {

    return [...DEFAULT_CASES];

  }

}

 

function saveAnalyzedCase(status, decisionNotes = "") {

  if (!state.currentAnalysis) {

    return;

  }

 

  const analysis = state.currentAnalysis;

  const cases = getCases();

 

  const record = {

    id: analysis.caseId,

    travelerId: analysis.travelerId,

    product: analysis.product,

    issue: analysis.title,

    component: analysis.affectedComponent,

    recommendation: analysis.recommendation,

    status,

    decisionNotes,

    timestamp: "Just now",

 

    dataSource: analysis.dataSource,

    failureStage: analysis.failure.failureStage,

    errorCode: analysis.failure.errorCode,

 

    mpPartNumber: analysis.unit.mpPartNumber,

    mpSerialNumber: analysis.unit.mpSerialNumber,

    pcbPartNumber: analysis.unit.pcbPartNumber,

    pcbSerialNumber: analysis.unit.pcbSerialNumber,

 

    partsStatus: analysis.partsRequest.warehouseStatus,

    retestResult: analysis.retest.result

  };

 

  const withoutDuplicate = cases.filter(

    item => item.id !== record.id

  );

 

  withoutDuplicate.unshift(record);

 

  localStorage.setItem(

    "repairiq-cases",

    JSON.stringify(withoutDuplicate.slice(0, 40))

  );

 

  renderCases();

  renderActivity();

}

 

function renderCases() {

  const body = $("#case-table-body");

  const emptyState = $("#case-table-empty-state");

 

  if (!body) {

    return;

  }

 

  const search = getInputValue("#case-search").toLowerCase();

  const filter = getInputValue("#case-filter") || "all";

 

  const cases = getCases().filter(item => {

    const searchableText = Object.values(item)

      .join(" ")

      .toLowerCase();

 

    const matchesSearch =

      !search ||

      searchableText.includes(search);

 

    const matchesFilter =

      filter === "all" ||

      item.status === filter;

 

    return matchesSearch && matchesFilter;

  });

 

  if (!cases.length) {

    body.innerHTML = "";

 

    if (emptyState) {

      emptyState.hidden = false;

    }

 

    return;

  }

 

  if (emptyState) {

    emptyState.hidden = true;

  }

 

  body.innerHTML = cases

    .map(item => `

      <tr>

        <td class="table-case-id">

          ${escapeHtml(item.id)}

        </td>

 

        <td>

          ${escapeHtml(item.product)}

        </td>

 

        <td>

          ${escapeHtml(item.issue)}

        </td>

 

        <td>

          ${escapeHtml(item.component)}

        </td>

 

        <td>

          ${escapeHtml(item.recommendation)}

        </td>

 

        <td>

          <span class="table-status ${escapeHtml(

            String(item.status || "").toLowerCase()

          )}">

            ${escapeHtml(item.status)}

          </span>

        </td>

      </tr>

    `)

    .join("");

}

 

function renderActivity() {

  const list = $("#activity-list");

 

  if (!list) {

    return;

  }

 

  const cases = getCases().slice(0, 4);

 

  if (!cases.length) {

    list.innerHTML = `

      <div class="activity-item">

        <div class="activity-icon">◇</div>

        <div>

          <strong>No recent activity</strong>

          <small>No local prototype cases are available.</small>

        </div>

      </div>

    `;

 

    return;

  }

 

  list.innerHTML = cases

    .map(item => `

      <div class="activity-item">

        <div class="activity-icon">◇</div>

 

        <div>

          <strong>

            ${escapeHtml(item.issue)}

          </strong>

 

          <small>

            ${escapeHtml(item.id)} ·

            ${escapeHtml(item.component)}

          </small>

        </div>

 

        <span class="activity-time">

          ${escapeHtml(item.timestamp)}

        </span>

      </div>

    `)

    .join("");

}

 

/* ================================================================

   47. BUTTONS

   ---------------------------------------------------------------

   These selectors match the current updated HTML.

 

   Obsolete selectors from the previous JavaScript version were

   intentionally removed:

 

   - #new-diagnosis-button

   - #scan-hardware-button

   - #view-procedures-button

   - #settings-button

   - #header-alert-button

   - #technician-profile-button

   - .tool-card

   ================================================================ */

 

function initializeButtons() {

  addListener("#load-demo-button", "click", () => {

    loadDemoCase();

    runAnalysis();

  });

 

  addListener("#view-demo-button", "click", () => {

    loadDemoCase();

    runAnalysis();

  });

 

  addListener("#start-analysis-button", "click", () => {

    switchView("analyzer");

 

    window.setTimeout(() => {

      $("#diagnostic-search")?.focus();

    }, 0);

  });

 

  addListener("#approve-diagnostic-recommendation-button", "click", () => {

    approveRecommendation();

  });

 

  addListener("#reject-diagnostic-recommendation-button", "click", () => {

    rejectRecommendation();

  });

}

 

/* ================================================================

   48. TECHNICIAN APPROVAL WORKFLOW

   ---------------------------------------------------------------

   This workflow records a human decision.

 

   It does not:

 

   - Replace hardware

   - Request parts automatically

   - Modify hardware

   - Start a retest automatically

   - Claim that the unit is repaired

   ================================================================ */

 

function approveRecommendation() {

  const analysis = state.currentAnalysis;

 

  if (!analysis) {

    showToast("Analyze a case before approving a recommendation.");

    return;

  }

 

  const confirmed = window.confirm(

    "Approve this diagnostic action for technician-controlled execution?"

  );

 

  if (!confirmed) {

    return;

  }

 

  analysis.caseState = "REPAIR IN PROGRESS";

  analysis.recommendationDetails.approvalStatus =

    "APPROVED BY TECHNICIAN";

 

  analysis.partsRequest.approvalStatus =

    analysis.partsRequest.required

      ? "Pending warehouse request"

      : "Not applicable";

 

  setText(

    "#technician-approval-status",

    "APPROVED BY TECHNICIAN"

  );

 

  setText(

    "#technician-approval-message",

    "The technician approved the recommended diagnostic action. Physical execution remains outside RepairIQ and must be documented by the responsible repair team."

  );

 

  setText("#active-case-state", "REPAIR IN PROGRESS");

 

  saveAnalyzedCase(

    "Pending",

    "Technician approved the recommended diagnostic action."

  );

 

  showToast("Technician approval recorded.");

}

 

function rejectRecommendation() {

  const analysis = state.currentAnalysis;

 

  if (!analysis) {

    showToast("Analyze a case before rejecting a recommendation.");

    return;

  }

 

  const notes = window.prompt(

    "Enter the reason for rejecting or escalating this recommendation:"

  );

 

  if (!notes || !notes.trim()) {

    showToast("A reason is required for rejection or escalation.");

    return;

  }

 

  analysis.caseState = "ESCALATED";

  analysis.recommendationDetails.approvalStatus =

    "REJECTED / ESCALATED";

 

  setText(

    "#technician-approval-status",

    "REJECTED / ESCALATED"

  );

 

  setText(

    "#technician-approval-message",

    `Technician decision recorded: ${notes.trim()}`

  );

 

  setText("#active-case-state", "ESCALATED");

 

  saveAnalyzedCase(

    "Escalated",

    notes.trim()

  );

 

  showToast("Recommendation escalated for further review.");

}

 

/* ================================================================

   49. DIAGNOSTIC MODAL

   ---------------------------------------------------------------

   The updated HTML contains one modal:

 

   #diagnostic-modal

   #modal-close-button

   #modal-content

 

   The obsolete evidence and decision modal selectors have been

   removed.

   ================================================================ */

 

function initializeModal() {

  addListener(

    "#modal-close-button",

    "click",

    closeDiagnosticModal

  );

 

  const overlay = $("#diagnostic-modal");

 

  if (overlay) {

    overlay.addEventListener("click", event => {

      if (event.target === overlay) {

        closeDiagnosticModal();

      }

    });

  }

}

 

function openDiagnosticModal(analysis) {

  const modal = $("#diagnostic-modal");

  const content = $("#modal-content");

 

  if (!modal || !content || !analysis) {

    return;

  }

 

  state.lastFocusedElement = document.activeElement;

  state.modalOpen = true;

 

  content.innerHTML = `

    <div class="modal-detail-grid">

 

      <div>

        <span>Case</span>

        <strong>${escapeHtml(analysis.caseId)}</strong>

      </div>

 

      <div>

        <span>Traveler</span>

        <strong>${escapeHtml(analysis.travelerId)}</strong>

      </div>

 

      <div>

        <span>Primary finding</span>

        <strong>${escapeHtml(analysis.title)}</strong>

      </div>

 

      <div>

        <span>Affected component</span>

        <strong>${escapeHtml(analysis.affectedComponent)}</strong>

      </div>

 

      <div>

        <span>Failure stage</span>

        <strong>${escapeHtml(analysis.failure.failureStage)}</strong>

      </div>

 

      <div>

        <span>Error code</span>

        <strong>${escapeHtml(analysis.failure.errorCode)}</strong>

      </div>

 

    </div>

 

    <div class="modal-section">

      <div class="eyebrow">REASONING</div>

      <p>

        ${escapeHtml(analysis.confidenceExplanation)}

      </p>

    </div>

 

    <div class="modal-section">

      <div class="eyebrow">RECOMMENDED ACTION</div>

      <p>

        ${escapeHtml(analysis.recommendation)}

      </p>

    </div>

 

    <div class="modal-section">

      <div class="eyebrow">CONTROL NOTICE</div>

      <p>

        RepairIQ provides technician decision support only.

        Physical actions require qualified human review.

      </p>

    </div>

  `;

 

  modal.hidden = false;

  modal.setAttribute("aria-hidden", "false");

 

  window.setTimeout(() => {

    $(".modal", modal)?.focus();

  }, 0);

}

 

function openComponentHistoryModal(component) {

  const analysis = state.currentAnalysis;

 

  if (!analysis) {

    showToast("Analyze a case before viewing component history.");

    return;

  }

 

  const componentAnalysis = {

    ...analysis,

    title: `${component} component detail`,

    affectedComponent: component,

    confidenceExplanation:

      `This prototype component detail is linked to the active case. Verified installation, genealogy, repair history, and firmware records are not connected.`

  };

 

  openDiagnosticModal(componentAnalysis);

}

 

function closeDiagnosticModal() {

  const modal = $("#diagnostic-modal");

 

  if (!modal) {

    return;

  }

 

  modal.hidden = true;

  modal.setAttribute("aria-hidden", "true");

  state.modalOpen = false;

 

  if (

    state.lastFocusedElement &&

    typeof state.lastFocusedElement.focus === "function"

  ) {

    state.lastFocusedElement.focus();

  }

}

 

/* ================================================================

   50. EXPORTS

   ---------------------------------------------------------------

   Exported content includes traveler, evidence, recommendation,

   approval, parts, retest, and handoff data.

   ================================================================ */

 

function exportSummary(analysis) {

  if (!analysis) {

    showToast("Analyze a case before exporting.");

    return;

  }

 

  const supportingEvidence = safeArray(

    analysis.evidence?.supporting

  )

    .map((item, index) =>

      `${index + 1}. [${item.category}] ${item.text}`

    )

    .join("\n");

 

  const contradictingEvidence = safeArray(

    analysis.evidence?.contradicting

  )

    .map((item, index) =>

      `${index + 1}. [${item.category}] ${item.text}`

    )

    .join("\n");

 

  const previousActions = safeArray(

    analysis.history?.previousActions

  )

    .map((item, index) =>

      `${index + 1}. ${item.action} - ${item.result}`

    )

    .join("\n");

 

  const doNotRepeat = safeArray(

    analysis.history?.doNotRepeat

  )

    .map((item, index) =>

      `${index + 1}. ${item.action} - ${item.reason}`

    )

    .join("\n");

 

  const content = `

REPAIRIQ

SXM REPAIR INTELLIGENCE COMMAND CENTER

PROTOTYPE / DEMONSTRATION DATA

 

CASE

${analysis.caseId}

 

TRAVELER

${analysis.travelerId}

 

PRODUCT

${analysis.product}

 

MP PART NUMBER

${analysis.unit.mpPartNumber}

 

MP SERIAL NUMBER

${analysis.unit.mpSerialNumber}

 

PCB PART NUMBER

${analysis.unit.pcbPartNumber}

 

PCB SERIAL NUMBER

${analysis.unit.pcbSerialNumber}

 

PRIMARY FINDING

${analysis.title}

 

CATEGORY

${analysis.category}

 

AFFECTED COMPONENT

${analysis.affectedComponent}

 

FAILURE STAGE

${analysis.failure.failureStage}

 

ERROR CODE

${analysis.failure.errorCode}

 

PROTOTYPE EVIDENCE SCORE

${analysis.confidence}%

 

WHY THIS SCORE EXISTS

${analysis.confidenceExplanation}

 

SUPPORTING EVIDENCE

${supportingEvidence}

 

CONTRADICTING SIGNALS

${contradictingEvidence}

 

WHAT HAS ALREADY BEEN DONE

${previousActions || "No documented actions"}

 

DO NOT REPEAT

${doNotRepeat || "No guardrails generated"}

 

RECOMMENDED ACTION

${analysis.recommendation}

 

ACTION TYPE

${analysis.actionType}

 

TECHNICIAN APPROVAL

${analysis.recommendationDetails.approvalStatus}

 

PARTS STATUS

${analysis.partsRequest.warehouseStatus}

 

RETEST STAGE

${analysis.retest.stage}

 

RETEST REQUIREMENT

${analysis.retest.expectedResult}

 

RETEST RESULT

${analysis.retest.result}

 

SHIFT HANDOFF STATUS

${analysis.handoff.currentStatus}

 

SHIFT HANDOFF NEXT ACTION

${analysis.handoff.nextRequiredAction}

 

CONTROL NOTICE

RepairIQ provides technician decision support only.

Consequential repair actions require qualified human review.

This prototype does not control hardware or warehouse systems.

`.trim();

 

  downloadFile(

    content,

    `${analysis.caseId}-repair-report.txt`,

    "text/plain;charset=utf-8"

  );

 

  showToast("Repair report exported.");

}

 

function exportJson(analysis) {

  if (!analysis) {

    showToast("Analyze a case before exporting.");

    return;

  }

 

  const payload = {

    platform: "RepairIQ",

    platformMode: "SXM Repair Intelligence Command Center",

    generatedAt: new Date().toISOString(),

    dataSource: analysis.dataSource,

    intelligenceMode: "Deterministic prototype logic",

    case: analysis,

    control: "Technician approval required",

    hardwareControl: "Not connected",

    disclaimer:

      "This prototype uses deterministic rules and synthetic demonstration data."

  };

 

  downloadFile(

    JSON.stringify(payload, null, 2),

    `${analysis.caseId}.json`,

    "application/json;charset=utf-8"

  );

 

  showToast("Case JSON exported.");

}

 

function downloadFile(content, filename, type) {

  const blob = new Blob([content], { type });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

 

  link.href = url;

  link.download = filename;

 

  document.body.appendChild(link);

  link.click();

  link.remove();

 

  window.setTimeout(() => {

    URL.revokeObjectURL(url);

  }, 100);

}

 

/* ================================================================

   51. CASE AND TRAVELER IDENTIFIERS

   ================================================================ */

 

function createCaseId() {

  const date = new Date();

 

  const stamp = [

    date.getFullYear(),

    String(date.getMonth() + 1).padStart(2, "0"),

    String(date.getDate()).padStart(2, "0")

  ].join("");

 

  const randomNumber = Math.floor(100 + Math.random() * 900);

 

  return `CASE-${stamp}-${randomNumber}`;

}

 

function createTravelerId() {

  const date = new Date();

 

  const stamp = [

    date.getFullYear(),

    String(date.getMonth() + 1).padStart(2, "0"),

    String(date.getDate()).padStart(2, "0")

  ].join("");

 

  const randomNumber = Math.floor(100 + Math.random() * 900);

 

  return `TRAVELER-${stamp}-${randomNumber}`;

}

 

function isDemoLog(logText) {

  const normalized = String(logText || "").toLowerCase();

 

  return (

    normalized.includes("vulcan") ||

    normalized.includes("hmc_bist_fail") ||

    normalized.includes("sxm-tester-04")

  );

}

 

/* ================================================================

   52. TOAST NOTIFICATIONS

   ================================================================ */

 

function showToast(message) {

  const toast = $("#toast");

  const toastMessage = $("#toast-message");

 

  if (!toast || !toastMessage) {

    return;

  }

 

  toastMessage.textContent = message;

  toast.classList.add("show");

 

  window.clearTimeout(state.toastTimer);

 

  state.toastTimer = window.setTimeout(() => {

    toast.classList.remove("show");

  }, 3000);

}
/* ================================================================
   50. VERSION 0.6 TOPOLOGY, KNOWLEDGE ENGINE, REX + VERIFICATION
   ---------------------------------------------------------------
   This extension completes the contracts declared by the v0.6
   HTML/CSS. All conclusions remain deterministic prototype output.
   ================================================================ */

const RETEST_STORAGE_KEY = "repairiq-retest-workflows-v1";
const REX_MEMORY_STORAGE_KEY = "repairiq-rex-memory-v1";
const RETEST_STEPS = ["action", "ready", "result", "verify", "close"];

const REX_PERSONA = Object.freeze({
  name: "R.E.X.",
  role: "Repair Engineer Xpert",
  principle: "Evidence before replacement. Testing before assumptions. Root cause before closure.",
  voice: "calm, precise, practical, direct, humble, safety-minded",
  memoryNotice: "Local browser case memory only"
});

function initializeExtensionMount() {
  const mount = $("#diagnostic-extension-mount");
  if (!mount || mount.dataset.rexEventsBound === "true") return;
  mount.dataset.rexEventsBound = "true";

  mount.addEventListener("click", event => {
    const chip = event.target.closest("[data-rex-query]");
    if (chip) {
      sendREXQuery(chip.dataset.rexQuery || chip.textContent.trim());
      return;
    }
    if (event.target.closest("#rex-send-button")) sendREXQuery();
  });

  mount.addEventListener("submit", event => {
    if (event.target.id === "rex-query-form") {
      event.preventDefault();
      sendREXQuery();
    }
  });

  mount.addEventListener("keydown", event => {
    if (event.target.id === "rex-query-input" && event.key === "Enter") {
      event.preventDefault();
      sendREXQuery();
    }
  });
}

function renderTopology() {
  const mount = $("#gpu-topology");
  const source = $("#gpu-topology-data");
  if (!mount || !source) return;

  try {
    const platform = JSON.parse(source.textContent || "{}");
    const components = Array.isArray(platform.components) ? platform.components : [];
    state.topology = platform;

    if (!components.length) throw new Error("Topology data contains no components.");

    mount.innerHTML = components.map(component => {
      const id = String(component.componentId || "Unknown");
      const health = ["healthy", "critical", "warning", "unknown"].includes(component.healthState)
        ? component.healthState : "unknown";
      const verified = platform.verified === true && component.verificationState === "verified";
      const verification = verified ? "verified" : "unverified";
      const label = String(component.displayName || id);
      const slot = String(component.slot || "Slot not supplied");
      const stage = Array.isArray(component.relatedStageCodes) && component.relatedStageCodes.length
        ? component.relatedStageCodes.join(" · ") : "Stage not supplied";
      const status = health.toUpperCase();
      return `
        <button class="gpu-node ${health}" type="button"
          data-gpu-id="${escapeHtml(id)}" data-health-state="${health}"
          data-verification-state="${verification}" aria-pressed="false"
          aria-label="${escapeHtml(label)}, ${status}, ${escapeHtml(slot)}, demonstration data">
          <span class="gpu-node-title">${escapeHtml(label)}</span>
          <span class="gpu-node-label">${escapeHtml(slot)}</span>
          <span class="gpu-health">● ${status}</span>
          <span class="gpu-load">${component.load == null ? "REVIEW REQUIRED" : `${escapeHtml(String(component.load))}% LOAD`}</span>
          <span class="gpu-node-footer">
            <span class="gpu-node-status">DEMO DATA</span>
            <span class="gpu-node-stage">${escapeHtml(stage)}</span>
          </span>
          <span class="gpu-node-verified">${verified ? "VERIFIED SOURCE" : "NOT VERIFIED"}</span>
        </button>`;
    }).join("");

    mount.setAttribute("aria-busy", "false");
    const platformTitle = $(".topology-platform");
    if (platformTitle) platformTitle.textContent = `${platform.platformName || "HGX demo"} · DEMONSTRATION DATA`;
    updateTopologyCounts();
  } catch (error) {
    mount.innerHTML = `<p role="alert">Topology could not be loaded: ${escapeHtml(error.message)}</p>`;
    mount.setAttribute("aria-busy", "false");
    showToast("GPU topology data could not be loaded.");
  }
}

function buildKnowledgeOutput(analysis) {
  const evidence = safeArray(analysis.evidence?.supporting || analysis.supportingEvidence)
    .map(item => typeof item === "string" ? item : item.text || item.description || "Evidence recorded.");
  const negative = safeArray(analysis.evidence?.contradicting || analysis.contradictingEvidence)
    .map(item => typeof item === "string" ? item : item.text || item.description || "Limiting evidence recorded.");
  const stage = analysis.failure?.failureStage || analysis.testSession?.failureStage || "Not established";
  const component = analysis.failure?.affectedComponent || analysis.affectedComponent || "component not isolated";
  const pattern = {
    title: analysis.failure?.title || analysis.title || "SXM diagnostic review required",
    category: analysis.failure?.category || analysis.category || "General SXM failure",
    ruleId: analysis.failure?.ruleId || analysis.ruleId || "SXM-GENERAL-000",
    component,
    stage,
    summary: `${analysis.failure?.title || analysis.title || "Review required"}. Current evidence points to ${component}; this is a candidate for technician review, not a confirmed physical defect.`
  };
  const path = [
    { title: "Confirm unit and test-session identity", detail: `Review the unit passport, tester (${analysis.testSession?.tester || analysis.tester || "not identified"}), and available test date before acting.` },
    { title: "Review the primary evidence", detail: evidence[0] || "Review the complete source log and confirm the failure signature." },
    { title: "Perform the approved isolation step", detail: analysis.recommendation || "Use the site-approved diagnostic procedure and document the technician decision." },
    { title: "Run and document the required retest", detail: `${analysis.retest?.stage || stage}: ${analysis.retest?.expectedResult || "required stage passes without recurrence."}` }
  ];
  const checkFirst = [
    `Confirm ${component} identity and physical slot against the unit record.`,
    evidence[0] || "Review the exact failing test line and surrounding log context.",
    "Check connector, seating, and approved configuration evidence before component substitution."
  ];
  const ruleOut = negative.length ? negative : ["No explicit contradictory evidence was identified in the uploaded log; absence of evidence does not rule out a cause."];
  const escalation = [];
  if (String(analysis.severity).toUpperCase() === "CRITICAL") escalation.push({ level: "critical", urgency: "CRITICAL", text: "Pause component replacement decisions until the failure signature and affected path are confirmed by a qualified technician." });
  if (negative.length) escalation.push({ level: "high", urgency: "HIGH", text: "Escalate if the observed evidence conflicts with the leading candidate or if the required stage cannot be reproduced." });
  escalation.push({ level: "medium", urgency: "MEDIUM", text: "Escalate for engineering review if the required retest fails, is inconclusive, or exposes a new fault." });

  const output = {
    pattern,
    path,
    checkFirst,
    ruleOut,
    retest: { stage: analysis.retest?.stage || stage, expected: analysis.retest?.expectedResult || "Required stage passes without recurrence." },
    escalation,
    provenance: {
      ruleId: pattern.ruleId,
      source: analysis.dataSource || "Prototype / Demonstration Data",
      confidence: Number.isFinite(Number(analysis.confidence)) ? `${analysis.confidence}% prototype score` : "Not scored",
      evidence: evidence.length ? evidence : ["No supporting evidence item was produced."],
      generatedAt: new Date().toISOString()
    },
    parts: analysis.partsRequest || {},
    handoff: analysis.handoff || {}
  };
  return output;
}

function renderKEShell(key, eyebrow, heading, body) {
  return `<section class="diagnostic-section" data-ke-section="${escapeHtml(key)}">
    <div class="diagnostic-section-heading"><div><div class="eyebrow">${escapeHtml(eyebrow)}</div><h4>${escapeHtml(heading)}</h4></div></div>
    ${body}
  </section>`;
}

function renderKnowledgeEngine(analysis) {
  const mount = $("#diagnostic-extension-mount");
  if (!mount || !state.knowledgeOutput) return;
  const k = state.knowledgeOutput;
  const escList = items => `<ul class="evidence-list">${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  const pattern = renderKEShell("failure-pattern", "KE · FAILURE PATTERN", k.pattern.title,
    `<div class="ke-finding-summary"><p>${escapeHtml(k.pattern.summary)}</p></div>
     <div class="ke-subsystem-row"><span>Pattern</span><span class="ke-chip">${escapeHtml(k.pattern.category)}</span><span class="ke-chip">${escapeHtml(k.pattern.component)}</span><span class="ke-chip">${escapeHtml(k.pattern.stage)}</span></div>
     <div class="ke-provenance-banner"><span>RULE</span><span>${escapeHtml(k.pattern.ruleId)} · deterministic demo rule · technician review required</span></div>`);
  const path = renderKEShell("repair-path", "KE · STAGE-AWARE PATH", "Recommended review sequence",
    `<div>${k.path.map((step, i) => `<div class="ke-step-item"><div class="ke-step-header"><span class="ke-priority-marker">${i + 1}</span><div class="ke-step-copy"><strong>${escapeHtml(step.title)}</strong><span>${escapeHtml(step.detail)}</span></div></div><div class="ke-step-tags"><span class="ke-tag approval">TECHNICIAN APPROVAL</span>${i === 3 ? '<span class="ke-tag retest">RETEST REQUIRED</span>' : ""}</div></div>`).join("")}</div>`);
  const check = renderKEShell("check-first", "KE · FIRST CHECKS", "What to check first",
    `<div class="ke-evidence-basis">Based on the current structured analysis output.</div>${escList(k.checkFirst)}`);
  const ruleOut = renderKEShell("rule-out", "KE · LIMITING EVIDENCE", "What to rule out or verify",
    `<div class="ke-two-col"><div><strong>Contradicting or limiting signals</strong>${escList(k.ruleOut)}</div><div><strong>Review guardrail</strong><p>Do not treat an absent log signal as proof that a component or path is healthy.</p></div></div>`);
  const retest = renderKEShell("retest-spec", "KE · VERIFICATION", "Required retest specification",
    `<div class="ke-finding-summary"><p><strong>Stage:</strong> ${escapeHtml(k.retest.stage)}<br><strong>Expected:</strong> ${escapeHtml(k.retest.expected)}</p></div><span class="ke-tag retest">RETEST REQUIRED · NOT YET VERIFIED</span>`);
  const escalation = renderKEShell("escalation", "KE · ESCALATION", "Escalation criteria",
    `<div>${k.escalation.map(item => `<div class="ke-escalation-item ${item.level}"><span class="ke-escalation-marker">!</span><div><strong class="ke-escalation-urgency">${escapeHtml(item.urgency)}</strong><span class="ke-escalation-action">${escapeHtml(item.text)}</span></div></div>`).join("")}</div>`);
  const provenance = renderKEShell("ke-provenance", "KE · PROVENANCE", "Rule and evidence provenance",
    `<div class="ke-two-col"><div><strong>Rule and source</strong><p>${escapeHtml(k.provenance.ruleId)}<br>${escapeHtml(k.provenance.source)}</p><strong>Confidence</strong><p>${escapeHtml(k.provenance.confidence)} — not a validated probability.</p></div><div><strong>Evidence used</strong>${escList(k.provenance.evidence)}</div></div><div class="ke-provenance-banner"><span>PROTOTYPE</span><span>Deterministic rules · no production repair database, live hardware, or AI inference connected.</span></div>`);
  const parts = renderKEShell("parts-request", "PLANNING · PARTS", "Parts planning",
    `<div class="ke-two-col"><div><strong>${escapeHtml(k.parts.actionType || "No part recommendation yet")}</strong><p>${escapeHtml(k.parts.description || "No replacement part should be requested from current evidence.")}</p></div><div><strong>Request state</strong><p>${escapeHtml(k.parts.approvalStatus || "Not approved")} · ${escapeHtml(k.parts.warehouseStatus || "Not requested")}</p></div></div><div class="ke-provenance-banner"><span>NO ORDER</span><span>RepairIQ does not order, reserve, or authorize parts.</span></div>`);
  const handoff = renderKEShell("shift-handoff", "HANDOFF · NEXT SHIFT", "Structured shift handoff",
    `<div class="ke-two-col"><div><strong>Current status</strong><p>${escapeHtml(k.handoff.currentStatus || analysis.caseState || "Diagnosis ready")}</p><strong>Next required action</strong><p>${escapeHtml(k.handoff.nextRequiredAction || analysis.recommendation || "Technician review required.")}</p></div><div><strong>Retest requirement</strong><p>${escapeHtml(k.handoff.retestRequirement || k.retest.expected)}</p><strong>Notes</strong><p>${escapeHtml(k.handoff.notes || "Prototype handoff; verify against source records.")}</p></div></div>`);
  mount.querySelectorAll("[data-ke-section]").forEach(node => node.remove());
  mount.insertAdjacentHTML("afterbegin", pattern + path + check + ruleOut + retest + escalation + provenance + parts + handoff);
}

function runKnowledgeEngine(analysis) {
  if (!analysis) return;
  state.knowledgeOutput = buildKnowledgeOutput(analysis);
  renderKnowledgeEngine(analysis);
}

function rexMemoryStoreRead() {
  try {
    const parsed = JSON.parse(localStorage.getItem(REX_MEMORY_STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function rexMemoryStoreWrite(store) {
  try {
    const entries = Object.entries(store || {})
      .sort(([, a], [, b]) => String(b?.updatedAt || "").localeCompare(String(a?.updatedAt || "")))
      .slice(0, 25);
    localStorage.setItem(REX_MEMORY_STORAGE_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    showToast("R.E.X. local memory is unavailable in this browser session.");
  }
}

function getActiveREXCaseId() {
  return String(state.currentAnalysis?.caseId || state.rexCaseId || "unassigned");
}

function buildREXMemorySnapshot() {
  const analysis = state.currentAnalysis;
  const k = state.knowledgeOutput;
  return {
    caseId: getActiveREXCaseId(),
    component: k?.pattern?.component || analysis?.affectedComponent || "No component selected",
    pattern: k?.pattern?.title || analysis?.title || "No active pattern",
    stage: k?.pattern?.stage || analysis?.failure?.failureStage || "Not established",
    ruleId: k?.pattern?.ruleId || "No rule fired",
    errorCode: analysis?.failure?.errorCode || analysis?.errorCode || "Not established",
    recommendation: analysis?.recommendation || k?.path?.[0]?.detail || "No recommendation yet",
    technician: analysis?.technician || "Technician not identified",
    updatedAt: new Date().toISOString()
  };
}

function seedREXMessage() {
  if (!state.knowledgeOutput) {
    return {
      role: "rex",
      text: "I’m R.E.X., your Repair Engineer Xpert. Run an analysis and I’ll stay scoped to the active case, its structured evidence, and the repair history stored in this browser.",
      citation: "R.E.X. prototype · no active case"
    };
  }
  const k = state.knowledgeOutput;
  return {
    role: "rex",
    text: `I’m on the case. I reviewed the structured output for ${k.pattern.component}. My operating rule is simple: evidence before replacement. Ask me what failed, why the pattern leads there, what to check next, what to rule out, how to retest, or whether a similar local case exists.`,
    citation: `${k.provenance.ruleId} · active Knowledge Engine output`
  };
}

function restoreREXForActiveCase({ forceSeed = false } = {}) {
  const caseId = state.currentAnalysis?.caseId || "unassigned";
  state.rexCaseId = caseId;
  const store = rexMemoryStoreRead();
  const saved = store[caseId];
  const savedMessages = Array.isArray(saved?.messages) ? saved.messages : [];
  state.rexMessages = !forceSeed && savedMessages.length
    ? savedMessages.slice(-60)
    : [seedREXMessage()];
  state.rexMemory = saved?.memory || buildREXMemorySnapshot();
}

function persistREXMemory() {
  const caseId = getActiveREXCaseId();
  const store = rexMemoryStoreRead();
  store[caseId] = {
    caseId,
    memory: buildREXMemorySnapshot(),
    messages: state.rexMessages.slice(-60),
    updatedAt: new Date().toISOString()
  };
  state.rexMemory = store[caseId].memory;
  rexMemoryStoreWrite(store);
}

function clearActiveREXMemory() {
  const caseId = getActiveREXCaseId();
  const store = rexMemoryStoreRead();
  delete store[caseId];
  rexMemoryStoreWrite(store);
  state.rexMessages = [seedREXMessage()];
  state.rexMemory = buildREXMemorySnapshot();
  renderREX();
  renderDedicatedREX();
  showToast(`R.E.X. conversation memory cleared for ${caseId}.`);
}

function setREXVisualState(mode = "ready", statusText = "Ready for diagnostic input", resetAfter = 0) {
  const stage = $("#rexAvatarStage");
  const modeLabel = $("#rexModeLabel");
  const status = $("#rexStatusText");
  if (stage) stage.dataset.rexState = mode;
  if (modeLabel) modeLabel.textContent = String(mode).toUpperCase();
  if (status) status.textContent = statusText;
  window.clearTimeout(state.rexVisualTimer);
  if (resetAfter > 0) {
    state.rexVisualTimer = window.setTimeout(() => {
      if (stage) stage.dataset.rexState = "ready";
      if (modeLabel) modeLabel.textContent = "READY";
      if (status) status.textContent = state.knowledgeOutput ? "Case memory active · ready for next question" : "Ready for diagnostic input";
    }, resetAfter);
  }
}

function rexMessageMarkup(message) {
  const isUser = message.role === "user";
  return `
    <div class="rex-message ${isUser ? "user" : "rex"}">
      <span class="rex-avatar ${isUser ? "technician" : ""}">${isUser ? "T" : "RX"}</span>
      <div class="rex-bubble ${isUser ? "user" : "rex"}">
        <div class="rex-bubble-content">${escapeHtml(message.text)}</div>
        ${message.citation ? `<div class="rex-citation">Source: ${escapeHtml(message.citation)} · prototype data</div>` : ""}
      </div>
    </div>`;
}

function rexConversationMarkup() {
  return state.rexMessages.map(rexMessageMarkup).join("");
}

function renderREX({ reset = false } = {}) {
  const mount = $("#diagnostic-extension-mount");
  if (!mount || !state.knowledgeOutput) return;
  if (reset || state.rexCaseId !== String(state.currentAnalysis?.caseId || "unassigned") || !state.rexMessages.length) {
    restoreREXForActiveCase();
  }
  mount.querySelector('[data-ke-section="rex"]')?.remove();
  const messages = rexConversationMarkup();
  const section = `<section class="diagnostic-section" data-ke-section="rex"><div class="rex-panel">
    <div class="diagnostic-section-heading"><div><div class="eyebrow">R.E.X. · REPAIR ENGINEER XPERT</div><h4>Case-aware repair intelligence</h4></div><span class="rex-active-badge"><span class="rex-active-dot"></span>ACTIVE · LOCAL CASE MEMORY</span></div>
    <div class="rex-conversation" id="rex-conversation" aria-live="polite">${messages}</div>
    <div class="rex-quick-queries"><span>QUICK ASK</span><button class="rex-query-chip" type="button" data-rex-query="What is the leading pattern?">Leading pattern</button><button class="rex-query-chip" type="button" data-rex-query="What should I check first?">Check first</button><button class="rex-query-chip" type="button" data-rex-query="What retest is required?">Retest</button><button class="rex-query-chip" type="button" data-rex-query="When should I escalate?">Escalation</button><button class="rex-query-chip" type="button" data-rex-query="What do you remember about this case?">Memory</button></div>
    <form class="rex-input-row" id="rex-query-form"><label class="rex-input-field"><span aria-hidden="true">⌕</span><input id="rex-query-input" type="text" maxlength="240" placeholder="Ask about this analysis..." autocomplete="off" aria-label="Ask R.E.X. about the current analysis"></label><button class="primary-button" id="rex-send-button" type="submit">Ask R.E.X.</button></form>
    <div class="rex-footer-notice">R.E.X. uses this case’s Knowledge Engine output and browser-local case memory. He does not inspect raw logs directly or authorize repairs.</div>
  </div></section>`;
  const provenance = mount.querySelector('[data-ke-section="ke-provenance"]');
  if (provenance) provenance.insertAdjacentHTML("afterend", section);
  else mount.insertAdjacentHTML("beforeend", section);
  const conversation = $("#rex-conversation");
  if (conversation) conversation.scrollTop = conversation.scrollHeight;
}

function getSimilarLocalCases() {
  if (!state.currentAnalysis) return [];
  const current = state.currentAnalysis;
  const currentCode = String(current.failure?.errorCode || current.errorCode || "").toLowerCase();
  const currentComponent = String(current.affectedComponent || current.failure?.affectedComponent || "").toLowerCase();
  return getCases().filter(item => {
    if (item.id === current.caseId) return false;
    const codeMatch = currentCode && String(item.errorCode || "").toLowerCase() === currentCode;
    const componentMatch = currentComponent && String(item.component || "").toLowerCase().includes(currentComponent.split("/")[0].trim());
    return codeMatch || componentMatch;
  }).slice(0, 3);
}

function answerREX(query) {
  const k = state.knowledgeOutput;
  if (!k) {
    return { text: "Run an analysis first. I keep my answers tied to structured case evidence rather than guessing from an empty workspace.", citation: "No active Knowledge Engine output" };
  }
  const q = String(query || "").toLowerCase();
  const memory = buildREXMemorySnapshot();

  if (/remember|memory|what do you know|case summary/.test(q)) {
    return {
      text: `Here’s what I’m holding for this case:\nCase: ${memory.caseId}\nFocus: ${memory.component}\nPattern: ${memory.pattern}\nStage: ${memory.stage}\nError: ${memory.errorCode}\nRule: ${memory.ruleId}\nConversation: ${Math.floor(state.rexMessages.length / 2)} recorded exchange(s) in this browser.\n\nI treat that as working case memory, not verified production truth.`,
      citation: `${k.pattern.ruleId} · local case memory`
    };
  }

  if (/similar|seen before|previous case|history|prior case/.test(q)) {
    const matches = getSimilarLocalCases();
    if (!matches.length) {
      return { text: "I don’t see a matching prior case in the browser-local prototype history. That means no local match was found — not that this failure has never happened elsewhere.", citation: "Local prototype case history" };
    }
    return {
      text: `I found ${matches.length} related local case${matches.length === 1 ? "" : "s"}:\n${matches.map((item, i) => `${i + 1}. ${item.id} — ${item.issue}; ${item.component}; status ${item.status}; retest ${item.retestResult || "not recorded"}.`).join("\n")}\n\nUse these as context only. I would still prove the current failure from current evidence.`,
      citation: "Local prototype case history"
    };
  }

  if (/who are you|personality|how do you work|your role/.test(q)) {
    return { text: `I’m ${REX_PERSONA.name}, the ${REX_PERSONA.role}. I’m designed to be ${REX_PERSONA.voice}. My rule is: ${REX_PERSONA.principle} I’ll tell you what the evidence supports, what it does not support, and the next lowest-risk confirmation step.`, citation: "R.E.X. persona v0.7" };
  }

  if (/retest|verify|pass|stage/.test(q)) {
    return { text: `Verification path: ${k.retest.stage}. Expected result: ${k.retest.expected}\n\nI will not call the repair complete until a technician records the retest result and the closure gate is satisfied.`, citation: `${k.pattern.ruleId} · retest specification` };
  }
  if (/first|check|inspect|start/.test(q)) {
    return { text: `Start with the lowest-risk checks that can eliminate the most possibilities:\n${k.checkFirst.map((item, i) => `${i + 1}. ${item}`).join("\n")}\n\nDo not replace the reporting component until these checks support that move.`, citation: `${k.pattern.ruleId} · check-first output` };
  }
  if (/escalat|stop|risk|when/.test(q)) {
    return { text: `Escalation triggers:\n${k.escalation.map(item => `${item.urgency}: ${item.text}`).join("\n")}\n\nIf new evidence conflicts with the current theory, change the theory — not the evidence.`, citation: `${k.pattern.ruleId} · escalation criteria` };
  }
  if (/rule out|contradict|negative|exclude/.test(q)) {
    return { text: `Before locking onto the leading cause, verify these limiting signals:\n${k.ruleOut.map((item, i) => `${i + 1}. ${item}`).join("\n")}\n\nAn absent signal is not proof of health.`, citation: `${k.pattern.ruleId} · limiting evidence` };
  }
  if (/path|steps|repair|next|action/.test(q)) {
    return { text: `Recommended path:\n${k.path.map((step, i) => `${i + 1}. ${step.title} — ${step.detail}`).join("\n")}\n\nThe technician remains the decision authority at every physical repair step.`, citation: `${k.pattern.ruleId} · stage-aware repair path` };
  }
  if (/evidence|source|confidence|rule|why|reason/.test(q)) {
    return { text: `Why I’m leaning this way:\n${k.pattern.summary}\n\nEvidence used: ${k.provenance.evidence.join("; ")}\nConfidence label: ${k.provenance.confidence}.\n\nThat confidence is a prototype score, not a validated probability.`, citation: `${k.provenance.ruleId} · provenance` };
  }
  return { text: `My current read is ${k.pattern.title} (${k.pattern.category}) focused on ${k.pattern.component}. I can walk you through the evidence, first checks, repair path, limiting evidence, retest, escalation criteria, or the local case memory.`, citation: `${k.pattern.ruleId} · failure-pattern output` };
}

function renderDedicatedREX() {
  const target = $("#rex-chat-messages");
  if (!target) return;
  if (!state.rexMessages.length || state.rexCaseId !== String(state.currentAnalysis?.caseId || "unassigned")) {
    restoreREXForActiveCase();
  }
  target.innerHTML = rexConversationMarkup();
  target.scrollTop = target.scrollHeight;

  const caseId = state.currentAnalysis?.caseId || "No active analysis";
  const component = state.knowledgeOutput?.pattern?.component || "No component selected";
  setText("#rexChatScope", state.currentAnalysis ? `${caseId} · ${component}` : "No active analysis");
  setText("#rexMemoryCase", state.currentAnalysis ? caseId : "Awaiting analysis");
  setText("#rexMemoryFocus", component);
  const exchanges = Math.max(0, Math.floor((state.rexMessages.length - 1) / 2));
  setText("#rexMemoryCount", `${exchanges} exchange${exchanges === 1 ? "" : "s"}`);

  if (state.knowledgeOutput) {
    setREXVisualState("ready", "Case memory active · ready for next question");
  } else {
    setREXVisualState("ready", "Run an analysis to activate case intelligence");
  }
}

function initializeDedicatedREX() {
  const view = $("#rex-view");
  if (!view || view.dataset.rexEventsBound === "true") return;
  view.dataset.rexEventsBound = "true";

  view.addEventListener("click", event => {
    const chip = event.target.closest("[data-rex-query]");
    if (chip) {
      sendREXQuery(chip.dataset.rexQuery || chip.textContent.trim(), "dedicated");
      return;
    }
    if (event.target.closest("#rex-clear-memory")) clearActiveREXMemory();
  });

  addListener("#rex-dedicated-form", "submit", event => {
    event.preventDefault();
    sendREXQuery("", "dedicated");
  });

  const avatar = $("#rex-avatar-image");
  avatar?.addEventListener("error", () => {
    avatar.hidden = true;
    const fallback = $("#rex-avatar-fallback");
    if (fallback) fallback.hidden = false;
  }, { once: true });
}

function sendREXQuery(query = "", source = "embedded") {
  const embeddedInput = $("#rex-query-input");
  const dedicatedInput = $("#rex-dedicated-input");
  const activeInput = source === "dedicated" ? dedicatedInput : embeddedInput;
  const question = String(query || activeInput?.value || dedicatedInput?.value || embeddedInput?.value || "").trim();
  if (!question) { activeInput?.focus(); return; }
  if (!state.knowledgeOutput) {
    setREXVisualState("ready", "Analysis required before case-specific reasoning", 1800);
    showToast("Run an analysis before asking R.E.X. a case-specific question.");
    return;
  }

  setREXVisualState(/remember|history|similar/i.test(question) ? "remembering" : "analyzing", "Reviewing structured case evidence…");
  state.rexMessages.push({ role: "user", text: question, createdAt: new Date().toISOString() });
  const answer = answerREX(question);
  state.rexMessages.push({ role: "rex", text: answer.text, citation: answer.citation, createdAt: new Date().toISOString() });
  persistREXMemory();

  if (embeddedInput) embeddedInput.value = "";
  if (dedicatedInput) dedicatedInput.value = "";
  renderREX();
  renderDedicatedREX();
  setREXVisualState("speaking", "Response grounded in active case evidence", 1200);
}

function initializeRetestWorkflow() {
  addListener("#open-retest-workflow-button", "click", () => {
    const section = $("#retest-verification");
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  addListener("#record-technician-action-button", "click", recordTechnicianAction);
  addListener("#prepare-retest-button", "click", prepareRequiredRetest);
  addListener("#record-retest-result-button", "click", recordRequiredRetestResult);
  addListener("#verify-repair-button", "click", verifyRepairOutcome);
  addListener("#reject-verification-button", "click", rejectRepairVerification);
  addListener("#close-case-button", "click", closeVerifiedCase);

  const upload = $("#retest-file-input");
  const zone = $("#retest-upload-zone");
  if (upload && zone) {
    zone.addEventListener("click", () => upload.click());
    zone.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); upload.click(); }
    });
    upload.addEventListener("change", async event => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) { showToast("Retest evidence must be 2 MB or smaller."); return; }
      try {
        const text = await file.text();
        $("#verification-retest-evidence").value = text.slice(0, 100000);
        zone.setAttribute("aria-pressed", "true");
        zone.querySelector("strong").textContent = file.name;
        showToast("Retest evidence loaded locally. Record the result to save it.");
      } catch { showToast("The selected retest evidence file could not be read."); }
    });
  }
  ["#technician-action-description", "#verification-technician", "#verification-rationale-input"].forEach(selector => {
    addListener(selector, "input", updateRetestWorkflowUI);
  });
  addListener("#verification-retest-result", "change", updateRetestWorkflowUI);
}

function workflowStoreRead() {
  try { return JSON.parse(localStorage.getItem(RETEST_STORAGE_KEY) || "{}"); }
  catch { return {}; }
}

function workflowStoreWrite(workflow) {
  try {
    const store = workflowStoreRead();
    store[workflow.caseId || "unassigned"] = workflow;
    localStorage.setItem(RETEST_STORAGE_KEY, JSON.stringify(store));
  } catch { showToast("Browser storage is unavailable; workflow changes may not persist after closing this page."); }
}

function newRetestWorkflow(caseId = "unassigned") {
  return { caseId, actionRecorded: false, action: null, retestReady: false, retest: null, resultRecorded: false, verification: "PENDING", rationale: "", verified: false, escalated: false, closed: false, updatedAt: new Date().toISOString() };
}

function restoreRetestWorkflow() {
  const records = workflowStoreRead();
  const latest = Object.values(records).sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))).at(0);
  state.retestWorkflow = latest || newRetestWorkflow();
  populateRetestInputs(state.retestWorkflow);
  updateRetestWorkflowUI();
}

function resetRetestWorkflowForAnalysis(analysis) {
  if (!analysis) return;
  const records = workflowStoreRead();
  state.retestWorkflow = records[analysis.caseId] || newRetestWorkflow(analysis.caseId);
  const workflow = state.retestWorkflow;
  if (!workflow.retest) workflow.retest = {};
  const stage = String(analysis.retest?.stage || "INIT").match(/\b(INIT|FLT|FLB|FCT|DCC|RIN)\b/i)?.[1]?.toUpperCase() || "INIT";
  if (!workflow.retest.stage) workflow.retest.stage = stage;
  if (!workflow.retest.tester) workflow.retest.tester = analysis.tester === "Tester not identified" ? "" : analysis.tester;
  if (!workflow.retest.startedAt) workflow.retest.startedAt = toLocalDateTimeValue(new Date());
  populateRetestInputs(workflow);
  updateRetestWorkflowUI();
}

function toLocalDateTimeValue(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

function populateRetestInputs(workflow) {
  const put = (id, value) => { const el = $(id); if (el && value != null) el.value = value; };
  put("#technician-action-description", workflow.action?.description || "");
  put("#verification-technician", workflow.action?.technician || state.currentAnalysis?.technician || "");
  put("#technician-action-timestamp", workflow.action?.timestamp || "");
  put("#verification-retest-stage", workflow.retest?.stage || "INIT");
  put("#verification-retest-tester", workflow.retest?.tester || "");
  put("#verification-retest-session-id", workflow.retest?.sessionId || "");
  put("#verification-retest-started-at", workflow.retest?.startedAt || "");
  put("#verification-retest-result", workflow.retest?.result || "NOT RUN");
  put("#verification-retest-completed-at", workflow.retest?.completedAt || "");
  put("#verification-retest-evidence", workflow.retest?.evidence || "");
  put("#verification-rationale-input", workflow.rationale || "");
}

function persistRetestWorkflow() {
  if (!state.retestWorkflow) return;
  state.retestWorkflow.updatedAt = new Date().toISOString();
  workflowStoreWrite(state.retestWorkflow);
}

function recordTechnicianAction() {
  if (!state.currentAnalysis) { showToast("Analyze a case before recording a repair action."); return; }
  const description = getInputValue("#technician-action-description");
  const technician = getInputValue("#verification-technician");
  if (!description || !technician) { showToast("Enter the action performed and technician name."); return; }
  const timestamp = $("#technician-action-timestamp");
  if (timestamp && !timestamp.value) timestamp.value = toLocalDateTimeValue(new Date());
  const workflow = state.retestWorkflow || newRetestWorkflow(state.currentAnalysis.caseId);
  workflow.action = { description, technician, timestamp: timestamp?.value || "" };
  workflow.actionRecorded = true;
  workflow.retestReady = false;
  workflow.resultRecorded = false;
  workflow.verified = false;
  workflow.closed = false;
  workflow.escalated = false;
  state.retestWorkflow = workflow;
  persistRetestWorkflow();
  updateRetestWorkflowUI();
  saveAnalyzedCase("In Progress", `Technician action recorded: ${description}`);
  showToast("Technician action recorded. Prepare the required retest.");
}

function prepareRequiredRetest() {
  const workflow = state.retestWorkflow;
  if (!workflow?.actionRecorded) { showToast("Record the technician action before preparing a retest."); return; }
  const tester = getInputValue("#verification-retest-tester");
  if (!tester) { showToast("Enter the tester ID before preparing the retest."); return; }
  const session = $("#verification-retest-session-id");
  const started = $("#verification-retest-started-at");
  if (session && !session.value) session.value = `RETEST-${Date.now().toString(36).toUpperCase()}`;
  if (started && !started.value) started.value = toLocalDateTimeValue(new Date());
  workflow.retest = { ...(workflow.retest || {}), stage: getInputValue("#verification-retest-stage") || "INIT", tester, sessionId: session?.value || "", startedAt: started?.value || "", result: "NOT RUN", completedAt: "", evidence: "" };
  workflow.retestReady = true;
  workflow.resultRecorded = false;
  workflow.verified = false;
  workflow.closed = false;
  state.retestWorkflow = workflow;
  persistRetestWorkflow();
  updateRetestWorkflowUI();
  showToast("Retest prepared. Run it on the approved tester and record the observed result.");
}

function recordRequiredRetestResult() {
  const workflow = state.retestWorkflow;
  if (!workflow?.retestReady) { showToast("Prepare the retest before recording a result."); return; }
  const result = getInputValue("#verification-retest-result");
  if (!["PASSED", "FAILED", "INCONCLUSIVE"].includes(result)) { showToast("Select Passed, Failed, or Inconclusive."); return; }
  const completed = $("#verification-retest-completed-at");
  if (completed && !completed.value) completed.value = toLocalDateTimeValue(new Date());
  workflow.retest = { ...workflow.retest, result, completedAt: completed?.value || "", evidence: getInputValue("#verification-retest-evidence") };
  workflow.resultRecorded = true;
  workflow.verified = false;
  workflow.closed = false;
  workflow.verification = result === "PASSED" ? "READY FOR TECHNICIAN VERIFICATION" : "FAILED / ESCALATION REQUIRED";
  state.retestWorkflow = workflow;
  persistRetestWorkflow();
  updateRetestWorkflowUI();
  saveAnalyzedCase(result === "PASSED" ? "Retest Passed" : "Escalated", `Retest ${result.toLowerCase()} at ${workflow.retest.stage}.`);
  showToast(result === "PASSED" ? "Passing retest recorded. Technician verification is still required." : "Retest result recorded. Case cannot be closed.");
}

function verifyRepairOutcome() {
  const workflow = state.retestWorkflow;
  const rationale = getInputValue("#verification-rationale-input");
  if (!workflow?.resultRecorded || workflow.retest?.result !== "PASSED") { showToast("A passing required-stage retest is needed before verification."); return; }
  if (rationale.length < 8) { showToast("Enter a verification rationale of at least 8 characters."); return; }
  workflow.rationale = rationale;
  workflow.verified = true;
  workflow.escalated = false;
  workflow.verification = "VERIFIED BY TECHNICIAN";
  state.retestWorkflow = workflow;
  persistRetestWorkflow();
  updateRetestWorkflowUI();
  saveAnalyzedCase("Verified", `Technician verified the repair: ${rationale}`);
  showToast("Technician verification recorded. The closure gate is ready.");
}

function rejectRepairVerification() {
  const workflow = state.retestWorkflow;
  const rationale = getInputValue("#verification-rationale-input");
  if (!workflow?.resultRecorded) { showToast("Record a retest result before rejecting verification."); return; }
  if (rationale.length < 8) { showToast("Enter a reason of at least 8 characters to escalate."); return; }
  workflow.rationale = rationale;
  workflow.verified = false;
  workflow.escalated = true;
  workflow.closed = false;
  workflow.verification = "REJECTED / ESCALATED";
  state.retestWorkflow = workflow;
  persistRetestWorkflow();
  updateRetestWorkflowUI();
  saveAnalyzedCase("Escalated", rationale);
  showToast("Verification rejected and escalated for review.");
}

function closeVerifiedCase() {
  const workflow = state.retestWorkflow;
  if (!workflow?.verified || workflow.retest?.result !== "PASSED") { showToast("Case closure is blocked until a passing retest and technician verification are recorded."); return; }
  workflow.closed = true;
  state.retestWorkflow = workflow;
  persistRetestWorkflow();
  updateRetestWorkflowUI();
  saveAnalyzedCase("Closed", "Case closed after passing retest and technician verification.");
  if (state.currentAnalysis) state.currentAnalysis.caseState = "CLOSED";
  setText("#active-case-state", "CLOSED");
  showToast("Case closed after verification.");
}

function updateRetestWorkflowUI() {
  const w = state.retestWorkflow || newRetestWorkflow();
  const action = Boolean(w.actionRecorded);
  const ready = Boolean(w.retestReady);
  const result = Boolean(w.resultRecorded);
  const verified = Boolean(w.verified);
  const closed = Boolean(w.closed);
  const current = closed ? "close" : !action ? "action" : !ready ? "ready" : !result ? "result" : !verified ? "verify" : "close";
  const stepIndex = RETEST_STEPS.indexOf(current);
  $$("[data-retest-step]").forEach(el => {
    const index = RETEST_STEPS.indexOf(el.dataset.retestStep);
    el.classList.toggle("complete", closed || index < stepIndex || (verified && el.dataset.retestStep === "verify"));
    el.classList.toggle("active", el.dataset.retestStep === current && !closed);
    if (el.dataset.retestStep === current && !closed) el.setAttribute("aria-current", "step");
    else el.removeAttribute("aria-current");
  });
  $$(".retest-progress-line").forEach((el, i) => el.classList.toggle("complete", closed || i < stepIndex));
  const cardStates = { action: action ? "COMPLETE" : "READY", ready: ready ? "READY" : action ? "READY" : "LOCKED", result: result ? "COMPLETE" : ready ? "READY" : "LOCKED", verify: verified ? "COMPLETE" : result ? "READY" : "LOCKED" };
  Object.entries(cardStates).forEach(([step, label]) => {
    const el = $(`[data-retest-card="${step}"] .workflow-card-state`);
    if (el) { el.textContent = label; el.className = `workflow-card-state ${label === "COMPLETE" ? "complete" : label === "READY" ? "ready" : "locked"}`; }
  });
  const setDisabled = (id, disabled) => { const el = $(id); if (el) el.disabled = disabled; };
  setDisabled("#prepare-retest-button", !action || ready || closed);
  setDisabled("#record-retest-result-button", !ready || result || closed);
  const passed = result && w.retest?.result === "PASSED";
  const rationale = getInputValue("#verification-rationale-input");
  setDisabled("#verify-repair-button", !passed || verified || rationale.length < 8 || closed);
  setDisabled("#reject-verification-button", !result || verified || closed || rationale.length < 8);
  setDisabled("#close-case-button", !verified || w.retest?.result !== "PASSED" || closed);
  setText("#technician-action-state", action ? "COMPLETE" : "READY");
  setText("#retest-ready-state", ready ? "READY" : action ? "READY" : "LOCKED");
  setText("#retest-result-state", result ? w.retest?.result || "RECORDED" : ready ? "READY" : "LOCKED");
  setText("#repair-verification-state", verified ? "VERIFIED" : result ? "REVIEW" : "LOCKED");
  setText("#verification-retest-status", closed ? "CLOSED" : ready ? "RETEST READY" : action ? "ACTION RECORDED" : "NOT READY");
  setText("#verification-retest-status-display", w.retest?.result || "NOT RUN");
  setText("#verification-status", w.verification || "PENDING");
  setText("#verification-decision", w.verification || "PENDING");
  setText("#verification-rationale", w.rationale || (passed ? "Passing retest recorded; technician rationale is required." : "A passing required-stage retest is needed before verification."));
  setText("#verification-closure-status", verified && passed ? "TRUE" : "FALSE");
  setText("#diagnostic-verification-status", w.verification || "PENDING");
  setText("#diagnostic-closure-status", verified && passed ? "TRUE" : "FALSE");
  setText("#closure-eligibility-status", verified && passed ? "ELIGIBLE" : "BLOCKED");
  setText("#closure-gate-title", closed ? "Case closed" : verified && passed ? "Closure eligible" : "Closure blocked");
  setText("#closure-gate-message", closed ? "This prototype case was closed after a documented passing retest and technician verification." : verified && passed ? "Required retest passed and technician verification is recorded. The technician may close this case." : "Record the technician action, prepare the required retest, capture a passing result, and verify the repair before closure.");
  const gate = $("#closure-gate");
  if (gate) { gate.dataset.closureEligible = String(verified && passed); gate.dataset.closureState = closed ? "closed" : verified && passed ? "eligible" : "open"; }
  setText("#retest-status", ready ? "RETEST READY" : "NOT READY");
  setText("#retest-result", w.retest?.result || "NOT RUN");
  setText("#retest-stage", w.retest?.stage || state.currentAnalysis?.retest?.stage || "Not defined");
  setText("#retest-condition", state.currentAnalysis?.retest?.expectedResult || "Required stage passes without recurrence.");
  setText("#retest-requirement-message", passed ? "Passing retest recorded. Technician verification and case closure remain separate steps." : "A diagnostic recommendation cannot be considered verified until the required retest is documented.");
}

function initializePassportActions() {
  addListener("#passport-view-history-button", "click", () => openComponentHistoryModal(state.currentAnalysis?.affectedComponent || state.activeComponent));
  addListener("#passport-export-button", "click", () => exportPassport());
  addListener("#genealogy-export-button", "click", () => exportGenealogy());
  addListener("#stage-export-button", "click", () => exportTestStages());
  addListener("#topology-export-button", "click", () => exportTopology());
}

function updatePassportFromAnalysis(analysis) {
  if (!analysis) return;
  setText("#diagnostic-unit-serial-passport", analysis.unit?.unitSerialNumber || "Not supplied");
  setText("#diagnostic-system-serial-passport", analysis.unit?.systemSerialNumber || "Not supplied");
  const stages = analysis.testSession?.stages || {};
  ["init", "flt", "flb", "fct", "dcc", "rin"].forEach(code => {
    const stage = code.toUpperCase();
    const value = stages[stage] || "NOT RUN";
    setText(`#passport-stage-result-${code}`, value);
    setText(`#passport-stage-status-${code}`, value === "PASS" ? "PASSED" : value === "FAIL" ? "FAILED" : value);
    const card = $(`#passport-stage-card-${code}`);
    if (card) {
      card.dataset.stageState = value === "PASS" ? "passed" : value === "FAIL" ? "failed" : "not-run";
      card.classList.remove("passed", "failed", "not-reached", "retest-required");
      card.classList.add(value === "PASS" ? "passed" : value === "FAIL" ? "failed" : "not-reached");
    }
  });
  const cards = $$(".genealogy-component-card");
  cards.forEach(card => {
    const label = card.querySelector(".genealogy-node-copy span")?.textContent || "";
    const match = label.match(/GPU\s*(\d)/i);
    if (!match) return;
    const id = `GPU${match[1]}`;
    const isAffected = id === analysis.affectedComponent;
    const stateLabel = isAffected ? String(analysis.severity || "REVIEW").toUpperCase() : "DEMO / NOT VERIFIED";
    const health = card.querySelector(".genealogy-health");
    if (health) { health.textContent = stateLabel; health.classList.toggle("critical", isAffected && String(analysis.severity).toUpperCase() === "CRITICAL"); }
    card.classList.toggle("critical", isAffected && String(analysis.severity).toUpperCase() === "CRITICAL");
  });
}

function passportRecord() {
  const a = state.currentAnalysis;
  return { recordType: "RepairIQ Unit Digital Passport — Prototype", verified: false, caseId: a?.caseId || null, travelerId: a?.travelerId || null, unit: a?.unit || null, product: a?.product || null, affectedComponent: a?.affectedComponent || null, testSession: a?.testSession || null, dataSource: a?.dataSource || "Prototype / Demonstration Data", generatedAt: new Date().toISOString() };
}
function exportPassport() { downloadFile(JSON.stringify(passportRecord(), null, 2), `repairiq-passport-${state.currentAnalysis?.caseId || "demo"}.json`, "application/json"); }
function exportGenealogy() { const record = passportRecord(); record.genealogy = { verified: false, platformId: state.topology?.platformId || "DEMO", components: safeArray(state.topology?.components).map(x => ({ componentId: x.componentId, displayName: x.displayName, slot: x.slot, healthState: x.healthState, verificationState: "unverified" })) }; downloadFile(JSON.stringify(record, null, 2), `repairiq-genealogy-${state.currentAnalysis?.caseId || "demo"}.json`, "application/json"); }
function exportTestStages() { const a = state.currentAnalysis; downloadFile(JSON.stringify({ caseId: a?.caseId || null, failureStage: a?.testSession?.failureStage || "Not established", stages: a?.testSession?.stages || {}, dataSource: a?.dataSource || "Prototype / Demonstration Data", verified: false }, null, 2), `repairiq-test-stages-${a?.caseId || "demo"}.json`, "application/json"); }
function exportTopology() { const t = state.topology || {}; downloadFile(JSON.stringify({ ...t, verified: false, components: safeArray(t.components).map(x => ({ ...x, verificationState: "unverified" })) }, null, 2), `repairiq-topology-${t.platformId || "demo"}.json`, "application/json"); }