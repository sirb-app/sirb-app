import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { teamMembers } from "@/lib/team-data";
import type { Metadata } from "next";
import { SiLinkedin } from "react-icons/si";

export const metadata: Metadata = {
  title: "فريق سرب | سرب",
  description: "تعرف على فريق سرب - المؤسسون والمطورون",
};

export default function TeamPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-3xl font-bold">فريق سرب</h1>
        <p className="text-muted-foreground mx-auto max-w-lg">
          نحن مجموعة من الطلاب المتحمسين لتحسين تجربة التعلم الجامعي ومساعدة
          الطلاب على النجاح في مسيرتهم الأكاديمية
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {teamMembers.map(member => (
          <Card key={member.name} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {member.imageUrl && <AvatarImage src={member.imageUrl} />}
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {member.name
                      .split(" ")
                      .map(n => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-semibold">
                    {member.name}
                  </h3>
                  <p className="text-muted-foreground text-sm">{member.role}</p>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary mt-2 inline-flex items-center gap-1.5 text-sm hover:underline"
                  >
                    <SiLinkedin className="h-4 w-4" />
                    LinkedIn
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
