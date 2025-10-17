# Inventory Module

A comprehensive inventory management system for ChurchTools with:

- 📦 Asset tracking with auto-generated IDs
- 🔧 Kits management (grouping assets)
- 📅 Booking system with conflict detection
- 👤 Person assignment with ChurchTools integration
- 🏷️ Status tracking and history
- 📸 Asset icons and profile images
- ⚙️ Configurable settings (locations, prefixes, statuses)

## Quick Start

```typescript
import { initInventory } from '@/inventory';

// Initialize the inventory system
await initInventory(containerElement, {
    currentUser: {
        firstName: 'John',
        lastName: 'Doe'
    }
});
```

## Module Structure

See [README.md](./inventory/README.md) for detailed documentation on the modular structure.

## Features

### Asset Management
- Create, edit, and delete assets
- Auto-generated asset IDs with customizable prefixes
- Track manufacturer, model, and serial number
- Assign assets to people from ChurchTools
- Upload asset icons
- Full audit trail (created by, updated by, history)

### Status Management
Fixed statuses:
- Available
- Broken
- In Repair
- Sold
- Scrapped
- Assigned to Person
- Installed

### Kits
Group multiple assets into kits for easier management

### Bookings
Book assets or kits with:
- Date/time ranges
- Automatic conflict detection
- Item availability checking

### Settings
Configure:
- Locations (dropdown options)
- Asset ID prefixes (e.g., CAM, MIC)

## Data Storage

Currently uses localStorage. Ready for migration to ChurchTools API when better support becomes available.

## Development

The codebase follows a modular structure:
- `types.ts` - TypeScript definitions
- `constants.ts` - Application constants
- `utils.ts` - Utility functions
- `components/` - Reusable UI components
- `services/` - Business logic and data access

See [REFACTORING.md](../REFACTORING.md) for the full refactoring plan.
