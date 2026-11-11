import { prisma } from "@/lib/db";
import TtsSettingsForm from "@/app/admin/tts/settingsForm";
import { Card, PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminTtsPage() {
  const setting =
    (await prisma.appSetting.findUnique({ where: { id: 1 } })) ??
    (await prisma.appSetting.create({ data: { id: 1 } }));

  return (
    <div>
      <PageHeader
        title="Cấu hình giọng đọc (TTS)"
        description="Dùng cho trang chủ khi có công đức mới (SSE)"
        crumbs={[{ label: "Quản trị", href: "/admin/cong-duc" }, { label: "Giọng đọc" }]}
      />

      <Card className="max-w-4xl">
        <TtsSettingsForm
          initial={{
            ttsEnabled: setting.ttsEnabled,
            ttsProvider: setting.ttsProvider,
            fptVoice: setting.fptVoice,
            fptSpeed: setting.fptSpeed,
            fptFormat: setting.fptFormat === "wav" ? "wav" : "mp3",
          }}
        />
      </Card>
    </div>
  );
}
