# Contributing Guide

Thanks for your interest in improving the Browser-Based Side-Channel Attack Simulator. This project is strictly educational and must remain safe and non-exploitable.

## Ways to contribute
- Report bugs and documentation gaps through issues.
- Improve educational explanations, diagrams, and UI clarity.
- Enhance testing, CI, and tooling while keeping the simulator safe.

## Development workflow
1. Fork the repository and create a feature branch.
2. Ensure changes remain within the safety constraints outlined in the README and SECURITY policy.
3. Run `npm test` to verify the simulation logic.
4. Submit a pull request with a clear summary and screenshots for UI changes.

## Coding standards
- Use modern ES modules and avoid introducing third-party dependencies unless necessary.
- Keep simulations artificial: no real-world exploit payloads or data exfiltration.
- Prefer small, composable functions with in-code documentation where helpful.
- Follow the `.editorconfig` settings and use `npm run format` before submitting.

## Commit messages
Follow the conventional commit spirit where possible (e.g., `feat:`, `fix:`, `docs:`). Keep messages concise and descriptive.

## Conduct
By participating, you agree to uphold the standards in the [Code of Conduct](CODE_OF_CONDUCT.md).
