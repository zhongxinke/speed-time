# Chrome Extension Show Effective Video Time By Playback Speed

## Goal

Build a minimal Chrome extension that detects HTML5 videos on a page and shows the original duration, current playback speed, and effective watch time after speed adjustment.

## What I Already Know

* The repository is currently almost empty and is suitable for creating a standalone extension from scratch.
* Codex is operating in Trellis inline mode for this project.
* The user wants a Google/Chrome browser plugin for video speed timing, with an example like 10 minutes at 1.25x.
* The clearest interpretation is to show the adjusted watch time: `original duration / playbackRate`.

## Assumptions (Temporary)

* Target browser is Chrome or another Chromium browser supporting Manifest V3.
* Target pages use standard HTML5 `video` elements.
* MVP should work across common video sites without site-specific integration.
* A floating page overlay is acceptable for MVP instead of modifying native video controls.

## Open Questions

* None blocking for MVP.

## Requirements (Evolving)

* Create a Manifest V3 Chrome extension.
* Inject a content script on normal web pages.
* Detect one or more HTML5 `video` elements.
* Track the currently active video based on user interaction or playback.
* Display:
* Original duration
* Current playback speed
* Effective watch time after speed adjustment
* Update the displayed values when:
* Metadata loads
* Playback speed changes
* Active video changes
* Keep the UI lightweight and non-intrusive.

## Acceptance Criteria (Evolving)

* [ ] Loading the unpacked extension in Chrome succeeds.
* [ ] On a page with an HTML5 video, a floating widget appears.
* [ ] For a 10-minute video at 1.25x, the widget shows effective watch time as about 8 minutes.
* [ ] Changing playback speed updates the displayed effective time immediately.
* [ ] The extension does not depend on a specific video website.

## Definition Of Done (Team Quality Bar)

* Core files for the extension are created and readable.
* Basic manual verification steps are documented.
* No build tooling is required for the MVP.

## Out Of Scope (Explicit)

* Site-specific integrations into native player control bars
* Popup settings UI
* Persisted user preferences
* Firefox/Safari packaging adjustments

## Technical Notes

* Relevant Trellis docs reviewed:
* `.trellis/workflow.md`
* `.trellis/spec/frontend/index.md`
* `.trellis/spec/guides/index.md`
* Frontend spec detail files are placeholders, so practical repo constraints are minimal.
* Extension will likely live under a root folder such as `extension/`.
