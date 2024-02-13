// this is typically an instance of TextDecoder
export interface UTF8Decoder {
    decode(
        input: Uint8Array,
        options?: {
            stream?: boolean | undefined
        }
    ): string
}

export interface UTF8Encoder {
    encode(input: string): Uint8Array
}

export enum LogLevel {
    Verbose = 1,
    Info = 2,
    Warn = 3,
    Error = 4,
}

export interface OAIToken {
    url: string
    token: string
    isOpenAI?: boolean
    isTGI?: boolean
    source?: string
}

export interface ReadFileOptions {
    virtual?: boolean
}

export interface ShellOutput {
    stdout?: string
    stderr?: string
    output?: string
    exitCode: number
    failed: boolean
}

export interface ShellCallOptions {
    cwd?: string
    timeout?: number
    stdin?: string
    outputdir: string
    stdinfile: string
    stdoutfile: string
    stderrfile: string
    exitcodefile: string
}

export interface Host {
    userState: any

    path: Path
    createUTF8Decoder(): UTF8Decoder
    createUTF8Encoder(): UTF8Encoder
    projectFolder(): string
    installFolder(): string
    resolvePath(...segments: string[]): string

    // read a secret from the environment or a .env file
    readSecret(name: string): Promise<string | undefined>
    getSecretToken(): Promise<OAIToken | undefined>
    setSecretToken(tok: OAIToken): Promise<void>
    askToken(): Promise<string>

    log(level: LogLevel, msg: string): void

    // fs
    readFile(name: string, options?: ReadFileOptions): Promise<Uint8Array>
    writeFile(name: string, content: Uint8Array): Promise<void>
    deleteFile(name: string): Promise<void>
    findFiles(glob: string): Promise<string[]>

    clearVirtualFiles(): void
    setVirtualFile(name: string, content: string): void
    isVirtualFile(name: string): boolean

    // This has mkdirp-semantics (parent directories are created and existing ignored)
    createDirectory(name: string): Promise<void>
    deleteDirectory(name: string): Promise<void>

    // executes a process
    exec(
        command: string,
        args: string[],
        options: ShellCallOptions
    ): Promise<Partial<ShellOutput>>
}

export let host: Host

export function setHost(h: Host) {
    host = h
}
