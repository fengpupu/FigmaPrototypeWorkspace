import { useState } from "react";
import {
  Plus,
  Users,
  FolderTree,
  Clock,
  Search,
  MoreVertical,
  Trash2,
  UserPlus,
  X,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export type UserRole = "admin" | "user";

export interface Project {
  id: string;
  name: string;
  description: string;
  projectRole: "admin" | "member"; // 项目权限：管理员或普通成员
  members: number;
  lastUpdated: string;
  status: "active" | "archived";
}

interface ProjectsHubProps {
  userRole: UserRole;
  onNavigateToProject: (projectId: string) => void;
  currentUser?: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function ProjectsHub({
  userRole,
  onNavigateToProject,
  currentUser = userRole === "admin" ? "张三" : "李四",
}: ProjectsHubProps) {
  const MAIN_ACCOUNT_ID = "1";
  const isMainAccount = (member?: TeamMember) => member?.role === "主账号";
  const mainAccountSelection = {
    id: MAIN_ACCOUNT_ID,
    projectRole: "admin" as const,
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilters, setRoleFilters] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] =
    useState(false);
  const [showDeleteDialog, setShowDeleteDialog] =
    useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] =
    useState(false);
  const [selectedProject, setSelectedProject] =
    useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] =
    useState("");
  const [newRootNodeName, setNewRootNodeName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<
    Array<{ id: string; projectRole: "admin" | "member" }>
  >([mainAccountSelection]);
  const [selectedNewMembers, setSelectedNewMembers] = useState<
    Array<{ id: string; projectRole: "admin" | "member" }>
  >([]);

  // Mock team members data
  const [teamMembers] = useState<TeamMember[]>([
    {
      id: "1",
      name: "张三",
      email: "zhangsan@example.com",
      role: "主账号",
    },
    {
      id: "2",
      name: "李四",
      email: "lisi@example.com",
      role: "CAD工程师",
    },
    {
      id: "3",
      name: "王五",
      email: "wangwu@example.com",
      role: "部门主管",
    },
    {
      id: "4",
      name: "赵六",
      email: "zhaoliu@example.com",
      role: "普通用户",
    },
    {
      id: "5",
      name: "孙七",
      email: "sunqi@example.com",
      role: "CAD工程师",
    },
  ]);

  const getDefaultProjectMembers = () => {
    const creator = teamMembers.find((member) => member.name === currentUser);
    const defaults: Array<{ id: string; projectRole: "admin" | "member" }> = [
      mainAccountSelection,
    ];

    if (creator && creator.id !== MAIN_ACCOUNT_ID) {
      defaults.push({
        id: creator.id,
        projectRole: "admin",
      });
    }

    return defaults;
  };

  const isDefaultCreateMember = (member?: TeamMember) =>
    isMainAccount(member) || member?.name === currentUser;

  // Mock projects data
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      name: "发动机装配项目",
      description: "V8发动机完整装配设计",
      projectRole: "admin",
      members: 8,
      lastUpdated: "2024-03-20",
      status: "active",
    },
    {
      id: "2",
      name: "底盘系统设计",
      description: "轿车底盘结构设计与优化",
      projectRole: "admin",
      members: 5,
      lastUpdated: "2024-03-18",
      status: "active",
    },
    {
      id: "3",
      name: "传动系统研发",
      description: "新型传动系统方案验证",
      projectRole: "member",
      members: 12,
      lastUpdated: "2024-03-15",
      status: "active",
    },
  ]);

  const canManageProjects =
    userRole === "admin" ||
    projects.some((p) => p.projectRole === "admin");

  const handleCreateProject = () => {
    if (!newProjectName.trim() || !newRootNodeName.trim())
      return;

    const newProject: Project = {
      id: Date.now().toString(),
      name: newProjectName,
      description: newProjectDescription,
      projectRole: "admin",
      members: selectedMembers.length,
      lastUpdated: new Date().toISOString().split("T")[0],
      status: "active",
    };

    setProjects([...projects, newProject]);
    setNewProjectName("");
    setNewProjectDescription("");
    setNewRootNodeName("");
    setSelectedMembers(getDefaultProjectMembers());
    setShowCreateDialog(false);
  };

  const toggleMember = (memberId: string) => {
    const member = teamMembers.find((teamMember) => teamMember.id === memberId);
    if (isDefaultCreateMember(member)) {
      return;
    }

    if (selectedMembers.some((m) => m.id === memberId)) {
      setSelectedMembers(
        selectedMembers.filter((m) => m.id !== memberId),
      );
    } else {
      setSelectedMembers([
        ...selectedMembers,
        { id: memberId, projectRole: "member" },
      ]);
    }
  };

  const removeMember = (memberId: string) => {
    const member = teamMembers.find((teamMember) => teamMember.id === memberId);
    if (isDefaultCreateMember(member)) {
      return;
    }

    setSelectedMembers(
      selectedMembers.filter((m) => m.id !== memberId),
    );
  };

  const updateMemberRole = (
    memberId: string,
    projectRole: "admin" | "member",
  ) => {
    const member = teamMembers.find((teamMember) => teamMember.id === memberId);
    if (isMainAccount(member)) {
      return;
    }

    setSelectedMembers(
      selectedMembers.map((m) =>
        m.id === memberId ? { ...m, projectRole } : m,
      ),
    );
  };

  const toggleNewMember = (memberId: string) => {
    const member = teamMembers.find((teamMember) => teamMember.id === memberId);
    if (isMainAccount(member)) {
      return;
    }

    if (selectedNewMembers.some((member) => member.id === memberId)) {
      setSelectedNewMembers(
        selectedNewMembers.filter((member) => member.id !== memberId),
      );
    } else {
      setSelectedNewMembers([
        ...selectedNewMembers,
        { id: memberId, projectRole: "member" },
      ]);
    }
  };

  const removeNewMember = (memberId: string) => {
    const member = teamMembers.find((teamMember) => teamMember.id === memberId);
    if (isMainAccount(member)) {
      return;
    }

    setSelectedNewMembers(
      selectedNewMembers.filter((member) => member.id !== memberId),
    );
  };

  const updateNewMemberRole = (
    memberId: string,
    projectRole: "admin" | "member",
  ) => {
    const member = teamMembers.find((teamMember) => teamMember.id === memberId);
    if (isMainAccount(member)) {
      return;
    }

    setSelectedNewMembers(
      selectedNewMembers.map((member) =>
        member.id === memberId ? { ...member, projectRole } : member,
      ),
    );
  };

  const handleAddMembersToProject = () => {
    if (!selectedProject || selectedNewMembers.length === 0) {
      alert("请至少选择一位成员");
      return;
    }

    // 更新项目的成员数量
    setProjects(
      projects.map((p) =>
        p.id === selectedProject.id
          ? {
              ...p,
              members: p.members + selectedNewMembers.length,
            }
          : p,
      ),
    );

    setSelectedNewMembers([]);
    setShowAddMemberDialog(false);
    setSelectedProject(null);
  };

  const handleDeleteProject = () => {
    if (!selectedProject) return;
    setProjects(
      projects.filter((p) => p.id !== selectedProject.id),
    );
    setShowDeleteDialog(false);
    setSelectedProject(null);
  };

  const toggleRoleFilter = (filter: string) => {
    if (roleFilters.includes(filter)) {
      setRoleFilters(roleFilters.filter((f) => f !== filter));
    } else {
      setRoleFilters([...roleFilters, filter]);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      project.description
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    let matchesRole = true;
    if (roleFilters.length > 0) {
      matchesRole = roleFilters.some((filter) => {
        if (filter === "owner") return project.projectRole === "admin";
        if (filter === "member")
          return project.projectRole === "member";
        return false;
      });
    }

    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (
    projectRole: Project["projectRole"],
  ) => {
    switch (projectRole) {
      case "admin":
        return "bg-blue-100 text-blue-700";
      case "member":
        return "bg-green-100 text-green-700";
    }
  };

  const getRoleLabel = (
    projectRole: Project["projectRole"],
  ) => {
    switch (projectRole) {
      case "admin":
        return "管理员";
      case "member":
        return "普通成员";
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          项目大厅
        </h1>
        <p className="text-gray-600">
          查看和管理您参与的所有项目
        </p>
      </div>

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card
            className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
              roleFilters.includes("owner")
                ? "ring-2 ring-blue-500 bg-blue-50"
                : ""
            }`}
            onClick={() => toggleRoleFilter("owner")}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  我创建的项目
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {
                    projects.filter((p) => p.projectRole === "admin")
                      .length
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FolderTree className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card
            className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
              roleFilters.includes("member")
                ? "ring-2 ring-green-500 bg-green-50"
                : ""
            }`}
            onClick={() => toggleRoleFilter("member")}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  我参与的项目
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {
                    projects.filter((p) => p.projectRole === "member")
                      .length
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="搜索项目..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {canManageProjects && (
          <Button
            onClick={() => {
              setSelectedMembers(getDefaultProjectMembers());
              setShowCreateDialog(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            创建项目
          </Button>
        )}
        </div>

        {/* Projects Grid */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            我管理的项目
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => (
          <Card
            key={project.id}
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onNavigateToProject(project.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {project.name}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {project.description}
                </p>
              </div>

              {project.projectRole === "admin" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject(project);
                        setShowAddMemberDialog(true);
                      }}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      添加成员
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject(project);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      删除项目
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <Badge
                  className={getRoleBadgeColor(
                    project.projectRole,
                  )}
                >
                  {getRoleLabel(project.projectRole)}
                </Badge>
                <div className="flex items-center text-gray-600">
                  <Users className="w-4 h-4 mr-1" />
                  {project.members}
                </div>
              </div>
              <div className="text-gray-500">
                {new Date(
                  project.lastUpdated,
                ).toLocaleDateString("zh-CN")}
              </div>
            </div>
          </Card>
        ))}
          </div>
        </div>
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <FolderTree className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            没有找到项目
          </h3>
          <p className="text-gray-600">
            {searchQuery || roleFilters.length > 0
              ? "尝试调整筛选条件"
              : "创建一个新项目开始协作"}
          </p>
        </div>
      )}

      {/* Create Project Dialog */}
      <Dialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>创建新项目</DialogTitle>
            <DialogDescription>
              创建一个新的协作项目，开始与团队成员协作
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">项目名称</Label>
              <Input
                id="project-name"
                placeholder="例如：发动机装配项目"
                value={newProjectName}
                onChange={(e) =>
                  setNewProjectName(e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-description">
                项目描述
              </Label>
              <Input
                id="project-description"
                placeholder="简要描述项目内容"
                value={newProjectDescription}
                onChange={(e) =>
                  setNewProjectDescription(e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="root-node-name">根节点名称</Label>
              <Input
                id="root-node-name"
                placeholder="例如：发动机总成"
                value={newRootNodeName}
                onChange={(e) =>
                  setNewRootNodeName(e.target.value)
                }
              />
              <p className="text-sm text-gray-500">
                根节点是项目的顶层装配体
              </p>
            </div>

            <div className="space-y-2">
              <Label>项目成员</Label>

              {/* Selected Members */}
              {selectedMembers.length > 0 && (
                <div className="space-y-2 mb-3 p-3 bg-gray-50 rounded-lg max-h-48 overflow-y-auto">
                  {selectedMembers.map((selectedMember) => {
                    const member = teamMembers.find(
                      (m) => m.id === selectedMember.id,
                    );
                    if (!member) return null;
                    const memberIsMainAccount = isMainAccount(member);
                    const memberIsDefault = isDefaultCreateMember(member);
                    return (
                      <div
                        key={selectedMember.id}
                        className="grid grid-cols-[minmax(0,1fr)_128px_64px] items-center gap-3 p-2 bg-white rounded border"
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 text-sm">
                            {member.name}
                          </div>
                        </div>
                        <Select
                          value={selectedMember.projectRole}
                          disabled={memberIsMainAccount}
                          onValueChange={(
                            value: "admin" | "member",
                          ) =>
                            updateMemberRole(
                              selectedMember.id,
                              value,
                            )
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">
                              管理员
                            </SelectItem>
                            <SelectItem value="member">
                              普通成员
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {memberIsDefault ? (
                          <Badge className="w-14 justify-center bg-blue-50 text-blue-700">
                            {memberIsMainAccount ? "主账号" : "创建者"}
                          </Badge>
                        ) : (
                          <button
                            onClick={() =>
                              removeMember(selectedMember.id)
                            }
                            className="flex h-8 w-8 items-center justify-center justify-self-center rounded text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Member List */}
              <div className="border rounded-lg max-h-64 overflow-y-auto">
                {teamMembers.map((member) => {
                  const memberIsDefault = isDefaultCreateMember(member);
                  return (
                  <div
                    key={member.id}
                    className={`flex items-center gap-3 p-3 border-b last:border-b-0 ${
                      memberIsDefault
                        ? "cursor-not-allowed bg-blue-50/40"
                        : "cursor-pointer hover:bg-gray-50"
                    }`}
                    onClick={() => toggleMember(member.id)}
                  >
                    <Checkbox
                      checked={selectedMembers.some(
                        (m) => m.id === member.id,
                      )}
                      disabled={memberIsDefault}
                      onCheckedChange={() =>
                        toggleMember(member.id)
                      }
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {member.name}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>

              <p className="text-sm text-gray-500">
                已选择 {selectedMembers.length}{" "}
                位成员，主账号默认加入且固定为管理员
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setNewProjectName("");
                setNewProjectDescription("");
                setNewRootNodeName("");
                setSelectedMembers(getDefaultProjectMembers());
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={
                !newProjectName.trim() ||
                !newRootNodeName.trim()
              }
            >
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project Dialog */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除项目</DialogTitle>
            <DialogDescription>
              确定要删除项目"{selectedProject?.name}
              "吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProject}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog
        open={showAddMemberDialog}
        onOpenChange={setShowAddMemberDialog}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>添加项目成员</DialogTitle>
            <DialogDescription>
              从团队成员中选择要添加到项目"
              {selectedProject?.name}"的成员
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>选择成员</Label>

              {/* Selected Members */}
              {selectedNewMembers.length > 0 && (
                <div className="space-y-2 mb-3 p-3 bg-gray-50 rounded-lg max-h-48 overflow-y-auto">
                  {selectedNewMembers.map((selectedMember) => {
                    const member = teamMembers.find(
                      (m) => m.id === selectedMember.id,
                    );
                    if (!member) return null;
                    return (
                      <div
                        key={selectedMember.id}
                        className="grid grid-cols-[minmax(0,1fr)_128px_64px] items-center gap-3 p-2 bg-white rounded border"
                      >
                        <div className="min-w-0">
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
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">
                              管理员
                            </SelectItem>
                            <SelectItem value="member">
                              普通成员
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <button
                          onClick={() =>
                            removeNewMember(selectedMember.id)
                          }
                          className="flex h-8 w-8 items-center justify-center justify-self-center rounded text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Member List */}
              <div className="border rounded-lg max-h-64 overflow-y-auto">
                {teamMembers.filter((member) => !isMainAccount(member)).map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 border-b last:border-b-0 cursor-pointer"
                    onClick={() => toggleNewMember(member.id)}
                  >
                    <Checkbox
                      checked={selectedNewMembers.some(
                        (selectedMember) =>
                          selectedMember.id === member.id,
                      )}
                      onCheckedChange={() =>
                        toggleNewMember(member.id)
                      }
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {member.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

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
                setSelectedProject(null);
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleAddMembersToProject}
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
