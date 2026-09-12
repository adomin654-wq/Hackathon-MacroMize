import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { Directory, File, Paths } from 'expo-file-system';
import { newId } from './activity';

const ownedDirectory = () => new Directory(Paths.document, 'MacroMize');
export async function pickPhoto(camera = false): Promise<string | null> {
  if (camera) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new Error('Camera access is off. Choose an existing photo or enable access in Settings.');
  }
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: false, quality: 0.85, exif: false };
  const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets[0]) return null;
  const directory = ownedDirectory();
  directory.create({ intermediates: true, idempotent: true });
  const source = new File(result.assets[0].uri);
  const extension = source.extension && /^\.[a-z0-9]{1,8}$/i.test(source.extension) ? source.extension : '.jpg';
  const destination = new File(directory, `${newId('photo')}${extension}`);
  source.copy(destination);
  return destination.uri;
}
export async function exportRecords(data: unknown) {
  if (!await Sharing.isAvailableAsync()) throw new Error('Sharing is unavailable on this device.');
  const directory = ownedDirectory();
  directory.create({ intermediates: true, idempotent: true });
  const file = new File(directory, 'macromize-data.json');
  file.create({ overwrite: true });
  file.write(JSON.stringify(data, null, 2));
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: 'Your MacroMize data' });
}
export async function sharePhoto(uri: string) {
  if (!await Sharing.isAvailableAsync()) throw new Error('Sharing is unavailable on this device.');
  await Sharing.shareAsync(uri, { dialogTitle: 'Your meal photo' });
}
/** Deletes only this app's copies. Original camera-roll images are untouched. */
export function deleteOwnedPhotos() { const directory = ownedDirectory(); if (directory.exists) directory.delete(); }
export function deletePhotoCopy(uri: string) { const directory = ownedDirectory(); if (!uri.startsWith(directory.uri.replace(/\/$/, '') + '/')) return; const file = new File(uri); if (file.exists) file.delete(); }
