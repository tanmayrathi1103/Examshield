# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Biometric Facial Recognition Flow (Simplified)

### ⚠️ Security & Design Tradeoffs (Intentional Simplicity)
1. **Raw Image Storage (Encrypted at Rest)**: Instead of storing only abstract face embedding vectors, the system captures and stores the student's raw base64 webcam image (encrypted via AES-256 Fernet) in the database.
2. **On-Demand Embedding Extraction & Cosine Similarity**: DeepFace (using the FaceNet model) extracts the face embeddings from the decrypted raw images *on the fly* during verification to compare them against the live capture.
3. **No Liveness / Anti-Spoofing Checks**: The liveness checking state machine (head turns, blinking) has been completely removed to prioritize system simplicity and reliability. As a result, **spoofing is possible** (e.g., using printed photos or a photo shown on another screen). This is an intentional simplicity tradeoff.
4. **GDPR-Compliant Right to Erasure**: When a student requests data deletion, the database record is not just soft-deleted: the `encrypted_embedding` and `encrypted_audit_image` columns are overwritten with empty payloads (`""` and `None` respectively) to purge all image data.
