import JSZip from 'jszip';
import { GameProject } from '../types';
import { generateStandaloneHTML } from './htmlExporter';

export interface ExportResult {
  isZip: boolean;
  blob: Blob;
  filename: string;
}

/**
 * Checks if the project has any images attached (either in inventory items or scene blocks)
 */
export function projectHasImages(project: GameProject): boolean {
  for (const item of project.inventoryItems) {
    if (item.imageFileData || item.imageUrl) return true;
  }
  for (const scene of project.scenes) {
    for (const block of scene.textBlocks) {
      if (block.imageFileData || block.imageUrl) return true;
    }
  }
  return false;
}

/**
 * Exports project as a ZIP bundle containing index.html and an img/ folder with all images.
 */
export async function exportProjectAsZip(project: GameProject): Promise<Blob> {
  const zip = new JSZip();
  const imgFolder = zip.folder('img');

  // Copy project to avoid mutating state, and map image paths to img/ directory
  const updatedProject = JSON.parse(JSON.stringify(project)) as GameProject;
  let imgCount = 1;

  // Process inventory items
  for (const item of updatedProject.inventoryItems) {
    const src = item.imageFileData || item.imageUrl;
    if (src) {
      const ext = getExtensionFromDataUrlOrUrl(src);
      const fileName = item.imageFileName || `item_${item.id}_${imgCount++}${ext}`;
      item.imageFileName = fileName;

      if (imgFolder && src.startsWith('data:')) {
        const base64Data = src.split(',')[1];
        if (base64Data) {
          imgFolder.file(fileName, base64Data, { base64: true });
        }
      }
    }
  }

  // Process scene blocks
  for (const scene of updatedProject.scenes) {
    for (const block of scene.textBlocks) {
      const src = block.imageFileData || block.imageUrl;
      if (src) {
        const ext = getExtensionFromDataUrlOrUrl(src);
        const fileName = block.imageFileName || `block_${block.id}_${imgCount++}${ext}`;
        block.imageFileName = fileName;

        if (imgFolder && src.startsWith('data:')) {
          const base64Data = src.split(',')[1];
          if (base64Data) {
            imgFolder.file(fileName, base64Data, { base64: true });
          }
        }
      }
    }
  }

  // Generate standalone HTML with updated relative paths (isForZip = true)
  const htmlContent = generateStandaloneHTML(updatedProject, true);
  zip.file('index.html', htmlContent);

  return await zip.generateAsync({ type: 'blob' });
}

function getExtensionFromDataUrlOrUrl(src: string): string {
  if (src.startsWith('data:image/png')) return '.png';
  if (src.startsWith('data:image/jpeg') || src.startsWith('data:image/jpg')) return '.jpg';
  if (src.startsWith('data:image/gif')) return '.gif';
  if (src.startsWith('data:image/webp')) return '.webp';
  if (src.startsWith('data:image/svg')) return '.svg';
  
  const match = src.match(/\.(png|jpg|jpeg|gif|webp|svg)(\?.*)?$/i);
  if (match) return `.${match[1].toLowerCase()}`;
  return '.png';
}
