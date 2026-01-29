export * from './testSuite';
import { fdc3Ready } from '@finos/fdc3';
import { getPackMembers, getPackNames, executeTestsInBrowser, executeManualTestsInBrowser } from './testSuite';

require('mocha/mocha.css');
require('source-map-support/browser-source-map-support.js');

mocha.setup('bdd');

/**
 * Cap Mocha's progress display at 100%. The HTML reporter uses
 * (stats.tests / runner.total) * 100, which can exceed 100% when
 * stats.tests > runner.total (e.g. retries or counting mismatch).
 */
function capProgressAt100(): void {
  const el = document.querySelector('#mocha-stats .progress-text');
  if (el && el.textContent) {
    const match = el.textContent.match(/^(\d+(?:\.\d+)?)%$/);
    if (match) {
      const pct = parseFloat(match[1]);
      if (pct > 100) {
        el.textContent = '100%';
        const bar = document.querySelector('#mocha-stats .progress-element');
        if (bar instanceof HTMLProgressElement) bar.value = 100;
      }
    }
  }
}
const version = document.getElementById('version')!;

// populate drop-down
getPackNames().forEach(pn => {
  const optGroup = document.createElement('optgroup');
  optGroup.setAttribute('label', pn);
  getPackMembers(pn).forEach(pm => {
    const opt = document.createElement('option');
    const text = document.createTextNode(pm);
    opt.setAttribute('value', pm);
    opt.appendChild(text);
    optGroup.appendChild(opt);
  });
  version.appendChild(optGroup);
});

function startProgressCapInterval(): void {
  const id = setInterval(capProgressAt100, 250);
  setTimeout(() => clearInterval(id), 90000);
}

/** Custom event name fired when conformance tests complete. Listen on document or window. */
export const FDC3_CONFORMANCE_TESTS_COMPLETE = 'fdc3-conformance-tests-complete';

declare global {
  interface Window {
    FDC3_CONFORMANCE_TESTS_COMPLETE?: string;
  }
}
window.FDC3_CONFORMANCE_TESTS_COMPLETE = FDC3_CONFORMANCE_TESTS_COMPLETE;

function notifyTestsComplete(detail: { passes: number; failures: number; duration?: number; manual?: boolean }): void {
  document.dispatchEvent(new CustomEvent(FDC3_CONFORMANCE_TESTS_COMPLETE, { detail, bubbles: true }));
  window.dispatchEvent(new CustomEvent(FDC3_CONFORMANCE_TESTS_COMPLETE, { detail }));
}

function executeTests() {
  toggleVersionSelector();
  toggleBackButton();
  startProgressCapInterval();
  const fdc3Versions = document.getElementById('version') as HTMLSelectElement;
  var selectedVersion = fdc3Versions.options[fdc3Versions.selectedIndex].innerHTML;
  const action = () =>
    executeTestsInBrowser(selectedVersion, stats => notifyTestsComplete({ ...stats, manual: false }));
  if (window.fdc3) {
    action();
  } else {
    fdc3Ready().then(() => action());
  }
}

function executeManualTests() {
  toggleVersionSelector();
  toggleBackButton();
  startProgressCapInterval();
  const manualTests = document.getElementById('manualTests') as HTMLSelectElement;
  var selectedManualTest = manualTests.options[manualTests.selectedIndex].innerHTML;
  console.log('******** Selected manual test is', selectedManualTest);
  const action = () =>
    executeManualTestsInBrowser(selectedManualTest, stats => notifyTestsComplete({ ...stats, manual: true }));
  if (window.fdc3) {
    action();
  } else {
    fdc3Ready().then(() => action());
  }
}

function returnToTestSelection() {
  location.reload();
}

function toggleVersionSelector() {
  const versionSelector = document.getElementById('version-selector')!;
  const manualSelector = document.getElementById('manualTests-selector')!;
  if (versionSelector.style.display === 'none') {
    versionSelector.style.display = 'block';
    manualSelector.style.display = 'block';
  } else {
    versionSelector.style.display = 'none';
    manualSelector.style.display = 'none';
  }
}

function toggleBackButton() {
  const backButton = document.getElementById('back-button')!;
  if (window.getComputedStyle(backButton).display === 'none') {
    backButton.style.display = 'block';
  } else {
    backButton.style.display = 'none';
  }
}

document.getElementById('runButton')!.addEventListener('click', executeTests);
document.getElementById('back-button')!.addEventListener('click', returnToTestSelection);
document.getElementById('manualTestsRunButton')!.addEventListener('click', executeManualTests);
