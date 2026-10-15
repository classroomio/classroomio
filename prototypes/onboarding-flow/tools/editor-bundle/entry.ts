import { mount, unmount } from 'svelte';
import Editor from '../../../../packages/ui/src/custom/editor/editor.svelte';
import ExerciseEditor from './exercise-editor.svelte';

type Options = {
  content?: string;
  placeholder?: string;
  editable?: boolean;
  onChange?: (html: string) => void;
  onReady?: (editor: unknown) => void;
};

let mounted: ReturnType<typeof mount> | null = null;

function render(target: HTMLElement, options: Options) {
  if (mounted) unmount(mounted);
  mounted = mount(Editor, {
    target,
    props: {
      content: options.content ?? '',
      editable: options.editable ?? true,
      placeholder: options.placeholder ?? '',
      editorClass: '',
      class: '',
      onContentChange: options.onChange,
      onEditorReady: options.onReady,
      onImageUpload: async (file: File) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.readAsDataURL(file);
        })
    }
  });
}

function renderExercise(target: HTMLElement, props: Record<string, unknown>) {
  return mount(ExerciseEditor, { target, props });
}

(window as unknown as { CioEditor: unknown; CioExercise: unknown }).CioEditor = { render };
(window as unknown as { CioExercise: unknown }).CioExercise = { render: renderExercise };
