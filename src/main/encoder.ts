import hbjs from 'handbrake-js'
import path from 'path'
import { ChildProcess } from 'child_process'

interface EncodeCallbacks {
  onProgress: (id: string, percent: number, eta: string) => void
  onComplete: (id: string) => void
  onError: (id: string, message: string) => void
}

const activeJobs = new Map<string, ChildProcess>()

export function startEncode(
  id: string,
  inputPath: string,
  outputDir: string,
  preset: string,
  callbacks: EncodeCallbacks,
  handbrakeCliPath?: string
): void {
  const baseName = path.basename(inputPath, path.extname(inputPath))
  const outputPath = path.join(outputDir, `${baseName}.m4v`)

  const spawnOptions: Record<string, string> = {
    input: inputPath,
    output: outputPath,
    preset
  }
  if (handbrakeCliPath) {
    spawnOptions.HandbrakeCLIPath = handbrakeCliPath
  }

  const process = hbjs.spawn(spawnOptions)

  activeJobs.set(id, process)

  process.on('progress', (progress) => {
    callbacks.onProgress(id, progress.percentComplete, progress.eta || '')
  })

  process.on('complete', () => {
    activeJobs.delete(id)
    callbacks.onComplete(id)
  })

  process.on('error', (err) => {
    activeJobs.delete(id)
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
