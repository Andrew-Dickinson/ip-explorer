import { Client } from "ssh2"

interface SshConnectionOptions {
  host: string
  port?: number
  username: string
  password: string
  timeoutMs?: number
  readyTimeoutMs?: number
}

/**
 * A class for managing SSH connections and executing commands
 */
export class SshClient {
  private client: Client
  private connected = false
  private options: SshConnectionOptions

  /**
   * Creates a new SSH client
   * @param options Connection options
   */
  constructor(options: SshConnectionOptions) {
    this.client = new Client()
    this.options = {
      port: 22,
      timeoutMs: 15000,
      readyTimeoutMs: 10000,
      ...options,
    }
  }

  /**
   * Connects to the SSH server
   * @returns A promise that resolves when connected
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return
    }

    return new Promise<void>((resolve, reject) => {
      // Set up a timeout
      const timeout = setTimeout(() => {
        this.client.removeAllListeners()
        reject(new Error(`SSH connection to ${this.options.host} timed out after ${this.options.timeoutMs}ms`))
      }, this.options.timeoutMs)

      // Set up event handlers
      this.client.once("ready", () => {
        clearTimeout(timeout)
        this.connected = true
        resolve()
      })

      this.client.once("error", (err) => {
        clearTimeout(timeout)
        this.connected = false
        reject(err)
      })

      // Connect to the server
      this.client.connect({
        host: this.options.host,
        port: this.options.port,
        username: this.options.username,
        password: this.options.password,
        readyTimeout: this.options.readyTimeoutMs,
        // Disable strict host key checking for this example
        // In production, you should use proper host key verification
        algorithms: {
          serverHostKey: ["ssh-rsa", "ssh-dss", "ecdsa-sha2-nistp256", "ecdsa-sha2-nistp384", "ecdsa-sha2-nistp521"],
        },
      })
    })
  }

  /**
   * Executes a command on the SSH server
   * @param command The command to execute
   * @returns The command output as a string
   */
  async executeCommand(command: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.client.exec(command, (err, stream) => {
        if (err) {
          return reject(err)
        }

        let dataBuffer = ""
        let errorBuffer = ""

        stream.on("data", (data: Buffer) => {
          dataBuffer += data.toString()
        })

        stream.stderr.on("data", (data: Buffer) => {
          errorBuffer += data.toString()
        })

        stream.on("close", (code: number) => {
          if (code !== 0 && errorBuffer) {
            reject(new Error(`Command failed with code ${code}: ${errorBuffer}`))
          } else {
            resolve(dataBuffer)
          }
        })

        stream.on("error", (err: never) => {
          reject(err)
        })
      })
    })
  }

  /**
   * Disconnects from the SSH server
   */
  disconnect(): void {
    if (this.connected) {
      try {
        this.client.end()
      } catch {
        // Ignore errors when closing the connection
      } finally {
        this.connected = false
      }
    }
  }

}

