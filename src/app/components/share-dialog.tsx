import { useState } from 'react';
import { Copy, Check, Link, Share, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileType: 'file' | 'folder' | 'cad';
  onShareCreated?: (share: ShareItem) => void;
  existingShare?: ShareItem;
}

export interface ShareItem {
  id: string;
  fileName: string;
  fileType: 'file' | 'folder' | 'cad';
  shareLink: string;
  expiresAt: string | null;
  createdAt: string;
  accessCount: number;
}

export function ShareDialog({ isOpen, onClose, fileName, fileType, onShareCreated, existingShare }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [expiryOption, setExpiryOption] = useState<string>(
    existingShare?.expiresAt ? 'custom' : 'never'
  );
  const [customExpiryDate, setCustomExpiryDate] = useState<string>(
    existingShare?.expiresAt || ''
  );
  
  // Generate a mock share link
  const shareLink = existingShare?.shareLink || `https://example.com/share/${btoa(fileName).slice(0, 16)}`;

  const handleCopy = async () => {
    try {
      // Try modern clipboard API first
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback to older method
      try {
        const textArea = document.createElement('textarea');
        textArea.value = shareLink;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Failed to copy:', fallbackErr);
        alert('复制失败，请手动复制链接');
      }
    }
  };

  const handleCreateOrUpdate = () => {
    let finalExpiryDate: string | null = null;
    
    if (expiryOption === 'custom' && customExpiryDate) {
      finalExpiryDate = customExpiryDate;
    } else if (expiryOption !== 'never') {
      // Calculate expiry date based on preset options
      const today = new Date();
      switch (expiryOption) {
        case '7days':
          today.setDate(today.getDate() + 7);
          break;
        case '30days':
          today.setDate(today.getDate() + 30);
          break;
        case '90days':
          today.setDate(today.getDate() + 90);
          break;
      }
      finalExpiryDate = today.toISOString().split('T')[0];
    }

    const shareData: ShareItem = existingShare ? {
      ...existingShare,
      expiresAt: finalExpiryDate,
    } : {
      id: Date.now().toString(),
      fileName,
      fileType,
      shareLink,
      expiresAt: finalExpiryDate,
      createdAt: new Date().toISOString().split('T')[0],
      accessCount: 0,
    };

    onShareCreated?.(shareData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share className="w-5 h-5" />
            分享 {fileType === 'folder' ? '文件夹' : fileType === 'cad' ? 'CAD项目' : '文件'}
          </DialogTitle>
          <DialogDescription>
            分享 "{fileName}" 给其他用户
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Expiry Date Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              过期时间
            </Label>
            <Select value={expiryOption} onValueChange={setExpiryOption}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">永不过期</SelectItem>
                <SelectItem value="7days">7天后过期</SelectItem>
                <SelectItem value="30days">30天后过期</SelectItem>
                <SelectItem value="90days">90天后过期</SelectItem>
                <SelectItem value="custom">自定义日期</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Custom Date Picker */}
            {expiryOption === 'custom' && (
              <div className="mt-2">
                <Input
                  type="date"
                  value={customExpiryDate}
                  onChange={(e) => setCustomExpiryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Share Link */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              分享链接
            </Label>
            <div className="flex items-center gap-2">
              <Input
                value={shareLink}
                readOnly
                className="flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    复制
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              拥有此链接的任何人都可以查看此{fileType === 'folder' ? '文件夹' : fileType === 'cad' ? 'CAD项目' : '文件'}（仅查看权限）
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleCreateOrUpdate}>完成</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}