// Снимает текстуры граней коробки для сцены «стопка коробок» (src/components/scenes/BoxStack.astro).
//
//   node scripts/box-stack-textures.mjs            как сейчас: текстуры вдвое крупнее граней на картинке
//   node scripts/box-stack-textures.mjs 1          в размер картинки — когда появится исходник покрупнее
//   node scripts/box-stack-textures.mjs 2 test/    в другую папку, для проб
//
// Сцена берёт эти файлы для больших экранов, а для телефонов сборка сама делает из них уменьшенные.
//
// Коробка на картинке кейса нарисована в изометрии без перспективы, поэтому каждая её грань —
// четырёхугольник, который разворачивается обратно в прямоугольник без потерь формы.
// Точки ниже — углы граней на картинке шириной 2000 px, найдены по контуру коробки.
// Та же картинка в большем размере подойдёт без правок: точки и размеры текстур пересчитаются.
// Другая картинка — другие точки.

import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const SOURCE = fileURLToPath(
  new URL('../src/content/projects/dodo-dubai-package/dodo-dubai-package-4-half.avif', import.meta.url),
);
const OUT = process.argv[3] ?? fileURLToPath(new URL('../src/components/scenes/box-stack/', import.meta.url));
/**
 * Во сколько раз текстуры крупнее, чем грань на картинке. Картинка шириной 2000 px мала для стопки
 * во весь экран, поэтому увеличиваем вдвое: новых деталей это не добавит, но края выходят резче,
 * чем когда ту же работу делает браузер
 */
const ZOOM = Number(process.argv[2] ?? 2);

/**
 * 4:4:4, чтобы цветные точки растра и мелкий текст наклейки не мылились.
 * Качество 56: на увеличенной текстуре разницы с 68 не видно, а файл легче на 40%
 */
const AVIF = { quality: 56, effort: 6, chromaSubsampling: '4:4:4' };

/** Углы на картинке 2000×1125. t — верхнее ребро стенки, b — нижнее */
const P = {
  T: [1025.2, 134.9], // дальний угол крышки
  L: [286, 512.5], // левый угол крышки
  N: [1012.9, 883.3], // ближний угол крышки, если бы он не был срезан
  R: [1745.9, 505.5], // правый угол крышки, если бы он не был срезан
  Lb: [286, 685.5],
  At: [816.5, 783.0], // конец левой стенки, начало среза
  Ab: [816.5, 956.0],
  Ac: [816.5, 947.8], // низ среза: он на 8 px выше низа стенки
  B: [912, 831.7], // излом края крышки над срезом
  Ct: [1084.4, 846.4], // конец среза, начало передней стенки
  Cb: [1084.4, 1013.8],
  R2t: [1675, 542], // конец передней стенки
  R2b: [1675, 715],
};

/** Размеры текстур: чуть больше, чем грань занимает на картинке */
const SIZE = { lid: [813, 827], side: [596, 216], front: [664, 216], cut: [358, 216] };

const { data, info } = await sharp(SOURCE).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;

// Точки и размеры заданы для ширины 2000 px, пересчитываем под настоящую ширину картинки
const scale = W / 2000;
for (const point of Object.values(P)) point.forEach((v, i) => (point[i] = v * scale));
for (const size of Object.values(SIZE)) size.forEach((v, i) => (size[i] = Math.round(v * scale * ZOOM)));

const px = (x, y, c) => data[(Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))) * C + c];
/** Вес соседнего пикселя: бикубическая интерполяция Катмулла — Рома */
const weight = (t) => {
  const a = Math.abs(t);
  return a <= 1 ? 1.5 * a ** 3 - 2.5 * a ** 2 + 1 : a < 2 ? -0.5 * a ** 3 + 2.5 * a ** 2 - 4 * a + 2 : 0;
};
const sample = (x, y, out, o) => {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const sum = [0, 0, 0];
  for (let j = -1; j <= 2; j++) {
    for (let i = -1; i <= 2; i++) {
      const k = weight(y - (y0 + j)) * weight(x - (x0 + i));
      for (let c = 0; c < 3; c++) sum[c] += k * px(x0 + i, y0 + j, c);
    }
  }
  for (let c = 0; c < 3; c++) out[o + c] = Math.max(0, Math.min(255, Math.round(sum[c])));
};
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/**
 * Разворачивает четырёхугольник TL, TR, BR, BL в прямоугольник.
 * inset отступает от краёв грани внутрь, чтобы в текстуру не попал фон картинки.
 * fix может подменить точку, из которой берётся цвет.
 */
async function unwrap(name, [TL, TR, BR, BL], fix) {
  const [ow, oh] = SIZE[name];
  const inset = 1.2 * scale;
  const du = inset / ((distance(TL, TR) + distance(BL, BR)) / 2);
  const dv = inset / ((distance(TL, BL) + distance(TR, BR)) / 2);
  const out = Buffer.alloc(ow * oh * 3);
  for (let j = 0; j < oh; j++) {
    for (let i = 0; i < ow; i++) {
      const u = du + ((i + 0.5) / ow) * (1 - 2 * du);
      const v = dv + ((j + 0.5) / oh) * (1 - 2 * dv);
      let x = (1 - u) * (1 - v) * TL[0] + u * (1 - v) * TR[0] + u * v * BR[0] + (1 - u) * v * BL[0];
      let y = (1 - u) * (1 - v) * TL[1] + u * (1 - v) * TR[1] + u * v * BR[1] + (1 - u) * v * BL[1];
      if (fix) [x, y] = fix(x, y);
      sample(x - 0.5, y - 0.5, out, (j * ow + i) * 3);
    }
  }
  const file = `${OUT}${name}.avif`;
  const result = await sharp(out, { raw: { width: ow, height: oh, channels: 3 } }).avif(AVIF).toFile(file);
  console.log(`${name}.avif  ${ow}×${oh}  ${Math.round(result.size / 1024)} КБ`);
}

await unwrap('lid', [P.T, P.R, P.N, P.L]);
await unwrap('side', [P.L, P.At, P.Ab, P.Lb]);
await unwrap('front', [P.Ct, P.R2t, P.R2b, P.Cb]);

// Срез: край крышки A → B → C нависает над ним, на картинке там нарисована сама крышка.
// В сцене крышка лежит отдельной гранью, поэтому здесь эту часть заменяем отражением того, что под краем
const lidEdge = (x) =>
  x <= P.B[0]
    ? P.At[1] + ((x - P.At[0]) / (P.B[0] - P.At[0])) * (P.B[1] - P.At[1])
    : P.B[1] + ((x - P.B[0]) / (P.Ct[0] - P.B[0])) * (P.Ct[1] - P.B[1]);
await unwrap('cut', [P.At, P.Ct, P.Cb, P.Ac], (x, y) => {
  const edge = lidEdge(x) + 3.5 * scale;
  return y < edge ? [x, 2 * edge - y] : [x, y];
});
