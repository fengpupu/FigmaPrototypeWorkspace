import { useState } from 'react';
import { Shield, Plus, Edit2, Trash2, Users as UsersIcon, Check, X, Search, ChevronLeft, ChevronRight, ChevronDown, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'share' | 'manage' | 'access';
}

// 树形权限节点
export interface PermissionTreeNode {
  id: string;
  name: string;
  description?: string;
  children?: PermissionTreeNode[];
  permissionId?: string; // 叶子节点的权限ID
}

export interface AccessControl {
  maxFileSize: number; // 字节
  allowedIPs: string[]; // IP地址列表
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // Permission IDs
  accessControl: AccessControl;
  userCount: number;
  isSystem: boolean; // System roles cannot be deleted
  createdAt: string;
}

// 树形权限数据结构
const permissionTree: PermissionTreeNode[] = [
  {
    id: 'project_permissions',
    name: '📁 项目权限',
    description: '项目管理相关权限',
    children: [
      { id: 'create_project', name: '创建项目', description: '可以创建新的项目', permissionId: 'create_project' },
    ]
  },
  {
    id: 'share_permissions',
    name: '🔗 分享权限',
    description: '文件分享相关操作权限',
    children: [
      { id: 'share_create', name: '创建分享', description: '可以在我的文件中创建分享链接', permissionId: 'share_create' },
      { id: 'share_manage', name: '管理分享', description: '可以管理我的分享链接（编辑、删除）', permissionId: 'share_manage' },
    ]
  },
  {
    id: 'manage_permissions',
    name: '⚙️ 管理权限',
    description: '个人信息和配额管理',
    children: [
      { id: 'view_quota', name: '查看租户配额', description: '可以查看租户存储配额信息', permissionId: 'view_quota' },
      { id: 'edit_profile', name: '修改个人信息', description: '可以修改个人资料和设置', permissionId: 'edit_profile' },
    ]
  }
];

// 从树形结构中提取所有权限ID
const getAllPermissionIds = (nodes: PermissionTreeNode[]): string[] => {
  const ids: string[] = [];
  const traverse = (node: PermissionTreeNode) => {
    if (node.permissionId) {
      ids.push(node.permissionId);
    }
    if (node.children) {
      node.children.forEach(traverse);
    }
  };
  nodes.forEach(traverse);
  return ids;
};

const allPermissionIds = getAllPermissionIds(permissionTree);

// Mock 角色数据
const mockRoles: Role[] = [
  {
    id: '1',
    name: '超级管理员',
    description: '拥有系统的所有权限',
    permissions: allPermissionIds,
    accessControl: { maxFileSize: 1073741824, allowedIPs: ['0.0.0.0/0'] },
    userCount: 2,
    isSystem: true,
    createdAt: '2025-01-01',
  },
  {
    id: '2',
    name: '普通用户',
    description: '基本的文件查看和分享权限',
    permissions: ['share_create'],
    accessControl: { maxFileSize: 536870912, allowedIPs: ['0.0.0.0/0'] },
    userCount: 15,
    isSystem: false,
    createdAt: '2025-01-01',
  },
  {
    id: '3',
    name: 'CAD工程师',
    description: 'CAD项目的完整权限',
    permissions: [
      'share_create', 'share_manage'
    ],
    accessControl: { maxFileSize: 1073741824, allowedIPs: ['0.0.0.0/0'] },
    userCount: 8,
    isSystem: false,
    createdAt: '2025-01-10',
  },
  {
    id: '4',
    name: '部门主管',
    description: '部门文件管理和用户查看权限',
    permissions: [
      'share_create', 'share_manage'
    ],
    accessControl: { maxFileSize: 1073741824, allowedIPs: ['0.0.0.0/0'] },
    userCount: 5,
    isSystem: false,
    createdAt: '2025-01-15',
  },
  {
    id: '5',
    name: '财务专员',
    description: '财务相关文件的查看和编辑权限',
    permissions: [
      'view_quota', 'edit_profile'
    ],
    accessControl: { maxFileSize: 536870912, allowedIPs: ['0.0.0.0/0'] },
    userCount: 3,
    isSystem: false,
    createdAt: '2025-01-20',
  },
  {
    id: '6',
    name: '项目协调员',
    description: '项目文件管理和分享权限',
    permissions: [
      'share_create', 'share_manage'
    ],
    accessControl: { maxFileSize: 1073741824, allowedIPs: ['0.0.0.0/0'] },
    userCount: 6,
    isSystem: false,
    createdAt: '2025-01-25',
  },
  {
    id: '7',
    name: '只读用户',
    description: '仅可查看文件，无编辑权限',
    permissions: ['share_create'],
    accessControl: { maxFileSize: 536870912, allowedIPs: ['0.0.0.0/0'] },
    userCount: 12,
    isSystem: false,
    createdAt: '2025-02-01',
  },
  {
    id: '8',
    name: '技术支持',
    description: '技术文档管理和用户协助权限',
    permissions: [
      'share_create', 'share_manage'
    ],
    accessControl: { maxFileSize: 1073741824, allowedIPs: ['0.0.0.0/0'] },
    userCount: 4,
    isSystem: false,
    createdAt: '2025-02-05',
  },
];

