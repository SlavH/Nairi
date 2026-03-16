/**
 * Streaming Response Optimization (Phase 38)
 * Optimizes streaming performance and error recovery
 */
export interface StreamChunk {
  type: "text" | "error" | "done";
  content?: string;
  error?: string;
}

export class StreamingOptimizer {
  private static readonly CHUNK_BUFFER_SIZE = 10;
  private static readonly MAX_RETRIES = 3;

  /**
   * Optimize stream with buffering
   */
  static async *optimizeStream(
    stream: AsyncIterable<string>
  ): AsyncGenerator<StreamChunk> {
    const buffer: string[] = [];
    let errorCount = 0;

    try {
      for await (const chunk of stream) {
        buffer.push(chunk);

        // Flush buffer when full
        if (buffer.length >= this.CHUNK_BUFFER_SIZE) {
          yield {
            type: "text",
            content: buffer.join(""),
          };
          buffer.length = 0;
        }
      }

      // Flush remaining buffer
      if (buffer.length > 0) {
        yield {
          type: "text",
          content: buffer.join(""),
        };
      }

      yield { type: "done" };
    } catch (error) {
      errorCount++;
      if (errorCount < this.MAX_RETRIES) {
        // Retry logic would go here
        yield {
          type: "error",
          error: error instanceof Error ? error.message : "Stream error",
        };
      } else {
        yield {
          type: "error",
          error: "Max retries exceeded",
        };
      }
    }
  }

  /**
   * Add progress indicators to stream
   */
  static async *addProgressIndicators(
    stream: AsyncIterable<string>,
    totalEstimate?: number
  ): AsyncGenerator<StreamChunk & { progress?: number }> {
    let received = 0;

    for await (const chunk of this.optimizeStream(stream)) {
      if (chunk.type === "text" && chunk.content) {
        received += chunk.content.length;
        const progress = totalEstimate
          ? Math.min(100, Math.round((received / totalEstimate) * 100))
          : undefined;

        yield {
          ...chunk,
          progress,
        };
      } else {
        yield chunk;
      }
    }
  }
}
