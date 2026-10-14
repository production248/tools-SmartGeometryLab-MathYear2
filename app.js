const ml = (ms, zh, en) => ({ ms, zh, en });
const requestedGrade = Number(new URLSearchParams(window.location.search).get("grade"));
const configuredGradeValue = Number(window.GEOMETRY_LAB_GRADE);
const configuredGrade = [2, 3, 4, 5, 6].includes(configuredGradeValue)
  ? configuredGradeValue
  : ([2, 3, 4, 5, 6].includes(requestedGrade) ? requestedGrade : null);

const I18N = {
  title: ml("Jom Teroka Geometri!", "一起来探索几何！", "Let’s Explore Geometry!"),
  subtitle: ml("Alat manipulatif berpandukan buku teks SK & SJKC Tahun 2–6.", "配合 SK 与 SJKC 二至六年级课本的操作工具。", "A hands-on tool aligned to SK & SJKC Year 2–6 textbooks."),
  soundOn: ml("Bunyi: Buka", "声音：开", "Sound: On"),
  soundOff: ml("Bunyi: Tutup", "声音：关", "Sound: Off"),
  tabShape: ml("Bentuk & Simetri", "图形与对称", "Shapes & Symmetry"),
  tabLine: ml("Sudut & Garisan", "角与直线", "Angles & Lines"),
  tabMeasure: ml("Ukur & Bina", "测量与构造", "Measure & Build"),
  chooseActivity: ml("Pilih alat", "选择工具", "Choose a tool"),
  grade: ml("Tahun", "年级", "Year"),
  activity: ml("Alat", "工具", "Tool"),
  tryIt: ml("Mari cuba!", "动手试试！", "Try it!"),
  teacherMode: ml("Tetapan guru", "老师设置", "Teacher settings"),
  resetTool: ml("Tetapkan semula alat", "重置工具", "Reset tool"),
  customSettings: ml("Tetapkan nilai demonstrasi", "设置示范数值", "Set demonstration values"),
  customHelp: ml("Tetapkan ukuran untuk demonstrasi kelas. Medan berubah mengikut alat.", "为课堂示范设置数值；项目会随工具改变。", "Set values for a class demonstration. Fields change with the tool."),
  cancel: ml("Batal", "取消", "Cancel"),
  useSettings: ml("Gunakan tetapan", "使用设置", "Use settings"),
  howTo: ml("Cara guna", "怎样使用", "How to use"),
  stepObserve: ml("Perhatikan bentuk", "仔细观察", "Observe"),
  stepTry: ml("Gerakkan & bina", "移动与构造", "Move & build"),
  stepCheck: ml("Ukur perubahan", "测量变化", "Measure changes"),
  newExample: ml("Contoh baharu", "随机新示例", "New random example"),
  clear: ml("Kosongkan", "清空", "Clear"),
  undo: ml("Undur", "撤销", "Undo"),
  closeShape: ml("Tutup bentuk", "闭合图形", "Close shape"),
  flat: ml("Rata", "展开", "Flat"),
  folded: ml("Dilipat", "折合", "Folded"),
  sides: ml("Sisi", "边", "Sides"),
  corners: ml("Bucu", "顶点", "Vertices"),
  faces: ml("Permukaan", "面", "Faces"),
  edges: ml("Tepi", "棱", "Edges"),
  vertices: ml("Bucu", "顶点", "Vertices"),
  angle: ml("Sudut", "角度", "Angle"),
  width: ml("Lebar", "宽", "Width"),
  height: ml("Tinggi", "高", "Height"),
  length: ml("Panjang", "长", "Length"),
  radius: ml("Jejari", "半径", "Radius"),
  diameter: ml("Diameter", "直径", "Diameter"),
  area: ml("Luas", "面积", "Area"),
  perimeter: ml("Perimeter", "周长", "Perimeter"),
  volume: ml("Isi padu", "体积", "Volume"),
  target: ml("Sasaran", "目标", "Target"),
  actual: ml("Dibina", "已构造", "Constructed")
};

const MODES = {
  shape: { label: I18N.tabShape },
  line: { label: I18N.tabLine },
  measure: { label: I18N.tabMeasure }
};

const ACTIVITIES = {
  shapeExplorer: {
    label: ml("Peneroka bentuk", "图形探索器", "Shape explorer"),
    scope: ml("Tahun 2 · Bentuk 2D dan 3D", "二年级 · 二维与三维图形", "Year 2 · 2D and 3D shapes"),
    tip: ml("Pilih bentuk, putar dan sentuh kad sifat untuk memerhatikannya.", "选择图形、旋转并点击特征卡观察。", "Choose a shape, rotate it and tap a property card.")
  },
  netBuilder: {
    label: ml("Pelipat bentangan", "立体图形展开图", "Net folder"),
    scope: ml("Tahun 2 · Bentangan bentuk 3D", "二年级 · 立体图形展开图", "Year 2 · Nets of 3D shapes"),
    tip: ml("Pilih bentuk 3D, lipat satu muka pada setiap langkah dan padankan nombornya.", "选择立体图形，每一步折起一个面，并对应各面的编号。", "Choose a solid, fold one face at each step and match its numbers.")
  },
  shapeDrawer: {
    label: ml("Papan lukis bentuk", "图形绘制板", "Shape drawing board"),
    scope: ml("Tahun 2 · Melukis bentuk 2D", "二年级 · 绘制二维图形", "Year 2 · Drawing 2D shapes"),
    tip: ml("Klik satu demi satu atau seret merentasi titik grid; selepas ditutup, sambungkan menjadi model 3D.", "可逐点点击，也可按住拖过格点；闭合后可连接成立体模型。", "Click points one by one or drag across the grid; after closing, connect it into a 3D model.")
  },
  prismLab: {
    label: ml("Makmal prisma", "棱柱实验室", "Prism lab"),
    scope: ml("Tahun 3 · Prisma dan poligon sekata", "三年级 · 棱柱与正多边形", "Year 3 · Prisms and regular polygons"),
    tip: ml("Ubah tapak dan kedalaman untuk melihat permukaan, tepi dan bucu.", "改变底面与深度，观察面、棱和顶点。", "Change the base and depth to observe faces, edges and vertices.")
  },
  symmetryLab: {
    label: ml("Cermin simetri", "对称镜", "Symmetry mirror"),
    scope: ml("Tahun 3 · Paksi simetri", "三年级 · 对称轴", "Year 3 · Axis of symmetry"),
    tip: ml("Lukis pada sebelah kiri. Sebelah kanan mencerminkan corak serta-merta.", "在左边绘图，右边会即时形成镜像。", "Draw on the left; the right mirrors your pattern instantly.")
  },
  patternLab: {
    label: ml("Pembina corak", "图形规律建构器", "Pattern builder"),
    scope: ml("Tahun 3 · Corak bentuk", "三年级 · 图形规律", "Year 3 · Shape patterns"),
    tip: ml("Bina satu unit corak, kemudian ubah bilangan ulangan.", "建立一个规律单位，再改变重复次数。", "Build one pattern unit, then change the repeats.")
  },
  angleLab: {
    label: ml("Makmal sudut & protraktor", "角与量角器实验室", "Angle & protractor lab"),
    scope: ml("Tahun 4 dan 6 · Ukur dan bina sudut", "四、六年级 · 测量与构造角", "Years 4 and 6 · Measure and construct angles"),
    tip: ml("Seret hujung jejari pada protraktor. Nilai sudut berubah serta-merta.", "拖动量角器上的射线端点，角度会即时改变。", "Drag the ray endpoint on the protractor; the angle updates instantly.")
  },
  lineLab: {
    label: ml("Makmal garisan", "直线关系实验室", "Line relationship lab"),
    scope: ml("Tahun 4 · Selari dan serenjang", "四年级 · 平行线与垂直线", "Year 4 · Parallel and perpendicular lines"),
    tip: ml("Putar dua garisan dan lihat hubungannya berubah.", "旋转两条直线，观察它们的关系变化。", "Rotate two lines and watch their relationship change.")
  },
  perimeterLab: {
    label: ml("Papan perimeter", "周长操作板", "Perimeter board"),
    scope: ml("Tahun 4 · Perimeter bentuk", "四年级 · 图形周长", "Year 4 · Perimeter of shapes"),
    tip: ml("Ubah panjang sisi. Laluan perimeter dan jumlah berubah bersama.", "改变边长，周长路径和总数会一起变化。", "Change side lengths; the perimeter path and total update together.")
  },
  areaLab: {
    label: ml("Papan luas berpetak", "方格面积板", "Grid area board"),
    scope: ml("Tahun 4 · Luas segi empat dan segi tiga", "四年级 · 四边形与三角形面积", "Year 4 · Area of rectangles and triangles"),
    tip: ml("Ubah tapak dan tinggi. Petak menunjukkan mengapa formula berfungsi.", "改变底和高；方格会显示公式为什么成立。", "Change base and height; the grid shows why the formula works.")
  },
  volumeLab: {
    label: ml("Pembina isi padu", "单位积木体积板", "Volume block builder"),
    scope: ml("Tahun 4 · Kubus dan kuboid", "四年级 · 正方体与长方体", "Year 4 · Cubes and cuboids"),
    tip: ml("Tambah panjang, lebar atau lapisan untuk membina isi padu.", "增加长、宽或层数来构建立体体积。", "Add length, width or layers to build volume.")
  },
  polygonLab: {
    label: ml("Makmal poligon sekata", "正多边形实验室", "Regular polygon lab"),
    scope: ml("Tahun 5 dan 6 · Sudut pedalaman poligon", "五、六年级 · 多边形内角", "Years 5 and 6 · Interior angles of polygons"),
    tip: ml("Ubah bilangan sisi dan perhatikan sudut serta segi tiga di dalamnya.", "改变边数，观察内角和内部三角形。", "Change the number of sides and observe angles and inner triangles.")
  },
  compositeArea: {
    label: ml("Bentuk gabungan", "复合图形板", "Composite shape board"),
    scope: ml("Tahun 5 · Perimeter dan luas bentuk gabungan", "五年级 · 复合图形周长与面积", "Year 5 · Perimeter and area of composite shapes"),
    tip: ml("Ubah segi empat besar dan bahagian yang dipotong.", "改变大长方形和被切除的部分。", "Change the large rectangle and the cut-out section.")
  },
  compositeVolume: {
    label: ml("Isi padu gabungan", "组合立体体积", "Composite volume"),
    scope: ml("Tahun 5 · Isi padu bentuk gabungan", "五年级 · 组合立体体积", "Year 5 · Volume of composite solids"),
    tip: ml("Pisahkan dua kuboid, ubah ukurannya dan gabungkan semula.", "分开两个长方体、改变尺寸，再重新组合。", "Separate two cuboids, change their dimensions and join them again.")
  },
  circleLab: {
    label: ml("Jangka lukis bulatan", "圆规画圆实验室", "Circle compass lab"),
    scope: ml("Tahun 6 · Bulatan, jejari dan diameter", "六年级 · 圆、半径与直径", "Year 6 · Circles, radius and diameter"),
    tip: ml("Ubah bukaan jangka dan putarkannya untuk melukis bulatan.", "改变圆规张开的大小并旋转画圆。", "Change the compass opening and rotate it to draw a circle.")
  }
};

const PLAN = {
  2: { shape: ["shapeExplorer", "netBuilder", "shapeDrawer"] },
  3: { shape: ["prismLab", "symmetryLab", "patternLab"] },
  4: { line: ["angleLab", "lineLab"], measure: ["perimeterLab", "areaLab", "volumeLab"] },
  5: { shape: ["polygonLab"], measure: ["compositeArea", "compositeVolume"] },
  6: { shape: ["polygonLab", "circleLab"], line: ["angleLab"] }
};

const GUIDES = {
  shapeExplorer: [
    ml("Pilih satu bentuk.", "选择一个图形。", "Choose a shape."),
    ml("Bentuk 2D menggunakan bar putaran; model 3D boleh diseret terus.", "二维图形用旋转条；三维模型可以直接拖动。", "Use the rotation bar for 2D shapes; drag 3D models directly."),
    ml("Klik kad ciri supaya nombor dan warna muncul terus pada rajah.", "点击特征卡，让号码和颜色直接标在图中。", "Click a feature card to place numbers and colours directly on the diagram.")
  ],
  netBuilder: [
    ml("Pilih kubus, kuboid, piramid atau silinder.", "选择正方体、长方体、棱锥或圆柱体。", "Choose a cube, cuboid, pyramid or cylinder."),
    ml("Tekan Langkah seterusnya untuk melipat satu muka.", "点击“下一步”，每次折起一个面。", "Press Next step to fold one face."),
    ml("Seret model 3D dan padankan setiap nombor.", "拖动对应的 3D 模型，核对各面的编号。", "Drag the matching 3D model and check every number.")
  ],
  shapeDrawer: [
    ml("Klik titik satu demi satu atau tahan dan seret merentasi titik.", "逐点点击，或按住并拖过多个格点。", "Click points one by one, or hold and drag across them."),
    ml("Tekan Tutup bentuk.", "点击“闭合图形”。", "Press Close shape."),
    ml("Tekan Sambung jadi 3D, pilih muka, rusuk atau bucu, kemudian seret model.", "点击“连接成立体”，选择面、棱或顶点，再拖动模型查看。", "Press Connect as 3D, choose faces, edges or vertices, then drag the model.")
  ],
  prismLab: [
    ml("Ubah bilangan sisi tapak.", "改变底面的边数。", "Change the base sides."),
    ml("Seret model 3D untuk melihat depan, belakang, atas dan bawah.", "直接拖动 3D 模型，查看前、后、上、下各面。", "Drag the 3D model to inspect its front, back, top and bottom."),
    ml("Ubah kedalaman dan lihat dua tapak kekal sama.", "改变棱柱深度，观察两个底面始终相同。", "Change the depth and observe that both bases stay identical.")
  ],
  symmetryLab: [
    ml("Pilih bentuk boleh seret atau mod petak.", "选择可拖动图形或方格模式。", "Choose draggable shapes or grid mode."),
    ml("Letak dan seret objek di sebelah kiri.", "在左边放置并拖动图形。", "Place and drag objects on the left."),
    ml("Perhatikan imej di kanan kekal sama jarak dari paksi.", "观察右边镜像始终与对称轴等距。", "Watch the mirror stay the same distance from the axis.")
  ],
  patternLab: [
    ml("Tambah bentuk pada unit corak.", "把图形加入规律单位。", "Add shapes to the pattern unit."),
    ml("Ubah bilangan ulangan.", "改变重复次数。", "Change the repeats."),
    ml("Perhatikan jumlah bentuk.", "观察图形总数。", "Observe the total shapes.")
  ],
  angleLab: [
    ml("Pegang titik kuning bertulis Seret.", "按住写着“拖我”的黄色圆点。", "Hold the yellow Drag me point."),
    ml("Seret perlahan dan baca sudut dalam rajah.", "慢慢拖动，读取图内角度。", "Drag slowly and read the angle in the diagram."),
    ml("Guna −1° atau +1° untuk melaras tepat.", "使用 −1° 或 +1° 精确微调。", "Use −1° or +1° for precise adjustment.")
  ],
  lineLab: [
    ml("Seret pemegang pada garisan A atau B.", "拖动直线 A 或 B 上的圆形控制点。", "Drag the handle on line A or B."),
    ml("Lihat sudut terkecil yang ditanda tepat di antara dua garisan.", "查看两条实际直线之间标出的较小夹角。", "Read the smaller angle marked between the actual lines."),
    ml("Cuba butang selari dan serenjang.", "尝试平行和垂直按钮。", "Try the parallel and perpendicular buttons.")
  ],
  perimeterLab: [
    ml("Pilih satu bentuk.", "选择一个图形。", "Choose a shape."),
    ml("Ubah panjang sisi berlabel.", "改变图中标示的边长。", "Change the labelled side lengths."),
    ml("Tambah semua sisi di sekeliling.", "把外围所有边长相加。", "Add every side around the shape.")
  ],
  areaLab: [
    ml("Pilih segi empat atau segi tiga.", "选择四边形或三角形。", "Choose a rectangle, square or triangle."),
    ml("Ubah tapak dan tinggi berlabel.", "改变图中标示的底和高。", "Change the labelled base and height."),
    ml("Padankan petak dengan formula.", "把方格与公式对应起来。", "Match the grid cells to the formula.")
  ],
  volumeLab: [
    ml("Kira blok dalam satu baris untuk panjang.", "数一排有几个积木，得到长。", "Count the blocks in one row for length."),
    ml("Kira blok dalam satu lajur dan bilangan lapisan.", "再数一列有几个，以及一共有几层。", "Count the blocks in one column and the number of layers."),
    ml("Darab: setiap baris × setiap lajur × lapisan.", "相乘：每排 × 每列 × 层数。", "Multiply: each row × each column × layers.")
  ],
  polygonLab: [
    ml("Ubah bilangan sisi.", "改变边数。", "Change the number of sides."),
    ml("Lihat nilai sudut pada bucu.", "查看顶点旁的角度。", "Read the angle values at the vertices."),
    ml("Bandingkan jumlah dan setiap sudut.", "比较内角和与每个内角。", "Compare the sum with each angle.")
  ],
  compositeArea: [
    ml("Ubah bentuk besar.", "改变大图形尺寸。", "Change the outer shape."),
    ml("Ubah potongan berlabel merah.", "改变红色标示的切除部分。", "Change the red-labelled cut-out."),
    ml("Tolak luas potongan.", "减去切除部分的面积。", "Subtract the cut-out area.")
  ],
  compositeVolume: [
    ml("Kenal pasti kuboid A dan B.", "先看清长方体 A 和 B。", "Identify cuboids A and B."),
    ml("Ubah ukuran yang ditulis pada bentuk.", "改变图中写出的尺寸。", "Change the dimensions written on the solids."),
    ml("Pisahkan dan jumlahkan dua isi padu.", "分开并把两个体积相加。", "Separate and add the two volumes.")
  ],
  circleLab: [
    ml("Jarum jangka kekal pada pusat O.", "圆规针尖固定在圆心 O。", "The compass needle stays at centre O."),
    ml("Seret mata pensel merah mengelilingi O.", "拖动红色铅笔尖绕着 O 画圆。", "Drag the red pencil tip around O."),
    ml("Ubah jejari r dan lihat diameter d = 2r.", "改变半径 r，观察直径 d = 2r。", "Change radius r and observe diameter d = 2r.")
  ]
};

const SHAPES = [
  { id: "triangle", icon: "🔺", name: ml("Segi tiga", "三角形", "Triangle"), kind: "2d", sides: 3, corners: 3 },
  { id: "square", icon: "🟨", name: ml("Segi empat sama", "正方形", "Square"), kind: "2d", sides: 4, corners: 4 },
  { id: "rectangle", icon: "▭", name: ml("Segi empat tepat", "长方形", "Rectangle"), kind: "2d", sides: 4, corners: 4 },
  { id: "circle", icon: "🟠", name: ml("Bulatan", "圆", "Circle"), kind: "2d", sides: 1, corners: 0, curved: true },
  { id: "cube", icon: "🧊", name: ml("Kubus", "正方体", "Cube"), kind: "3d", faces: 6, edges: 12, vertices: 8 },
  { id: "cuboid", icon: "📦", name: ml("Kuboid", "长方体", "Cuboid"), kind: "3d", faces: 6, edges: 12, vertices: 8 },
  { id: "pyramid", icon: "🔺", name: ml("Piramid", "棱锥", "Pyramid"), kind: "3d", faces: 5, edges: 8, vertices: 5 },
  { id: "cylinder", icon: "🥫", name: ml("Silinder", "圆柱体", "Cylinder"), kind: "3d", faces: 3, edges: 2, vertices: 0 },
  { id: "cone", icon: "🍦", name: ml("Kon", "圆锥体", "Cone"), kind: "3d", faces: 2, edges: 1, vertices: 1 },
  { id: "sphere", icon: "⚽", name: ml("Sfera", "球体", "Sphere"), kind: "3d", faces: 1, edges: 0, vertices: 0 }
];

const PATTERN_TOKENS = [
  { id: "circle", icon: "●", color: "#ffd778" },
  { id: "triangle", icon: "▲", color: "#73c7b5" },
  { id: "square", icon: "■", color: "#ab96e5" },
  { id: "star", icon: "★", color: "#ff9f8f" }
];

const SYMMETRY_STAMPS = [
  { id: "circle", icon: "●", label: ml("Bulatan", "圆形", "Circle") },
  { id: "triangle", icon: "▲", label: ml("Segi tiga", "三角形", "Triangle") },
  { id: "star", icon: "★", label: ml("Bintang", "星形", "Star") },
  { id: "heart", icon: "♥", label: ml("Hati", "心形", "Heart") }
];

const NETS = [
  [[1,0],[0,1],[1,1],[2,1],[3,1],[1,2]],
  [[0,0],[0,1],[1,1],[2,1],[2,2],[2,3]],
  [[1,0],[0,1],[1,1],[2,1],[1,2],[1,3]]
];

const NET_SOLIDS = [
  { id: "cube", base: 1, foldOrder: [3,2,4,5,6] },
  { id: "cuboid", base: 1, foldOrder: [3,2,4,5,6] },
  { id: "pyramid", base: 5, foldOrder: [1,2,3,4] },
  { id: "cylinder", base: 2, foldOrder: [1,3] }
];

const els = {
  sound: document.querySelector("#soundToggle"),
  grade: document.querySelector("#gradeSelect"),
  activity: document.querySelector("#activitySelect"),
  sideTitle: document.querySelector("#sideTitle"),
  scope: document.querySelector("#scopeNote"),
  tip: document.querySelector("#tipBox span:last-child"),
  title: document.querySelector("#activityTitle"),
  badge: document.querySelector("#gradeBadge"),
  challenge: document.querySelector("#challengePanel"),
  guide: document.querySelector("#toolGuide"),
  stage: document.querySelector("#visualStage"),
  controls: document.querySelector("#controlArea"),
  summary: document.querySelector("#liveSummary"),
  reset: document.querySelector("#resetToolButton"),
  teacher: document.querySelector("#teacherButton"),
  dialog: document.querySelector("#teacherDialog"),
  teacherFields: document.querySelector("#teacherFields"),
  teacherError: document.querySelector("#teacherError"),
  useTeacher: document.querySelector("#useTeacherSettings")
};
const gradeLabel = document.querySelector('label[for="gradeSelect"]');
const subtitle = document.querySelector('[data-i18n="subtitle"]');

