const fileStorage = new Map<string, File>();

export const FileStorage = {
  store: (file: File): string => {
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    fileStorage.set(fileId, file);
    return fileId;
  },
  
  get: (fileId: string): File | undefined => {
    return fileStorage.get(fileId);
  },
  
  remove: (fileId: string): void => {
    fileStorage.delete(fileId);
  }
};