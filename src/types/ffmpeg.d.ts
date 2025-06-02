declare module '@ffmpeg/ffmpeg' {
  export class FFmpeg {
    loaded: boolean

    load(options: {
      coreURL: string
      wasmURL: string
    }): Promise<void>

    exec(command: string[]): Promise<void>
    writeFile(name: string, data: Uint8Array): Promise<void>
    readFile(name: string): Promise<Uint8Array>
  }
}

declare module '@ffmpeg/util' {
  export function toBlobURL(url: string, type: string): Promise<string>
}
