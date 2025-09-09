<script lang="ts">
  import {
    lesson,
    deleteLessonDocument
  } from '$lib/components/Course/components/Lesson/store/lessons';
  import { uploadCourseDocumentStore } from '$lib/components/Course/components/Lesson/store/lessons';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { t } from '$lib/utils/functions/translations';
  import MODES from '$lib/utils/constants/mode';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import TrashCanIcon from 'carbon-icons-svelte/lib/TrashCan.svelte';
  import DocumentIcon from 'carbon-icons-svelte/lib/Document.svelte';
  import PdfIcon from 'carbon-icons-svelte/lib/Pdf.svelte';
  import EyeIcon from 'carbon-icons-svelte/lib/View.svelte';
  import CloseIcon from 'carbon-icons-svelte/lib/Close.svelte';
  import ChevronLeftIcon from 'carbon-icons-svelte/lib/ChevronLeft.svelte';
  import ChevronRightIcon from 'carbon-icons-svelte/lib/ChevronRight.svelte';
  import ZoomInIcon from 'carbon-icons-svelte/lib/ZoomIn.svelte';
  import ZoomOutIcon from 'carbon-icons-svelte/lib/ZoomOut.svelte';
  import isEmpty from 'lodash/isEmpty';
  import { onMount, onDestroy } from 'svelte';

  export let mode = MODES.view;

  // Use real documents from store
  $: displayDocuments = $lesson?.materials?.documents || [];
  let downloadingDocuments = new Set();
  let viewingPDF: any = null;
  let pdfViewerOpen = false;
  let pdfCanvas: HTMLCanvasElement;
  let pdfDoc: any = null;
  let pageNum = 1;
  let pageCount = 0;
  let scale = 1.0;
  let isLoading = false;
  let error: string | null = null;
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
    $uploadCourseDocumentStore.isModalOpen = true;
  }

  function deleteDocument(index: number) {
    deleteLessonDocument(index);
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function getFileIcon(type: string) {
    switch (type) {
      case 'pdf':
        return PdfIcon;
      default:
        return DocumentIcon;
    }
  }

  async function downloadDocument(doc: any) {
    downloadingDocuments.add(doc.name);
    downloadingDocuments = downloadingDocuments;

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

  async function viewPDF(document: any) {
    // Wait for PDF.js to be fully loaded
    if (!pdfjsLib) {
      // Show loading state while waiting for PDF.js
      viewingPDF = document;
      pdfViewerOpen = true;
      isLoading = true;
      error = 'Loading PDF viewer...';

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

      await checkPDFJS();
    }

    viewingPDF = document;
    pdfViewerOpen = true;
    isLoading = true;
    error = null;

    try {
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
      error = 'Failed to load PDF document';
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
      error = 'Failed to render PDF page';
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
</script>

<div class="w-full">
  {#if mode === MODES.edit}
    <div class="mb-4">
      <PrimaryButton
        label={$t('course.navItem.lessons.materials.tabs.document.add_document')}
        onClick={openDocumentUploadModal}
        className="mb-4"
      />
    </div>

    {#if !isEmpty(displayDocuments)}
      <div class="space-y-4">
        {#each displayDocuments as document, index}
          <div class="rounded-lg border border-gray-200 p-4">
            <div class="flex items-start space-x-3">
              <svelte:component
                this={getFileIcon(document.type)}
                size={24}
                class="mt-1 text-blue-600"
              />
              <div class="flex-1">
                <h4 class="mb-2 font-medium text-gray-900">{document.name}</h4>
                <div class="mb-3 flex items-center space-x-4 text-sm text-gray-600">
                  <span
                    >{$t('course.navItem.lessons.materials.tabs.document.type')}: {document.type.toUpperCase()}</span
                  >
                  {#if document.size}
                    <span
                      >{$t('course.navItem.lessons.materials.tabs.document.size')}: {formatFileSize(
                        document.size
                      )}</span
                    >
                  {/if}
                </div>
                <div class="flex gap-3">
                  {#if document.type === 'pdf'}
                    <button
                      on:click={() => viewPDF(document)}
                      class="text-sm text-blue-600 underline hover:text-blue-800"
                    >
                      <EyeIcon size={16} class="mr-1 inline" />
                      View PDF
                    </button>
                  {:else}
                    <a
                      href={document.link}
                      target="_blank"
                      class="text-sm text-blue-600 underline hover:text-blue-800"
                    >
                      {$t('course.navItem.lessons.materials.tabs.document.view_document')}
                    </a>
                  {/if}
                  <button
                    on:click={() => downloadDocument(document)}
                    disabled={downloadingDocuments.has(document.name)}
                    class="cursor-pointer text-sm text-green-600 underline hover:text-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {downloadingDocuments.has(document.name)
                      ? $t('course.navItem.lessons.materials.tabs.document.downloading')
                      : $t('course.navItem.lessons.materials.tabs.document.download')}
                  </button>
                  <button
                    on:click={() => deleteDocument(index)}
                    class="text-sm text-red-600 underline hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  {:else if !isEmpty(displayDocuments)}
    <div class="space-y-4">
      {#each displayDocuments as document}
        <div class="rounded-lg border border-gray-200 p-4">
          <div class="flex items-start space-x-3">
            <svelte:component
              this={getFileIcon(document.type)}
              size={24}
              class="mt-1 text-blue-600"
            />
            <div class="flex-1">
              <h4 class="mb-2 font-medium text-gray-900">{document.name}</h4>
              <div class="mb-3 flex items-center space-x-4 text-sm text-gray-600">
                <span
                  >{$t('course.navItem.lessons.materials.tabs.document.type')}: {document.type.toUpperCase()}</span
                >
                {#if document.size}
                  <span
                    >{$t('course.navItem.lessons.materials.tabs.document.size')}: {formatFileSize(
                      document.size
                    )}</span
                  >
                {/if}
              </div>
              <div class="flex gap-3">
                {#if document.type === 'pdf'}
                  <button
                    on:click={() => viewPDF(document)}
                    class="text-sm text-blue-600 underline hover:text-blue-800"
                  >
                    <EyeIcon size={16} class="mr-1 inline" />
                    View PDF
                  </button>
                {:else}
                  <a
                    href={document.link}
                    target="_blank"
                    class="text-sm text-blue-600 underline hover:text-blue-800"
                  >
                    {$t('course.navItem.lessons.materials.tabs.document.view_document')}
                  </a>
                {/if}
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- PDF Viewer Modal -->
{#if pdfViewerOpen}
  <div class="fixed inset-0 z-50 flex flex-col bg-white">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
      <div class="flex items-center space-x-4">
        <h2 class="max-w-md truncate text-lg font-semibold text-gray-900">
          {viewingPDF?.name}
        </h2>
        {#if !isLoading && !error}
          <span class="text-sm text-gray-500">
            Page {pageNum} of {pageCount}
          </span>
        {/if}
      </div>

      <div class="flex items-center space-x-2">
        <!-- Navigation Controls -->
        {#if !isLoading && !error}
          <div class="flex items-center space-x-1">
            <IconButton
              onClick={prevPage}
              disabled={pageNum <= 1}
              toolTipProps={{ title: 'Previous page (←)', hotkeys: ['ArrowLeft'] }}
            >
              <ChevronLeftIcon size={20} class="carbon-icon" />
            </IconButton>

            <IconButton
              onClick={nextPage}
              disabled={pageNum >= pageCount}
              toolTipProps={{ title: 'Next page (→)', hotkeys: ['ArrowRight'] }}
            >
              <ChevronRightIcon size={20} class="carbon-icon" />
            </IconButton>
          </div>

          <!-- Zoom Controls -->
          <div class="flex items-center space-x-1">
            <IconButton
              onClick={zoomOut}
              disabled={scale <= 0.5}
              toolTipProps={{ title: 'Zoom out (-)', hotkeys: ['-'] }}
            >
              <ZoomOutIcon size={20} class="carbon-icon" />
            </IconButton>

            <span class="min-w-[3rem] text-center text-sm text-gray-600">
              {Math.round(scale * 100)}%
            </span>

            <IconButton
              onClick={zoomIn}
              disabled={scale >= 3.0}
              toolTipProps={{ title: 'Zoom in (+)', hotkeys: ['+'] }}
            >
              <ZoomInIcon size={20} class="carbon-icon" />
            </IconButton>
          </div>
        {/if}

        <!-- Close Button -->
        <IconButton
          onClick={closePDFViewer}
          toolTipProps={{ title: 'Close (Esc)', hotkeys: ['Esc'] }}
        >
          <CloseIcon size={20} class="carbon-icon" />
        </IconButton>
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
            <p class="text-gray-600">Loading PDF...</p>
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
            <p class="mb-2 text-red-600">{error}</p>
            <button
              on:click={() => viewPDF(viewingPDF)}
              class="text-blue-600 underline hover:text-blue-800"
            >
              Try Again
            </button>
          </div>
        </div>
      {:else}
        <div class="flex justify-center">
          <canvas
            bind:this={pdfCanvas}
            on:contextmenu={handleContextMenu}
            on:dragstart={handleDragStart}
            class="shadow-lg"
          ></canvas>
        </div>
      {/if}
    </div>

    <!-- Footer with instructions -->
    {#if !isLoading && !error}
      <div class="border-t border-gray-200 bg-gray-50 px-4 py-2">
        <p class="text-center text-xs text-gray-500">
          Use arrow keys to navigate, +/- to zoom, or click the controls above. Right-click is
          disabled.
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
