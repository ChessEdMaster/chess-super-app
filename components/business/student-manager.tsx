"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, UserPlus, Trash2, Edit } from "lucide-react";
import { supabase } from "@/lib/supabase"; // Correct import
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ClubStudent } from "@/types/club";

interface StudentManagerProps {
    clubId: string;
}

export function StudentManager({ clubId }: StudentManagerProps) {
    const [students, setStudents] = useState<ClubStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [newStudent, setNewStudent] = useState({ firstName: "", lastName: "", group: "" });

    const fetchStudents = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("club_students")
                .select("*")
                .eq("club_id", clubId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setStudents((data as unknown as ClubStudent[]) || []);
        } catch (err) {
            console.error("Error fetching students:", err);
            toast.error("Failed to load students");
        } finally {
            setLoading(false);
        }
    }, [clubId]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const handleAddStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const { error } = await supabase.from("club_students").insert({
                club_id: clubId,
                first_name: newStudent.firstName,
                last_name: newStudent.lastName,
                group_identifier: newStudent.group,
                elo: 800, // Default mock logic
                puzzle_rating: 800
            });

            if (error) throw error;

            toast.success("Student added successfully");
            setNewStudent({ firstName: "", lastName: "", group: "" });
            setIsAddOpen(false);
            fetchStudents();
        } catch (err: any) {
            toast.error(err.message || "Failed to add student");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This cannot be undone.")) return;
        try {
            const { error } = await supabase.from("club_students").delete().eq("id", id);
            if (error) throw error;
            toast.success("Student removed");
            fetchStudents();
        } catch (err: any) {
            toast.error("Failed to delete student");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">Managed Students</h3>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <UserPlus className="mr-2 h-4 w-4" /> Add Student
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-slate-700 text-white">
                        <DialogHeader>
                            <DialogTitle>Add Managed Student</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Add a student without an email account. They will be managed by you.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddStudent} className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>First Name</Label>
                                    <Input
                                        value={newStudent.firstName}
                                        onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                                        required
                                        className="bg-slate-800 border-slate-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Last Name</Label>
                                    <Input
                                        value={newStudent.lastName}
                                        onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                                        className="bg-slate-800 border-slate-700"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Group / Class (Optional)</Label>
                                <Input
                                    value={newStudent.group}
                                    onChange={(e) => setNewStudent({ ...newStudent, group: e.target.value })}
                                    placeholder="e.g. Class 4B"
                                    className="bg-slate-800 border-slate-700"
                                />
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                                    {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Add Student"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border border-slate-700 bg-slate-900 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-800">
                        <TableRow className="hover:bg-slate-800 border-slate-700">
                            <TableHead className="text-slate-300">Name</TableHead>
                            <TableHead className="text-slate-300">Group</TableHead>
                            <TableHead className="text-slate-300">ELO</TableHead>
                            <TableHead className="text-slate-300 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-slate-400">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : students.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                                    No students found. Add one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            students.map((student) => (
                                <TableRow key={student.id} className="hover:bg-slate-800/50 border-slate-800">
                                    <TableCell className="font-medium text-slate-200">
                                        {student.first_name} {student.last_name}
                                    </TableCell>
                                    <TableCell className="text-slate-400">{student.group_identifier || "-"}</TableCell>
                                    <TableCell className="text-amber-400 font-mono">{student.elo}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                            onClick={() => handleDelete(student.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
