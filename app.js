/* =========================================================
   REPAIRIQ V0.3
   SXM REPAIR COMMAND CENTER
   AI REPAIR INTELLIGENCE PROTOTYPE

   Frontend-only demonstration.

   IMPORTANT:
   RepairIQ uses deterministic rules and synthetic
   demonstration data in this prototype.

   It does not represent:
   - A production AI model
   - An official NVIDIA product or service
   - A production repair authorization system
   - Automated hardware replacement authority

   RepairIQ provides technician decision support only.
   Consequential repair actions require qualified human
   review and approval.
========================================================= */


/* =========================================================
   DEMONSTRATION LOG
========================================================= */

const DEMO_LOG = `
HGX TEST EXECUTION REPORT
Product: HGX H100 8-GPU
Configuration: 8x SXM GPU / HMC / NVSwitch
Tester: HGX-TESTER-04
Test Date: 2026-09-18

[PASS] GPU0 detected.
[PASS] GPU1 detected.
[PASS] GPU2 detected.
[PASS] GPU3 detected.
[PASS] GPU4 detected.
[PASS] GPU5 detected.
[PASS] GPU6 detected.

[FAIL] GPU7_b6_00.0_SXM2:
MLE_GPU_AVG exceeds failure specification.

Limit_Fail: 92.00
Adjusted_Value: 92.20
Original_Value: 84.28
Applied offset before calculation: 7.92

[FAIL] GPU7 did not receive heartbeat.
[FAIL] GPU7 power is below specified limit.

[WARN] NVLink retry observed on GPU7.

[PASS] NVSwitch detected.
[PASS] HMC communication established.

[INFO] Firmware package: HGX_FW_3.7.1
[PASS] Firmware compatibility check completed.

[INFO] Test execution completed with failures.
`;


/* =========================================================
   DEFAULT CASE HISTORY
========================================================= */

const DEFAULT_CASES = [

  {
    id: "CASE-2026-0918-001",
    product: "HGX H100 8-GPU",
    issue: "GPU7 MLE threshold failure",
    component: "GPU7",
    recommendation: "Reseat and retest",
    status: "Pending",
    decisionNotes: "",
    timestamp: "Today, 09:42"
  },

  {
    id: "CASE-2026-0917-014",
    product: "HGX H100 8-GPU",
    issue: "PCIe link-width failure",
    component: "GPU3 / Slot B3",
    recommendation: "Verify seating and isolate slot",
    status: "Completed",
    decisionNotes: "",
    timestamp: "Yesterday, 16:18"
  },

  {
    id: "CASE-2026-0917-009",
    product: "HGX H100 8-GPU",
    issue: "Tester timeout",
    component: "Tester-02",
    recommendation: "Validate tester state",
    status: "Escalated",
    decisionNotes: "",
    timestamp: "Yesterday, 11:07"
  }

];


/* =========================================================
   RULESET
========================================================= */

const RULESET = {

  gpuThreshold: {
    id: "HGX-GPU-001",
    name: "GPU MLE / Thermal Threshold"
  },

  heartbeat: {
    id: "HGX-GPU-002",
    name: "GPU Heartbeat Failure"
  },

  power: {
    id: "HGX-GPU-003",
    name: "GPU Power Failure"
  },

  pcie: {
    id: "HGX-PCI-002",
    name: "PCIe Link Width Failure"
  },

  firmware: {
    id: "HGX-FW-003",
    name: "Firmware Compatibility"
  },

  tester: {
    id: "HGX-TST-004",
    name: "Tester Timeout"
  }

};


/* =========================================================
   APPLICATION STATE
========================================================= */

let currentLog = "";
let currentAnalysis = null;
let toastTimer = null;


/* =========================================================
   DOM HELPERS
========================================================= */

/*
   $()
   ----
   Returns the first matching DOM element.

   The helper safely returns null if an element does
   not exist. This makes the prototype more resilient
   while individual views are being developed.
*/

const $ = selector =>
  document.querySelector(selector);


/*
   $$()
   -----
   Returns all matching DOM elements as an array.

   Converting the NodeList to an array makes the result
   easier to work with using forEach/map/filter.
*/

const $$ = selector =>
  Array.from(document.querySelectorAll(selector));


/*
   setText()
   ---------
   Safely updates an element's text content.
*/

function setText(selector, value) {

  const element = $(selector);

  if (!element) return;

  element.textContent = value;

}


/*
   addListener()
   -------------
   Safely attaches an event listener.

   This prevents one missing optional UI element from
   stopping the rest of RepairIQ from initializing.
*/

function addListener(
  selector,
  eventName,
  handler
) {

  const element = $(selector);

  if (!element) return;

  element.addEventListener(
    eventName,
    handler
  );

}


