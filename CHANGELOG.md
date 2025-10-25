# Changelog

## [3.2.0]

### Added
- The ability assignment button now appears only in Edit Mode 

## [3.1.1] - 2025-10-25

### Fixed
- Code clean-up

### Improved
- Changed Apply button to Assign
- Changed Submit button to Close & Save
- Roll button and assign dropdowns are now disabled after assignment and re-enabled on reset
- Always show the modifier score

## [3.1.0] - 2025-10-24

### Added
- Added a title to the header, including the name of the actor that the score is being assigned to

### Improved
- Cleaned up and sorted css

## [3.0.1] - 2025-10-21

### Added
- Apply button is disabled after clicking and re-enabled after reset is clicked

## [3.0.0] - 2025-10-21

### Added
- Rewritten from the ground up to support App V2

## [2.1.0] - 2025-10-20

### Added
- Live preview columns for Result and Modifier, calculated from current + assigned scores
- Current score column injected into assignment table for full context
- Real-time sync with actor sheet: updates current scores and previews when ability values change
- Dynamic score pooling in roll, array, and point-buy modes
- Wider dialog layout for improved readability (800px width)

### Fixed
- Rolled scores now populate dropdowns correctly in roll mode
- Roll button visibility restored on initial render
- Preview logic updates correctly after reset or mode switch

### Improved
- Table layout and column spacing for better clarity
- CSS cleanup: removed unused selectors and consolidated styles
- Modular logic for dropdown rebuilding and preview injection

## [2.0.2] - 2025-10-19

### Fixed
- Removed old unused files

## [2.0.1] - 2025-10-19

### Fixed
- Removed various leftover notes from code

## [2.0.0] - 2025-10-18

### Added
- Assign Abilities button injected into DND5E character sheet header
- Native tooltip support via `data-tooltip` attribute
- Mode-aware visibility: button only appears in Edit mode
- Split ability-dialog.js into modular components for easier editing

### Fixed
- Tooltip alignment and accessibility via `aria-label`
- Button duplication across multiple renders
- DOM injection logic to prevent duplicate buttons

### Improved
- Modular separation of injection logic
- Logging clarity and error handling
- Compatibility with DND5E default sheet

## [1.0.0] — 2025-10-17

### Added
- Initial release of Ability Score Generator
- Roll, Standard Array, and Point Buy modes
- Dynamic assignment table with modifier previews
- Point-buy validation and Apply confirmation
- Disabled overspending options in point-buy
- Table header with remaining points in point-buy
- Confirmation dialog for unspent points
- Preserved selected values across rerenders
