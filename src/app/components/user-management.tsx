import { useState } from 'react';
import { Users, Plus, Pencil, Trash, ChevronLeft, ChevronRight, Shield, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string; // 手机号
  password?: string; // 密码（可选，用于编辑时修改）
  requirePasswordReset: boolean; // 下次登录时是否需要重置密码
  require2FA: boolean; // 是否需要2FA验证
  role: string; // "主账号" | "子用户" - 用户类型
  permissionRole: string[]; // 权限角色ID数组（可多选）
  createdAt: string;
}

// 可用角色列表（从角色管理获取）
const availableRoles = [
  { id: '1', name: '超级管理员', isSystem: true }, // 系统角色，不可修改
  { id: '3', name: 'CAD工程师', isSystem: false },
  { id: '4', name: '部门主管', isSystem: false },
  { id: '5', name: '财务人员', isSystem: false },
  { id: '6', name: '项目经理', isSystem: false },
];

const initialUsers: User[] = [
  {
    id: '1',
    name: '张三',
    email: 'zhangsan@example.com',
    phone: '13800138000',
    role: '主账号',
    permissionRole: ['1'],
    requirePasswordReset: false,
    require2FA: false,
    createdAt: '2025-01-10',
  },
  {
    id: '2',
    name: '李四',
    email: 'lisi@example.com',
    phone: '13800138001',
    role: '子用户',
    permissionRole: ['3'],
    requirePasswordReset: false,
    require2FA: false,
    createdAt: '2025-02-15',
  },
  {
    id: '3',
    name: '王五',
    email: 'wangwu@example.com',
    phone: '13800138002',
    role: '子用户',
    permissionRole: ['4'],
    requirePasswordReset: true,
    require2FA: false,
    createdAt: '2025-03-20',
  },
  {
    id: '4',
    name: '赵六',
    email: 'zhaoliu@example.com',
    phone: '13800138003',
    role: '子用户',
    permissionRole: ['5'],
    requirePasswordReset: false,
    require2FA: false,
    createdAt: '2025-04-05',
  },
  {
    id: '5',
    name: '孙七',
    email: 'sunqi@example.com',
    phone: '13800138004',
    role: '子用户',
    permissionRole: ['6'],
    requirePasswordReset: false,
    require2FA: false,
    createdAt: '2025-04-10',
  },
];

// Export for statistics
export const getUserStats = () => {
  return {
    totalUsers: initialUsers.length,
  };
};

const ITEMS_PER_PAGE = 10;

