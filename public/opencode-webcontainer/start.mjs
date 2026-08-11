/**
 * OpenCode WebContainer startup script
 * Starts the OpenCode server with Zen API provider
 */

const { execSync } = await import("child_process")
const { readFileSync } = await import("fs")
const { createServer } = await import("net")

const PORT = 4096

async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = createServer()
    server.once("error", () => resolve(false))
    server.once("listening", () => {
      server.close()
      resolve(true)
    })
    server.listen(port, "0.0.0.0")
  })
}

async function waitForPort(port, timeout = 15000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (!(await isPortAvailable(port))) return true
    await new Promise((r) => setTimeout(r, 500))
  }
  return false
}

async function main() {
  console.log("Starting OpenCode WebContainer...")

  // Ensure port is available
  const portOpen = await isPortAvailable(PORT)
  if (!portOpen) {
    console.log(`Port ${PORT} already in use, waiting...`)
    const freed = await waitForPort(PORT)
    if (!freed) {
      console.error(`Port ${PORT} could not be freed`)
      process.exit(1)
    }
  }

  // Start OpenCode
  try {
    execSync(`npx opencode serve --port ${PORT} --hostname 0.0.0.0`, {
      stdio: "inherit",
      env: {
        ...process.env,
        OPENCODE_HOME: process.cwd(),
        OPENCODE_CONFIG: `${process.cwd()}/opencode.json`,
      },
    })
  } catch (err) {
    // Try running from the installed package
    try {
      execSync(`node node_modules/opencode/bin/opencode serve --port ${PORT} --hostname 0.0.0.0`, {
        stdio: "inherit",
        env: {
          ...process.env,
          OPENCODE_HOME: process.cwd(),
          OPENCODE_CONFIG: `${process.cwd()}/opencode.json`,
        },
      })
    } catch (innerErr) {
      console.error("Failed to start OpenCode:", innerErr)
      process.exit(1)
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
