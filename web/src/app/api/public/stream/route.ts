import { subscribe } from "@/lib/sseBus";

export const dynamic = "force-dynamic";

function sseFormat(event: { type: string; data: unknown }) {
  const data = JSON.stringify(event.data ?? null);
  return `event: ${event.type}\ndata: ${data}\n\n`;
}

export async function GET(req: Request) {
  const encoder = new TextEncoder();

  let closed = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Initial ping so client knows it is connected
      controller.enqueue(encoder.encode(`: connected ${Date.now()}\n\n`));

      const unsubscribe = subscribe((evt) => {
        if (closed) return;
        controller.enqueue(encoder.encode(sseFormat(evt)));
      });

      const keepAlive = setInterval(() => {
        if (closed) return;
        controller.enqueue(encoder.encode(`: keep-alive ${Date.now()}\n\n`));
      }, 15000);

      const abort = () => {
        if (closed) return;
        closed = true;
        clearInterval(keepAlive);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // ignore
        }
      };

      // Close when client disconnects
      req.signal.addEventListener("abort", abort);
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Helps if behind proxies
      "X-Accel-Buffering": "no",
    },
  });
}

