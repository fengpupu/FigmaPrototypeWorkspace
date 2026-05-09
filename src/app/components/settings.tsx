import { useState } from 'react';
import { Settings as SettingsIcon, Save, User, Shield, Edit2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { UserRole } from '../App';

interface UserSettings {
  accountName: string;
  email: string;
  phone: string;
  twoFactorEnabled: boolean;
}

const initialSettings: UserSettings = {
  accountName: '张三',
  email: 'zhangsan@example.com',
  phone: '+86 138 0000 0000',
  twoFactorEnabled: false,
};

interface SettingsProps {
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export function Settings({ userRole, onRoleChange }: SettingsProps) {
  const [settings, setSettings] = useState<UserSettings>(initialSettings);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);

  const handleSave = (section: 'profile' | 'password' | 'email' | 'phone') => {
    setIsSaving(true);
    // Simulate saving
    setTimeout(() => {
      setIsSaving(false);
      if (section === 'profile') {
        setEditingProfile(false);
      } else if (section === 'password') {
        setEditingPassword(false);
      } else if (section === 'email') {
        setEditingEmail(false);
        setEmailCode('');
        setEmailCodeSent(false);
      } else if (section === 'phone') {
        setEditingPhone(false);
        setPhoneCode('');
        setPhoneCodeSent(false);
      }
      alert('设置已保存');
    }, 500);
  };

  const handleCancel = (section: 'profile' | 'password' | 'email' | 'phone') => {
    setSettings(initialSettings);
    if (section === 'profile') {
      setEditingProfile(false);
    } else if (section === 'password') {
      setEditingPassword(false);
    } else if (section === 'email') {
      setEditingEmail(false);
      setEmailCode('');
      setEmailCodeSent(false);
    } else if (section === 'phone') {
      setEditingPhone(false);
      setPhoneCode('');
      setPhoneCodeSent(false);
    }
  };

  const handleChange = (field: keyof UserSettings, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleTwoFactorToggle = (checked: boolean) => {
    setSettings(prev => ({ ...prev, twoFactorEnabled: checked }));
    // Auto-save when toggling two-factor authentication
    setTimeout(() => {
      alert('双因子验证设置已保存');
    }, 300);
  };

  const handleSendEmailCode = () => {
    setEmailCodeSent(true);
    alert('验证码已发送至您的邮箱');
  };

  const handleSendPhoneCode = () => {
    setPhoneCodeSent(true);
    alert('验证码已发送至您的手机');
  };

  return (
    <div className="h-full overflow-auto">
      <div className="border-b p-6 bg-white">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <SettingsIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-semibold">设置</h2>
          </div>
          <p className="text-gray-600">管理您的账户设置和个人信息</p>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Tabs */}
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="profile">
                <User className="w-4 h-4 mr-2" />
                个人信息
              </TabsTrigger>
              <TabsTrigger value="security">
                <Shield className="w-4 h-4 mr-2" />
                账户安全
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4 mt-6">
              {/* Role Card */}
              <Card>
                <CardHeader>
                  <CardTitle>账号类型</CardTitle>
                  <CardDescription>
                    当前用户类型及权限
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="space-y-2">
                        <Label className="text-gray-500">当前类型</Label>
                        <p className="font-medium">
                          {userRole === 'admin' ? '主账号' : '子用户'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {userRole === 'admin' 
                            ? '拥有完整的系统访问权限，包括用户管理功能' 
                            : '可访问文件系统、分享管理和设置功能'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role-switch">切换类型 (演示用)</Label>
                      <Select value={userRole} onValueChange={(value) => onRoleChange(value as UserRole)}>
                        <SelectTrigger id="role-switch">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">主账号</SelectItem>
                          <SelectItem value="user">子用户</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-500">
                        切换类型后侧边栏菜单会相应更新
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>个人信息</CardTitle>
                  <CardDescription>
                    查看您的账号基本信息
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-gray-500">账号名</Label>
                      <p className="font-medium">{settings.accountName}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Email Verification Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>邮箱地址</CardTitle>
                      <CardDescription>
                        更改邮箱需要验证
                      </CardDescription>
                    </div>
                    {!editingEmail && (
                      <Button variant="outline" size="sm" onClick={() => setEditingEmail(true)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        编辑
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingEmail ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="new-email">新邮箱地址</Label>
                        <Input
                          id="new-email"
                          type="email"
                          value={settings.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          placeholder="请输入新邮箱地址"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email-code">验证码</Label>
                        <div className="flex gap-2">
                          <Input
                            id="email-code"
                            value={emailCode}
                            onChange={(e) => setEmailCode(e.target.value)}
                            placeholder="请输入验证码"
                          />
                          <Button
                            variant="outline"
                            onClick={handleSendEmailCode}
                            disabled={emailCodeSent}
                          >
                            {emailCodeSent ? '已发送' : '发送验证码'}
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 border rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-gray-500">邮箱地址</Label>
                        <p className="font-medium">{settings.email}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
                {editingEmail && (
                  <div className="px-6 pb-6">
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" size="sm" onClick={() => handleCancel('email')}>
                        <X className="w-4 h-4 mr-2" />
                        取消
                      </Button>
                      <Button size="sm" onClick={() => handleSave('email')} disabled={isSaving}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? '保存中...' : '保存'}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>

              {/* Phone Verification Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>电话号码</CardTitle>
                      <CardDescription>
                        更改手机号需要验证
                      </CardDescription>
                    </div>
                    {!editingPhone && (
                      <Button variant="outline" size="sm" onClick={() => setEditingPhone(true)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        编辑
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingPhone ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="new-phone">新手机号码</Label>
                        <Input
                          id="new-phone"
                          type="tel"
                          value={settings.phone}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          placeholder="请输入新手机号码"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone-code">验证码</Label>
                        <div className="flex gap-2">
                          <Input
                            id="phone-code"
                            value={phoneCode}
                            onChange={(e) => setPhoneCode(e.target.value)}
                            placeholder="请输入验证码"
                          />
                          <Button
                            variant="outline"
                            onClick={handleSendPhoneCode}
                            disabled={phoneCodeSent}
                          >
                            {phoneCodeSent ? '已发送' : '发送验证码'}
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 border rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-gray-500">电话号码</Label>
                        <p className="font-medium">{settings.phone}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
                {editingPhone && (
                  <div className="px-6 pb-6">
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" size="sm" onClick={() => handleCancel('phone')}>
                        <X className="w-4 h-4 mr-2" />
                        取消
                      </Button>
                      <Button size="sm" onClick={() => handleSave('phone')} disabled={isSaving}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? '保存中...' : '保存'}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-4 mt-6">
              {/* Two-Factor Authentication Card */}
              <Card>
                <CardHeader>
                  <CardTitle>双因子验证</CardTitle>
                  <CardDescription>
                    增强账户安全保护
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <Label htmlFor="two-factor" className="cursor-pointer">
                        启用双因子验证
                      </Label>
                      <p className="text-sm text-gray-500">
                        为您的账户添加额外的安全保护层
                      </p>
                    </div>
                    <Switch
                      id="two-factor"
                      checked={settings.twoFactorEnabled}
                      onCheckedChange={handleTwoFactorToggle}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Password Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>密码管理</CardTitle>
                      <CardDescription>
                        更改您的登录密码
                      </CardDescription>
                    </div>
                    {!editingPassword && (
                      <Button variant="outline" size="sm" onClick={() => setEditingPassword(true)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        编辑
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingPassword ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="current-password">当前密码</Label>
                        <Input
                          id="current-password"
                          type="password"
                          placeholder="请输入当前密码"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-password">新密码</Label>
                        <Input
                          id="new-password"
                          type="password"
                          placeholder="请输入新密码"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">确认新密码</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="请再次输入新密码"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="p-4 border rounded-lg">
                      <div className="space-y-1">
                        <Label>最后修改</Label>
                        <p className="text-sm text-gray-500">
                          2024年12月1日
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
                {editingPassword && (
                  <div className="px-6 pb-6">
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" size="sm" onClick={() => handleCancel('password')}>
                        <X className="w-4 h-4 mr-2" />
                        取消
                      </Button>
                      <Button size="sm" onClick={() => handleSave('password')} disabled={isSaving}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? '保存中...' : '保存'}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}