const state = { lang: "ms", grade: configuredGrade || 2, mode: "shape", activity: "shapeExplorer", sound: true, tool: null };
let audioContext;

const loc = value => typeof value === "string" ? value : value[state.lang];
const tr = key => loc(I18N[key]);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const gradeName = n => state.lang === "ms" ? "Tahun " + n : state.lang === "zh" ? n + "年级" : "Year " + n;
const fixedGradeName = () => {
  if (state.lang === "zh") return `数学${["", "", "二", "三", "四", "五", "六"][state.grade]}年级`;
  if (state.lang === "en") return `Math Year ${state.grade}`;
  return `Matematik Tahun ${state.grade}`;
};
const fixedSubtitle = () => {
  if (state.lang === "zh") return `配合 SK 与 SJKC 数学${["", "", "二", "三", "四", "五", "六"][state.grade]}年级课本的操作工具。`;
  if (state.lang === "en") return `Hands-on Math Year ${state.grade} tools aligned to SK and SJKC textbooks.`;
  return `Alat manipulatif Matematik Tahun ${state.grade} berpandukan buku teks SK dan SJKC.`;
};

function beep(kind = "tap") {
  if (!state.sound) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  audioContext ||= new AudioContextClass();
  const notes = kind === "done" ? [523, 659, 784] : kind === "soft" ? [360] : [460, 570];
  notes.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const start = audioContext.currentTime + index * .065;
    oscillator.frequency.value = frequency;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(.055, start + .01);
    gain.gain.exponentialRampToValueAtTime(.0001, start + .09);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(start + .11);
  });
}

function applyStaticLanguage() {
  document.documentElement.lang = state.lang === "zh" ? "zh-Hans" : state.lang;
  document.querySelectorAll("[data-i18n]").forEach(node => {
    if (I18N[node.dataset.i18n]) node.textContent = tr(node.dataset.i18n);
  });
  els.sound.querySelector("span:last-child").textContent = tr(state.sound ? "soundOn" : "soundOff");
  document.querySelectorAll("[data-lang]").forEach(button => button.classList.toggle("active", button.dataset.lang === state.lang));
  Array.from(els.grade.options).forEach(option => option.textContent = gradeName(Number(option.value)));
  els.grade.value = String(state.grade);
  gradeLabel.hidden = Boolean(configuredGrade);
  els.grade.hidden = Boolean(configuredGrade);
  if (configuredGrade) {
    subtitle.textContent = fixedSubtitle();
    document.title = `${tr("title")} · ${fixedGradeName()}`;
  }
}

function setChallenge(title, subtitle) {
  els.challenge.innerHTML = "<div><div class=\"challenge-kicker\">" + tr("tryIt") + "</div><div class=\"challenge-text\">" + title + "</div><div class=\"challenge-sub\">" + subtitle + "</div></div>";
}

function setSummary(html, type = "neutral") {
  els.summary.className = "feedback " + type;
  els.summary.innerHTML = html;
}

function renderGuide() {
  const steps = GUIDES[state.activity] || [];
  els.guide.innerHTML = "<div class=\"tool-guide-title\">🖐 " + tr("howTo") + "</div><div class=\"tool-guide-steps\">" +
    steps.map((step, index) => "<div class=\"tool-guide-step\"><b>" + (index + 1) + "</b><span>" + loc(step) + "</span></div>").join("") +
    "</div>";
}

function rangeControl(id, label, min, max, step, value, unit = "") {
  return "<div class=\"range-control\"><label for=\"" + id + "\">" + label + "</label><output for=\"" + id + "\">" + value + unit + "</output><input id=\"" + id + "\" type=\"range\" min=\"" + min + "\" max=\"" + max + "\" step=\"" + step + "\" value=\"" + value + "\"></div>";
}

function randomButton(id = "randomExample") {
  return "<button type=\"button\" class=\"primary-button compact\" id=\"" + id + "\">🎲 " + tr("newExample") + "</button>";
}

function polygonPoints(cx, cy, radius, sides, rotation = -90) {
  return Array.from({ length: sides }, (_, index) => {
    const angle = (rotation + index * 360 / sides) * Math.PI / 180;
    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
  });
}

function pointsAttr(points) {
  return points.map(point => point.map(value => value.toFixed(1)).join(",")).join(" ");
}

function metric(label, value, active = false) {
  return "<div class=\"metric" + (active ? " active" : "") + "\"><span>" + label + "</span><strong>" + value + "</strong></div>";
}

function featureMetric(label, value, property, active) {
  return "<button type=\"button\" class=\"metric metric-button" + (active ? " active" : "") + "\" data-solid-property=\"" + property + "\" aria-pressed=\"" + active + "\"><span>" + label + "</span><strong>" + value + "</strong></button>";
}

const factories = {
  shapeExplorer: () => ({ shape: "cube", rotation: 0, property: 0, viewX: -18, viewY: 30, selectedFace: null }),
  netBuilder: () => ({ shape: "cube", net: 0, step: 0, viewX: -18, viewY: 30 }),
  shapeDrawer: () => ({ points: [], closed: false, corners: 4, solid: false, depth: 58, property: 0, viewX: -18, viewY: 30 }),
  prismLab: () => ({ sides: 3, depth: 64, property: 0, viewX: -18, viewY: 30 }),
  symmetryLab: () => ({ mode: "stamps", cells: ["1,1","2,2","3,1","4,3"], stamp: "star", randomCount: 4, stamps: [{ id: 1, type: "star", x: 105, y: 82 }, { id: 2, type: "circle", x: 176, y: 166 }, { id: 3, type: "triangle", x: 88, y: 238 }] }),
  patternLab: () => ({ seed: ["circle","triangle"], repeats: 3 }),
  angleLab: () => ({ angle: 0, target: state.grade === 6 ? 50 : null }),
  lineLab: () => ({ angleA: 0, angleB: 0 }),
  perimeterLab: () => ({ shape: "rectangle", width: 8, height: 5, a: 7, b: 6, c: 8 }),
  areaLab: () => ({ shape: "rectangle", width: 7, height: 4 }),
  volumeLab: () => ({ length: 4, width: 3, height: 2 }),
  polygonLab: () => ({ sides: state.grade === 6 ? 6 : 5, rotation: 0 }),
  compositeArea: () => ({ width: 9, height: 6, cutWidth: 3, cutHeight: 2 }),
  compositeVolume: () => ({ l1: 5, w1: 3, h1: 2, l2: 3, w2: 2, h2: 2, explode: 0 }),
  circleLab: () => ({ radius: 82, draw: 0, diameter: true })
};

function availableModes() {
  return Object.keys(MODES).filter(mode => (PLAN[state.grade][mode] || []).length);
}

function refreshNavigation(options = {}) {
  const modes = availableModes();
  if (!modes.includes(state.mode)) state.mode = modes[0];
  document.querySelectorAll("[data-mode]").forEach(button => {
    const available = modes.includes(button.dataset.mode);
    button.disabled = !available;
    button.classList.toggle("active", button.dataset.mode === state.mode);
  });
  els.sideTitle.textContent = loc(MODES[state.mode].label);
  const activities = PLAN[state.grade][state.mode] || [];
  const previous = options.keepActivity ? state.activity : null;
  els.activity.innerHTML = activities.map(id => "<option value=\"" + id + "\">" + loc(ACTIVITIES[id].label) + "</option>").join("");
  state.activity = previous && activities.includes(previous) ? previous : activities[0];
  els.activity.value = state.activity;
  if (!options.keepTool || !state.tool) state.tool = factories[state.activity]();
  updateMeta();
}

function updateMeta() {
  const meta = ACTIVITIES[state.activity];
  els.scope.textContent = loc(meta.scope);
  els.tip.textContent = loc(meta.tip);
  els.title.textContent = loc(meta.label);
  els.badge.textContent = configuredGrade
    ? fixedGradeName()
    : (state.lang === "zh" ? state.grade + "年级" : (state.lang === "ms" ? "T" : "Y") + state.grade);
}

function chooseActivity(id) {
  state.activity = id;
  state.tool = factories[id]();
  updateMeta();
  renderTool();
}

function randomizeCurrent() {
  const t = state.tool;
  switch (state.activity) {
    case "shapeExplorer": {
      const current = SHAPES.findIndex(shape => shape.id === t.shape);
      t.shape = SHAPES[(current + randomInt(1, SHAPES.length - 1)) % SHAPES.length].id;
      t.rotation = randomInt(-25, 25);
      t.viewX = randomInt(-35, 25);
      t.viewY = randomInt(-55, 55);
      t.selectedFace = null;
      break;
    }
    case "netBuilder": {
      const current = NET_SOLIDS.findIndex(item => item.id === t.shape);
      t.shape = NET_SOLIDS[(current + randomInt(1, NET_SOLIDS.length - 1)) % NET_SOLIDS.length].id;
      t.net = 0;
      t.step = 0;
      t.viewX = -18;
      t.viewY = 30;
      break;
    }
    case "shapeDrawer": {
      const n = randomInt(3, 6);
      t.corners = n;
      t.points = polygonPoints(200, 150, randomInt(70, 115), n, randomInt(-110, -70));
      t.closed = true;
      t.solid = false;
      t.viewX = -18;
      t.viewY = 30;
      break;
    }
    case "prismLab": t.sides = randomInt(3, 8); t.depth = randomInt(35, 90); t.viewX = randomInt(-35, 20); t.viewY = randomInt(-55, 55); break;
    case "symmetryLab": {
      if (t.mode === "grid") {
        t.cells = [];
        for (let row = 0; row < 8; row++) for (let col = 0; col < 5; col++) if (Math.random() < .32) t.cells.push(row + "," + col);
      } else {
        const stampTypes = ["star", "circle", "triangle", "heart"];
        t.stamps = Array.from({ length: t.randomCount || randomInt(3, 6) }, (_, index) => ({ id: Date.now() + index, type: stampTypes[randomInt(0, stampTypes.length - 1)], x: randomInt(55, 205), y: randomInt(48, 270) }));
      }
      break;
    }
    case "patternLab": {
      const count = randomInt(2, 4);
      t.seed = Array.from({ length: count }, () => PATTERN_TOKENS[randomInt(0, PATTERN_TOKENS.length - 1)].id);
      t.repeats = randomInt(2, 5);
      break;
    }
    case "angleLab": {
      if (state.grade === 6) { t.target = [50,90,108][randomInt(0,2)]; t.angle = randomInt(15, 160); }
      else t.angle = randomInt(10, 170);
      break;
    }
    case "lineLab": t.angleA = randomInt(0, 170); t.angleB = randomInt(0, 170); break;
    case "perimeterLab":
      t.width = randomInt(3, 11); t.height = randomInt(2, 8); t.a = randomInt(4, 10); t.b = randomInt(4, 10); t.c = randomInt(Math.max(4, Math.abs(t.a - t.b) + 1), Math.min(10, t.a + t.b - 1)); break;
    case "areaLab": t.width = randomInt(3, 11); t.height = randomInt(2, 8); break;
    case "volumeLab": t.length = randomInt(2, 6); t.width = randomInt(2, 5); t.height = randomInt(1, 4); break;
    case "polygonLab": t.sides = randomInt(3, 8); t.rotation = randomInt(-20, 20); break;
    case "compositeArea":
      t.width = randomInt(7, 12); t.height = randomInt(5, 9); t.cutWidth = randomInt(2, Math.max(2, t.width - 3)); t.cutHeight = randomInt(2, Math.max(2, t.height - 2)); break;
    case "compositeVolume":
      t.l1 = randomInt(3, 6); t.w1 = randomInt(2, 5); t.h1 = randomInt(1, 3); t.l2 = randomInt(2, t.l1); t.w2 = randomInt(2, t.w1); t.h2 = randomInt(1, 3); t.explode = randomInt(0, 1) * 80; break;
    case "circleLab": t.radius = randomInt(45, 110); t.draw = randomInt(90, 360); t.diameter = Math.random() > .35; break;
  }
  beep("done");
  renderTool();
}

function renderTool() {
  updateMeta();
  renderGuide();
  const renderers = {
    shapeExplorer: renderShapeExplorer,
    netBuilder: renderNetBuilder,
    shapeDrawer: renderShapeDrawer,
    prismLab: renderPrismLab,
    symmetryLab: renderSymmetryLab,
    patternLab: renderPatternLab,
    angleLab: renderAngleLab,
    lineLab: renderLineLab,
    perimeterLab: renderPerimeterLab,
    areaLab: renderAreaLab,
    volumeLab: renderVolumeLab,
    polygonLab: renderPolygonLab,
    compositeArea: renderCompositeArea,
    compositeVolume: renderCompositeVolume,
    circleLab: renderCircleLab
  };
  renderers[state.activity]();
}

function shapeSvg(shape, rotation, property = 0) {
  const common = "style=\"transform-origin:150px 115px;transform:rotate(" + rotation + "deg)\"";
  if (shape.kind === "2d") {
    if (shape.id === "circle") {
      const activeCurve = property === 0 || property === 2;
      const label = property === 1
        ? loc(ml("Tiada bucu", "没有顶点", "No corners"))
        : property === 2
          ? "1 " + loc(ml("garis melengkung", "条曲线", "curved line"))
          : "1 " + tr("sides");
      return "<svg class=\"shape-picture planar-feature-svg\" viewBox=\"0 0 300 230\"><g " + common + "><circle class=\"shape-fill\" cx=\"150\" cy=\"115\" r=\"95\"/><circle class=\"planar-curve" + (activeCurve ? " active" : "") + "\" cx=\"150\" cy=\"115\" r=\"95\"/><text class=\"diagram-label planar-feature-label\" x=\"150\" y=\"121\" text-anchor=\"middle\">" + label + "</text></g></svg>";
    }
    const vertices = shape.id === "triangle"
      ? [[150,25],[270,205],[30,205]]
      : shape.id === "square"
        ? [[55,20],[245,20],[245,210],[55,210]]
        : [[28,55],[272,55],[272,185],[28,185]];
    const centre = [150,115];
    const polygon = "<polygon class=\"shape-fill\" points=\"" + vertices.map(point => point.join(",")).join(" ") + "\"/>";
    const edges = property === 0 ? vertices.map((point, index) => {
      const next = vertices[(index + 1) % vertices.length];
      const middle = [(point[0] + next[0]) / 2, (point[1] + next[1]) / 2];
      const towardCentre = [middle[0] + (centre[0] - middle[0]) * .14, middle[1] + (centre[1] - middle[1]) * .14];
      return "<line class=\"planar-edge edge-color-" + (index % 4) + "\" x1=\"" + point[0] + "\" y1=\"" + point[1] + "\" x2=\"" + next[0] + "\" y2=\"" + next[1] + "\"/><text class=\"planar-edge-label\" x=\"" + towardCentre[0].toFixed(1) + "\" y=\"" + (towardCentre[1] + 5).toFixed(1) + "\" text-anchor=\"middle\">" + (index + 1) + "</text>";
    }).join("") : "";
    const corners = property === 1 ? vertices.map((point, index) => "<circle class=\"planar-vertex\" cx=\"" + point[0] + "\" cy=\"" + point[1] + "\" r=\"9\"/><text class=\"planar-vertex-label\" x=\"" + (point[0] + (point[0] < centre[0] ? 14 : -14)) + "\" y=\"" + (point[1] + (point[1] < centre[1] ? 20 : -10)) + "\" text-anchor=\"middle\">" + (index + 1) + "</text>").join("") : "";
    const noCurve = property === 2 ? "<text class=\"diagram-label planar-feature-label\" x=\"150\" y=\"121\" text-anchor=\"middle\">" + loc(ml("Tiada garis melengkung", "没有曲线", "No curved line")) + "</text>" : "";
    return "<svg class=\"shape-picture planar-feature-svg\" viewBox=\"0 0 300 230\"><g " + common + ">" + polygon + edges + corners + noCurve + "</g></svg>";
  }
  if (shape.id === "triangle") return "<svg class=\"shape-picture\" viewBox=\"0 0 300 230\"><g " + common + "><polygon class=\"shape-fill\" points=\"150,25 270,205 30,205\"/><text class=\"diagram-label\" x=\"150\" y=\"53\" text-anchor=\"middle\">1</text><text class=\"diagram-label\" x=\"244\" y=\"193\" text-anchor=\"middle\">2</text><text class=\"diagram-label\" x=\"56\" y=\"193\" text-anchor=\"middle\">3</text></g></svg>";
  if (shape.id === "square") return "<svg class=\"shape-picture\" viewBox=\"0 0 300 230\"><g " + common + "><rect class=\"shape-fill\" x=\"55\" y=\"20\" width=\"190\" height=\"190\" rx=\"3\"/><text class=\"diagram-label\" x=\"72\" y=\"45\">1</text><text class=\"diagram-label\" x=\"222\" y=\"45\">2</text><text class=\"diagram-label\" x=\"222\" y=\"198\">3</text><text class=\"diagram-label\" x=\"72\" y=\"198\">4</text></g></svg>";
  if (shape.id === "rectangle") return "<svg class=\"shape-picture\" viewBox=\"0 0 300 230\"><g " + common + "><rect class=\"shape-fill\" x=\"28\" y=\"55\" width=\"244\" height=\"130\" rx=\"3\"/><text class=\"diagram-label\" x=\"45\" y=\"80\">1</text><text class=\"diagram-label\" x=\"246\" y=\"80\">2</text><text class=\"diagram-label\" x=\"246\" y=\"174\">3</text><text class=\"diagram-label\" x=\"45\" y=\"174\">4</text></g></svg>";
  if (shape.id === "circle") return "<svg class=\"shape-picture\" viewBox=\"0 0 300 230\"><circle class=\"shape-fill\" cx=\"150\" cy=\"115\" r=\"95\"/><circle cx=\"150\" cy=\"115\" r=\"5\" fill=\"#3f2b14\"/><text class=\"diagram-label\" x=\"164\" y=\"132\">O</text><text class=\"diagram-label accent\" x=\"150\" y=\"78\" text-anchor=\"middle\">1 " + loc(ml("garis melengkung", "条曲线", "curved line")) + "</text></svg>";
  if (shape.id === "cube" || shape.id === "cuboid") {
    const x2 = shape.id === "cube" ? 215 : 250;
    return "<svg class=\"shape-picture\" viewBox=\"0 0 300 230\" " + common + "><polygon class=\"shape-fill\" points=\"70,65 " + (x2-45) + ",65 " + x2 + ",30 115,30\"/><polygon class=\"shape-fill alt\" points=\"70,65 " + (x2-45) + ",65 " + (x2-45) + ",190 70,190\"/><polygon class=\"shape-fill purple\" points=\"" + (x2-45) + ",65 " + x2 + ",30 " + x2 + ",155 " + (x2-45) + ",190\"/><text class=\"diagram-label\" x=\"145\" y=\"53\" text-anchor=\"middle\">" + loc(ml("muka 1", "面 1", "face 1")) + "</text><text class=\"diagram-label\" x=\"112\" y=\"132\" text-anchor=\"middle\">" + loc(ml("muka 2", "面 2", "face 2")) + "</text><text class=\"diagram-label\" x=\"" + (x2-19) + "\" y=\"115\" text-anchor=\"middle\">" + loc(ml("muka 3", "面 3", "face 3")) + "</text></svg>";
  }
  if (shape.id === "pyramid") return "<svg class=\"shape-picture\" viewBox=\"0 0 300 230\" " + common + "><polygon class=\"shape-fill alt\" points=\"150,18 42,178 150,215\"/><polygon class=\"shape-fill\" points=\"150,18 258,178 150,215\"/><polygon class=\"shape-fill purple\" points=\"42,178 150,140 258,178 150,215\"/><text class=\"diagram-label\" x=\"98\" y=\"125\" text-anchor=\"middle\">" + loc(ml("muka 1", "面 1", "face 1")) + "</text><text class=\"diagram-label\" x=\"204\" y=\"125\" text-anchor=\"middle\">" + loc(ml("muka 2", "面 2", "face 2")) + "</text><text class=\"diagram-label\" x=\"150\" y=\"185\" text-anchor=\"middle\">" + loc(ml("tapak 3", "底面 3", "base 3")) + "</text><text class=\"diagram-label accent\" x=\"160\" y=\"35\">" + loc(ml("puncak", "顶点", "apex")) + "</text></svg>";
  if (shape.id === "cylinder") return "<svg class=\"shape-picture\" viewBox=\"0 0 300 230\" " + common + "><rect class=\"shape-fill alt\" x=\"70\" y=\"45\" width=\"160\" height=\"140\"/><ellipse class=\"shape-fill\" cx=\"150\" cy=\"45\" rx=\"80\" ry=\"28\"/><ellipse class=\"shape-fill purple\" cx=\"150\" cy=\"185\" rx=\"80\" ry=\"28\"/><text class=\"diagram-label\" x=\"150\" y=\"50\" text-anchor=\"middle\">1</text><text class=\"diagram-label\" x=\"150\" y=\"123\" text-anchor=\"middle\">2</text><text class=\"diagram-label\" x=\"150\" y=\"192\" text-anchor=\"middle\">3</text></svg>";
  if (shape.id === "cone") return "<svg class=\"shape-picture\" viewBox=\"0 0 300 230\" " + common + "><path class=\"shape-fill alt\" d=\"M150 20 L55 185 Q150 230 245 185 Z\"/><ellipse class=\"shape-fill\" cx=\"150\" cy=\"185\" rx=\"95\" ry=\"30\"/><text class=\"diagram-label\" x=\"150\" y=\"48\" text-anchor=\"middle\">1</text><text class=\"diagram-label\" x=\"150\" y=\"192\" text-anchor=\"middle\">2</text></svg>";
  return "<svg class=\"shape-picture\" viewBox=\"0 0 300 230\"><defs><radialGradient id=\"sphereGradient\" cx=\"35%\" cy=\"28%\"><stop offset=\"0\" stop-color=\"#fff3bd\"/><stop offset=\".55\" stop-color=\"#ffd778\"/><stop offset=\"1\" stop-color=\"#e29b22\"/></radialGradient></defs><circle cx=\"150\" cy=\"115\" r=\"98\" fill=\"url(#sphereGradient)\" stroke=\"#6d4a1e\" stroke-width=\"4\"/><text class=\"diagram-label\" x=\"150\" y=\"121\" text-anchor=\"middle\">1 " + loc(ml("permukaan melengkung", "个曲面", "curved surface")) + "</text></svg>";
}

