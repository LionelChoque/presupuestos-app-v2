import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ImportOptions } from '@/lib/types';
import { Upload } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: () => void;
  options: ImportOptions;
  setOptions: (options: ImportOptions) => void;
  uploadProgress: number;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
}

export function ImportModal({
  isOpen,
  onClose,
  onImport,
  options,
  setOptions,
  uploadProgress,
  selectedFile,
  setSelectedFile,
}: ImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar Archivo CSV</DialogTitle>
          <DialogDescription>
            Selecciona o arrastra un archivo CSV con el listado de presupuestos actualizado. El sistema procesará el archivo y actualizará la información.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <div
            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${
              isDragging ? 'border-primary-300 bg-primary-50' : 'border-gray-300'
            } border-dashed rounded-md`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                >
                  <span>Seleccionar archivo</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept=".csv"
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                  />
                </label>
                <p className="pl-1">o arrastra y suelta</p>
              </div>
              <p className="text-xs text-gray-500">CSV hasta 10MB</p>
              
              {selectedFile && (
                <p className="text-sm text-gray-600">
                  Archivo seleccionado: {selectedFile.name}
                </p>
              )}
              
              {uploadProgress > 0 && (
                <div className="w-full mt-3">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    Procesando: {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="compare"
                checked={options.compareWithPrevious}
                onCheckedChange={(checked) =>
                  setOptions({
                    ...options,
                    compareWithPrevious: checked as boolean,
                  })
                }
              />
              <Label htmlFor="compare" className="text-sm text-gray-600">
                Comparar con datos anteriores
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoFinalize"
                checked={options.autoFinalizeMissing}
                onCheckedChange={(checked) =>
                  setOptions({
                    ...options,
                    autoFinalizeMissing: checked as boolean,
                  })
                }
              />
              <Label htmlFor="autoFinalize" className="text-sm text-gray-600">
                Marcar faltantes como finalizados
              </Label>
            </div>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onImport}
            disabled={!selectedFile}
          >
            Importar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
