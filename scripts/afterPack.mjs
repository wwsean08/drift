import { execSync } from 'child_process'

export default async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return

  const { appOutDir, packager } = context
  const appPath = `${appOutDir}/${packager.appInfo.productFilename}.app`

  console.log(`Ad-hoc signing: ${appPath}`)
  execSync(`codesign --deep --force --sign - "${appPath}"`, { stdio: 'inherit' })
}
