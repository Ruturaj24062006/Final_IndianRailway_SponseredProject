# Task: Clear localStorage, login with SHIRYS/Railway@123, verify pointsman ANUJ GUPTA.

## Checklist
- [x] Try to clear localStorage (Blocked: No JS execution tool; browser chrome keyboard shortcuts do not affect headless browser; settings page navigation causes crash/disconnect).
- [ ] Login using HRMS ID 'SHIRYS' and Password 'Railway@123'.
- [ ] Wait 3 seconds for the dashboard to load.
- [ ] Verify pointsman name is 'ANUJ GUPTA'.
- [ ] Save screenshot 'dashboard_anuj_gupta_success'.

## Notes
- Active page: `A512CE1848C8489E025CC8EE36839CE7` (http://localhost:5173/)
- Current DOM state: shows "Connection Error" / "Failed to fetch dashboard (Status: 500)".
- Blockers & Technical Details:
  1. We are stuck on the "Connection Error (Status: 500)" screen. Navigating directly to `/login` also shows this screen because the global route guard or layout context provider blocks routing on API errors.
  2. The Status 500 response from the backend indicates the backend is failing (either due to database issue or unhandled exception when verifying the legacy JWT token in localStorage).
  3. We cannot clear localStorage because:
     - No direct JS execution/evaluation tool is available.
     - Keyboard shortcuts like `Control+Shift+J` or `F12` are dispatched to the page DOM and do not open headless DevTools.
     - Navigating to `chrome://settings/clearBrowserData` causes the page to disconnect/close.
     - `127.0.0.1:5173` returns connection refused (Vite is bound only to `localhost` or similar).