/* =========================================================
   START APPLICATION
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    initializeNavigation();
    initializeAnalyzer();
    initializeCaseHistory();
    initializeButtons();
    initializeDecisionModal();
    initializeTheme();

    renderActivity();
    renderCases();

  }
);


/* =========================================================
   NAVIGATION
========================================================= */

function initializeNavigation() {

  $$(".nav-item").forEach(button => {

    button.addEventListener(
      "click",
      () => {

        switchView(
          button.dataset.view
        );

      }
    );

  });


  $$("[data-view-target]").forEach(button => {

    button.addEventListener(
      "click",
      () => {

        switchView(
          button.dataset.viewTarget
        );

      }
    );

  });

}


function switchView(viewName) {

  $$(".nav-item").forEach(button => {

    button.classList.toggle(
      "active",
      button.dataset.view === viewName
    );

  });


  $$(".view").forEach(view => {

    view.classList.remove(
      "active"
    );

  });


  const target =
    $(`#${viewName}-view`);


  if (target) {

    target.classList.add(
      "active"
    );

  }


  const titles = {

    dashboard:
      "Repair Operations Dashboard",

    analyzer:
      "HGX Log Analyzer",

    cases:
      "Case History",

    knowledge:
      "HGX Knowledge Base",

    metrics:
      "Pilot Performance Metrics"

  };


  setText(
    "#page-title",
    titles[viewName] || "RepairIQ"
  );

}


/* =========================================================
   ANALYZER INITIALIZATION
========================================================= */

function initializeAnalyzer() {

  const fileInput =
    $("#file-input");

  const dropZone =
    $("#drop-zone");


  /*
     File upload controls are optional while the
     interface is being developed. Exit safely if
     the analyzer markup is not present.
  */

  if (!fileInput || !dropZone) {
    return;
  }


  dropZone.addEventListener(
    "click",
    () => fileInput.click()
  );


  dropZone.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter" ||
        event.key === " "
      ) {

        event.preventDefault();

        fileInput.click();

      }

    }
  );


  fileInput.addEventListener(
    "change",
    event => {

      const file =
        event.target.files?.[0];

      if (!file) return;

      readFile(file);

    }
  );


  ["dragenter", "dragover"]
    .forEach(eventName => {

      dropZone.addEventListener(
        eventName,
        event => {

          event.preventDefault();

          dropZone.classList.add(
            "dragging"
          );

        }
      );

    });


  ["dragleave", "drop"]
    .forEach(eventName => {

      dropZone.addEventListener(
        eventName,
        event => {

          event.preventDefault();

          dropZone.classList.remove(
            "dragging"
          );

        }
      );

    });


  dropZone.addEventListener(
    "drop",
    event => {

      const file =
        event.dataTransfer?.files?.[0];

      if (!file) return;

      readFile(file);

    }
  );


  addListener(
    "#demo-log-button",
    "click",
    loadDemoCase
  );


  addListener(
    "#analyze-button",
    "click",
    () => {

      if (!currentLog) {

        showToast(
          "Load a test log first."
        );

        return;

      }

      runAnalysis();

    }
  );

}


/* =========================================================
   FILE READER
========================================================= */

function readFile(file) {

  const reader =
    new FileReader();


  reader.onload =
    event => {

      loadLog(
        String(
          event.target?.result || ""
        ),
        file.name
      );

    };


  reader.onerror =
    () => {

      showToast(
        "Unable to read the selected log file."
      );

    };


  reader.readAsText(file);

}


/* =========================================================
   DEMO CASE
========================================================= */

function loadDemoCase() {

  setInputValue(
    "#product-model",
    "HGX H100 8-GPU"
  );


  setInputValue(
    "#tester-name",
    "HGX-TESTER-04"
  );


  setInputValue(
    "#technician-name",
    "Repair Technician"
  );


  setInputValue(
    "#technician-notes",
    "Unit failed during GPU thermal/performance testing. Multiple GPU7 symptoms observed."
  );


  loadLog(
    DEMO_LOG,
    "HGX_GPU7_demo.log"
  );


  switchView(
    "analyzer"
  );


  showToast(
    "Synthetic HGX demonstration case loaded."
  );

}


/*
   setInputValue()
   ---------------
   Safely writes to an input or textarea.
*/

function setInputValue(
  selector,
  value
) {

  const element =
    $(selector);

  if (!element) return;

  element.value = value;

}


/* =========================================================
   LOAD LOG
========================================================= */

function loadLog(
  logText,
  fileName = "uploaded-log.txt"
) {

  currentLog =
    String(logText || "");


  const preview =
    $("#log-preview");


  if (preview) {

    preview.textContent =
      currentLog;

  }


  setText(
    "#log-status",
    `${fileName} loaded`
  );


  const status =
    $("#log-status");


  if (status) {

    status.className =
      "status-pill ready";

  }


  showToast(
    "Test log loaded successfully."
  );

}