function boxSolid(x = 1, y = 1, z = 1) {
  return {
    vertices: [[-x,-y,-z],[x,-y,-z],[x,y,-z],[-x,y,-z],[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]],
    faces: [
      { id: 1, vertices: [3,2,6,7] },
      { id: 2, vertices: [0,3,7,4] },
      { id: 3, vertices: [4,5,6,7] },
      { id: 4, vertices: [1,5,6,2] },
      { id: 5, vertices: [0,1,2,3] },
      { id: 6, vertices: [0,4,5,1] }
    ],
    edges: [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]],
    vertexIndices: [0,1,2,3,4,5,6,7]
  };
}

function roundSolid(kind) {
  const count = 24;
  const vertices = [];
  for (let i = 0; i < count; i++) {
    const angle = i * Math.PI * 2 / count;
    vertices.push([Math.cos(angle), 1, Math.sin(angle)]);
  }
  for (let i = 0; i < count; i++) {
    const angle = i * Math.PI * 2 / count;
    vertices.push([Math.cos(angle), -1, Math.sin(angle)]);
  }
  if (kind === "cylinder") {
    const faces = [
      { id: 1, vertices: Array.from({ length: count }, (_, i) => i) },
      ...Array.from({ length: count }, (_, i) => ({ id: 2, curved: true, vertices: [i, (i + 1) % count, count + (i + 1) % count, count + i] })),
      { id: 3, vertices: Array.from({ length: count }, (_, i) => count + count - 1 - i) }
    ];
    const edges = [];
    for (let i = 0; i < count; i++) edges.push([i, (i + 1) % count], [count + i, count + (i + 1) % count]);
    return { vertices, faces, edges, vertexIndices: [] };
  }
  const apex = vertices.length;
  vertices.push([0, 1.35, 0]);
  const faces = [
    ...Array.from({ length: count }, (_, i) => ({ id: 1, curved: true, vertices: [count + i, count + (i + 1) % count, apex] })),
    { id: 2, vertices: Array.from({ length: count }, (_, i) => count + count - 1 - i) }
  ];
  const edges = Array.from({ length: count }, (_, i) => [count + i, count + (i + 1) % count]);
  return { vertices, faces, edges, vertexIndices: [apex] };
}

function solidModel(id) {
  if (id === "cube") return boxSolid();
  if (id === "cuboid") return boxSolid(1.35, .82, .78);
  if (id === "pyramid") return {
    vertices: [[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1],[0,1.35,0]],
    faces: [
      { id: 1, vertices: [0,1,4] }, { id: 2, vertices: [1,2,4] },
      { id: 3, vertices: [2,3,4] }, { id: 4, vertices: [3,0,4] },
      { id: 5, vertices: [3,2,1,0] }
    ],
    edges: [[0,1],[1,2],[2,3],[3,0],[0,4],[1,4],[2,4],[3,4]],
    vertexIndices: [0,1,2,3,4]
  };
  if (id === "cylinder" || id === "cone") return roundSolid(id);
  return null;
}

function rotateSolidPoint(point, viewX, viewY) {
  const rx = viewX * Math.PI / 180;
  const ry = viewY * Math.PI / 180;
  const cosX = Math.cos(rx), sinX = Math.sin(rx), cosY = Math.cos(ry), sinY = Math.sin(ry);
  const y1 = point[1] * cosX - point[2] * sinX;
  const z1 = point[1] * sinX + point[2] * cosX;
  return [point[0] * cosY + z1 * sinY, y1, -point[0] * sinY + z1 * cosY];
}

function projectSolidPoint(point, zoom = 1) {
  const scale = 330 * zoom / (4.4 - point[2]);
  return [210 + point[0] * scale, 150 - point[1] * scale];
}

function sphereSvgContent(t, property) {
  const zoom = clamp(Number(t.zoom) || 1, .7, 1.35);
  const sphereRadius = 103 * zoom;
  const paths = [];
  const makeLine = points => points.map((point, index) => {
    const projected = projectSolidPoint(rotateSolidPoint(point, t.viewX, t.viewY), zoom);
    return (index ? "L" : "M") + projected[0].toFixed(1) + " " + projected[1].toFixed(1);
  }).join(" ");
  for (let latitude = -60; latitude <= 60; latitude += 30) {
    const lat = latitude * Math.PI / 180;
    paths.push(makeLine(Array.from({ length: 49 }, (_, i) => {
      const angle = i * Math.PI * 2 / 48;
      return [Math.cos(lat) * Math.cos(angle), Math.sin(lat), Math.cos(lat) * Math.sin(angle)];
    })));
  }
  for (let longitude = 0; longitude < 180; longitude += 30) {
    const lon = longitude * Math.PI / 180;
    paths.push(makeLine(Array.from({ length: 49 }, (_, i) => {
      const angle = -Math.PI / 2 + i * Math.PI * 2 / 48;
      return [Math.cos(angle) * Math.cos(lon), Math.sin(angle), Math.cos(angle) * Math.sin(lon)];
    })));
  }
  return "<defs><radialGradient id=\"solidSphere\" cx=\"34%\" cy=\"28%\"><stop offset=\"0\" stop-color=\"#fff4bc\"/><stop offset=\".58\" stop-color=\"#ffd778\"/><stop offset=\"1\" stop-color=\"#df9626\"/></radialGradient><clipPath id=\"sphereClip\"><circle cx=\"210\" cy=\"150\" r=\"" + (sphereRadius - 2).toFixed(1) + "\"/></clipPath></defs>" +
    "<circle class=\"solid-sphere" + (property === 0 ? " feature-active" : "") + "\" cx=\"210\" cy=\"150\" r=\"" + sphereRadius.toFixed(1) + "\" fill=\"url(#solidSphere)\"/>" +
    "<g clip-path=\"url(#sphereClip)\">" + paths.map(path => "<path class=\"sphere-grid\" d=\"" + path + "\"/>").join("") + "</g>" +
    (property === 0 ? "<text class=\"solid-face-label\" x=\"210\" y=\"156\" text-anchor=\"middle\">1</text>" : "");
}

function solidSvgContent(shape, t, options = {}) {
  const property = options.property ?? 0;
  if (shape.id === "sphere") return sphereSvgContent(t, property);
  const model = options.model || solidModel(shape.id);
  const transformed = model.vertices.map(point => rotateSolidPoint(point, t.viewX, t.viewY));
  const zoom = clamp(Number(t.zoom) || 1, .7, 2.2);
  const projected = transformed.map(point => projectSolidPoint(point, zoom));
  const allowed = options.visibleFaces ? new Set(options.visibleFaces) : null;
  const faces = model.faces.filter(face => !allowed || allowed.has(face.id)).map((face, index) => ({
    ...face,
    index,
    depth: face.vertices.reduce((sum, vertex) => sum + transformed[vertex][2], 0) / face.vertices.length
  })).sort((a, b) => a.depth - b.depth);
  const labelFaces = new Map();
  faces.forEach(face => {
    const previous = labelFaces.get(face.id);
    if (!previous || face.depth > previous.depth) labelFaces.set(face.id, face);
  });
  const visibleVertices = new Set(faces.flatMap(face => face.vertices));
  const faceMarkup = faces.map(face => {
    const points = face.vertices.map(vertex => projected[vertex].map(value => value.toFixed(1)).join(",")).join(" ");
    const chosen = labelFaces.get(face.id) === face;
    const centre = face.vertices.reduce((sum, vertex) => [sum[0] + projected[vertex][0], sum[1] + projected[vertex][1]], [0,0]).map(value => value / face.vertices.length);
    const selected = options.selectedFace === face.id;
    const colourIndex = face.colourIndex || face.id;
    const label = options.faceLabel ? options.faceLabel(face) : face.id;
    const labelClass = options.faceLabelClass ? " " + options.faceLabelClass(face) : "";
    return "<g><polygon data-solid-face=\"" + face.id + "\" class=\"solid-face face-" + colourIndex + (face.curved ? " curved-piece" : "") + (property === 0 ? " feature-active" : "") + (selected ? " selected" : "") + "\" points=\"" + points + "\"/>" +
      (chosen && (property === 0 || options.alwaysLabels) ? "<text class=\"solid-face-label" + labelClass + "\" x=\"" + centre[0].toFixed(1) + "\" y=\"" + (centre[1] + 6).toFixed(1) + "\" text-anchor=\"middle\">" + label + "</text>" : "") + "</g>";
  }).join("");
  const edgeMarkup = model.edges.filter(edge => visibleVertices.has(edge[0]) && visibleVertices.has(edge[1])).map((edge, index) => {
    const a = projected[edge[0]], b = projected[edge[1]];
    const depth = (transformed[edge[0]][2] + transformed[edge[1]][2]) / 2;
    const edgeNumber = shape.id === "cylinder" ? index % 2 : shape.id === "cone" ? 0 : index;
    const showNumber = property === 1 && (shape.id === "cylinder" ? index < 2 : shape.id === "cone" ? index === 0 : true);
    const middle = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const edgeLabelClass = options.edgeLabelClass ? " " + options.edgeLabelClass(edgeNumber, model) : "";
    return "<g><line class=\"solid-edge edge-color-" + (edgeNumber % 4) + (property === 1 ? " feature-active" : "") + (depth < -.35 ? " back-edge" : "") + "\" x1=\"" + a[0].toFixed(1) + "\" y1=\"" + a[1].toFixed(1) + "\" x2=\"" + b[0].toFixed(1) + "\" y2=\"" + b[1].toFixed(1) + "\"/>" + (showNumber ? "<text class=\"solid-edge-label edge-label-color-" + (edgeNumber % 4) + edgeLabelClass + "\" x=\"" + middle[0].toFixed(1) + "\" y=\"" + (middle[1] - 5).toFixed(1) + "\" text-anchor=\"middle\">" + (edgeNumber + 1) + "</text>" : "") + "</g>";
  }).join("");
  const vertexMarkup = property === 2 ? model.vertexIndices.filter(vertex => visibleVertices.has(vertex)).map((vertex, index) => {
    const point = projected[vertex];
    const vertexLabel = options.vertexLabel ? options.vertexLabel(vertex, index, model) : index + 1;
    const vertexLabelClass = options.vertexLabelClass ? " " + options.vertexLabelClass(vertex, index, model) : "";
    return "<g><circle class=\"solid-vertex\" cx=\"" + point[0].toFixed(1) + "\" cy=\"" + point[1].toFixed(1) + "\" r=\"7\"/><text class=\"solid-vertex-label" + vertexLabelClass + "\" x=\"" + (point[0] + 10).toFixed(1) + "\" y=\"" + (point[1] - 9).toFixed(1) + "\">" + vertexLabel + "</text></g>";
  }).join("") : "";
  return faceMarkup + edgeMarkup + vertexMarkup;
}

function solid3dMarkup(id, shape, t, options = {}) {
  const zoomMax = shape.id === "sphere" ? 1.35 : 2.2;
  const zoom = clamp(Number(t.zoom) || 1, .7, zoomMax);
  const zoomControls = options.zoomControls === false ? "" : "<div class=\"solid-zoom-controls\" aria-label=\"" + loc(ml("Kawalan zum", "缩放控制", "Zoom controls")) + "\"><button type=\"button\" data-solid-zoom=\"out\" aria-label=\"" + loc(ml("Zum keluar", "缩小", "Zoom out")) + "\">−</button><button type=\"button\" class=\"solid-zoom-value\" data-solid-zoom=\"reset\" aria-label=\"" + loc(ml("Tetapkan zum 100 peratus", "恢复 100%", "Reset zoom to 100 percent")) + "\">" + Math.round(zoom * 100) + "%</button><button type=\"button\" data-solid-zoom=\"in\" aria-label=\"" + loc(ml("Zum masuk", "放大", "Zoom in")) + "\">＋</button></div>";
  return "<div class=\"solid-3d-scene\">" + zoomControls + "<svg id=\"" + id + "\" class=\"solid-3d-svg\" viewBox=\"0 0 420 300\" tabindex=\"0\" role=\"img\" aria-label=\"" + loc(ml("Model 3D boleh diputar dan dizum", "可旋转和缩放的 3D 模型", "Rotatable and zoomable 3D model")) + "\">" + solidSvgContent(shape, t, options) + "</svg><div class=\"solid-drag-hint\">🖐 " + loc(ml("Seret untuk putar · roda tetikus untuk zum", "拖动旋转 · 滚轮缩放", "Drag to rotate · wheel to zoom")) + "</div></div>";
}

function bindSolidDrag(id, shape, t, options = {}) {
  const svg = document.querySelector("#" + id);
  if (!svg) return;
  const zoomMax = shape.id === "sphere" ? 1.35 : 2.2;
  t.zoom = clamp(Number(t.zoom) || 1, .7, zoomMax);
  let activePointer = null;
  let moved = false;
  let startX = 0;
  let startY = 0;
  let startViewX = 0;
  let startViewY = 0;
  const scene = svg.closest(".solid-3d-scene");
  const redraw = () => {
    svg.innerHTML = solidSvgContent(shape, t, options);
    const value = scene?.querySelector(".solid-zoom-value");
    if (value) value.textContent = Math.round(t.zoom * 100) + "%";
  };
  const setZoom = value => {
    t.zoom = clamp(Math.round(value * 10) / 10, .7, zoomMax);
    redraw();
  };
  svg.addEventListener("pointerdown", event => {
    if (activePointer !== null) return;
    activePointer = event.pointerId;
    moved = false;
    startX = event.clientX;
    startY = event.clientY;
    startViewX = t.viewX;
    startViewY = t.viewY;
    try { svg.setPointerCapture?.(event.pointerId); } catch {}
    svg.classList.add("dragging");
    window.addEventListener("pointermove", update, { passive: false });
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    event.preventDefault();
  });
  const update = event => {
    if (event.pointerId !== activePointer) return;
    const samples = event.getCoalescedEvents?.();
    const point = samples?.length ? samples[samples.length - 1] : event;
    const dx = point.clientX - startX;
    const dy = point.clientY - startY;
    if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
    t.viewY = (startViewY + dx * .95) % 360;
    t.viewX = clamp(startViewX - dy * .95, -82, 82);
    redraw();
    event.preventDefault();
  };
  const stop = event => {
    if (event.pointerId !== activePointer) return;
    activePointer = null;
    svg.classList.remove("dragging");
    try { svg.releasePointerCapture?.(event.pointerId); } catch {}
    window.removeEventListener("pointermove", update);
    window.removeEventListener("pointerup", stop);
    window.removeEventListener("pointercancel", stop);
  };
  svg.addEventListener("wheel", event => {
    setZoom(t.zoom + (event.deltaY < 0 ? .1 : -.1));
    event.preventDefault();
  }, { passive: false });
  scene?.querySelectorAll("[data-solid-zoom]").forEach(button => button.addEventListener("click", () => {
    if (button.dataset.solidZoom === "reset") setZoom(1);
    else setZoom(t.zoom + (button.dataset.solidZoom === "in" ? .2 : -.2));
  }));
  svg.addEventListener("click", event => {
    if (moved || !options.faceClickable) return;
    const face = event.target.closest?.("[data-solid-face]");
    if (!face) return;
    t.property = 0;
    t.selectedFace = Number(face.dataset.solidFace);
    renderTool();
  });
  svg.addEventListener("keydown", event => {
    const moves = { ArrowLeft: [0,-5], ArrowRight: [0,5], ArrowUp: [5,0], ArrowDown: [-5,0] };
    if (event.key === "Home") { t.viewX = -18; t.viewY = 30; }
    else if (event.key === "+" || event.key === "=") { setZoom(t.zoom + .1); event.preventDefault(); return; }
    else if (event.key === "-" || event.key === "_") { setZoom(t.zoom - .1); event.preventDefault(); return; }
    else if (event.key === "0") { setZoom(1); event.preventDefault(); return; }
    else if (moves[event.key]) { t.viewX = clamp(t.viewX + moves[event.key][0], -82, 82); t.viewY = (t.viewY + moves[event.key][1]) % 360; }
    else return;
    redraw();
    event.preventDefault();
  });
}

function shapeFeatureExplanation(shape, property, selectedFace) {
  if (shape.kind === "2d") {
    if (property === 0) return loc(ml("Setiap sisi diberi warna dan nombor supaya boleh dijejaki walaupun bentuk diputar.", "每一条边都用固定颜色和号码标出，旋转后仍能追踪。", "Every side has a fixed colour and number so it can be followed after rotation."));
    if (property === 1) return shape.corners ? loc(ml("Titik merah bernombor ialah bucu, tempat dua sisi bertemu.", "有编号的红点是顶点，也就是两条边相交的位置。", "Numbered red points are corners, where two sides meet.")) : loc(ml("Bulatan tidak mempunyai bucu.", "圆没有顶点。", "A circle has no corners."));
    return shape.curved ? loc(ml("Seluruh sempadan bulatan ialah satu garis melengkung.", "圆的整个边界是一条曲线。", "The whole boundary is one curved line.")) : loc(ml("Bentuk ini tidak mempunyai garis melengkung.", "这个图形没有曲线。", "This shape has no curved line."));
  }
  if (property === 0) {
    if (shape.id === "sphere") return loc(ml("Seluruh bahagian luar ialah satu permukaan melengkung yang bersambung. Garisan grid lengkap menunjukkan bentuk sfera, bukan separuh sfera.", "整个外部是一个连续曲面。完整的球面网格表示整个球体，不是半个球。", "The entire outside is one continuous curved surface. The complete grid shows a whole sphere, not half a sphere."));
    return (selectedFace ? loc(ml("Muka yang dipilih", "你点击的是面", "Selected face")) + " " + selectedFace + ". " : "") + loc(ml("Kawasan berwarna ialah muka. Seret model untuk mencari semua muka bernombor.", "彩色区域是面；拖动模型可查看所有编号的面。", "Coloured regions are faces. Drag the model to find every numbered face."));
  }
  if (property === 1) return shape.edges
    ? loc(ml("Setiap rusuk diberi warna dan nombor. Rusuk ialah tempat dua muka bertemu.", "每条棱都有固定颜色和号码；棱是两个面相交的地方。", "Every edge has a fixed colour and number. An edge is where two faces meet."))
    : loc(ml("Bentuk ini tidak mempunyai rusuk, jadi tiada garisan merah akan muncul.", "这个立体没有棱，所以不会出现红线。", "This solid has no edges, so no red lines appear."));
  return shape.vertices ? loc(ml("Titik merah bernombor ialah bucu, tempat rusuk bertemu.", "有编号的红点是顶点，也就是棱相交的地方。", "Numbered red points are vertices, where edges meet.")) : loc(ml("Bentuk ini tidak mempunyai bucu. Tiada titik merah akan muncul.", "这个立体没有顶点，所以不会出现红点。", "This solid has no vertices, so no red points appear."));
}

function renderShapeExplorer() {
  const t = state.tool;
  const shape = SHAPES.find(item => item.id === t.shape);
  if (!Number.isFinite(t.viewX)) t.viewX = -18;
  if (!Number.isFinite(t.viewY)) t.viewY = 30;
  const properties = shape.kind === "2d"
    ? [[tr("sides"), shape.sides], [tr("corners"), shape.corners], [loc(ml("Garis melengkung", "曲线", "Curved line")), shape.curved ? 1 : 0]]
    : [[tr("faces"), shape.faces], [tr("edges"), shape.edges], [tr("vertices"), shape.vertices]];
  const explanation = shapeFeatureExplanation(shape, t.property, t.selectedFace);
  const picture = shape.kind === "3d"
    ? solid3dMarkup("shapeSolid3d", shape, t, { property: t.property, selectedFace: t.selectedFace, faceClickable: true })
    : shapeSvg(shape, t.rotation, t.property);
  setChallenge(loc(shape.name), shape.kind === "3d"
    ? shape.id === "sphere"
      ? loc(ml("Seret grid pada sfera. Bentuk luar kekal bulat kerana sfera sama dari setiap arah.", "拖动球面网格观察旋转；球体从每个方向看，外形仍然是圆的。", "Drag the grid to rotate it; a sphere still looks round from every direction."))
      : loc(ml("Seret terus pada model untuk melihat muka hadapan, belakang, atas dan bawah.", "直接拖动模型，查看前、后、上、下各个面。", "Drag the model itself to inspect its front, back, top and bottom."))
    : loc(ml("Putar bentuk dan sentuh kad sifat untuk memerhati cirinya.", "旋转图形并点击特征卡进行观察。", "Rotate the shape and tap a property card to inspect it.")));
  els.stage.innerHTML = "<div class=\"shape-explorer\"><div class=\"shape-canvas\">" + picture + "</div><div class=\"property-panel\">" + properties.map((item, index) => "<button class=\"property-card" + (t.property === index ? " active" : "") + "\" type=\"button\" data-property=\"" + index + "\" aria-pressed=\"" + (t.property === index) + "\"><span>" + item[0] + "</span><strong>" + item[1] + "</strong></button>").join("") + "<div class=\"property-explanation\">" + explanation + "</div></div></div>";
  const viewControl = shape.kind === "3d"
    ? "<div class=\"board-actions\"><button id=\"reset3dView\" class=\"secondary-button compact\" type=\"button\">⌂ " + loc(ml("Pandangan asal", "恢复初始视角", "Reset view")) + "</button>" + randomButton() + "</div>"
    : "<div class=\"range-grid\" style=\"margin-top:10px\">" + rangeControl("shapeRotation", loc(ml("Putaran", "旋转", "Rotation")), -30, 30, 1, t.rotation, "°") + "</div><div class=\"board-actions\">" + randomButton() + "</div>";
  els.controls.innerHTML = "<div class=\"choice-row\">" + SHAPES.map(item => "<button type=\"button\" class=\"choice-chip" + (item.id === t.shape ? " active" : "") + "\" data-shape=\"" + item.id + "\">" + item.icon + " " + loc(item.name) + "</button>").join("") + "</div>" + viewControl;
  setSummary(explanation, t.property === 0 && t.selectedFace ? "success" : "neutral");
  document.querySelectorAll("[data-shape]").forEach(button => button.addEventListener("click", () => {
    t.shape = button.dataset.shape;
    t.property = 0;
    t.selectedFace = null;
    t.viewX = -18;
    t.viewY = 30;
    t.zoom = 1;
    renderTool();
  }));
  document.querySelectorAll("[data-property]").forEach(button => button.addEventListener("click", () => { t.property = Number(button.dataset.property); t.selectedFace = null; renderTool(); }));
  const rotation = document.querySelector("#shapeRotation");
  if (rotation) rotation.addEventListener("input", event => { t.rotation = Number(event.target.value); renderTool(); });
  const resetView = document.querySelector("#reset3dView");
  if (resetView) resetView.addEventListener("click", () => { t.viewX = -18; t.viewY = 30; t.zoom = 1; renderTool(); });
  if (shape.kind === "3d") bindSolidDrag("shapeSolid3d", shape, t, { property: t.property, selectedFace: t.selectedFace, faceClickable: true });
  document.querySelector("#randomExample").addEventListener("click", randomizeCurrent);
}

