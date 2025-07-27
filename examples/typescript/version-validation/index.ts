import ffmpeg from '@ts-ffmpeg/fluent-ffmpeg'

async function getVersion () {
  return new Promise((resolve, reject) => {
    ffmpeg().addOption('-hide_banner').on('error', (error, stdout, stderr) => {
      if (error) return reject(error)

      if (stderr) console.log('stderr:', stderr)
      if (stdout) console.log('stdout:', stdout)
    }).on('end', (stdout, stderr) => {
      if (stderr) console.log('stderr:', stderr)
      if (stdout) console.log('stdout:', stdout)
      resolve(stdout || stderr)
    }).run()
  })
}

await getVersion().catch((err: Error) => {
  if (err.message.includes('No output specified')) {
    console.log('✅ Pass')
    return
  }
  console.log(err)
})
