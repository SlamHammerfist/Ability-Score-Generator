![Downloads](https://img.shields.io/github/downloads/SlamHammerfist/Ability-Score-Generator/total.svg?style=plastic)

# Ability Score Generator

A modular, native-feeling ability score assignment tool for FoundryVTT and the D&D5e system. Supports roll, standard array, and point-buy modes with dynamic validation, modifier previews, and actor-safe updates.

![Ability Score Dialog Preview](assets/preview.gif)

## Features

- 🧠 Three generation modes: Roll, Standard Array, Point Buy
- 🎯 Native UI replication with dropdowns and live preview of current, assigned, resulting score, and modifier
- 🛡️ Point-buy enforcement with confirmation dialog for unspent points
- 🔄 Reset and reroll support


## Compatibility

- FoundryVTT 13+
- DND5e 5.x.x

## Installation

1. Download and manually add to modules folder

or

1. Manually add the manifest to FoundryVTT:
   ```json
   https://raw.githubusercontent.com/SlamHammerfist/Ability-Score-Generator/refs/heads/main/module.json
2. Enable Ability Score Generator in your FoundryVTT world.

## Usage


Put character sheet into edit mode, click the "Assign Abilities" button in the header to open the dialog. Choose a generation mode, assign scores, and click Apply.

## Future Features

- Upgrade to App v2.
- Move from header to context menu button.

## AI Usage

Copilot was used to generate code with extensive input and testing from myself.