function netPieceClass(face, base, foldedFaces, currentFace) {
  const classes = ["net-piece"];
  if (face === base) classes.push("base");
  if (foldedFaces.has(face)) classes.push("folded");
  if (face === currentFace) classes.push("current");
  return classes.join(" ");
}

function netLabel(face, x, y) {
  return "<text class=\"diagram-label net-face-number\" x=\"" + x + "\" y=\"" + y + "\" text-anchor=\"middle\">" + face + "</text>";
}

function flatNetMarkup(t, definition, foldedFaces, currentFace) {
  const cls = face => netPieceClass(face, definition.base, foldedFaces, currentFace);
  if (definition.id === "cube") {
    const cells = NETS[t.net % NETS.length];
    const faceIds = [3,2,1,4,5,6];
    const minX = Math.min(...cells.map(cell => cell[0]));
    const minY = Math.min(...cells.map(cell => cell[1]));
    return cells.map((cell, index) => {
      const face = faceIds[index];
      const x = 35 + (cell[0] - minX) * 55;
      const y = 20 + (cell[1] - minY) * 55;
      return "<rect class=\"" + cls(face) + "\" x=\"" + x + "\" y=\"" + y + "\" width=\"54\" height=\"54\" rx=\"4\"/>" + netLabel(face, x + 27, y + 32);
    }).join("");
  }
  if (definition.id === "cuboid") {
    const pieces = [
      [3,100,45,80,45], [2,55,90,45,60], [1,100,90,80,60],
      [4,180,90,45,60], [5,225,90,80,60], [6,100,150,80,45]
    ];
    return pieces.map(piece => "<rect class=\"" + cls(piece[0]) + "\" x=\"" + piece[1] + "\" y=\"" + piece[2] + "\" width=\"" + piece[3] + "\" height=\"" + piece[4] + "\" rx=\"4\"/>" + netLabel(piece[0], piece[1] + piece[3] / 2, piece[2] + piece[4] / 2 + 5)).join("");
  }
  if (definition.id === "pyramid") {
    const pieces = [
      [1,"110,85 190,85 150,25",150,70], [2,"190,85 190,165 250,125",213,129],
      [3,"110,165 190,165 150,225",150,190], [4,"110,85 110,165 50,125",87,129]
    ];
    return pieces.map(piece => "<polygon class=\"" + cls(piece[0]) + "\" points=\"" + piece[1] + "\"/>" + netLabel(piece[0], piece[2], piece[3])).join("") +
      "<rect class=\"" + cls(5) + "\" x=\"110\" y=\"85\" width=\"80\" height=\"80\" rx=\"4\"/>" + netLabel(5, 150, 130);
  }
  return "<circle class=\"" + cls(1) + "\" cx=\"150\" cy=\"42\" r=\"32\"/>" + netLabel(1, 150, 47) +
    "<rect class=\"" + cls(2) + "\" x=\"72\" y=\"74\" width=\"156\" height=\"108\" rx=\"5\"/>" + netLabel(2, 150, 133) +
    "<circle class=\"" + cls(3) + "\" cx=\"150\" cy=\"214\" r=\"32\"/>" + netLabel(3, 150, 219);
}

function rotatePointAroundLine(point, lineStart, lineEnd, angleDegrees) {
  if (!angleDegrees) return point.slice();
  const angle = angleDegrees * Math.PI / 180;
  const axisRaw = [lineEnd[0] - lineStart[0], lineEnd[1] - lineStart[1], lineEnd[2] - lineStart[2]];
  const axisLength = Math.hypot(...axisRaw) || 1;
  const axis = axisRaw.map(value => value / axisLength);
  const vector = point.map((value, index) => value - lineStart[index]);
  const cosine = Math.cos(angle), sine = Math.sin(angle);
  const dot = axis[0] * vector[0] + axis[1] * vector[1] + axis[2] * vector[2];
  const cross = [axis[1] * vector[2] - axis[2] * vector[1], axis[2] * vector[0] - axis[0] * vector[2], axis[0] * vector[1] - axis[1] * vector[0]];
  return vector.map((value, index) => lineStart[index] + value * cosine + cross[index] * sine + axis[index] * dot * (1 - cosine));
}

function foldingFaces(id) {
  if (id === "pyramid") {
    const side = 1.4, slant = 1.1;
    const fold = Math.acos(-side / (2 * slant)) * 180 / Math.PI;
    return {
      centre: [side / 2, side / 2], scale: 90,
      faces: [
        { id: 5, points: [[0,0,0],[side,0,0],[side,side,0],[0,side,0]] },
        { id: 1, parent: 5, hinge: [[0,0,0],[side,0,0]], fold: -fold, points: [[0,0,0],[side,0,0],[side/2,-slant,0]] },
        { id: 2, parent: 5, hinge: [[side,0,0],[side,side,0]], fold: -fold, points: [[side,0,0],[side,side,0],[side+slant,side/2,0]] },
        { id: 3, parent: 5, hinge: [[0,side,0],[side,side,0]], fold, points: [[0,side,0],[side,side,0],[side/2,side+slant,0]] },
        { id: 4, parent: 5, hinge: [[0,0,0],[0,side,0]], fold, points: [[0,0,0],[0,side,0],[-slant,side/2,0]] }
      ]
    };
  }
  const width = id === "cuboid" ? 1.45 : 1;
  const depth = id === "cuboid" ? .9 : 1;
  const height = id === "cuboid" ? .72 : 1;
  return {
    centre: [width / 2, depth / 2], scale: id === "cuboid" ? 84 : 98,
    faces: [
      { id: 1, points: [[0,0,0],[width,0,0],[width,depth,0],[0,depth,0]] },
      { id: 3, parent: 1, hinge: [[0,0,0],[width,0,0]], fold: -90, points: [[0,-height,0],[width,-height,0],[width,0,0],[0,0,0]] },
      { id: 2, parent: 1, hinge: [[0,0,0],[0,depth,0]], fold: 90, points: [[-height,0,0],[0,0,0],[0,depth,0],[-height,depth,0]] },
      { id: 4, parent: 1, hinge: [[width,0,0],[width,depth,0]], fold: -90, points: [[width,0,0],[width+height,0,0],[width+height,depth,0],[width,depth,0]] },
      { id: 5, parent: 4, hinge: [[width+height,0,0],[width+height,depth,0]], fold: -90, points: [[width+height,0,0],[width+height+width,0,0],[width+height+width,depth,0],[width+height,depth,0]] },
      { id: 6, parent: 1, hinge: [[0,depth,0],[width,depth,0]], fold: 90, points: [[0,depth,0],[width,depth,0],[width,depth+height,0],[0,depth+height,0]] }
    ]
  };
}

function foldingNetFaceMarkup(shape, definition, t) {
  if (shape.id === "cylinder") {
    if (t.step === 0) return flatNetMarkup(t, definition, new Set(), definition.foldOrder[0]);
    const visibleFaces = t.step === 1 ? [2,1] : [2,1,3];
    return solidSvgContent(shape, t, { property: 0, visibleFaces, alwaysLabels: true });
  }
  const setup = foldingFaces(shape.id);
  const displayScale = setup.scale * (1 + .25 * t.step / Math.max(1, definition.foldOrder.length));
  const orderIndex = new Map(definition.foldOrder.map((face, index) => [face, index]));
  const transforms = new Map();
  const transformedFaces = [];
  setup.faces.forEach(face => {
    let transform = point => point.slice();
    if (face.parent) {
      const parentTransform = transforms.get(face.parent);
      const folded = (orderIndex.get(face.id) ?? 999) < t.step;
      transform = point => parentTransform(rotatePointAroundLine(point, face.hinge[0], face.hinge[1], folded ? face.fold : 0));
    }
    transforms.set(face.id, transform);
    const world = face.points.map(transform).map(point => [point[0] - setup.centre[0], setup.centre[1] - point[1], point[2]]);
    const camera = world.map(point => rotateSolidPoint(point, t.viewX, t.viewY));
    const projected = camera.map(point => [210 + point[0] * displayScale, 150 - point[1] * displayScale]);
    transformedFaces.push({ id: face.id, camera, projected, depth: camera.reduce((sum, point) => sum + point[2], 0) / camera.length });
  });
  const activeFace = t.step > 0 ? definition.foldOrder[t.step - 1] : definition.foldOrder[0];
  return transformedFaces.sort((a, b) => a.depth - b.depth).map(face => {
    const centre = face.projected.reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0,0]).map(value => value / face.projected.length);
    return "<g class=\"folding-face-group" + (face.id === activeFace ? " active" : "") + "\"><polygon class=\"solid-face face-" + face.id + " feature-active\" points=\"" + face.projected.map(point => point.map(value => value.toFixed(1)).join(",")).join(" ") + "\"/><text class=\"solid-face-label\" x=\"" + centre[0].toFixed(1) + "\" y=\"" + (centre[1] + 6).toFixed(1) + "\" text-anchor=\"middle\">" + face.id + "</text></g>";
  }).join("");
}

function foldingNetSvg(shape, definition, t) {
  const flatCylinder = shape.id === "cylinder" && t.step === 0;
  const viewBox = flatCylinder ? "0 0 310 260" : "0 0 420 300";
  const hint = flatCylinder
    ? loc(ml("Bentangan lengkap masih bersambung", "完整展开图保持连接", "The complete net stays connected"))
    : "🖐 " + loc(ml("Seret terus untuk memutar", "直接拖动即可旋转", "Drag directly to rotate"));
  return "<div class=\"solid-3d-scene\"><svg id=\"netFold3d\" class=\"solid-3d-svg net-fold-svg\" viewBox=\"" + viewBox + "\" tabindex=\"0\">" + foldingNetFaceMarkup(shape, definition, t) + "</svg><div class=\"solid-drag-hint\">" + hint + "</div></div>";
}

function bindNetFoldDrag(t, shape, definition) {
  const svg = document.querySelector("#netFold3d");
  if (!svg || (shape.id === "cylinder" && t.step === 0)) return;
  svg.addEventListener("pointerdown", startEvent => {
    startEvent.preventDefault();
    const pointerId = startEvent.pointerId;
    const startX = startEvent.clientX, startY = startEvent.clientY;
    const startViewX = t.viewX, startViewY = t.viewY;
    try { svg.setPointerCapture?.(pointerId); } catch {}
    svg.classList.add("dragging");
    const update = event => {
      if (event.pointerId !== pointerId) return;
      const samples = event.getCoalescedEvents?.();
      const point = samples?.length ? samples[samples.length - 1] : event;
      t.viewY = (startViewY + (point.clientX - startX) * .95) % 360;
      t.viewX = clamp(startViewX - (point.clientY - startY) * .95, -82, 82);
      svg.innerHTML = foldingNetFaceMarkup(shape, definition, t);
      event.preventDefault();
    };
    const stop = event => {
      if (event.pointerId !== pointerId) return;
      svg.classList.remove("dragging");
      try { svg.releasePointerCapture?.(pointerId); } catch {}
      window.removeEventListener("pointermove", update);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
    window.addEventListener("pointermove", update, { passive: false });
    window.addEventListener("pointerup", stop, { once: true });
    window.addEventListener("pointercancel", stop, { once: true });
  });
}

function renderNetBuilder() {
  const t = state.tool;
  if (!NET_SOLIDS.some(item => item.id === t.shape)) t.shape = "cube";
  const definition = NET_SOLIDS.find(item => item.id === t.shape);
  const shape = SHAPES.find(item => item.id === definition.id);
  const maxStep = definition.foldOrder.length;
  t.step = clamp(t.step, 0, maxStep);
  if (!Number.isFinite(t.viewX)) t.viewX = -18;
  if (!Number.isFinite(t.viewY)) t.viewY = 30;
  const nextFace = t.step < maxStep ? definition.foldOrder[t.step] : null;
  const lastFoldedFace = t.step > 0 ? definition.foldOrder[t.step - 1] : null;
  const currentFace = lastFoldedFace || nextFace;
  const foldedFaces = new Set(definition.foldOrder.slice(0, t.step));
  const netMarkup = flatNetMarkup(t, definition, foldedFaces, currentFace);
  const modelMarkup = foldingNetSvg(shape, definition, t);
  const shapeName = loc(shape.name);
  const stepTitle = t.step === 0
    ? loc(ml("Mula dengan bentangan rata", "从平面展开图开始", "Start with the flat net")) + " · " + shapeName
    : t.step === maxStep
      ? loc(ml("Lipatan lengkap", "折合完成", "Folding complete")) + " · " + shapeName
      : loc(ml("Langkah ", "第 ", "Step ")) + t.step + " · " + loc(ml("Muka ", "面 ", "Face ")) + lastFoldedFace + " " + loc(ml("telah dilipat", "已折起", "folded"));
  const stepInstruction = t.step === maxStep
    ? loc(ml("Semua permukaan kini berada pada kedudukan 3D yang sepadan.", "所有面现在都在对应的立体位置。", "Every surface is now in its matching 3D position."))
    : t.step === 0
      ? loc(ml("Muka ", "面 ", "Face ")) + definition.base + " " + loc(ml("menjadi tapak. Tekan Langkah seterusnya.", "作为底面；点击“下一步”。", "is the base. Press Next step."))
      : loc(ml("Muka yang baru dilipat diserlahkan. Seterusnya lipat muka ", "刚折起的面已高亮；下一步折起面 ", "The folded face is highlighted. Next, fold face ")) + nextFace + ".";
  setChallenge(stepTitle, stepInstruction);
  els.stage.innerHTML = "<div class=\"net-board\"><div class=\"net-panel\"><div class=\"panel-caption\">" + loc(ml("Bentangan rata", "平面展开图", "Flat net")) + " · " + shapeName + "</div><svg class=\"geometry-svg net-flat-svg\" viewBox=\"0 0 310 260\">" + netMarkup + "</svg></div><div class=\"net-panel\"><div class=\"panel-caption\">" + loc(ml("Binaan 3D · Langkah ", "立体构造 · 第 ", "3D build · Step ")) + t.step + "/" + maxStep + "</div>" + modelMarkup + "</div></div>";
  els.controls.innerHTML = "<div class=\"choice-row net-shape-choices\">" + NET_SOLIDS.map(item => {
    const itemShape = SHAPES.find(shapeItem => shapeItem.id === item.id);
    return "<button type=\"button\" class=\"choice-chip" + (item.id === t.shape ? " active" : "") + "\" data-net-shape=\"" + item.id + "\">" + itemShape.icon + " " + loc(itemShape.name) + "</button>";
  }).join("") + "</div><div class=\"range-grid\" style=\"margin-top:10px\">" + rangeControl("foldStep", loc(ml("Langkah lipatan", "折合步骤", "Folding step")), 0, maxStep, 1, t.step, "/" + maxStep) + "</div><div class=\"board-actions\"><button id=\"previousFold\" class=\"secondary-button compact\" type=\"button\" " + (t.step === 0 ? "disabled" : "") + ">← " + loc(ml("Langkah sebelumnya", "上一步", "Previous step")) + "</button><button id=\"nextFold\" class=\"primary-button compact\" type=\"button\" " + (t.step === maxStep ? "disabled" : "") + ">" + loc(ml("Langkah seterusnya", "下一步", "Next step")) + " →</button><button id=\"resetNetView\" class=\"secondary-button compact\" type=\"button\">⌂ " + loc(ml("Pandangan asal", "恢复视角", "Reset view")) + "</button>" + randomButton("newNet") + "</div>";
  const foldedText = t.step === 0 ? "—" : definition.foldOrder.slice(0, t.step).join(", ");
  setSummary(loc(ml("Muka yang telah dilipat", "已经折起的面", "Folded faces")) + ": <strong>" + foldedText + "</strong>" + (t.step === maxStep ? " · ✓ " + shapeName + " " + loc(ml("lengkap", "完成", "complete")) : ""), t.step === maxStep ? "success" : "neutral");
  document.querySelectorAll("[data-net-shape]").forEach(button => button.addEventListener("click", () => { t.shape = button.dataset.netShape; t.step = 0; t.viewX = -18; t.viewY = 30; renderTool(); }));
  document.querySelector("#foldStep").addEventListener("input", event => { t.step = Number(event.target.value); renderTool(); });
  document.querySelector("#previousFold").addEventListener("click", () => { t.step = clamp(t.step - 1, 0, maxStep); renderTool(); });
  document.querySelector("#nextFold").addEventListener("click", () => { t.step = clamp(t.step + 1, 0, maxStep); renderTool(); });
  document.querySelector("#resetNetView").addEventListener("click", () => { t.viewX = -18; t.viewY = 30; renderTool(); });
  document.querySelector("#newNet").addEventListener("click", randomizeCurrent);
  bindNetFoldDrag(t, shape, definition);
}

function drawnSolidModel(points, depth) {
  const centre = points.reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0, 0]).map(value => value / points.length);
  const span = Math.max(80, ...points.map(point => Math.max(Math.abs(point[0] - centre[0]), Math.abs(point[1] - centre[1])))) / 1.05;
  const halfDepth = .35 + depth / 100 * .72;
  const ring = points.map(point => [(point[0] - centre[0]) / span, (centre[1] - point[1]) / span]);
  const count = ring.length;
  const vertices = ring.map(point => [point[0], point[1], -halfDepth]).concat(ring.map(point => [point[0], point[1], halfDepth]));
  const faces = [
    { id: 1, role: "baseA", colourIndex: 2, vertices: Array.from({ length: count }, (_, index) => count - 1 - index) },
    { id: 2, role: "baseB", colourIndex: 4, vertices: Array.from({ length: count }, (_, index) => count + index) },
    ...Array.from({ length: count }, (_, index) => {
      const next = (index + 1) % count;
      return { id: index + 3, role: "side", sideNumber: index + 1, colourIndex: index % 2 ? 3 : 1, vertices: [index, next, count + next, count + index] };
    })
  ];
  const edges = [];
  for (let index = 0; index < count; index++) {
    const next = (index + 1) % count;
    edges.push([index, next], [count + index, count + next], [index, count + index]);
  }
  return { vertices, faces, edges, vertexIndices: Array.from({ length: count * 2 }, (_, index) => index) };
}

