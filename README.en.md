# Wuwatappo Helper

[简体中文](README.md)

An unofficial Windows companion patch for Wuwa Tappo 1.0.5. Free and open source. For entertainment only. The creators accept no liability for its use.

## What's new in v1.0.5.5

- **Smaller full package (~80 MiB).** Deduplicated the embedded China (CN) and Global executables: the shared binary is stored once and the Global executable is reconstructed on demand from a SHA-256-verified binary delta, cutting the full download almost in half while keeping CN and Global sessions fully isolated.
- **Room notes and pinning.** Give rooms a local note or pin them in the full edition's room history. Pinned rooms remain available after they drop out of the 100 most recent visits. Each account has its own list.
- **Pet postcard.** Open **Pet postcard** under Atlas preview to export an 800×560 PNG postcard of the current outfit with a custom message and theme frame.
- **Theme hints.** Select the Aemeath, Denia or Phrolova theme to see a hint about one of its interactions.
- This update is optional. Check for it in the full edition under **Application and updates**, or download it from GitHub.

## What's new in v1.0.5.4

- Global sign-in can open provider pop-ups, including Google. The login window now includes help and a reload option.
- English login labels and messages wrap on narrow windows. The separate login window fits the available screen height.
- This update is optional. Check for it in the full edition under **Application and updates**, or download it from GitHub.

## What's new in v1.0.5.3

- **China and Global accounts.** In the full edition, open **Settings → Account and codes → Account region**. Select **China (CN)** or **Global** and confirm the restart. Each region keeps its own local sign-in session.
- **Global sign-in.** Choose **Sign in with KURO account**. The Helper opens the official KURO login page in a separate WebView2 window. After signing in, choose your game server and character. The Helper handles the callback inside that window and leaves the Windows `wuwa-buddy` registration untouched. Region selection is inspired by [WuwaTappoNative PR #1](https://github.com/DanielToyama/WuwaTappoNative/pull/1).
- **Language.** On first launch, choose **Simplified Chinese** or **English**. The dialog switches languages immediately, and the Helper remembers the choice when you confirm. Change it anytime under **Settings → Application and updates → Language**. KURO provides the account pages and online catalog.
- **Speech bubbles.** Built-in Denia and Phrolova TV dialogue switches with the interface language. Longer English lines wrap and stay visible longer. Mouse buttons use compact labels. Custom dialogue is shown as entered.
- **Start with Windows.** When you run a newer full Helper, it updates its existing sign-in task to launch the new EXE. Approve the Windows permission prompt if shown. This keeps the existing startup preference.

## Download and installation

The v1.0.5.5 release includes the full EXE, Lite EXE, setup, portable ZIP, SHA-256 checksums and three optional theme packs. [Download v1.0.5.5 on GitHub](https://github.com/Fantasicrap/Wuwatappo_Helper/releases/tag/v1.0.5.5)

Exit Wuwa Tappo from the Windows system tray before running the Helper. The single-file EXE does not require installation. Keep Microsoft Edge WebView2 Runtime installed.

| Edition | Features |
| --- | --- |
| Full | Quick actions, multiplayer controls, keyboard and controller displays, recording, local appearance previews, inventory images, optional themes and manual update checks |
| Lite | The original pet with local click top-up, optional automatic top-up, delayed chest claiming, and synthesis alerts |

## Features

- **Chests and synthesis.** Auto-open chests five seconds after they become available. Same-rarity and rarity-upgrade synthesis reminders have independent switches. Click a reminder to open the synthesis panel.
- **Input display and recording.** Use the 26-letter keyboard, the Wuthering Waves layout, a controller display, or compact speech bubbles. The game layout records 1/2/3, Q/E/R, Space and both mouse buttons. Controller calibration is available under Options. Export recordings as TXT.
- **Multiplayer.** Show only your own pet, hide individual players, rejoin previous rooms, and place pets horizontally, vertically or at saved positions.
- **Inventory and previews.** Export a PNG grouped by characters, accessories and emotes, with an inventory rarity chart and official reference rates. Collection previews change the appearance on this device. The emote bar has six slots.
- **Desktop controls.** Set a default monitor, configure shortcuts and input click-through, and choose whether input display controls remain visible beside the pet.

Recording TXT files and inventory PNGs use WebView2’s download location. Unless a different folder was selected, look in Windows **Downloads**.

## Themes

In the full edition, use **Settings → Interactions and emotes → Appearance themes → Import theme pack**. Choose the downloaded `.wttheme` file. The built-in theme uses the original warm colors.

| Theme | Features |
| --- | --- |
| Aemeath | Soft pink colors, Exostrider companion effects once Aemeath is equipped, and the Snowfluff music player. Select the counter star to open the player. |
| Denia | Pearl-violet colors, birthday cake, hand shadows, idle bubbles, paper figures and Lahai-Roi Blocks. Select the counter star to open the mini-game. |
| Phrolova | Crimson colors, Phrolova TV, alternate interactions and custom dialogue bindings. |

Each theme includes its own panel background setting. Theme-specific interactions stop when you switch themes, and their saved settings are restored when you return. Asset credits appear under **Panel background**.

The three included Aemeath tracks are distributed with permission. All rights remain with the creators and KURO GAMES. Contact the project through [GitHub Issues](https://github.com/Fantasicrap/Wuwatappo_Helper/issues) for rights-related requests.

## Build

On Windows, use the verified official Wuwa Tappo 1.0.5 executable, Node.js, pnpm, SDL3 and Inno Setup. See the [Chinese build instructions](README.md#从本地原件构建) for the source SHA-256 and the packaging command. Run the migration checks with `pnpm test:migration` after building.

The original software, characters and assets belong to their respective rights holders. This project is independent of KURO GAMES.
