/**
 * Hands a generated file to the browser download pipeline.
 *
 * Browsers never let a page pick a folder, so the file name computed by
 * `export-file-name` is the only thing we control; this keeps that name and
 * releases the object URL immediately after the click.
 */
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoking on the next tick keeps Safari from cancelling a download that has
  // not started yet.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
