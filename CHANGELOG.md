# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.1] - 2024-07-22
### Changed
- Replaced the static bot illustration on the landing page with a dynamic video demonstration playing inside a smartphone frame for a more engaging and informative user experience.

### Fixed
- Corrected video playback issues (autoplay, aspect ratio) to ensure the demo plays smoothly and without distortion.
- Added a subtle shadow effect to the phone mockup to create a floating illusion.

## [1.2.0] - 2024-07-22
### Added
- **AI Report Assistant (`perbaikiDeskripsi`):**
  - Integrates with Google Gemini API (with a local Ollama fallback) to rewrite user-submitted reports into a formal, professional tone.
  - Uses the user's `jabatan` (job title) and `unit_kerja` (work unit) from their profile to provide context to the AI for better results.
- **Interactive Submission Flow (`onMessage`, `onCallback`):**
  - After a user submits a report, the bot presents the AI-enhanced version for confirmation.
  - Users can choose to save the AI version, save their original text, ask the AI to retry, or cancel the submission via inline keyboard buttons.
- **Advanced Excel Export (`/unduh`):**
  - The generated Excel report now groups activities by date and then by working session (e.g., morning/afternoon).
  - A new "Detail" worksheet is included, which lists the original description, the AI-enhanced description, and a clickable hyperlink to the associated photo.
  - The main report sheet uses the AI description for a more professional output.
- **User Profile Management:**
  - Added a full suite of commands for user profile management: `/profil`, `/ubahnama`, `/ubahnip`, `/ubahjabatan`, `/ubahunit`.
  - The bot now checks for a complete profile before processing a report to ensure high-quality AI suggestions.
- **UX & Code Quality Improvements:**
  - Added a command suggestion helper for users who type commands without the leading `/`.
  - Refactored command loading to be dynamic, improving modularity.
  - Updated the database schema to store both original and AI-generated descriptions.
  - Added a simple Express server to serve uploaded images for the Excel export links.

### Changed
- **AI Context & Flow:** The bot now requires a complete user profile before accepting reports. It uses the profile's `jabatan` (job title) and `unit_kerja` (work unit) to provide better context to the AI, resulting in more accurate suggestions.
- **Code Structure:** Refactored command loading to be fully dynamic (`commandLoader.js`). The callback query logic for `/hapuslaporanterakhir` is now self-contained within its command file, improving modularity and preventing conflicts.
- **Database Schema:** The `reports` table was updated to store both the original (`deskripsi`) and the AI-enhanced (`deskripsi_ai`) descriptions in separate columns.

### Fixed
- The `/hapuslaporanterakhir` command now correctly handles its own callback queries, preventing potential conflicts with other inline buttons.
- The Indonesian locale for `moment.js` is now correctly configured and used for date formatting in exports.

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
