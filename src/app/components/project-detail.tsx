import { useState, useEffect, type KeyboardEvent } from "react";
import {
  ArrowLeft,
  Users,
  ChevronRight,
  ChevronDown,
  GitBranch,
  ExternalLink,
  X,
  Plus,
  Eye,
  MessageSquare,
  Send,
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
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface NodeBranch {
  branchId: string;
  assignee: string;
  hasCommits?: boolean;
  baseVersion?: string;
}

interface TreeNode {
  id: string;
  name: string;
  type: "assembly" | "part";
  branches: NodeBranch[];
  children?: TreeNode[];
  hasCommits?: boolean;
}

interface ProjectMember {
  id: string;
  name: string;
  email: string;
  role: string;
  projectRole: "admin" | "member"; // 项目中的权限角色
}

interface BranchComment {
  id: string;
  author: string;
  time: string;
  content: string;
  links?: Array<{ type: string; label: string }>;
  replies?: BranchComment[];
}

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
  onNavigateToWorkspace: (
    branchId: string,
    viewMode?: "edit" | "preview",
    nodeType?: "assembly" | "part",
    context?: { nodeName?: string; nodePath?: string; assignee?: string },
  ) => void;
  currentUser?: string;
}

export function ProjectDetail({
  projectId,
  onBack,
  onNavigateToWorkspace,
  currentUser = "李四",
}: ProjectDetailProps) {
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(["root"]),
  );
  const [focusedBranch, setFocusedBranch] = useState<{
    branchId: string;
    nodeName: string;
    nodePath: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [commentText, setCommentText] = useState("");
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [selectedNewMembers, setSelectedNewMembers] = useState<
    Array<{ id: string; projectRole: "admin" | "member" }>
  >([]);
  const [showCreateBranchDialog, setShowCreateBranchDialog] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchAssignee, setNewBranchAssignee] = useState<string>("");
  const [newBranchBaseVersion, setNewBranchBaseVersion] = useState("current-main");

  // Mock project data
  const project = {
    id: projectId,
    name: "发动机装配项目",
    description: "V8发动机完整装配设计",
    createdBy: "张三",
    createdAt: "2024-03-15",
  };

  // Mock assembly tree
  const [assemblyTree, setAssemblyTree] = useState<TreeNode>({
    id: "root",
    name: "发动机总成",
    type: "assembly",
    hasCommits: true,
    branches: [
      {
        branchId: "main",
        assignee: "张三",
        hasCommits: true,
      },
      {
        branchId: "branch-root-lisi",
        assignee: "李四",
        hasCommits: true,
      },
      {
        branchId: "branch-root-wangwu",
        assignee: "王五",
        hasCommits: false,
      },
    ],
    children: [
      {
        id: "node-1",
        name: "气缸体组件",
        type: "assembly",
        branches: [
          {
            branchId: "branch-1-lisi",
            assignee: "李四",
            hasCommits: true,
          },
          {
            branchId: "branch-1-wangwu",
            assignee: "王五",
            hasCommits: true,
          },
        ],
        hasCommits: true,
        children: [
          {
            id: "node-1-1",
            name: "气缸体",
            type: "part",
            branches: [
              {
                branchId: "branch-1-1-wangwu",
                assignee: "王五",
                hasCommits: true,
              },
            ],
            hasCommits: true,
          },
          {
            id: "node-1-2",
            name: "气缸盖",
            type: "part",
            branches: [
              {
                branchId: "branch-1-2-zhaoliu",
                assignee: "赵六",
                hasCommits: true,
              },
            ],
            hasCommits: true,
          },
        ],
      },
      {
        id: "node-2",
        name: "曲轴系统",
        type: "assembly",
        branches: [
          {
            branchId: "branch-2-sunqi",
            assignee: "孙七",
            hasCommits: true,
          },
        ],
        hasCommits: true,
        children: [
          {
            id: "node-2-1",
            name: "曲轴",
            type: "part",
            branches: [],
            hasCommits: false,
          },
          {
            id: "node-2-2",
            name: "连杆",
            type: "part",
            branches: [],
            hasCommits: false,
          },
        ],
      },
      {
        id: "node-3",
        name: "配气机构",
        type: "assembly",
        branches: [],
        hasCommits: false,
      },
      {
        id: "node-4",
        name: "油底壳",
        type: "part",
        branches: [
          {
            branchId: "branch-4-zhangsan",
            assignee: "张三",
            hasCommits: true,
          },
        ],
        hasCommits: true,
      },
    ],
  });

  // Mock members
  const [members, setMembers] = useState<ProjectMember[]>([
    { id: "1", name: "张三", email: "zhangsan@example.com", role: "主账号", projectRole: "admin" },
    { id: "2", name: "李四", email: "lisi@example.com", role: "CAD工程师", projectRole: "admin" },
    { id: "3", name: "王五", email: "wangwu@example.com", role: "CAD工程师", projectRole: "member" },
    { id: "4", name: "赵六", email: "zhaoliu@example.com", role: "普通用户", projectRole: "member" },
    { id: "5", name: "孙七", email: "sunqi@example.com", role: "部门主管", projectRole: "member" },
  ]);

  // 所有团队成员（可以添加到项目的成员）
  const allTeamMembers: ProjectMember[] = [
    { id: "1", name: "张三", email: "zhangsan@example.com", role: "主账号", projectRole: "admin" },
    { id: "2", name: "李四", email: "lisi@example.com", role: "CAD工程师", projectRole: "admin" },
    { id: "3", name: "王五", email: "wangwu@example.com", role: "CAD工程师", projectRole: "member" },
    { id: "4", name: "赵六", email: "zhaoliu@example.com", role: "普通用户", projectRole: "member" },
    { id: "5", name: "孙七", email: "sunqi@example.com", role: "部门主管", projectRole: "member" },
    { id: "6", name: "周八", email: "zhouba@example.com", role: "CAD工程师", projectRole: "member" },
    { id: "7", name: "吴九", email: "wujiu@example.com", role: "普通用户", projectRole: "member" },
    { id: "8", name: "郑十", email: "zhengshi@example.com", role: "项目经理", projectRole: "member" },
  ];

  // 获取还未加入项目的成员
  const [branchComments, setBranchComments] = useState<Record<string, BranchComment[]>>({
    "branch-1-wangwu": [
      {
        id: "c-block-1",
        author: "张三",
        time: "今天 10:24",
        content:
          "轻量化路线的装配边界已经同步给制造侧，后续评审时重点看冷却回路和加强筋组。",
        links: [
          { type: "节点链接", label: "轻量化缸体" },
          { type: "分支链接", label: "branch-1-wangwu" },
        ],
        replies: [
          {
            id: "r-block-1",
            author: "王五",
            time: "今天 10:42",
            content: "收到，我会补一版散热桥的版本链接。",
          },
        ],
      },
      {
        id: "c-block-2",
        author: "李四",
        time: "昨天 18:05",
        content: "建议保留标准缸体路线的对比入口，方便确认父节点当前装配版本。",
        links: [{ type: "节点版本链接", label: "缸体组件 v1.7.4" }],
      },
    ],
    main: [
      {
        id: "c-root-1",
        author: "赵六",
        time: "今天 09:18",
        content: "main 分支暂时作为装配基线，传感器座的新增提交先不合入。",
        links: [
          { type: "节点链接", label: "配气机构" },
          { type: "提交链接", label: "提交 b71d4e" },
        ],
      },
    ],
    "branch-1-lisi": [
      {
        id: "c-left-1",
        author: "李四",
        time: "周三 16:30",
        content: "标准缸体路线已经补齐水套腔和主油道的版本说明。",
        links: [{ type: "节点版本链接", label: "缸体组件 v1.4.2" }],
      },
    ],
  });

  const availableMembers = allTeamMembers.filter(
    (teamMember) => !members.some((m) => m.id === teamMember.id)
  );

  const toggleNewMember = (memberId: string) => {
    if (selectedNewMembers.some((member) => member.id === memberId)) {
      setSelectedNewMembers(selectedNewMembers.filter((member) => member.id !== memberId));
    } else {
      setSelectedNewMembers([...selectedNewMembers, { id: memberId, projectRole: "member" }]);
    }
  };

  const removeNewMember = (memberId: string) => {
    setSelectedNewMembers(selectedNewMembers.filter((member) => member.id !== memberId));
  };

  const updateNewMemberRole = (
    memberId: string,
    projectRole: "admin" | "member",
  ) => {
    setSelectedNewMembers(
      selectedNewMembers.map((member) =>
        member.id === memberId ? { ...member, projectRole } : member,
      ),
    );
  };

  const handleAddMembers = () => {
    if (selectedNewMembers.length === 0) {
      alert("请至少选择一位成员");
      return;
    }

    const newMembers = selectedNewMembers
      .map((selectedMember) => {
        const member = allTeamMembers.find((m) => m.id === selectedMember.id);
        return member ? { ...member, projectRole: selectedMember.projectRole } : null;
      })
      .filter((member): member is ProjectMember => Boolean(member));

    setMembers([...members, ...newMembers]);
    setSelectedNewMembers([]);
    setShowAddMemberDialog(false);
  };

  const hasBranchInTree = (tree: TreeNode, branchId: string): boolean =>
    tree.branches.some((branch) => branch.branchId === branchId) ||
    Boolean(tree.children?.some((child) => hasBranchInTree(child, branchId)));

  const handleCreateBranch = () => {
    const trimmedBranchName = newBranchName.trim();

    if (!trimmedBranchName) {
      alert("请输入分支名称");
      return;
    }

    if (!newBranchAssignee) {
      alert("请选择负责人");
      return;
    }

    // 检查分支名称是否已存在
    if (hasBranchInTree(assemblyTree, trimmedBranchName)) {
      alert("分支名称已存在");
      return;
    }

    // 创建新分支
    const newBranch: NodeBranch = {
      branchId: trimmedBranchName,
      assignee: newBranchAssignee,
      baseVersion: newBranchBaseVersion,
    };

    setAssemblyTree({
      ...assemblyTree,
      branches: [...assemblyTree.branches, newBranch],
    });

    setNewBranchName("");
    setNewBranchAssignee("");
    setNewBranchBaseVersion("current-main");
    setShowCreateBranchDialog(false);

    // 自动切换到新创建的分支
    setFocusedBranch({
      branchId: trimmedBranchName,
      nodeName: assemblyTree.name,
      nodePath: assemblyTree.name,
    });
    setExpandedNodes(new Set([assemblyTree.id]));
  };

  // 检查当前用户是否是项目管理员
  const currentMember = members.find(m => m.name === currentUser);
  const isProjectAdmin = currentMember?.projectRole === "admin" || currentMember?.role === "主账号";

  // 初始化时自动加载 main 分支视图
  useEffect(() => {
    const mainBranch = assemblyTree.branches.find((b) => b.branchId === "main");
    if (mainBranch) {
      setFocusedBranch({
        branchId: "main",
        nodeName: assemblyTree.name,
        nodePath: assemblyTree.name,
      });
      setExpandedNodes(new Set([assemblyTree.id]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getFullNodePath = (tree: TreeNode, targetBranchId: string, currentPath: string = ""): string | null => {
    if (tree.branches.some((b) => b.branchId === targetBranchId)) {
      return currentPath ? `${currentPath}/${tree.name}` : tree.name;
    }
    if (tree.children) {
      for (const child of tree.children) {
        const childPath = currentPath ? `${currentPath}/${tree.name}` : tree.name;
        const result = getFullNodePath(child, targetBranchId, childPath);
        if (result) return result;
      }
    }
    return null;
  };

  const getNodePathSegments = (tree: TreeNode, targetBranchId: string, segments: { name: string; node: TreeNode }[] = []): { name: string; node: TreeNode }[] | null => {
    if (tree.branches.some((b) => b.branchId === targetBranchId)) {
      return [...segments, { name: tree.name, node: tree }];
    }
    if (tree.children) {
      for (const child of tree.children) {
        const result = getNodePathSegments(child, targetBranchId, [...segments, { name: tree.name, node: tree }]);
        if (result) return result;
      }
    }
    return null;
  };

  const handleNavigateToNode = (node: TreeNode) => {
    const mainBranch = node.branches.find((b) => b.branchId === "main") || node.branches[0];
    if (mainBranch) {
      const fullPath = getFullNodePath(assemblyTree, mainBranch.branchId);
      handleViewBranchDetail(mainBranch.branchId, node.name, fullPath || node.name);
    }
  };

  const handleViewBranchDetail = (
    branchId: string,
    nodeName: string,
    nodePath: string,
  ) => {
    const fullPath = getFullNodePath(assemblyTree, branchId);
    setFocusedBranch({
      branchId,
      nodeName,
      nodePath: fullPath || nodePath
    });
    const branchNode = findNodeInTree(assemblyTree, branchId);
    if (branchNode) {
      setExpandedNodes(new Set([branchNode.id]));
    }
  };

  const findNodeInTree = (tree: TreeNode, branchId: string): TreeNode | null => {
    if (tree.branches.some((b) => b.branchId === branchId)) {
      return tree;
    }
    if (tree.children) {
      for (const child of tree.children) {
        const found = findNodeInTree(child, branchId);
        if (found) return found;
      }
    }
    return null;
  };

  const renderTreeNode = (node: TreeNode, level: number = 0, isRootInBranchView: boolean = false, isActualRoot: boolean = false, showChildrenOnly: boolean = false) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const indent = level * 32;
    const hasBranches = node.branches.length > 0;

    const canExpand = isRootInBranchView ? level === 0 : true;
    // 如果是只显示子节点模式，不展开子节点的子节点
    const shouldShowChildren = showChildrenOnly ? false : (hasChildren && isExpanded && canExpand);

    // 根据层级调整样式
    const isParent = level === 0;
    const isChild = level === 1;
    const isGrandChild = level >= 2;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-3 rounded-lg transition-all ${
            isParent
              ? "py-4 px-4 bg-gradient-to-r from-purple-50 to-white border-l-4 border-purple-400 hover:shadow-md"
              : isChild
              ? "py-3 px-4 bg-blue-50/50 border-l-2 border-blue-300 hover:bg-blue-50"
              : "py-2 px-4 hover:bg-gray-50"
          }`}
          style={{ marginLeft: `${indent}px` }}
        >
          <div className="w-6 h-6 flex items-center justify-center">
            {hasChildren && canExpand && !showChildrenOnly && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.id);
                }}
                className={`hover:bg-gray-200 rounded p-1 transition-colors ${
                  isParent ? "text-purple-600" : "text-gray-600"
                }`}
              >
                {isExpanded ? (
                  <ChevronDown className={isParent ? "w-5 h-5" : "w-4 h-4"} />
                ) : (
                  <ChevronRight className={isParent ? "w-5 h-5" : "w-4 h-4"} />
                )}
              </button>
            )}
          </div>

          <div className="flex-1 flex items-center gap-3">
            <div
              className={`rounded flex items-center justify-center font-semibold shadow-sm ${
                isParent
                  ? "w-10 h-10 text-base bg-gradient-to-br from-purple-500 to-purple-600 text-white"
                  : isChild
                  ? "w-9 h-9 text-sm bg-gradient-to-br from-blue-400 to-blue-500 text-white"
                  : node.type === "assembly"
                  ? "w-8 h-8 text-xs bg-purple-100 text-purple-700 border border-purple-200"
                  : "w-8 h-8 text-xs bg-blue-100 text-blue-700 border border-blue-200"
              }`}
            >
              {node.type === "assembly" ? "装" : "件"}
            </div>

            <div className="flex-1">
              <div className={`text-gray-900 ${
                isParent ? "text-lg font-bold" : isChild ? "text-base font-semibold" : "font-medium"
              }`}>
                {node.name}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                {hasBranches && (
                  <span>{node.branches.length} 个分支</span>
                )}
              </div>
            </div>

            {node.branches.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className={`${
                  node.hasCommits
                    ? "hover:bg-blue-50 hover:border-blue-400"
                    : "opacity-50 cursor-not-allowed"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (node.hasCommits && node.branches[0]) {
                    onNavigateToWorkspace(node.branches[0].branchId, "preview", node.type, {
                      nodeName: node.name,
                      nodePath: getFullNodePath(assemblyTree, node.branches[0].branchId) || node.name,
                      assignee: node.branches[0].assignee,
                    });
                  }
                }}
                disabled={!node.hasCommits}
                title={!node.hasCommits ? "提交为空" : "查看"}
              >
                <Eye className="w-4 h-4 mr-1" />
                查看
              </Button>
            )}

          </div>
        </div>

        {hasBranches && (
          <div style={{ marginLeft: `${indent + 48}px` }} className="space-y-2 mt-3 mb-4">
            {node.branches
              .filter((branch) => {
                // 只有真正的根节点在 main 分支视图时才过滤
                if (isActualRoot && focusedBranch?.branchId === "main") {
                  return branch.branchId === "main";
                }
                // 子节点显示所有分支
                return true;
              })
              .map((branch) => {
                const isCurrentBranch = focusedBranch?.branchId === branch.branchId;
                const isAssignee = branch.assignee === currentUser;
                return (
                  <div
                    key={branch.branchId}
                    className={`flex items-center gap-3 py-2 px-4 rounded-lg border transition-colors cursor-pointer ${
                      isCurrentBranch
                        ? "bg-blue-100 border-blue-400"
                        : "bg-gray-50 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                    onClick={() => handleViewBranchDetail(branch.branchId, node.name, node.name)}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <GitBranch className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900">
                        {branch.branchId}
                      </span>
                      <span className="text-sm text-gray-500">
                        负责人: {branch.assignee}
                      </span>
                    </div>

                    {isAssignee && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToWorkspace(branch.branchId, "edit", node.type, {
                            nodeName: node.name,
                            nodePath: getFullNodePath(assemblyTree, branch.branchId) || node.name,
                            assignee: branch.assignee,
                          });
                        }}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        工作区
                      </Button>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {shouldShowChildren && (
          <div className="mt-2 space-y-2">
            {node.children!.map((child) => renderTreeNode(child, level + 1, isRootInBranchView, false, showChildrenOnly))}
          </div>
        )}
      </div>
    );
  };

  const renderBranchDetailView = () => {
    if (!focusedBranch) {
      return (
        <div className="text-center py-12 text-gray-500">
          加载中...
        </div>
      );
    }

    const branchNode = findNodeInTree(assemblyTree, focusedBranch.branchId);
    if (!branchNode) {
      return (
        <div className="text-center py-12 text-gray-500">
          未找到分支信息
        </div>
      );
    }

    const currentBranch = branchNode.branches.find(
      (b) => b.branchId === focusedBranch.branchId
    );

    return (
      <div className="space-y-6">
        {currentBranch && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <GitBranch className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-blue-700 font-medium mb-1">
                  当前节点
                </div>
                <div className="text-xl font-bold text-gray-900 mb-1">
                  {branchNode.name}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-700">
                    <span className="font-medium">分支:</span> {currentBranch.branchId}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-700">
                    <span className="font-medium">负责人:</span> {currentBranch.assignee}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {currentBranch.assignee === currentUser && (
                  <Button
                    size="lg"
                    onClick={() => onNavigateToWorkspace(currentBranch.branchId, "edit", branchNode.type, {
                      nodeName: branchNode.name,
                      nodePath: focusedBranch.nodePath,
                      assignee: currentBranch.assignee,
                    })}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    进入工作区
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="lg"
                  className={`${
                    branchNode.hasCommits
                      ? "hover:bg-blue-50 hover:border-blue-400"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                  onClick={() => {
                    if (branchNode.hasCommits) {
                      onNavigateToWorkspace(currentBranch.branchId, "preview", branchNode.type, {
                        nodeName: branchNode.name,
                        nodePath: focusedBranch.nodePath,
                        assignee: currentBranch.assignee,
                      });
                    }
                  }}
                  disabled={!branchNode.hasCommits}
                  title={!branchNode.hasCommits ? "提交为空" : "查看"}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  查看
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          {branchNode.children && branchNode.children.length > 0 ? (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-500 mb-3 px-2">
                直接子节点
              </div>
              {branchNode.children.map((child) => renderTreeNode(child, 0, false, false, true))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              暂无子节点
            </div>
          )}
        </div>
      </div>
    );
  };

  const getNodePathById = (
    tree: TreeNode,
    targetId: string,
    path: TreeNode[] = [],
  ): TreeNode[] | null => {
    const nextPath = [...path, tree];
    if (tree.id === targetId) return nextPath;
    if (tree.children) {
      for (const child of tree.children) {
        const result = getNodePathById(child, targetId, nextPath);
        if (result) return result;
      }
    }
    return null;
  };

  const flattenNodes = (tree: TreeNode): TreeNode[] => [
    tree,
    ...(tree.children?.flatMap(flattenNodes) || []),
  ];

  const getNodeKindLabel = (node: TreeNode) =>
    node.type === "assembly" ? "装配体" : "零件";

  const getNodeMark = (node: TreeNode) =>
    node.type === "assembly" ? "装" : "件";

  const getNodeTone = (node: TreeNode) =>
    node.type === "assembly"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

  const getNodeDescription = (node: TreeNode) =>
    node.type === "assembly" ? "装配体节点" : "零件节点";

  const metricSeed = (value: string) =>
    value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);

  const commitCode = (value: string) =>
    metricSeed(value).toString(16).padStart(6, "0").slice(0, 6);

  const getNodeMeta = (node: TreeNode, branch?: NodeBranch | null) => {
    const seed = metricSeed(node.id);
    // Adopted version means the version accepted by the parent node's last commit.
    // It is tied to the parent-child relationship, not the currently viewed branch.
    branch = node.branches[0] || null;
    return {
      parentVersion: `v1.${(seed % 8) + 1}.${(seed % 5) + 1} / 提交 ${commitCode(node.id)}`,
      adoptedVersion: `${branch?.branchId || "负责分支"} / 提交 ${commitCode(`${node.id}-adopted`)}`,
      newCommitCount: (seed % 4) + Math.max(0, node.branches.length - 1),
    };
  };

  const getBranchDescription = (node: TreeNode, branch: NodeBranch) => {
    const descriptions: Record<string, string> = {
      main: "标准集成视图。",
      "branch-root-lisi": "把热管理提前到一级结构里。",
      "branch-root-wangwu": "加入预装工艺节点。",
      "branch-1-lisi": "标准缸体路线，继续拆成左右缸体和孔位组。",
      "branch-1-wangwu": "轻量化路线，子节点变成轻量化缸体、冷却回路和加强筋组。",
      "branch-1-2-zhaoliu": "维持常规缸盖结构，后续补充接口细节。",
      "branch-2-sunqi": "结构基本稳定，主要做细节收敛。",
      "branch-3-zhaoliu": "维持常规结构，后续再补传感器座。",
      "branch-4-zhangsan": "油底壳负责人分支，聚焦密封结构和安装边界。",
    };

    return descriptions[branch.branchId] || `${node.name} 的负责分支。`;
  };

  const getCommentsForBranch = (branchId?: string) =>
    branchId ? branchComments[branchId] || [] : [];

  const getBranchPathLabel = (branchId: string) =>
    getFullNodePath(assemblyTree, branchId) || assemblyTree.name;

  const selectNodeDefaultBranch = (node: TreeNode) => {
    const defaultBranch =
      node.branches.find((branch) => branch.branchId === "main") ||
      node.branches[0];
    if (defaultBranch) {
      handleViewBranchDetail(
        defaultBranch.branchId,
        node.name,
        getBranchPathLabel(defaultBranch.branchId),
      );
    }
  };

  const activeNode = focusedBranch
    ? findNodeInTree(assemblyTree, focusedBranch.branchId) || assemblyTree
    : assemblyTree;
  const activeBranch =
    activeNode.branches.find(
      (branch) => branch.branchId === focusedBranch?.branchId,
    ) ||
    activeNode.branches[0] ||
    null;
  const activePath = getNodePathById(assemblyTree, activeNode.id) || [
    assemblyTree,
  ];
  const siblingNodes =
    activePath.length > 1
      ? activePath[activePath.length - 2].children || []
      : [assemblyTree];
  const searchResults = searchQuery.trim()
    ? flattenNodes(assemblyTree)
        .flatMap((node) => {
          const keyword = searchQuery.trim().toLowerCase();
          const items: Array<{
            type: "node" | "branch";
            label: string;
            detail: string;
            node: TreeNode;
            branch?: NodeBranch;
          }> = [];

          if (node.name.toLowerCase().includes(keyword)) {
            items.push({
              type: "node",
              label: node.name,
              detail: `${getNodeKindLabel(node)} · ${node.branches.length} 个分支`,
              node,
            });
          }

          node.branches.forEach((branch) => {
            if (
              branch.branchId.toLowerCase().includes(keyword) ||
              branch.assignee.toLowerCase().includes(keyword)
            ) {
              items.push({
                type: "branch",
                label: branch.branchId,
                detail: `${node.name} · 负责人：${branch.assignee}`,
                node,
                branch,
              });
            }
          });

          return items;
        })
        .slice(0, 8)
    : [];

  const renderNodeThumb = (node: TreeNode, compact = false) => (
    <span
      className={`grid shrink-0 content-end gap-1 overflow-hidden rounded-lg border p-1.5 ${getNodeTone(node)} ${
        compact ? "h-9 w-11" : "h-14 w-[72px]"
      }`}
      aria-hidden="true"
    >
      <span className="h-1.5 w-7 rounded-full bg-current opacity-45" />
      <span className="h-1.5 w-10 rounded-full bg-current opacity-25" />
    </span>
  );

  const renderBranchThumb = (branch: NodeBranch) => (
    <span
      className="grid h-10 w-12 shrink-0 content-end gap-1 overflow-hidden rounded-lg border border-amber-200 bg-amber-50 p-1.5 text-amber-600"
      aria-hidden="true"
    >
      <span className="h-1.5 w-8 rounded-full bg-current opacity-45" />
      <span className="h-1.5 w-5 rounded-full bg-current opacity-25" />
    </span>
  );

  const getBranchLatestVersion = (branch: NodeBranch) =>
    `${branch.branchId} / 提交 ${commitCode(`${branch.branchId}-latest`)}`;

  const rootMainBranch =
    assemblyTree.branches.find((branch) => branch.branchId === "main") ||
    assemblyTree.branches[0] ||
    null;
  const rootBranchBaseOptions = rootMainBranch
    ? [
        {
          value: "current-main",
          label: `当前主节点版本：${getBranchLatestVersion(rootMainBranch)}`,
        },
        {
          value: "root-baseline",
          label: `${assemblyTree.name} 基线版本：${rootMainBranch.branchId} / 提交 ${commitCode(
            `${assemblyTree.id}-baseline`,
          )}`,
        },
      ]
    : [
        {
          value: "current-main",
          label: "当前主节点版本",
        },
      ];

  const renderNodeMeta = (node: TreeNode, branch?: NodeBranch | null) => (
    <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-white/80 p-2 text-xs">
      <div className="min-w-0">
        <div className="text-slate-500">采纳版本</div>
        <div className="truncate font-semibold text-blue-700">
          {branch?.branchId || "暂无分支"}
        </div>
      </div>
      <div className="min-w-0">
        <div className="text-slate-500">负责人</div>
        <div className="truncate font-semibold text-slate-700">
          {branch?.assignee || "未分配"}
        </div>
      </div>
      <div className="min-w-0">
        <div className="text-slate-500">节点类型</div>
        <div className="truncate font-semibold text-slate-700">
          {getNodeKindLabel(node)}
        </div>
      </div>
      <div className="min-w-0">
        <div className="text-slate-500">新提交</div>
        <div
          className={`truncate font-semibold ${
            node.hasCommits ? "text-amber-700" : "text-emerald-700"
          }`}
        >
          {node.hasCommits ? "有更新" : "暂无"}
        </div>
      </div>
    </div>
  );

  const nodeChipClass =
    "inline-flex h-7 items-center rounded-md px-2 text-xs font-medium";

  const renderNodeStatus = (
    node: TreeNode,
    align: "start" | "end" = "end",
  ) => (
    <div
      className={`flex flex-wrap gap-1.5 ${
        align === "start" ? "justify-start" : "justify-end"
      }`}
    >
      {(() => {
        const meta = getNodeMeta(node, node.branches[0]);
        return (
          <Badge
            className={`${nodeChipClass} ${
              meta.newCommitCount
                ? "bg-amber-50 text-amber-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            新提交：{meta.newCommitCount}
          </Badge>
        );
      })()}
      <Badge
        className={`${nodeChipClass} ${
          node.type === "assembly"
            ? "bg-blue-50 text-blue-700"
            : "bg-emerald-50 text-emerald-700"
        }`}
      >
        {getNodeKindLabel(node)} · {node.branches.length} 分支
      </Badge>
    </div>
  );

  const renderAdoptedVersion = (node: TreeNode, branch?: NodeBranch | null) => (
    node.id === assemblyTree.id ? null : (
      <div className="mt-1 truncate text-xs text-slate-500">
        采纳版本：
        <span className="font-semibold text-blue-700">
          {getNodeMeta(node, branch).adoptedVersion}
        </span>
      </div>
    )
  );

  const renderNodeMetaV3 = (node: TreeNode, branch?: NodeBranch | null) => {
    const meta = getNodeMeta(node, branch);
    return (
      <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-white/80 p-2 text-xs">
        <div className="min-w-0">
          <div className="text-slate-500">父节点版本</div>
          <div className="truncate font-semibold text-slate-700">
            {meta.parentVersion}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-slate-500">采纳版本</div>
          <div className="truncate font-semibold text-blue-700">
            {meta.adoptedVersion}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-slate-500">负责人</div>
          <div className="truncate font-semibold text-slate-700">
            {branch?.assignee || "未分配"}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-slate-500">新提交</div>
          <div
            className={`truncate font-semibold ${
              meta.newCommitCount ? "text-amber-700" : "text-emerald-700"
            }`}
          >
            {meta.newCommitCount}
          </div>
        </div>
      </div>
    );
  };

  const renderWorkspaceActions = (
    node: TreeNode,
    branch?: NodeBranch | null,
    options: { showView?: boolean; showEdit?: boolean } = {},
  ) => {
    if (!branch) return null;
    const { showView = true, showEdit = true } = options;
    const nodePath = getBranchPathLabel(branch.branchId);
    return (
      <div className="flex flex-wrap justify-end gap-2">
        {showView && (
          <Button
            variant="outline"
            size="sm"
            className={node.hasCommits ? "h-8" : "h-8 opacity-50"}
            disabled={!node.hasCommits}
            onClick={(event) => {
              event.stopPropagation();
              if (node.hasCommits) {
                onNavigateToWorkspace(branch.branchId, "preview", node.type, {
                  nodeName: node.name,
                  nodePath,
                  assignee: branch.assignee,
                });
              }
            }}
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            查看
          </Button>
        )}
        {showEdit && branch.assignee === currentUser && (
          <Button
            size="sm"
            className="h-8 bg-blue-600 hover:bg-blue-700"
            onClick={(event) => {
              event.stopPropagation();
              onNavigateToWorkspace(branch.branchId, "edit", node.type, {
                nodeName: node.name,
                nodePath,
                assignee: branch.assignee,
              });
            }}
          >
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            工作区
          </Button>
        )}
      </div>
    );
  };

  const handleSubmitComment = () => {
    if (!activeBranch || !commentText.trim()) return;

    const newComment: BranchComment = {
      id: `c-${Date.now()}`,
      author: currentUser,
      time: "刚刚",
      content: commentText.trim(),
    };

    setBranchComments((current) => {
      const existing = current[activeBranch.branchId] || [];
      if (replyToCommentId) {
        return {
          ...current,
          [activeBranch.branchId]: existing.map((comment) =>
            comment.id === replyToCommentId
              ? {
                  ...comment,
                  replies: [...(comment.replies || []), newComment],
                }
              : comment,
          ),
        };
      }

      return {
        ...current,
        [activeBranch.branchId]: [newComment, ...existing],
      };
    });
    setCommentText("");
    setReplyToCommentId(null);
  };

  const handleCardKeyDown = (
    event: KeyboardEvent<HTMLElement>,
    action: () => void,
  ) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      action();
    }
  };

  const renderCommentCard = (comment: BranchComment, nested = false) => (
    <article
      key={comment.id}
      className={`grid gap-2 rounded-lg border border-slate-200 bg-white p-3 ${
        nested ? "ml-3 border-l-2 border-l-slate-300" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
        <span className="font-semibold text-slate-900">{comment.author}</span>
        <span>{comment.time}</span>
      </div>
      <p className="text-sm leading-6 text-slate-700">{comment.content}</p>
      {comment.links?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {comment.links.map((link) => (
            <Badge
              key={`${comment.id}-${link.type}-${link.label}`}
              className="bg-blue-50 text-blue-700"
            >
              {link.type}：{link.label}
            </Badge>
          ))}
        </div>
      ) : null}
      {!nested && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => {
              setReplyToCommentId(comment.id);
              setCommentText(`回复 @${comment.author}：`);
            }}
          >
            回复
          </Button>
        </div>
      )}
      {comment.replies?.length ? (
        <div className="grid gap-2">
          {comment.replies.map((reply) => renderCommentCard(reply, true))}
        </div>
      ) : null}
    </article>
  );

  return (
    <div className="grid h-screen grid-rows-[auto_minmax(0,1fr)] overflow-hidden p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回项目大厅
          </Button>
          <h1 className="mb-2 text-3xl font-bold text-slate-950">
            {project.name}
          </h1>
          <p className="text-slate-600">{project.description}</p>
          <div className="mt-2 flex items-center gap-4 text-sm text-slate-500">
            <span>创建者：{project.createdBy}</span>
            <span>创建时间：{project.createdAt}</span>
          </div>
        </div>

        <div className="flex gap-3">
          {isProjectAdmin && (
            <Button
              variant="outline"
              onClick={() => {
                setNewBranchName("");
                setNewBranchAssignee("");
                setNewBranchBaseVersion("current-main");
                setShowCreateBranchDialog(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              添加主分支
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowMembersDialog(true)}>
            <Users className="mr-2 h-4 w-4" />
            项目成员 ({members.length})
          </Button>
        </div>
      </div>

      <section className="grid min-h-0 grid-cols-[250px_minmax(0,1fr)] gap-4 overflow-hidden">
        <aside className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 p-4">
            <h2 className="mb-1 text-[17px] font-semibold text-slate-900">
              搜索定位
            </h2>
          </div>
          <div className="min-h-0 overflow-auto p-3">
            <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3">
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="搜索节点名称或分支名称"
                className="h-9"
              />
              <div className="grid gap-1.5">
                {searchQuery.trim() ? (
                  searchResults.length ? (
                    searchResults.map((item) => (
                      <button
                        key={`${item.type}-${item.label}-${item.node.id}`}
                        type="button"
                        onClick={() => {
                          if (item.branch) {
                            handleViewBranchDetail(
                              item.branch.branchId,
                              item.node.name,
                              getBranchPathLabel(item.branch.branchId),
                            );
                          } else {
                            selectNodeDefaultBranch(item.node);
                          }
                          setSearchQuery("");
                        }}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-slate-900">
                            {item.label}
                          </span>
                          <span className="block truncate text-xs text-slate-500">
                            {item.detail}
                          </span>
                        </span>
                        <Badge className={item.type === "branch" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}>
                          {item.type === "branch" ? "分支" : "节点"}
                        </Badge>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-500">
                      未找到匹配的节点或分支。
                    </div>
                  )
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 p-3 text-sm leading-6 text-slate-500">
                    输入节点名称、分支名称或负责人后展示匹配结果。
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        <section className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden">
          <div className="flex min-h-16 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 shadow-sm">
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-slate-500">
              <span>{project.name}</span>
              {activePath.map((node, index) => {
                const branch = node.branches.find(
                  (item) =>
                    index === activePath.length - 1
                      ? item.branchId === activeBranch?.branchId
                      : item.branchId === "main",
                ) || node.branches[0];
                const isLast = index === activePath.length - 1;

                return (
                  <div key={node.id} className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => branch && handleViewBranchDetail(branch.branchId, node.name, getBranchPathLabel(branch.branchId))}
                      className={`rounded-lg border px-3 py-1.5 transition-colors ${
                        isLast
                          ? "border-blue-200 bg-blue-50 font-semibold text-blue-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700"
                      }`}
                    >
                      {node.name}
                      {branch ? ` / ${branch.branchId}` : ""}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <section className="grid min-h-0 grid-cols-[400px_350px_minmax(360px,1fr)] gap-4 overflow-hidden">
            <aside className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50 p-4">
                <h2 className="mb-1 text-[17px] font-semibold text-slate-900">
                  导航上下文
                </h2>
              </div>
              <div className="min-h-0 overflow-auto p-3">
                <div className="mb-3 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3">
                    {renderNodeThumb(activeNode)}
                    <div className="min-w-0">
                      <div className="mb-1 grid gap-1">
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-semibold text-slate-950">
                            {activeNode.name}
                          </h3>
                        </div>
                        {renderNodeStatus(activeNode, "start")}
                      </div>
                      {renderAdoptedVersion(activeNode, activeBranch)}
                      <div className="mt-3 flex justify-end">
                        {renderWorkspaceActions(activeNode, activeBranch, {
                          showEdit: false,
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <h3 className="mb-2 text-sm font-semibold text-slate-700">
                    同级节点
                  </h3>
                  <div className="grid gap-2">
                    {siblingNodes.map((node) => {
                      const branch =
                        node.branches.find((item) => item.branchId === "main") ||
                        node.branches[0];
                      const isActive = node.id === activeNode.id;
                      return (
                        <div
                          key={node.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => selectNodeDefaultBranch(node)}
                          onKeyDown={(event) =>
                            handleCardKeyDown(event, () =>
                              selectNodeDefaultBranch(node),
                            )
                          }
                          className={`grid grid-cols-[44px_minmax(0,1fr)] gap-2 rounded-lg border p-2 text-left transition ${
                            isActive
                              ? "border-blue-300 bg-blue-50"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          {renderNodeThumb(node, true)}
                          <span className="min-w-0">
                            <span className="grid gap-1">
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold text-slate-900">
                                  {node.name}
                                </span>
                              </span>
                              {renderNodeStatus(node, "start")}
                            </span>
                            {renderAdoptedVersion(node, branch)}
                            <span className="mt-2 flex justify-end">
                              {renderWorkspaceActions(node, branch, {
                                showEdit: false,
                              })}
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </aside>

            <section className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50 p-4">
                <h2 className="mb-1 text-[17px] font-semibold text-slate-900">
                  {activeNode.name}的分支
                </h2>
              </div>
              <div className="min-h-0 overflow-auto p-3">
                <div className="grid gap-2">
                  {activeNode.branches.length ? (
                    activeNode.branches.map((branch) => {
                      const isActive = branch.branchId === activeBranch?.branchId;
                      return (
                        <div
                          key={branch.branchId}
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            handleViewBranchDetail(
                              branch.branchId,
                              activeNode.name,
                              getBranchPathLabel(branch.branchId),
                            )
                          }
                          onKeyDown={(event) =>
                            handleCardKeyDown(event, () =>
                              handleViewBranchDetail(
                                branch.branchId,
                                activeNode.name,
                                getBranchPathLabel(branch.branchId),
                              ),
                            )
                          }
                          className={`grid gap-3 rounded-lg border p-3 text-left transition ${
                            isActive
                              ? "border-blue-300 bg-blue-50"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <span className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-start gap-3">
                            {renderBranchThumb(branch)}
                            <span className="min-w-0">
                              <span className="block truncate text-base font-semibold text-slate-950">
                                {branch.branchId}
                              </span>
                            </span>
                            <Badge className={`${nodeChipClass} bg-amber-50 text-amber-700`}>
                              留言：{getCommentsForBranch(branch.branchId).length}
                            </Badge>
                          </span>
                          <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-700">
                            <span>负责人：{branch.assignee}</span>
                            <span className="text-blue-700">
                              子节点：{activeNode.children?.length || 0}
                            </span>
                          </span>
                          <div className="truncate text-xs text-slate-500">
                            最新提交版本：
                            <span className="font-semibold text-blue-700">
                              {getBranchLatestVersion(branch)}
                            </span>
                          </div>
                          {renderWorkspaceActions(activeNode, branch, {
                            showView: false,
                          })}
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm leading-6 text-slate-500">
                      当前节点暂无负责分支。
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50 p-4">
                <h2 className="mb-1 text-[17px] font-semibold text-slate-900">
                  {activeBranch ? `${activeBranch.branchId} 下的子节点` : `${activeNode.name}的详情`}
                </h2>
              </div>
              <div className="min-h-0 overflow-auto p-3">
                <div className="grid gap-2">
                  {activeNode.children?.length ? (
                    activeNode.children.map((child) => {
                      const branch =
                        child.branches.find((item) => item.branchId === "main") ||
                        child.branches[0];
                      return (
                        <div
                          key={child.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => selectNodeDefaultBranch(child)}
                          onKeyDown={(event) =>
                            handleCardKeyDown(event, () =>
                              selectNodeDefaultBranch(child),
                            )
                          }
                          className="grid grid-cols-[44px_minmax(0,1fr)] gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          {renderNodeThumb(child, true)}
                          <span className="min-w-0">
                            <span className="grid gap-1">
                              <span>
                                <span className="block truncate text-base font-semibold text-slate-950">
                                  {child.name}
                                </span>
                              </span>
                              {renderNodeStatus(child, "start")}
                            </span>
                            <span className="mt-2 block">
                              {renderAdoptedVersion(child, branch)}
                            </span>
                            <span className="mt-2 block">
                              {renderWorkspaceActions(child, branch, {
                                showEdit: false,
                              })}
                            </span>
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm leading-6 text-slate-500">
                      当前节点没有下级节点，但仍可以维护自己的负责分支。
                    </div>
                  )}
                </div>

                <section className="mt-4 grid gap-3 border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
                      <MessageSquare className="h-4 w-4 text-slate-500" />
                      分支留言
                    </h3>
                    <Badge className="bg-slate-100 text-slate-700">
                      {activeBranch
                        ? `${activeBranch.branchId} · ${getCommentsForBranch(activeBranch.branchId).length} 条`
                        : "暂无分支"}
                    </Badge>
                  </div>

                  <div className="grid gap-2">
                    {activeBranch && getCommentsForBranch(activeBranch.branchId).length ? (
                      getCommentsForBranch(activeBranch.branchId).map((comment) =>
                        renderCommentCard(comment),
                      )
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm leading-6 text-slate-500">
                        当前分支还没有留言，可以先记录评审意见或补充链接。
                      </div>
                    )}
                  </div>

                </section>
              </div>
              <div className="border-t border-slate-200 bg-white p-3">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
                  <Input
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleSubmitComment();
                      }
                    }}
                    placeholder={replyToCommentId ? "输入回复" : "输入评论"}
                    disabled={!activeBranch}
                    className="h-9 border-0 bg-transparent shadow-none focus-visible:ring-0"
                  />
                  <Button
                    size="sm"
                    className="h-9 bg-blue-600 hover:bg-blue-700"
                    disabled={!activeBranch || !commentText.trim()}
                    onClick={handleSubmitComment}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </section>
          </section>
        </section>
      </section>

      {false && (
        <>
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回项目大厅
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {project.name}
            </h1>
            <p className="text-gray-600">{project.description}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>创建者: {project.createdBy}</span>
              <span>创建时间: {project.createdAt}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowMembersDialog(true)}>
              <Users className="w-4 h-4 mr-2" />
              项目成员 ({members.length})
            </Button>
            {(() => {
              const currentMember = members.find(m => m.name === currentUser);
              const isAdmin = currentMember?.projectRole === "admin" || currentMember?.role === "主账号";
              return isAdmin && (
                <Button onClick={() => setShowAddMemberDialog(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  添加成员
                </Button>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Assembly Tree */}
      <Card className="p-6">
        <div className="mb-4">
          {/* 分支选择器 - 显示所有根节点分支 */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b">
            <span className="text-sm text-gray-600 font-medium">项目根节点分支:</span>
            <div className="flex flex-wrap gap-2">
              {assemblyTree.branches.map((branch) => {
                const isActive = focusedBranch?.branchId === branch.branchId;
                return (
                  <button
                    key={branch.branchId}
                    onClick={() => handleViewBranchDetail(branch.branchId, assemblyTree.name, assemblyTree.name)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                    }`}
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    <span className="text-sm font-medium">{branch.branchId}</span>
                    <span className="text-xs opacity-75">({branch.assignee})</span>
                  </button>
                );
              })}
              {isProjectAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewBranchAssignee(currentUser);
                    setShowCreateBranchDialog(true);
                  }}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  新建分支
                </Button>
              )}
            </div>
          </div>

          {focusedBranch && (() => {
            const pathSegments = getNodePathSegments(assemblyTree, focusedBranch.branchId);
            return (
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-sm text-gray-500">{project.name}</span>
                {pathSegments && pathSegments.map((segment, index) => {
                  const isLast = index === pathSegments.length - 1;
                  const isCurrentBranch = segment.node.branches.some((b) => b.branchId === focusedBranch.branchId);

                  return (
                    <div key={index} className="flex items-center gap-2">
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                      {isLast && isCurrentBranch ? (
                        <div className="flex items-center gap-2">
                          <GitBranch className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-900">
                            {focusedBranch.branchId}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({segment.name})
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleNavigateToNode(segment.node)}
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {(segment.node.branches.find((b) => b.branchId === "main") || segment.node.branches[0])?.branchId || segment.name} ({segment.name})
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {renderBranchDetailView()}
      </Card>
        </>
      )}

      {/* Members Dialog */}
      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>项目成员</DialogTitle>
            <DialogDescription>
              查看和管理项目成员
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              {members.map((member) => {
                const currentMember = members.find(m => m.name === currentUser);
                const isCurrentUserAdmin = currentMember?.projectRole === "admin" || currentMember?.role === "主账号";
                const isMemberMainAccount = member.role === "主账号";

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {member.name}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCurrentUserAdmin && !isMemberMainAccount ? (
                        <Select
                          value={member.projectRole}
                          onValueChange={(value: "admin" | "member") => {
                            setMembers(members.map(m =>
                              m.id === member.id ? {...m, projectRole: value} : m
                            ));
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">管理员</SelectItem>
                            <SelectItem value="member">普通成员</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge
                          className={
                            member.projectRole === "admin"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }
                        >
                          {member.projectRole === "admin" ? "管理员" : "普通成员"}
                        </Badge>
                      )}
                      {isCurrentUserAdmin && !isMemberMainAccount && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setMembers(members.filter(m => m.id !== member.id));
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            {(() => {
              const currentMember = members.find(m => m.name === currentUser);
              const isCurrentUserAdmin = currentMember?.projectRole === "admin" || currentMember?.role === "主账号";
              return (
                <>
                  {isCurrentUserAdmin && (
                    <Button
                      onClick={() => {
                        setShowMembersDialog(false);
                        setShowAddMemberDialog(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      添加成员
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setShowMembersDialog(false)}
                  >
                    关闭
                  </Button>
                </>
              );
            })()}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateBranchDialog} onOpenChange={setShowCreateBranchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加主分支</DialogTitle>
            <DialogDescription>
              为根节点“{assemblyTree.name}”创建新的主分支，可选择基于当前主节点版本或基线版本开始。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="root-branch-name">分支名称</Label>
              <Input
                id="root-branch-name"
                placeholder="例如: branch-root-zhangsan"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newBranchAssignee) {
                    handleCreateBranch();
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="root-branch-base-version">基于版本</Label>
              <Select
                value={newBranchBaseVersion}
                onValueChange={setNewBranchBaseVersion}
              >
                <SelectTrigger id="root-branch-base-version">
                  <SelectValue placeholder="选择主节点版本" />
                </SelectTrigger>
                <SelectContent>
                  {rootBranchBaseOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="root-branch-assignee">负责人</Label>
              <Select value={newBranchAssignee} onValueChange={setNewBranchAssignee}>
                <SelectTrigger id="root-branch-assignee">
                  <SelectValue placeholder="选择负责人" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.name}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateBranchDialog(false);
                setNewBranchName("");
                setNewBranchAssignee("");
                setNewBranchBaseVersion("current-main");
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleCreateBranch}
              disabled={
                !newBranchName.trim() ||
                !newBranchAssignee ||
                !newBranchBaseVersion
              }
            >
              创建主分支
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>添加项目成员</DialogTitle>
            <DialogDescription>
              从团队成员中选择要添加到项目的成员
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>选择成员</Label>

              {/* Selected Members */}
              {selectedNewMembers.length > 0 && (
                <div className="space-y-2 mb-3 p-3 bg-gray-50 rounded-lg max-h-48 overflow-y-auto">
                  {selectedNewMembers.map((selectedMember) => {
                    const member = allTeamMembers.find((m) => m.id === selectedMember.id);
                    if (!member) return null;
                    return (
                      <div
                        key={selectedMember.id}
                        className="flex items-center gap-3 p-2 bg-white rounded border"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">
                            {member.name}
                          </div>
                        </div>
                        <Select
                          value={selectedMember.projectRole}
                          onValueChange={(value: "admin" | "member") =>
                            updateNewMemberRole(selectedMember.id, value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">管理员</SelectItem>
                            <SelectItem value="member">普通成员</SelectItem>
                          </SelectContent>
                        </Select>
                        <button
                          onClick={() => removeNewMember(selectedMember.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Member List */}
              {availableMembers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  所有团队成员都已加入此项目
                </div>
              ) : (
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {availableMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 border-b last:border-b-0 cursor-pointer"
                      onClick={() => toggleNewMember(member.id)}
                    >
                      <Checkbox
                        checked={selectedNewMembers.some(
                          (selectedMember) => selectedMember.id === member.id,
                        )}
                        onCheckedChange={() => toggleNewMember(member.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {member.name}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-sm text-gray-500">
                已选择 {selectedNewMembers.length} 位成员，可在上方为每位成员单独分配权限
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddMemberDialog(false);
                setSelectedNewMembers([]);
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleAddMembers}
              disabled={selectedNewMembers.length === 0}
            >
              添加成员
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
