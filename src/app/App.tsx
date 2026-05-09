import { useState } from "react";
import {
  FolderTree,
  Users,
  Settings as SettingsIcon,
  Share2,
  Clock,
  Shield,
  ListTodo,
  FileText,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { ProjectsHub } from "./components/projects-hub";
import { MyTasks } from "./components/my-tasks";
import { FilesWithCategories } from "./components/files-with-categories";
import { UserManagement } from "./components/user-management";
import { Settings } from "./components/settings";
import { ShareManagement } from "./components/share-management";
import { ShareAccess } from "./components/share-access";
import { RoleManagement } from "./components/role-management";
import { ProjectDetail } from "./components/project-detail";
import { Workspace } from "./components/workspace";
import { Button } from "./components/ui/button";

export type UserRole = "admin" | "user";
export type FileCategory = "all" | "cad" | "recent";
type WorkspaceContext = {
  nodeName?: string;
  nodePath?: string;
  assignee?: string;
};

export default function App() {
  const [activeView, setActiveView] = useState<
    | "projects"
    | "tasks"
    | "files-all"
    | "files-cad"
    | "files-recent"
    | "shares"
    | "users"
    | "roles"
    | "settings"
    | "share-access"
    | "project-detail"
    | "workspace"
  >("projects");
  const [filesMenuOpen, setFilesMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>("admin");
  const [shareAccessId, setShareAccessId] = useState<string>("");
  const [currentProjectId, setCurrentProjectId] = useState<string>("");
  const [currentBranchId, setCurrentBranchId] = useState<string>("");
  const [workspaceViewMode, setWorkspaceViewMode] = useState<"edit" | "preview">("edit");
  const [currentNodeType, setCurrentNodeType] = useState<"assembly" | "part">("assembly");
  const [workspaceContext, setWorkspaceContext] = useState<WorkspaceContext>({});

  const allNavItems = [
    {
      id: "projects" as const,
      label: "项目大厅",
      icon: FolderTree,
      roles: ["admin", "user"],
    },
    {
      id: "tasks" as const,
      label: "我的任务",
      icon: ListTodo,
      roles: ["admin", "user"],
    },
    {
      id: "files" as const,
      label: "我的文件",
      icon: FolderTree,
      roles: ["admin", "user"],
      hasSubmenu: true,
      submenu: [
        {
          id: "files-all" as const,
          label: "全部",
          icon: FileText,
        },
        {
          id: "files-cad" as const,
          label: "我的CAD",
          icon: SettingsIcon,
        },
        {
          id: "files-recent" as const,
          label: "最近",
          icon: Clock,
        },
      ],
    },
    {
      id: "shares" as const,
      label: "我的分享",
      icon: Share2,
      roles: ["admin", "user"],
    },
    {
      id: "users" as const,
      label: "用户管理",
      icon: Users,
      roles: ["admin"],
    },
    {
      id: "roles" as const,
      label: "角色管理",
      icon: Shield,
      roles: ["admin"],
    },
    {
      id: "settings" as const,
      label: "设置",
      icon: SettingsIcon,
      roles: ["admin", "user"],
    },
  ];

  // Filter navigation items based on user role
  const navItems = allNavItems.filter((item) =>
    item.roles.includes(userRole),
  );

  const handleNavigate = (
    view: "projects" | "tasks" | "assets" | "files" | "shares" | "users" | "settings",
  ) => {
    setActiveView(view);
  };

  const handleNavigateToProjectDetail = (projectId: string) => {
    setCurrentProjectId(projectId);
    setActiveView("project-detail");
  };

  const handleNavigateToWorkspace = (
    branchId: string,
    viewMode: "edit" | "preview" = "edit",
    nodeType: "assembly" | "part" = "assembly",
    context: WorkspaceContext = {},
  ) => {
    setCurrentBranchId(branchId);
    setWorkspaceViewMode(viewMode);
    setCurrentNodeType(nodeType);
    setWorkspaceContext(context);
    setActiveView("workspace");
  };

  const handleBackToProjects = () => {
    setActiveView("projects");
  };

  const handleBackToProjectDetail = () => {
    setActiveView("project-detail");
  };

  const handleAccessShare = (shareId: string) => {
    setShareAccessId(shareId);
    setActiveView("share-access");
  };

  const handleSaveComplete = () => {
    setActiveView("assets");
  };

  // Full screen views (without sidebar)
  if (activeView === "share-access") {
    return (
      <ShareAccess
        shareId={shareAccessId}
        onSaveComplete={handleSaveComplete}
      />
    );
  }

  if (activeView === "project-detail") {
    return (
      <div className="min-h-screen bg-gray-50">
        <ProjectDetail
          projectId={currentProjectId}
          onBack={handleBackToProjects}
          onNavigateToWorkspace={handleNavigateToWorkspace}
          currentUser={userRole === "admin" ? "张三" : "李四"}
        />
      </div>
    );
  }

  if (activeView === "workspace") {
    return (
      <Workspace
        branchId={currentBranchId}
        onBack={handleBackToProjectDetail}
        viewMode={workspaceViewMode}
        nodeType={currentNodeType}
        currentUser={userRole === "admin" ? "张三" : "李四"}
        nodeName={workspaceContext.nodeName}
        nodePath={workspaceContext.nodePath}
        assignee={workspaceContext.assignee}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="bg-white border-r flex flex-col w-64">
        <div className="p-6 border-b">
          <h1 className="font-semibold text-gray-900">
            {userRole === "admin"
              ? "张三（主账号）"
              : "李四（子用户）"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {userRole === "admin" ? "主账号" : "子用户"}
          </p>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const hasSubmenu = "hasSubmenu" in item && item.hasSubmenu;
              const isFilesView = activeView.startsWith("files-");
              const isActive = hasSubmenu ? isFilesView : activeView === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      if (hasSubmenu) {
                        setFilesMenuOpen(!filesMenuOpen);
                        if (!filesMenuOpen) {
                          setActiveView("files-all");
                        }
                      } else {
                        setActiveView(item.id as any);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {hasSubmenu && (
                      filesMenuOpen ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )
                    )}
                  </button>

                  {hasSubmenu && filesMenuOpen && "submenu" in item && (
                    <ul className="mt-1 ml-4 space-y-1">
                      {item.submenu.map((subItem) => {
                        const SubIcon = subItem.icon;
                        return (
                          <li key={subItem.id}>
                            <button
                              onClick={() => setActiveView(subItem.id)}
                              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                                activeView === subItem.id
                                  ? "bg-blue-50 text-blue-600"
                                  : "text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              <SubIcon className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                {subItem.label}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {activeView === "projects" && (
          <ProjectsHub
            userRole={userRole}
            onNavigateToProject={handleNavigateToProjectDetail}
          />
        )}
        {activeView === "tasks" && (
          <MyTasks onNavigateToWorkspace={handleNavigateToWorkspace} />
        )}
        {activeView === "files-all" && (
          <FilesWithCategories defaultCategory="all" />
        )}
        {activeView === "files-cad" && (
          <FilesWithCategories defaultCategory="cad" />
        )}
        {activeView === "files-recent" && (
          <FilesWithCategories defaultCategory="recent" />
        )}
        {activeView === "users" && <UserManagement />}
        {activeView === "roles" && <RoleManagement />}
        {activeView === "shares" && (
          <ShareManagement onAccessShare={handleAccessShare} />
        )}
        {activeView === "settings" && (
          <Settings
            userRole={userRole}
            onRoleChange={setUserRole}
          />
        )}
      </main>
    </div>
  );
}
