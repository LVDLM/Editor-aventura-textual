import JSZip from 'jszip';
import { GameProject, SoundDefinition } from '../types';
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
 * Sonidos del proyecto que son archivos de audio (por URL o subidos) y se pueden empaquetar
 */
function isPackableSound(sound: SoundDefinition): boolean {
  if (sound.sourceType !== 'url' || !sound.url) return false;
  return /^https?:\/\//i.test(sound.url) || sound.url.startsWith('data:audio/');
}

/**
 * Checks if the project has audio files (added by URL or uploaded) that go into the sounds/ folder
 */
export function projectHasSounds(project: GameProject): boolean {
  return (project.customSounds || []).some(isPackableSound);
}

const AUDIO_MIME_EXTENSIONS: Record<string, string> = {
  'audio/mpeg': '.mp3',
  'audio/mp3': '.mp3',
  'audio/wav': '.wav',
  'audio/x-wav': '.wav',
  'audio/wave': '.wav',
  'audio/ogg': '.ogg',
  'application/ogg': '.ogg',
  'audio/webm': '.webm',
  'audio/mp4': '.m4a',
  'audio/x-m4a': '.m4a',
  'audio/aac': '.aac',
  'audio/flac': '.flac',
};

function getAudioExtension(src: string, mime?: string): string {
  if (src.startsWith('data:')) {
    const end = src.indexOf(';') > 0 ? src.indexOf(';') : src.indexOf(',');
    return AUDIO_MIME_EXTENSIONS[src.slice(5, end).toLowerCase()] || '.mp3';
  }
  // La extensión de la URL manda; si no la hay (p. ej. un script .php), se usa el tipo que declara el servidor
  const match = src.split(/[?#]/)[0].match(/\.(mp3|wav|ogg|oga|m4a|aac|flac|webm|opus)$/i);
  if (match) return `.${match[1].toLowerCase()}`;
  return AUDIO_MIME_EXTENSIONS[(mime || '').split(';')[0].trim().toLowerCase()] || '.mp3';
}

function safeSoundName(id: string): string {
  return (id || 'sonido').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'sonido';
}

/**
 * Copies every audio file of the project into the sounds/ folder of the ZIP and points the
 * project to the relative path. A sound that cannot be downloaded (e.g. the host blocks it)
 * keeps its original URL and is reported in the returned list.
 */
async function packSounds(zip: JSZip, project: GameProject): Promise<string[]> {
  const failed: string[] = [];
  const used = new Set<string>();
  const folder = zip.folder('sounds');

  for (const sound of project.customSounds || []) {
    if (!folder || !isPackableSound(sound)) continue;
    const src = sound.url as string;

    try {
      let data: Blob;
      let mime: string | undefined;
      if (src.startsWith('data:')) {
        data = await (await fetch(src)).blob();
        mime = data.type;
      } else {
        const response = await fetch(src);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        data = await response.blob();
        mime = response.headers.get('content-type') || data.type;
      }

      const ext = getAudioExtension(src, mime);
      const base = safeSoundName(sound.id);
      let fileName = `${base}${ext}`;
      for (let n = 2; used.has(fileName); n++) fileName = `${base}_${n}${ext}`;
      used.add(fileName);

      folder.file(fileName, data);
      sound.url = `sounds/${fileName}`;
    } catch (err) {
      console.warn(`No se pudo incluir el sonido "${sound.name || sound.id}" en el ZIP:`, err);
      failed.push(sound.name || sound.id);
    }
  }
  return failed;
}

/**
 * Exports project as a ZIP bundle containing index.html, an img/ folder with all images
 * and a sounds/ folder with the audio files added by URL.
 * `onSoundsNotPacked` receives the names of sounds that could not be downloaded.
 */
export async function exportProjectAsZip(
  project: GameProject,
  onSoundsNotPacked?: (names: string[]) => void
): Promise<Blob> {
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

  // Audio por URL -> carpeta sounds/
  const failedSounds = await packSounds(zip, updatedProject);
  if (failedSounds.length > 0 && onSoundsNotPacked) onSoundsNotPacked(failedSounds);

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
