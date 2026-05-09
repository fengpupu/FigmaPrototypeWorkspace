import { FileManager } from "./file-manager";
import { FileCategory } from "../App";

interface FilesWithCategoriesProps {
  defaultCategory: FileCategory;
}

export function FilesWithCategories({ defaultCategory }: FilesWithCategoriesProps) {

  return (
    <div className="h-full">
      <FileManager selectedCategory={defaultCategory} />
    </div>
  );
}
