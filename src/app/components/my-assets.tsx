import { useState } from "react";
import {
  Upload,
  FolderPlus,
  Search,
  MoreVertical,
  Download,
  Trash2,
  ExternalLink,
  FileText,
  Package,
  Calendar,
  User,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export interface Asset {
  id: string;
  name: string;
  type: "part" | "project";
  fileType: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  description?: string;
}

export function MyAssets() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [importType, setImportType] = useState<"project" | "part">("project");
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);

  // Mock assets data
  const [assets, setAssets] = useState<Asset[]>([
    {
      id: "1",
      name: "V8发动机总装配",
      type: "project",
      fileType: "STEP",
      size: "15.2 MB",
      uploadedBy: "张三",
      uploadedAt: "2024-03-20",
      description: "完整的V8发动机装配体模型",
    },
    {
      id: "2",
      name: "气缸体",
      type: "part",
      fileType: "STEP",
      size: "3.4 MB",
      uploadedBy: "张三",
      uploadedAt: "2024-03-19",
      description: "发动机气缸体零件",
    },
    {
      id: "3",
      name: "曲轴",
      type: "part",
      fileType: "STEP",
      size: "2.1 MB",
      uploadedBy: "张三",
      uploadedAt: "2024-03-18",
    },
    {
      id: "4",
      name: "底盘系统",
      type: "project",
      fileType: "STEP",
      size: "22.8 MB",
      uploadedBy: "李四",
      uploadedAt: "2024-03-15",
      description: "轿车底盘完整装配体",
    },
  ]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFile(file);

    // Check if it's a STEP file
    const isStepFile =
      file.name.toLowerCase().endsWith(".step") ||
      file.name.toLowerCase().endsWith(".stp");

    if (isStepFile) {
      setShowImportDialog(true);
    } else {
      // Handle other file types directly
      handleUploadComplete("part");
    }
  };

  const handleUploadComplete = (type: "project" | "part") => {
    if (!uploadingFile) return;

    const newAsset: Asset = {
      id: Date.now().toString(),
      name: uploadingFile.name.replace(/\.(step|stp)$/i, ""),
      type: type,
      fileType: "STEP",
      size: `${(uploadingFile.size / 1024 / 1024).toFixed(1)} MB`,
      uploadedBy: "张三",
      uploadedAt: new Date().toISOString().split("T")[0],
    };

    setAssets([newAsset, ...assets]);
    setUploadingFile(null);
    setShowImportDialog(false);
    setShowUploadDialog(false);
  };

  const handleDeleteAsset = () => {
    if (!selectedAsset) return;
    setAssets(assets.filter((a) => a.id !== selectedAsset.id));
    setShowDeleteDialog(false);
    setSelectedAsset(null);
  };

  const filteredAssets = assets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">我的资产</h1>
        <p className="text-gray-600">管理和上传您的CAD资产</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="搜索资产..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button onClick={() => setShowUploadDialog(true)}>
          <Upload className="w-4 h-4 mr-2" />
          上传文件
        </Button>
      </div>

      {/* Assets Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  类型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  上传者
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  上传时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                          asset.type === "project"
                            ? "bg-purple-100"
                            : "bg-blue-100"
                        }`}
                      >
                        {asset.type === "project" ? (
                          <Package
                            className={`w-5 h-5 ${
                              asset.type === "project"
                                ? "text-purple-600"
                                : "text-blue-600"
                            }`}
                          />
                        ) : (
                          <FileText
                            className={`w-5 h-5 ${
                              asset.type === "project"
                                ? "text-purple-600"
                                : "text-blue-600"
                            }`}
                          />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {asset.name}
                        </div>
                        {asset.description && (
                          <div className="text-sm text-gray-500">
                            {asset.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      className={
                        asset.type === "project"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }
                    >
                      {asset.type === "project" ? "装配体" : "零件"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      {asset.uploadedBy}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {new Date(asset.uploadedAt).toLocaleDateString("zh-CN")}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {asset.type === "project" && (
                          <>
                            <DropdownMenuItem>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              在编辑器中打开
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" />
                          下载
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setSelectedAsset(asset);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {filteredAssets.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? "没有找到资产" : "还没有资产"}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery
              ? "尝试调整搜索条件"
              : "上传您的第一个CAD资产"}
          </p>
          {!searchQuery && (
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload className="w-4 h-4 mr-2" />
              上传资产
            </Button>
          )}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>上传资产</DialogTitle>
            <DialogDescription>
              上传CAD文件或装配体到您的资产库
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".step,.stp"
                onChange={handleFileSelect}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-1">
                  点击或拖拽文件到此处
                </p>
                <p className="text-xs text-gray-500">
                  支持 STEP 格式 (.step, .stp)
                </p>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUploadDialog(false)}
            >
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Type Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导入文件</DialogTitle>
            <DialogDescription>
              请选择导入类型
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>导入为</Label>
              <Select value={importType} onValueChange={setImportType as any}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project">导入一个项目（装配体）</SelectItem>
                  <SelectItem value="part">导入一个零件</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {uploadingFile && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {uploadingFile.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(uploadingFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowImportDialog(false);
                setUploadingFile(null);
              }}
            >
              取消
            </Button>
            <Button onClick={() => handleUploadComplete(importType)}>
              导入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除资产</DialogTitle>
            <DialogDescription>
              确定要删除"{selectedAsset?.name}"吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteAsset}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
