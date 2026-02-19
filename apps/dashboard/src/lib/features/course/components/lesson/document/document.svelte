<script lang="ts">
  import { lessonApi } from '$features/course/api';
  import { CloseButton, DeleteModal } from '$features/ui';
  import { lessonDocUpload } from '$features/course/components/lesson/store';
  import MODES from '$lib/utils/constants/mode';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import ZoomInIcon from '@lucide/svelte/icons/zoom-in';
  import ZoomOutIcon from '@lucide/svelte/icons/zoom-out';
  import { onMount } from 'svelte';
  import DocumentList from './document-list.svelte';
  import { t } from '$lib/utils/functions/translations';
  import type { LessonDocument } from '$features/course/utils/types';
  import { snackbar } from '$features/ui/snackbar/store';

  interface Props {
    mode?: (typeof MODES)[keyof typeof MODES];
  }

  let { mode = MODES.view }: Props = $props();

  let downloadingDocuments = $state(new Set<string>());
  let openDeleteDocumentModal = $state(false);
  let documentIndexToDelete = $state<number | null>(null);
  let viewingPDF: any = $state(null);
  let pdfViewerOpen = $state(false);
  let pdfCanvas: HTMLCanvasElement | undefined = $state();
  let pdfDoc: any = null;
  let pageNum = $state(1);
  let pageCount = $state(0);
  let scale = $state(1.0);
  let isLoading = $state(false);
  let error: string | null = $state(null);
  let pdfjsLib: any = null;
  let renderTimeout: any = null;
  let currentRenderTask: any = null;

  onMount(() => {
    // Load PDF.js dynamically
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  });

  function openDocumentUploadModal() {
    $lessonDocUpload.isModalOpen = true;
  }

  function deleteDocument(index: number) {
    void lessonApi.deleteLessonDocument(index);
  }

  function requestRemoveDocument(index: number) {
    documentIndexToDelete = index;
    openDeleteDocumentModal = true;
  }

  function confirmRemoveDocument() {
    if (documentIndexToDelete !== null) {
      deleteDocument(documentIndexToDelete);
      documentIndexToDelete = null;
    }
    openDeleteDocumentModal = false;
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async function downloadDocument(doc: LessonDocument) {
    downloadingDocuments.add(doc.name);
    downloadingDocuments = downloadingDocuments;

    if (!doc.key) {
      snackbar.error('Document not loaded correctly');
      return;
    }

    try {
      const response = await fetch(doc.link);
      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      window.open(doc.link, '_blank');
    } finally {
      downloadingDocuments.delete(doc.name);
      downloadingDocuments = downloadingDocuments;
    }
  }

  function debouncedRender() {
    if (renderTimeout) {
      clearTimeout(renderTimeout);
    }
    renderTimeout = setTimeout(() => {
      renderPage();
      renderTimeout = null;
    }, 150); // 150ms debounce
  }
  // Wait for PDF.js to load
  const checkPDFJS = () => {
    return new Promise((resolve) => {
      const check = () => {
        if (pdfjsLib) {
          resolve(true);
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  };

  async function viewPDF(document: LessonDocument) {
    // Wait for PDF.js to be fully loaded
    if (!pdfjsLib) {
      // Show loading state while waiting for PDF.js
      viewingPDF = document;
      pdfViewerOpen = true;
      isLoading = true;
      error = 'Loading PDF viewer...';

      await checkPDFJS();
    }

    viewingPDF = document;
    pdfViewerOpen = true;
    isLoading = true;
    error = null;

    try {
      if (!document.key) {
        snackbar.error('Document not loaded correctly');
        return;
      }

      const response = await fetch(document.link);

      if (!response.ok) {
        throw new Error('Failed to fetch PDF');
      }

      const arrayBuffer = await response.arrayBuffer();
      pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      pageCount = pdfDoc.numPages;
      pageNum = 1;
      scale = 1.0;
      isLoading = false;

      // Wait for the canvas to be available in the DOM
      await new Promise((resolve) => setTimeout(resolve, 100));
      await renderPage();
    } catch (err) {
      console.error('Error loading PDF:', err);
      error = 'course.navItem.lessons.materials.tabs.document.failed_to_load_pdf';
      isLoading = false;
    }
  }

  async function renderPage() {
    if (!pdfDoc) return;

    // Wait for canvas to be available
    let attempts = 0;
    while (!pdfCanvas && attempts < 50) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    if (!pdfCanvas) {
      console.error('Canvas not available after waiting');
      return;
    }

    try {
      // Cancel any ongoing render task
      if (currentRenderTask) {
        currentRenderTask.cancel();
      }

      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      pdfCanvas.height = viewport.height;
      pdfCanvas.width = viewport.width;

      const ctx = pdfCanvas.getContext('2d');
      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };

      currentRenderTask = page.render(renderContext);
      await currentRenderTask.promise;
      currentRenderTask = null;
    } catch (err) {
      console.error('Error rendering page:', err);
      error = 'course.navItem.lessons.materials.tabs.document.failed_to_render_pdf';
      currentRenderTask = null;
    }
  }

  function nextPage() {
    if (pageNum < pageCount) {
      pageNum++;
      debouncedRender();
    }
  }

  function prevPage() {
    if (pageNum > 1) {
      pageNum--;
      debouncedRender();
    }
  }

  function zoomIn() {
    scale = Math.min(scale + 0.25, 3.0);
    debouncedRender();
  }

  function zoomOut() {
    scale = Math.max(scale - 0.25, 0.5);
    debouncedRender();
  }

  function handleViewPDF(doc: LessonDocument) {
    viewPDF(doc);
  }

  function closePDFViewer() {
    // Cancel any ongoing render task
    if (currentRenderTask) {
      currentRenderTask.cancel();
    }

    // Clear any pending render timeout
    if (renderTimeout) {
      clearTimeout(renderTimeout);
    }

    pdfViewerOpen = false;
    viewingPDF = null;
    pdfDoc = null;
    pageNum = 1;
    pageCount = 0;
    scale = 1.0;
    error = null;
    currentRenderTask = null;
    renderTimeout = null;
  }
  function handleKeydown(event: KeyboardEvent) {
    if (!pdfViewerOpen) return;

    switch (event.key) {
      case 'ArrowLeft':
        prevPage();
        break;
      case 'ArrowRight':
        nextPage();
        break;
      case '+':
      case '=':
        zoomIn();
        break;
      case '-':
        zoomOut();
        break;
      case 'Escape':
        closePDFViewer();
        break;
    }
  }

  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  });

  function handleContextMenu(event: MouseEvent) {
    event.preventDefault();
  }

  function handleDragStart(event: DragEvent) {
    event.preventDefault();
  }

  let displayDocuments = $derived(lessonApi.lesson?.documents || []);
</script>

<DocumentList
  {mode}
  {displayDocuments}
  {downloadingDocuments}
  {formatFileSize}
  {openDocumentUploadModal}
  {requestRemoveDocument}
  onViewPDF={handleViewPDF}
  {downloadDocument}
/>

<DeleteModal bind:open={openDeleteDocumentModal} onDelete={confirmRemoveDocument} />

<!-- PDF Viewer Modal -->
{#if pdfViewerOpen}
  <div class="fixed inset-0 z-50 flex flex-col bg-white dark:bg-neutral-800">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:bg-neutral-800">
      <div class="flex items-center space-x-4">
        <h2 class="max-w-md truncate text-lg font-semibold text-gray-900 dark:text-gray-300">
          {viewingPDF?.name}
        </h2>
        {#if !isLoading && !error}
          <span class="text-sm text-gray-500">
            {$t('course.navItem.lessons.materials.tabs.document.page_of', {
              page: pageNum,
              total: pageCount
            })}
          </span>
        {/if}
      </div>

      <div class="flex items-center space-x-2">
        <!-- Navigation Controls -->
        {#if !isLoading && !error}
          <div class="flex items-center space-x-1">
            <IconButton onclick={prevPage} disabled={pageNum <= 1} tooltip="Previous page (←)">
              <ChevronLeftIcon size={16} />
            </IconButton>

            <IconButton onclick={nextPage} disabled={pageNum >= pageCount} tooltip="Next page (→)">
              <ChevronRightIcon size={16} />
            </IconButton>
          </div>

          <!-- Zoom Controls -->
          <div class="flex items-center space-x-1">
            <IconButton onclick={zoomOut} disabled={scale <= 0.5} tooltip="Zoom out (-)">
              <ZoomOutIcon size={16} />
            </IconButton>

            <span class="min-w-12 text-center text-sm text-gray-600">
              {Math.round(scale * 100)}%
            </span>

            <IconButton onclick={zoomIn} disabled={scale >= 3.0} tooltip="Zoom in (+)">
              <ZoomInIcon size={16} />
            </IconButton>
          </div>
        {/if}

        <CloseButton onClick={closePDFViewer} tooltip="Close (Esc)" />
      </div>
    </div>

    <!-- PDF Content -->
    <div class="flex-1 overflow-auto bg-gray-100 p-4">
      {#if isLoading}
        <div class="flex h-full items-center justify-center">
          <div class="text-center">
            <div
              class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
            ></div>
            <p class="text-gray-600">
              {$t('course.navItem.lessons.materials.tabs.document.loading_pdf')}
            </p>
          </div>
        </div>
      {:else if error}
        <div class="flex h-full items-center justify-center">
          <div class="text-center">
            <div class="mb-4 text-red-500">
              <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <p class="mb-2 text-red-600">{$t(error)}</p>
            <button onclick={() => viewPDF(viewingPDF)} class="text-blue-600 underline hover:text-blue-800">
              {$t('course.navItem.lessons.materials.tabs.document.try_again')}
            </button>
          </div>
        </div>
      {:else}
        <div class="flex justify-center">
          <canvas
            bind:this={pdfCanvas}
            oncontextmenu={handleContextMenu}
            ondragstart={handleDragStart}
            class="shadow-lg"
          ></canvas>
        </div>
      {/if}
    </div>

    <!-- Footer with instructions -->
    {#if !isLoading && !error}
      <div class="border-t border-gray-200 bg-gray-50 px-4 py-2">
        <p class="text-center text-xs text-gray-500">
          {$t('course.navItem.lessons.materials.tabs.document.use_arrow_keys')}
        </p>
      </div>
    {/if}
  </div>
{/if}

<style>
  /* Disable text selection on the canvas */
  canvas {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }

  /* Disable drag and drop */
  canvas {
    pointer-events: auto;
  }
</style>
