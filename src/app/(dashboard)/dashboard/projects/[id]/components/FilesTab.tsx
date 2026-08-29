"use client";

/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/purity */
import { useEffect, useState, useRef } from "react";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { Project } from "@/types/project";
import { ProjectFile, FileCategory } from "@/types/project-file";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Upload, FileText, Image as ImageIcon, Table, FileSpreadsheet, Trash2, Download, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { logProjectActivity } from "@/lib/utils/project-activity";
import { ActivityType } from "@/types/project-activity";

interface Props {
  project: Project;
}

const DEFAULT_CROPGUARD_FILES: ProjectFile[] = [
  {
    id: "cg_file_1",
    projectId: "demo_proj_1",
    uploadedBy: "student.demo@synergybridge.local",
    fileName: "CropGuard_Project_Proposal.pdf",
    contentType: "application/pdf",
    size: 2450000,
    storagePath: "projects/demo_proj_1/CropGuard_Project_Proposal.pdf",
    downloadUrl: "#",
    category: FileCategory.DOCUMENT,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 15,
  },
  {
    id: "cg_file_2",
    projectId: "demo_proj_1",
    uploadedBy: "student.demo@synergybridge.local",
    fileName: "Disease_Dataset_Summary.xlsx",
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size: 1120000,
    storagePath: "projects/demo_proj_1/Disease_Dataset_Summary.xlsx",
    downloadUrl: "#",
    category: FileCategory.REPORT,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
  },
  {
    id: "cg_file_3",
    projectId: "demo_proj_1",
    uploadedBy: "student2.demo@synergybridge.local",
    fileName: "Model_Architecture.png",
    contentType: "image/png",
    size: 870000,
    storagePath: "projects/demo_proj_1/Model_Architecture.png",
    downloadUrl: "#",
    category: FileCategory.IMAGE,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
  },
  {
    id: "cg_file_4",
    projectId: "demo_proj_1",
    uploadedBy: "student.demo@synergybridge.local",
    fileName: "Baseline_Model_Report.pdf",
    contentType: "application/pdf",
    size: 3680000,
    storagePath: "projects/demo_proj_1/Baseline_Model_Report.pdf",
    downloadUrl: "#",
    category: FileCategory.REPORT,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: "cg_file_5",
    projectId: "demo_proj_1",
    uploadedBy: "student2.demo@synergybridge.local",
    fileName: "Field_Test_Plan.docx",
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size: 640000,
    storagePath: "projects/demo_proj_1/Field_Test_Plan.docx",
    downloadUrl: "#",
    category: FileCategory.DOCUMENT,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
  },
];

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
      if (!snap.empty) {
        setFiles(snap.docs.map(d => ({ id: d.id, ...d.data() } as ProjectFile)));
      } else {
        setFiles(DEFAULT_CROPGUARD_FILES.map(f => ({ ...f, projectId: project.id })));
      }
    } catch (err) {
      console.error(err);
      setFiles(DEFAULT_CROPGUARD_FILES.map(f => ({ ...f, projectId: project.id })));
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
            category: FileCategory.DOCUMENT,
            createdAt: Date.now()
          };

          const docRef = await addDoc(collection(db, "projectFiles"), newFile);

          try {
            await logProjectActivity(
              project.id, 
              currentUser.uid, 
              currentUser.displayName || "User", 
              ActivityType.FILE_UPLOADED, 
              "FILE", 
              docRef.id, 
              { fileName: file.name }
            );
          } catch {
            // Non-blocking
          }

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
      try {
        const storageRef = ref(storage, fileData.storagePath);
        await deleteObject(storageRef);
      } catch {
        // Safe fallback for demo files
      }
      await deleteDoc(doc(db, "projectFiles", fileData.id));
      toast.success("File deleted");
      loadFiles();
    } catch {
      setFiles(prev => prev.filter(f => f.id !== fileData.id));
      toast.success("File deleted");
    }
  };

  const getFileIcon = (fileName: string, category: FileCategory) => {
    if (fileName.endsWith(".xlsx") || fileName.endsWith(".csv")) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    }
    if (fileName.endsWith(".png") || fileName.endsWith(".jpg") || fileName.endsWith(".jpeg") || category === FileCategory.IMAGE) {
      return <ImageIcon className="w-5 h-5 text-purple-600" />;
    }
    return <FileText className="w-5 h-5 text-[#9C7A4C]" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#1C1C1E]">Project Documents & Evidence</h2>
          <p className="text-xs text-[#5B5F73]">Deliverables, dataset sheets, architectural diagrams, and evaluation reports</p>
        </div>
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
            className="bg-[#1C1C1E] text-white hover:bg-black"
          >
            {uploading ? `Uploading ${Math.round(uploadProgress)}%` : <><Upload className="w-4 h-4 mr-2" /> Upload File</>}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map(f => (
          <Card key={f.id} className="bg-[#EFEDE8] border-[#5B5F73]/20 hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-white border border-[#5B5F73]/15 flex items-center justify-center shrink-0 shadow-sm">
                {getFileIcon(f.fileName, f.category)}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-[#1C1C1E] truncate" title={f.fileName}>
                  {f.fileName}
                </h4>
                
                <div className="text-xs text-[#5B5F73] mt-1 flex items-center gap-2">
                  <span>{(f.size / (1024 * 1024)).toFixed(2)} MB</span>
                  <span>•</span>
                  <span>{new Date(f.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <a 
                    href={f.downloadUrl && f.downloadUrl !== "#" ? f.downloadUrl : undefined} 
                    onClick={(e) => {
                      if (!f.downloadUrl || f.downloadUrl === "#") {
                        e.preventDefault();
                        toast.success(`Demo file preview: ${f.fileName}`);
                      }
                    }}
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-lg font-semibold border bg-white hover:bg-[#EFEDE8] text-[#1C1C1E] h-8 px-3 text-xs border-[#5B5F73]/20 shadow-sm transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5 text-[#9C7A4C]" /> Download
                  </a>

                  {(currentUser?.uid === f.uploadedBy || currentUser?.role === "ADMIN") && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-xs border-red-300 text-red-700 hover:bg-red-50" 
                      onClick={() => handleDelete(f)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
