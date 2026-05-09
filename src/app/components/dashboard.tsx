import {
  LayoutDashboard,
  Folder,
  File,
  Users,
  Share2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import type { UserRole } from "../App";
import { getFileStats } from "./file-manager";
import { getUserStats } from "./user-management";
import { getShareStats } from "./share-management";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface DashboardProps {
  userRole: UserRole;
  onNavigate: (
    view: "files" | "users" | "shares" | "settings",
  ) => void;
}

export function Dashboard({
  userRole,
  onNavigate,
}: DashboardProps) {
  const userName =
    userRole === "admin"
      ? "张三（主账号）"
      : "李四（子用户）";

  // Get statistics from modules
  const fileStats = getFileStats();
  const userStats = getUserStats();
  const shareStats = getShareStats();

  const stats = [
    {
      title: "我的文件",
      value: fileStats.totalItems.toString(),
      icon: File,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      navigate: "files" as const,
    },
    {
      title: "分享",
      value: shareStats.totalShares.toString(),
      icon: Share2,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      navigate: "shares" as const,
    },
  ];

  // Add user count for admin
  if (userRole === "admin") {
    stats.push({
      title: "用户数量",
      value: userStats.totalUsers.toString(),
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      navigate: "users" as const,
    });
  }

  const recentFiles = [
    {
      name: "report.pdf",
      type: "file",
      modified: "2小时前",
      size: "1.5 MB",
    },
    {
      name: "presentation.pptx",
      type: "file",
      modified: "5小时前",
      size: "3.2 MB",
    },
    {
      name: "Projects",
      type: "folder",
      modified: "昨天",
      size: "-",
    },
    {
      name: "CAD_Project_1",
      type: "cad",
      modified: "2天前",
      size: "-",
    },
    {
      name: "data.json",
      type: "file",
      modified: "3天前",
      size: "45 KB",
    },
  ];

  const quickActions = [
    {
      label: "新建文件",
      icon: File,
      action: () => onNavigate("files"),
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "新建文件夹",
      icon: Folder,
      action: () => onNavigate("files"),
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "查看分享",
      icon: Share2,
      action: () => onNavigate("shares"),
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  // Add user management for admin
  if (userRole === "admin") {
    quickActions.push({
      label: "管理用户",
      icon: Users,
      action: () => onNavigate("users"),
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    });
  }

  // Storage data for chart
  const storageData = [
    { name: "已使用", value: 45.2, color: "#3b82f6" },
    { name: "剩余空间", value: 54.8, color: "#e5e7eb" },
  ];

  return (
    <div className="h-full overflow-auto">
      {/* Header */}
      <div className="border-b p-6 bg-white">
        <div className="flex items-center gap-2 mb-2">
          <LayoutDashboard className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-semibold">仪表盘</h2>
        </div>
        <p className="text-gray-600">欢迎回来，{userName}</p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => onNavigate(stat.navigate)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-semibold">
                        {stat.value}
                      </p>
                    </div>
                    <div
                      className={`${stat.bgColor} p-3 rounded-lg`}
                    >
                      <Icon
                        className={`w-6 h-6 ${stat.color}`}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* System Info - Only for Admin */}
        {userRole === "admin" && (
          <Card>
            <CardHeader>
              <CardTitle>存储使用情况</CardTitle>
              <CardDescription>
                租户存储空间统计
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Chart */}
                <div className="w-full md:w-1/2 h-64">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <PieChart>
                      <Pie
                        data={storageData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {storageData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => `${value} GB`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend & Stats */}
                <div className="w-full md:w-1/2 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-blue-600"></div>
                      <span className="text-gray-700">
                        已使用
                      </span>
                    </div>
                    <span className="font-semibold text-blue-600">
                      45.2 GB
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                      <span className="text-gray-700">
                        剩余空间
                      </span>
                    </div>
                    <span className="font-semibold text-gray-600">
                      54.8 GB
                    </span>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">
                        总容量
                      </span>
                      <span className="font-semibold">
                        100 GB
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-gray-600">
                        使用率
                      </span>
                      <span className="font-semibold text-blue-600">
                        45.2%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}