export function UserManagement() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    permissionRole: [] as string[],
    requirePasswordReset: false,
    require2FA: false,
  });
  const [password, setPassword] = useState(''); // 密码单独管理
  const [showPasswordReset, setShowPasswordReset] = useState(false); // 控制密码重置区域显示
  const [searchQuery, setSearchQuery] = useState(''); // 搜索关键词
  const [currentPage, setCurrentPage] = useState(1);

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', permissionRole: [], requirePasswordReset: false, require2FA: false });
    setPassword('');
    setShowPasswordReset(false);
  };

  const handleCreateUser = () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      alert('请填写姓名、邮箱和手机号');
      return;
    }
    if (formData.permissionRole.length === 0) {
      alert('请分配一个权限角色');
      return;
    }
    if (!password) {
      alert('请设置密码');
      return;
    }

    const newUser: User = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: password,
      requirePasswordReset: formData.requirePasswordReset,
      require2FA: formData.require2FA,
      role: '子用户', // 固定为子用户
      permissionRole: formData.permissionRole,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setUsers([...users, newUser]);
    resetForm();
    setIsCreateDialogOpen(false);
  };

  const handleEditUser = () => {
    if (!selectedUser || !formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      alert('请填写姓名、邮箱和手机号');
      return;
    }
    if (formData.permissionRole.length === 0) {
      alert('请分配一个权限角色');
      return;
    }

    setUsers(users.map(user =>
      user.id === selectedUser.id
        ? { 
            ...user, 
            name: formData.name, 
            email: formData.email, 
            phone: formData.phone, 
            permissionRole: formData.permissionRole,
            require2FA: formData.require2FA,
          }
        : user
    ));
    resetForm();
    setIsEditDialogOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    
    // 禁止删除主账号
    if (user?.role === '主账号') {
      alert('主账号不可删除');
      return;
    }
    
    if (confirm('确定要删除此用户吗？')) {
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  const openEditDialog = (user: User) => {
    // 禁止编辑主账号
    if (user.role === '主账号') {
      alert('主账号不可编辑');
      return;
    }
    
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      permissionRole: user.permissionRole,
      requirePasswordReset: user.requirePasswordReset,
      require2FA: user.require2FA,
    });
    setIsEditDialogOpen(true);
  };

  // 搜索过滤逻辑
  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.phone.includes(query) ||
      user.role.toLowerCase().includes(query) ||
      user.permissionRole.some(roleId => {
        const roleName = availableRoles.find(r => r.id === roleId)?.name || '';
        return roleName.toLowerCase().includes(query);
      })
    );
  });

  // 重置分页当搜索条件改变时
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  const currentUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-6 bg-white">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-semibold">用户管理</h2>
        </div>
        <p className="text-gray-600">管理租户内的用户信息和权限</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="mb-4 flex items-center gap-4">
          {/* Search Box */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索姓名、邮箱、手机号、用户类型或权限角色..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Add User Button */}
          <Button onClick={() => {
            resetForm();
            setIsCreateDialogOpen(true);
          }} className="shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            添加用户
          </Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>用户类型</TableHead>
                <TableHead>权限角色</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    暂无用户数据
                  </TableCell>
                </TableRow>
              ) : (
                currentUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === '主账号' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.permissionRole.map(roleId => (
                          <Badge key={roleId} variant="outline" className="text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            {availableRoles.find(r => r.id === roleId)?.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{user.createdAt}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.role === '主账号' ? (
                          <span className="text-xs text-gray-400">不可操作</span>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(user)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash className="w-4 h-4 text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between p-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="w-4 h-4" />
          上一页
        </Button>
        <div className="text-sm">
          第 {currentPage} 页，共 {totalPages} 页
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          下一页
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加用户</DialogTitle>
            <DialogDescription>
              添加一个新的租户用户
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">姓名</label>
              <Input
                placeholder="请输入姓名"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">邮箱</label>
              <Input
                type="email"
                placeholder="请输入邮箱"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">手机号</label>
              <Input
                type="tel"
                placeholder="请输入手机号"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">权限角色 <span className="text-red-500">*</span></label>
              <p className="text-xs text-gray-500 mb-1">分配详细的功能权限</p>
              <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                {availableRoles.filter(role => !role.isSystem).map(role => (
                  <label key={role.id} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      className="mr-2 w-4 h-4"
                      checked={formData.permissionRole.includes(role.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, permissionRole: [...formData.permissionRole, role.id] });
                        } else {
                          setFormData({ ...formData, permissionRole: formData.permissionRole.filter(id => id !== role.id) });
                        }
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{role.name}</span>
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">💡 超级管理员角色为系统保护角色，不可分配</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">密码 <span className="text-red-500">*</span></label>
              <Input
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="mr-2 w-4 h-4"
                  checked={formData.requirePasswordReset}
                  onChange={(e) => setFormData({ ...formData, requirePasswordReset: e.target.checked })}
                />
                <span className="text-sm">下次登录时要求重置密码</span>
              </label>
              <p className="text-xs text-gray-500 ml-6">勾选后，用户首次登录时必须修改密码</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">操作保护</label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="mr-2 w-4 h-4"
                  checked={formData.require2FA}
                  onChange={(e) => setFormData({ ...formData, require2FA: e.target.checked })}
                />
                <span className="text-sm">要求2FA验证</span>
              </label>
              <p className="text-xs text-gray-500 ml-6">勾选后，用户登录和敏感操作需要进行双因素认证</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false);
              resetForm();
            }}>
              取消
            </Button>
            <Button onClick={handleCreateUser}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
            <DialogDescription>
              修改用户信息
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">姓名</label>
              <Input
                placeholder="请输入姓名"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">邮箱</label>
              <Input
                type="email"
                placeholder="请输入邮箱"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">手机号</label>
              <Input
                type="tel"
                placeholder="请输入手机号"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">权限角色 <span className="text-red-500">*</span></label>
              <p className="text-xs text-gray-500 mb-1">分配详细的功能权限</p>
              <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                {availableRoles.filter(role => !role.isSystem).map(role => (
                  <label key={role.id} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      className="mr-2 w-4 h-4"
                      checked={formData.permissionRole.includes(role.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, permissionRole: [...formData.permissionRole, role.id] });
                        } else {
                          setFormData({ ...formData, permissionRole: formData.permissionRole.filter(id => id !== role.id) });
                        }
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{role.name}</span>
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">💡 超级管理员角色为系统保护角色，不可分配</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">操作保护</label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="mr-2 w-4 h-4"
                  checked={formData.require2FA}
                  onChange={(e) => setFormData({ ...formData, require2FA: e.target.checked })}
                />
                <span className="text-sm">要求2FA验证</span>
              </label>
              <p className="text-xs text-gray-500 ml-6">勾选后，用户登录和敏感操作需要进行双因素认证</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setSelectedUser(null);
              resetForm();
            }}>
              取消
            </Button>
            <Button onClick={handleEditUser}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}