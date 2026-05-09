import { useState, useEffect } from 'react';
import { Share2, Folder, File, CheckCircle, AlertCircle, ChevronRight, Home, ChevronDown, Search, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ShareItem } from './share-dialog';
import { CascadeFolderSelector, FolderItem } from './cascade-folder-selector';

interface ShareAccessProps {
  shareId: string;
  onSaveComplete: () => void;
}

// Mock data - 用户的文件夹结构（树形）
const userFoldersFlat: FolderItem[] = [
  { id: 'root', name: '根目录', type: 'folder', parentId: null },
  { id: '1', name: '工作文档', type: 'folder', parentId: 'root' },
  { id: '1-1', name: '2024年度报告', type: 'folder', parentId: '1' },
  { id: '1-2', name: '客户资料', type: 'folder', parentId: '1' },
  { id: '2', name: '项目资料', type: 'folder', parentId: 'root' },
  { id: '2-1', name: '项目A', type: 'folder', parentId: '2' },
  { id: '2-2', name: '项目B', type: 'folder', parentId: '2' },
  { id: '3', name: 'CAD项目A', type: 'cad', parentId: 'root' },
  { id: '3-1', name: '设计图纸', type: 'folder', parentId: '3' },
  { id: '3-2', name: '技术文档', type: 'folder', parentId: '3' },
  { id: '4', name: '设计图纸', type: 'folder', parentId: 'root' },
  { id: '4-1', name: '产品设计', type: 'folder', parentId: '4' },
  { id: '5', name: '个人文件', type: 'folder', parentId: 'root' },
];

// 构建树形结构
const buildTree = (folders: FolderItem[]): FolderItem[] => {
  const map = new Map<string, FolderItem>();
  const roots: FolderItem[] = [];

  // 创建映射并初始化children
  folders.forEach(folder => {
    map.set(folder.id, { ...folder, children: [] });
  });

  // 构建树形关系
  folders.forEach(folder => {
    const node = map.get(folder.id)!;
    if (folder.parentId === null) {
      roots.push(node);
    } else {
      const parent = map.get(folder.parentId);
      if (parent) {
        parent.children!.push(node);
      }
    }
  });

  return roots;
};

const userFoldersTree = buildTree(userFoldersFlat);

// Mock share data
const mockShares: { [key: string]: ShareItem } = {
  'abc123': {
    id: '1',
    fileName: '项目文档.pdf',
    fileType: 'file',
    shareLink: 'https://example.com/share/abc123',
    expiresAt: '2025-12-25',
    createdAt: '2025-12-18',
    accessCount: 15,
  },
  'def456': {
    id: '2',
    fileName: '设计图纸',
    fileType: 'folder',
    shareLink: 'https://example.com/share/def456',
    expiresAt: null,
    createdAt: '2025-12-15',
    accessCount: 8,
  },
};

