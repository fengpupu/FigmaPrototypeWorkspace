import { FileText, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { useState } from 'react';

interface StepImportDialogProps {
  open: boolean;
  fileName: string;
  onImport: (option: 'project' | 'part') => void;
  onCancel: () => void;
}

export function StepImportDialog({ open, fileName, onImport, onCancel }: StepImportDialogProps) {
  const [selectedOption, setSelectedOption] = useState<'project' | 'part' | null>(null);

  const handleImport = () => {
    if (selectedOption) {
      onImport(selectedOption);
      setSelectedOption(null);
    }
  };

  const handleCancel = () => {
    setSelectedOption(null);
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>导入文件</DialogTitle>
        </DialogHeader>

        <div className="py-6">
          <div className="grid grid-cols-2 gap-4">
            {/* 导入为项目选项 */}
            <button
              onClick={() => setSelectedOption('project')}
              className={`flex flex-col items-center p-6 border-2 rounded-lg transition-all hover:border-blue-500 hover:bg-blue-50 ${
                selectedOption === 'project' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="w-24 h-24 mb-4 flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="relative">
                  <FileText className="w-12 h-12 text-gray-400" />
                  <div className="absolute -bottom-2 -right-2">
                    <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>
              <h3 className="font-semibold">导入一个项目</h3>
            </button>

            {/* 导入为零件选项 */}
            <button
              onClick={() => setSelectedOption('part')}
              className={`flex flex-col items-center p-6 border-2 rounded-lg transition-all hover:border-blue-500 hover:bg-blue-50 ${
                selectedOption === 'part' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="w-24 h-24 mb-4 flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="relative">
                  <FileText className="w-12 h-12 text-gray-400" />
                  <div className="absolute -bottom-2 -right-2">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
              </div>
              <h3 className="font-semibold">导入一个零件</h3>
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            取消
          </Button>
          <Button onClick={handleImport} disabled={!selectedOption}>
            导入
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
