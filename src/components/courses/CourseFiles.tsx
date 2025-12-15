import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileIcon, Trash2, Download, Loader2, FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CourseFile {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  uploader_role: string;
  description: string | null;
  created_at: string;
  uploader_id: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface CourseFilesProps {
  courseId: string;
  userRole: "teacher" | "student";
  userId: string;
}

const CourseFiles = ({ courseId, userRole, userId }: CourseFilesProps) => {
  const { toast } = useToast();
  const [files, setFiles] = useState<CourseFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
  }, [courseId]);

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from("course_files")
        .select(`
          *,
          profiles:uploader_id (
            full_name,
            email
          )
        `)
        .eq("course_id", courseId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFiles((data as CourseFile[]) || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Upload file to storage
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${userId}/${courseId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("course-files")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("course-files")
        .getPublicUrl(fileName);

      // Save file record to database
      const { error: dbError } = await supabase.from("course_files").insert({
        course_id: courseId,
        uploader_id: userId,
        file_name: selectedFile.name,
        file_url: urlData.publicUrl,
        file_size: selectedFile.size,
        file_type: selectedFile.type,
        uploader_role: userRole,
        description: description || null,
      });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "File uploaded successfully!",
      });

      setSelectedFile(null);
      setDescription("");
      // Reset file input
      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      
      fetchFiles();
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      const { error } = await supabase
        .from("course_files")
        .delete()
        .eq("id", fileId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "File deleted successfully",
      });

      setDeleteFileId(null);
      fetchFiles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const teacherFiles = files.filter((f) => f.uploader_role === "teacher");
  const studentFiles = files.filter((f) => f.uploader_role === "student");

  const canDelete = (file: CourseFile) => {
    if (userRole === "teacher") return true;
    return file.uploader_id === userId && file.uploader_role === "student";
  };

  const FileCard = ({ file }: { file: CourseFile }) => (
    <Card className="card-gradient">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{file.file_name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
              </p>
              {file.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {file.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {file.profiles?.full_name || "Unknown"}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              asChild
            >
              <a href={file.file_url} target="_blank" rel="noopener noreferrer" download>
                <Download className="h-4 w-4" />
              </a>
            </Button>
            {canDelete(file) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteFileId(file.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle className="text-lg">Upload File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="file-upload">Select File</Label>
            <Input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              className="mt-1"
            />
          </div>
          {selectedFile && (
            <p className="text-sm text-muted-foreground">
              Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </p>
          )}
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a description for this file..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
              rows={2}
            />
          </div>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Files List */}
      <Tabs defaultValue="materials" className="space-y-4">
        <TabsList>
          <TabsTrigger value="materials">
            <FolderOpen className="h-4 w-4 mr-2" />
            Course Materials ({teacherFiles.length})
          </TabsTrigger>
          <TabsTrigger value="submissions">
            <Upload className="h-4 w-4 mr-2" />
            Student Uploads ({studentFiles.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materials">
          {teacherFiles.length === 0 ? (
            <Card className="card-gradient">
              <CardContent className="py-8 text-center text-muted-foreground">
                No course materials uploaded yet
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {teacherFiles.map((file) => (
                <FileCard key={file.id} file={file} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="submissions">
          {studentFiles.length === 0 ? (
            <Card className="card-gradient">
              <CardContent className="py-8 text-center text-muted-foreground">
                No student files uploaded yet
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {studentFiles.map((file) => (
                <FileCard key={file.id} file={file} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteFileId} onOpenChange={() => setDeleteFileId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this file? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteFileId && handleDelete(deleteFileId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CourseFiles;