function renderShapeDrawer() {
  const t = state.tool;
  if (!Number.isFinite(t.depth)) t.depth = 58;
  if (!Number.isFinite(t.viewX)) t.viewX = -18;
  if (!Number.isFinite(t.viewY)) t.viewY = 30;
  if (!Number.isFinite(t.property)) t.property = 0;
  if (t.solid && !t.closed) t.solid = false;
  const sideCount = t.closed ? t.points.length : Math.max(0, t.points.length - 1);

  if (t.solid && t.points.length >= 3) {
    const model = drawnSolidModel(t.points, t.depth);
    const solidShape = { id: "drawnSolid" };
    const options = {
      model,
      property: t.property,
      faceLabel: face => face.role === "baseA"
        ? loc(ml("Tapak A", "底面 A", "Base A"))
        : face.role === "baseB"
          ? loc(ml("Tapak B", "底面 B", "Base B"))
          : loc(ml("Sisi ", "侧面 ", "Side ")) + face.sideNumber,
      faceLabelClass: face => "drawn-solid-label " + (face.role === "side" ? "side-face-label" : "base-face-label"),
      edgeLabelClass: () => sideCount > 8 ? "dense-solid-label" : "",
      vertexLabel: (vertex, index) => (vertex < sideCount ? "A" : "B") + ((vertex % sideCount) + 1),
      vertexLabelClass: () => sideCount > 8 ? "dense-solid-label" : ""
    };
    const featureHelp = [
      loc(ml("Pilih Muka untuk melihat dua tapak dan semua permukaan sisi.", "选择“面”，查看两个底面和所有侧面。", "Choose Faces to inspect both bases and every side face.")),
      loc(ml("Pilih Rusuk untuk menandakan dan menomborkan semua rusuk.", "选择“棱”，标出并编号全部棱。", "Choose Edges to mark and number every edge.")),
      loc(ml("Pilih Bucu untuk menunjukkan titik A dan B yang sepadan.", "选择“顶点”，显示相互对应的 A、B 顶点。", "Choose Vertices to show the matching A and B points."))
    ][t.property];
    setChallenge(loc(ml("Bentuk telah disambung menjadi 3D", "图形已经连接成立体", "The shape is now connected as a 3D solid")), featureHelp);
    els.stage.innerHTML = "<div class=\"draw-solid-wrap\">" + solid3dMarkup("drawnSolid3d", solidShape, t, options) + "<div class=\"metric-row feature-metric-row\">" + featureMetric(tr("faces"), sideCount + 2, 0, t.property === 0) + featureMetric(tr("edges"), sideCount * 3, 1, t.property === 1) + featureMetric(tr("vertices"), sideCount * 2, 2, t.property === 2) + "</div></div>";
    els.controls.innerHTML = "<div class=\"range-grid\">" + rangeControl("drawDepth", loc(ml("Kedalaman", "立体深度", "Solid depth")), 25, 100, 1, t.depth) + "</div><div class=\"board-actions\"><button id=\"toggleDrawSolid\" class=\"secondary-button compact\" type=\"button\">▦ " + loc(ml("Kembali ke satah", "回到平面", "Back to plane")) + "</button><button id=\"resetDrawView\" class=\"secondary-button compact\" type=\"button\">⌂ " + loc(ml("Pandangan asal", "恢复视角", "Reset view")) + "</button>" + randomButton() + "</div>";
    setSummary(featureHelp);
    document.querySelector("#drawDepth").addEventListener("input", event => { t.depth = Number(event.target.value); renderTool(); });
    document.querySelector("#toggleDrawSolid").addEventListener("click", () => { t.solid = false; renderTool(); });
    document.querySelector("#resetDrawView").addEventListener("click", () => { t.viewX = -18; t.viewY = 30; t.zoom = 1; renderTool(); });
    document.querySelectorAll("[data-solid-property]").forEach(button => button.addEventListener("click", () => { t.property = Number(button.dataset.solidProperty); renderTool(); }));
    document.querySelector("#randomExample").addEventListener("click", randomizeCurrent);
    bindSolidDrag("drawnSolid3d", solidShape, t, options);
    return;
  }

  const grid = [];
  for (let x = 20; x <= 380; x += 40) for (let y = 20; y <= 280; y += 40) grid.push("<circle cx=\"" + x + "\" cy=\"" + y + "\" r=\"4\" fill=\"#c1b18e\"/>");
  const points = t.points.map(point => point.join(",")).join(" ");
  const lines = t.points.length > 1 ? (t.closed ? "<polygon points=\"" + points + "\" fill=\"rgba(255,215,120,.42)\" class=\"measure-line\"/>" : "<polyline points=\"" + points + "\" class=\"measure-line\"/>") : "";
  const edgeTotal = t.closed ? t.points.length : Math.max(0, t.points.length - 1);
  const edgeLabels = Array.from({ length: edgeTotal }, (_, index) => {
    const a = t.points[index];
    const b = t.points[(index + 1) % t.points.length];
    return "<text class=\"draw-edge-label\" x=\"" + ((a[0] + b[0]) / 2) + "\" y=\"" + ((a[1] + b[1]) / 2 - 8) + "\" text-anchor=\"middle\">" + (index + 1) + "</text>";
  }).join("");
  const handles = t.points.map((point, index) => "<circle class=\"point-handle\" cx=\"" + point[0] + "\" cy=\"" + point[1] + "\" r=\"8\"/><text class=\"draw-vertex-label\" x=\"" + (point[0] + 11) + "\" y=\"" + (point[1] - 10) + "\">" + (index + 1) + "</text>").join("");
  setChallenge(loc(ml("Bina bentuk pada grid", "在格点上构造图形", "Build a shape on the grid")), loc(ml("Klik titik atau tahan dan seret melalui beberapa titik.", "可逐点点击，也可按住并拖过多个格点。", "Click points, or hold and drag across several grid points.")));
  els.stage.innerHTML = "<div class=\"draw-wrap\"><svg id=\"drawBoard\" class=\"draw-board\" viewBox=\"0 0 400 300\">" + grid.join("") + lines + edgeLabels + handles + "</svg><div class=\"draw-help\">" + metric(tr("corners"), t.points.length) + "<div class=\"formula-strip\">" + (t.closed ? loc(ml("Bentuk tertutup · sedia untuk 3D", "图形已闭合 · 可以连接成立体", "Closed shape · ready for 3D")) : loc(ml("Bentuk masih terbuka", "图形尚未闭合", "Shape is still open"))) + "</div></div></div>";
  els.controls.innerHTML = "<div class=\"board-actions\"><button id=\"undoPoint\" class=\"secondary-button compact\" type=\"button\">↶ " + tr("undo") + "</button><button id=\"closeDraw\" class=\"primary-button compact\" type=\"button\" " + (t.points.length < 3 ? "disabled" : "") + ">◇ " + tr("closeShape") + "</button><button id=\"toggleDrawSolid\" class=\"primary-button compact\" type=\"button\" " + (!t.closed ? "disabled" : "") + ">⬡ " + loc(ml("Sambung jadi 3D", "连接成立体", "Connect as 3D")) + "</button><button id=\"clearDraw\" class=\"secondary-button compact\" type=\"button\">↻ " + tr("clear") + "</button>" + randomButton() + "</div>";
  setSummary(loc(ml("Bilangan sisi yang kelihatan", "目前可见的边数", "Visible sides")) + ": <strong>" + sideCount + "</strong> · " + loc(ml("Klik atau seret melalui titik grid", "可点击或拖过格点来画", "Click or drag across grid points")));
  const board = document.querySelector("#drawBoard");
  board.addEventListener("pointerdown", startEvent => {
    if (t.closed) return;
    startEvent.preventDefault();
    const rect = board.getBoundingClientRect();
    let drawing = true;
    const addPoint = (event, requireNear) => {
      const rawX = (event.clientX - rect.left) / rect.width * 400;
      const rawY = (event.clientY - rect.top) / rect.height * 300;
      const x = clamp(Math.round((rawX - 20) / 40) * 40 + 20, 20, 380);
      const y = clamp(Math.round((rawY - 20) / 40) * 40 + 20, 20, 280);
      if (requireNear && Math.hypot(rawX - x, rawY - y) > 18) return;
      const existing = t.points.findIndex(point => point[0] === x && point[1] === y);
      if (existing === 0 && t.points.length >= 3) {
        t.closed = true;
        beep("done");
        renderTool();
        return;
      }
      if (existing !== -1) return;
      t.points.push([x, y]);
      t.solid = false;
      renderTool();
    };
    addPoint(startEvent, false);
    const move = event => { if (drawing && !t.closed) { event.preventDefault(); addPoint(event, true); } };
    const stop = () => {
      drawing = false;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", stop, { once: true });
    window.addEventListener("pointercancel", stop, { once: true });
  });
  document.querySelector("#undoPoint").addEventListener("click", () => { t.solid = false; t.closed = false; t.points.pop(); renderTool(); });
  document.querySelector("#closeDraw").addEventListener("click", () => { if (t.points.length >= 3) { t.closed = true; beep("done"); } renderTool(); });
  document.querySelector("#toggleDrawSolid").addEventListener("click", () => { if (t.closed) { t.solid = true; renderTool(); } });
  document.querySelector("#clearDraw").addEventListener("click", () => { t.points = []; t.closed = false; t.solid = false; renderTool(); });
  document.querySelector("#randomExample").addEventListener("click", randomizeCurrent);
}

function prismSolidModel(sides, depth) {
  const radius = sides >= 7 ? 1 : 1.12;
  const halfDepth = .42 + depth / 100 * .78;
  const ring = Array.from({ length: sides }, (_, index) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / sides;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
  });
  const vertices = ring.map(point => [point[0], point[1], -halfDepth]).concat(ring.map(point => [point[0], point[1], halfDepth]));
  const front = Array.from({ length: sides }, (_, index) => sides - 1 - index);
  const back = Array.from({ length: sides }, (_, index) => sides + index);
  const faces = [
    { id: 1, role: "baseA", colourIndex: 2, vertices: front },
    { id: 2, role: "baseB", colourIndex: 4, vertices: back },
    ...Array.from({ length: sides }, (_, index) => {
      const next = (index + 1) % sides;
      return { id: index + 3, role: "side", sideNumber: index + 1, colourIndex: index % 2 ? 3 : 1, vertices: [index, next, sides + next, sides + index] };
    })
  ];
  const edges = [];
  for (let index = 0; index < sides; index++) {
    const next = (index + 1) % sides;
    edges.push([index, next], [sides + index, sides + next], [index, sides + index]);
  }
  return { vertices, faces, edges, vertexIndices: Array.from({ length: sides * 2 }, (_, index) => index) };
}

function renderPrismLab() {
  const t = state.tool;
  if (!Number.isFinite(t.viewX)) t.viewX = -18;
  if (!Number.isFinite(t.viewY)) t.viewY = 30;
  if (!Number.isFinite(t.property)) t.property = 0;
  const model = prismSolidModel(t.sides, t.depth);
  const shape = { id: "prism" };
  const options = {
    model,
    property: t.property,
    faceLabel: face => face.role === "baseA"
      ? loc(ml("Tapak A", "底面 A", "Base A"))
      : face.role === "baseB"
        ? loc(ml("Tapak B", "底面 B", "Base B"))
        : loc(ml("Sisi ", "侧面 ", "Side ")) + face.sideNumber,
    faceLabelClass: face => "prism-face-label " + (face.role === "side" ? "side-face-label" : "base-face-label"),
    vertexLabel: vertex => (vertex < t.sides ? "A" : "B") + ((vertex % t.sides) + 1)
  };
  const featureHelp = [
    loc(ml("Dua tapak yang sama sentiasa disambungkan oleh permukaan sisi.", "两个相同的底面始终由侧面连接。", "Two identical bases always stay connected by side faces.")),
    loc(ml("Rusuk berwarna dan bernombor menunjukkan tempat dua muka bertemu.", "彩色编号棱表示两个面相交的位置。", "Coloured numbered edges show where two faces meet.")),
    loc(ml("Bucu A dan B menunjukkan titik yang sepadan pada kedua-dua tapak.", "A、B 顶点显示两个底面上互相对应的点。", "A and B vertices show matching points on the two bases."))
  ][t.property];
  setChallenge(t.sides + " " + tr("sides"), featureHelp);
  els.stage.innerHTML = "<div class=\"prism-wrap prism-3d-wrap\">" + solid3dMarkup("prismSolid3d", shape, t, options) + "<div class=\"metric-row feature-metric-row\">" + featureMetric(tr("faces"), t.sides + 2, 0, t.property === 0) + featureMetric(tr("edges"), t.sides * 3, 1, t.property === 1) + featureMetric(tr("vertices"), t.sides * 2, 2, t.property === 2) + "</div></div>";
  els.controls.innerHTML = "<div class=\"range-grid\">" + rangeControl("prismSides", tr("sides"), 3, 8, 1, t.sides) + rangeControl("prismDepth", loc(ml("Kedalaman", "深度", "Depth")), 25, 100, 1, t.depth) + "</div><div class=\"board-actions\"><button id=\"resetPrismView\" class=\"secondary-button compact\" type=\"button\">⌂ " + loc(ml("Pandangan asal", "恢复初始视角", "Reset view")) + "</button>" + randomButton() + "</div>";
  setSummary(featureHelp);
  document.querySelector("#prismSides").addEventListener("input", event => { t.sides = Number(event.target.value); renderTool(); });
  document.querySelector("#prismDepth").addEventListener("input", event => { t.depth = Number(event.target.value); renderTool(); });
  document.querySelector("#resetPrismView").addEventListener("click", () => { t.viewX = -18; t.viewY = 30; t.zoom = 1; renderTool(); });
  document.querySelectorAll("[data-solid-property]").forEach(button => button.addEventListener("click", () => { t.property = Number(button.dataset.solidProperty); renderTool(); }));
  document.querySelector("#randomExample").addEventListener("click", randomizeCurrent);
  bindSolidDrag("prismSolid3d", shape, t, options);
}

function symmetryStampMarkup(item, mirrored = false) {
  const x = mirrored ? 600 - item.x : item.x;
  const css = mirrored ? "mirror-stamp" : "source-stamp";
  const data = mirrored ? " data-mirror-id=\"" + item.id + "\"" : " data-stamp-id=\"" + item.id + "\"";
  const transform = "translate(" + x + " " + item.y + ")";
  let shape;
  if (item.type === "circle") shape = "<circle r=\"20\"/>";
  else if (item.type === "triangle") shape = "<polygon points=\"0,-23 22,18 -22,18\"/>";
  else if (item.type === "heart") shape = "<path d=\"M0 22 C-34 2 -24 -25 0 -12 C24 -25 34 2 0 22Z\"/>";
  else shape = "<polygon points=\"0,-24 6,-8 23,-8 10,3 15,20 0,10 -15,20 -10,3 -23,-8 -6,-8\"/>";
  return "<g class=\"symmetry-stamp " + css + "\"" + data + " transform=\"" + transform + "\">" + shape + "</g>";
}