export function ShareAccess({ shareId, onSaveComplete }: ShareAccessProps) {
  const [step, setStep] = useState<'login' | 'loading' | 'select' | 'confirm' | 'saving' | 'success' | 'error'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [shareData, setShareData] = useState<ShareItem | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>('root');
  const [newFileName, setNewFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const isExpired = (expiresAt: string | null) => {
    // 分享链接永久有效，不检查过期时间
    return false;
  };

  const handleLogin = async () => {
    // 模拟SSO登录验证
    if (!username || !password) {
      setErrorMessage('请输入用户名和密码');
      return;
    }

    setStep('loading');
    setErrorMessage('');

    // 模拟API调用
    setTimeout(() => {
      // 简单验证 - 实际应该调用SSO服务
      if (username === 'admin' || username === 'user') {
        // 获取分享数据
        const share = mockShares[shareId];
        if (!share) {
          setErrorMessage('分享链接无效或已被删除');
          setStep('error');
          return;
        }

        // 移除过期检查 - 分享链接永久有效
        // if (isExpired(share.expiresAt)) {
        //   setErrorMessage('分享链接已过期');
        //   setStep('error');
        //   return;
        // }

        setShareData(share);
        setNewFileName(share.fileName); // 初始化文件名
        setStep('select');
      } else {
        setErrorMessage('用户名或密码错误');
        setStep('login');
      }
    }, 1000);
  };

  const handleNextToConfirm = () => {
    if (!selectedFolder) {
      setErrorMessage('请选择保存位置');
      return;
    }
    setErrorMessage('');
    setStep('confirm');
  };

  const handleSave = async () => {
    if (!selectedFolder) {
      setErrorMessage('请选择保存位置');
      return;
    }

    setStep('saving');
    setErrorMessage('');

    // 模拟保存操作（复制文件到用户空间）
    setTimeout(() => {
      setStep('success');
    }, 1500);
  };

  const getFileTypeText = (type: string) => {
    switch (type) {
      case 'file': return '文件';
      case 'folder': return '文件夹';
      case 'cad': return 'CAD项目';
      default: return '未知';
    }
  };

  const getSelectedFolderName = () => {
    const folder = userFoldersFlat.find(f => f.id === selectedFolder);
    return folder?.name || '未选择';
  };

  // 获取文件夹路径（面包屑）
  const getFolderPath = (folderId: string): FolderItem[] => {
    const path: FolderItem[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const folder = userFoldersFlat.find(f => f.id === currentId);
      if (folder) {
        path.unshift(folder);
        currentId = folder.parentId;
      } else {
        break;
      }
    }

    return path;
  };

  // Login Step
  if (step === 'login') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Share2 className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">访问分享内容</h2>
            <p className="text-gray-600">请使用您的SSO账户登录以继续</p>
          </div>

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                用户名
              </label>
              <Input
                type="text"
                placeholder="输入SSO用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              <p className="text-xs text-gray-500 mt-1">演示：使用 "admin" 或 "user"</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <Input
                type="password"
                placeholder="输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              <p className="text-xs text-gray-500 mt-1">演示：输入任意密码</p>
            </div>

            <Button
              className="w-full"
              onClick={handleLogin}
            >
              登录并继续
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading Step
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">正在验证身份...</p>
        </div>
      </div>
    );
  }

  // Error Step
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">访问失败</h2>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <Button
            variant="outline"
            onClick={() => setStep('login')}
          >
            返回登录
          </Button>
        </div>
      </div>
    );
  }

  // Select Folder Step
  if (step === 'select') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Share2 className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-semibold">保存分享内容</h2>
            </div>
            <p className="text-gray-600">选择将分享内容保存到您的空间中</p>
          </div>

          {/* Share Info */}
          {shareData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                {shareData.fileType === 'file' ? (
                  <File className="w-8 h-8 text-blue-600 shrink-0" />
                ) : (
                  <Folder className="w-8 h-8 text-blue-600 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{shareData.fileName}</h3>
                    <Badge variant="outline">{getFileTypeText(shareData.fileType)}</Badge>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>分享者：张三</p>
                    {shareData.expiresAt && (
                      <p>有效期至：{shareData.expiresAt}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Folder Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              选择保存位置
            </label>
            <CascadeFolderSelector
              folders={userFoldersTree}
              selectedId={selectedFolder}
              onSelect={setSelectedFolder}
            />
          </div>

          {/* Save Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">提示</p>
                <p>文件将被复制到您的空间中，不会影响原文件。您可以随时删除或修改副本。</p>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep('login')}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              onClick={handleNextToConfirm}
              className="flex-1"
              disabled={!selectedFolder}
            >
              下一步
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Confirm Step
  if (step === 'confirm') {
    const folderPath = getFolderPath(selectedFolder);
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Share2 className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-semibold">确认保存信息</h2>
            </div>
            <p className="text-gray-600">请确认保存路径和文件名</p>
          </div>

          {/* File Name Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              文件名
            </label>
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="输入文件名"
            />
            <p className="text-xs text-gray-500 mt-1">
              可以修改文件名，保持原名或输入新名称
            </p>
          </div>

          {/* Save Path Breadcrumb */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              保存路径
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center flex-wrap gap-2">
                {folderPath.map((folder, index) => (
                  <div key={folder.id} className="flex items-center gap-2">
                    {index === 0 ? (
                      <Home className="w-4 h-4 text-gray-500" />
                    ) : folder.type === 'cad' ? (
                      <Folder className="w-4 h-4 text-purple-500" />
                    ) : (
                      <Folder className="w-4 h-4 text-blue-500" />
                    )}
                    <span className="text-sm text-gray-700">{folder.name}</span>
                    {index < folderPath.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {shareData?.fileType === 'file' ? (
                    <File className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Folder className="w-4 h-4 text-blue-600" />
                  )}
                  <span className="font-medium text-blue-600">{newFileName}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setStep('select')}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline mt-2"
            >
              更改保存位置
            </button>
          </div>

          {/* Share Info Summary */}
          {shareData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                {shareData.fileType === 'file' ? (
                  <File className="w-6 h-6 text-blue-600 shrink-0" />
                ) : (
                  <Folder className="w-6 h-6 text-blue-600 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">分享内容</span>
                    <Badge variant="outline" className="text-xs">
                      {getFileTypeText(shareData.fileType)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    原文件名：{shareData.fileName}
                  </p>
                  <div className="text-xs text-gray-500 mt-1">
                    <p>分享者：张三</p>
                    {shareData.expiresAt && (
                      <p>有效期至：{shareData.expiresAt}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">提示</p>
                <p>文件将被复制到您的空间中，不会影响原文件。您可以随时删除或修改副本。</p>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep('select')}
              className="flex-1"
            >
              上一步
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
              disabled={!newFileName.trim()}
            >
              确认保存
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Saving Step
  if (step === 'saving') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">正在保存文件...</p>
          <p className="text-sm text-gray-500 mt-2">保存位置：{getSelectedFolderName()}</p>
        </div>
      </div>
    );
  }

  // Success Step
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">保存成功</h2>
          <p className="text-gray-600 mb-2">文件已成功保存到您的空间</p>
          
          {shareData && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <File className="w-4 h-4" />
                <span className="font-medium">{shareData.fileName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ChevronRight className="w-4 h-4" />
                <span>{getSelectedFolderName()}</span>
              </div>
            </div>
          )}

          <Button
            onClick={onSaveComplete}
            className="w-full"
          >
            前往我的文件
          </Button>
        </div>
      </div>
    );
  }

  return null;
}