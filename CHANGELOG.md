# Changelog

## [2.0.1] - 2025-10-19

###Fixed
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

### Added
- Initial release of Ability Score Generator
- Roll, Standard Array, and Point Buy modes
- Dynamic assignment table with modifier previews
- Point-buy validation and Apply confirmation
- Actor-safe updates and fallback detection
- Modular file structure and scoped CSS

### Fixed
- Disabled overspending options in point-buy
- Preserved selected values across rerenders
- Corrected modifier formatting and score usage

### Improved
- UI layout and spacing
- Table header with remaining points

- Confirmation dialog for unspent points