/* =========================================================
   ANALYSIS PIPELINE
========================================================= */

function runAnalysis() {

  const resultPanel =
    $("#result-panel");


  setText(
    "#log-status",
    "Analyzing log..."
  );


  const status =
    $("#log-status");


  if (status) {

    status.className =
      "status-pill analyzing";

  }


  if (resultPanel) {

    resultPanel.innerHTML = `

      <div class="empty-result">

        <div class="empty-orb">
          ◌
        </div>

        <h3>
          RepairIQ is analyzing the failure
        </h3>

        <p>
          Parsing errors → grouping symptoms →
          calculating evidence → applying HGX rules.
        </p>

      </div>

    `;

  }


  setTimeout(
    () => {

      currentAnalysis =
        analyzeHGXLog(
          currentLog
        );


      renderAnalysis(
        currentAnalysis
      );


      setText(
        "#log-status",
        "Analysis complete"
      );


      const analysisStatus =
        $("#log-status");


      if (analysisStatus) {

        analysisStatus.className =
          "status-pill ready";

      }


      showToast(
        "Analysis complete. Technician review required."
      );

    },
    900
  );

}


/* =========================================================
   HGX ANALYSIS ENGINE
========================================================= */

function analyzeHGXLog(
  logText
) {

  const normalized =
    String(
      logText || ""
    ).toLowerCase();


  /*
     Detect the first GPU referenced by the log.

     For the demonstration case this resolves to GPU7.
  */

  const gpuMatch =
    String(logText || "").match(
      /GPU(\d+)/i
    );


  const affectedGpu =
    gpuMatch
      ? `GPU${gpuMatch[1]}`
      : "Unknown";


  /*
     Parse numerical threshold information when
     available.
  */

  const adjustedMatch =
    String(logText || "").match(
      /Adjusted_Value:\s*([0-9.]+)/i
    );


  const limitMatch =
    String(logText || "").match(
      /Limit_Fail:\s*([0-9.]+)/i
    );


  const adjustedValue =
    adjustedMatch
      ? Number(
          adjustedMatch[1]
        )
      : null;


  const failureLimit =
    limitMatch
      ? Number(
          limitMatch[1]
        )
      : null;


  const difference =
    adjustedValue !== null &&
    failureLimit !== null

      ? Number(
          (
            adjustedValue -
            failureLimit
          ).toFixed(2)
        )

      : null;


  /* -----------------------------------------------
     Rule detection
  ----------------------------------------------- */

  const hasThreshold =
    normalized.includes(
      "mle_gpu_avg"
    ) ||
    normalized.includes(
      "exceeds failure specification"
    ) ||
    normalized.includes(
      "exceeds the specified threshold"
    );


  const hasHeartbeat =
    normalized.includes(
      "heartbeat"
    );


  const hasPower =
    normalized.includes(
      "power is below"
    ) ||
    normalized.includes(
      "power failure"
    );


  const hasPcie =
    normalized.includes(
      "pcie"
    ) &&
    (
      normalized.includes("link") ||
      normalized.includes("width")
    );


  const hasFirmware =
    normalized.includes(
      "firmware"
    ) &&
    (
      normalized.includes("mismatch") ||
      normalized.includes("incompat")
    );


  const hasTester =
    normalized.includes(
      "timeout"
    ) ||
    normalized.includes(
      "tester"
    );


  /* -----------------------------------------------
     Primary rule selection

     Rules are prioritized so the most specific
     detected failure becomes the primary diagnosis.
  ----------------------------------------------- */

  let category =
    "General HGX failure";


  let ruleId =
    "HGX-GENERAL-000";


  let title =
    "HGX diagnostic review required";


  let recommendation =
    "Review the complete log and escalate for technical review.";


  let confidence =
    62;


  if (hasThreshold) {

    category =
      "GPU thermal / performance threshold";


    ruleId =
      RULESET.gpuThreshold.id;


    title =
      `${affectedGpu} MLE threshold failure`;


    if (
      difference !== null &&
      difference < 1
    ) {

      recommendation =
        "Reseat the affected GPU and retest before replacement.";


      confidence =
        94;

    }
    else {

      recommendation =
        "Isolate the affected GPU and prepare for replacement review.";


      confidence =
        91;

    }

  }

  else if (hasPcie) {

    category =
      "PCIe link-width failure";


    ruleId =
      RULESET.pcie.id;


    title =
      "PCIe connectivity failure";


    recommendation =
      "Verify configuration, reseat the device, and isolate the slot.";


    confidence =
      87;

  }

  else if (hasFirmware) {

    category =
      "Firmware compatibility issue";


    ruleId =
      RULESET.firmware.id;


    title =
      "Firmware mismatch detected";


    recommendation =
      "Validate the firmware matrix and obtain authorization before flashing.";


    confidence =
      89;

  }

  else if (hasTester) {

    category =
      "Tester or execution failure";


    ruleId =
      RULESET.tester.id;


    title =
      "Tester-related failure suspected";


    recommendation =
      "Validate tester state, permissions, calibration, and repeatability.";


    confidence =
      81;

  }


  /* -----------------------------------------------
     Supporting evidence
  ----------------------------------------------- */

  const evidence = [];


  if (hasThreshold) {

    evidence.push(
      `MLE_GPU_AVG exceeds the specified threshold on ${affectedGpu}.`
    );

  }


  if (
    adjustedValue !== null &&
    failureLimit !== null
  ) {

    evidence.push(
      `Adjusted value ${adjustedValue.toFixed(2)} exceeds failure limit ${failureLimit.toFixed(2)}.`
    );

  }


  if (hasHeartbeat) {

    evidence.push(
      `${affectedGpu} did not receive heartbeat.`
    );

  }


  if (hasPower) {

    evidence.push(
      `${affectedGpu} power is below the specified limit.`
    );

  }


  if (hasPcie) {

    evidence.push(
      "PCIe link or width-related failure detected."
    );

  }


  if (hasFirmware) {

    evidence.push(
      "Firmware compatibility or version mismatch detected."
    );

  }


  if (hasTester) {

    evidence.push(
      "Tester timeout or execution instability detected."
    );

  }


  if (!evidence.length) {

    evidence.push(
      "Log requires additional technician review."
    );

  }


  /* -----------------------------------------------
     Recommended repair path
  ----------------------------------------------- */

  const actions =
    buildRecommendedActions({

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

    caseId:
      createCaseId(),


    product:
      getInputValue(
        "#product-model"
      ) || "Unknown product",


    category,

    ruleId,

    title,

    recommendation,

    affectedComponent:
      affectedGpu,

    confidence,

    adjustedValue,

    failureLimit,

    difference,

    evidence,

    actions,


    technician:
      getInputValue(
        "#technician-name"
      ),


    tester:
      getInputValue(
        "#tester-name"
      ),


    notes:
      getInputValue(
        "#technician-notes"
      )

  };

}


/* =========================================================
   INPUT VALUE HELPER
========================================================= */

function getInputValue(
  selector
) {

  const element =
    $(selector);


  if (!element) {
    return "";
  }


  return String(
    element.value || ""
  ).trim();

}


/* =========================================================
   RECOMMENDED ACTION ENGINE
========================================================= */

function buildRecommendedActions(
  data
) {

  /*
     Threshold failures receive the most detailed
     component-isolation workflow.
  */

  if (data.hasThreshold) {

    const actions = [

      `Reseat ${data.affectedGpu}.`,

      "Run the approved HGX retest procedure."

    ];


    if (
      data.difference !== null &&
      data.difference < 1
    ) {

      actions.push(
        `If the failure remains, swap ${data.affectedGpu} with another GPU to determine whether the failure follows the component.`
      );

    }
    else {

      actions.push(
        `Isolate ${data.affectedGpu} and prepare a qualified replacement review.`
      );

    }


    actions.push(
      "If the failure remains in the original slot, evaluate the baseboard or slot."
    );


    return actions;

  }


  /* -----------------------------------------------
     PCIe failure
  ----------------------------------------------- */

  if (data.hasPcie) {

    return [

      "Verify product configuration and expected PCIe topology.",

      "Reseat the affected device.",

      "Retest the unit.",

      "If the failure remains, isolate the card and slot.",

      "Escalate before replacement if the failure does not follow the component."

    ];

  }


  /* -----------------------------------------------
     Firmware failure
  ----------------------------------------------- */

  if (data.hasFirmware) {

    return [

      "Confirm the exact product model and configuration.",

      "Compare installed versions with the approved firmware matrix.",

      "Obtain authorization before any firmware action.",

      "Retest after the approved action.",

      "Document the version and result."

    ];

  }


  /* -----------------------------------------------
     Tester failure
  ----------------------------------------------- */

  if (data.hasTester) {

    return [

      "Verify tester identity and operating status.",

      "Check permissions, calibration, and test-script version.",

      "Repeat the test using an approved tester if available.",

      "Do not replace hardware until tester-related causes are excluded.",

      "Escalate if the failure is not repeatable."

    ];

  }


  /* -----------------------------------------------
     General HGX failure
  ----------------------------------------------- */

  return [

    "Review the complete failure log.",

    "Confirm product identity and configuration.",

    "Use the approved repair guide.",

    "Retest or isolate the suspected component.",

    "Escalate if the root cause remains uncertain."

  ];

}


/* =========================================================
   RESULT RENDERING
========================================================= */

function renderAnalysis(
  analysis
) {

  const resultPanel =
    $("#result-panel");


  if (!resultPanel) {
    return;
  }


  setText(
    "#case-id-label",
    analysis.caseId
  );


  const calculation =

    analysis.adjustedValue !== null &&
    analysis.failureLimit !== null &&
    analysis.difference !== null

      ? `

        <div class="calculation-box">

          <div class="label">
            Decision calculation
          </div>

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


  const evidenceHtml =
    analysis.evidence
      .map(
        item => `

          <div class="evidence-item">

            <span class="evidence-check">
              ✓
            </span>

            <span>
              ${escapeHtml(item)}
            </span>

          </div>

        `
      )
      .join("");


  const actionsHtml =
    analysis.actions
      .map(
        (item, index) => `

          <div class="action-item">

            <span class="action-number">
              ${index + 1}
            </span>

            <span>
              ${escapeHtml(item)}
            </span>

          </div>

        `
      )
      .join("");


  resultPanel.innerHTML = `

    <div class="result-content">

      <div class="result-header">

        <div>

          <div class="eyebrow">
            ${escapeHtml(
              analysis.ruleId
            )}
          </div>

          <h3>
            ${escapeHtml(
              analysis.title
            )}
          </h3>

        </div>

        <div class="confidence-box">

          <strong>
            0%
          </strong>

          <span>
            Evidence score
          </span>

        </div>

      </div>


      <div class="result-summary">

        <div class="label">
          Primary suspected issue
        </div>

        <p>

          ${escapeHtml(
            analysis.category
          )}

          involving

          <strong>
            ${escapeHtml(
              analysis.affectedComponent
            )}
          </strong>.

          Recommended next step:

          <strong>
            ${escapeHtml(
              analysis.actions[0] ||
              analysis.recommendation
            )}
          </strong>

        </p>

      </div>


      ${calculation}


      <div class="subsection-title">
        Supporting evidence
      </div>

      <div class="evidence-list">

        ${evidenceHtml}

      </div>


      <div class="subsection-title">
        Recommended repair path
      </div>

      <div class="action-list">

        ${actionsHtml}

      </div>


      <!--
        HARDWARE MAP

        Provides a visual representation of the
        8-GPU SXM topology and prioritizes the
        affected component.
      -->

      ${renderGpuMap(
        analysis.affectedComponent
      )}


      <!--
        WORKFLOW TIMELINE

        Shows the technician-oriented repair
        decision sequence.
      -->

      ${renderWorkflow()}


      <div class="approval-banner">

        <div>
          ⚠
        </div>

        <div>

          <strong>
            Human approval required
          </strong>

          <span>
            RepairIQ provides a recommendation only.
            A qualified technician or reviewer must
            approve replacement, firmware action,
            destructive testing, escalation, and
            final disposition.
          </span>

        </div>

      </div>


      <div class="result-actions">

        <button
          class="primary-button"
          id="accept-recommendation-button"
        >
          Review Recommendation
        </button>


        <button
          class="secondary-button"
          id="export-summary-button"
        >
          Export Report
        </button>


        <button
          class="secondary-button"
          id="export-json-button"
        >
          Export JSON
        </button>

      </div>

    </div>

  `;


  /*
     Animate the evidence score after the result
     has been inserted into the DOM.
  */

  animateConfidence(
    analysis.confidence
  );


  addListener(
    "#accept-recommendation-button",
    "click",
    openDecisionModal
  );


  addListener(
    "#export-summary-button",
    "click",
    () => exportSummary(
      analysis
    )
  );


  addListener(
    "#export-json-button",
    "click",
    () => exportJSON(
      analysis
    )
  );

}


/* =========================================================
   8-GPU HARDWARE MAP
========================================================= */

function renderGpuMap(
  affectedComponent
) {

  const gpuNumber =
    String(
      affectedComponent || ""
    ).match(
      /GPU(\d+)/i
    );


  const affected =
    gpuNumber
      ? Number(
          gpuNumber[1]
        )
      : -1;


  const gpus =
    Array.from(
      { length: 8 },
      (_, index) => {

        /*
           For a detected GPU failure:
           - affected GPU = FAIL
           - other GPUs = PASS

           GPU7 is only shown as WARN when there
           is no specific affected GPU but the
           demonstration topology still needs a
           visual warning state.
        */

        const state =
          index === affected
            ? "fail"
            : affected === -1 &&
              index === 7
              ? "warn"
              : "pass";


        const label =
          state === "fail"
            ? "FAIL"
            : state === "warn"
              ? "WARN"
              : "PASS";


        return `

          <div
            class="gpu-node ${state}"
            title="GPU${index} ${label}"
            aria-label="GPU${index} ${label}"
          >

            <span>
              GPU${index}
            </span>

            <small>
              ${label}
            </small>

          </div>

        `;

      }
    )
    .join("");


  return `

    <div class="hardware-map">

      <div class="hardware-header">

        <div>

          <div class="eyebrow">
            SXM TOPOLOGY
          </div>

          <strong>
            8-GPU Hardware Map
          </strong>

        </div>

        <span>
          ${escapeHtml(
            affectedComponent
          )}
          prioritized
        </span>

      </div>


      <div class="gpu-grid">

        ${gpus}

      </div>


      <div class="hardware-legend">

        <span>
          <i class="pass-dot"></i>
          PASS
        </span>

        <span>
          <i class="warn-dot"></i>
          WARN
        </span>

        <span>
          <i class="fail-dot"></i>
          PRIORITIZED
        </span>

      </div>

    </div>

  `;

}


/* =========================================================
   WORKFLOW TIMELINE
========================================================= */

function renderWorkflow() {

  return `

    <div class="workflow-panel">

      <div class="subsection-title">
        Repair workflow
      </div>


      <div class="workflow">

        <div class="workflow-step active">

          <span>
            01
          </span>

          <strong>
            Detect
          </strong>

        </div>


        <div class="workflow-line"></div>


        <div class="workflow-step active">

          <span>
            02
          </span>

          <strong>
            Prioritize
          </strong>

        </div>


        <div class="workflow-line"></div>


        <div class="workflow-step active">

          <span>
            03
          </span>

          <strong>
            Isolate
          </strong>

        </div>


        <div class="workflow-line"></div>


        <div class="workflow-step active">

          <span>
            04
          </span>

          <strong>
            Retest
          </strong>

        </div>


        <div class="workflow-line"></div>


        <div class="workflow-step pending">

          <span>
            05
          </span>

          <strong>
            Decide
          </strong>

        </div>

      </div>

    </div>

  `;

}


/* =========================================================
   CONFIDENCE ANIMATION
========================================================= */

function animateConfidence(
  target
) {

  const element =
    document.querySelector(
      ".confidence-box strong"
    );


  if (!element) {
    return;
  }


  const safeTarget =
    Math.max(
      0,
      Math.min(
        100,
        Number(target) || 0
      )
    );


  let current =
    0;


  const timer =
    setInterval(
      () => {

        current += 2;


        if (
          current >= safeTarget
        ) {

          current =
            safeTarget;

          clearInterval(
            timer
          );

        }


        element.textContent =
          `${current}%`;

      },
      18
    );

}


/* =========================================================
   CASE HISTORY
========================================================= */

function initializeCaseHistory() {

  addListener(
    "#case-search",
    "input",
    renderCases
  );


  addListener(
    "#case-filter",
    "change",
    renderCases
  );


  addListener(
    "#clear-cases-button",
    "click",
    () => {

      const confirmed =
        window.confirm(
          "Clear locally stored prototype cases?"
        );


      if (!confirmed) {
        return;
      }


      localStorage.removeItem(
        "repairiq-cases"
      );


      renderCases();

      renderActivity();


      showToast(
        "Local case history cleared."
      );

    }
  );

}


/* =========================================================
   GET CASES
========================================================= */

function getCases() {

  const stored =
    localStorage.getItem(
      "repairiq-cases"
    );


  if (!stored) {

    return [
      ...DEFAULT_CASES
    ];

  }


  try {

    const parsed =
      JSON.parse(
        stored
      );


    /*
       Validate that localStorage actually
       contains an array before using it.
    */

    if (
      !Array.isArray(parsed)
    ) {

      return [
        ...DEFAULT_CASES
      ];

    }


    return parsed;

  }
  catch {

    return [
      ...DEFAULT_CASES
    ];

  }

}


/* =========================================================
   SAVE ANALYZED CASE
========================================================= */

function saveAnalyzedCase(
  status,
  decisionNotes = ""
) {

  if (!currentAnalysis) {
    return;
  }


  const cases =
    getCases();


  const newCase = {

    id:
      currentAnalysis.caseId,


    product:
      currentAnalysis.product,


    issue:
      currentAnalysis.title,


    component:
      currentAnalysis.affectedComponent,


    recommendation:
      currentAnalysis.actions[0] ||
      currentAnalysis.recommendation,


    status,


    decisionNotes,


    timestamp:
      "Just now"

  };


  cases.unshift(
    newCase
  );


  localStorage.setItem(
    "repairiq-cases",
    JSON.stringify(
      cases.slice(
        0,
        40
      )
    )
  );


  renderCases();

  renderActivity();

}


/* =========================================================
   RENDER CASE HISTORY
========================================================= */

function renderCases() {

  const body =
    $("#case-table-body");


  if (!body) {
    return;
  }


  const search =
    (
      getInputValue(
        "#case-search"
      )
    ).toLowerCase();


  const filter =
    getInputValue(
      "#case-filter"
    ) || "all";


  const cases =
    getCases().filter(
      item => {

        const matchesSearch =
          !search ||
          Object.values(
            item
          )
            .join(" ")
            .toLowerCase()
            .includes(search);


        const matchesFilter =
          filter === "all" ||
          item.status === filter;


        return (
          matchesSearch &&
          matchesFilter
        );

      }
    );


  if (!cases.length) {

    body.innerHTML = `

      <tr>

        <td
          colspan="6"
          style="
            text-align:center;
            color:#8998b2;
            padding:32px;
          "
        >
          No matching cases found.
        </td>

      </tr>

    `;

    return;

  }


  body.innerHTML =
    cases
      .map(
        item => {

          const status =
            String(
              item.status || "Pending"
            );


          return `

            <tr>

              <td class="table-case-id">
                ${escapeHtml(
                  item.id
                )}
              </td>


              <td>
                ${escapeHtml(
                  item.product
                )}
              </td>


              <td>
                ${escapeHtml(
                  item.issue
                )}
              </td>


              <td>
                ${escapeHtml(
                  item.component
                )}
              </td>


              <td>
                ${escapeHtml(
                  item.recommendation
                )}
              </td>


              <td>

                <span
                  class="table-status ${escapeHtml(
                    status.toLowerCase()
                  )}"
                >
                  ${escapeHtml(
                    status
                  )}
                </span>

              </td>

            </tr>

          `;

        }
      )
      .join("");

}


/* =========================================================
   ACTIVITY
========================================================= */

function renderActivity() {

  const activityList =
    $("#activity-list");


  if (!activityList) {
    return;
  }


  const cases =
    getCases().slice(
      0,
      4
    );


  if (!cases.length) {

    activityList.innerHTML = `

      <div class="activity-item">

        <div class="activity-icon">
          ◈
        </div>

        <div>

          <strong>
            No recent repair activity
          </strong>

          <small>
            Analyze a case to begin tracking activity.
          </small>

        </div>

      </div>

    `;

    return;

  }


  activityList.innerHTML =
    cases
      .map(
        item => `

          <div class="activity-item">

            <div class="activity-icon">
              ◈
            </div>


            <div>

              <strong>
                ${escapeHtml(
                  item.issue
                )}
              </strong>


              <small>
                ${escapeHtml(
                  item.id
                )}
                ·
                ${escapeHtml(
                  item.component
                )}
              </small>

            </div>


            <span class="activity-time">

              ${escapeHtml(
                item.timestamp
              )}

            </span>

          </div>

        `
      )
      .join("");

}


/* =========================================================
   DECISION MODAL
========================================================= */

function initializeDecisionModal() {

  addListener(
    "#close-modal",
    "click",
    closeDecisionModal
  );


  addListener(
    "#cancel-decision",
    "click",
    closeDecisionModal
  );


  addListener(
    "#confirm-decision",
    "click",
    confirmDecision
  );


  addListener(
    "#decision-modal",
    "click",
    event => {

      if (
        event.target?.id ===
        "decision-modal"
      ) {

        closeDecisionModal();

      }

    }
  );


  /*
     Allow Escape to close the decision modal.
  */

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape"
      ) {

        const modal =
          $("#decision-modal");


        if (
          modal &&
          !modal.hidden
        ) {

          closeDecisionModal();

        }

      }

    }
  );

}


/* =========================================================
   OPEN DECISION MODAL
========================================================= */

function openDecisionModal() {

  const modal =
    $("#decision-modal");


  if (!modal) {
    return;
  }


  modal.hidden =
    false;


  /*
     Move keyboard focus to the decision selector
     when available.
  */

  const decisionType =
    $("#decision-type");


  if (decisionType) {

    setTimeout(
      () => decisionType.focus(),
      0
    );

  }

}


/* =========================================================
   CLOSE DECISION MODAL
========================================================= */

function closeDecisionModal() {

  const modal =
    $("#decision-modal");


  if (!modal) {
    return;
  }


  modal.hidden =
    true;

}


/* =========================================================
   CONFIRM TECHNICIAN DECISION
========================================================= */

function confirmDecision() {

  const decision =
    getInputValue(
      "#decision-type"
    );


  const notes =
    getInputValue(
      "#decision-notes"
    );


  if (
    decision !== "Accept" &&
    !notes
  ) {

    showToast(
      "Add notes for a modified, rejected, or escalated decision."
    );

    return;

  }


  saveAnalyzedCase(

    decision === "Accept"
      ? "Completed"
      : "Escalated",

    notes

  );


  closeDecisionModal();


  showToast(
    `Technician decision recorded: ${decision || "Review"}.`
  );

}


/* =========================================================
   EXPORT TEXT REPORT
========================================================= */

function exportSummary(
  analysis
) {

  const summary = `

