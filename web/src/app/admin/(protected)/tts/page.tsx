import { prisma } from "@/lib/db";
import TtsSettingsForm from "@/app/admin/tts/settingsForm";

export const dynamic = "force-dynamic";

export default async function AdminTtsPage() {
  const setting =
    (await prisma.appSetting.findUnique({ where: { id: 1 } })) ??
    (await prisma.appSetting.create({ data: { id: 1 } }));

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Cấu hình giọng đọc (TTS)</div>
            <div className="text-sm text-slate-600">Dùng cho trang chủ khi có công đức mới (SSE)</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <TtsSettingsForm
          initial={{
            ttsEnabled: setting.ttsEnabled,
            ttsProvider: setting.ttsProvider,
            fptVoice: setting.fptVoice,
            fptSpeed: setting.fptSpeed,
            fptFormat: setting.fptFormat === "wav" ? "wav" : "mp3",
          }}
        />
      </div>
    </div>
  );
}

