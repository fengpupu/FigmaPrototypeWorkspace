import { useState, useEffect } from 'react';
import { File, Folder, FolderOpen, Trash, Pencil, Plus, Share, FolderPlus, Upload, Ellipsis, Settings, Search, ChevronLeft, ChevronRight, Home, Download, ChevronDown, Clock, List, Grid, ArrowUpDown, ArrowUp, ArrowDown, X, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ShareDialog, ShareItem } from './share-dialog';
import { StepImportDialog } from './step-import-dialog';
import { FileCategory } from '../App';

interface FileManagerProps {
  selectedCategory: FileCategory;
  onCategoryChange?: (category: FileCategory) => void;
}

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder' | 'cad';
  size?: string;
  modified: string;
  parentId: string | null;
  children?: FileItem[];
}

const initialFiles: FileItem[] = [
  { id: '1', name: 'Documents', type: 'folder', modified: '2026-01-04', parentId: null },
  { id: '2', name: 'Projects', type: 'folder', modified: '2026-01-03', parentId: null },
  { id: '3', name: 'README.md', type: 'file', size: '2.3 KB', modified: '2026-01-05', parentId: null },
  { id: '4', name: 'CAD_Project_1', type: 'cad', modified: '2026-01-05', parentId: null },
  { id: '5', name: 'Images', type: 'folder', modified: '2026-01-02', parentId: null },
  { id: '6', name: 'report.pdf', type: 'file', size: '1.5 MB', modified: '2026-01-04', parentId: null },
  { id: '7', name: 'CAD_Project_2', type: 'cad', modified: '2026-01-03', parentId: null },
  { id: '8', name: 'data.json', type: 'file', size: '45 KB', modified: '2026-01-02', parentId: null },
  { id: '9', name: 'Videos', type: 'folder', modified: '2025-12-30', parentId: null },
  { id: '10', name: 'presentation.pptx', type: 'file', size: '3.2 MB', modified: '2026-01-01', parentId: null },
  { id: '11', name: 'CAD_Project_3', type: 'cad', modified: '2026-01-04', parentId: null },
  { id: '12', name: 'notes.txt', type: 'file', size: '12 KB', modified: '2025-12-28', parentId: null },
  // Subfolder items for Documents
  { id: '13', name: 'Work', type: 'folder', modified: '2026-01-04', parentId: '1' },
  { id: '14', name: 'Personal', type: 'folder', modified: '2026-01-03', parentId: '1' },
  { id: '15', name: 'contract.pdf', type: 'file', size: '856 KB', modified: '2026-01-05', parentId: '1' },
  // Subfolder items for Projects
  { id: '16', name: 'Website', type: 'folder', modified: '2026-01-02', parentId: '2' },
  { id: '17', name: 'Mobile App', type: 'folder', modified: '2026-01-01', parentId: '2' },
  { id: '18', name: 'README.txt', type: 'file', size: '4 KB', modified: '2026-01-03', parentId: '2' },
  // CAD Project 1 items
  { id: '19', name: 'Drawings', type: 'folder', modified: '2026-01-05', parentId: '4' },
  { id: '20', name: 'design.dwg', type: 'file', size: '5.2 MB', modified: '2026-01-05', parentId: '4' },
  { id: '21', name: 'specs.pdf', type: 'file', size: '1.8 MB', modified: '2026-01-04', parentId: '4' },
  // CAD Project 2 items
  { id: '22', name: 'Models', type: 'folder', modified: '2026-01-03', parentId: '7' },
  { id: '23', name: 'blueprint.dwg', type: 'file', size: '4.5 MB', modified: '2026-01-03', parentId: '7' },
  { id: '24', name: 'notes.txt', type: 'file', size: '8 KB', modified: '2026-01-02', parentId: '7' },
  // CAD Project 3 items
  { id: '25', name: 'Archive', type: 'folder', modified: '2026-01-04', parentId: '11' },
  { id: '26', name: 'schematic.dwg', type: 'file', size: '3.8 MB', modified: '2026-01-04', parentId: '11' },
  { id: '27', name: 'revision.pdf', type: 'file', size: '2.1 MB', modified: '2026-01-03', parentId: '11' },
];

