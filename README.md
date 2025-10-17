# Ability Score Generator

A modular, native-feeling ability score assignment tool for FoundryVTT. Supports roll, standard array, and point-buy modes with dynamic validation, modifier previews, and actor-safe updates.

## Features

- 🧠 Three generation modes: Roll, Standard Array, Point Buy
- 🧩 Modular architecture with clean separation of UI, logic, and validation
- 🎯 Native UI replication with modifier previews and dropdowns
- 🛡️ Point-buy enforcement with confirmation dialog for unspent points
- 🔄 Reset and reroll support
- 🧪 Actor-safe updates with fallback detection

## Compatibility

- FoundryVTT 13+
- DND5e 5.x.x

## Installation

1. Manually add the manifest to FoundryVTT:
   ```json
   https://raw.githubusercontent.com/SlamHammerfist/Ability-Score-Generator/refs/heads/main/module.json
2. Enable Ability Score Generator in your FoundryVTT world.

## Usage

Click the "Assign Abilities" button on any actor sheet to open the dialog. Choose a generation mode, assign scores, and click Apply.

## AI Usage

Copilot was used to generate code with extensive input and testing from myself.
