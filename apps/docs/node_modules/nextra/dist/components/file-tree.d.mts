import * as react from 'react';
import { ReactElement, ReactNode } from 'react';

interface FolderProps {
    name: string;
    label?: ReactElement;
    open?: boolean;
    defaultOpen?: boolean;
    onToggle?: (open: boolean) => void;
    children: ReactNode;
}
interface FileProps {
    name: string;
    label?: ReactElement;
    active?: boolean;
}
declare function Tree({ children }: {
    children: ReactNode;
}): ReactElement;
declare const FileTree: typeof Tree & {
    Folder: react.NamedExoticComponent<FolderProps>;
    File: react.NamedExoticComponent<FileProps>;
};

export { FileTree };