// Export for statistics
export const getFileStats = () => {
  const files = initialFiles.filter(f => f.type === 'file');
  const folders = initialFiles.filter(f => f.type === 'folder');
  return {
    totalFiles: files.length,
    totalFolders: folders.length,
    totalItems: initialFiles.length,
  };
};

export function FileManager({ selectedCategory, onCategoryChange }: FileManagerProps) {
  const [files, setFiles] = useState<FileItem[]>(initialFiles);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isStepImportDialogOpen, setIsStepImportDialogOpen] = useState(false);
  const [stepFileName, setStepFileName] = useState('');
  const [pendingStepFile, setPendingStepFile] = useState<File | null>(null);
  const [createType, setCreateType] = useState<'file' | 'folder' | 'cad'>('file');
  const [newName, setNewName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortField, setSortField] = useState<'name' | 'size' | 'type' | 'modified'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'file' | 'folder' | 'cad'>('all');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset folder navigation when category changes
  useEffect(() => {
    setCurrentFolderId(null);
    setCurrentPage(1);
  }, [selectedCategory]);

  // Build tree structure
  const buildTree = (parentId: string | null = null): FileItem[] => {
    return files
      .filter(file => file.parentId === parentId)
      .map(file => ({
        ...file,
        children: file.type === 'folder' || file.type === 'cad' ? buildTree(file.id) : undefined
      }));
  };

  // Get all files recursively for search
  const getAllFilesFlat = (items: FileItem[]): FileItem[] => {
    let result: FileItem[] = [];
    items.forEach(item => {
      result.push(item);
      if (item.children) {
        result = result.concat(getAllFilesFlat(item.children));
      }
    });
    return result;
  };

  // Get current folder items
  const getCurrentFolderItems = (): FileItem[] => {
    return files.filter(file => file.parentId === currentFolderId);
  };

  // Get breadcrumb path
  const getBreadcrumbPath = (): FileItem[] => {
    const path: FileItem[] = [];
    let currentId = currentFolderId;
    
    while (currentId) {
      const folder = files.find(f => f.id === currentId);
      if (folder) {
        path.unshift(folder);
        currentId = folder.parentId;
      } else {
        break;
      }
    }
    
    return path;
  };

  const tree = buildTree();

  // Get breadcrumb path and current items
  const breadcrumbPath = getBreadcrumbPath();
  const currentItems = getCurrentFolderItems();

  // Check if we are inside a CAD project
  const isInsideCADProject = (): boolean => {
    if (currentFolderId === null) return false;
    
    // Check if current folder is a CAD project
    const currentFolder = files.find(f => f.id === currentFolderId);
    if (currentFolder?.type === 'cad') return true;
    
    // Check if any parent is a CAD project
    let parentId = currentFolder?.parentId;
    while (parentId) {
      const parent = files.find(f => f.id === parentId);
      if (parent?.type === 'cad') return true;
      parentId = parent?.parentId;
    }
    
    return false;
  };

  // Filter by category
  const filterByCategory = (items: FileItem[]): FileItem[] => {
    if (selectedCategory === 'all') {
      // Show all files and folders
      return items;
    } else if (selectedCategory === 'cad') {
      // At root level, only show CAD projects
      if (currentFolderId === null) {
        return items.filter(item => item.type === 'cad');
      } else if (isInsideCADProject()) {
        // Inside a CAD project (or its subfolders), show all items
        return items;
      } else {
        // In a non-CAD folder while in CAD category, show all
        return items;
      }
    } else if (selectedCategory === 'recent') {
      // Only apply recent filter at root level
      if (currentFolderId === null) {
        // Get all files flat for recent view
        const allFlat = getAllFilesFlat(buildTree());
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return allFlat
          .filter(item => {
            const itemDate = new Date(item.modified);
            return itemDate >= sevenDaysAgo;
          })
          .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
      } else {
        // Inside a folder, show all items
        return items;
      }
    } else {
      // 'other' - show files and folders that are not CAD
      return items.filter(item => item.type !== 'cad');
    }
  };

  // Filter items based on search
  const filterItems = (items: FileItem[]): FileItem[] => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || item.type === filterType;
      return matchesSearch && matchesType;
    });
  };

  // Apply category filter and search
  const categoryFiltered = filterByCategory(currentItems);
  let filteredItems = searchQuery || filterType !== 'all' ? filterItems(categoryFiltered) : categoryFiltered;

  // Sort items
  filteredItems = [...filteredItems].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'size':
        // Convert size to bytes for proper sorting
        const getSizeInBytes = (size?: string) => {
          if (!size) return 0;
          const match = size.match(/(\d+\.?\d*)\s*(KB|MB|GB)/);
          if (!match) return 0;
          const value = parseFloat(match[1]);
          const unit = match[2];
          if (unit === 'KB') return value * 1024;
          if (unit === 'MB') return value * 1024 * 1024;
          if (unit === 'GB') return value * 1024 * 1024 * 1024;
          return 0;
        };
        aValue = getSizeInBytes(a.size);
        bValue = getSizeInBytes(b.size);
        break;
      case 'type':
        aValue = a.type;
        bValue = b.type;
        break;
      case 'modified':
        aValue = new Date(a.modified).getTime();
        bValue = new Date(b.modified).getTime();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Handle folder click
  const handleFolderClick = (folderId: string) => {
    setCurrentFolderId(folderId);
    setCurrentPage(1);
  };

  // Navigate to a breadcrumb item
  const navigateToBreadcrumb = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setCurrentPage(1);
  };

  const handleCreateItem = () => {
    if (!newName.trim()) return;
    
    const newItem: FileItem = {
      id: Date.now().toString(),
      name: newName,
      type: createType,
      size: createType === 'file' ? '0 KB' : undefined,
      modified: new Date().toISOString().split('T')[0],
      parentId: currentFolderId,
    };
    
    setFiles([...files, newItem]);
    setNewName('');
    setIsCreateDialogOpen(false);
  };

  const handleRename = () => {
    if (!newName.trim() || !selectedFile) return;
    
    setFiles(files.map(file => 
      file.id === selectedFile.id 
        ? { ...file, name: newName }
        : file
    ));
    setNewName('');
    setIsRenameDialogOpen(false);
    setSelectedFile(null);
  };

  const handleDelete = (fileId: string) => {
    setFiles(files.filter(file => file.id !== fileId));
  };

  const openCreateDialog = (type: 'file' | 'folder' | 'cad') => {
    setCreateType(type);
    setNewName('');
    setIsCreateDialogOpen(true);
  };

  const openRenameDialog = (file: FileItem) => {
    setSelectedFile(file);
    setNewName(file.name);
    setIsRenameDialogOpen(true);
  };

  const openShareDialog = (file: FileItem) => {
    setSelectedFile(file);
    setIsShareDialogOpen(true);
  };

  const handleDownload = (file: FileItem) => {
    // Create a mock download
    const content = `This is a mock file: ${file.name}\nType: ${file.type}\nSize: ${file.size || 'N/A'}\nModified: ${file.modified}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 在CAD编辑器中打开
  const handleOpenInEditor = (file: FileItem) => {
    // 模拟跳转到外部CAD编辑器
    alert(`正在打开 ${file.name} ...\n\n这将跳转到CAD编辑器进行编辑。\n在实际应用中，这里会：\n1. 打开新窗口/标签页到CAD编辑器\n2. 或者跳转到内置编辑器页面\n3. 传递文件ID和必要参数`);
    
    // 实际实现示例：
    // window.open(`/editor/${file.id}`, '_blank');
    // 或者使用路由跳转
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;
    
    setSelectedFiles(fileList);
  };

  const handleUploadConfirm = () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    // 检查是否有 STEP 文件
    const stepFiles = Array.from(selectedFiles).filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ext === 'step' || ext === 'stp';
    });

    // 如果有 STEP 文件，显示导入选项对话框（目前只处理第一个 STEP 文件）
    if (stepFiles.length > 0) {
      setPendingStepFile(stepFiles[0]);
      setStepFileName(stepFiles[0].name);
      setIsUploadDialogOpen(false);
      setIsStepImportDialogOpen(true);
      return;
    }

    // 处理非 STEP 文件
    const newFiles: FileItem[] = [];
    Array.from(selectedFiles).forEach(file => {
      const sizeInBytes = file.size;
      let sizeString: string;
      
      if (sizeInBytes < 1024) {
        sizeString = `${sizeInBytes} B`;
      } else if (sizeInBytes < 1024 * 1024) {
        sizeString = `${(sizeInBytes / 1024).toFixed(1)} KB`;
      } else if (sizeInBytes < 1024 * 1024 * 1024) {
        sizeString = `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
      } else {
        sizeString = `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
      }

      const newFile: FileItem = {
        id: Date.now().toString() + Math.random().toString(),
        name: file.name,
        type: 'file',
        size: sizeString,
        modified: new Date().toISOString().split('T')[0],
        parentId: currentFolderId,
      };
      
      newFiles.push(newFile);
    });

    setFiles([...files, ...newFiles]);
    setSelectedFiles(null);
    setIsUploadDialogOpen(false);
  };

  // 处理 STEP 文件导入
  const handleStepImport = (option: 'project' | 'part') => {
    if (!pendingStepFile) return;

    const sizeInBytes = pendingStepFile.size;
    let sizeString: string;
    
    if (sizeInBytes < 1024) {
      sizeString = `${sizeInBytes} B`;
    } else if (sizeInBytes < 1024 * 1024) {
      sizeString = `${(sizeInBytes / 1024).toFixed(1)} KB`;
    } else if (sizeInBytes < 1024 * 1024 * 1024) {
      sizeString = `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      sizeString = `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }

    if (option === 'project') {
      // 导入为 CAD 项目
      const projectName = pendingStepFile.name.replace(/\.(step|stp)$/i, '');
      const newProject: FileItem = {
        id: Date.now().toString() + Math.random().toString(),
        name: projectName,
        type: 'cad',
        modified: new Date().toISOString().split('T')[0],
        parentId: currentFolderId,
      };
      setFiles([...files, newProject]);
    } else {
      // 导入为零件（作为普通文件）
      const newFile: FileItem = {
        id: Date.now().toString() + Math.random().toString(),
        name: pendingStepFile.name,
        type: 'file',
        size: sizeString,
        modified: new Date().toISOString().split('T')[0],
        parentId: currentFolderId,
      };
      setFiles([...files, newFile]);
    }

    // 重置状态
    setPendingStepFile(null);
    setStepFileName('');
    setSelectedFiles(null);
    setIsStepImportDialogOpen(false);
  };

  const handleStepImportCancel = () => {
    setPendingStepFile(null);
    setStepFileName('');
    setIsStepImportDialogOpen(false);
    // 重新打开上传对话框
    setIsUploadDialogOpen(true);
  };

  // Reset search
  const handleResetSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Handle search button click
  const handleSearchClick = () => {
    // Trigger search (already handled by onChange, but this allows explicit search)
    setCurrentPage(1);
    if (searchQuery.trim() && selectedCategory !== 'all') {
      onCategoryChange?.('all');
    }
  };

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
    // When user starts searching, switch to "all" category
    if (value.trim() && selectedCategory !== 'all') {
      onCategoryChange?.('all');
    }
  };

  const handleFilterChange = (value: 'all' | 'file' | 'folder' | 'cad') => {
    setFilterType(value);
    setCurrentPage(1);
  };

  // Handle sort
  const handleSort = (field: 'name' | 'size' | 'type' | 'modified') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Render sort icon
  const renderSortIcon = (field: 'name' | 'size' | 'type' | 'modified') => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 text-gray-400" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-4 h-4 ml-1" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1" />
    );
  };

  // Get file type display name
  const getFileTypeDisplay = (item: FileItem) => {
    if (item.type === 'folder') return '文件夹';
    if (item.type === 'cad') return 'CAD项目';
    
    const ext = item.name.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') return 'Excel文件';
    if (ext === 'txt') return 'txt文件';
    if (ext === 'pdf') return 'PDF文件';
    if (ext === 'pptx' || ext === 'ppt') return 'PPT文件';
    if (ext === 'json') return 'JSON文件';
    if (ext === 'md') return 'Markdown文件';
    return '文件';
  };

  // Get file's parent folder path
  const getParentFolderPath = (item: FileItem): string => {
    if (!item.parentId) return '根目录';
    
    const path: string[] = [];
    let currentId: string | null = item.parentId;
    
    while (currentId) {
      const folder = files.find(f => f.id === currentId);
      if (folder) {
        path.unshift(folder.name);
        currentId = folder.parentId;
      } else {
        break;
      }
    }
    
    return path.length > 0 ? path.join(' / ') : '根目录';
  };

  // Render table row
  const renderTableRow = (item: FileItem): JSX.Element => {
    const isFolder = item.type === 'folder'; // Only folders can be opened, not CAD projects
    const isRecentView = selectedCategory === 'recent' && currentFolderId === null;

    return (
      <tr
        key={item.id}
        className={`border-b hover:bg-gray-50 ${isFolder ? 'cursor-pointer' : ''}`}
        onClick={() => {
          if (isFolder) {
            handleFolderClick(item.id);
          }
        }}
      >
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            {item.type === 'folder' ? (
              <Folder className="w-5 h-5 text-blue-500 flex-shrink-0" />
            ) : item.type === 'cad' ? (
              <Settings className="w-5 h-5 text-purple-500 flex-shrink-0" />
            ) : (
              <File className="w-5 h-5 text-gray-500 flex-shrink-0" />
            )}
            <span className="font-medium">{item.name}</span>
            {item.type === 'cad' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenInEditor(item);
                }}
                className="ml-2 h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                title="在编辑器中打开"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
          </div>
        </td>
        <td className="py-3 px-4 text-gray-600">{item.size || '-'}</td>
        <td className="py-3 px-4 text-gray-600">{getFileTypeDisplay(item)}</td>
        {isRecentView && (
          <td className="py-3 px-4 text-gray-600" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1">
              <Folder className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm">{getParentFolderPath(item)}</span>
            </div>
          </td>
        )}
        <td className="py-3 px-4 text-gray-600">{item.modified}</td>
        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
              >
                <Ellipsis className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {item.type === 'cad' && (
                <>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenInEditor(item); }}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    在编辑器中打开
                  </DropdownMenuItem>
                  <div className="border-b my-1" />
                </>
              )}
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openRenameDialog(item); }}>
                <Pencil className="w-4 h-4 mr-2" />
                重命名
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openShareDialog(item); }}>
                <Share className="w-4 h-4 mr-2" />
                分享
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); handleDownload(item); }}
              >
                <Download className="w-4 h-4 mr-2" />
                下载
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                className="text-red-600"
              >
                <Trash className="w-4 h-4 mr-2" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>
    );
  };

  // Render tree recursively
  const renderTreeItem = (item: FileItem, level: number = 0): JSX.Element => {
    const isFolder = item.type === 'folder' || item.type === 'cad';

    return (
      <div key={item.id}>
        <div
          className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-200 mb-2 cursor-pointer"
          onClick={() => isFolder ? handleFolderClick(item.id) : null}
        >
          <div className="flex items-center gap-2 flex-1">
            {item.type === 'folder' ? (
              <Folder className="w-5 h-5 text-blue-500" />
            ) : item.type === 'cad' ? (
              <Settings className="w-5 h-5 text-purple-500" />
            ) : (
              <File className="w-5 h-5 text-gray-500" />
            )}
            
            <div className="flex-1">
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-gray-500">
                {item.size && `${item.size} · `}修改于 {item.modified}
                {item.type === 'cad' && ' · CAD项目'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Ellipsis className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {item.type === 'cad' && (
                  <>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenInEditor(item); }}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      在编辑器中打开
                    </DropdownMenuItem>
                    <div className="border-b my-1" />
                  </>
                )}
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openRenameDialog(item); }}>
                  <Pencil className="w-4 h-4 mr-2" />
                  重命名
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openShareDialog(item); }}>
                  <Share className="w-4 h-4 mr-2" />
                  分享
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); handleDownload(item); }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  下载
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                  className="text-red-600"
                >
                  <Trash className="w-4 h-4 mr-2" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-6 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-semibold">我的文件</h2>
              <p className="text-sm text-gray-600">查看和管理您的CAD项目</p>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索文件..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
                className="pl-10 w-64"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSearchClick}
            >
              搜索
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetSearch}
              disabled={!searchQuery}
            >
              重置
            </Button>
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-auto p-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => navigateToBreadcrumb(null)}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
            >
              <Home className="w-4 h-4" />
              <span>
                {selectedCategory === 'all' && '全部'}
                {selectedCategory === 'cad' && '我的CAD'}
                {/* {selectedCategory === 'other' && '其他'} */}
                {selectedCategory === 'recent' && '最近'}
              </span>
            </button>
            {breadcrumbPath.map((folder, index) => (
              <div key={folder.id} className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <button
                  onClick={() => navigateToBreadcrumb(folder.id)}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {folder.name}
                </button>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {selectedCategory !== 'cad' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => openCreateDialog('folder')}
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                新建文件夹
              </Button>
            )}
            {selectedCategory !== 'cad' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsUploadDialogOpen(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                上传文件
              </Button>
            )}
            {selectedCategory !== 'other' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => openCreateDialog('cad')}
              >
                <Settings className="w-4 h-4 mr-2" />
                创建CAD项目
              </Button>
            )}
          </div>
        </div>

        {/* File Grid */}
        <div>
          {paginatedItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Folder className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>此文件夹为空</p>
            </div>
          ) : (
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4">
                      <button 
                        className="flex items-center font-medium text-gray-700 hover:text-gray-900"
                        onClick={() => handleSort('name')}
                      >
                        文件名
                        {renderSortIcon('name')}
                      </button>
                    </th>
                    <th className="text-left py-3 px-4">
                      <button 
                        className="flex items-center font-medium text-gray-700 hover:text-gray-900"
                        onClick={() => handleSort('size')}
                      >
                        大小
                        {renderSortIcon('size')}
                      </button>
                    </th>
                    <th className="text-left py-3 px-4">
                      <button 
                        className="flex items-center font-medium text-gray-700 hover:text-gray-900"
                        onClick={() => handleSort('type')}
                      >
                        类型
                        {renderSortIcon('type')}
                      </button>
                    </th>
                    {selectedCategory === 'recent' && currentFolderId === null && (
                      <th className="text-left py-3 px-4">
                        <span className="font-medium text-gray-700">所属文件夹</span>
                      </th>
                    )}
                    <th className="text-left py-3 px-4">
                      <button 
                        className="flex items-center font-medium text-gray-700 hover:text-gray-900"
                        onClick={() => handleSort('modified')}
                      >
                        修改时间
                        {renderSortIcon('modified')}
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map(item => renderTableRow(item))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8"
                >
                  {page}
                </Button>
              ))}
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
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {createType === 'folder' && '新建文件夹'}
              {createType === 'file' && '新建文件'}
              {createType === 'cad' && '创建CAD项目'}
            </DialogTitle>
            <DialogDescription>
              {createType === 'cad' 
                ? '创建一个新的CAD项目作为CAD界面的根目录'
                : `请输入${createType === 'folder' ? '文件夹' : '文件'}名称`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder={createType === 'cad' ? '项目名称' : '名称'}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateItem()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateItem}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名</DialogTitle>
            <DialogDescription>
              请输入新的名称
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="名称"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleRename}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      {selectedFile && (
        <ShareDialog
          isOpen={isShareDialogOpen}
          onClose={() => {
            setIsShareDialogOpen(false);
            setSelectedFile(null);
          }}
          fileName={selectedFile.name}
          fileType={selectedFile.type}
        />
      )}

      {/* STEP Import Dialog */}
      <StepImportDialog
        open={isStepImportDialogOpen}
        fileName={stepFileName}
        onImport={handleStepImport}
        onCancel={handleStepImportCancel}
      />

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>上传文件</DialogTitle>
            <DialogDescription>
              选择要上传的文件
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="file"
              multiple
              onChange={handleFileUpload}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUploadConfirm}>上传</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}