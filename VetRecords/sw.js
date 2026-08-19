/* Service worker ของแอปบันทึกการรักษาสัตว์ป่วย (Pet Prime)
   ------------------------------------------------------------------
   หลักการ: "ลองเน็ตก่อน ไม่ได้ค่อยใช้ของที่เก็บไว้" (network-first)
   จงใจไม่ใช้ cache-first เพราะถ้าเครื่องติดอยู่กับแอปรุ่นเก่า
   เจ้าหน้าที่ในวอร์ดจะแก้เองไม่ได้ ยอมช้าอีกนิดแลกกับการได้รุ่นล่าสุดเสมอ
   ------------------------------------------------------------------ */
const CACHE = 'vetrec-app-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', e => {
  /* addAll ล้มทั้งชุดถ้ามีไฟล์ไหนโหลดไม่ได้ จึงเก็บทีละไฟล์แบบไม่ล้ม */
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  /* ของนอกบ้าน (ไลบรารีล็อกอินและ API ของ Google) ปล่อยผ่านไปตามปกติ ห้ามแคชเด็ดขาด */
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok && res.type === 'basic'){
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then(hit =>
          hit ||
          /* ขอหน้าเว็บตอนออฟไลน์ ให้ตกมาที่ตัวแอปที่เก็บไว้ */
          (req.mode === 'navigate' ? caches.match('./index.html') : undefined) ||
          Response.error()
        )
      )
  );
});
