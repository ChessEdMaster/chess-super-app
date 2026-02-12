import { AISteward } from "@/components/ai/AISteward";

export default function BusinessLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative min-h-screen">
            {children}
            <AISteward context="school" />
        </div>
    );
}
