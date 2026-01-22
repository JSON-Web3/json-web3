import fs from 'fs-extra'
;(async () => {
  fs.outputJSONSync(
    './package.json',
    JSON.parse(
      JSON.stringify({
        ...fs.readJsonSync('./package.json'),
        devDependencies: undefined,
        scripts: undefined,
        type: undefined,
        packageManager: undefined,
        engines: undefined,
        pnpm: undefined,
        publishConfig: undefined,
      }),
    ),
    { spaces: 2 },
  )
})()
