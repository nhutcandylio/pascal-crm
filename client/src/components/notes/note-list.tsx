import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Save, X, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import type { Note, InsertNote, User } from "@shared/schema";

interface NoteListProps {
  leadId?: number;
  opportunityId?: number;
  accountId?: number;
  contactId?: number;
}

export default function NoteList({ leadId, opportunityId, accountId, contactId }: NoteListProps) {
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Build query key and endpoint based on what entity we're viewing notes for
  let queryKey = ['/api/notes'];
  let queryParams = '';
  
  if (leadId) {
    queryKey.push('lead', leadId.toString());
    queryParams = `?leadId=${leadId}`;
  } else if (opportunityId) {
    queryKey.push('opportunity', opportunityId.toString());
    queryParams = `?opportunityId=${opportunityId}`;
  } else if (accountId) {
    queryKey.push('account', accountId.toString());
    queryParams = `?accountId=${accountId}`;
  } else if (contactId) {
    queryKey.push('contact', contactId.toString());
    queryParams = `?contactId=${contactId}`;
  }

  const { data: notes = [] } = useQuery<Note[]>({
    queryKey,
    queryFn: () => fetch(`/api/notes${queryParams}`).then(res => res.json()),
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const createNoteMutation = useMutation({
    mutationFn: async (noteData: InsertNote) => {
      const response = await apiRequest("POST", "/api/notes", noteData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setNewNoteContent("");
      setIsAddingNote(false);
      toast({
        title: "Success",
        description: "Note added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add note.",
        variant: "destructive",
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      const response = await apiRequest("PATCH", `/api/notes/${id}`, { content });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setEditingNoteId(null);
      setEditContent("");
      toast({
        title: "Success",
        description: "Note updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update note.",
        variant: "destructive",
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: "Success",
        description: "Note deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete note.",
        variant: "destructive",
      });
    },
  });

  const handleAddNote = () => {
    if (!newNoteContent.trim()) return;

    const noteData: InsertNote = {
      content: newNoteContent.trim(),
      leadId: leadId || null,
      opportunityId: opportunityId || null,
      accountId: accountId || null,
      contactId: contactId || null,
      userId: 1, // TODO: Get from current user context
    };

    createNoteMutation.mutate(noteData);
  };

  const handleEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
  };

  const handleSaveEdit = () => {
    if (!editContent.trim() || !editingNoteId) return;
    updateNoteMutation.mutate({ id: editingNoteId, content: editContent.trim() });
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditContent("");
  };

  const handleDeleteNote = (id: number) => {
    if (confirm("Are you sure you want to delete this note?")) {
      deleteNoteMutation.mutate(id);
    }
  };

  const getUserName = (userId: number | null) => {
    if (!userId) return "Unknown User";
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : "Unknown User";
  };

  return (
    <div className="space-y-4">
      {/* Add New Note */}
      {!isAddingNote ? (
        <Button
          onClick={() => setIsAddingNote(true)}
          variant="outline"
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      ) : (
        <Card>
          <CardContent className="p-4">
            <Textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Write your note here..."
              rows={3}
              className="mb-3"
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAddingNote(false);
                  setNewNoteContent("");
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddNote}
                disabled={!newNoteContent.trim() || createNoteMutation.isPending}
              >
                <Save className="h-4 w-4 mr-1" />
                {createNoteMutation.isPending ? "Saving..." : "Save Note"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes List */}
      {notes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Notes Yet</h3>
            <p className="text-muted-foreground">
              Add your first note to start tracking important information.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">
                      {getUserName(note.userId)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(note.createdAt), 'PPp')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditNote(note)}
                      disabled={editingNoteId === note.id}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {editingNoteId === note.id ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={!editContent.trim() || updateNoteMutation.isPending}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        {updateNoteMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap text-sm">
                    {note.content}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}