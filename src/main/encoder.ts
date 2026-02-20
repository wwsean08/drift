import hbjs from 'handbrake-js'
import path from 'path'
import fs from 'fs'
import os from 'os'
import crypto from 'crypto'
import { ChildProcess } from 'child_process'

interface EncodeCallbacks {
  onProgress: (id: string, percent: number, eta: string) => void
  onComplete: (id: string, outputPath: string) => void
  onError: (id: string, message: string) => void
}

const activeJobs = new Map<string, ChildProcess>()
const tempFiles = new Map<string, string>()

function buildMergedPresetFile(customPresetPaths: string[]): string | null {
  const allPresets: unknown[] = []
  for (const p of customPresetPaths) {
    try {
      const data = JSON.parse(fs.readFileSync(p, 'utf-8'))
      if (Array.isArray(data?.PresetList)) {
        allPresets.push(...data.PresetList)
      }
    } catch {
      // skip unreadable files
    }
  }
  if (allPresets.length === 0) return null

  const tmpPath = path.join(os.tmpdir(), `drift-presets-${crypto.randomUUID()}.json`)
  fs.writeFileSync(tmpPath, JSON.stringify({ PresetList: allPresets }))
  return tmpPath
}

export function startEncode(
  id: string,
  inputPath: string,
  outputDir: string,
  preset: string,
  callbacks: EncodeCallbacks,
  handbrakeCliPath?: string,
  customPresetPaths?: string[],
  outputFormat: 'm4v' | 'mp4' | 'mkv' | 'webm' = 'm4v'
): void {
  const baseName = path.basename(inputPath, path.extname(inputPath))
  const outputPath = path.join(outputDir, `${baseName}.${outputFormat}`)

  const spawnOptions: Record<string, string> = {
    input: inputPath,
    output: outputPath,
    preset
  }
  if (handbrakeCliPath) {
    spawnOptions.HandbrakeCLIPath = handbrakeCliPath
  }

  if (customPresetPaths && customPresetPaths.length > 0) {
    const tmpPath = buildMergedPresetFile(customPresetPaths)
    if (tmpPath) {
      spawnOptions['preset-import-file'] = tmpPath
      tempFiles.set(id, tmpPath)
    }
  }

  const cleanupTemp = (): void => {
    const tmp = tempFiles.get(id)
    if (tmp) {
      try {
        fs.unlinkSync(tmp)
      } catch {
        // ignore
      }
      tempFiles.delete(id)
    }
  }

  const process = hbjs.spawn(spawnOptions)

  activeJobs.set(id, process)

  process.on('progress', (progress) => {
    callbacks.onProgress(id, progress.percentComplete, progress.eta || '')
  })

  process.on('complete', () => {
    activeJobs.delete(id)
    cleanupTemp()
    callbacks.onComplete(id, outputPath)
  })

  process.on('error', (err) => {
    activeJobs.delete(id)
    cleanupTemp()
    callbacks.onError(id, err?.message || 'Unknown encoding error')
  })
}

export function cancelEncode(id: string): void {
  const process = activeJobs.get(id)
  if (process) {
    process.kill()
    activeJobs.delete(id)
  }
}

export function getActiveJobCount(): number {
  return activeJobs.size
}
