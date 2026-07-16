document.addEventListener("DOMContentLoaded", () => {
  // 1. Đã sửa tên biến từ 'courses' thành 'courseData'
  const courseData = {
    "pre-starters": {
      level: "Foundation",
      title: "Pre-Starters",
      desc: "Chương trình làm quen tiếng Anh dành cho học viên nhỏ tuổi...",
      age: "4–6 tuổi",
      time: "60 buổi",
      output: "Nền tảng Pre-A1",
      image: "images/courses/starters.webp",
      alt: "Chương trình tiếng Anh Pre-Starters",
    },
    starters: {
      level: "Pre-A1",
      title: "Cambridge Starters",
      desc: "Giúp học viên hình thành nền tảng tiếng Anh...",
      age: "6–8 tuổi",
      time: "72 buổi",
      output: "YLE Starters",
      image: "images/courses/starters.webp",
      alt: "Chương trình Cambridge Starters",
    },
    // ... (Các mục còn lại giữ nguyên)
  };

  const tabList = document.querySelector(".roadmap-tabs");
  const tabs = Array.from(document.querySelectorAll(".tab-btn"));
  const roadmapContent = document.querySelector(".roadmap-content");
  const roadmapImage = document.querySelector(".roadmap-image");
  const roadmapInfo = document.querySelector(".roadmap-info");

  const levelElement = document.querySelector(".course-level");
  const titleElement = document.getElementById("courseTitle");
  const descriptionElement = document.getElementById("courseDesc");
  const ageElement = document.getElementById("courseAge");
  const timeElement = document.getElementById("courseTime");
  const outputElement = document.getElementById("courseOutput");
  const imageElement = document.getElementById("courseImage");

  const requiredElements = [
    tabList,
    roadmapContent,
    roadmapImage,
    roadmapInfo,
    levelElement,
    titleElement,
    descriptionElement,
    ageElement,
    timeElement,
    outputElement,
    imageElement,
  ];

  if (tabs.length === 0 || requiredElements.some((element) => !element)) {
    console.warn("Không tìm thấy đầy đủ thành phần Cambridge Roadmap.");
    return;
  }

  const imageCache = new Map();
  let activeCourse =
    document.querySelector(".tab-btn.active")?.dataset.course || "starters";
  let latestRequest = 0;

  function preloadImage(source) {
    if (imageCache.has(source)) return imageCache.get(source);
    const imagePromise = new Promise((resolve, reject) => {
      const preload = new Image();
      preload.onload = () => resolve(source);
      // 3. Xử lý fallback nếu ảnh lỗi
      preload.onerror = () => {
        console.warn(`Không tải được ảnh: ${source}`);
        resolve("images/default-course.webp"); // Ảnh mặc định nếu lỗi
      };
      preload.src = source;
    });
    imageCache.set(source, imagePromise);
    return imagePromise;
  }

  function updateCourseContent(course) {
    levelElement.textContent = course.level;
    titleElement.textContent = course.title;
    descriptionElement.textContent = course.desc;
    ageElement.textContent = course.age;
    timeElement.textContent = course.time;
    outputElement.textContent = course.output;
    imageElement.src = course.image;
    imageElement.alt = `${course.title} tại Đăng Lưu English Center`;
  }

  async function selectCourse(tab) {
    const courseKey = tab.dataset.course;
    const course = courseData[courseKey];
    if (!course) return;

    const requestId = ++latestRequest;
    tabs.forEach((t) => t.classList.toggle("active", t === tab));

    await preloadImage(course.image);
    if (requestId !== latestRequest) return;

    updateCourseContent(course);
  }

  // 2. Khởi tạo nội dung tab đầu tiên khi trang tải xong
  const initialTab =
    tabs.find((t) => t.dataset.course === activeCourse) || tabs[0];
  updateCourseContent(courseData[initialTab.dataset.course]);

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectCourse(tab));
  });
});
