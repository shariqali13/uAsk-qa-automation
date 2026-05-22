const path = require('path');
let fetchFn = global.fetch;
if (!fetchFn) {
  try {
    fetchFn = require('node-fetch');
  } catch (e) {
    // fetch unavailable; reporter will be disabled if not present
    fetchFn = null;
  }
}

// Minimal ReportPortal reporter for Playwright
// Uses env vars: RP_ENDPOINT, RP_TOKEN, RP_PROJECT, RP_LAUNCH

class ReportPortalReporter {
  constructor(options = {}) {
    this.endpoint = options.endpoint || process.env.RP_ENDPOINT;
    this.token = options.token || process.env.RP_TOKEN;
    this.project = options.project || process.env.RP_PROJECT;
    this.launchName = options.launch || process.env.RP_LAUNCH || `uask-launch-${Date.now()}`;

    this.launchId = null;
    this.testItems = new Map();
    this.headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.token}`,
    };
    this.enabled = !!(this.endpoint && this.token && this.project);
  }

  async onBegin(config, suite) {
    if (!this.enabled) return;
    const url = `${this.endpoint.replace(/\/$/, '')}/api/v1/${this.project}/launch`;
    const body = { name: this.launchName, startTime: new Date().toISOString() };
    if (!fetchFn) {
      console.warn('[ReportPortal] fetch not available; reporter disabled');
      return;
    }
    const res = await fetchFn(url, { method: 'POST', headers: this.headers, body: JSON.stringify(body) });
    if (res.ok) {
      const json = await res.json();
      this.launchId = json.id || (json.value && json.value.id) || null;
      console.log('[ReportPortal] Launch created', this.launchId);
    } else {
      console.warn('[ReportPortal] Failed to create launch', res.statusText);
    }
  }

  async onTestBegin(test) {
    if (!this.enabled || !this.launchId) return;
    const url = `${this.endpoint.replace(/\/$/, '')}/api/v1/${this.project}/item?launchId=${this.launchId}`;
    const body = { name: test.title, startTime: new Date().toISOString(), type: 'TEST' };
    if (!fetchFn) return;
    const res = await fetchFn(url, { method: 'POST', headers: this.headers, body: JSON.stringify(body) });
    if (res.ok) {
      const json = await res.json();
      const itemId = json.id || (json.value && json.value.id) || null;
      if (itemId) this.testItems.set(test.title, itemId);
    }
  }

  async onTestEnd(test, result) {
    if (!this.enabled || !this.launchId) return;
    const itemId = this.testItems.get(test.title);
    if (!itemId) return;
    const url = `${this.endpoint.replace(/\/$/, '')}/api/v1/${this.project}/item/${itemId}/finish`;
    const status = result.status === 'passed' ? 'PASSED' : result.status === 'skipped' ? 'SKIPPED' : 'FAILED';
    const body = { endTime: new Date().toISOString(), status };
    try {
      if (!fetchFn) return;
      await fetchFn(url, { method: 'PUT', headers: this.headers, body: JSON.stringify(body) });
    } catch (e) {
      console.warn('[ReportPortal] Failed to finish item', e.message);
    }
  }

  async onEnd(result) {
    if (!this.enabled || !this.launchId) return;
    const url = `${this.endpoint.replace(/\/$/, '')}/api/v1/${this.project}/launch/${this.launchId}/finish`;
    const body = { endTime: new Date().toISOString() };
    try {
      if (!fetchFn) return;
      await fetchFn(url, { method: 'PUT', headers: this.headers, body: JSON.stringify(body) });
      console.log('[ReportPortal] Launch finished', this.launchId);
    } catch (e) {
      console.warn('[ReportPortal] Failed to finish launch', e.message);
    }
  }
}

module.exports = ReportPortalReporter;
