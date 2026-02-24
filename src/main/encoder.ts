import hbjs from 'handbrake-js'
import path from 'path'
import fs from 'fs'
import os from 'os'
import crypto from 'crypto'
import { execFile } from 'child_process'
import { MediaInfo } from './store'

interface EncodeCallbacks {
  onProgress: (id: string, percent: number, eta: string) => void
  onComplete: (id: string, outputPath: string) => void
  onError: (id: string, message: string) => void
}

interface HandbrakeProcess {
  cancel(): void
}

const activeJobs = new Map<string, HandbrakeProcess>()
const tempFiles = new Map<string, string>()
const canceledIds = new Set<string>()

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

  let errored = false

  process.on('progress', (progress) => {
    callbacks.onProgress(id, progress.percentComplete, progress.eta || '')
  })

  process.on('complete', () => {
    if (errored) return
    activeJobs.delete(id)
    cleanupTemp()
    callbacks.onComplete(id, outputPath)
  })

  process.on('error', (err) => {
    errored = true
    activeJobs.delete(id)
    cleanupTemp()
    if (!canceledIds.has(id)) {
      callbacks.onError(id, err?.message || 'Unknown encoding error')
    }
    canceledIds.delete(id)
  })
}

export function cancelEncode(id: string): void {
  const process = activeJobs.get(id)
  if (process) {
    canceledIds.add(id)
    process.cancel()
    activeJobs.delete(id)
  }
}

export function getActiveJobCount(): number {
  return activeJobs.size
}

export function parseScanOutput(stderr: string, filePath: string): MediaInfo {
  const durationMatch = stderr.match(/\+ duration: (\d+:\d+:\d+)/)
  const duration = durationMatch ? durationMatch[1] : '0:00:00'

  const sizeMatch = stderr.match(/\+ size: (\d+)x(\d+)/)
  const width = sizeMatch ? parseInt(sizeMatch[1], 10) : 0
  const height = sizeMatch ? parseInt(sizeMatch[2], 10) : 0

  const codecMatch = stderr.match(/codec:\s*(\w+)/i)
  const rawCodec = codecMatch ? codecMatch[1].toLowerCase() : ''
  const codecMap: Record<string, string> = {
    h264: 'H.264',
    avc: 'H.264',
    h265: 'HEVC',
    hevc: 'HEVC',
    mpeg4v: 'MPEG-4',
    mpeg4: 'MPEG-4',
    vp9: 'VP9',
    vp8: 'VP8',
    av1: 'AV1',
    mpeg2: 'MPEG-2'
  }
  const videoCodec = codecMap[rawCodec] ?? ''

  const audioSectionMatch = stderr.match(
    /\+ audio tracks:([\s\S]*?)(?=\n\s+\+ subtitle tracks:|\n\s+\+ chapters:|\n\n|$)/
  )
  const audioTracks: string[] = []
  if (audioSectionMatch) {
    const trackRegex = /\+\s*\d+,\s*.+?\(([^)]+)\)\s*\(([^)]+)\s*ch\)/g
    let m
    while ((m = trackRegex.exec(audioSectionMatch[1])) !== null) {
      audioTracks.push(`${m[1]} ${m[2]}`)
    }
  }

  const subtitleSectionMatch = stderr.match(
    /\+ subtitle tracks:([\s\S]*?)(?=\n\s{2,4}\+ [a-z]|\n\n|$)/
  )
  let subtitleCount = 0
  if (subtitleSectionMatch) {
    const matches = subtitleSectionMatch[1].match(/\+\s*\d+,/g)
    subtitleCount = matches ? matches.length : 0
  }

  let fileSize = 0
  try {
    fileSize = fs.statSync(filePath).size
  } catch {
    // ignore
  }

  return { width, height, duration, videoCodec, audioTracks, subtitleCount, fileSize }
}

export function scanFile(filePath: string, handbrakeCliPath?: string): Promise<MediaInfo | null> {
  return new Promise((resolve) => {
    const cliPath = handbrakeCliPath || 'HandBrakeCLI'
    execFile(
      cliPath,
      ['-i', filePath, '--scan', '--title', '0'],
      { timeout: 30000 },
      (_error, _stdout, stderr) => {
        try {
          resolve(parseScanOutput(stderr, filePath))
        } catch {
          resolve(null)
        }
      }
    )
  })
}
