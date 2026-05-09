import { useState } from "react";
import {
  ArrowLeft,
  ArrowLeftRight,
  Upload,
  FolderPlus,
  Save,
  GitCommit,
  Clock,
  Trash2,
  MoreVertical,
  Download,
  ExternalLink,
  History,
  GitBranch,
  AlertCircle,
  UserPlus,
  CheckCircle2,
  Package,
  FileText,
  FolderTree,
  Settings,
  ChevronDown,
  Eye,
  Ruler,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "./ui/context-menu";

interface NodeBranch {
  branchId: string;
  assignee: string;
  status: "working" | "submitted";
}

interface WorkspaceNode {
  id: string;
  name: string;
  type: "assembly" | "part";
  branches: NodeBranch[];
  hasCommits?: boolean;
  adoptedCommitId?: string;
}

interface CommitRecord {
  id: string;
  message: string;
  author: string;
  date: string;
  filesChanged: number;
  nodeId?: string;
  branchId?: string;
  parentIds?: string[]; // 历史兼容字段，当前提交记录不展示合并关系
}

interface ChildSubmission {
  id: string;
  nodePath: string;
  nodeName: string;
  submittedBy: string;
  submittedAt: string;
  message: string;
  filesChanged: number;
}

interface WorkspaceProps {
  branchId: string;
  onBack: () => void;
  viewMode?: "edit" | "preview";
  nodeType?: "assembly" | "part";
  currentUser?: string;
  nodeName?: string;
  nodePath?: string;
  assignee?: string;
}

export function Workspace({
  branchId,
  onBack,
  viewMode = "edit",
  nodeType = "assembly",
  currentUser = "张三",
  nodeName = "气缸体组件",
  nodePath = "/发动机总成/气缸体组件",
  assignee,
}: WorkspaceProps) {
  const [showCreatePartDialog, setShowCreatePartDialog] =
    useState(false);
  const [
    showCreateAssemblyDialog,
    setShowCreateAssemblyDialog,
  ] = useState(false);
  const [showCommitDialog, setShowCommitDialog] =
    useState(false);
  const [showAdoptDialog, setShowAdoptDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] =
    useState(false);
  const [showVersionSwitchDialog, setShowVersionSwitchDialog] =
    useState(false);
  const [commitMessage, setCommitMessage] = useState("");
  const [selectedSubmission, setSelectedSubmission] =
    useState<ChildSubmission | null>(null);
  const [selectedNode, setSelectedNode] =
    useState<WorkspaceNode | null>(null);
  const [
    selectedNodeForVersionSwitch,
    setSelectedNodeForVersionSwitch,
  ] = useState<WorkspaceNode | null>(null);
  const [createMode, setCreateMode] = useState<
    "empty" | "from-asset"
  >("empty");
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [leftPanelTab, setLeftPanelTab] = useState<
    "structure" | "history"
  >(viewMode === "preview" || nodeType === "part" ? "history" : "structure");
  const [selectedCommitVersion, setSelectedCommitVersion] =
    useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<
    string | null
  >(null);
  const [newNodeName, setNewNodeName] = useState("");
  const [previewingNode, setPreviewingNode] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [measurePanelOpen, setMeasurePanelOpen] = useState(false);

  // Mock workspace data - 根据branchId获取对应的工作区信息
  const workspace = {
    branchId: branchId,
    nodeName,
    nodePath,
    projectName: "发动机装配项目",
    assignee: assignee ?? currentUser,
    lastModified: "2024-03-20",
    hasUncommittedChanges: true,
  };

  const metricSeed = (value: string) =>
    value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);

  const commitCode = (value: string) =>
    metricSeed(value).toString(16).padStart(6, "0").slice(0, 6);

  const getNodeKindLabel = (node: WorkspaceNode) =>
    node.type === "assembly" ? "装配体节点" : "零件节点";

  const getNodeTone = (node: WorkspaceNode) =>
    node.type === "assembly"
      ? "border-blue-500/45 bg-blue-500/10 text-blue-300"
      : "border-emerald-500/45 bg-emerald-500/10 text-emerald-300";

  const getAdoptedVersion = (node: WorkspaceNode) => {
    const adoptedCommit = commits.find(
      (commit) => commit.id === node.adoptedCommitId,
    );
    if (!node.hasCommits || !adoptedCommit) {
      return "--";
    }
    return `${adoptedCommit.branchId || "负责分支"} / 提交 ${adoptedCommit.id}`;
  };

  const renderWorkspaceNodeThumb = (node: WorkspaceNode) => (
    <span
      className={`grid h-9 w-11 shrink-0 content-end gap-1 overflow-hidden rounded-lg border p-1.5 ${getNodeTone(node)}`}
      aria-hidden="true"
    >
      <span className="h-1.5 w-7 rounded-full bg-current opacity-60" />
      <span className="h-1.5 w-9 rounded-full bg-current opacity-35" />
    </span>
  );

  // Mock nodes
  const [nodes, setNodes] = useState<WorkspaceNode[]>([
    {
      id: "1",
      name: "气缸体",
      type: "part",
      branches: [
        {
          branchId: "branch-1-1-wangwu",
          assignee: "王五",
          status: "working",
        },
      ],
      hasCommits: true,
      adoptedCommitId: "4-1",
    },
    {
      id: "2",
      name: "气缸盖",
      type: "part",
      branches: [
        {
          branchId: "branch-1-2-zhaoliu",
          assignee: "赵六",
          status: "submitted",
        },
      ],
      hasCommits: true,
      adoptedCommitId: "5",
    },
    {
      id: "3",
      name: "活塞组件",
      type: "assembly",
      branches: [
        {
          branchId: "branch-1-3-wangwu",
          assignee: "王五",
          status: "working",
        },
        {
          branchId: "branch-1-3-sunqi",
          assignee: "孙七",
          status: "working",
        },
      ],
      hasCommits: true,
      adoptedCommitId: "7",
    },
    {
      id: "4",
      name: "曲轴",
      type: "part",
      branches: [
        {
          branchId: "branch-1-4-zhaoliu",
          assignee: "赵六",
          status: "working",
        },
      ],
      hasCommits: false,
    },
  ]);

  // Mock commit history
  const [commits] = useState<CommitRecord[]>([
    {
      id: "1",
      message: "更新气缸体尺寸参数",
      author: "李四",
      date: "2024-03-20 14:30",
      filesChanged: 2,
      branchId: "branch-1-lisi",
      parentIds: ["2"],
    },
    {
      id: "2",
      message: "初始版本提交",
      author: "李四",
      date: "2024-03-18 10:15",
      filesChanged: 5,
      branchId: "branch-1-lisi",
      parentIds: ["14"],
    },
    {
      id: "3",
      message: "优化气缸体冷却水道设计",
      author: "王五",
      date: "2024-03-21 10:20",
      filesChanged: 3,
      nodeId: "1",
      branchId: "branch-1-1-wangwu",
      parentIds: ["4"],
    },
    {
      id: "4",
      message: "调整气缸体材料参数",
      author: "王五",
      date: "2024-03-19 16:45",
      filesChanged: 1,
      nodeId: "1",
      branchId: "branch-1-1-wangwu",
      parentIds: [],
    },
    {
      id: "4-1",
      message: "补充气缸体水套腔筋位",
      author: "王五",
      date: "2024-03-18 15:20",
      filesChanged: 2,
      nodeId: "1",
      branchId: "branch-1-1-wangwu",
      parentIds: [],
    },
    {
      id: "5",
      message: "修复气缸盖装配接口",
      author: "赵六",
      date: "2024-03-20 16:45",
      filesChanged: 2,
      nodeId: "2",
      branchId: "branch-1-2-zhaoliu",
      parentIds: [],
    },
    {
      id: "6",
      message: "更新活塞环槽尺寸",
      author: "王五",
      date: "2024-03-22 09:30",
      filesChanged: 4,
      nodeId: "3",
      branchId: "branch-1-3-wangwu",
      parentIds: [],
    },
    {
      id: "7",
      message: "优化活塞组件装配顺序",
      author: "孙七",
      date: "2024-03-21 14:15",
      filesChanged: 2,
      nodeId: "3",
      branchId: "branch-1-3-sunqi",
      parentIds: [],
    },
    {
      id: "8",
      message: "完成气缸体组件整体装配",
      author: "王五",
      date: "2024-03-23 11:20",
      filesChanged: 5,
      branchId: "branch-1-wangwu",
      parentIds: ["9"],
    },
    {
      id: "9",
      message: "更新气缸体组件装配约束",
      author: "王五",
      date: "2024-03-22 16:30",
      filesChanged: 3,
      branchId: "branch-1-wangwu",
      parentIds: ["10"],
    },
    {
      id: "10",
      message: "添加气缸体组件子节点",
      author: "王五",
      date: "2024-03-21 09:45",
      filesChanged: 2,
      branchId: "branch-1-wangwu",
      parentIds: ["11-4"],
    },
    {
      id: "11",
      message: "初始化气缸体组件分支",
      author: "王五",
      date: "2024-03-20 10:00",
      filesChanged: 1,
      branchId: "branch-1-wangwu",
      parentIds: ["2"],
    },
    {
      id: "11-1",
      message: "优化气缸体组件结构",
      author: "王五",
      date: "2024-03-24 09:15",
      filesChanged: 4,
      branchId: "branch-1-wangwu",
      parentIds: ["11-2"],
    },
    {
      id: "11-2",
      message: "修复气缸体组件装配干涉",
      author: "王五",
      date: "2024-03-23 15:40",
      filesChanged: 2,
      branchId: "branch-1-wangwu",
      parentIds: ["8"],
    },
    {
      id: "11-3",
      message: "更新气缸体组件材料属性",
      author: "王五",
      date: "2024-03-22 10:20",
      filesChanged: 3,
      branchId: "branch-1-wangwu",
      parentIds: ["11-4"],
    },
    {
      id: "11-4",
      message: "调整气缸体组件子节点位置",
      author: "王五",
      date: "2024-03-21 14:30",
      filesChanged: 2,
      branchId: "branch-1-wangwu",
      parentIds: ["11"],
    },
    {
      id: "12",
      message: "完成发动机总成整体设计",
      author: "张三",
      date: "2024-03-25 14:00",
      filesChanged: 8,
      branchId: "main",
      parentIds: ["13"],
    },
    {
      id: "13",
      message: "更新总成装配关系",
      author: "张三",
      date: "2024-03-24 10:30",
      filesChanged: 4,
      branchId: "main",
      parentIds: ["14"],
    },
    {
      id: "14",
      message: "初始化发动机总成项目",
      author: "张三",
      date: "2024-03-15 09:00",
      filesChanged: 3,
      branchId: "main",
      parentIds: [],
    },
    {
      id: "15",
      message: "完成总成分支设计优化",
      author: "李四",
      date: "2024-03-23 16:45",
      filesChanged: 6,
      branchId: "branch-root-lisi",
      parentIds: ["16"],
    },
    {
      id: "16",
      message: "更新总成装配结构",
      author: "李四",
      date: "2024-03-22 11:20",
      filesChanged: 3,
      branchId: "branch-root-lisi",
      parentIds: ["17"],
    },
    {
      id: "17",
      message: "初始化总成李四分支",
      author: "李四",
      date: "2024-03-20 08:30",
      filesChanged: 2,
      branchId: "branch-root-lisi",
      parentIds: ["14"],
    },
    {
      id: "18",
      message: "完成油底壳设计",
      author: "张三",
      date: "2024-03-24 15:30",
      filesChanged: 4,
      branchId: "branch-4-zhangsan",
      parentIds: ["19"],
    },
    {
      id: "19",
      message: "更新油底壳密封结构",
      author: "张三",
      date: "2024-03-23 10:15",
      filesChanged: 2,
      branchId: "branch-4-zhangsan",
      parentIds: ["20"],
    },
    {
      id: "20",
      message: "初始化油底壳零件",
      author: "张三",
      date: "2024-03-22 09:00",
      filesChanged: 1,
      branchId: "branch-4-zhangsan",
      parentIds: ["11-4"],
    },
    {
      id: "21",
      message: "完成曲轴系统装配",
      author: "孙七",
      date: "2024-03-24 14:20",
      filesChanged: 5,
      branchId: "branch-2-sunqi",
      parentIds: ["22"],
    },
    {
      id: "22",
      message: "更新曲轴系统零件清单",
      author: "孙七",
      date: "2024-03-23 09:45",
      filesChanged: 3,
      branchId: "branch-2-sunqi",
      parentIds: ["23"],
    },
    {
      id: "23",
      message: "初始化曲轴系统分支",
      author: "孙七",
      date: "2024-03-21 08:00",
      filesChanged: 2,
      branchId: "branch-2-sunqi",
      parentIds: ["11"],
    },
  ]);

  // Mock project members for assignment
  const [members] = useState([
    { id: "1", name: "张三" },
    { id: "2", name: "李四" },
    { id: "3", name: "王五" },
    { id: "4", name: "赵六" },
    { id: "5", name: "孙七" },
  ]);

  // Mock personal assets
  const [personalAssets] = useState([
    {
      id: "1",
      name: "V8发动机总装配",
      type: "project" as const,
      description: "完整的V8发动机装配体模型",
    },
    {
      id: "2",
      name: "气缸体",
      type: "part" as const,
      description: "发动机气缸体零件",
    },
    {
      id: "3",
      name: "曲轴",
      type: "part" as const,
      description: "发动机曲轴零件",
    },
    {
      id: "4",
      name: "底盘系统",
      type: "project" as const,
      description: "轿车底盘完整装配体",
    },
  ]);

  // Mock child submissions
  const [childSubmissions] = useState<ChildSubmission[]>([
    {
      id: "1",
      nodePath: "/发动机总成/气缸体组件/气缸体",
      nodeName: "气缸体",
      submittedBy: "王五",
      submittedAt: "2024-03-21 09:20",
      message: "完成气缸体设计优化",
      filesChanged: 3,
    },
    {
      id: "2",
      nodePath: "/发动机总成/气缸体组件/气缸盖",
      nodeName: "气缸盖",
      submittedBy: "赵六",
      submittedAt: "2024-03-20 16:45",
      message: "修复气缸盖装配接口",
      filesChanged: 1,
    },
  ]);

  const handleDeleteNode = (nodeId: string) => {
    setNodes(nodes.filter((n) => n.id !== nodeId));
  };

  const handleAdoptSubmission = (
    submission: ChildSubmission,
  ) => {
    setSelectedSubmission(submission);
    setShowAdoptDialog(true);
  };

  const handleAssignNode = (node: WorkspaceNode) => {
    setSelectedNode(node);
    setShowAssignDialog(true);
  };

  const getNodeVersionCommits = (nodeId?: string) =>
    commits
      .filter((commit) => commit.nodeId === nodeId)
      .sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

  const getNodeNewCommitCount = (node: WorkspaceNode) => {
    const versionCount = getNodeVersionCommits(node.id).length;
    return Math.max(0, versionCount - 1);
  };

  const isNewNodeCommit = (
    commit: CommitRecord,
    node?: WorkspaceNode | null,
  ) => {
    if (!node) return false;
    const versions = getNodeVersionCommits(node.id);
    const newCount = Math.min(
      getNodeNewCommitCount(node),
      versions.length,
    );
    return versions.slice(0, newCount).some((item) => item.id === commit.id);
  };

  const isAdoptedNodeCommit = (
    commit: CommitRecord,
    node?: WorkspaceNode | null,
  ) => {
    return Boolean(node?.adoptedCommitId && commit.id === node.adoptedCommitId);
  };

  const modifiedCount = 0; // TODO: 实际应该统计有修改的节点数量

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Top Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
            <div className="h-6 w-px bg-gray-700" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">
                项目:
              </span>
              <span className="text-sm font-medium text-white">
                {workspace.projectName}
              </span>
            </div>
            {viewMode === "edit" && (
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-400">
                  {(() => {
                    const pathParts = workspace.nodePath.split('/').filter(p => p);
                    if (pathParts.length === 0) return workspace.branchId;
                    if (pathParts.length === 1) {
                      return `/${pathParts[0]}（${workspace.branchId}）`;
                    }
                    const parentPath = pathParts
                      .slice(1, -1)
                      .map((part) => `${part}（main）`)
                      .join("/");
                    const parentPrefix = parentPath ? `/${parentPath}` : "";
                    return `/${pathParts[0]}（main）${parentPrefix}/${pathParts[pathParts.length - 1]}（${workspace.branchId}）`;
                  })()}
                </span>
              </div>
            )}
            {viewMode === "edit" && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">
                  负责人:
                </span>
                <span className="text-sm text-gray-300">
                  {workspace.assignee}
                </span>
              </div>
            )}
            {viewMode === "preview" && (
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                预览模式
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {viewMode === "edit" && (
              <Button
                variant="outline"
                size="sm"
                className="bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
              >
                <Save className="w-4 h-4 mr-2" />
                保存
              </Button>
            )}
            {viewMode === "edit" && (
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowCommitDialog(true)}
              >
                <GitCommit className="w-4 h-4 mr-2" />
                提交
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <div className="w-12 bg-gray-900 border-r border-gray-700 flex flex-col items-center py-4 gap-2">
          {viewMode === "edit" && nodeType === "assembly" && (
            <button
              onClick={() => {
                setLeftPanelTab("structure");
                setLeftPanelOpen(true);
              }}
              className={`w-9 h-9 flex items-center justify-center rounded ${
                leftPanelOpen && leftPanelTab === "structure"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
              title="结构树"
            >
              <FolderTree className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => {
              setLeftPanelTab("history");
              setLeftPanelOpen(true);
            }}
            className={`w-9 h-9 flex items-center justify-center rounded ${
              leftPanelOpen && leftPanelTab === "history"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
            title={
              viewMode === "preview" ? "版本历史" : "提交记录"
            }
          >
            <History className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          {viewMode === "edit" && (
            <button
              className="w-9 h-9 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-gray-700"
              title="设置"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Left Sidebar Panel */}
        {leftPanelOpen && (
          <div className="w-96 bg-gray-800 border-r border-gray-700 flex flex-col">
            {/* Panel Header */}
            <div className="bg-gray-900 px-4 py-3 border-b border-gray-700">
              <h3 className="text-sm font-medium text-white">
                {leftPanelTab === "structure" && "节点列表"}
                {leftPanelTab === "history" &&
                  (viewMode === "preview"
                    ? "版本历史"
                    : "提交记录")}
              </h3>
            </div>

            {/* Panel Content */}
            <div
              className="flex-1 overflow-y-auto p-4"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#4B5563 #1F2937",
              }}
            >
              {/* Structure Tab */}
              {leftPanelTab === "structure" && nodeType === "assembly" && (
                <div className="space-y-2">
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-400 mb-2">
                      {workspace.nodeName}
                    </div>
                  </div>

                  {/* Create Buttons */}
                  <div className="mb-4 flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAsset(null);
                        setNewNodeName("");
                        setCreateMode("empty");
                        setShowCreatePartDialog(true);
                      }}
                      className="bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600 w-full justify-start"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      新建零件
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAsset(null);
                        setNewNodeName("");
                        setCreateMode("empty");
                        setShowCreateAssemblyDialog(true);
                      }}
                      className="bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600 w-full justify-start"
                    >
                      <FolderPlus className="w-4 h-4 mr-2" />
                      新建子装配体
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {nodes.map((node) => {
                      return (
                        <div key={node.id}>
                          {/* Node Item */}
                          <div className="grid grid-cols-[16px_44px_minmax(0,1fr)_auto] gap-2 rounded px-2 py-2 hover:bg-gray-700/50 group">
                            {node.type === "assembly" ? (
                              <Package className="mt-3 h-3.5 w-3.5 flex-shrink-0 text-blue-300/70" />
                            ) : (
                              <FileText className="mt-3 h-3.5 w-3.5 flex-shrink-0 text-emerald-300/70" />
                            )}
                            {renderWorkspaceNodeThumb(node)}
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-gray-200">
                                {node.name}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-gray-500">
                                <span>{getNodeKindLabel(node)}</span>
                                <span>·</span>
                                <span>{node.branches.length} 分支</span>
                                <span>·</span>
                                <span>新提交：{getNodeNewCommitCount(node)}</span>
                              </div>
                              <div className="mt-0.5 truncate text-xs text-gray-500">
                                采纳版本：
                                <span className="text-blue-300">
                                  {getAdoptedVersion(node)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-start gap-1">
                              <button
                                className="h-6 px-1.5 flex items-center gap-0.5 text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                                onClick={() => {
                                  setSelectedNodeForVersionSwitch(
                                    node,
                                  );
                                  setShowVersionSwitchDialog(
                                    true,
                                  );
                                }}
                                title="切换版本"
                              >
                                <ArrowLeftRight className="w-3.5 h-3.5" />
                              </button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-gray-400 hover:text-white hover:bg-gray-600 flex-shrink-0"
                                onClick={() =>
                                  handleAssignNode(node)
                                }
                              >
                                <UserPlus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Branches under node - 显示所有节点的分支 */}
                          {node.branches.map((branch) => {
                            return (
                              <div
                                key={branch.branchId}
                                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-700/50 group"
                                style={{
                                  paddingLeft: "2.5rem",
                                }}
                              >
                                <GitBranch className="w-3 h-3 text-gray-500 flex-shrink-0" />
                                <span className="text-xs text-gray-400 flex-1">
                                  {branch.assignee}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>

                  {nodes.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-500 text-sm">
                        暂无子节点
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* History Tab */}
              {leftPanelTab === "history" && (
                <div className="space-y-2">
                  {previewingNode && (
                    <div className="mb-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPreviewingNode(null);
                          setSelectedCommitVersion(null);
                          setLeftPanelTab("structure");
                        }}
                        className="text-gray-300 hover:text-white hover:bg-gray-700 w-full justify-start mb-3"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        返回编辑
                      </Button>
                      <div className="p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg">
                        <div className="text-xs text-blue-300 mb-1">
                          发动机总成（main）/{previewingNode.name}
                        </div>
                        <div className="text-sm font-medium text-white">
                          {selectedCommitVersion
                            ? commits.find(
                                (c) =>
                                  c.id === selectedCommitVersion,
                              )?.message
                            : commits.filter((c) => c.nodeId === previewingNode.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.message || "暂无版本"}
                        </div>
                      </div>
                    </div>
                  )}

                  {viewMode === "preview" && !previewingNode && (
                    <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg">
                      <div className="text-xs text-blue-300 mb-1">
                        {(() => {
                          const pathParts = workspace.nodePath.split('/').filter(p => p);
                          if (pathParts.length > 1) {
                            return `${pathParts[0]}（main）/${pathParts.slice(1).join('/')}`;
                          }
                          return workspace.nodePath;
                        })()}
                      </div>
                      <div className="text-sm font-medium text-white">
                        当前版本: {selectedCommitVersion
                          ? commits.find(
                              (c) =>
                                c.id === selectedCommitVersion,
                            )?.message
                          : commits.filter((c) => c.branchId === branchId && !c.nodeId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.message || "暂无版本"}
                      </div>
                    </div>
                  )}

                  {(() => {
                    const previewVersionNode =
                      previewingNode ||
                      (viewMode === "preview"
                        ? nodes.find(
                            (node) =>
                              node.name === workspace.nodeName ||
                              node.branches.some(
                                (branch) => branch.branchId === branchId,
                              ),
                          ) || null
                        : null);
                    const filteredCommits = (
                      previewVersionNode
                        ? commits.filter((c) => c.nodeId === previewVersionNode.id)
                        : commits.filter((c) => !c.nodeId)
                    ).sort(
                      (a, b) =>
                        new Date(b.date).getTime() -
                        new Date(a.date).getTime(),
                    );

                    if (filteredCommits.length === 0) {
                      return (
                        <div className="text-center py-12">
                          <p className="text-gray-500 text-sm">
                            暂无提交记录
                          </p>
                        </div>
                      );
                    }

                    if (viewMode === "preview" || previewingNode) {
                      return (
                        <div className="grid gap-2 pb-2">
                          {filteredCommits.map((commit, index) => {
                            const isCurrentVersion =
                              selectedCommitVersion === commit.id ||
                              (!selectedCommitVersion && index === 0);
                            const showNewBadge =
                              previewVersionNode
                                ? isNewNodeCommit(commit, previewVersionNode)
                                : index === 0;
                            const showAdoptedBadge =
                              previewVersionNode
                                ? isAdoptedNodeCommit(
                                    commit,
                                    previewVersionNode,
                                  )
                                : index ===
                                  Math.min(2, filteredCommits.length - 1);
                            return (
                              <ContextMenu key={commit.id}>
                                <ContextMenuTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedCommitVersion(commit.id);
                                    }}
                                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                                      isCurrentVersion
                                        ? "border-blue-500/60 bg-blue-500/15"
                                        : "border-transparent bg-gray-700/45 hover:bg-gray-700"
                                    }`}
                                  >
                                    <div className="mb-2 flex items-start justify-between gap-2">
                                      <span
                                        className="min-w-0 truncate text-sm font-medium text-gray-100"
                                        title={commit.message}
                                      >
                                        {commit.message}
                                      </span>
                                      <span className="flex shrink-0 flex-wrap justify-end gap-1.5">
                                        {showNewBadge && (
                                          <Badge className="bg-amber-500/15 text-amber-200">
                                            新提交
                                          </Badge>
                                        )}
                                        {showAdoptedBadge && (
                                          <Badge className="bg-blue-500/15 text-blue-200">
                                            采纳版本
                                          </Badge>
                                        )}
                                        {false && isCurrentVersion && (
                                          <Badge className="bg-blue-500/25 text-blue-100 border-blue-400/30">
                                            当前所在
                                          </Badge>
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                                      <span>{commit.author}</span>
                                      <span>·</span>
                                      <span>{commit.date}</span>
                                      <span>·</span>
                                      <span>{commit.filesChanged} 个文件</span>
                                      {commit.branchId && (
                                        <>
                                          <span>·</span>
                                          <span className="flex items-center gap-1">
                                            <GitBranch className="h-3 w-3" />
                                            {commit.branchId}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </button>
                                </ContextMenuTrigger>
                                <ContextMenuContent className="min-w-48">
                                  <ContextMenuItem
                                    disabled={!commit.branchId}
                                    onSelect={() => {
                                      if (!commit.branchId) return;
                                      alert(
                                        `已基于版本 ${commit.message} 创建工作区`,
                                      );
                                    }}
                                  >
                                    <GitBranch className="h-4 w-4" />
                                    基于此版本创建工作区
                                  </ContextMenuItem>
                                </ContextMenuContent>
                              </ContextMenu>
                            );
                          })}
                        </div>
                      );
                    }

                    const branchColors: Record<string, string> = {
                      main: "#3b82f6",
                      "branch-1-lisi": "#10b981",
                      "branch-1-wangwu": "#f59e0b",
                      "branch-root-lisi": "#8b5cf6",
                      "branch-4-zhangsan": "#ec4899",
                      "branch-2-sunqi": "#06b6d4",
                      "branch-1-1-wangwu": "#06b6d4",
                      "branch-1-2-zhaoliu": "#f59e0b",
                      "branch-1-3-wangwu": "#22c55e",
                      "branch-1-3-sunqi": "#a855f7",
                    };
                    const fallbackColors = [
                      "#14b8a6",
                      "#f97316",
                      "#60a5fa",
                      "#e879f9",
                    ];
                    const branchColumns: Record<string, number> = {};
                    const commitIndexById = new Map<string, number>();
                    const commitById = new Map<string, CommitRecord>();
                    let nextColumn = 0;

                    filteredCommits.forEach((commit, index) => {
                      commitIndexById.set(commit.id, index);
                      commitById.set(commit.id, commit);
                      if (
                        commit.branchId &&
                        branchColumns[commit.branchId] === undefined
                      ) {
                        branchColumns[commit.branchId] = nextColumn;
                        nextColumn += 1;
                      }
                    });

                    const rowHeight = 28;
                    const graphPadding = 10;
                    const laneGap = 10;
                    const strokeWidth = 1.25;
                    const graphWidth = Math.max(
                      graphPadding * 2 + Math.max(nextColumn, 1) * laneGap,
                      82,
                    );
                    const graphHeight = filteredCommits.length * rowHeight;
                    const getColumn = (commit: CommitRecord) =>
                      commit.branchId
                        ? branchColumns[commit.branchId] ?? 0
                        : 0;
                    const getColor = (commit: CommitRecord) => {
                      if (commit.branchId && branchColors[commit.branchId]) {
                        return branchColors[commit.branchId];
                      }
                      return fallbackColors[getColumn(commit) % fallbackColors.length];
                    };
                    const getX = (commit: CommitRecord) =>
                      graphPadding + getColumn(commit) * laneGap;
                    const getY = (index: number) =>
                      index * rowHeight + rowHeight / 2;
                    const isSelectable = viewMode === "preview" || previewingNode;

                    return (
                      <div className="min-w-[320px] pb-2">
                        <div className="relative">
                        <svg
                          className="absolute left-0 top-0 pointer-events-none"
                          width={graphWidth}
                          height={graphHeight}
                          viewBox={`0 0 ${graphWidth} ${graphHeight}`}
                          aria-hidden="true"
                        >
                          {filteredCommits.flatMap((commit, index) => {
                            const nextIndex = filteredCommits.findIndex(
                              (candidate, candidateIndex) =>
                                candidateIndex > index &&
                                getColumn(candidate) === getColumn(commit),
                            );

                            if (nextIndex === -1) return [];

                            const x = getX(commit);

                            return (
                              <line
                                key={`${commit.id}-${filteredCommits[nextIndex].id}`}
                                x1={x}
                                y1={getY(index) + 6}
                                x2={x}
                                y2={getY(nextIndex) - 6}
                                stroke={getColor(commit)}
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                                strokeOpacity="0.72"
                              />
                            );
                          })}
                          {filteredCommits.flatMap((commit, index) => {
                            const parentId = commit.parentIds?.[0];
                            if (!parentId) return [];

                            const parentIndex = commitIndexById.get(parentId);
                            const parentCommit = commitById.get(parentId);

                            if (
                              parentIndex === undefined ||
                              !parentCommit ||
                              getColumn(parentCommit) === getColumn(commit) ||
                              parentIndex <= index
                            ) {
                              return [];
                            }

                            const currentX = getX(commit);
                            const currentY = getY(index);
                            const parentX = getX(parentCommit);
                            const parentY = getY(parentIndex);
                            const midY = currentY + Math.min(
                              Math.abs(parentY - currentY) * 0.35,
                              rowHeight * 0.9,
                            );

                            return (
                              <path
                                key={`fork-${parentId}-${commit.id}`}
                                d={`M ${parentX} ${parentY - 6} C ${parentX} ${midY}, ${currentX} ${midY}, ${currentX} ${currentY + 6}`}
                                fill="none"
                                stroke={getColor(commit)}
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                                strokeOpacity="0.68"
                              />
                            );
                          })}
                        </svg>

                        {filteredCommits.map((commit, index) => {
                          const isCurrentVersion =
                            selectedCommitVersion === commit.id ||
                            (!selectedCommitVersion && index === 0);
                          const isSelected = isSelectable
                            ? isCurrentVersion
                            : false;
                          const branchColor = getColor(commit);
                          const x = getX(commit);

                          return (
                            <div
                              key={commit.id}
                              className="grid items-center"
                              style={{
                                gridTemplateColumns: `${graphWidth}px minmax(0, 1fr)`,
                                minHeight: `${rowHeight}px`,
                              }}
                            >
                              <div className="relative h-full">
                                <div
                                  className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border shadow-[0_0_0_1.5px_rgba(31,41,55,1)]"
                                  style={{
                                    left: `${x}px`,
                                    borderColor: branchColor,
                                    backgroundColor: branchColor,
                                  }}
                                />
                              </div>

                              <ContextMenu>
                                <ContextMenuTrigger asChild>
                                  <button
                                    type="button"
                                    aria-disabled={!isSelectable}
                                    onClick={() => {
                                      if (isSelectable) {
                                        setSelectedCommitVersion(commit.id);
                                      }
                                    }}
                                    className={`flex h-7 min-w-0 items-center gap-2 rounded-sm px-1.5 text-left transition-colors ${
                                      isCurrentVersion
                                        ? "bg-blue-500/20 text-white ring-1 ring-blue-400/30"
                                        : "text-gray-300 hover:bg-blue-500/15 hover:text-white"
                                    } ${
                                      isSelectable
                                        ? "cursor-pointer"
                                        : "cursor-default"
                                    }`}
                                  >
                                    <span
                                      className="min-w-0 flex-1 truncate text-[13px] font-medium leading-5"
                                      title={commit.message}
                                    >
                                      {commit.message}
                                    </span>
                                    <div
                                      className={`flex shrink-0 items-center gap-1.5 text-[11px] leading-4 ${
                                        isCurrentVersion
                                          ? "text-blue-100"
                                          : "text-gray-500"
                                      }`}
                                    >
                                      <span className="truncate">
                                        {workspace.assignee} · {commit.date}
                                      </span>
                                      {isCurrentVersion && (
                                        <Badge className="shrink-0 bg-blue-500/25 text-blue-100 border-blue-400/30 px-1.5 py-0 text-[10px]">
                                          当前所在
                                        </Badge>
                                      )}
                                    </div>
                                  </button>
                                </ContextMenuTrigger>
                                <ContextMenuContent className="min-w-48">
                                  <ContextMenuItem
                                    disabled={!commit.branchId}
                                    onSelect={() => {
                                      if (!commit.branchId) return;
                                      alert(
                                        `已基于版本 ${commit.message} 创建工作区`,
                                      );
                                    }}
                                  >
                                    <GitBranch className="h-4 w-4" />
                                    基于此版本创建工作区
                                  </ContextMenuItem>
                                </ContextMenuContent>
                              </ContextMenu>
                            </div>
                          );
                        })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Center: 3D View / Canvas */}
        <div className="relative flex-1 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🔧</div>
            <p className="text-gray-600 text-lg font-medium">
              3D 视图区域
            </p>
            <p className="text-gray-500 text-sm mt-2">
              此处显示装配体的3D预览
            </p>
          </div>
          <div className="absolute bottom-5 right-5 z-10 flex flex-col items-end gap-2">
            {measurePanelOpen && (
              <div className="w-72 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                      <Ruler className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        测量
                      </div>
                      <div className="text-xs text-slate-500">
                        实时几何数据反馈
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-slate-500 hover:text-slate-900"
                    onClick={() => setMeasurePanelOpen(false)}
                  >
                    收起
                  </Button>
                </div>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                    <span className="text-slate-500">距离</span>
                    <span className="font-semibold text-slate-900">
                      128.40 mm
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                    <span className="text-slate-500">角度</span>
                    <span className="font-semibold text-slate-900">42.6°</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                    <span className="text-slate-500">半径</span>
                    <span className="font-semibold text-slate-900">
                      16.00 mm
                    </span>
                  </div>
                </div>
              </div>
            )}
            <Button
              size="sm"
              className="h-10 rounded-full bg-blue-600 px-4 text-white shadow-lg hover:bg-blue-700"
              onClick={() => setMeasurePanelOpen((open) => !open)}
            >
              <Ruler className="mr-2 h-4 w-4" />
              测量
            </Button>
          </div>
        </div>
      </div>

      {/* Create Part Dialog */}
      <Dialog
        open={showCreatePartDialog}
        onOpenChange={setShowCreatePartDialog}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>新建零件</DialogTitle>
            <DialogDescription>选择新建方式</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Creation Mode Selection */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setCreateMode("empty")}
                className={`p-6 border-2 rounded-lg text-left transition-colors ${
                  createMode === "empty"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FolderPlus className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="font-medium text-gray-900">
                    新建空零件
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  创建一个新的空零件节点
                </p>
              </button>

              <button
                onClick={() => setCreateMode("from-asset")}
                className={`p-6 border-2 rounded-lg text-left transition-colors ${
                  createMode === "from-asset"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="font-medium text-gray-900">
                    从资产库选择
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  从我的资产中选择已有零件
                </p>
              </button>
            </div>

            {/* Asset Selection */}
            {createMode === "from-asset" && (
              <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                <div className="text-sm font-medium text-gray-900 mb-3">
                  选择零件:
                </div>
                <div className="space-y-2">
                  {personalAssets
                    .filter((asset) => asset.type === "part")
                    .map((asset) => (
                      <div
                        key={asset.id}
                        onClick={() => {
                          setSelectedAsset(asset.id);
                          setNewNodeName(asset.name);
                        }}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
                          selectedAsset === asset.id
                            ? "bg-blue-50 border-blue-500"
                            : "hover:bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {asset.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {asset.description}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Name Input */}
            {(createMode === "empty" ||
              (createMode === "from-asset" &&
                selectedAsset)) && (
              <div className="space-y-2">
                <Label>零件名称</Label>
                <Input
                  placeholder="输入零件名称"
                  value={newNodeName}
                  onChange={(e) =>
                    setNewNodeName(e.target.value)
                  }
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreatePartDialog(false);
                setSelectedAsset(null);
                setNewNodeName("");
                setCreateMode("empty");
              }}
            >
              取消
            </Button>
            <Button
              onClick={() => {
                setShowCreatePartDialog(false);
                setSelectedAsset(null);
                setNewNodeName("");
                setCreateMode("empty");
              }}
              disabled={!newNodeName.trim()}
            >
              确认创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Assembly Dialog */}
      <Dialog
        open={showCreateAssemblyDialog}
        onOpenChange={setShowCreateAssemblyDialog}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>新建子装配体</DialogTitle>
            <DialogDescription>选择新建方式</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Creation Mode Selection */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setCreateMode("empty")}
                className={`p-6 border-2 rounded-lg text-left transition-colors ${
                  createMode === "empty"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FolderPlus className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="font-medium text-gray-900">
                    新建空装配体
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  创建一个新的空装配体节点
                </p>
              </button>

              <button
                onClick={() => setCreateMode("from-asset")}
                className={`p-6 border-2 rounded-lg text-left transition-colors ${
                  createMode === "from-asset"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="font-medium text-gray-900">
                    从资产库选择
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  从我的资产中选择已有装配体
                </p>
              </button>
            </div>

            {/* Asset Selection */}
            {createMode === "from-asset" && (
              <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                <div className="text-sm font-medium text-gray-900 mb-3">
                  选择装配体:
                </div>
                <div className="space-y-2">
                  {personalAssets
                    .filter((asset) => asset.type === "project")
                    .map((asset) => (
                      <div
                        key={asset.id}
                        onClick={() => {
                          setSelectedAsset(asset.id);
                          setNewNodeName(asset.name);
                        }}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
                          selectedAsset === asset.id
                            ? "bg-blue-50 border-blue-500"
                            : "hover:bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                          <Package className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {asset.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {asset.description}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Name Input */}
            {(createMode === "empty" ||
              (createMode === "from-asset" &&
                selectedAsset)) && (
              <div className="space-y-2">
                <Label>装配体名称</Label>
                <Input
                  placeholder="输入装配体名称"
                  value={newNodeName}
                  onChange={(e) =>
                    setNewNodeName(e.target.value)
                  }
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateAssemblyDialog(false);
                setSelectedAsset(null);
                setNewNodeName("");
                setCreateMode("empty");
              }}
            >
              取消
            </Button>
            <Button
              onClick={() => {
                setShowCreateAssemblyDialog(false);
                setSelectedAsset(null);
                setNewNodeName("");
                setCreateMode("empty");
              }}
              disabled={!newNodeName.trim()}
            >
              确认创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Commit Dialog */}
      <Dialog
        open={showCommitDialog}
        onOpenChange={setShowCommitDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>提交更改</DialogTitle>
            <DialogDescription>
              提交当前工作区的所有更改到分支{" "}
              {workspace.branchId}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="commit-message">提交说明</Label>
              <Textarea
                id="commit-message"
                placeholder="描述本次更改的内容..."
                value={commitMessage}
                onChange={(e) =>
                  setCommitMessage(e.target.value)
                }
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCommitDialog(false)}
            >
              取消
            </Button>
            <Button
              onClick={() => setShowCommitDialog(false)}
              disabled={
                modifiedCount === 0 || !commitMessage.trim()
              }
            >
              提交
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
      >
        <DialogContent className="max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>分配负责人</DialogTitle>
            <DialogDescription>
              为节点"{selectedNode?.name}"分配新的负责人
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0">
            <div className="space-y-2">
              <Label>选择负责人</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="选择成员" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem
                      key={member.id}
                      value={member.id}
                    >
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedNode &&
              selectedNode.branches.length > 0 && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-gray-900 mb-2">
                    当前已分配的负责人:
                  </div>
                  <div className="space-y-1">
                    {selectedNode.branches.map((branch) => (
                      <div
                        key={branch.branchId}
                        className="text-sm text-gray-600 flex items-center gap-2"
                      >
                        <GitBranch className="w-3 h-3" />
                        {branch.assignee} ({branch.branchId})
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>

          <DialogFooter className="flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => setShowAssignDialog(false)}
            >
              取消
            </Button>
            <Button onClick={() => setShowAssignDialog(false)}>
              确认分配
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adopt Submission Dialog */}
      <Dialog
        open={showAdoptDialog}
        onOpenChange={setShowAdoptDialog}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>查看下级提交</DialogTitle>
            <DialogDescription>
              {selectedSubmission?.nodePath}
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-medium text-gray-900 mb-2">
                  {selectedSubmission.nodeName}
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  {selectedSubmission.message}
                </div>
                <div className="text-sm text-gray-500">
                  提交者: {selectedSubmission.submittedBy} ·{" "}
                  {selectedSubmission.submittedAt}
                </div>
                <div className="text-sm text-gray-500">
                  {selectedSubmission.filesChanged} 个文件更改
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="text-sm font-medium text-gray-900 mb-2">
                  变更预览
                </div>
                <div className="text-sm text-gray-600">
                  在此处显示文件变更对比...
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAdoptDialog(false)}
            >
              关闭
            </Button>
            <Button onClick={() => setShowAdoptDialog(false)}>
              采纳此提交
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version Switch Dialog */}
      <Dialog
        open={showVersionSwitchDialog}
        onOpenChange={setShowVersionSwitchDialog}
      >
        <DialogContent
          className="max-w-md bg-gray-800 border-gray-700"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle className="text-gray-100">
              切换到历史提交
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-3 border-b border-gray-700 space-y-2">
            <div className="text-sm text-gray-400">
              节点：
              <span className="text-gray-200 ml-2">
                {selectedNodeForVersionSwitch?.name || ""}
              </span>
            </div>
            <div className="text-sm text-gray-400">
              当前版本：
              <span className="text-gray-200 ml-2">
                {getNodeVersionCommits(selectedNodeForVersionSwitch?.id)[0]?.message || "暂无版本"}
              </span>
            </div>
          </div>

          <div className="space-y-2 py-4 px-6 max-h-96 overflow-y-auto">
            {getNodeVersionCommits(selectedNodeForVersionSwitch?.id)
              .map((commit) => (
                <div
                  key={commit.id}
                  className="p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700 cursor-pointer transition-colors"
                  onClick={() => {
                    setShowVersionSwitchDialog(false);
                  }}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="text-sm font-medium text-gray-200">
                      {commit.message}
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                      {isNewNodeCommit(commit, selectedNodeForVersionSwitch) && (
                        <Badge className="bg-amber-500/15 text-amber-200">
                          新提交
                        </Badge>
                      )}
                      {isAdoptedNodeCommit(commit, selectedNodeForVersionSwitch) && (
                        <Badge className="bg-blue-500/15 text-blue-200">
                          采纳版本
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
                    <span>{commit.author}</span>
                    <span>·</span>
                    <span>{commit.date}</span>
                    <span>·</span>
                    <span>{commit.filesChanged} 个文件</span>
                    {commit.branchId && (
                      <div className="flex items-center gap-2">
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <GitBranch className="w-3 h-3" />
                          {commit.branchId}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            {getNodeVersionCommits(selectedNodeForVersionSwitch?.id).length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">该节点暂无提交记录</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowVersionSwitchDialog(false)}
              className="bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600"
            >
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