function bindSymmetryStampDrag() {
  const board = document.querySelector("#symmetryCanvas");
  if (!board) return;
  document.querySelectorAll("[data-stamp-id]").forEach(stamp => stamp.addEventListener("pointerdown", startEvent => {
    startEvent.preventDefault();
    startEvent.stopPropagation();
    const id = Number(stamp.dataset.stampId);
    const rect = board.getBoundingClientRect();
    const item = state.tool.stamps.find(entry => entry.id === id);
    if (!item) return;
    const pointerId = startEvent.pointerId;
    const startX = startEvent.clientX;
    const startY = startEvent.clientY;
    const itemStartX = item.x;
    const itemStartY = item.y;
    const mirror = board.querySelector("[data-mirror-id=\"" + id + "\"]");
    try { stamp.setPointerCapture?.(pointerId); } catch {}
    const update = event => {
      if (event.pointerId !== pointerId) return;
      event.preventDefault();
      const samples = event.getCoalescedEvents?.();
      const point = samples?.length ? samples[samples.length - 1] : event;
      item.x = clamp(itemStartX + (point.clientX - startX) / rect.width * 600, 28, 272);
      item.y = clamp(itemStartY + (point.clientY - startY) / rect.height * 320, 28, 292);
      stamp.setAttribute("transform", "translate(" + item.x + " " + item.y + ")");
      mirror?.setAttribute("transform", "translate(" + (600 - item.x) + " " + item.y + ")");
    };
    const stop = event => {
      if (event.pointerId !== pointerId) return;
      try { stamp.releasePointerCapture?.(pointerId); } catch {}
      window.removeEventListener("pointermove", update);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
    window.addEventListener("pointermove", update, { passive: false });
    window.addEventListener("pointerup", stop, { once: true });
    window.addEventListener("pointercancel", stop, { once: true });
  }));
}

function renderSymmetryLab() {
  const t = state.tool;
  if (!t.mode) t.mode = "stamps";
  const filled = new Set(t.cells || []);
  setChallenge(loc(ml("Bina sebelah kiri, cermin membina sebelah kanan", "在左边摆放，镜面在右边同步形成", "Build on the left; the mirror forms the right")), loc(ml("Kedua-dua bentuk sentiasa sama jarak dari paksi merah.", "两个图形到红色对称轴的距离始终相同。", "Both shapes always stay the same distance from the red axis.")));
  if (t.mode === "grid") {
    const cells = [];
    for (let row = 0; row < 8; row++) for (let col = 0; col < 10; col++) {
      const sourceCol = col < 5 ? col : 9 - col;
      const isFilled = filled.has(row + "," + sourceCol);
      const classes = ["mirror-cell", col < 5 ? "left" : "right"];
      if (isFilled) classes.push(col < 5 ? "filled" : "mirrored");
      cells.push("<button type=\"button\" class=\"" + classes.join(" ") + "\" data-cell=\"" + row + "," + sourceCol + "\" " + (col >= 5 ? "tabindex=\"-1\" aria-hidden=\"true\"" : "") + "></button>");
    }
    els.stage.innerHTML = "<div class=\"symmetry-shell\"><div class=\"symmetry-board-wrap\"><div class=\"symmetry-axis-label\">↕ " + loc(ml("Paksi simetri", "对称轴", "Axis of symmetry")) + "</div><div class=\"symmetry-board\">" + cells.join("") + "</div></div><div class=\"symmetry-legend\"><div class=\"legend-chip\">🟩 " + loc(ml("Corak asal", "原来图案", "Original pattern")) + "</div><div class=\"legend-chip\">🟪 " + loc(ml("Imej cermin", "镜像图案", "Mirror image")) + "</div>" + metric(loc(ml("Pasangan petak", "成对格子", "Cell pairs")), filled.size) + "</div></div>";
  } else {
    const stamps = (t.stamps || []).map(item => symmetryStampMarkup(item) + symmetryStampMarkup(item, true)).join("");
    els.stage.innerHTML = "<div class=\"symmetry-canvas-wrap\"><div class=\"symmetry-axis-label\">↕ " + loc(ml("Paksi simetri", "对称轴", "Axis of symmetry")) + "</div><svg id=\"symmetryCanvas\" class=\"symmetry-canvas draggable-board\" viewBox=\"0 0 600 320\"><rect class=\"symmetry-half left-half\" x=\"0\" y=\"0\" width=\"300\" height=\"320\"/><rect class=\"symmetry-half right-half\" x=\"300\" y=\"0\" width=\"300\" height=\"320\"/><line class=\"symmetry-axis-line\" x1=\"300\" y1=\"0\" x2=\"300\" y2=\"320\"/>" + stamps + "</svg><div class=\"symmetry-distance-note\">↔ " + loc(ml("Jarak kiri = jarak kanan", "左边距离 = 右边距离", "Left distance = right distance")) + "</div></div>";
  }
  els.controls.innerHTML = "<div class=\"choice-row\"><button type=\"button\" class=\"choice-chip" + (t.mode === "stamps" ? " active" : "") + "\" data-symmetry-mode=\"stamps\">★ " + loc(ml("Bentuk boleh seret", "可拖动图形", "Draggable shapes")) + "</button><button type=\"button\" class=\"choice-chip" + (t.mode === "grid" ? " active" : "") + "\" data-symmetry-mode=\"grid\">▦ " + loc(ml("Petak cermin", "方格镜像", "Mirror grid")) + "</button></div>" +
    (t.mode === "stamps" ? "<div class=\"choice-row symmetry-palette\">" + SYMMETRY_STAMPS.map(item => "<button type=\"button\" class=\"choice-chip" + (t.stamp === item.id ? " active" : "") + "\" data-stamp-type=\"" + item.id + "\">" + item.icon + " " + loc(item.label) + "</button>").join("") + "</div>" : "") +
    "<div class=\"board-actions\"><button id=\"clearSymmetry\" class=\"secondary-button compact\" type=\"button\">↻ " + tr("clear") + "</button>" + randomButton() + "</div>";
  setSummary(t.mode === "stamps" ? loc(ml("Klik ruang kiri untuk menambah bentuk; seret bentuk hijau untuk melihat pasangan bergerak.", "点击左边加入图形；拖动绿色图形，观察紫色镜像同步移动。", "Click the left side to add a shape; drag a green shape and watch its purple mirror move.")) : loc(ml("Setiap petak di kiri mempunyai pasangan pada jarak yang sama di kanan.", "左边每个格子都在右边相同距离处有对应格子。", "Every cell on the left has a matching cell the same distance to the right.")));
  document.querySelectorAll("[data-symmetry-mode]").forEach(button => button.addEventListener("click", () => { t.mode = button.dataset.symmetryMode; renderTool(); }));
  document.querySelectorAll("[data-stamp-type]").forEach(button => button.addEventListener("click", () => { t.stamp = button.dataset.stampType; renderTool(); }));
  if (t.mode === "grid") document.querySelectorAll(".mirror-cell.left").forEach(button => button.addEventListener("click", () => {
    const key = button.dataset.cell;
    t.cells = filled.has(key) ? t.cells.filter(item => item !== key) : t.cells.concat(key);
    renderTool();
  }));
  else {
    const board = document.querySelector("#symmetryCanvas");
    board.addEventListener("click", event => {
      if (event.target.closest?.("[data-stamp-id]")) return;
      const rect = board.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width * 600;
      const y = (event.clientY - rect.top) / rect.height * 320;
      if (x >= 300) return;
      t.stamps.push({ id: Date.now(), type: t.stamp || "star", x: clamp(x, 28, 272), y: clamp(y, 28, 292) });
      renderTool();
    });
    bindSymmetryStampDrag();
  }
  document.querySelector("#clearSymmetry").addEventListener("click", () => { if (t.mode === "grid") t.cells = []; else t.stamps = []; renderTool(); });
  document.querySelector("#randomExample").addEventListener("click", randomizeCurrent);
}

function renderPatternLab() {
  const t = state.tool;
  const tokens = [];
  for (let repeat = 0; repeat < t.repeats; repeat++) {
    t.seed.forEach(id => {
      const token = PATTERN_TOKENS.find(item => item.id === id);
      tokens.push("<span class=\"pattern-token\" style=\"--token-color:" + token.color + "\">" + token.icon + "</span>");
    });
    if (repeat < t.repeats - 1) tokens.push("<span class=\"pattern-divider\"></span>");
  }
  setChallenge(loc(ml("Bina unit corak yang berulang", "建立重复的规律单位", "Build a repeating pattern unit")), loc(ml("Garis memisahkan setiap ulangan unit.", "分隔线标示每次重复。", "Dividers mark each repeat of the unit.")));
  els.stage.innerHTML = "<div class=\"stage-stack\"><div class=\"pattern-strip\">" + tokens.join("") + "</div><div class=\"metric-row\">" + metric(loc(ml("Panjang unit", "单位长度", "Unit length")), t.seed.length) + metric(loc(ml("Ulangan", "重复次数", "Repeats")), t.repeats) + metric(loc(ml("Jumlah bentuk", "图形总数", "Total shapes")), t.seed.length * t.repeats) + "</div></div>";
  els.controls.innerHTML = "<div class=\"choice-row\">" + PATTERN_TOKENS.map(token => "<button type=\"button\" class=\"choice-chip\" data-add-token=\"" + token.id + "\" style=\"background:" + token.color + "\">" + token.icon + "</button>").join("") + "<button type=\"button\" id=\"removeToken\" class=\"choice-chip\">−</button></div><div class=\"range-grid\" style=\"margin-top:10px\">" + rangeControl("patternRepeats", loc(ml("Bilangan ulangan", "重复次数", "Number of repeats")), 1, 6, 1, t.repeats) + "</div><div class=\"board-actions\">" + randomButton() + "</div>";
  setSummary(loc(ml("Unit corak", "规律单位", "Pattern unit")) + ": <strong>" + t.seed.map(id => PATTERN_TOKENS.find(item => item.id === id).icon).join(" ") + "</strong>");
  document.querySelectorAll("[data-add-token]").forEach(button => button.addEventListener("click", () => { if (t.seed.length < 5) t.seed.push(button.dataset.addToken); renderTool(); }));
  document.querySelector("#removeToken").addEventListener("click", () => { if (t.seed.length > 1) t.seed.pop(); renderTool(); });
  document.querySelector("#patternRepeats").addEventListener("input", event => { t.repeats = Number(event.target.value); renderTool(); });
  document.querySelector("#randomExample").addEventListener("click", randomizeCurrent);
}

function angleType(angle) {
  if (angle === 0) return loc(ml("Sudut sifar", "零角", "Zero angle"));
  if (angle === 90) return loc(ml("Sudut tegak", "直角", "Right angle"));
  if (angle < 90) return loc(ml("Sudut tirus", "锐角", "Acute angle"));
  if (angle < 180) return loc(ml("Sudut cakah", "钝角", "Obtuse angle"));
  return loc(ml("Sudut lurus", "平角", "Straight angle"));
}

function protractorSvg(angle, target, innerOnly = false) {
  const cx = 250, cy = 225, radius = 175;
  const ticks = [];
  for (let degree = 0; degree <= 180; degree += 5) {
    const rad = degree * Math.PI / 180;
    const outer = [cx + Math.cos(rad) * radius, cy - Math.sin(rad) * radius];
    const length = degree % 10 === 0 ? 15 : 8;
    const inner = [cx + Math.cos(rad) * (radius - length), cy - Math.sin(rad) * (radius - length)];
    ticks.push("<line class=\"protractor-tick\" x1=\"" + outer[0].toFixed(1) + "\" y1=\"" + outer[1].toFixed(1) + "\" x2=\"" + inner[0].toFixed(1) + "\" y2=\"" + inner[1].toFixed(1) + "\"/>");
    if (degree % 20 === 0) {
      const label = [cx + Math.cos(rad) * (radius - 30), cy - Math.sin(rad) * (radius - 30)];
      ticks.push("<text x=\"" + label[0].toFixed(1) + "\" y=\"" + (label[1] + 5).toFixed(1) + "\" text-anchor=\"middle\" font-size=\"12\">" + degree + "</text>");
    }
  }
  const pointFor = value => {
    const rad = value * Math.PI / 180;
    return [cx + Math.cos(rad) * 155, cy - Math.sin(rad) * 155];
  };
  const endpoint = pointFor(angle);
  const targetPoint = target == null ? null : pointFor(target);
  const arcRadius = 62;
  const arcEnd = [cx + Math.cos(angle * Math.PI / 180) * arcRadius, cy - Math.sin(angle * Math.PI / 180) * arcRadius];
  const labelAngle = Math.max(8, Math.min(172, angle / 2));
  const labelPoint = [cx + Math.cos(labelAngle * Math.PI / 180) * 88, cy - Math.sin(labelAngle * Math.PI / 180) * 88];
  const dragText = loc(ml("SERET", "拖我", "DRAG"));
  const dragX = clamp(endpoint[0] - 27, 6, 440);
  const dragY = clamp(endpoint[1] - 42, 6, 218);
  const content =
    "<path class=\"protractor-arc\" d=\"M75 225 A175 175 0 0 0 425 225 L250 225 Z\"/>" +
    ticks.join("") +
    "<path d=\"M312 225 A62 62 0 0 0 " + arcEnd[0].toFixed(1) + " " + arcEnd[1].toFixed(1) + "\" fill=\"none\" stroke=\"#ffbd3f\" stroke-width=\"9\" stroke-linecap=\"round\" opacity=\".8\"/>" +
    "<line class=\"ray-base\" x1=\"250\" y1=\"225\" x2=\"430\" y2=\"225\"/>" +
    (targetPoint ? "<line class=\"target-ray\" x1=\"250\" y1=\"225\" x2=\"" + targetPoint[0].toFixed(1) + "\" y2=\"" + targetPoint[1].toFixed(1) + "\"/>" : "") +
    "<line id=\"movingRay\" class=\"ray-move\" x1=\"250\" y1=\"225\" x2=\"" + endpoint[0].toFixed(1) + "\" y2=\"" + endpoint[1].toFixed(1) + "\"/>" +
    "<text class=\"angle-value-label\" x=\"" + labelPoint[0].toFixed(1) + "\" y=\"" + labelPoint[1].toFixed(1) + "\" text-anchor=\"middle\">" + angle + "°</text>" +
    "<g class=\"drag-label\" transform=\"translate(" + dragX.toFixed(1) + " " + dragY.toFixed(1) + ")\"><rect width=\"54\" height=\"25\" rx=\"9\"/><text x=\"27\" y=\"17\" text-anchor=\"middle\">" + dragText + "</text></g>" +
    "<circle id=\"angleHandle\" class=\"point-handle angle-handle\" cx=\"" + endpoint[0].toFixed(1) + "\" cy=\"" + endpoint[1].toFixed(1) + "\" r=\"13\" tabindex=\"0\" role=\"slider\" aria-valuemin=\"0\" aria-valuemax=\"180\" aria-valuenow=\"" + angle + "\"/>" +
    "<circle cx=\"250\" cy=\"225\" r=\"7\" fill=\"#3f2b14\"/>";
  return innerOnly ? content : "<svg id=\"angleBoard\" class=\"geometry-svg draggable-board\" viewBox=\"0 0 500 260\">" + content + "</svg>";
}

function bindAngleDrag() {
  const board = document.querySelector("#angleBoard");
  if (!board) return;
  const beginDrag = startEvent => {
    startEvent.preventDefault();
    const rect = board.getBoundingClientRect();
    const pointerId = startEvent.pointerId;
    const isConstruction = state.grade === 6;
    try { board.setPointerCapture?.(pointerId); } catch {}
    const redraw = () => {
      board.innerHTML = protractorSvg(state.tool.angle, isConstruction ? state.tool.target : null, true);
      const range = document.querySelector("#angleRange");
      if (range) range.value = state.tool.angle;
      const output = range?.closest(".range-control")?.querySelector("output");
      if (output) output.textContent = state.tool.angle + "°";
      const metrics = document.querySelectorAll(".stage-stack > .metric-row .metric strong");
      const valueMetric = metrics[isConstruction ? 1 : 0];
      if (valueMetric) valueMetric.textContent = state.tool.angle + "°";
      const typeMetric = metrics[metrics.length - 1];
      if (typeMetric) typeMetric.textContent = angleType(state.tool.angle);
      if (!isConstruction) document.querySelector(".challenge-sub").textContent = angleType(state.tool.angle);
      const difference = isConstruction ? Math.abs(state.tool.angle - state.tool.target) : 0;
      setSummary(isConstruction
        ? difference === 0
          ? "✓ " + loc(ml("Jejari anda tepat pada sudut sasaran.", "你的射线正好落在目标角度。", "Your ray is exactly on the target angle."))
          : loc(ml("Perbezaan daripada sasaran", "与目标相差", "Difference from target")) + ": <strong>" + difference + "°</strong>"
        : "<strong>" + state.tool.angle + "°</strong> · " + angleType(state.tool.angle), difference === 0 && isConstruction ? "success" : "neutral");
    };
    const update = event => {
      if (event.pointerId !== pointerId) return;
      event.preventDefault();
      const samples = event.getCoalescedEvents?.();
      const point = samples?.length ? samples[samples.length - 1] : event;
      const x = (point.clientX - rect.left) / rect.width * 500;
      const y = (point.clientY - rect.top) / rect.height * 260;
      let value = Math.atan2(225 - y, x - 250) * 180 / Math.PI;
      value = Math.round(clamp(value, 0, 180));
      if (value !== state.tool.angle) {
        state.tool.angle = value;
        redraw();
      }
    };
    const end = event => {
      if (event.pointerId !== pointerId) return;
      try { board.releasePointerCapture?.(pointerId); } catch {}
      window.removeEventListener("pointermove", update);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
    window.addEventListener("pointermove", update, { passive: false });
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };
  board.addEventListener("pointerdown", event => {
    if (!event.target.closest?.("#angleHandle")) return;
    beginDrag(event);
  });
  board.addEventListener("keydown", event => {
    if (!event.target.closest?.("#angleHandle")) return;
    if (!["ArrowLeft","ArrowDown","ArrowRight","ArrowUp"].includes(event.key)) return;
    event.preventDefault();
    const change = event.key === "ArrowLeft" || event.key === "ArrowDown" ? -1 : 1;
    state.tool.angle = clamp(state.tool.angle + change, 0, 180);
    renderTool();
    document.querySelector("#angleHandle")?.focus();
  });
}

function renderAngleLab() {
  const t = state.tool;
  const isConstruction = state.grade === 6;
  const difference = isConstruction ? Math.abs(t.angle - t.target) : 0;
  const title = isConstruction
    ? loc(ml("Bina sudut sasaran: ", "构造目标角：", "Construct target angle: ")) + t.target + "°"
    : loc(ml("Seret jejari untuk mengukur sudut", "拖动射线测量角度", "Drag the ray to measure an angle"));
  setChallenge(title, isConstruction
    ? loc(ml("Garis putus-putus menunjukkan sasaran; jejari hijau ialah binaan anda.", "虚线是目标；绿色射线是你的构造。", "The dashed line is the target; the green ray is your construction."))
    : angleType(t.angle));
  els.stage.innerHTML = "<div class=\"stage-stack\">" + protractorSvg(t.angle, isConstruction ? t.target : null) +
    "<div class=\"metric-row\">" +
    (isConstruction ? metric(tr("target"), t.target + "°") : "") +
    metric(isConstruction ? tr("actual") : tr("angle"), t.angle + "°", true) +
    metric(loc(ml("Jenis", "类型", "Type")), angleType(t.angle)) +
    "</div></div>";
  const presets = isConstruction ? [50, 90, 108] : [30, 45, 90, 120, 150];
  els.controls.innerHTML = "<div class=\"choice-row\">" + presets.map(value => "<button type=\"button\" class=\"choice-chip" + ((isConstruction ? t.target : t.angle) === value ? " active" : "") + "\" data-angle-preset=\"" + value + "\">" + value + "°</button>").join("") + "</div><div class=\"range-grid\" style=\"margin-top:10px\">" + rangeControl("angleRange", isConstruction ? tr("actual") : tr("angle"), 0, 180, 1, t.angle, "°") + "</div><div class=\"board-actions\"><button type=\"button\" class=\"secondary-button compact\" id=\"angleMinus1\">−1°</button><button type=\"button\" class=\"primary-button compact\" id=\"anglePlus1\">+1°</button>" + randomButton() + "</div>";
  if (isConstruction) {
    setSummary(difference === 0
      ? "✓ " + loc(ml("Jejari anda tepat pada sudut sasaran.", "你的射线正好落在目标角度。", "Your ray is exactly on the target angle."))
      : loc(ml("Perbezaan daripada sasaran", "与目标相差", "Difference from target")) + ": <strong>" + difference + "°</strong>", difference === 0 ? "success" : "neutral");
  } else {
    setSummary("<strong>" + t.angle + "°</strong> · " + angleType(t.angle));
  }
  bindAngleDrag();
  document.querySelector("#angleRange").addEventListener("input", event => { t.angle = Number(event.target.value); renderTool(); });
  document.querySelector("#angleMinus1").addEventListener("click", () => { t.angle = clamp(t.angle - 1, 0, 180); renderTool(); });
  document.querySelector("#anglePlus1").addEventListener("click", () => { t.angle = clamp(t.angle + 1, 0, 180); renderTool(); });
  document.querySelectorAll("[data-angle-preset]").forEach(button => button.addEventListener("click", () => {
    const value = Number(button.dataset.anglePreset);
    if (isConstruction) { t.target = value; if (t.angle === value) t.angle = Math.max(0, value - 24); }
    else t.angle = value;
    renderTool();
  }));
  document.querySelector("#randomExample").addEventListener("click", randomizeCurrent);
}

function lineCoordinates(angle, length = 260, cx = 320, cy = 150) {
  const rad = angle * Math.PI / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  const horizontalLimit = Math.abs(cos) < .001 ? Infinity : Math.min((cx - 12) / Math.abs(cos), (640 - 12 - cx) / Math.abs(cos));
  const verticalLimit = Math.abs(sin) < .001 ? Infinity : Math.min((cy - 12) / Math.abs(sin), (300 - 12 - cy) / Math.abs(sin));
  const safeLength = Math.min(length, horizontalLimit, verticalLimit);
  const dx = cos * safeLength;
  const dy = sin * safeLength;
  return [cx - dx, cy + dy, cx + dx, cy - dy];
}

function lineRelationship(a, b) {
  const signed = ((a - b + 90) % 180 + 180) % 180 - 90;
  const difference = Math.abs(signed);
  if (difference <= 2) return { type: "parallel", angle: 0, signed, label: ml("Garisan selari", "平行线", "Parallel lines") };
  if (Math.abs(difference - 90) <= 2) return { type: "perpendicular", angle: 90, signed, label: ml("Garisan serenjang", "垂直线", "Perpendicular lines") };
  return { type: "intersect", angle: Math.round(difference), signed, label: ml("Garisan bersilang", "相交线", "Intersecting lines") };
}

function pointOnLineAngle(angle, radius, cx = 320, cy = 150) {
  const rad = angle * Math.PI / 180;
  return [cx + Math.cos(rad) * radius, cy - Math.sin(rad) * radius];
}

function lineDiagram(t) {
  const a = lineCoordinates(t.angleA);
  const aHandle = lineCoordinates(t.angleA, 100);
  const relation = lineRelationship(t.angleA, t.angleB);
  const bRad = t.angleB * Math.PI / 180;
  const bOffset = relation.type === "parallel" ? 58 : 0;
  const bCx = 320 - Math.sin(bRad) * bOffset;
  const bCy = 150 + Math.cos(bRad) * bOffset;
  const b = lineCoordinates(t.angleB, 260, bCx, bCy);
  const bHandle = lineCoordinates(t.angleB, 100, bCx, bCy);
  const arcStartAngle = t.angleB;
  const arcEndAngle = t.angleB + relation.signed;
  const arcStart = pointOnLineAngle(arcStartAngle, 45);
  const arcEnd = pointOnLineAngle(arcEndAngle, 45);
  const arcLabel = pointOnLineAngle(arcStartAngle + relation.signed / 2, 72);
  const sweep = relation.signed >= 0 ? 0 : 1;
  const angleMark = relation.type === "parallel"
    ? ""
    : "<path id=\"lineAngleArc\" data-start-angle=\"" + arcStartAngle + "\" data-end-angle=\"" + arcEndAngle + "\" d=\"M" + arcStart[0].toFixed(1) + " " + arcStart[1].toFixed(1) + " A45 45 0 0 " + sweep + " " + arcEnd[0].toFixed(1) + " " + arcEnd[1].toFixed(1) + "\" fill=\"none\" stroke=\"#ffbd3f\" stroke-width=\"7\" stroke-linecap=\"round\"/><text class=\"diagram-label accent angle-between-label\" x=\"" + arcLabel[0].toFixed(1) + "\" y=\"" + arcLabel[1].toFixed(1) + "\" text-anchor=\"middle\">" + relation.angle + "°</text>";
  const markup = "<line x1=\"" + a[0] + "\" y1=\"" + a[1] + "\" x2=\"" + a[2] + "\" y2=\"" + a[3] + "\" stroke=\"#0d806b\" stroke-width=\"8\" stroke-linecap=\"round\"/><line x1=\"" + b[0] + "\" y1=\"" + b[1] + "\" x2=\"" + b[2] + "\" y2=\"" + b[3] + "\" stroke=\"#8062c6\" stroke-width=\"8\" stroke-linecap=\"round\"/>" + angleMark + "<text class=\"diagram-label accent\" x=\"" + (aHandle[2] + 17).toFixed(1) + "\" y=\"" + (aHandle[3] - 17).toFixed(1) + "\">A · " + t.angleA + "°</text><text class=\"diagram-label\" x=\"" + (bHandle[2] + 17).toFixed(1) + "\" y=\"" + (bHandle[3] - 17).toFixed(1) + "\">B · " + t.angleB + "°</text><circle class=\"line-drag-handle handle-a\" data-line-handle=\"A\" cx=\"" + aHandle[2] + "\" cy=\"" + aHandle[3] + "\" r=\"14\"/><circle class=\"line-drag-handle handle-b\" data-line-handle=\"B\" cx=\"" + bHandle[2] + "\" cy=\"" + bHandle[3] + "\" r=\"14\"/>" + (relation.type === "parallel" ? "" : "<circle cx=\"320\" cy=\"150\" r=\"8\" fill=\"#ffbd3f\" stroke=\"#6d4a1e\" stroke-width=\"3\"/>");
  return { markup, relation };
}

function bindLineDrag() {
  const board = document.querySelector("#lineBoard");
  if (!board) return;
  board.addEventListener("pointerdown", startEvent => {
      const handle = startEvent.target.closest?.("[data-line-handle]");
      if (!handle) return;
      startEvent.preventDefault();
      const key = handle.dataset.lineHandle === "A" ? "angleA" : "angleB";
      const rect = board.getBoundingClientRect();
      const pointerId = startEvent.pointerId;
      try { board.setPointerCapture?.(pointerId); } catch {}
      const redraw = () => {
        const { markup, relation } = lineDiagram(state.tool);
        board.innerHTML = markup;
        [["lineA","angleA"],["lineB","angleB"]].forEach(([id, property]) => {
          const range = document.getElementById(id);
          if (range) range.value = state.tool[property];
          const output = range?.closest(".range-control")?.querySelector("output");
          if (output) output.textContent = state.tool[property] + "°";
        });
        const metrics = document.querySelectorAll(".stage-stack > .metric-row .metric strong");
        if (metrics[0]) metrics[0].textContent = state.tool.angleA + "°";
        if (metrics[1]) metrics[1].textContent = state.tool.angleB + "°";
        if (metrics[2]) metrics[2].textContent = relation.angle + "°";
        setChallenge(loc(relation.label), loc(ml("Seret pemegang A atau B pada rajah, atau gunakan butang pantas.", "直接拖动图中的 A 或 B 控制点，也可使用快捷按钮。", "Drag handle A or B on the diagram, or use a quick button.")));
        setSummary(loc(relation.label) + (relation.type === "intersect" ? " · " + loc(ml("Sudut terkecil", "较小夹角", "Smaller angle")) + " " + relation.angle + "°" : ""), relation.type === "perpendicular" || relation.type === "parallel" ? "success" : "neutral");
      };
      const update = event => {
        if (event.pointerId !== pointerId) return;
        event.preventDefault();
        const samples = event.getCoalescedEvents?.();
        const point = samples?.length ? samples[samples.length - 1] : event;
        const x = (point.clientX - rect.left) / rect.width * 640;
        const y = (point.clientY - rect.top) / rect.height * 300;
        let angle = Math.atan2(150 - y, x - 320) * 180 / Math.PI;
        if (angle < 0) angle += 180;
        if (angle >= 180) angle -= 180;
        const value = Math.round(angle);
        if (state.tool[key] !== value) {
          state.tool[key] = value;
          redraw();
        }
      };
      const stop = event => {
        if (event.pointerId !== pointerId) return;
        try { board.releasePointerCapture?.(pointerId); } catch {}
        window.removeEventListener("pointermove", update);
        window.removeEventListener("pointerup", stop);
        window.removeEventListener("pointercancel", stop);
      };
      window.addEventListener("pointermove", update, { passive: false });
      window.addEventListener("pointerup", stop);
      window.addEventListener("pointercancel", stop);
  });
}

function renderLineLab() {
  const t = state.tool;
  const { markup, relation } = lineDiagram(t);
  setChallenge(loc(relation.label), loc(ml("Seret pemegang A atau B pada rajah, atau gunakan butang pantas.", "直接拖动图中的 A 或 B 控制点，也可使用快捷按钮。", "Drag handle A or B on the diagram, or use a quick button.")));
  els.stage.innerHTML = "<div class=\"stage-stack\"><svg id=\"lineBoard\" class=\"line-lab-svg draggable-board\" viewBox=\"0 0 640 300\">" + markup + "</svg><div class=\"metric-row\">" + metric("A", t.angleA + "°") + metric("B", t.angleB + "°") + metric(loc(ml("Sudut terkecil", "较小夹角", "Smaller angle")), relation.angle + "°", true) + "</div></div>";
  els.controls.innerHTML = "<div class=\"range-grid\">" + rangeControl("lineA", loc(ml("Putaran garisan A", "直线 A 旋转", "Line A rotation")), 0, 179, 1, t.angleA, "°") + rangeControl("lineB", loc(ml("Putaran garisan B", "直线 B 旋转", "Line B rotation")), 0, 179, 1, t.angleB, "°") + "</div><div class=\"board-actions\"><button id=\"snapParallel\" class=\"secondary-button compact\" type=\"button\">∥ " + loc(ml("Selari", "平行", "Parallel")) + "</button><button id=\"snapPerpendicular\" class=\"secondary-button compact\" type=\"button\">⊥ " + loc(ml("Serenjang", "垂直", "Perpendicular")) + "</button>" + randomButton() + "</div>";
  setSummary(loc(relation.label) + (relation.type === "intersect" ? " · " + loc(ml("Sudut terkecil", "较小夹角", "Smaller angle")) + " " + relation.angle + "°" : ""), relation.type === "perpendicular" || relation.type === "parallel" ? "success" : "neutral");
  document.querySelector("#lineA").addEventListener("input", event => { t.angleA = Number(event.target.value); renderTool(); });
  document.querySelector("#lineB").addEventListener("input", event => { t.angleB = Number(event.target.value); renderTool(); });
  bindLineDrag();
  document.querySelector("#snapParallel").addEventListener("click", () => { t.angleB = t.angleA; renderTool(); });
  document.querySelector("#snapPerpendicular").addEventListener("click", () => { t.angleB = (t.angleA + 90) % 180; renderTool(); });
  document.querySelector("#randomExample").addEventListener("click", randomizeCurrent);
}

function renderPerimeterLab() {
  const t = state.tool;
  const isTriangle = t.shape === "triangle";
  if (isTriangle) t.c = clamp(t.c, Math.max(3, Math.abs(t.a - t.b) + 1), Math.min(12, t.a + t.b - 1));
  const perimeter = isTriangle ? t.a + t.b + t.c : t.shape === "square" ? t.width * 4 : (t.width + t.height) * 2;
  let drawing;
  if (isTriangle) {
    const apexX = (t.a * t.a + t.c * t.c - t.b * t.b) / (2 * t.c);
    const apexY = Math.sqrt(Math.max(.01, t.a * t.a - apexX * apexX));
    const raw = [[0,0],[t.c,0],[apexX,apexY]];
    const minX = Math.min(...raw.map(point => point[0])), maxX = Math.max(...raw.map(point => point[0]));
    const minY = 0, maxY = apexY;
    const scale = Math.min(330 / Math.max(1, maxX - minX), 215 / Math.max(1, maxY - minY));
    const centreX = (minX + maxX) / 2;
    const points = raw.map(point => [250 + (point[0] - centreX) * scale, 270 - point[1] * scale]);
    const centroid = points.reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0,0]).map(value => value / 3);
    const edgeLabel = (from, to, text) => {
      const middle = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
      const dx = middle[0] - centroid[0], dy = middle[1] - centroid[1];
      const length = Math.hypot(dx, dy) || 1;
      return "<text class=\"diagram-label triangle-side-label\" x=\"" + (middle[0] + dx / length * 25).toFixed(1) + "\" y=\"" + (middle[1] + dy / length * 25 + 5).toFixed(1) + "\" text-anchor=\"middle\">" + text + "</text>";
    };
    drawing = "<polygon id=\"perimeterTriangle\" class=\"shape-fill perimeter-triangle\" data-a=\"" + t.a + "\" data-b=\"" + t.b + "\" data-c=\"" + t.c + "\" points=\"" + pointsAttr(points) + "\"/>" + edgeLabel(points[2], points[0], "A = " + t.a + " cm") + edgeLabel(points[1], points[2], "B = " + t.b + " cm") + edgeLabel(points[0], points[1], "C = " + t.c + " cm");
  } else {
    const w = t.shape === "square" ? 100 + t.width * 10 : 120 + t.width * 20;
    const h = t.shape === "square" ? w : 70 + t.height * 18;
    const x = (500 - w) / 2, y = (300 - h) / 2;
    const sideHeight = t.shape === "square" ? t.width : t.height;
    drawing = "<rect class=\"shape-fill\" x=\"" + x + "\" y=\"" + y + "\" width=\"" + w + "\" height=\"" + h + "\"/><text class=\"diagram-label\" x=\"250\" y=\"" + (y - 14) + "\" text-anchor=\"middle\">" + t.width + " cm</text><text class=\"diagram-label\" x=\"250\" y=\"" + (y + h + 27) + "\" text-anchor=\"middle\">" + t.width + " cm</text><text class=\"diagram-label\" x=\"" + (x - 32) + "\" y=\"" + (y + h / 2 + 5) + "\" text-anchor=\"middle\">" + sideHeight + " cm</text><text class=\"diagram-label\" x=\"" + (x + w + 32) + "\" y=\"" + (y + h / 2 + 5) + "\" text-anchor=\"middle\">" + sideHeight + " cm</text>";
  }
  setChallenge(tr("perimeter") + ": " + perimeter + " cm", loc(ml("Jejaki semua sisi di sekeliling bentuk.", "沿着图形外围依次追踪所有边。", "Trace every side around the shape.")));
  els.stage.innerHTML = "<div class=\"measure-board perimeter-board\"><svg class=\"geometry-svg perimeter-svg\" viewBox=\"0 0 500 320\">" + drawing + "</svg><div class=\"formula-card\"><span>" + tr("perimeter") + "</span><strong>" + perimeter + " cm</strong><span>" + (isTriangle ? t.a + " + " + t.b + " + " + t.c : t.shape === "square" ? "4 × " + t.width : "2 × (" + t.width + " + " + t.height + ")") + "</span></div></div>";
  const shapeButtons = [["rectangle", ml("Segi empat tepat", "长方形", "Rectangle")], ["square", ml("Segi empat sama", "正方形", "Square")], ["triangle", ml("Segi tiga", "三角形", "Triangle")]];
  const ranges = isTriangle
    ? rangeControl("perA", "A", Math.max(3, Math.abs(t.b - t.c) + 1), Math.min(12, t.b + t.c - 1), 1, t.a, " cm") + rangeControl("perB", "B", Math.max(3, Math.abs(t.a - t.c) + 1), Math.min(12, t.a + t.c - 1), 1, t.b, " cm") + rangeControl("perC", "C", Math.max(3, Math.abs(t.a - t.b) + 1), Math.min(12, t.a + t.b - 1), 1, t.c, " cm")
    : rangeControl("perWidth", tr("width"), 2, 12, 1, t.width, " cm") + (t.shape === "square" ? "" : rangeControl("perHeight", tr("height"), 2, 10, 1, t.height, " cm"));
  els.controls.innerHTML = "<div class=\"choice-row\">" + shapeButtons.map(item => "<button class=\"choice-chip" + (t.shape === item[0] ? " active" : "") + "\" data-per-shape=\"" + item[0] + "\" type=\"button\">" + loc(item[1]) + "</button>").join("") + "</div><div class=\"range-grid\" style=\"margin-top:10px\">" + ranges + "</div><div class=\"board-actions\">" + randomButton() + "</div>";
  setSummary(loc(ml("Jumlah semua panjang sisi", "所有边长的总和", "Sum of all side lengths")) + " = <strong>" + perimeter + " cm</strong>");
  document.querySelectorAll("[data-per-shape]").forEach(button => button.addEventListener("click", () => { t.shape = button.dataset.perShape; renderTool(); }));
  [["#perA","a"],["#perB","b"],["#perC","c"],["#perWidth","width"],["#perHeight","height"]].forEach(item => {
    const input = document.querySelector(item[0]); if (input) input.addEventListener("input", event => { t[item[1]] = Number(event.target.value); renderTool(); });
  });
  document.querySelector("#randomExample").addEventListener("click", randomizeCurrent);
}

