import { Readable } from "stream";
import { SdkStreamMixin } from "@aws-sdk/types";

export default class MockReadableStream extends Readable implements SdkStreamMixin {
    constructor(data: string) {
      super();
      this.push(data);
      this.push(null);
    }

    transformToByteArray(): Promise<Uint8Array> {
      return Promise.resolve(Buffer.from(this.read()));
    }

    transformToString(): Promise<string> {
      return Promise.resolve(this.read().toString());
    }

    transformToWebStream(): ReadableStream<Uint8Array> {
      return new ReadableStream({
        start: (controller) => {
          this.on("data", (chunk) => controller.enqueue(chunk));
          this.on("end", () => controller.close());
        },
      });
    }
  }