# Security policy

Rowlith parses user-supplied CSV and XLSX files. Treat all imported files and cell values as untrusted input.

## Reporting a vulnerability

Please do not report exploitable vulnerabilities in a public issue.

Use GitHub's **Report a vulnerability** flow in the repository Security tab if private vulnerability reporting is enabled. If that option is unavailable, contact the repository maintainer through the GitHub profile and request a private disclosure channel. Include the affected package/version, impact, reproduction steps, and any relevant proof of concept. Do not attach real personal or customer data.

Please allow maintainers reasonable time to investigate and prepare a fix before public disclosure. There is no guaranteed response or remediation SLA for this early-stage project.

## Supported versions

Before the first stable release, the latest code on the default branch is the only actively maintained development line. No npm release has been made yet. Once releases begin, this policy will be updated with explicit supported-version windows.

## Security boundaries

- CSV and XLSX parsing happens in the consuming application; imported data is not sent to a Rowlith hosted service by these libraries.
- CSV cells are not evaluated as formulas or JavaScript by the parser.
- XLSX formulas are not calculated. Cached values, formula text, and rejection are explicit policies.
- XLSX resource limits reduce exposure to oversized archive entries and workbook structures but cannot guarantee safety for every malformed or adversarial file.
- Consumers must encode output for the context where it is displayed and must apply spreadsheet-formula protections when exporting untrusted values to CSV.
- Applications remain responsible for authorization, persistence, access control, retention, and server-side validation.