function renderAreaLab() {
  const t = state.tool;
  const isTriangle = t.shape === "triangle";
  const isSquare = t.shape === "square";
  if (isSquare) t.height = t.width;
  const area = isTriangle ? t.width * t.height / 2 : t.width * t.height;
  const unit = Math.min(25, 330 / t.width, 210 / t.height);
  const w = t.width * unit;
  const h = t.height * unit;
  const x = (420 - w) / 2;
  const y = (260 - h) / 2;
  const shape = isTriangle
    ? "<polygon points=\"" + x + "," + (y + h) + " " + (x + w) + "," + (y + h) + " " + x + "," + y + "\" fill=\"rgba(19,139,117,.55)\" stroke=\"#075f4e\" stroke-width=\"4\"/><line x1=\"" + x + "\" y1=\"" + y + "\" x2=\"" + x + "\" y2=\"" + (y + h) + "\" stroke=\"#ba3f45\" stroke-width=\"4\"/><text class=\"diagram-label accent\" x=\"" + (x + w/2) + "\" y=\"" + (y + h - 10) + "\" text-anchor=\"middle\">" + loc(ml("tapak", "底", "base")) + " = " + t.width + " cm</text><text class=\"diagram-label accent\" x=\"" + (x + 10) + "\" y=\"" + (y + h/2) + "\" transform=\"rotate(-90 " + (x + 10) + " " + (y + h/2) + ")\" text-anchor=\"middle\">" + loc(ml("tinggi", "高", "height")) + " = " + t.height + " cm</text>"
    : "<rect x=\"" + x + "\" y=\"" + y + "\" width=\"" + w + "\" height=\"" + h + "\" fill=\"rgba(255,189,63,.58)\" stroke=\"#6d4a1e\" stroke-width=\"4\"/><text class=\"diagram-label\" x=\"" + (x + w/2) + "\" y=\"" + (y + h - 10) + "\" text-anchor=\"middle\">" + tr("width") + " = " + t.width + " cm</text><text class=\"diagram-label\" x=\"" + (x + 12) + "\" y=\"" + (y + h/2) + "\" transform=\"rotate(-90 " + (x + 12) + " " + (y + h/2) + ")\" text-anchor=\"middle\">" + tr("height") + " = " + t.height + " cm</text>";
  setChallenge(tr("area") + ": " + area + " cm²", isTriangle ? loc(ml("Segi tiga ialah separuh daripada segi empat dengan tapak dan tinggi yang sama.", "三角形是相同底和高的长方形的一半。", "A triangle is half a rectangle with the same base and height.")) : loc(ml("Kira petak satu sentimeter persegi.", "数一数每个一平方厘米的方格。", "Count the one-square-centimetre cells.")));
  els.stage.innerHTML = "<div class=\"measure-board\"><svg class=\"geometry-svg area-board-svg\" viewBox=\"0 0 420 260\"><defs><pattern id=\"gridPattern\" width=\"" + unit.toFixed(2) + "\" height=\"" + unit.toFixed(2) + "\" patternUnits=\"userSpaceOnUse\"><path d=\"M" + unit.toFixed(2) + " 0H0V" + unit.toFixed(2) + "\" fill=\"none\" stroke=\"#b9d5d0\" stroke-width=\"1\"/></pattern></defs><rect x=\"0\" y=\"0\" width=\"420\" height=\"260\" fill=\"url(#gridPattern)\"/>" + shape + "</svg><div class=\"formula-card\"><span>" + tr("area") + "</span><strong>" + area + " cm²</strong><span>" + (isTriangle ? "½ × " : "") + t.width + " × " + t.height + "</span></div></div>";
  els.controls.innerHTML = "<div class=\"choice-row\"><button class=\"choice-chip" + (t.shape === "rectangle" ? " active" : "") + "\" data-area-shape=\"rectangle\" type=\"button\">▭ " + loc(ml("Segi empat tepat", "长方形", "Rectangle")) + "</button><button class=\"choice-chip" + (t.shape === "square" ? " active" : "") + "\" data-area-shape=\"square\" type=\"button\">□ " + loc(ml("Segi empat sama", "正方形", "Square")) + "</button><button class=\"choice-chip" + (t.shape === "triangle" ? " active" : "") + "\" data-area-shape=\"triangle\" type=\"button\">△ " + loc(ml("Segi tiga", "三角形", "Triangle")) + "</button></div><div class=\"range-grid\" style=\"margin-top:10px\">" + rangeControl("areaWidth", isTriangle ? loc(ml("Tapak", "底", "Base")) : tr("width"), 2, 12, 1, t.width, " cm") + (isSquare ? "" : rangeControl("areaHeight", tr("height"), 2, 8, 1, t.height, " cm")) + "</div><div class=\"board-actions\">" + randomButton() + "</div>";
  setSummary((isTriangle ? "½ × " : "") + t.width + " × " + t.height + " = <strong>" + area + " cm²</strong>");
  document.querySelectorAll("[data-area-shape]").forEach(button => button.addEventListener("click", () => {
    t.shape = button.dataset.areaShape;
    if (t.shape === "square") t.height = t.width;
    else t.height = clamp(t.height, 2, 8);
    renderTool();
  }));
  document.querySelector("#areaWidth").addEventListener("input", event => { t.width = Number(event.target.value); if (t.shape === "square") t.height = t.width; renderTool(); });
  const heightInput = document.querySelector("#areaHeight"); if (heightInput) heightInput.addEventListener("input", event => { t.height = Number(event.target.value); renderTool(); });
  document.querySelector("#randomExample").addEventListener("click", randomizeCurrent);
}

function isoCube(x, y, z, size, ox, oy, offsetY = 0) {
  const sx = ox + (x - y) * size;
  const sy = oy + (x + y) * size * .5 - z * size + offsetY;
  const top = [[sx,sy],[sx+size,sy+size*.5],[sx,sy+size],[sx-size,sy+size*.5]];
  const left = [[sx-size,sy+size*.5],[sx,sy+size],[sx,sy+size*2],[sx-size,sy+size*1.5]];
  const right = [[sx+size,sy+size*.5],[sx,sy+size],[sx,sy+size*2],[sx+size,sy+size*1.5]];
  return "<g class=\"iso-cube\" data-cube-x=\"" + x + "\" data-cube-y=\"" + y + "\" data-cube-z=\"" + z + "\"><polygon class=\"iso-left\" points=\"" + pointsAttr(left) + "\"/><polygon class=\"iso-right\" points=\"" + pointsAttr(right) + "\"/><polygon class=\"iso-top\" points=\"" + pointsAttr(top) + "\"/></g>";
}

function renderVolumeLab() {
  const t = state.tool;
  const size = 30;
  const originX = 320;
  const originY = 115;
  const cubePositions = [];
  for (let z = 0; z < t.height; z++) for (let y = 0; y < t.width; y++) for (let x = 0; x < t.length; x++) cubePositions.push({ x, y, z });
  cubePositions.sort((a, b) => a.z - b.z || (a.x + a.y) - (b.x + b.y) || a.x - b.x);
  const cubes = cubePositions.map(cube => isoCube(cube.x, cube.y, cube.z, size, originX, originY));
  const volume = t.length * t.width * t.height;
  const project = (x, y, z) => [originX + (x - y) * size, originY + (x + y) * size * .5 - z * size];
  const lowerCorner = (x, y) => {
    const point = project(x, y, 0);
    return [point[0], point[1] + size * 2];
  };
  const lengthStartBase = lowerCorner(0, t.width);
  const sharedBase = lowerCorner(t.length, t.width);
  const widthEndBase = lowerCorner(t.length, 0);
  const lengthStart = [lengthStartBase[0] - 10, lengthStartBase[1] + 14];
  const lengthEnd = [sharedBase[0] - 10, sharedBase[1] + 14];
  const widthStart = [sharedBase[0] + 10, sharedBase[1] + 14];
  const widthEnd = [widthEndBase[0] + 10, widthEndBase[1] + 14];
  const heightTopBase = project(t.length, 0, t.height - 1);
  const heightBottomBase = project(t.length, 0, 0);
  const heightTop = [heightTopBase[0] + 34, heightTopBase[1]];
  const heightBottom = [heightBottomBase[0] + 34, heightBottomBase[1] + size];
  const guide = (kind, start, end, label, labelDx, labelDy) => {
    const middle = [(start[0] + end[0]) / 2 + labelDx, (start[1] + end[1]) / 2 + labelDy];
    return "<g class=\"block-dimension " + kind + "\"><line x1=\"" + start[0] + "\" y1=\"" + start[1] + "\" x2=\"" + end[0] + "\" y2=\"" + end[1] + "\"/><circle cx=\"" + start[0] + "\" cy=\"" + start[1] + "\" r=\"4\"/><circle cx=\"" + end[0] + "\" cy=\"" + end[1] + "\" r=\"4\"/><text x=\"" + middle[0] + "\" y=\"" + middle[1] + "\" text-anchor=\"middle\">" + label + "</text></g>";
  };
  const lengthLabel = loc(ml("Panjang · sebaris ", "长 · 每排 ", "Length · row of ")) + t.length + loc(ml(" blok", " 个", " blocks"));
  const widthLabel = loc(ml("Lebar · selajur ", "宽 · 每列 ", "Width · column of ")) + t.width + loc(ml(" blok", " 个", " blocks"));
  const heightLabel = loc(ml("Tinggi · ", "高 · ", "Height · ")) + t.height + loc(ml(" lapisan", " 层", " layers"));
  const dimensionOverlay = guide("length-guide", lengthStart, lengthEnd, lengthLabel, 0, 25) + guide("width-guide", widthStart, widthEnd, widthLabel, 0, 25) + guide("height-guide", heightTop, heightBottom, heightLabel, 64, 5);
  setChallenge(volume + " " + loc(ml("blok unit", "个单位积木", "unit blocks")) + " = " + volume + " cm³", loc(ml("Setiap blok ialah kubus 1 cm × 1 cm × 1 cm.", "每个积木都是 1 cm × 1 cm × 1 cm 的正方体。", "Each block is a 1 cm × 1 cm × 1 cm cube.")));
  els.stage.innerHTML = "<div class=\"stage-stack\"><div class=\"unit-blocks\"><svg class=\"iso-svg volume-svg\" viewBox=\"0 0 640 350\">" + cubes.join("") + dimensionOverlay + "</svg></div><div class=\"metric-row\">" + metric(loc(ml("Sebaris (panjang)", "每排（长）", "One row (length)")), t.length + loc(ml(" blok", " 个", " blocks"))) + metric(loc(ml("Selajur (lebar)", "每列（宽）", "One column (width)")), t.width + loc(ml(" blok", " 个", " blocks"))) + metric(loc(ml("Lapisan (tinggi)", "层数（高）", "Layers (height)")), t.height + loc(ml(" lapisan", " 层", " layers"))) + "</div></div>";
  els.controls.innerHTML = "<div class=\"range-grid\">" + rangeControl("volLength", tr("length"), 1, 6, 1, t.length) + rangeControl("volWidth", tr("width"), 1, 5, 1, t.width) + rangeControl("volHeight", tr("height"), 1, 4, 1, t.height) + "</div><div class=\"board-actions\">" + randomButton() + "</div>";
  setSummary(t.length + " " + loc(ml("sebaris", "每排", "per row")) + " × " + t.width + " " + loc(ml("selajur", "每列", "per column")) + " × " + t.height + " " + loc(ml("lapisan", "层", "layers")) + " = <strong>" + volume + " cm³</strong>");
  [["#volLength","length"],["#volWidth","width"],["#volHeight","height"]].forEach(item => document.querySelector(item[0]).addEventListener("input", event => { t[item[1]] = Number(event.target.value); renderTool(); }));
  document.querySelector("#randomExample").addEventListener("click", randomizeCurrent);
}

function renderPolygonLab() {
  const t = state.tool;
  const points = polygonPoints(250, 150, 115, t.sides, -90 + t.rotation);
  const sum = (t.sides - 2) * 180;
  const each = sum / t.sides;
  const labelPoints = polygonPoints(250, 150, 82, t.sides, -90 + t.rotation);
  const angleLabels = labelPoints.map((point, index) => "<text class=\"diagram-label accent\" style=\"font-size:" + (t.sides > 6 ? 10 : 12) + "px\" x=\"" + point[0].toFixed(1) + "\" y=\"" + (point[1] + 4).toFixed(1) + "\" text-anchor=\"middle\">" + each.toFixed(each % 1 ? 1 : 0) + "°</text>").join("");
  const triangles = state.grade === 6 ? points.map((point, index) => {
    const next = points[(index + 1) % points.length];
    return "<polygon points=\"250,150 " + point.join(",") + " " + next.join(",") + "\" fill=\"" + (index % 2 ? "rgba(128,98,198,.16)" : "rgba(19,139,117,.16)") + "\" stroke=\"#9e8a68\" stroke-width=\"1\"/>";
  }).join("") : "";
  setChallenge(t.sides + " " + tr("sides") + " · " + each.toFixed(each % 1 ? 1 : 0) + "°", state.grade === 6 ? loc(ml("Garis dari satu titik membahagikan poligon kepada segi tiga.", "从一个顶点画出的线把多边形分成三角形。", "Lines from one vertex divide the polygon into triangles.")) : loc(ml("Semua sudut pedalaman poligon sekata adalah sama.", "正多边形的所有内角都相等。", "All interior angles of a regular polygon are equal.")));
  els.stage.innerHTML = "<div class=\"polygon-wrap\"><svg class=\"geometry-svg\" viewBox=\"0 0 500 300\">" + triangles + "<polygon class=\"shape-fill\" points=\"" + pointsAttr(points) + "\" fill-opacity=\".62\"/>" + angleLabels + "<circle cx=\"250\" cy=\"150\" r=\"5\" fill=\"#ba3f45\"/><text class=\"diagram-label\" x=\"250\" y=\"170\" text-anchor=\"middle\">" + t.sides + " " + tr("sides") + "</text></svg><div class=\"metric-row\">" + metric(tr("sides"), t.sides) + metric(loc(ml("Jumlah sudut", "内角和", "Angle sum")), sum + "°") + metric(loc(ml("Setiap sudut", "每个内角", "Each angle")), each.toFixed(each % 1 ? 1 : 0) + "°", true) + "</div></div>";
  els.controls.innerHTML = "<div class=\"range-grid\">" + rangeControl("polySides", tr("sides"), 3, 8, 1, t.sides) + rangeControl("polyRotation", loc(ml("Putaran", "旋转", "Rotation")), -30, 30, 1, t.rotation, "°") + "</div><div class=\"board-actions\">" + randomButton() + "</div>";
  setSummary("(" + t.sides + " − 2) × 180° = <strong>" + sum + "°</strong> · " + sum + "° ÷ " + t.sides + " = <strong>" + each.toFixed(each % 1 ? 1 : 0) + "°</strong>");
  document.querySelector("#polySides").addEventListener("input", event => { t.sides = Number(event.target.value); renderTool(); });
  document.querySelector("#polyRotation").addEventListener("input", event => { t.rotation = Number(event.target.value); renderTool(); });
  document.querySelector("#randomExample").addEventListener("click", randomizeCurrent);
}

function renderCompositeArea() {
  const t = state.tool;
  t.cutWidth = Math.min(t.cutWidth, t.width - 1);
  t.cutHeight = Math.min(t.cutHeight, t.height - 1);
  const scale = Math.min(28, 260 / t.width, 210 / t.height);
  const w = t.width * scale, h = t.height * scale, cw = t.cutWidth * scale, ch = t.cutHeight * scale;
  const x = (440 - w) / 2, y = (280 - h) / 2;
  const path = "M" + x + " " + y + " H" + (x + w - cw) + " V" + (y + ch) + " H" + (x + w) + " V" + (y + h) + " H" + x + " Z";
  const area = t.width * t.height - t.cutWidth * t.cutHeight;
  const perimeter = 2 * (t.width + t.height);
  setChallenge(tr("area") + ": " + area + " cm²", loc(ml("Luas besar ditolak luas bahagian yang dipotong.", "大长方形面积减去切除部分面积。", "Subtract the cut-out area from the large rectangle.")));
  els.stage.innerHTML = "<div class=\"measure-board\"><svg class=\"geometry-svg\" viewBox=\"0 0 440 280\"><path class=\"shape-fill\" d=\"" + path + "\"/><rect x=\"" + (x + w - cw) + "\" y=\"" + y + "\" width=\"" + cw + "\" height=\"" + ch + "\" fill=\"rgba(186,63,69,.12)\" stroke=\"#ba3f45\" stroke-width=\"3\" stroke-dasharray=\"7 5\"/><text class=\"diagram-label\" x=\"220\" y=\"" + (y + h + 24) + "\" text-anchor=\"middle\">" + tr("width") + " = " + t.width + " cm</text><text class=\"diagram-label\" x=\"" + (x - 25) + "\" y=\"" + (y + h/2) + "\" text-anchor=\"middle\" transform=\"rotate(-90 " + (x - 25) + " " + (y + h/2) + ")\">" + tr("height") + " = " + t.height + " cm</text><text class=\"diagram-label accent\" x=\"" + (x + w - cw/2) + "\" y=\"" + (y + Math.max(18, ch/2)) + "\" text-anchor=\"middle\">" + loc(ml("potong", "切除", "cut")) + " " + t.cutWidth + " × " + t.cutHeight + " cm</text></svg><div class=\"formula-card\"><span>" + tr("area") + "</span><strong>" + area + " cm²</strong><span>(" + t.width + " × " + t.height + ") − (" + t.cutWidth + " × " + t.cutHeight + ")</span><span>" + tr("perimeter") + ": <b>" + perimeter + " cm</b></span></div></div>";
  els.controls.innerHTML = "<div class=\"range-grid\">" + rangeControl("compWidth", loc(ml("Lebar besar", "大图形宽", "Outer width")), 6, 12, 1, t.width, " cm") + rangeControl("compHeight", loc(ml("Tinggi besar", "大图形高", "Outer height")), 4, 9, 1, t.height, " cm") + rangeControl("cutWidth", loc(ml("Lebar potongan", "切除宽", "Cut-out width")), 1, Math.max(1,t.width-1), 1, t.cutWidth, " cm") + rangeControl("cutHeight", loc(ml("Tinggi potongan", "切除高", "Cut-out height")), 1, Math.max(1,t.height-1), 1, t.cutHeight, " cm") + "</div><div class=\"board-actions\">" + randomButton() + "</div>";
  setSummary(t.width + " × " + t.height + " − " + t.cutWidth + " × " + t.cutHeight + " = <strong>" + area + " cm²</strong>");
  [["#compWidth","width"],["#compHeight","height"],["#cutWidth","cutWidth"],["#cutHeight","cutHeight"]].forEach(item => document.querySelector(item[0]).addEventListener("input", event => { t[item[1]] = Number(event.target.value); renderTool(); }));
  document.querySelector("#randomExample").addEventListener("click", randomizeCurrent);
}

