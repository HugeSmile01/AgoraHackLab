# AgoraHackLab

AgoraHackLab is a browser-based lab environment designed for security learning, request analysis, and payload testing in controlled and authorized scenarios.

## Project Structure

The application files now live at the repository root:

- `index.html`
- `css/`
- `js/`
- `pages/`
- `vercel.json`

## Vercel Deployment (Production Ready)

This repo is configured for zero-build static deployment on Vercel.

### Included routing

- `/` → `index.html`
- `/disclaimer` → `pages/disclaimer.html`
- `/privacy` → `pages/privacy.html`
- `/terms` → `pages/terms.html`
- `/languages` → `pages/programming-languages.html`

### Deploy steps

1. Import this repository into Vercel.
2. Framework preset: **Other** (no build command needed).
3. Output directory: leave empty (root static deployment).
4. Deploy.

The `vercel.json` also includes baseline security headers and static asset cache policy.

## Responsible Use Notice

This project is provided strictly for legal, ethical, and authorized security research.

- Do not use this project, in whole or in part, for illegal activity.
- Do not use this code against systems you do not own or explicitly have permission to test.
- Do not repurpose, redistribute, or reuse the code in other projects without explicit written permission from the author.

By using this repository, you agree to follow applicable laws and professional security standards.
