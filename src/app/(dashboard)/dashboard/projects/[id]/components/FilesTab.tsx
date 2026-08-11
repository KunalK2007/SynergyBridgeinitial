"use client";

import { useEffect, useState, useRef } from "react";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { Project } from "@/types/project";
import { ProjectFile, FileCategory } from "@/types/project-file";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Upload, File, Trash2, Download } from "lucide-react";
import toast from "react-hot-toast";
import { logProjectActivity } from "@/lib/utils/project-activity";
import { ActivityType } from "@/types/project-activity";

interface Props {
  project: Project;
}

export default function FilesTab({ project }: Props) {
  const { currentUser } = useAuth();
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = async () => {
    try {
      const snap = await getDocs(query(collection(db, "projectFiles"), where("projectId", "==", project.id)));
      setFiles(snap.docs.map(d => ({ id: d.id, ...d.data() } as ProjectFile)));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadFiles();
  }, [project.id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !currentUser) return;
    const file = e.target.files[0];

    // Simple validation (e.g. max 50MB, no executables)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File exceeds 50MB limit");
      return;
    }
    if (file.name.endsWith(".exe") || file.name.endsWith(".bat") || file.name.endsWith(".sh")) {
      toast.error("Executable files are not allowed");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const storagePath = `projects/${project.id}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, storagePath);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Upload error:", error);
        toast.error("File upload failed");
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          
          const newFile: Omit<ProjectFile, "id"> = {
            projectId: project.id,
            uploadedBy: currentUser.uid,
            fileName: file.name,
            contentType: file.type || "application/octet-stream",
            size: file.size,
            storagePath,
            downloadUrl,
            category: FileCategory.DOCUMENT, // MVP: default to Document, could add a selector
            createdAt: Date.now()
          };

          const docRef = await addDoc(collection(db, "projectFiles"), newFile);

          await logProjectActivity(
            project.id, 
            currentUser.uid, 
            currentUser.displayName || "User", 
            ActivityType.FILE_UPLOADED, 
            "FILE", 
            docRef.id, 
            { fileName: file.name }
          );

          toast.success("File uploaded successfully");
          loadFiles();
        } catch (err) {
          console.error("Error saving file metadata:", err);
          toast.error("Failed to save file metadata");
        } finally {
          setUploading(false);
          setUploadProgress(0);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      }
    );
  };

  const handleDelete = async (fileData: ProjectFile) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    try {
      // 1. Delete from Storage
      const storageRef = ref(storage, fileData.storagePath);
      await deleteObject(storageRef);
      // 2. Delete metadata from Firestore
      await deleteDoc(doc(db, "projectFiles", fileData.id));
      
      toast.success("File deleted");
      loadFiles();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete file");
    }
  };

  if (loading) return <div className="text-slate-400">Loading files...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Project Files</h2>
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={uploading}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {uploading ? `Uploading ${Math.round(uploadProgress)}%` : <><Upload className="w-4 h-4 mr-2" /> Upload File</>}
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-slate-900 border border-slate-800 rounded-lg text-slate-400">
            No files uploaded yet.
          </div>
        ) : (
          files.map(f => (
            <Card key={f.id} className="bg-slate-900 border-slate-800">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded bg-indigo-900/30 text-indigo-400 flex items-center justify-center shrink-0">
                  <File className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-white truncate" title={f.fileName}>{f.fileName}</h4>
                  <div className="text-xs text-slate-400 mt-1 flex gap-2">
                    <span>{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                    <span>•</span>
                    <span>{new Date(f.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <a href={f.downloadUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium border bg-transparent hover:bg-slate-800 text-slate-100 h-7 px-3 text-xs border-slate-700">
                      <Download className="w-3 h-3 mr-1" /> Download
                    </a>
                    {(currentUser?.uid === f.uploadedBy || currentUser?.role === "ADMIN") && (
                      <Button variant="outline" size="sm" className="h-7 text-xs border-red-900/30 text-red-400 hover:bg-red-950" onClick={() => handleDelete(f)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
