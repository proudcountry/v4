// Web App Logic

document.addEventListener("DOMContentLoaded", () => {
  const configForm = document.getElementById("config-form");
  const gistIdInput = document.getElementById("gist-id");
  const ghTokenInput = document.getElementById("gh-token");
  const tabsTableBody = document.querySelector("#tabs-table tbody");
  const nextStepButton = document.getElementById("next-step");
  const statusBox = document.getElementById("status-box");

  let workflowConfig = JSON.parse(localStorage.getItem("workflowConfig")) || {};
  let tabs = [];

  // Populate existing configuration
  if (workflowConfig.gistId) gistIdInput.value = workflowConfig.gistId;
  if (workflowConfig.ghToken) ghTokenInput.value = workflowConfig.ghToken;

  // Save configuration
  configForm.addEventListener("submit", (e) => {
    e.preventDefault();
    workflowConfig = {
      gistId: gistIdInput.value.trim(),
      ghToken: ghTokenInput.value.trim(),
    };
    localStorage.setItem("workflowConfig", JSON.stringify(workflowConfig));
    alert("Configuration saved!");
  });

  // Fetch open tabs from Chrome extension
  function fetchTabs() {
    chrome.runtime.sendMessage({ type: "getTabs" }, (response) => {
      if (response?.tabs) {
        tabs = response.tabs;
        renderTabs();
      }
    });
  }

  // Render tabs in the table
  function renderTabs() {
    tabsTableBody.innerHTML = "";
    tabs.forEach((tab) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${tab.id}</td>
        <td>${tab.url}</td>
        <td>${tab.role || "Not assigned"}</td>
        <td>
          <select data-tab-id="${tab.id}">
            <option value="">Select Role</option>
            <option value="1">1 (Planning)</option>
            <option value="2">2 (Coding)</option>
            <option value="3">3 (Reviewing)</option>
          </select>
        </td>
      `;
      tabsTableBody.appendChild(row);
    });

    // Add event listeners to role selectors
    document.querySelectorAll("select[data-tab-id]").forEach((select) => {
      select.addEventListener("change", (e) => {
        const tabId = e.target.getAttribute("data-tab-id");
        const role = e.target.value;
        assignRoleToTab(tabId, role);
      });
    });
  }

  // Assign role to a tab
  function assignRoleToTab(tabId, role) {
    chrome.runtime.sendMessage(
      { type: "assignRole", tabId, role },
      (response) => {
        if (response?.success) {
          fetchTabs(); // Refresh tabs
        }
      }
    );
  }

  // Trigger the next step in the workflow
  nextStepButton.addEventListener("click", () => {
    if (!workflowConfig.gistId || !workflowConfig.ghToken) {
      alert("Please configure your Gist ID and GitHub Token first!");
      return;
    }
    chrome.runtime.sendMessage(
      { type: "nextStep", gistId: workflowConfig.gistId, ghToken: workflowConfig.ghToken },
      (response) => {
        if (response?.success) {
          statusBox.textContent = `Next step triggered! Current step: ${response.nextStep}`;
        } else {
          statusBox.textContent = "Error triggering next step.";
        }
      }
    );
  });

  // Initial fetch of tabs
  fetchTabs();
});