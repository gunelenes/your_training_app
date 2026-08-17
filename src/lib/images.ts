import { Directory, File, Paths } from "expo-file-system";

/**
 * Görseller uygulamanın kalıcı belge klasöründe saklanır.
 *
 * ImagePicker'ın döndürdüğü URI geçici bir konumu gösterir ve iOS bu klasörü
 * yer darlığında temizleyebilir. Daha önemlisi, iOS her uygulama
 * güncellemesinde konteyner klasörüne yeni bir UUID verir; bu yüzden MUTLAK
 * yollar güncellemeden sonra hiçbir yeri göstermez. Bu nedenle dosyayı
 * belge klasörüne kopyalayıp yalnızca GÖRELİ adı ("images/1712...jpg")
 * saklıyoruz ve gösterim anında mutlak yola çeviriyoruz.
 */

const IMAGE_DIR = "images";

function imagesDir(): Directory {
  const dir = new Directory(Paths.document, IMAGE_DIR);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

function isAbsolute(value: string): boolean {
  return (
    value.startsWith("file://") ||
    value.startsWith("/") ||
    value.startsWith("content://") ||
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("ph://")
  );
}

/**
 * Seçilen görseli kalıcı klasöre kopyalar ve saklanacak göreli adı döndürür.
 * Kopyalama başarısız olursa kullanıcının seçimi kaybolmasın diye özgün URI
 * geri döner — o kayıt eski davranışa düşer ama en azından o oturumda çalışır.
 */
export async function persistImage(sourceUri: string): Promise<string> {
  try {
    const ext = Paths.extname(sourceUri) || ".jpg";
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const dest = new File(imagesDir(), name);
    new File(sourceUri).copy(dest);
    return `${IMAGE_DIR}/${name}`;
  } catch {
    return sourceUri;
  }
}

/** Saklanan değeri <Image> içinde kullanılabilecek mutlak URI'ye çevirir. */
export function resolveImage(stored?: string | null): string | undefined {
  if (!stored) return undefined;
  if (isAbsolute(stored)) return stored; // taşınmamış eski kayıt
  try {
    return new File(Paths.document, stored).uri;
  } catch {
    return undefined;
  }
}

/**
 * Eski mutlak yolla saklanmış bir kaydı kalıcı klasöre taşır.
 *
 * Dönüş: yeni göreli ad, dosya hâlâ duruyorsa; dosya kaybolmuşsa null
 * (ölü referansı temizlemek için); zaten göreliyse değer aynen döner.
 */
export async function rescueLegacyImage(
  stored?: string | null
): Promise<string | null | undefined> {
  if (!stored) return stored;
  if (!isAbsolute(stored)) return stored;
  try {
    const src = new File(stored);
    if (!src.exists) return null;
    return await persistImage(stored);
  } catch {
    return null;
  }
}

/** Artık kullanılmayan bir görseli diskten siler. Hata sessizce yutulur. */
export function deleteImage(stored?: string | null): void {
  if (!stored || isAbsolute(stored)) return;
  try {
    const file = new File(Paths.document, stored);
    if (file.exists) file.delete();
  } catch {
    // görsel silinemediyse yapacak bir şey yok
  }
}
