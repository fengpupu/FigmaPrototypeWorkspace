import { useState } from "react";
import {
  Search,
  ChevronRight,
  FolderTree,
  Calendar,
  GitBranch,
  User,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";

export interface SubtreeTask {
  id: string;
  projectId: string;
  projectName: string;
  subtreeName: string;
  subtreePath: string;
  branchId: string;
  assignee: string;
  status: "pending" | "in-progress" | "completed";
  priority: "high" | "medium" | "low";
  assignedDate: string;
  lastModified: string;
  description: string;
  hasUncommittedChanges: boolean;
  directChildrenCount: number;
  totalNodesCount: number;
  pendingChildSubmissions: number;
  nodeType: "assembly" | "part";
}

interface MyTasksProps {
  onNavigateToWorkspace?: (
    branchId: string,
    viewMode?: "edit" | "preview",
    nodeType?: "assembly" | "part",
    context?: { nodeName?: string; nodePath?: string; assignee?: string },
  ) => void;
  currentUser?: string;
}

export function MyTasks({ onNavigateToWorkspace, currentUser = "张三" }: MyTasksProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock subtree tasks data - 我负责的子树分支
  const [tasks] = useState<SubtreeTask[]>([
    {
      id: "1",
      projectId: "proj-1",
      projectName: "发动机装配项目",
      subtreeName: "气缸体组件",
      subtreePath: "/发动机总成/气缸体组件",
      branchId: "branch-1-lisi",
      assignee: "李四",
      status: "in-progress",
      priority: "high",
      assignedDate: "2024-03-15",
      lastModified: "2024-03-20",
      description: "气缸体及其直接下级零件的装配设计 (李四分支)",
      hasUncommittedChanges: true,
      directChildrenCount: 8,
      totalNodesCount: 15,
      pendingChildSubmissions: 2,
      nodeType: "assembly",
    },
    {
      id: "2",
      projectId: "proj-1",
      projectName: "发动机装配项目",
      subtreeName: "曲轴系统",
      subtreePath: "/发动机总成/曲轴系统",
      branchId: "branch-2-sunqi",
      assignee: "孙七",
      status: "pending",
      priority: "medium",
      assignedDate: "2024-03-18",
      lastModified: "2024-03-18",
      description: "曲轴及连杆组件子树的装配工作 (孙七分支)",
      hasUncommittedChanges: false,
      directChildrenCount: 5,
      totalNodesCount: 12,
      pendingChildSubmissions: 0,
      nodeType: "assembly",
    },
    {
      id: "3",
      projectId: "proj-2",
      projectName: "底盘系统设计",
      subtreeName: "前悬挂系统",
      subtreePath: "/底盘总成/前悬挂系统",
      branchId: "branch-3-zhangsan",
      assignee: "张三",
      status: "in-progress",
      priority: "high",
      assignedDate: "2024-03-10",
      lastModified: "2024-03-21",
      description: "前悬挂系统子树的结构设计与优化 (张三分支)",
      hasUncommittedChanges: false,
      directChildrenCount: 12,
      totalNodesCount: 28,
      pendingChildSubmissions: 3,
      nodeType: "assembly",
    },
    {
      id: "4",
      projectId: "proj-2",
      projectName: "底盘系统设计",
      subtreeName: "制动系统",
      subtreePath: "/底盘总成/制动系统",
      branchId: "branch-4-lisi",
      assignee: "李四",
      status: "completed",
      priority: "low",
      assignedDate: "2024-03-08",
      lastModified: "2024-03-15",
      description: "制动系统子树，包括制动盘和卡钳装配 (李四分支)",
      hasUncommittedChanges: false,
      directChildrenCount: 6,
      totalNodesCount: 10,
      pendingChildSubmissions: 0,
      nodeType: "assembly",
    },
    {
      id: "5",
      projectId: "proj-1",
      projectName: "发动机装配项目",
      subtreeName: "配气机构",
      subtreePath: "/发动机总成/配气机构",
      branchId: "branch-5-zhangsan",
      assignee: "张三",
      status: "in-progress",
      priority: "high",
      assignedDate: "2024-03-12",
      lastModified: "2024-03-22",
      description: "配气机构的凸轮轴和气门系统设计 (张三分支)",
      hasUncommittedChanges: true,
      directChildrenCount: 10,
      totalNodesCount: 22,
      pendingChildSubmissions: 1,
      nodeType: "assembly",
    },
    {
      id: "6",
      projectId: "proj-3",
      projectName: "变速箱系统",
      subtreeName: "齿轮组",
      subtreePath: "/变速箱总成/齿轮组",
      branchId: "branch-6-zhangsan",
      assignee: "张三",
      status: "pending",
      priority: "medium",
      assignedDate: "2024-03-16",
      lastModified: "2024-03-16",
      description: "齿轮组的传动系统设计 (张三分支)",
      hasUncommittedChanges: false,
      directChildrenCount: 6,
      totalNodesCount: 14,
      pendingChildSubmissions: 0,
      nodeType: "assembly",
    },
    {
      id: "7",
      projectId: "proj-2",
      projectName: "底盘系统设计",
      subtreeName: "转向系统",
      subtreePath: "/底盘总成/转向系统",
      branchId: "branch-7-zhangsan",
      assignee: "张三",
      status: "completed",
      priority: "low",
      assignedDate: "2024-03-05",
      lastModified: "2024-03-18",
      description: "转向系统包括转向柱和转向机 (张三分支)",
      hasUncommittedChanges: false,
      directChildrenCount: 8,
      totalNodesCount: 16,
      pendingChildSubmissions: 0,
      nodeType: "assembly",
    },
    {
      id: "8",
      projectId: "proj-4",
      projectName: "电气系统",
      subtreeName: "线束总成",
      subtreePath: "/电气总成/线束总成",
      branchId: "branch-8-zhangsan",
      assignee: "张三",
      status: "in-progress",
      priority: "high",
      assignedDate: "2024-03-14",
      lastModified: "2024-03-23",
      description: "主线束和分支线束的布局设计 (张三分支)",
      hasUncommittedChanges: true,
      directChildrenCount: 15,
      totalNodesCount: 35,
      pendingChildSubmissions: 2,
      nodeType: "assembly",
    },
    {
      id: "9",
      projectId: "proj-3",
      projectName: "变速箱系统",
      subtreeName: "离合器总成",
      subtreePath: "/变速箱总成/离合器总成",
      branchId: "branch-9-zhangsan",
      assignee: "张三",
      status: "pending",
      priority: "medium",
      assignedDate: "2024-03-17",
      lastModified: "2024-03-17",
      description: "离合器片和压盘组件设计 (张三分支)",
      nodeType: "assembly",
      hasUncommittedChanges: false,
      directChildrenCount: 7,
      totalNodesCount: 11,
      pendingChildSubmissions: 0,
    },
    {
      id: "10",
      projectId: "proj-1",
      projectName: "发动机装配项目",
      subtreeName: "油底壳",
      subtreePath: "/发动机总成/油底壳",
      branchId: "branch-4-zhangsan",
      assignee: "张三",
      status: "in-progress",
      priority: "medium",
      assignedDate: "2024-03-19",
      lastModified: "2024-03-23",
      description: "油底壳零件设计 (张三分支)",
      hasUncommittedChanges: true,
      directChildrenCount: 0,
      totalNodesCount: 1,
      pendingChildSubmissions: 0,
      nodeType: "part",
    },
  ]);

  const filteredTasks = tasks.filter((task) => {
    const matchesUser = task.assignee === currentUser;

    const matchesSearch =
      task.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.subtreeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesUser && matchesSearch;
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">我的任务</h1>
        <p className="text-gray-600">查看和管理您的子树</p>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="搜索项目名称、节点名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Subtree Tasks List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <Card
            key={task.id}
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onNavigateToWorkspace?.(task.branchId, "edit", task.nodeType, {
              nodeName: task.subtreeName,
              nodePath: task.subtreePath,
              assignee: task.assignee,
            })}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {task.subtreeName}
                  </h3>
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <FolderTree className="w-4 h-4" />
                    <span className="font-medium">{task.projectName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">子树路径:</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {(() => {
                        const pathParts = task.subtreePath.split('/').filter(p => p);
                        if (pathParts.length === 0) return task.subtreePath;
                        if (pathParts.length === 1) {
                          return `/${pathParts[0]}（${task.branchId}）`;
                        }
                        return `/${pathParts[0]}（main）/${pathParts.slice(1, -1).join('/')}${pathParts.length > 2 ? '/' : ''}${pathParts[pathParts.length - 1]}（${task.branchId}）`;
                      })()}
                    </code>
                    <code className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium flex items-center gap-1">
                      <GitBranch className="w-3 h-3" />
                      {task.branchId}
                    </code>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-500 mt-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{task.assignee}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(task.lastModified).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                </div>
              </div>

              <Button variant="ghost" size="icon">
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <FolderTree className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            没有找到子树
          </h3>
          <p className="text-gray-600">
            {searchQuery
              ? "尝试调整筛选条件"
              : "您目前没有子树"}
          </p>
        </div>
      )}
    </div>
  );
}
