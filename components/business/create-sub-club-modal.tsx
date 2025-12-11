"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, School, Building } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase"; // Correct import
import { useRouter } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface CreateSubClubModalProps {
    ownerId: string;
    parentId?: string; // If present, creates a child club (school/class)
    triggerLabel?: string;
    variant?: "default" | "outline" | "secondary" | "ghost" | "link";
}

export function CreateSubClubModal({ ownerId, parentId, triggerLabel, variant = "default" }: CreateSubClubModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        type: parentId ? "school" : "organization", // Default type
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

            const { data, error } = await supabase
                .from("clubs")
                .insert({
                    name: formData.name,
                    description: formData.description,
                    owner_id: ownerId,
                    slug: `${slug}-${Date.now().toString().slice(-4)}`, // Ensure uniqueness
                    parent_id: parentId || null,
                    type: formData.type,
                    settings: {
                        allow_chat: false, // Default strict for business/schools
                        require_approval: true
                    }
                })
                .select()
                .single();

            if (error) throw error;

            toast.success(parentId ? "Sub-club created successfully!" : "Organization created successfully!");
            setOpen(false);
            setFormData({ name: "", description: "", type: parentId ? "school" : "organization" });
            router.refresh();

        } catch (error: any) {
            console.error("Error creating club:", error);
            toast.error(error.message || "Failed to create club");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant={variant} className={!parentId ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}>
                    {triggerLabel || (parentId ? "Add Sub-Club" : "Create Organization")}
                    {!triggerLabel && (parentId ? <School className="ml-2 h-4 w-4" /> : <Building className="ml-2 h-4 w-4" />)}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700 text-white">
                <DialogHeader>
                    <DialogTitle>{parentId ? "Add New School/Club" : "Create New Organization"}</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        {parentId
                            ? "Create a sub-unit within your organization to manage students."
                            : "Create a top-level organization to manage multiple schools and students."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            placeholder={parentId ? "e.g. Chess Academy Barcelona" : "e.g. My Chess Business"}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="bg-slate-800 border-slate-700 focus:ring-amber-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(val) => setFormData({ ...formData, type: val as any })}
                        >
                            <SelectTrigger className="bg-slate-800 border-slate-700">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                <SelectItem value="organization">Organization (HQ)</SelectItem>
                                <SelectItem value="school">School</SelectItem>
                                <SelectItem value="physical_club">Physical Club</SelectItem>
                                <SelectItem value="online">Online Club</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            placeholder="Short description..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="bg-slate-800 border-slate-700 focus:ring-amber-500"
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-white">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
