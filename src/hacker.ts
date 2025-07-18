// overwrite uni-cli-shared utils normalizePagePath
import { parse, resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { isApp, platform, inputDir as uniInputDir } from '@uni-helper/uni-env'

function importCJSCompatible(modulePath: string) {
  const url = typeof import.meta?.url === 'string' ? import.meta.url : __filename

  const _require = createRequire(url)
  const module = _require(modulePath)

  return module.default ?? module
}

const uniUtils = importCJSCompatible('@dcloudio/uni-cli-shared/dist/utils.js')
const uniResolve = importCJSCompatible('@dcloudio/uni-cli-shared/dist/resolve.js')
const constants = importCJSCompatible('@dcloudio/uni-cli-shared/dist/constants.js')

// 解决 MP 和 APP 平台页面文件不存在时不继续执行的问题
// @ts-expect-error ignore
uniUtils.normalizePagePath = function (pagePath, platform) {
  const absolutePagePath = resolve(uniInputDir, pagePath)
  let extensions = constants.PAGE_EXTNAME
  if (isApp)
    extensions = constants.PAGE_EXTNAME_APP

  for (let i = 0; i < extensions.length; i++) {
    const extname = extensions[i]

    if (existsSync(absolutePagePath + extname))
      return pagePath + extname

    const withPlatform = `${absolutePagePath}.${platform}${extname}`
    if (existsSync(withPlatform))
      return pagePath + extname
  }
  console.error(`${pagePath} not found`)
}

// 解决非页面文件不存在时无法 resolve 的问题
const requireResolve = uniResolve.requireResolve
// @ts-expect-error ignore
uniResolve.requireResolve = function (filename, basedir) {
  try {
    return requireResolve(filename, basedir)
  }
  catch (error) {
    const { ext, base, dir } = parse(filename)
    filename = `${dir}/${base}.${platform}${ext ? `.${ext}` : ''}`
    return requireResolve(filename, basedir)
  }
}
