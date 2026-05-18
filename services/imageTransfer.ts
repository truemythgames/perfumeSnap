let _base64: string | null = null;

export function setPickedImageBase64(base64: string) {
  _base64 = base64;
}

export function getPickedImageBase64(): string | null {
  return _base64;
}

export function clearPickedImageBase64() {
  _base64 = null;
}
