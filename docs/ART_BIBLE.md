# CodeQuest Visual Art Bible

## Core direction

CodeQuest uses polished hand-painted 2D fantasy art: realistic materials and lighting, simplified enough to remain readable during fast top-down combat. It is not pixel art, 3D, photorealistic, neon-heavy, or a mixture of unrelated styles.

## Camera and scale

- Orthographic top-down three-quarter camera, approximately 55–60 degrees.
- Characters share one ground anchor between their feet.
- Normal hero height on screen: 76–88 px at 1280×720.
- Adult NPCs use 95–110% of hero height; bosses may use 180–260%.
- A small house should fill roughly 280–360 px on screen.
- Object atlases use isolated cells with transparent padding; shadows stay within the cell.

## Lighting

- Main world light comes from the upper-left.
- Warm morning sunlight in Greenhaven, cool teal bounce from code magic.
- Soft ambient occlusion beneath roofs, feet, trees, rocks, and props.
- Magic effects may glow but must preserve silhouettes and UI readability.

## Palette language

- Greenhaven: forest green, warm oak, sandstone, muted red roofs, antique gold.
- Friendly code magic: restrained teal/cyan.
- Bug King corruption: bruised violet, crimson cracks, smoky black.
- Interactive objects: teal highlight plus a slow pulse, never continuous neon bloom.

## Character animation

| Animation | Frames | FPS | Loop |
| --- | ---: | ---: | --- |
| Idle | 4 | 6 | Yes |
| Walk | 4 | 8 | Yes |
| Run | 4–6 | 10 | Yes |
| Basic attack | 4 | 12 | No |
| Dash | 4 | 14 | No |
| Hit | 3–4 | 10 | No |
| Death | 4–6 | 8 | No |
| Spell cast | 4–6 | 10–12 | No |

Every sprite sheet keeps identity, costume, equipment, scale, camera, lighting, and ground anchor unchanged between frames.

## Environment construction

Buildings are split conceptually into collision base, roof/upper occlusion, and interactive details. The player may pass behind tall objects through depth sorting. Reusable ground tiles and decals form the terrain; buildings, trees, gates, props, and effects remain separate images.

## Asset status

- `hero-spritesheet-source.png`: hero idle, walk, sword attack, dash.
- `greenhaven-atlas-v1.png`: 16 village buildings and props.
- `elder-syntax-sheet-v1.png`: idle, walk, dialogue, code magic.
- `forest-slime-sheet-v1.png`: idle, hop, attack, hit/death.
- `blacksmith-forge-sheet-4x4.png`: idle, walk, forge work, hammer combat.
- `lady-type-sheet-4x4.png`: idle, walk, teaching, type-safe magic.
- `merchant-byte-sheet-4x4.png`: idle, walk, sales gestures, trade celebration.
- `greenhaven-terrain-tiles-4x4.png`: grass, path, courtyard, water, bank, mud, leaves, magic ground tiles.
- `greenhaven-villagers-4x4.png`: farmer, guard, academy student, herbalist walk cycles.

## Quality gate

Before integration, each raster asset must have an alpha channel, clean cell boundaries, consistent anchors, no labels or watermark, no cropped subject, and exact dimensions divisible by its grid size. Generated concepts that fail these checks remain source drafts and are not wired into Phaser.