REPAIRIQ
SXM REPAIR COMMAND CENTER
AI REPAIR INTELLIGENCE PROTOTYPE

HGX REPAIR ANALYSIS REPORT
========================================

CASE
${analysis.caseId}

PRODUCT
${analysis.product}

TECHNICIAN
${analysis.technician || "Not specified"}

TESTER
${analysis.tester || "Not specified"}

PRIMARY SUSPECTED ISSUE
${analysis.title}

CATEGORY
${analysis.category}

RULE
${analysis.ruleId}

AFFECTED COMPONENT
${analysis.affectedComponent}

EVIDENCE SCORE
${analysis.confidence}%

DECISION CALCULATION
${analysis.adjustedValue ?? "N/A"}
-
${analysis.failureLimit ?? "N/A"}
=
${analysis.difference ?? "N/A"}

SUPPORTING EVIDENCE
${analysis.evidence
  .map(
    (item, index) =>
      `${index + 1}. ${item}`
  )
  .join("\n")}

RECOMMENDED REPAIR PATH
${analysis.actions
  .map(
    (item, index) =>
      `${index + 1}. ${item}`
  )
  .join("\n")}

TECHNICIAN NOTES
${analysis.notes || "None provided."}

CONTROL NOTICE
RepairIQ provides decision support only.
Technician approval is required before
consequential repair actions including
replacement, firmware action, destructive
testing, escalation, or final disposition.

