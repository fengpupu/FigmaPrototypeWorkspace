import { useState } from 'react';
import { Folder, Home, ChevronRight, Search, X } from 'lucide-react';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

export interface FolderItem {
  id: string;
  name: string;
  type: 'folder' | 'cad';
  parentId: string | null;
  children?: FolderItem[];
}

interface CascadeFolderSelectorProps {
  folders: FolderItem[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function CascadeFolderSelector({ folders, selectedId, onSelect }: CascadeFolderSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [cascadePath, setCascadePath] = useState<FolderItem[]>([folders[0]]); // 从根目录开始
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // 扁平化所有文件夹（用于搜索）
  const flattenFolders = (items: FolderItem[]): FolderItem[] => {
    const result: FolderItem[] = [];
    const traverse = (items: FolderItem[]) => {
      items.forEach(item => {
        result.push(item);
        if (item.children) {
          traverse(item.children);
        }
      });
    };
    traverse(items);
    return result;
  };

  const allFolders = flattenFolders(folders);

  // 查找文件夹
  const findFolderById = (id: string): FolderItem | null => {
    return allFolders.find(f => f.id === id) || null;
  };

  // 获取文件夹的完整路径
  const getFullPath = (folderId: string): FolderItem[] => {
    const path: FolderItem[] = [];
    let current = findFolderById(folderId);
    
    while (current) {
      path.unshift(current);
      if (current.parentId) {
        current = findFolderById(current.parentId);
      } else {
        break;
      }
    }
    
    return path;
  };

  // 获取路径文本（用于搜索框显示）
  const getPathText = (folderId: string): string => {
    const path = getFullPath(folderId);
    return path.map(f => f.name).join(' > ');
  };

  // 当选中的文件夹变化时，更新搜索框显示
  const displayText = isSearchFocused ? searchQuery : getPathText(selectedId);

  // 搜索匹配的文件夹
  const searchResults = searchQuery
    ? allFolders.filter(folder => 
        folder.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // 处理级联选择
  const handleCascadeClick = (folder: FolderItem, level: number) => {
    // 更新级联路径，截断到当前级别
    const newPath = cascadePath.slice(0, level + 1);
    newPath[level] = folder;
    setCascadePath(newPath);
  };

  // 处理选择文件夹
  const handleSelectFolder = (folder: FolderItem, level: number) => {
    // 始终更新选中状态
    onSelect(folder.id);
    
    // 更新级联路径
    if (folder.children && folder.children.length > 0) {
      // 有子文件夹：更新路径并展开下一级
      const newPath = cascadePath.slice(0, level + 1);
      newPath[level] = folder;
      setCascadePath(newPath);
    } else {
      // 没有子文件夹：只更新到当前层级
      const newPath = cascadePath.slice(0, level + 1);
      newPath[level] = folder;
      setCascadePath(newPath);
    }
  };

  // 处理搜索结果点击
  const handleSearchResultClick = (folder: FolderItem) => {
    onSelect(folder.id);
    const path = getFullPath(folder.id);
    setCascadePath(path);
    setSearchQuery(''); // 清空搜索
    setIsSearchFocused(false); // 失去焦点
  };

  // 处理搜索框焦点
  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    setSearchQuery(''); // 清空内容以便输入
  };

  const handleSearchBlur = () => {
    // 延迟失去焦点，以便点击事件可以触发
    setTimeout(() => {
      setIsSearchFocused(false);
      setSearchQuery(''); // 清空搜索
    }, 200);
  };

  // 渲染文件夹项
  const renderFolderItem = (folder: FolderItem, isSelected: boolean, onClick: () => void) => {
    const hasChildren = folder.children && folder.children.length > 0;
    
    return (
      <div
        key={folder.id}
        className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors ${
          isSelected ? 'bg-blue-50' : ''
        }`}
        onClick={onClick}
      >
        {/* Radio Button */}
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
          isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
        }`}>
          {isSelected && (
            <div className="w-2 h-2 bg-white rounded-full"></div>
          )}
        </div>

        {/* Icon */}
        {folder.id === 'root' ? (
          <Home className="w-4 h-4 text-gray-400 shrink-0" />
        ) : folder.type === 'cad' ? (
          <Folder className="w-4 h-4 text-purple-500 shrink-0" />
        ) : (
          <Folder className="w-4 h-4 text-blue-500 shrink-0" />
        )}

        {/* Folder Name */}
        <span className="flex-1 text-sm">{folder.name}</span>

        {/* CAD Badge */}
        {folder.type === 'cad' && (
          <Badge variant="outline" className="text-xs shrink-0">CAD</Badge>
        )}

        {/* Arrow for children */}
        {hasChildren && (
          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="搜索文件夹..."
          value={displayText}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
          className="pl-9 pr-9"
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

      {/* Search Results */}
      {searchQuery && searchResults.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white max-h-[400px] overflow-y-auto">
          <div className="p-2 bg-gray-50 border-b border-gray-200">
            <p className="text-xs text-gray-600">找到 {searchResults.length} 个文件夹</p>
          </div>
          <div>
            {searchResults.map(folder => {
              const path = getFullPath(folder.id);
              const isSelected = selectedId === folder.id;
              
              return (
                <div key={folder.id}>
                  {renderFolderItem(folder, isSelected, () => handleSearchResultClick(folder))}
                  {/* Show path */}
                  <div className="px-3 pb-2 flex items-center gap-1 text-xs text-gray-500">
                    {path.map((p, idx) => (
                      <span key={p.id} className="flex items-center gap-1">
                        {idx > 0 && <ChevronRight className="w-3 h-3" />}
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search No Results */}
      {searchQuery && searchResults.length === 0 && (
        <div className="border border-gray-200 rounded-lg p-8 text-center bg-white">
          <p className="text-gray-500">未找到匹配的文件夹</p>
        </div>
      )}

      {/* Cascade Selector */}
      {!searchQuery && (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
          <div className="flex divide-x divide-gray-200 max-h-[400px]">
            {/* Render each level based on cascade path */}
            {cascadePath.map((pathFolder, level) => {
              // For level 0, show all root folders (including root itself if it's in the folders array)
              // For other levels, show the children of the previous level's selected folder
              const foldersToShow = level === 0 
                ? folders 
                : cascadePath[level - 1].children || [];

              if (foldersToShow.length === 0) return null;

              return (
                <div key={level} className="flex-1 min-w-[200px] overflow-y-auto">
                  {foldersToShow.map(folder => {
                    const isSelected = selectedId === folder.id;
                    const isInPath = cascadePath[level]?.id === folder.id;

                    return (
                      <div
                        key={folder.id}
                        className={isInPath && !isSelected ? 'bg-gray-50' : ''}
                      >
                        {renderFolderItem(
                          folder,
                          isSelected,
                          () => {
                            handleSelectFolder(folder, level);
                          }
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Show next level if the last item in path has children */}
            {cascadePath.length > 0 && 
             cascadePath[cascadePath.length - 1].children && 
             cascadePath[cascadePath.length - 1].children!.length > 0 && (
              <div className="flex-1 min-w-[200px] overflow-y-auto">
                {cascadePath[cascadePath.length - 1].children!.map(folder => {
                  const isSelected = selectedId === folder.id;

                  return (
                    <div key={folder.id}>
                      {renderFolderItem(
                        folder,
                        isSelected,
                        () => {
                          handleSelectFolder(folder, cascadePath.length);
                        }
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}