function isoPrism(width, depth, height, ox, oy, scale, offsetY, cssClass) {
  const p = (x,y,z) => [ox + (x-y)*scale, oy + (x+y)*scale*.5-z*scale + offsetY];
  const a=p(0,0,height), b=p(width,0,height), c=p(width,depth,height), d=p(0,depth,height);
  const a0=p(0,0,0), b0=p(width,0,0), c0=p(width,depth,0), d0=p(0,depth,0);
  return "<g class=\"" + cssClass + "\"><polygon class=\"iso-left\" points=\"" + pointsAttr([d,c,c0,d0]) + "\"/><polygon class=\"iso-right\" points=\"" + pointsAttr([b,c,c0,b0]) + "\"/><polygon class=\"iso-top\" points=\"" + pointsAttr([a,b,c,d]) + "\"/></g>";
}

function renderCompositeVolume() {
  const t = state.tool;
  t.l2 = Math.min(t.l2, t.l1);
  t.w2 = Math.min(t.w2, t.w1);
  const v1 = t.l1 * t.w1 * t.h1;
  const v2 = t.l2 * t.w2 * t.h2;
  const total = v1 + v2;
  const base = isoPrism(t.l1, t.w1, t.h1, 300, 200, 25, 0, "base-prism");
  const topOffsetX = (t.l1 - t.l2) / 2;
  const topOffsetY = (t.w1 - t.w2) / 2;
  const topOrigin = [300 + (topOffsetX-topOffsetY)*25, 200 + (topOffsetX+topOffsetY)*12.5 - t.h1*25];
  const top = isoPrism(t.l2, t.w2, t.h2, topOrigin[0], topOrigin[1], 25, -t.explode, "top-prism");
  const topLabelX = topOrigin[0] + (t.l2 - t.w2) * 12.5;
  const topLabelY = Math.max(18, topOrigin[1] - t.h2 * 25 - t.explode - 12);
  const solidLabels = "<text class=\"diagram-label accent\" x=\"300\" y=\"292\" text-anchor=\"middle\">A · " + t.l1 + " × " + t.w1 + " × " + t.h1 + " cm</text><text class=\"diagram-label accent\" x=\"" + topLabelX + "\" y=\"" + topLabelY + "\" text-anchor=\"middle\">B · " + t.l2 + " × " + t.w2 + " × " + t.h2 + " cm</text>";
  setChallenge(tr("volume") + ": " + total + " cm³", loc(ml("Jumlahkan isi padu dua kuboid.", "把两个长方体的体积相加。", "Add the volumes of the two cuboids.")));
  els.stage.innerHTML = "<div class=\"stage-stack\"><svg class=\"iso-svg\" viewBox=\"0 0 620 330\">" + base + top + solidLabels + "</svg><div class=\"metric-row\">" + metric("A", v1 + " cm³") + metric("B", v2 + " cm³") + metric(loc(ml("Jumlah", "总和", "Total")), total + " cm³", true) + "</div></div>";
  els.controls.innerHTML = "<div class=\"range-grid\">" + rangeControl("cvL1", "A · " + tr("length"), 2, 6, 1, t.l1) + rangeControl("cvW1", "A · " + tr("width"), 2, 5, 1, t.w1) + rangeControl("cvH1", "A · " + tr("height"), 1, 4, 1, t.h1) + rangeControl("cvL2", "B · " + tr("length"), 1, t.l1, 1, t.l2) + rangeControl("cvW2", "B · " + tr("width"), 1, t.w1, 1, t.w2) + rangeControl("cvH2", "B · " + tr("height"), 1, 4, 1, t.h2) + rangeControl("cvExplode", loc(ml("Pisahkan bentuk", "分开立体", "Separate solids")), 0, 100, 5, t.explode, "%") + "</div><div class=\"board-actions\">" + randomButton() + "</div>";
  setSummary(v1 + " + " + v2 + " = <strong>" + total + " cm³</strong>");
  [["#cvL1","l1"],["#cvW1","w1"],["#cvH1","h1"],["#cvL2","l2"],["#cvW2","w2"],["#cvH2","h2"],["#cvExplode","explode"]].forEach(item => document.querySelector(item[0]).addEventListener("input", event => { t[item[1]] = Number(event.target.value); renderTool(); }));
  document.querySelector("#randomExample").addEventListener("click", randomizeCurrent);
}

function circleDiagram(t) {
  const cx = 260, cy = 155;
  const angle = t.draw * Math.PI / 180;
  const px = cx + Math.cos(angle) * t.radius;
  const py = cy + Math.sin(angle) * t.radius;
  const hingeHeight = Math.max(58, Math.min(88, t.radius * .78));
  const hingeX = (cx + px) / 2 + Math.sin(angle) * hingeHeight;
  const hingeY = (cy + py) / 2 - Math.cos(angle) * hingeHeight;
  const radiusLabelX = (cx + px) / 2;
  const radiusLabelY = (cy + py) / 2 - 9;
  const pencilLabelX = px + (Math.cos(angle) >= 0 ? 24 : -24);
  const pencilLabelY = py + (Math.sin(angle) >= 0 ? 30 : -18);
  const circumference = 2 * Math.PI * t.radius;
  const centreText = loc(ml("Pusat O · jarum kekal", "圆心 O · 针尖固定", "Centre O · fixed needle"));
  const pencilText = loc(ml("Mata pensel · seret", "铅笔尖 · 拖动", "Pencil tip · drag"));
  const markup =
    "<circle class=\"circle-guide\" cx=\"" + cx + "\" cy=\"" + cy + "\" r=\"" + t.radius + "\"/>" +
    "<circle class=\"circle-main\" cx=\"" + cx + "\" cy=\"" + cy + "\" r=\"" + t.radius + "\" stroke-dasharray=\"" + circumference.toFixed(1) + "\" stroke-dashoffset=\"" + (circumference * (1 - t.draw / 360)).toFixed(1) + "\"/>" +
    "<line class=\"radius-line\" x1=\"" + cx + "\" y1=\"" + cy + "\" x2=\"" + px.toFixed(1) + "\" y2=\"" + py.toFixed(1) + "\"/>" +
    (t.diameter ? "<line class=\"diameter-line\" x1=\"" + (cx - t.radius) + "\" y1=\"" + cy + "\" x2=\"" + (cx + t.radius) + "\" y2=\"" + cy + "\"/><text class=\"diagram-label diameter-label\" x=\"" + cx + "\" y=\"" + (cy + 42) + "\" text-anchor=\"middle\">d = " + (t.radius * 2) + " mm</text>" : "") +
    "<line class=\"compass-arm\" x1=\"" + hingeX.toFixed(1) + "\" y1=\"" + hingeY.toFixed(1) + "\" x2=\"" + cx + "\" y2=\"" + cy + "\"/><line class=\"compass-pencil\" x1=\"" + hingeX.toFixed(1) + "\" y1=\"" + hingeY.toFixed(1) + "\" x2=\"" + px.toFixed(1) + "\" y2=\"" + py.toFixed(1) + "\"/>" +
    "<circle class=\"compass-hinge\" cx=\"" + hingeX.toFixed(1) + "\" cy=\"" + hingeY.toFixed(1) + "\" r=\"8\"/><circle class=\"compass-needle\" cx=\"" + cx + "\" cy=\"" + cy + "\" r=\"7\"/><circle id=\"circleDragHandle\" class=\"circle-drag-handle\" cx=\"" + px.toFixed(1) + "\" cy=\"" + py.toFixed(1) + "\" r=\"12\"/>" +
    "<text class=\"diagram-label accent radius-label\" x=\"" + radiusLabelX.toFixed(1) + "\" y=\"" + radiusLabelY.toFixed(1) + "\" text-anchor=\"middle\">r = " + t.radius + " mm</text><text class=\"diagram-label centre-label\" x=\"" + (cx - 62) + "\" y=\"" + (cy - 14) + "\" text-anchor=\"middle\">" + centreText + "</text><text class=\"diagram-label pencil-label\" x=\"" + pencilLabelX.toFixed(1) + "\" y=\"" + pencilLabelY.toFixed(1) + "\" text-anchor=\"middle\">" + pencilText + "</text>";
  return { markup, circumference };
}

function bindCircleDrag() {
  const board = document.querySelector("#circleBoard");
  if (!board) return;
  board.addEventListener("pointerdown", startEvent => {
    if (!startEvent.target.closest?.("#circleDragHandle")) return;
    startEvent.preventDefault();
    const rect = board.getBoundingClientRect();
    const pointerId = startEvent.pointerId;
    try { board.setPointerCapture?.(pointerId); } catch {}
    const redraw = () => {
      board.innerHTML = circleDiagram(state.tool).markup;
      const range = document.getElementById("circleDraw");
      if (range) range.value = state.tool.draw;
      const output = range?.closest(".range-control")?.querySelector("output");
      if (output) output.textContent = state.tool.draw + "°";
      const tracedMetric = document.querySelector(".circle-wrap .metric-row .metric:last-child strong");
      if (tracedMetric) tracedMetric.textContent = state.tool.draw + "° / 360°";
      setSummary("r = " + state.tool.radius + " mm · d = 2r = <strong>" + (state.tool.radius * 2) + " mm</strong> · " + loc(ml("dilukis", "已画", "traced")) + " " + state.tool.draw + "° / 360°");
    };
    const update = event => {
      if (event.pointerId !== pointerId) return;
      event.preventDefault();
      const samples = event.getCoalescedEvents?.();
      const point = samples?.length ? samples[samples.length - 1] : event;
      const x = (point.clientX - rect.left) / rect.width * 520;
      const y = (point.clientY - rect.top) / rect.height * 315;
      let angle = Math.atan2(y - 155, x - 260) * 180 / Math.PI;
      if (angle < 0) angle += 360;
      const value = Math.round(angle);
      if (state.tool.draw !== value) {
        state.tool.draw = value;
        redraw();
      }
    };
    const stop = event => {
      if (event.pointerId !== pointerId) return;
      try { board.releasePointerCapture?.(pointerId); } catch {}
      window.removeEventListener("pointermove", update);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
    window.addEventListener("pointermove", update, { passive: false });
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
  });
}

function renderCircleLab() {
  const t = state.tool;
  const { markup } = circleDiagram(t);
  setChallenge(loc(ml("Seret mata pensel merah untuk melukis bulatan", "拖动红色铅笔尖画圆", "Drag the red pencil tip to draw the circle")), loc(ml("Jarum kekal pada pusat O; jarak O ke pensel ialah jejari ", "针尖固定在圆心 O；O 到铅笔尖的距离是半径 ", "The needle stays at centre O; O to the pencil is radius ")) + t.radius + " mm.");
  els.stage.innerHTML = "<div class=\"circle-wrap\"><svg id=\"circleBoard\" class=\"geometry-svg draggable-board\" viewBox=\"0 0 520 315\">" + markup + "</svg>" +
    "<div class=\"circle-legend\"><span><i class=\"legend-dot needle\"></i>" + loc(ml("Jarum tetap di O", "针尖固定在 O", "Needle fixed at O")) + "</span><span><i class=\"legend-dot pencil\"></i>" + loc(ml("Pensel merah boleh diseret", "红色铅笔尖可以拖动", "Red pencil tip can be dragged")) + "</span><span><i class=\"legend-line traced\"></i>" + loc(ml("Garisan hijau telah dilukis", "绿色线是已经画出的圆周", "Green line is the traced circle")) + "</span></div>" +
    "<div class=\"metric-row\">" + metric(tr("radius") + " r", t.radius + " mm") + metric(tr("diameter") + " d", (t.radius * 2) + " mm", t.diameter) + metric(loc(ml("Sudah dilukis", "已经画了", "Traced")), t.draw + "° / 360°") + "</div></div>";
  els.controls.innerHTML = "<div class=\"range-grid\">" + rangeControl("circleRadius", tr("radius") + " r", 35, 115, 1, t.radius, " mm") + rangeControl("circleDraw", loc(ml("Pensel mengelilingi O", "铅笔尖绕 O 转动", "Pencil around O")), 0, 360, 1, t.draw, "°") + "</div><div class=\"board-actions\"><button id=\"toggleDiameter\" class=\"secondary-button compact\" type=\"button\">↔ " + (t.diameter ? loc(ml("Sembunyikan diameter", "隐藏直径", "Hide diameter")) : loc(ml("Tunjukkan diameter", "显示直径", "Show diameter"))) + "</button>" + randomButton() + "</div>";
  setSummary("r = " + t.radius + " mm · d = 2r = <strong>" + (t.radius * 2) + " mm</strong> · " + loc(ml("dilukis", "已画", "traced")) + " " + t.draw + "° / 360°");
  document.querySelector("#circleRadius").addEventListener("input", event => { t.radius = Number(event.target.value); renderTool(); });
  document.querySelector("#circleDraw").addEventListener("input", event => { t.draw = Number(event.target.value); renderTool(); });
  bindCircleDrag();
  document.querySelector("#toggleDiameter").addEventListener("click", () => { t.diameter = !t.diameter; renderTool(); });
  document.querySelector("#randomExample").addEventListener("click", randomizeCurrent);
}

function teacherConfiguration() {
  const t = state.tool;
  const field = (key, label, min, max, step = 1) => ({ key, label, min, max, step, value: t[key] });
  switch (state.activity) {
    case "shapeExplorer": {
      const shape = SHAPES.find(item => item.id === t.shape);
      return shape && shape.kind === "3d"
        ? [field("viewX", loc(ml("Sudut pandangan atas-bawah", "上下视角", "Vertical view")), -82, 82), field("viewY", loc(ml("Sudut pandangan kiri-kanan", "左右视角", "Horizontal view")), -180, 180)]
        : [field("rotation", loc(ml("Putaran", "旋转", "Rotation")), -30, 30)];
    }
    case "netBuilder": return [field("step", loc(ml("Langkah lipatan", "折合步骤", "Folding step")), 0, NET_SOLIDS.find(item => item.id === t.shape).foldOrder.length)];
    case "shapeDrawer": return [{ key: "corners", label: tr("corners"), min: 3, max: 8, step: 1, value: t.corners || 4 }];
    case "prismLab": return [field("sides", tr("sides"), 3, 8), field("depth", loc(ml("Kedalaman", "深度", "Depth")), 25, 100)];
    case "symmetryLab": return [field("randomCount", loc(ml("Bilangan bentuk rawak", "随机图形数量", "Random shape count")), 1, 8)];
    case "patternLab": return [field("repeats", loc(ml("Ulangan", "重复次数", "Repeats")), 1, 6)];
    case "angleLab": return state.grade === 6 ? [field("target", tr("target"), 0, 180), field("angle", tr("actual"), 0, 180)] : [field("angle", tr("angle"), 0, 180)];
    case "lineLab": return [field("angleA", "A", 0, 179), field("angleB", "B", 0, 179)];
    case "perimeterLab": return t.shape === "triangle" ? [field("a","A",3,12),field("b","B",3,12),field("c","C",3,12)] : [field("width",tr("width"),2,12),field("height",tr("height"),2,10)];
    case "areaLab": return [field("width",tr("width"),2,12),field("height",tr("height"),2,8)];
    case "volumeLab": return [field("length",tr("length"),1,6),field("width",tr("width"),1,5),field("height",tr("height"),1,4)];
    case "polygonLab": return [field("sides",tr("sides"),3,8),field("rotation",loc(ml("Putaran", "旋转", "Rotation")),-30,30)];
    case "compositeArea": return [field("width",loc(ml("Lebar besar", "大图形宽", "Outer width")),6,12),field("height",loc(ml("Tinggi besar", "大图形高", "Outer height")),4,9),field("cutWidth",loc(ml("Lebar potongan", "切除宽", "Cut-out width")),1,Math.max(1,t.width-1)),field("cutHeight",loc(ml("Tinggi potongan", "切除高", "Cut-out height")),1,Math.max(1,t.height-1))];
    case "compositeVolume": return [field("l1","A · "+tr("length"),2,6),field("w1","A · "+tr("width"),2,5),field("h1","A · "+tr("height"),1,4),field("l2","B · "+tr("length"),1,6),field("w2","B · "+tr("width"),1,5),field("h2","B · "+tr("height"),1,4)];
    case "circleLab": return [field("radius",tr("radius"),35,115),field("draw",loc(ml("Putaran jangka", "圆规旋转", "Compass turn")),0,360,1)];
    default: return [];
  }
}

function openTeacherDialog() {
  const fields = teacherConfiguration();
  els.teacherFields.innerHTML = fields.map((item, index) => "<div><label for=\"teacherField" + index + "\">" + item.label + "</label><input id=\"teacherField" + index + "\" data-key=\"" + item.key + "\" type=\"number\" min=\"" + item.min + "\" max=\"" + item.max + "\" step=\"" + item.step + "\" value=\"" + item.value + "\"></div>").join("");
  els.teacherError.textContent = "";
  els.dialog.showModal();
}

function applyTeacherSettings() {
  const fields = teacherConfiguration();
  let valid = true;
  fields.forEach((item, index) => {
    const input = document.querySelector("#teacherField" + index);
    const value = Number(input.value);
    if (!Number.isFinite(value) || value < item.min || value > item.max) valid = false;
    else state.tool[item.key] = value;
  });
  if (!valid) {
    els.teacherError.textContent = loc(ml("Semak nilai yang dimasukkan.", "请检查输入的数值。", "Check the values entered."));
    return;
  }
  if (state.activity === "shapeDrawer") {
    const n = state.tool.corners;
    state.tool.points = polygonPoints(200, 150, 105, n);
    state.tool.closed = true;
    state.tool.solid = false;
    state.tool.viewX = -18;
    state.tool.viewY = 30;
  }
  if (state.activity === "symmetryLab") randomizeCurrent();
  if (state.activity === "compositeArea") {
    state.tool.cutWidth = Math.min(state.tool.cutWidth, state.tool.width - 1);
    state.tool.cutHeight = Math.min(state.tool.cutHeight, state.tool.height - 1);
  }
  if (state.activity === "compositeVolume") {
    state.tool.l2 = Math.min(state.tool.l2, state.tool.l1);
    state.tool.w2 = Math.min(state.tool.w2, state.tool.w1);
  }
  els.dialog.close();
  beep("done");
  renderTool();
}

document.querySelectorAll("[data-mode]").forEach(button => button.addEventListener("click", () => {
  if (button.disabled) return;
  state.mode = button.dataset.mode;
  refreshNavigation();
  renderTool();
}));

els.grade.addEventListener("change", () => {
  if (configuredGrade) return;
  state.grade = Number(els.grade.value);
  refreshNavigation();
  renderTool();
});

els.activity.addEventListener("change", () => chooseActivity(els.activity.value));
els.reset.addEventListener("click", () => { state.tool = factories[state.activity](); renderTool(); });
els.teacher.addEventListener("click", openTeacherDialog);
els.useTeacher.addEventListener("click", applyTeacherSettings);

document.querySelectorAll("[data-lang]").forEach(button => button.addEventListener("click", () => {
  state.lang = button.dataset.lang;
  applyStaticLanguage();
  refreshNavigation({ keepActivity: true, keepTool: true });
  renderTool();
}));

els.sound.addEventListener("click", () => {
  state.sound = !state.sound;
  els.sound.setAttribute("aria-pressed", String(state.sound));
  els.sound.querySelector("span:first-child").textContent = state.sound ? "🔊" : "🔇";
  applyStaticLanguage();
  if (state.sound) beep("done");
});

document.addEventListener("pointerdown", event => {
  const range = event.target.closest?.("input[type='range']");
  if (!range || !range.id) return;
  const id = range.id;
  const min = Number(range.min);
  const max = Number(range.max);
  const step = Number(range.step) || 1;
  const rect = range.getBoundingClientRect();
  const setFromPointer = pointerEvent => {
    pointerEvent.preventDefault();
    const current = document.getElementById(id);
    if (!current) return;
    const ratio = clamp((pointerEvent.clientX - rect.left) / rect.width, 0, 1);
    const raw = min + ratio * (max - min);
    const value = Math.round((raw - min) / step) * step + min;
    current.value = String(clamp(Number(value.toFixed(6)), min, max));
    current.dispatchEvent(new Event("input", { bubbles: true }));
  };
  setFromPointer(event);
  const move = pointerEvent => setFromPointer(pointerEvent);
  const stop = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
    window.removeEventListener("pointercancel", stop);
  };
  window.addEventListener("pointermove", move, { passive: false });
  window.addEventListener("pointerup", stop, { once: true });
  window.addEventListener("pointercancel", stop, { once: true });
}, { passive: false });

document.addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button || button === els.sound || button.id === "randomExample") return;
  beep("tap");
});

if (configuredGrade) document.body.classList.add("fixed-grade");
applyStaticLanguage();
refreshNavigation();
renderTool();
