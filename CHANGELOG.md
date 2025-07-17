# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2025-07-17
### Added
- AI-powered enhancement of daily report descriptions
- Retry mechanism with "Attempt n" in captions
- Inline buttons ("Save", "Retry", "Cancel") with original message editing
- Caption preview support for media files without reuploading
- Validation: require caption when submitting a photo
- `cleanText` helper to sanitize AI responses
- Retry flow with `retryCount` support
- Original description stored as `deskripsi`, AI output stored as `deskripsi_ai`

### Changed
- Refactored command help into `commands.command.js` for modular structure

---

## [1.0.3] - 2025-07-04
### Added
- Tailwind CSS integration via CLI build
- Static file serving from `src/` directory
- `output.css` generation and `input.css` config

---

## [1.0.2] - 2025-07-04
### Fixed
- Improved layout responsiveness in `index.ejs`

---

## [1.0.1] - 2025-07-04
### Added
- EJS view engine with dynamic version display

---

## [1.0.0] - 2025-07-04
### Added
- Initial project setup with Express server and Telegram bot
- Docker support for bot, web, and database services
- Basic homepage with video, meta tags, and SEO
