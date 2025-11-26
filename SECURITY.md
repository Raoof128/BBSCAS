# Security Policy

## Supported versions
This project is provided for educational purposes. No production deployments are supported. Security updates are applied on a best-effort basis.

## Reporting a vulnerability
Please report potential vulnerabilities or safety concerns to security@browserlab.invalid. Describe the issue, steps to reproduce, and suggested mitigations.

## Safety constraints
- The simulator must remain non-exploitable and use artificial timing and mock data only.
- Do not introduce external network calls or unsafe permissions.
- Keep WebAssembly modules minimal and sandboxed; prefer JavaScript fallbacks.

## Responsible disclosure
We will acknowledge reports within 7 days and aim to provide an update within 14 days. Public disclosure should wait until a fix or mitigation is available.