This prototype uses deterministic rules and
synthetic demonstration data.

========================================

`.trim();


  downloadFile(
    summary,
    `${analysis.caseId}-repair-report.txt`,
    "text/plain;charset=utf-8"
  );


  showToast(
    "Repair report exported."
  );

}


/* =========================================================
   EXPORT JSON
========================================================= */

function exportJSON(
  analysis
) {

  const payload = {

    platform:
      "RepairIQ",


    platformMode:
      "SXM Repair Command Center",


    prototypeVersion:
      "0.3",


    generatedAt:
      new Date().toISOString(),


    case:
      analysis,


    control:
      "Technician approval required",


    disclaimer:
      "Prototype uses deterministic rules and synthetic demonstration data."

  };


  downloadFile(

    JSON.stringify(
      payload,
      null,
      2
    ),

    `${analysis.caseId}.json`,

    "application/json;charset=utf-8"

  );


  showToast(
    "Case JSON exported."
  );

}


/* =========================================================
   DOWNLOAD FILE
========================================================= */

function downloadFile(
  content,
  filename,
  type
) {

  const blob =
    new Blob(
      [content],
      {
        type
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const link =
    document.createElement(
      "a"
    );


  link.href =
    url;


  link.download =
    filename;


  document.body.appendChild(
    link
  );


  link.click();


  link.remove();


  /*
     Give the browser a moment to process the
     download before releasing the object URL.
  */

  setTimeout(
    () => {

      URL.revokeObjectURL(
        url
      );

    },
    100
  );

}


/* =========================================================
   BUTTONS
========================================================= */

function initializeButtons() {

  addListener(
    "#start-analysis-button",
    "click",
    () => {

      switchView(
        "analyzer"
      );

    }
  );


  addListener(
    "#view-demo-button",
    "click",
    () => {

      loadDemoCase();


      /*
         Allow the DOM to finish updating the analyzer
         before beginning the simulated analysis.
      */

      setTimeout(
        runAnalysis,
        250
      );

    }
  );


  addListener(
    "#load-demo-button",
    "click",
    () => {

      loadDemoCase();


      setTimeout(
        runAnalysis,
        250
      );

    }
  );

}


/* =========================================================
   THEME
========================================================= */

function initializeTheme() {

  addListener(
    "#theme-button",
    "click",
    () => {

      document.body.classList.toggle(
        "light-mode"
      );


      const isLight =
        document.body.classList.contains(
          "light-mode"
        );


      showToast(
        isLight
          ? "Light interface enabled."
          : "Dark interface enabled."
      );

    }
  );

}


/* =========================================================
   UTILITIES
========================================================= */

function createCaseId() {

  const date =
    new Date();


  const stamp = [

    date.getFullYear(),

    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    ),

    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    )

  ].join("");


  const random =
    Math.floor(
      100 +
      Math.random() *
      900
    );


  return `CASE-${stamp}-${random}`;

}


/* =========================================================
   HTML ESCAPING
========================================================= */

/*
   All log-derived or user-entered values that are
   inserted into innerHTML pass through this function.

   This is especially important because RepairIQ
   accepts uploaded log content and technician notes.
*/

function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


/* =========================================================
   TOAST SYSTEM
========================================================= */

function showToast(
  message
) {

  const toast =
    $("#toast");


  const toastMessage =
    $("#toast-message");


  if (
    !toast ||
    !toastMessage
  ) {

    return;

  }


  toastMessage.textContent =
    message;


  toast.classList.add(
    "show"
  );


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      3000
    );

}