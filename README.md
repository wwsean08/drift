# Drift

Drift is a desktop application that automatically transcodes video files using [HandBrakeCLI](https://handbrake.fr). Point it at a folder, choose a preset, and Drift will watch for new video files and encode them in the background.

![](/docs/queue.png)

## Features

- **Watch folder** — monitors a directory for new video files and automatically queues them for encoding
- **Parallel encoding** — run up to 8 encodes simultaneously
- **HandBrake presets** — use any built-in HandBrake preset or import your own custom presets
- **System tray** — minimizes to the tray so encoding continues in the background
- **Crash recovery** — if the app is interrupted, in-progress items are re-queued on next launch
- **Pause/resume** — pause the queue at any time without losing your place

## Prerequisites

- **[HandBrakeCLI](https://handbrake.fr/downloads2.php)** — Drift does not bundle HandBrakeCLI; you must install it separately

### Installing HandBrakeCLI

#### macOS

Download the CLI from the [HandBrake downloads page](https://handbrake.fr/downloads2.php) and either add it to your `PATH` or set the path in Drift's settings..

#### Windows

Download the CLI from the [HandBrake downloads page](https://handbrake.fr/downloads2.php) and either add it to your `PATH` or set the path in Drift's settings.

#### Linux
See the instructions for installing the CLI on Linux [here](https://handbrake.fr/docs/en/1.9.0/get-handbrake/download-and-install.html).

## Installation

Download the latest release for your platform from the [Releases](https://github.com/wwsean08/drift/releases) page.

## Getting Started

1. **Launch Drift** — on first launch you may see an error banner if HandBrakeCLI is not detected. That's expected before configuration.

2. **Open the Settings tab** and configure:

    ![](/docs/settings.png)

   - **Watch Directory** — the folder Drift will monitor for new video files
   - **Output Directory** — where encoded files will be saved
   - **HandBrakeCLI Path** — leave empty if `HandBrakeCLI` is already in your `PATH`, otherwise browse to the binary
   - **HandBrake Preset** — type to search through all built-in presets (default: `Fast 1080p30`), or import a custom preset JSON exported from HandBrake GUI
   - **Max Parallel Encodes** — how many files to encode at once (1-8)
   - **Video Extensions** — comma-separated list of file extensions to watch (default: `.mp4, .mkv, .avi, .mov, .wmv, .flv, .webm, .m4v, .ts`)
   - **Queue Existing Files** — check this to queue files already in the watch directory when the watcher starts

   Click **Save Settings** when done.

3. **Drop video files** into your watch directory. They will appear in the **Queue tab** and begin encoding automatically.

4. **Manage the queue** from the Queue tab:
   - **Pause / Resume** — temporarily stop encoding
   - **Clear Completed** — remove finished items from the list
   - **Retry** — re-queue a failed item
   - **Remove** — delete an item from the queue

5. **Close the window** to minimize Drift to the system tray. Encoding continues in the background. Click the tray icon to restore the window.

## License

[MIT](LICENSE.md) — Copyright Sean Smith 2026
