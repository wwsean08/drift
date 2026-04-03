import hbjs from 'handbrake-js'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import crypto from 'node:crypto'
import { execFile } from 'node:child_process'
import { MediaInfo } from './store'

interface EncodeCallbacks {
  onProgress: (id: string, percent: number, eta: string) => void
  onComplete: (id: string, outputPath: string) => void
  onError: (id: string, message: string) => void
}

interface EncodeOptions {
  outputDir: string
  preset: string
  handbrakeCliPath?: string
  customPresetPaths?: string[]
  outputFormat?: 'm4v' | 'mp4' | 'mkv' | 'webm'
  outputFilenameTemplate?: string
  mediaInfo?: MediaInfo | null
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

function resolveDateTokens(template: string, inputPath: string): string {
  try {
    const stat = fs.statSync(inputPath)
    const btime = stat.birthtime.getTime() === 0 ? stat.mtime : stat.birthtime
    const pad = (n: number): string => String(n).padStart(2, '0')
    const dateStr = `${btime.getFullYear()}-${pad(btime.getMonth() + 1)}-${pad(btime.getDate())}`
    const timeStr = `${pad(btime.getHours())}-${pad(btime.getMinutes())}-${pad(btime.getSeconds())}`
    return template
      .replaceAll('{creation_date}', dateStr)
      .replaceAll('{creation_datetime}', `${dateStr}_${timeStr}`)
  } catch {
    return template.replaceAll('{creation_date}', '').replaceAll('{creation_datetime}', '')
  }
}

function resolveMediaTokens(template: string, mediaInfo: MediaInfo | null | undefined): string {
  if (!mediaInfo) {
    return template
      .replaceAll('{resolution}', '')
      .replaceAll('{width}', '')
      .replaceAll('{height}', '')
      .replaceAll('{duration}', '')
  }
  const { width, height, duration } = mediaInfo
  let resolution = ''
  if (height >= 2160) resolution = '4K'
  else if (height >= 1440) resolution = '1440p'
  else if (height >= 1080) resolution = '1080p'
  else if (height >= 720) resolution = '720p'
  else if (height >= 480) resolution = '480p'
  else if (height > 0) resolution = `${height}p`
  return template
    .replaceAll('{resolution}', resolution)
    .replaceAll('{width}', width > 0 ? String(width) : '')
    .replaceAll('{height}', height > 0 ? String(height) : '')
    .replaceAll('{duration}', duration ? duration.replaceAll(':', '-') : '')
}

export function resolveFilenameTemplate(
  template: string,
  inputPath: string,
  mediaInfo: MediaInfo | null | undefined
): string {
  const originalBaseName = path.basename(inputPath, path.extname(inputPath))

  // Resolve all tokens EXCEPT {name} first, so a filename that itself contains a token
  // string (e.g. "movie_{resolution}.mkv") is never double-expanded into the output.
  let result = resolveDateTokens(template, inputPath)
  result = resolveMediaTokens(result, mediaInfo)

  // Drop unrecognised {token} placeholders, but preserve {name} for last-step substitution
  result = result.replaceAll(/\{[^}]*\}/g, (m) => (m === '{name}' ? m : ''))

  // Sanitize filesystem-unsafe chars (including null byte); collapse duplicate separators; trim edges
  result = result
    .replaceAll(/[<>:"/\\|?*\0]/g, '')
    .replaceAll(/[-_.\s]{2,}/g, '_')
    .trim()
    .replace(/^[-_.]+/, '')
  result = result.replace(/[-_.]+$/, '')

  // Substitute {name} last so the original basename is never scanned for tokens above.
  // Sanitize the basename itself so unsafe chars from the source filename don't bypass the pass above.
  const safeBaseName = originalBaseName.replaceAll(/[<>:"/\\|?*\0]/g, '')
  result = result.replaceAll('{name}', safeBaseName)

  // Guard against Windows reserved device names (CON, NUL, PRN, AUX, COM1–9, LPT1–9)
  if (/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i.test(result)) {
    result = `${result}_`
  }

  return result || safeBaseName || originalBaseName
}

export function startEncode(
  id: string,
  inputPath: string,
  options: EncodeOptions,
  callbacks: EncodeCallbacks
): void {
  const { outputDir, preset, handbrakeCliPath, customPresetPaths, outputFormat = 'm4v' } = options
  const baseName = resolveFilenameTemplate(
    options.outputFilenameTemplate || '{name}',
    inputPath,
    options.mediaInfo ?? null
  )
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
  const durationMatch = /\+ duration: (\d+:\d+:\d+)/.exec(stderr)
  const duration = durationMatch ? durationMatch[1] : '0:00:00'

  const sizeMatch = /\+ size: (\d+)x(\d+)/.exec(stderr)
  const width = sizeMatch ? Number.parseInt(sizeMatch[1], 10) : 0
  const height = sizeMatch ? Number.parseInt(sizeMatch[2], 10) : 0

  const codecMatch = /codec:\s*(\w+)/i.exec(stderr)
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

  const audioSectionMatch =
    /\+ audio tracks:([\s\S]*?)(?=\n\s+\+ subtitle tracks:|\n\s+\+ chapters:|\n\n|$)/.exec(stderr)
  const audioTracks: string[] = []
  if (audioSectionMatch) {
    const trackRegex = /\+\s*\d+,\s*.+?\(([^)]+)\)\s*\(([^)]+)\s*ch\)/g
    let m
    while ((m = trackRegex.exec(audioSectionMatch[1])) !== null) {
      audioTracks.push(`${m[1]} ${m[2]}`)
    }
  }

  const subtitleSectionMatch = /\+ subtitle tracks:([\s\S]*?)(?=\n\s{2,4}\+ [a-z]|\n\n|$)/.exec(
    stderr
  )
  let subtitleCount = 0
  if (subtitleSectionMatch) {
    const countRegex = /\+\s*\d+,/g
    while (countRegex.exec(subtitleSectionMatch[1]) !== null) {
      subtitleCount++
    }
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
