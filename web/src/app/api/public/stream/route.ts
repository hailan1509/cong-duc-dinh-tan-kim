import { subscribe } from "@/lib/sseBus";

export const dynamic = "force-dynamic";

function sseFormat(event: { type: string; data: unknown }) {
  const data = JSON.stringify(event.data ?? null);
  return `event: ${event.type}\ndata: ${data}\n\n`;
}

export async function GET(req: Request) {
  const encoder = new TextEncoder();

  let closed = false;
  let unsubscribeFn: (() => void) | undefined;
  let keepAliveTimer: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const abort = () => {
        if (closed) return;
        closed = true;
        clearInterval(keepAliveTimer);
        unsubscribeFn?.();
        try {
          controller.close();
        } catch {
          // ignore — already closed
        }
      };

      const safeEnqueue = (chunk: Uint8Array) => {
        if (closed) return;
        try {
          controller.enqueue(chunk);
        } catch {
          abort();
        }
      };

      safeEnqueue(encoder.encode(`: connected ${Date.now()}\n\n`));

      unsubscribeFn = subscribe((evt) => {
        safeEnqueue(encoder.encode(sseFormat(evt)));
      });

      keepAliveTimer = setInterval(() => {
        safeEnqueue(encoder.encode(`: keep-alive ${Date.now()}\n\n`));
      }, 15000);

      req.signal.addEventListener("abort", abort);
    },
    cancel() {
      closed = true;
      clearInterval(keepAliveTimer);
      unsubscribeFn?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
