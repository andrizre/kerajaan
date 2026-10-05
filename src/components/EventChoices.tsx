"use client";

import { ActionButton } from "@/components/ActionButton";

const EVENT_TEXT: Record<string, { title: string; body: string }> = {
  kemarau: {
    title: "Kemarau panjang",
    body: "Hujan tak turun selama sebulan. Ladang mulai retak, dan para petani menatap langit setiap pagi. Buka irigasi memakan kayu; berdoa tidak menjanjikan apa pun.",
  },
  pedagang: {
    title: "Pedagang keliling",
    body: "Seorang pedagang menawarkan karung makanan dengan harga yang, menurutnya, 'tak akan terulang'. Karungnya memang tampak penuh.",
  },
  pemberontakan: {
    title: "Keluhan di pasar",
    body: "Sekelompok rakyat berkumpul memprotes pajak. Suara mereka meninggi. Kamu bisa menekan, atau mengampuni dan menurunkan pajak.",
  },
};

export default function EventChoices({ eventId, choices }: { eventId: string; choices: { id: string; label: string }[] }) {
  const ev = EVENT_TEXT[eventId];
  if (!ev) return null;
  return (
    <section className="card p-4">
      <h2 className="font-title text-lg"><span className="rubric">{ev.title.charAt(0)}</span>{ev.title.slice(1)}</h2>
      <p className="mt-1 text-sm leading-relaxed">{ev.body}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {choices.map((c) => (
          <ActionButton key={c.id} action="resolve_event" payload={{ choiceId: c.id }}>
            {c.label}
          </ActionButton>
        ))}
      </div>
    </section>
  );
}
