import { useState } from 'react';
import { Share2, Trash, Pencil, Copy, Check, Eye, ChevronLeft, ChevronRight, Calendar, Clock, Search, X, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { ShareDialog, ShareItem } from './share-dialog';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const initialShares: ShareItem[] = [
  {
    id: '1',
    fileName: '项目文档.pdf',
    fileType: 'file',
    shareLink: 'https://example.com/share/abc123',
    expiresAt: '2025-12-25',
    createdAt: '2025-12-18',
    accessCount: 15,
  },
  {
    id: '2',
    fileName: '设计图纸',
    fileType: 'folder',
    shareLink: 'https://example.com/share/def456',
    expiresAt: null,
    createdAt: '2025-12-15',
    accessCount: 8,
  },
  {
    id: '3',
    fileName: 'CAD项目A',
    fileType: 'cad',
    shareLink: 'https://example.com/share/ghi789',
    expiresAt: '2025-12-20',
    createdAt: '2025-12-10',
    accessCount: 23,
  },
  {
    id: '4',
    fileName: '会议记录.docx',
    fileType: 'file',
    shareLink: 'https://example.com/share/jkl012',
    expiresAt: '2025-12-30',
    createdAt: '2025-12-12',
    accessCount: 5,
  },
  {
    id: '5',
    fileName: '产品资料',
    fileType: 'folder',
    shareLink: 'https://example.com/share/mno345',
    expiresAt: null,
    createdAt: '2025-12-08',
    accessCount: 42,
  },
];

// Export for statistics
export const getShareStats = () => {
  return {
    totalShares: initialShares.length,
  };
};

const ITEMS_PER_PAGE = 10;

interface ShareManagementProps {
  onAccessShare?: (shareId: string) => void;
}

export function ShareManagement({ onAccessShare }: ShareManagementProps = {}) {
  const [shares, setShares] = useState<ShareItem[]>(initialShares);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedShare, setSelectedShare] = useState<ShareItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'file' | 'folder' | 'cad'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired'>('all');

  // Helper functions defined first
  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const getFileTypeText = (type: string) => {
    switch (type) {
      case 'file': return '文件';
      case 'folder': return '文件夹';
      case 'cad': return 'CAD项目';
      default: return '未知';
    }
  };

  // Handle search change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Reset search
  const handleResetSearch = () => {
    setSearchQuery('');
    setFilterType('all');
    setFilterStatus('all');
    setCurrentPage(1);
  };

  // Filter shares
  const filteredShares = shares.filter(share => {
    // Search filter
    const matchesSearch = share.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Type filter
    const matchesType = filterType === 'all' || share.fileType === filterType;
    
    // Status filter
    let matchesStatus = true;
    if (filterStatus === 'active') {
      matchesStatus = !isExpired(share.expiresAt);
    } else if (filterStatus === 'expired') {
      matchesStatus = isExpired(share.expiresAt);
    }
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Pagination
  const totalItems = filteredShares.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedShares = filteredShares.slice(startIndex, endIndex);

  const handleCopyLink = async (shareId: string, link: string) => {
    try {
      // Try modern clipboard API first
      await navigator.clipboard.writeText(link);
      setCopiedId(shareId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      // Fallback to older method
      try {
        const textArea = document.createElement('textarea');
        textArea.value = link;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
        setCopiedId(shareId);
        setTimeout(() => setCopiedId(null), 2000);
      } catch (fallbackErr) {
        console.error('Failed to copy:', fallbackErr);
        alert('复制失败，请手动复制链接');
      }
    }
  };

  const handleDeleteShare = (shareId: string) => {
    if (confirm('确定要删除此分享吗？删除后分享链接将失效。')) {
      setShares(shares.filter(share => share.id !== shareId));
    }
  };

  const handleEditShare = (share: ShareItem) => {
    setSelectedShare(share);
    setIsEditDialogOpen(true);
  };

  const handleShareUpdated = (updatedShare: ShareItem) => {
    setShares(shares.map(share => share.id === updatedShare.id ? updatedShare : share));
    setSelectedShare(null);
  };

  const handleDemoAccess = (shareLink: string) => {
    // Extract share ID from link
    const shareId = shareLink.split('/').pop() || '';
    if (onAccessShare) {
      onAccessShare(shareId);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-6 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-semibold">我的分享</h2>
              <p className="text-sm text-gray-600">管理您创建的所有分享链接</p>
            </div>
          </div>
          {onAccessShare && (
            <Button
              variant="outline"
              onClick={() => handleDemoAccess('https://example.com/share/abc123')}
              className="gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              演示访问分享链接
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Search and Filters */}
        <div className="bg-white border rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            {/* Left: Filters */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">类型：</span>
                <Select value={filterType} onValueChange={(value: 'all' | 'file' | 'folder' | 'cad') => {
                  setFilterType(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="file">文件</SelectItem>
                    <SelectItem value="folder">文件夹</SelectItem>
                    <SelectItem value="cad">CAD项目</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">状态：</span>
                <Select value={filterStatus} onValueChange={(value: 'all' | 'active' | 'expired') => {
                  setFilterStatus(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="active">有效</SelectItem>
                    <SelectItem value="expired">已过期</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right: Search Bar */}
            <div className="flex items-center gap-2 ml-auto">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索文件名..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchChange(searchQuery);
                    }
                  }}
                  className="pl-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Button
                variant="default"
                onClick={() => handleSearchChange(searchQuery)}
              >
                <Search className="w-4 h-4 mr-2" />
                搜索
              </Button>
              <Button
                variant="outline"
                onClick={handleResetSearch}
                disabled={!searchQuery && filterType === 'all' && filterStatus === 'all'}
              >
                重置
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>文件名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>过期时间</TableHead>
                <TableHead>分享链接</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedShares.map((share) => (
                <TableRow key={share.id}>
                  <TableCell className="font-medium">{share.fileName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getFileTypeText(share.fileType)}</Badge>
                  </TableCell>
                  <TableCell>
                    {share.expiresAt ? (
                      <Badge variant={isExpired(share.expiresAt) ? 'destructive' : 'outline'}>
                        {isExpired(share.expiresAt) ? '已过期' : share.expiresAt}
                      </Badge>
                    ) : (
                      <Badge variant="outline">永久有效</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 max-w-xs">
                      <Input
                        value={share.shareLink}
                        readOnly
                        className="text-xs h-8 flex-1 min-w-0"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyLink(share.id, share.shareLink)}
                        className="shrink-0"
                      >
                        {copiedId === share.id ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <a href={share.shareLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 text-blue-500" />
                      </a>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{share.createdAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditShare(share)}
                        title="编辑分享"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteShare(share.id)}
                        title="删除分享"
                      >
                        <Trash className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredShares.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Share2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>{searchQuery || filterType !== 'all' || filterStatus !== 'all' ? '没有找到匹配的分享记录' : '暂无分享记录'}</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 0 && filteredShares.length > 0 && (
        <div className="flex items-center justify-between p-4 border-t">
          <div className="text-sm text-gray-600">
            显示 {startIndex + 1} - {Math.min(endIndex, totalItems)} 条，共 {totalItems} 条
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">每页 5 条</SelectItem>
              <SelectItem value="10">每页 10 条</SelectItem>
              <SelectItem value="20">每页 20 条</SelectItem>
              <SelectItem value="50">每页 50 条</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Edit Share Dialog */}
      {selectedShare && (
        <ShareDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedShare(null);
          }}
          fileName={selectedShare.fileName}
          fileType={selectedShare.fileType}
          existingShare={selectedShare}
          onShareCreated={handleShareUpdated}
        />
      )}
    </div>
  );
}