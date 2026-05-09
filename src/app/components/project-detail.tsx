import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Users,
  ChevronRight,
  ChevronDown,
  GitBranch,
  ExternalLink,
  UserPlus,
  X,
  Plus,
  Eye,
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
  const [selectedNewMembers, setSelectedNewMembers] = useState<
    Array<{ id: string; projectRole: "admin" | "member" }>
  >([]);
  const [showCreateBranchDialog, setShowCreateBranchDialog] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchAssignee, setNewBranchAssignee] = useState<string>("");

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

  const handleCreateBranch = () => {
    if (!newBranchName.trim()) {
      alert("请输入分支名称");
      return;
    }

    if (!newBranchAssignee) {
      alert("请选择负责人");
      return;
    }

    // 检查分支名称是否已存在
    if (assemblyTree.branches.some((b) => b.branchId === newBranchName)) {
      alert("分支名称已存在");
      return;
    }

    // 创建新分支
    const newBranch: NodeBranch = {
      branchId: newBranchName,
      assignee: newBranchAssignee,
    };

    setAssemblyTree({
      ...assemblyTree,
      branches: [...assemblyTree.branches, newBranch],
    });

    setNewBranchName("");
    setNewBranchAssignee("");
    setShowCreateBranchDialog(false);

    // 自动切换到新创建的分支
    handleViewBranchDetail(newBranchName, assemblyTree.name, assemblyTree.name);
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

  return (
    <div className="p-8">
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
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gray-100 text-gray-700">
                        {member.role}
                      </Badge>
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

      {/* Create Branch Dialog */}
      <Dialog open={showCreateBranchDialog} onOpenChange={setShowCreateBranchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建新分支</DialogTitle>
            <DialogDescription>
              为根节点"{assemblyTree.name}"创建一个新的工作分支
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="branch-name">分支名称</Label>
              <Input
                id="branch-name"
                placeholder="例如: feature-optimization"
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
              <Label htmlFor="branch-assignee">负责人</Label>
              <Select value={newBranchAssignee} onValueChange={setNewBranchAssignee}>
                <SelectTrigger id="branch-assignee">
                  <SelectValue placeholder="选择负责人" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.name}>
                      <div className="flex items-center gap-2">
                        <span>{member.name}</span>
                        <span className="text-xs text-gray-500">{member.role}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                从项目成员中选择分支负责人
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateBranchDialog(false);
                setNewBranchName("");
                setNewBranchAssignee("");
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleCreateBranch}
              disabled={!newBranchName.trim() || !newBranchAssignee}
            >
              创建分支
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
                          <div className="text-xs text-gray-500">
                            {member.email}
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
                        <div className="text-sm text-gray-500">
                          {member.email}
                        </div>
                      </div>
                      <Badge className="bg-gray-100 text-gray-700">
                        {member.role}
                      </Badge>
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
