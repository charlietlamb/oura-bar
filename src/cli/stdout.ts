import { Effect } from "effect";

export const writeStdout = (output: string) =>
  Effect.async<void>((resume) => {
    process.stdout.write(`${output}\n`, () => resume(Effect.void));
  });
