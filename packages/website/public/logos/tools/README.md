# Tool Logos

Tool submissions may include an optional custom SVG logo here.

Name the file with the exact tool slug:

```text
packages/website/public/logos/tools/<tool-slug>.svg
```

Then add the matching public path to the tool JSON only when the SVG is present:

```json
"logoPath": "/logos/tools/<tool-slug>.svg"
```

Example for `stripe`:

```text
packages/website/public/logos/tools/stripe.svg
```

```json
"logoPath": "/logos/tools/stripe.svg"
```

Use SVG only. Do not add PNG, JPG, WebP, or remote logo URLs for new tool
submissions. If no logo is added, omit `logoPath`; the website falls back to a
known Simple Icons logo, the tool website favicon, or a generated initials mark.
