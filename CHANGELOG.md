# Changelog

## [2.1.1] — 2025-10-20

### Fixed
- Score column width and modifier preview cells now render consistently across modes.
- Modifier formatting: Ensures consistent +X/-X display across all ability scores.

## [2.1.0] - 2025-10-20

### Added
- Live preview columns for Result and Modifier, calculated from current + assigned scores
- Current score column injected into assignment table for full context
- Real-time sync with actor sheet: updates current scores and previews when ability values change
- Support for dynamic score pooling in roll, array, and point-buy modes
- Wider dialog layout for improved readability (800px width)

### Fixed
- Rolled scores now populate dropdowns correctly in roll mode
- Roll button visibility restored on initial render
- Preview logic now updates correctly after reset or mode switch

### Improved
- Table layout and column spacing for better clarity
- CSS cleanup: removed unused selectors and consolidated styles
- Modular logic for dropdown rebuilding and preview injection

## [2.0.2] - 2025-10-19

### Fixed
- Removed old unused files

## [2.0.1] - 2025-10-19

### Fixed
- Removed various notes left in code.

## [2.0.0] - 2025-10-18

### Added
- Assign Abilities button injected into DND5E character sheet header
- Native tooltip support via `data-tooltip` attribute
- Mode-aware visibility: button only appears in Edit mode
- Broke ability-dialog.js into multiple pieces for easier editablity

### Fixed
- Tooltip alignment and accessibility with `aria-label`
- Button duplication across multiple renders
- DOM injection logic to prevent duplicate buttons


### Improved
- Modular separation of injection logic
- Logging clarity and error handling
- Compatibility with DND5e default sheet


## [1.0.0] — 2025-10-17

- Initial release of Ability Score Generator
- Roll, Standard Array, and Point Buy modes
- Dynamic assignment table with modifier previews
- Point-buy validation and Apply confirmation
- Disabled overspending options in point-buy
- Table header with remaining points in point-buy
- Confirmation dialog for unspent points
- Preserved selected values across rerenders