const ITEMS_PER_PAGE = 5;

export function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['project_permissions', 'share_permissions', 'manage_permissions']));

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    accessControl: { maxFileSize: 536870912, allowedIPs: ['0.0.0.0/0'] } as AccessControl,
  });

  const handleCreateRole = () => {
    setIsCreating(true);
    setEditingRole(null);
    setFormData({
      name: '',
      description: '',
      permissions: [],
      accessControl: { maxFileSize: 536870912, allowedIPs: ['0.0.0.0/0'] },
    });
  };

  const handleEditRole = (role: Role) => {
    // 阻止编辑超级管理员角色
    if (role.id === '1') {
      alert('超级管理员角色不可编辑');
      return;
    }
    
    setEditingRole(role);
    setIsCreating(false);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: [...role.permissions],
      accessControl: { ...role.accessControl },
    });
  };

  const handleDeleteRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.isSystem) {
      alert('系统角色不能删除');
      return;
    }
    if (confirm('确定要删除这个角色吗？所有拥有此角色的用户将失去相应权限。')) {
      setRoles(roles.filter(r => r.id !== roleId));
    }
  };

  const handleSaveRole = () => {
    if (!formData.name.trim()) {
      alert('请输入角色名称');
      return;
    }

    if (formData.permissions.length === 0) {
      alert('请至少选择一个权限');
      return;
    }

    if (editingRole) {
      // 更新现有角色
      setRoles(roles.map(r => 
        r.id === editingRole.id 
          ? { ...r, ...formData }
          : r
      ));
    } else {
      // 创建新角色
      const newRole: Role = {
        id: String(Date.now()),
        ...formData,
        userCount: 0,
        isSystem: false,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setRoles([...roles, newRole]);
    }

    setIsCreating(false);
    setEditingRole(null);
    setFormData({ name: '', description: '', permissions: [], accessControl: { maxFileSize: 536870912, allowedIPs: ['0.0.0.0/0'] } });
  };

  const handleCancelEdit = () => {
    setIsCreating(false);
    setEditingRole(null);
    setFormData({ name: '', description: '', permissions: [], accessControl: { maxFileSize: 536870912, allowedIPs: ['0.0.0.0/0'] } });
  };

  const togglePermission = (permissionId: string) => {
    if (formData.permissions.includes(permissionId)) {
      setFormData({
        ...formData,
        permissions: formData.permissions.filter(p => p !== permissionId),
      });
    } else {
      setFormData({
        ...formData,
        permissions: [...formData.permissions, permissionId],
      });
    }
  };

  // 切换节点展开/折叠
  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // 获取节点下的所有权限ID
  const getNodePermissions = (node: PermissionTreeNode): string[] => {
    const permissions: string[] = [];
    const traverse = (n: PermissionTreeNode) => {
      if (n.permissionId) {
        permissions.push(n.permissionId);
      }
      if (n.children) {
        n.children.forEach(traverse);
      }
    };
    traverse(node);
    return permissions;
  };

  // 检查节点是否全部选中
  const isNodeFullySelected = (node: PermissionTreeNode): boolean => {
    const nodePermissions = getNodePermissions(node);
    if (nodePermissions.length === 0) return false;
    return nodePermissions.every(p => formData.permissions.includes(p));
  };

  // 检查节点是否部分选中
  const isNodePartiallySelected = (node: PermissionTreeNode): boolean => {
    const nodePermissions = getNodePermissions(node);
    if (nodePermissions.length === 0) return false;
    const selectedCount = nodePermissions.filter(p => formData.permissions.includes(p)).length;
    return selectedCount > 0 && selectedCount < nodePermissions.length;
  };

  // 切换节点选择（包括所有子节点）
  const toggleNodeSelection = (node: PermissionTreeNode) => {
    const nodePermissions = getNodePermissions(node);
    const isFullySelected = isNodeFullySelected(node);
    
    if (isFullySelected) {
      // 取消选择所有子权限
      setFormData({
        ...formData,
        permissions: formData.permissions.filter(p => !nodePermissions.includes(p)),
      });
    } else {
      // 选择所有子权限
      const newPermissions = [...formData.permissions];
      nodePermissions.forEach(p => {
        if (!newPermissions.includes(p)) {
          newPermissions.push(p);
        }
      });
      setFormData({
        ...formData,
        permissions: newPermissions,
      });
    }
  };

  // 树形权限节点组件
  const PermissionTreeNodeComponent = ({ node, level = 0 }: { node: PermissionTreeNode; level?: number }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isFullySelected = isNodeFullySelected(node);
    const isPartiallySelected = isNodePartiallySelected(node);
    const isLeaf = !!node.permissionId;

    return (
      <div>
        <div
          className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
            isFullySelected ? 'bg-blue-50' : ''
          }`}
          style={{ paddingLeft: `${level * 24 + 8}px` }}
        >
          {/* Expand/Collapse Icon */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="shrink-0 w-5 h-5 flex items-center justify-center text-gray-600 hover:text-gray-900 mt-0.5"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-5 shrink-0" />}

          {/* Checkbox */}
          <div
            onClick={() => {
              if (isLeaf && node.permissionId) {
                togglePermission(node.permissionId);
              } else {
                toggleNodeSelection(node);
              }
            }}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${
              isFullySelected
                ? 'border-blue-600 bg-blue-600'
                : isPartiallySelected
                ? 'border-blue-600 bg-blue-100'
                : 'border-gray-300'
            }`}
          >
            {isFullySelected && <Check className="w-3 h-3 text-white" />}
            {isPartiallySelected && <div className="w-2 h-0.5 bg-blue-600" />}
          </div>

          {/* Node Label */}
          <div
            onClick={() => {
              if (isLeaf && node.permissionId) {
                togglePermission(node.permissionId);
              } else {
                toggleNodeSelection(node);
              }
            }}
            className="flex-1 min-w-0"
          >
            <div className="font-medium text-sm">{node.name}</div>
            {node.description && (
              <div className="text-xs text-gray-500 mt-0.5">{node.description}</div>
            )}
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {node.children!.map((child) => (
              <PermissionTreeNodeComponent key={child.id} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 重置分页当搜索条件改变时
  const totalPages = Math.ceil(filteredRoles.length / ITEMS_PER_PAGE);
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  // 从树形结构获取权限名称
  const getPermissionName = (permissionId: string): string | null => {
    let name: string | null = null;
    const traverse = (node: PermissionTreeNode) => {
      if (node.permissionId === permissionId) {
        name = node.name;
        return;
      }
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    permissionTree.forEach(traverse);
    return name;
  };

  // 如果正在创建或编辑角色
  if (isCreating || editingRole) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-600" />
                {editingRole ? '编辑角色' : '创建角色'}
              </h2>
              <p className="text-gray-600 mt-1">
                {editingRole ? '修改角色信息和权限' : '创建新角色并分配权限'}
              </p>
            </div>

            {/* Form */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="space-y-4">
                {/* Role Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    角色名称 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例如：CAD工程师"
                    disabled={editingRole?.isSystem}
                  />
                  {editingRole?.isSystem && (
                    <p className="text-xs text-gray-500 mt-1">系统角色名称不可修改</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    角色描述
                  </label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="描述这个角色的职责和用途"
                  />
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="mb-4">
                <h3 className="font-medium mb-2">权限配置 <span className="text-red-500">*</span></h3>
                <p className="text-sm text-gray-600">为这个角色选择合适的权限（支持展开/折叠和级联选择）</p>
              </div>

              {/* Permission Tree */}
              <div className="border rounded-lg p-3 max-h-[500px] overflow-y-auto bg-gray-50">
                {permissionTree.map((node) => (
                  <PermissionTreeNodeComponent key={node.id} node={node} level={0} />
                ))}
              </div>

              {/* Selected Count */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">
                  已选择 <span className="font-medium text-blue-600">{formData.permissions.length}</span> 个权限
                </p>
              </div>
            </div>

            {/* Access Control */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="mb-4">
                <h3 className="font-medium mb-2">访问控制</h3>
                <p className="text-sm text-gray-600">配置文件大小和IP访问限制</p>
              </div>

              <div className="space-y-4">
                {/* Max File Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    单个文件最大大小（字节）
                  </label>
                  <Input
                    type="number"
                    value={formData.accessControl.maxFileSize}
                    onChange={(e) => setFormData({
                      ...formData,
                      accessControl: {
                        ...formData.accessControl,
                        maxFileSize: parseInt(e.target.value) || 0
                      }
                    })}
                    placeholder="536870912"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    当前设置: {(formData.accessControl.maxFileSize / 1024 / 1024 / 1024).toFixed(2)} GB
                    {' '}({(formData.accessControl.maxFileSize / 1024 / 1024).toFixed(0)} MB)
                  </p>
                </div>

                {/* Allowed IPs */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    允许登录的IP地址列表
                  </label>
                  <Input
                    value={formData.accessControl.allowedIPs.join(', ')}
                    onChange={(e) => setFormData({
                      ...formData,
                      accessControl: {
                        ...formData.accessControl,
                        allowedIPs: e.target.value.split(',').map(ip => ip.trim()).filter(ip => ip)
                      }
                    })}
                    placeholder="192.168.1.0/24, 10.0.0.0/8 或 0.0.0.0/0（允许所有）"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    多个IP地址用逗号分隔，支持CIDR格式。使用 0.0.0.0/0 允许所有IP访问
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                className="flex-1"
              >
                取消
              </Button>
              <Button
                onClick={handleSaveRole}
                className="flex-1"
                disabled={!formData.name.trim() || formData.permissions.length === 0}
              >
                {editingRole ? '保存修改' : '创建角色'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 角色列表视图
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          角色管理
        </h2>
        <p className="text-gray-600 mt-1">
          管理系统角色和权限配置
        </p>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索角色名称或描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Create Button */}
          <Button onClick={handleCreateRole} className="shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            创建角色
          </Button>
        </div>
      </div>

      {/* Roles List */}
      <div className="space-y-4">
        {filteredRoles.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((role) => (
          <div key={role.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">{role.name}</h3>
                  {role.isSystem && (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      系统角色
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600 text-sm">{role.description}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 shrink-0">
                {!role.isSystem && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditRole(role)}
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    编辑
                  </Button>
                )}
                {!role.isSystem && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRole(role.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    删除
                  </Button>
                )}
              </div>
            </div>

            {/* Permissions Preview */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">权限列表：</p>
              <div className="flex flex-wrap gap-2">
                {role.permissions.slice(0, 10).map(permId => {
                  const permName = getPermissionName(permId);
                  if (!permName) return null;
                  
                  return (
                    <Badge
                      key={permId}
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {permName}
                    </Badge>
                  );
                })}
                {role.permissions.length > 10 && (
                  <Badge variant="outline" className="bg-gray-50">
                    +{role.permissions.length - 10} 更多
                  </Badge>
                )}
              </div>
            </div>

            {/* Access Control Info */}
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">访问控制：</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <span className="font-medium">文件大小限制:</span>
                  <span>{(role.accessControl.maxFileSize / 1024 / 1024 / 1024).toFixed(2)} GB</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">允许IP:</span>
                  <span>{role.accessControl.allowedIPs.join(', ')}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          上一页
        </Button>
        <div className="text-gray-500">
          第 {currentPage} 页，共 {Math.ceil(filteredRoles.length / ITEMS_PER_PAGE)} 页
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage * ITEMS_PER_PAGE >= filteredRoles.length}
        >
          下一页
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Empty State */}
      {filteredRoles.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">没有找到匹配的角色</p>
          <p className="text-sm text-gray-500 mt-1">尝试调整搜索条件</p>
        </div>
      )}
    </div>
  );
}